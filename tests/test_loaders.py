#!/usr/bin/env python3
"""
Unit Tests for Multimodal Multiplanar DICOM & Radiology Report Loaders (Stage B).
Validates:
1. Deterministic physical coordinate projection and acquisition order invariance.
2. Physical span percentile gating (6% to 94%) across series slice budgets.
3. In-plane physical FOV normalization (140 mm x 140 mm) with zero-padding.
4. Dynamic rescale slope/intercept and volume-wide 0.5th-99.5th percentile windowing.
5. 3-plane batch alignment, text tokenization constraints, and 6D tensor collation.
"""

import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from pipelines.data.multiplanar_loader import (
    MultiplanarDatasetLoader,
    ReportTokenizer,
    PLANES,
    TARGET_KEYS,
    STANDARDIZED_SLICE_ALLOCATION,
    compute_slice_normal,
    compute_physical_projection,
    classify_orientation_plane,
    sort_slices_by_physical_coordinate,
    select_slices_by_physical_span,
    normalize_physical_fov,
    apply_rescale_and_window
)
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

    def test_deterministic_slice_normal_and_projection(self):
        """Verify normal vector calculation N = RowCosines x ColCosines and physical projection coord = P . N."""
        # Sagittal: Row=[0, 1, 0], Col=[0, 0, -1] -> Normal=[-1, 0, 0]
        sag_norm = compute_slice_normal([0.0, 1.0, 0.0], [0.0, 0.0, -1.0])
        self.assertAlmostEqual(sag_norm[0], -1.0)
        self.assertAlmostEqual(sag_norm[1], 0.0)
        self.assertAlmostEqual(sag_norm[2], 0.0)

        # Coronal: Row=[1, 0, 0], Col=[0, 0, -1] -> Normal=[0, 1, 0]
        cor_norm = compute_slice_normal([1.0, 0.0, 0.0], [0.0, 0.0, -1.0])
        self.assertAlmostEqual(cor_norm[0], 0.0)
        self.assertAlmostEqual(cor_norm[1], 1.0)
        self.assertAlmostEqual(cor_norm[2], 0.0)

        # Axial: Row=[1, 0, 0], Col=[0, 1, 0] -> Normal=[0, 0, 1]
        ax_norm = compute_slice_normal([1.0, 0.0, 0.0], [0.0, 1.0, 0.0])
        self.assertAlmostEqual(ax_norm[0], 0.0)
        self.assertAlmostEqual(ax_norm[1], 0.0)
        self.assertAlmostEqual(ax_norm[2], 1.0)

        # Physical coordinate projection
        pos = [-35.5, 12.0, 88.2]
        sag_coord = compute_physical_projection(pos, sag_norm)
        self.assertAlmostEqual(sag_coord, 35.5)

    def test_physical_coordinate_sorting_invariance(self):
        """Verify slices sorted along physical coordinate produce consistent anatomical direction regardless of acquisition order."""
        normal = (0.0, 0.0, 1.0)
        # Slices in reverse acquisition order (e.g. feet-first vs head-first)
        reversed_slices = [
            {"ImagePositionPatient": [0.0, 0.0, 50.0], "id": "slice_50"},
            {"ImagePositionPatient": [0.0, 0.0, 20.0], "id": "slice_20"},
            {"ImagePositionPatient": [0.0, 0.0, -10.0], "id": "slice_neg10"},
            {"ImagePositionPatient": [0.0, 0.0, 75.0], "id": "slice_75"},
        ]
        sorted_s = sort_slices_by_physical_coordinate(reversed_slices, default_normal=normal)
        coords = [s["physical_coord"] for s in sorted_s]
        self.assertEqual(coords, [-10.0, 20.0, 50.0, 75.0])
        self.assertEqual(sorted_s[0]["id"], "slice_neg10")
        self.assertEqual(sorted_s[-1]["id"], "slice_75")

    def test_physical_span_percentile_gating(self):
        """Verify 6% to 94% span gating samples exact series slice budgets discarding non-diagnostic margins."""
        # 100 slices from 0.0 mm to 100.0 mm
        full_volume = [{"physical_coord": float(i), "index": i} for i in range(101)]
        
        # Test series budgets: Sagittal 20, Coronal 18, Axial 14, T1 12
        budgets = {
            "Sagittal": 20,
            "Coronal": 18,
            "Axial": 14,
            "T1_Anatomy": 12
        }

        for series_name, budget in budgets.items():
            gated = select_slices_by_physical_span(
                full_volume,
                target_count=budget,
                low_pct=0.06,
                high_pct=0.94
            )
            self.assertEqual(len(gated), budget)
            # Verify coordinates stay inside the active [6.0, 94.0] span
            self.assertGreaterEqual(gated[0]["physical_coord"], 5.5)
            self.assertLessEqual(gated[-1]["physical_coord"], 94.5)
            # Verify monotonically non-decreasing coordinates
            selected_coords = [s["physical_coord"] for s in gated]
            self.assertEqual(selected_coords, sorted(selected_coords))

    def test_in_plane_fov_normalization_and_padding(self):
        """Verify 140 mm x 140 mm FOV normalization, zero-padding out-of-bounds, and 384x384 standard output."""
        # 200x200 slice with pixel spacing 1.0 mm/pixel -> 200 mm x 200 mm FOV
        # 140 mm box corresponds to 140x140 pixel crop centered in the 200x200 image
        slice_200 = [[1.0 for _ in range(200)] for _ in range(200)]
        resampled_384 = normalize_physical_fov(
            slice_200,
            pixel_spacing=(1.0, 1.0),
            target_fov_mm=140.0,
            output_size=(384, 384)
        )
        self.assertEqual(len(resampled_384), 384)
        self.assertEqual(len(resampled_384[0]), 384)

        # Test out-of-bounds zero padding:
        # 50x50 slice with pixel spacing 2.0 mm/pixel -> 100 mm x 100 mm FOV
        # 140 mm target FOV requires 70x70 pixels which exceeds the 50x50 image bounds
        small_slice = [[5.0 for _ in range(50)] for _ in range(50)]
        padded_res = normalize_physical_fov(
            small_slice,
            pixel_spacing=(2.0, 2.0),
            target_fov_mm=140.0,
            output_size=(64, 64)
        )
        # Corners should be zero-padded
        self.assertEqual(padded_res[0][0], 0.0)
        self.assertEqual(padded_res[0][-1], 0.0)
        self.assertEqual(padded_res[-1][0], 0.0)
        self.assertEqual(padded_res[-1][-1], 0.0)
        # Center should contain signal
        center_val = padded_res[32][32]
        self.assertGreater(center_val, 0.0)

    def test_dynamic_rescale_and_windowing(self):
        """Verify RescaleSlope, RescaleIntercept, and 0.5th to 99.5th percentile scaling to [0.0, 1.0]."""
        # Create a 3-slice volume with known range
        mock_volume = [
            [[float(i + j) for j in range(50)] for i in range(50)],
            [[float(i + j + 50) for j in range(50)] for i in range(50)]
        ]
        rescaled = apply_rescale_and_window(
            mock_volume,
            rescale_slope=2.0,
            rescale_intercept=-10.0,
            p_low=0.5,
            p_high=99.5
        )
        self.assertEqual(len(rescaled), 2)
        # Check all values are bounded strictly within [0.0, 1.0]
        for slc in rescaled:
            for row in slc:
                for v in row:
                    self.assertGreaterEqual(v, 0.0)
                    self.assertLessEqual(v, 1.0)

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
        expected_shape = [4, 3, 16, 1, 64, 64]
        self.assertEqual(batch["tensor_shape"], expected_shape)
        self.assertEqual(len(batch["input_ids"]), 4)
        self.assertEqual(len(batch["attention_mask"]), 4)

if __name__ == "__main__":
    unittest.main(verbosity=2)
