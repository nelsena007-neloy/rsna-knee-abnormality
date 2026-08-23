#!/usr/bin/env python3
"""
Unit Tests for Multiplanar 3D Vision & Report Fusion Network (Stage B/C).
Validates forward pass, cross-planar representation pooling, 12 independent binary classification heads,
and deterministic seeding guarantees.
"""

import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.models.multiplanar_net import MultimodalKneeClassifier, seed_everything, TARGET_KEYS
from pipelines.data.multiplanar_loader import MultiplanarDatasetLoader

class TestModelArchitectures(unittest.TestCase):
    def setUp(self):
        seed_everything(42)
        self.model = MultimodalKneeClassifier(feature_dim=128, num_targets=12)
        self.loader = MultiplanarDatasetLoader(
            num_slices_per_plane=8,
            img_size=(32, 32),
            channels=1
        )

    def test_target_heads_count_and_keys(self):
        """Assert exactly 12 independent classification heads match competition keys."""
        self.assertEqual(len(self.model.target_keys), 12)
        expected_keys = [
            "ACL", "MCL", "Medial Meniscus", "Lateral Meniscus",
            "Medial OA", "Lateral OA", "PF OA", "Effusion",
            "Synovitis", "Baker's", "Contusion", "Fracture"
        ]
        self.assertEqual(self.model.target_keys, expected_keys)
        for key in expected_keys:
            self.assertIn(key, self.model.head_weights)
            self.assertIn(key, self.model.head_biases)

    def test_forward_pass_predictions_and_bounds(self):
        """Verify forward pass on multiplanar batch generates valid [0.0, 1.0] probabilities."""
        studies = [self.loader.load_synthetic_study(f"STUDY-{i}") for i in range(3)]
        batch_tensors = [s["multiplanar_tensor"] for s in studies]
        
        predictions = self.model.forward(batch_tensors)
        
        self.assertEqual(len(predictions), 3)
        for row in predictions:
            self.assertEqual(len(row), 12)
            for target in TARGET_KEYS:
                self.assertIn(target, row)
                val = row[target]
                self.assertFalse(val != val) # Check NaN
                self.assertTrue(0.0 <= val <= 1.0)

    def test_deterministic_seeding_reproducibility(self):
        """Verify seed_everything produces identical outputs across runs."""
        studies = [self.loader.load_synthetic_study("REPRO_001")]
        batch = [s["multiplanar_tensor"] for s in studies]

        seed_everything(1337)
        model1 = MultimodalKneeClassifier(feature_dim=64)
        out1 = model1.forward(batch)

        seed_everything(1337)
        model2 = MultimodalKneeClassifier(feature_dim=64)
        out2 = model2.forward(batch)

        for target in TARGET_KEYS:
            self.assertAlmostEqual(out1[0][target], out2[0][target], places=6)

if __name__ == "__main__":
    unittest.main(verbosity=2)
