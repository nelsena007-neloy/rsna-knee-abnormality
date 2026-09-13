#!/usr/bin/env python3
"""
Ensemble Lab: Rank-Averaging Pipeline & Model Diversity Calibration.
RSNA Knee Abnormality Detection Competition Winning Strategy.

AUC is an entirely rank-order metric (Wilcoxon-Mann-Whitney).
Direct probability averaging of uncalibrated models distorts optimal decision boundaries.
This module transforms each model's test predictions into fractional percentile ranks [0.0, 1.0]
per column before blending.
"""

import math
from typing import Dict, List, Any, Optional

TARGET_KEYS = [
    "ACL", "MCL", "Medial Meniscus", "Lateral Meniscus",
    "Medial OA", "Lateral OA", "PF OA", "Effusion",
    "Synovitis", "Baker's", "Contusion", "Fracture"
]


def rank_transform_column(values: List[float]) -> List[float]:
    """
    Transforms raw continuous predictions into fractional percentile ranks in [0.0, 1.0].
    Handles tied predictions by assigning average fractional ranks.
    """
    n = len(values)
    if n <= 1:
        return [0.5] * n

    # Store (value, original_index)
    indexed = sorted([(val, i) for i, val in enumerate(values)], key=lambda x: x[0])

    ranks = [0.0] * n
    i = 0
    while i < n:
        j = i
        # Group identical values (ties)
        while j < n and indexed[j][0] == indexed[i][0]:
            j += 1
        
        # Average rank for the tied block (0-indexed)
        avg_rank = (i + (j - 1)) / 2.0
        frac_rank = avg_rank / max(1.0, float(n - 1))

        for k in range(i, j):
            ranks[indexed[k][1]] = frac_rank

        i = j

    return ranks


def rank_average_ensemble(
    model_predictions: Dict[str, List[Dict[str, float]]],
    weights: Optional[Dict[str, float]] = None
) -> List[Dict[str, float]]:
    """
    Executes column-wise Rank-Averaging across multiple model checkpoints or folds.
    For each target pathology:
    1. Converts each model's test column into fractional percentile ranks [0.0, 1.0].
    2. Computes the weighted average of percentile ranks across models.
    3. Normalizes final blended scores into calibrated competition probabilities.
    """
    model_names = list(model_predictions.keys())
    if not model_names:
        return []

    num_samples = len(model_predictions[model_names[0]])
    if num_samples == 0:
        return []

    if weights is None:
        weights = {m: 1.0 for m in model_names}

    total_weight = sum(weights.get(m, 0.0) for m in model_names) or 1.0

    # Intermediate storage for ranked scores: [model_name][target] -> List of fractional ranks
    ranked_models: Dict[str, Dict[str, List[float]]] = {}
    for m in model_names:
        ranked_models[m] = {}
        for target in TARGET_KEYS:
            raw_vals = [model_predictions[m][i].get(target, 0.5) for i in range(num_samples)]
            ranked_models[m][target] = rank_transform_column(raw_vals)

    # Compute weighted rank blend per sample
    blended: List[Dict[str, float]] = []
    for i in range(num_samples):
        sample_pred: Dict[str, float] = {}
        for target in TARGET_KEYS:
            weighted_rank = 0.0
            for m in model_names:
                m_weight = weights.get(m, 0.0) / total_weight
                weighted_rank += ranked_models[m][target][i] * m_weight

            # Keep in strictly valid probability range [0.0001, 0.9999]
            sample_pred[target] = round(max(0.0001, min(0.9999, weighted_rank)), 4)
        blended.append(sample_pred)

    return blended


def blend_predictions(
    model_predictions: Dict[str, List[Dict[str, float]]],
    weights: Optional[Dict[str, float]] = None,
    method: str = "rank"
) -> List[Dict[str, float]]:
    """
    Blends predictions from multiple models using rank averaging (default) or probability averaging.
    """
    if method == "rank":
        return rank_average_ensemble(model_predictions, weights)

    # Fallback to probability averaging
    model_names = list(model_predictions.keys())
    if not model_names:
        return []

    num_samples = len(model_predictions[model_names[0]])
    if weights is None:
        weights = {m: 1.0 for m in model_names}

    total_weight = sum(weights.get(m, 0.0) for m in model_names) or 1.0
    blended: List[Dict[str, float]] = []

    for i in range(num_samples):
        sample_pred: Dict[str, float] = {}
        for target in TARGET_KEYS:
            target_score = 0.0
            for model in model_names:
                m_weight = weights.get(model, 0.0) / total_weight
                pred_val = model_predictions[model][i].get(target, 0.5)
                target_score += pred_val * m_weight

            sample_pred[target] = round(max(0.0001, min(0.9999, target_score)), 4)
        blended.append(sample_pred)

    return blended


def compute_model_correlation(
    preds_a: List[Dict[str, float]],
    preds_b: List[Dict[str, float]]
) -> float:
    """
    Calculates Pearson correlation coefficient between two model prediction vectors.
    """
    vals_a: List[float] = []
    vals_b: List[float] = []

    for i in range(min(len(preds_a), len(preds_b))):
        for target in TARGET_KEYS:
            vals_a.append(preds_a[i].get(target, 0.5))
            vals_b.append(preds_b[i].get(target, 0.5))

    n = len(vals_a)
    if n == 0:
        return 1.0

    mean_a = sum(vals_a) / n
    mean_b = sum(vals_b) / n

    numerator = sum((a - mean_a) * (b - mean_b) for a, b in zip(vals_a, vals_b))
    denom_a = math.sqrt(sum((a - mean_a) ** 2 for a in vals_a))
    denom_b = math.sqrt(sum((b - mean_b) ** 2 for b in vals_b))

    if denom_a == 0 or denom_b == 0:
        return 1.0

    return round(numerator / (denom_a * denom_b), 4)


if __name__ == "__main__":
    # Test rank averaging on two models
    m1 = [
        {"ACL": 0.90, "MCL": 0.10},
        {"ACL": 0.80, "MCL": 0.20},
        {"ACL": 0.20, "MCL": 0.70}
    ]
    m2 = [
        {"ACL": 0.99, "MCL": 0.05},
        {"ACL": 0.75, "MCL": 0.30},
        {"ACL": 0.10, "MCL": 0.95}
    ]

    rank_blended = blend_predictions({"ConvNeXt": m1, "EVA02": m2}, {"ConvNeXt": 0.6, "EVA02": 0.4}, method="rank")
    print("Rank-Averaged Predictions:")
    for idx, row in enumerate(rank_blended):
        print(f"Sample {idx}: ACL={row['ACL']}, MCL={row['MCL']}")

    corr = compute_model_correlation(m1, m2)
    print(f"Model Correlation: {corr}")
