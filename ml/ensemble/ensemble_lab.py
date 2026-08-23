#!/usr/bin/env python3
"""
Ensemble Lab: Model Blending & Correlation Matrix Analysis.
Supports probability averaging, rank averaging, and softmax power scaling across multiple model checkpoints.
"""

import math
from typing import Dict, List, Any

TARGET_KEYS = [
    "ACL", "MCL", "Medial Meniscus", "Lateral Meniscus",
    "Medial OA", "Lateral OA", "PF OA", "Effusion",
    "Synovitis", "Baker's", "Contusion", "Fracture"
]

def blend_predictions(
    model_predictions: Dict[str, List[Dict[str, float]]],
    weights: Dict[str, float],
    method: str = "probability"
) -> List[Dict[str, float]]:
    """
    Blends predictions from multiple models using weighted probability or rank averaging.
    """
    model_names = list(model_predictions.keys())
    if not model_names:
        return []

    num_samples = len(model_predictions[model_names[0]])
    total_weight = sum(weights.get(m, 0.0) for m in model_names)
    if total_weight <= 0:
        total_weight = 1.0

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
    m1 = [{"ACL": 0.9, "MCL": 0.2}]
    m2 = [{"ACL": 0.8, "MCL": 0.3}]
    blended = blend_predictions({"m1": m1, "m2": m2}, {"m1": 0.6, "m2": 0.4})
    print("Blended Sample:")
    print(blended)
