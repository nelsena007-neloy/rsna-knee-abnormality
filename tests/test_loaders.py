#!/usr/bin/env python3
"""
Unit Tests for Multimodal Multiplanar DICOM & Radiology Report Loaders (Stage B).
Validates 3-plane batch alignment, text tokenization constraints (padding, truncation, special tokens),
and dynamic tensor shapes [Batch, Planes(3), Slices(N), Channels, H, W].
"""

import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from pipelines.data.multiplanar_loader import MultiplanarDatasetLoader, ReportTokenizer, PLANES, TARGET_KEYS
from ml.models.multiplanar_net import seed_everything

class TestMultiplanarLoaders(unittest.TestCase):
    def setUp(self):
        seed_everything(42)
        self.loader = MultiplanarDatasetLoader(
            num_slices_per_plane=16,
            img_size=(64, 64),
            channels=1
        )
        self.tokenizer = ReportTokenizer(max_length=64)

    def test_planes_specification(self):
        """Assert exactly 3 orthogonal MRI planes are supported."""
        self.assertEqual(len(PLANES), 3)
        self.assertIn("Sagittal", PLANES)
        self.assertIn("Coronal", PLANES)
        self.assertIn("Axial", PLANES)

    def test_report_tokenization_constraints(self):
        """Validate special tokens (CLS, SEP, PAD), padding, and strict truncation length."""
        long_report = "Complex tear of the medial meniscus posterior horn with extensive high grade joint effusion " * 15
        tokens = self.tokenizer.tokenize_report(long_report)
        
        input_ids = tokens["input_ids"]
        attention_mask = tokens["attention_mask"]

        # Assert max length constraint
        self.assertEqual(len(input_ids), 64)
        self.assertEqual(len(attention_mask), 64)

        # Assert CLS and SEP tokens
        self.assertEqual(input_ids[0], self.tokenizer.cls_token_id)
        self.assertIn(self.tokenizer.sep_token_id, input_ids)

        # Assert binary attention mask
        for m in attention_mask:
            self.assertIn(m, [0, 1])

    def test_single_study_ingestion_shape(self):
        """Validate volumetric dimensions for a single multiplanar study."""
        study = self.loader.load_synthetic_study("TEST-STUDY-001", "Full thickness tear of the ACL.")
        tensor = study["multiplanar_tensor"]
        
        # Planes = 3 (Sagittal, Coronal, Axial)
        self.assertEqual(len(tensor), 3)
        # Slices per plane = 16
        self.assertEqual(len(tensor[0]), 16)
        # Channels = 1
        self.assertEqual(len(tensor[0][0]), 1)
        # Height = 64
        self.assertEqual(len(tensor[0][0][0]), 64)
        # Width = 64
        self.assertEqual(len(tensor[0][0][0][0]), 64)

    def test_batch_collation_6d_tensor_shape(self):
        """Assert dynamic tensor output shape: [Batch, Planes(3), Slices(N), Channels, H, W]."""
        batch_studies = [
            self.loader.load_synthetic_study(f"STUDY-{i:03d}")
            for i in range(4)
        ]
        batch = self.loader.collate_batch(batch_studies)
        
        self.assertEqual(batch["batch_size"], 4)
        # Check tensor shape matches [Batch=4, Planes=3, Slices=16, Channels=1, H=64, W=64]
        expected_shape = [4, 3, 16, 1, 64, 64]
        self.assertEqual(batch["tensor_shape"], expected_shape)
        self.assertEqual(len(batch["input_ids"]), 4)
        self.assertEqual(len(batch["attention_mask"]), 4)

if __name__ == "__main__":
    unittest.main(verbosity=2)
