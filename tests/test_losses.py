#!/usr/bin/env python3
"""
Unit Tests for Multi-Task Loss Functions and Gradient Propagation (Stage C).
Validates Asymmetric Loss (ASL), Multi-Label Focal Loss, Pairwise AUC Surrogate Loss,
and asserts zero NaN/Inf gradient propagation across all 12 independent heads.
"""

import unittest
import math
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.losses.multitask_losses import (
    AsymmetricLoss,
    MultiLabelFocalLoss,
    AUCSurrogateLoss,
    MultiTaskCompositeLoss,
    TARGET_KEYS
)

class TestLossModulesAndGradients(unittest.TestCase):
    def setUp(self):
        # 4 sample studies x 12 targets
        self.y_pred = [
            [0.92, 0.12, 0.85, 0.05, 0.10, 0.04, 0.08, 0.88, 0.14, 0.02, 0.80, 0.01],
            [0.05, 0.82, 0.10, 0.90, 0.78, 0.08, 0.82, 0.91, 0.75, 0.88, 0.04, 0.02],
            [0.88, 0.70, 0.80, 0.15, 0.12, 0.05, 0.04, 0.85, 0.10, 0.05, 0.92, 0.95],
            [0.02, 0.04, 0.05, 0.03, 0.02, 0.01, 0.03, 0.06, 0.02, 0.01, 0.02, 0.01]
        ]
        self.y_true = [
            [1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0],
            [0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0],
            [1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0],
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
        ]

    def test_asymmetric_loss_computation_and_safety(self):
        """Test Asymmetric Loss computation and non-negativity."""
        asl = AsymmetricLoss(gamma_neg=4.0, gamma_pos=0.0, clip=0.05)
        loss, grads = asl.compute(self.y_pred, self.y_true)
        
        self.assertGreater(loss, 0.0)
        self.assertFalse(math.isnan(loss))
        self.assertFalse(math.isinf(loss))
        self.assertEqual(len(grads), 4)
        self.assertEqual(len(grads[0]), 12)

    def test_multilabel_focal_loss_computation(self):
        """Test Multi-Label Focal Loss on imbalanced ground truth."""
        focal = MultiLabelFocalLoss(gamma=2.0, alpha=0.25)
        loss, grads = focal.compute(self.y_pred, self.y_true)
        
        self.assertGreater(loss, 0.0)
        self.assertFalse(math.isnan(loss))
        self.assertFalse(math.isinf(loss))

    def test_auc_surrogate_loss_computation(self):
        """Test Pairwise AUC Surrogate ranking loss."""
        auc_loss = AUCSurrogateLoss(temperature=0.1)
        # Compute for target 0 (ACL)
        preds_t = [self.y_pred[b][0] for b in range(4)]
        gts_t = [self.y_true[b][0] for b in range(4)]
        loss, grads = auc_loss.compute_target(preds_t, gts_t)
        
        self.assertGreaterEqual(loss, 0.0)
        self.assertEqual(len(grads), 4)
        for g in grads:
            self.assertFalse(math.isnan(g))
            self.assertFalse(math.isinf(g))

    def test_zero_nan_inf_gradient_propagation_across_12_heads(self):
        """Strictly verify zero NaN/Inf gradients across all 12 independent binary classification heads."""
        composite = MultiTaskCompositeLoss()
        result = composite.compute(self.y_pred, self.y_true)

        self.assertFalse(result["hasNaNInf"])
        self.assertEqual(result["targetsVerified"], 12)
        self.assertGreater(result["totalLoss"], 0.0)

        grads = result["gradients"]
        self.assertEqual(len(grads), 4) # 4 batch samples

        for b_idx in range(4):
            self.assertEqual(len(grads[b_idx]), 12)
            for t_idx, head_key in enumerate(TARGET_KEYS):
                grad_val = grads[b_idx][t_idx]
                # Assert finite and not NaN
                self.assertFalse(
                    math.isnan(grad_val),
                    f"NaN gradient detected in batch {b_idx} for target head: {head_key}"
                )
                self.assertFalse(
                    math.isinf(grad_val),
                    f"Inf gradient detected in batch {b_idx} for target head: {head_key}"
                )

    def test_extreme_boundary_gradient_stability(self):
        """Verify numerical stability at extreme probabilities (0.00001 and 0.99999)."""
        extreme_pred = [[0.00001] * 12, [0.99999] * 12]
        extreme_gt = [[0.0] * 12, [1.0] * 12]

        composite = MultiTaskCompositeLoss()
        result = composite.compute(extreme_pred, extreme_gt)

        self.assertFalse(result["hasNaNInf"])
        self.assertFalse(math.isnan(result["totalLoss"]))
        self.assertFalse(math.isinf(result["totalLoss"]))

if __name__ == "__main__":
    unittest.main(verbosity=2)
