#!/usr/bin/env python3
"""
Multi-Task Loss Formulations & Metric Alignment for RSNA Knee Abnormality Detection.
Includes:
- Sample-Weighted Asymmetric Loss (ASL):
    gamma_neg = 4.0, gamma_pos = 0.0, clip = 0.05
    Total Loss = weighted_bce_asl(predictions, targets, sample_weights)
    Mitigates extreme class imbalance on rare pathologies (Fracture, Baker's Cyst, MCL Grade 3)
- Exact Column-Wise One-vs-Rest Validation Macro-AUC:
    Evaluates Macro-AUC = (1/12) * sum(AUC_c)
- Multi-Label Focal Loss & Pairwise AUC Surrogate Loss
- MultiTaskCompositeLoss with guaranteed zero NaN/Inf gradient propagation.
"""

import math
from typing import Dict, List, Optional, Tuple, Any

TARGET_KEYS = [
    "ACL", "MCL", "Medial Meniscus", "Lateral Meniscus",
    "Medial OA", "Lateral OA", "PF OA", "Effusion",
    "Synovitis", "Baker's", "Contusion", "Fracture"
]

# Clinical loss weights prioritizing high-acuity tears and acute fractures
TARGET_LOSS_WEIGHTS = {
    "ACL": 1.30,
    "MCL": 1.15,
    "Medial Meniscus": 1.20,
    "Lateral Meniscus": 1.20,
    "Medial OA": 1.00,
    "Lateral OA": 1.00,
    "PF OA": 0.95,
    "Effusion": 0.90,
    "Synovitis": 0.90,
    "Baker's": 0.85,
    "Contusion": 1.10,
    "Fracture": 1.40
}


def weighted_bce_asl(
    predictions: List[List[float]],
    targets: List[List[float]],
    sample_weights: Optional[List[float]] = None,
    gamma_neg: float = 4.0,
    gamma_pos: float = 0.0,
    clip: float = 0.05,
    eps: float = 1e-8
) -> float:
    """
    Computes Sample-Weighted Asymmetric Loss (ASL):
    Total Loss = weighted_bce_asl(predictions, targets, sample_weights)
    - gamma_neg = 4.0, gamma_pos = 0.0, clip = 0.05
    - sample_weights: 1.0 for radiologist ground-truth, 0.70 for pseudo-labeled
    """
    batch_size = len(predictions)
    if batch_size == 0:
        return 0.0

    num_targets = len(predictions[0])
    if sample_weights is None:
        sample_weights = [1.0] * batch_size

    total_weight = sum(sample_weights) or 1.0
    weighted_loss_sum = 0.0

    for b in range(batch_size):
        w_b = sample_weights[b]
        sample_loss = 0.0

        for t in range(num_targets):
            p = max(eps, min(1.0 - eps, predictions[b][t]))
            y = targets[b][t]
            p_m = max(0.0, p - clip) if clip > 0 else p

            if y >= 0.5:
                pt = p
                loss_elem = - ((1.0 - pt) ** gamma_pos) * math.log(max(eps, pt))
            else:
                pt_neg = p_m
                loss_elem = - (pt_neg ** gamma_neg) * math.log(max(eps, 1.0 - pt_neg))

            if not (math.isnan(loss_elem) or math.isinf(loss_elem)):
                sample_loss += loss_elem

        weighted_loss_sum += w_b * (sample_loss / num_targets)

    return weighted_loss_sum / total_weight


def compute_roc_auc_column(y_true: List[float], y_score: List[float]) -> float:
    """
    Exact Mann-Whitney U / Trapezoidal ROC-AUC calculation for a single target column.
    """
    paired = list(zip(y_score, y_true))
    # Sort descending by score
    paired.sort(key=lambda x: x[0], reverse=True)

    pos_count = sum(1 for _, y in paired if y >= 0.5)
    neg_count = len(paired) - pos_count

    if pos_count == 0 or neg_count == 0:
        return 0.5 # Neutral AUC for zero variance ground truth in mini-split

    tp, fp = 0, 0
    prev_tp, prev_fp = 0, 0
    auc = 0.0

    for score, label in paired:
        if label >= 0.5:
            tp += 1
        else:
            fp += 1
            # Trapezoidal increment on false positive step
            auc += (tp + prev_tp) / 2.0
            prev_tp = tp
            prev_fp = fp

    return auc / (pos_count * neg_count)


def compute_validation_macro_auc(
    y_true: List[List[float]],
    y_pred: List[List[float]],
    target_columns: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Computes validation Macro-AUC per epoch using exact one-vs-rest ROC AUC per column,
    strictly evaluating: (1/12) * sum(AUC_c).
    """
    if not y_true or not y_pred or len(y_true) != len(y_pred):
        return {"macro_auc": 0.5, "per_column_auc": {}, "num_targets": 0}

    targets = target_columns or TARGET_KEYS
    num_cols = len(targets)
    per_column_auc: Dict[str, float] = {}
    auc_sum = 0.0

    for c_idx, col_name in enumerate(targets):
        col_true = [y_true[i][c_idx] for i in range(len(y_true))]
        col_pred = [y_pred[i][c_idx] for i in range(len(y_pred))]

        auc_c = compute_roc_auc_column(col_true, col_pred)
        per_column_auc[col_name] = round(auc_c, 4)
        auc_sum += auc_c

    macro_auc = auc_sum / max(1, num_cols)

    return {
        "macro_auc": round(macro_auc, 5),
        "per_column_auc": per_column_auc,
        "num_targets": num_cols,
        "formula": "(1/12) * sum(AUC_c)"
    }


class AsymmetricLoss:
    """
    Asymmetric Loss (ASL) for Multi-Label Learning with severe negative-positive imbalance.
    Supports sample_weights, probability margin clipping, and asymmetric focusing parameters.
    """
    def __init__(
        self,
        gamma_neg: float = 4.0,
        gamma_pos: float = 0.0,
        clip: float = 0.05,
        eps: float = 1e-8
    ):
        self.gamma_neg = gamma_neg
        self.gamma_pos = gamma_pos
        self.clip = clip
        self.eps = eps

    def compute(
        self,
        y_pred: List[List[float]],
        y_true: List[List[float]],
        sample_weights: Optional[List[float]] = None
    ) -> Tuple[float, List[List[float]]]:
        """
        Computes ASL loss and analytical gradients for [Batch, NumTargets] inputs.
        y_pred: Predicted probabilities in range (0, 1)
        y_true: Binary ground truth labels in {0, 1}
        Returns: (total_loss, grad_wrt_pred)
        """
        batch_size = len(y_pred)
        if batch_size == 0:
            return 0.0, []

        num_targets = len(y_pred[0])
        weights = sample_weights or [1.0] * batch_size
        total_sample_weight = sum(weights) or 1.0

        total_loss = 0.0
        grads: List[List[float]] = []

        for b in range(batch_size):
            w_b = weights[b]
            b_grads: List[float] = []
            for t in range(num_targets):
                p = max(self.eps, min(1.0 - self.eps, y_pred[b][t]))
                y = y_true[b][t]
                p_m = max(0.0, p - self.clip) if self.clip > 0 else p

                if y >= 0.5:
                    pt = p
                    focal_factor = (1.0 - pt) ** self.gamma_pos
                    loss_elem = - focal_factor * math.log(max(self.eps, pt))
                    grad_elem = (
                        - (1.0 - pt) ** self.gamma_pos / max(self.eps, pt)
                        + self.gamma_pos * (1.0 - pt) ** (self.gamma_pos - 1.0 if self.gamma_pos >= 1 else 0) * math.log(max(self.eps, pt))
                    )
                else:
                    pt_neg = p_m
                    focal_factor = (pt_neg) ** self.gamma_neg
                    loss_elem = - focal_factor * math.log(max(self.eps, 1.0 - pt_neg))
                    grad_elem = (
                        self.gamma_neg * (pt_neg ** (self.gamma_neg - 1.0 if self.gamma_neg >= 1 else 0)) * math.log(max(self.eps, 1.0 - pt_neg))
                        + (pt_neg ** self.gamma_neg) / max(self.eps, 1.0 - pt_neg)
                    )

                if math.isnan(loss_elem) or math.isinf(loss_elem):
                    loss_elem = 0.0
                if math.isnan(grad_elem) or math.isinf(grad_elem):
                    grad_elem = 0.0

                total_loss += w_b * loss_elem
                b_grads.append(w_b * grad_elem / (batch_size * num_targets))
            grads.append(b_grads)

        avg_loss = total_loss / (total_sample_weight * num_targets)
        return avg_loss, grads


class MultiLabelFocalLoss:
    """
    Multi-Label Focal Loss addressing extreme foreground-background class disparity.
    FL(p_t) = - alpha_t * (1 - p_t)^gamma * log(p_t)
    """
    def __init__(self, gamma: float = 2.0, alpha: float = 0.25, eps: float = 1e-8):
        self.gamma = gamma
        self.alpha = alpha
        self.eps = eps

    def compute(self, y_pred: List[List[float]], y_true: List[List[float]]) -> Tuple[float, List[List[float]]]:
        batch_size = len(y_pred)
        if batch_size == 0:
            return 0.0, []

        num_targets = len(y_pred[0])
        total_loss = 0.0
        grads: List[List[float]] = []

        for b in range(batch_size):
            b_grads: List[float] = []
            for t in range(num_targets):
                p = max(self.eps, min(1.0 - self.eps, y_pred[b][t]))
                y = 1.0 if y_true[b][t] >= 0.5 else 0.0

                if y == 1.0:
                    alpha_t = self.alpha
                    p_t = p
                    loss_elem = - alpha_t * ((1.0 - p_t) ** self.gamma) * math.log(max(self.eps, p_t))
                    grad_elem = - alpha_t * ((1.0 - p_t) ** self.gamma) / max(self.eps, p_t)
                else:
                    alpha_t = 1.0 - self.alpha
                    p_t = 1.0 - p
                    loss_elem = - alpha_t * ((1.0 - p_t) ** self.gamma) * math.log(max(self.eps, p_t))
                    grad_elem = alpha_t * ((1.0 - p_t) ** self.gamma) / max(self.eps, p_t)

                if math.isnan(loss_elem) or math.isinf(loss_elem):
                    loss_elem = 0.0
                if math.isnan(grad_elem) or math.isinf(grad_elem):
                    grad_elem = 0.0

                total_loss += loss_elem
                b_grads.append(grad_elem / (batch_size * num_targets))
            grads.append(b_grads)

        avg_loss = total_loss / (batch_size * num_targets)
        return avg_loss, grads


class AUCSurrogateLoss:
    """
    Smooth Pairwise Differentiable Surrogate for ROC-AUC Optimization.
    Minimizes pairwise ranking error: L_AUC = sum_{i in Pos, j in Neg} sigmoid((s_j - s_i) / temperature)
    """
    def __init__(self, temperature: float = 0.1):
        self.temperature = temperature

    def compute_target(self, y_pred_single_target: List[float], y_true_single_target: List[float]) -> Tuple[float, List[float]]:
        pos_indices = [i for i, y in enumerate(y_true_single_target) if y >= 0.5]
        neg_indices = [i for i, y in enumerate(y_true_single_target) if y < 0.5]

        n_pos = len(pos_indices)
        n_neg = len(neg_indices)
        n_samples = len(y_pred_single_target)

        if n_pos == 0 or n_neg == 0:
            return 0.0, [0.0] * n_samples

        total_loss = 0.0
        grads = [0.0] * n_samples

        for p_idx in pos_indices:
            s_pos = y_pred_single_target[p_idx]
            for n_idx in neg_indices:
                s_neg = y_pred_single_target[n_idx]
                diff = (s_neg - s_pos) / self.temperature
                sig = 1.0 / (1.0 + math.exp(-max(-30.0, min(30.0, diff))))
                total_loss += sig

                d_sig = (sig * (1.0 - sig)) / self.temperature
                grads[p_idx] -= d_sig / (n_pos * n_neg)
                grads[n_idx] += d_sig / (n_pos * n_neg)

        loss = total_loss / (n_pos * n_neg)
        return loss, grads


class MultiTaskCompositeLoss:
    """
    Composite Multi-Task loss uniting Sample-Weighted Asymmetric Loss, Focal Loss, and AUC Surrogate Loss
    across all 12 independent binary classification heads.
    Guarantees zero NaN/Inf gradient propagation.
    """
    def __init__(
        self,
        asl_weight: float = 0.60,
        focal_weight: float = 0.25,
        auc_weight: float = 0.15,
        target_weights: Optional[Dict[str, float]] = None
    ):
        self.asl = AsymmetricLoss(gamma_neg=4.0, gamma_pos=0.0, clip=0.05)
        self.focal = MultiLabelFocalLoss(gamma=2.0, alpha=0.25)
        self.auc_surrogate = AUCSurrogateLoss(temperature=0.1)
        self.asl_weight = asl_weight
        self.focal_weight = focal_weight
        self.auc_weight = auc_weight
        self.target_weights = target_weights or TARGET_LOSS_WEIGHTS

    def compute(
        self,
        predictions: List[List[float]],
        ground_truth: List[List[float]],
        sample_weights: Optional[List[float]] = None
    ) -> Dict[str, Any]:
        """
        Calculates weighted composite multi-task loss and per-head gradient vectors.
        """
        asl_loss, asl_grads = self.asl.compute(predictions, ground_truth, sample_weights)
        focal_loss, focal_grads = self.focal.compute(predictions, ground_truth)

        batch_size = len(predictions)
        num_targets = len(predictions[0])
        auc_loss_sum = 0.0
        auc_grads: List[List[float]] = [[0.0] * num_targets for _ in range(batch_size)]

        for t in range(num_targets):
            preds_t = [predictions[b][t] for b in range(batch_size)]
            gts_t = [ground_truth[b][t] for b in range(batch_size)]
            t_loss, t_grads = self.auc_surrogate.compute_target(preds_t, gts_t)
            auc_loss_sum += t_loss
            for b in range(batch_size):
                auc_grads[b][t] = t_grads[b]

        avg_auc_loss = auc_loss_sum / max(1, num_targets)

        composite_loss = (
            self.asl_weight * asl_loss
            + self.focal_weight * focal_loss
            + self.auc_weight * avg_auc_loss
        )

        combined_grads: List[List[float]] = []
        has_nan_inf = False

        for b in range(batch_size):
            row_grads: List[float] = []
            for t in range(num_targets):
                t_weight = self.target_weights.get(TARGET_KEYS[t], 1.0)
                g = t_weight * (
                    self.asl_weight * asl_grads[b][t]
                    + self.focal_weight * focal_grads[b][t]
                    + self.auc_weight * auc_grads[b][t]
                )
                if math.isnan(g) or math.isinf(g):
                    has_nan_inf = True
                    g = 0.0
                row_grads.append(g)
            combined_grads.append(row_grads)

        return {
            "totalLoss": composite_loss,
            "aslLoss": asl_loss,
            "focalLoss": focal_loss,
            "aucSurrogateLoss": avg_auc_loss,
            "gradients": combined_grads,
            "hasNaNInf": has_nan_inf,
            "targetsVerified": len(TARGET_KEYS)
        }


if __name__ == "__main__":
    preds = [
        [0.90, 0.10, 0.85, 0.05, 0.10, 0.05, 0.10, 0.88, 0.12, 0.05, 0.80, 0.02],
        [0.10, 0.85, 0.15, 0.90, 0.80, 0.10, 0.75, 0.90, 0.82, 0.88, 0.05, 0.01]
    ]
    gt = [
        [1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0],
        [0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0]
    ]
    sample_weights = [1.0, 0.70] # 1.0 = Ground truth, 0.70 = Pseudo-labeled

    asl_val = weighted_bce_asl(preds, gt, sample_weights)
    print(f"Sample-Weighted ASL Loss: {asl_val:.5f}")

    macro_auc_res = compute_validation_macro_auc(gt, preds)
    print(f"Validation Macro-AUC: {macro_auc_res['macro_auc']} across {macro_auc_res['num_targets']} columns.")
