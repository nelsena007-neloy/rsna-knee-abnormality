#!/usr/bin/env python3
"""
RSNA Knee Abnormality Detection: Audit & Validation Suite for Multiplanar Preprocessing.
Tests pipelines/data/multiplanar_loader.py against strict competition specifications:

1. Synthetic DICOM Volume Generation:
   - Sagittal, Coronal, Axial volumes with 35 slices, anisotropic pixel spacing [0.36, 0.48] mm.
   - Standard ImageOrientationPatient cosines and realistic ImagePositionPatient coordinates.
2. Physical Coordinate Projection & Normal Vector Math:
   - N = RowCosines x ColCosines, coord_i = P_i . N.
   - Strictly monotonic slice ordering along coord_i.
3. Span Percentile Gating (6% to 94%):
   - Discards boundary slices outside [0.06, 0.94] physical interval.
   - Exact slice budgets: Sagittal (20), Coronal (18), Axial (14), T1 (12).
4. In-Plane Physical Centering & Crop Dimensions:
   - crop_h = 140.0 / Delta_y, crop_w = 140.0 / Delta_x.
   - Bilinear interpolation to exactly (384, 384) with float32 values in [0.0, 1.0].
5. 2.5D Windowing & Final Batch Tensor Shapes:
   - 3-slice sliding windows (z_{i-1}, z_i, z_{i+1}) with edge reflection padding.
   - Shape: [Batch_Size, Num_Windows, 3, 384, 384] with Num_Windows = 52 (or 64 with T1).
   - Forward pass verification through MultiplanarNet without NaNs, Infs, or errors.
"""

import os
import sys
import math
import random
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from pipelines.data.multiplanar_loader import (
    compute_slice_normal,
    compute_physical_projection,
    classify_orientation_plane,
    sort_slices_by_physical_coordinate,
    select_slices_by_physical_span,
    compute_physical_crop_dimensions,
    normalize_physical_fov,
    build_sliding_25d_windows,
    assemble_study_25d_tensor,
    collate_25d_batch,
    generate_mock_dicom_volume,
    MultiplanarDatasetLoader,
    STANDARDIZED_SLICE_ALLOCATION,
    TARGET_KEYS
)
from ml.models.multiplanar_net import MultiplanarNet, seed_everything


# ==============================================================================
# 1. Synthetic DICOM Volume Generation Tests
# ==============================================================================

class TestSyntheticDICOMGeneration:
    """Verifies synthetic DICOM volume creation simulating Sagittal, Coronal, Axial scans."""

    @pytest.mark.parametrize("plane", ["Sagittal", "Coronal", "Axial"])
    def test_mock_dicom_volume_structure(self, plane):
        num_slices = 35
        pixel_spacing = (0.36, 0.48)
        matrix_size = (256, 256)

        volume = generate_mock_dicom_volume(
            plane=plane,
            num_slices=num_slices,
            pixel_spacing=pixel_spacing,
            matrix_size=matrix_size,
            start_pos=-70.0,
            span_mm=140.0
        )

        assert len(volume) == 35, f"Expected 35 slices for {plane}, got {len(volume)}"

        for idx, slc in enumerate(volume):
            assert "pixel_array" in slc
            assert "ImageOrientationPatient" in slc
            assert "row_cosines" in slc
            assert "col_cosines" in slc
            assert "ImagePositionPatient" in slc
            assert "PixelSpacing" in slc

            assert len(slc["pixel_array"]) == 256
            assert len(slc["pixel_array"][0]) == 256
            assert slc["PixelSpacing"] == (0.36, 0.48)
            assert len(slc["ImagePositionPatient"]) == 3
            assert len(slc["ImageOrientationPatient"]) == 6

    def test_dicom_orientation_cosines(self):
        """Assert standard anatomical cosines match DICOM coordinate conventions."""
        sag = generate_mock_dicom_volume("Sagittal", num_slices=5)[0]
        cor = generate_mock_dicom_volume("Coronal", num_slices=5)[0]
        ax = generate_mock_dicom_volume("Axial", num_slices=5)[0]

        # Sagittal: Row=[0, 1, 0] (Anterior), Col=[0, 0, -1] (Inferior)
        assert sag["row_cosines"] == [0.0, 1.0, 0.0]
        assert sag["col_cosines"] == [0.0, 0.0, -1.0]
        assert classify_orientation_plane(sag["row_cosines"], sag["col_cosines"]) == "Sagittal"

        # Coronal: Row=[1, 0, 0] (Left), Col=[0, 0, -1] (Inferior)
        assert cor["row_cosines"] == [1.0, 0.0, 0.0]
        assert cor["col_cosines"] == [0.0, 0.0, -1.0]
        assert classify_orientation_plane(cor["row_cosines"], cor["col_cosines"]) == "Coronal"

        # Axial: Row=[1, 0, 0] (Left), Col=[0, 1, 0] (Posterior)
        assert ax["row_cosines"] == [1.0, 0.0, 0.0]
        assert ax["col_cosines"] == [0.0, 1.0, 0.0]
        assert classify_orientation_plane(ax["row_cosines"], ax["col_cosines"]) == "Axial"


# ==============================================================================
# 2. Physical Coordinate Projection & Normal Vector Math Tests
# ==============================================================================

class TestPhysicalCoordinateProjectionAndNormal:
    """Verifies normal vector calculation and scalar projection monotonic sorting."""

    def test_normal_vector_cross_product_and_unit_norm(self):
        """Assert N = RowCosines x ColCosines with ||N|| = 1.0."""
        # Sagittal
        n_sag = compute_slice_normal([0.0, 1.0, 0.0], [0.0, 0.0, -1.0])
        norm_sag = math.sqrt(sum(x ** 2 for x in n_sag))
        assert abs(norm_sag - 1.0) < 1e-6
        assert n_sag == (-1.0, 0.0, 0.0)

        # Coronal
        n_cor = compute_slice_normal([1.0, 0.0, 0.0], [0.0, 0.0, -1.0])
        norm_cor = math.sqrt(sum(x ** 2 for x in n_cor))
        assert abs(norm_cor - 1.0) < 1e-6
        assert n_cor == (0.0, 1.0, 0.0)

        # Axial
        n_ax = compute_slice_normal([1.0, 0.0, 0.0], [0.0, 1.0, 0.0])
        norm_ax = math.sqrt(sum(x ** 2 for x in n_ax))
        assert abs(norm_ax - 1.0) < 1e-6
        assert n_ax == (0.0, 0.0, 1.0)

    def test_scalar_projection_math(self):
        """Assert scalar projection coord_i = P_i . N."""
        pos = [25.0, -40.0, 60.0]
        normal = (0.0, 0.0, 1.0)
        proj = compute_physical_projection(pos, normal)
        assert abs(proj - 60.0) < 1e-6

        # Arbitrary normal
        n_arb = (1.0 / math.sqrt(3), 1.0 / math.sqrt(3), 1.0 / math.sqrt(3))
        proj_arb = compute_physical_projection(pos, n_arb)
        expected = (25.0 - 40.0 + 60.0) / math.sqrt(3)
        assert abs(proj_arb - expected) < 1e-6

    def test_monotonic_slice_sorting_from_shuffled_dicom(self):
        """Confirm slices are strictly ordered monotonically along coord_i regardless of input order."""
        raw_volume = generate_mock_dicom_volume("Sagittal", num_slices=35, start_pos=-70.0, span_mm=140.0)
        # Randomly shuffle volume
        shuffled = list(raw_volume)
        random.seed(42)
        random.shuffle(shuffled)

        sorted_slices = sort_slices_by_physical_coordinate(shuffled)
        assert len(sorted_slices) == 35

        coords = [s["physical_coord"] for s in sorted_slices]
        # Verify strictly monotonic increasing order
        for i in range(len(coords) - 1):
            assert coords[i] < coords[i + 1], f"Slice {i} ({coords[i]}) not strictly less than slice {i+1} ({coords[i+1]})"

        # Check span limits
        assert abs(coords[0] - (-70.0)) < 1e-4
        assert abs(coords[-1] - 70.0) < 1e-4


# ==============================================================================
# 3. Span Percentile Gating (6% to 94%) Tests
# ==============================================================================

class TestPhysicalSpanPercentileGating:
    """Verifies physical span gating discards boundary slices and returns exact slice budgets."""

    def test_boundary_slices_discarded(self):
        """Assert boundary slices outside [0.06, 0.94] physical interval are excluded."""
        raw_volume = generate_mock_dicom_volume("Coronal", num_slices=50, start_pos=0.0, span_mm=100.0)
        sorted_slices = sort_slices_by_physical_coordinate(raw_volume)

        # Full range: [0.0, 100.0]. 6% is 6.0 mm, 94% is 94.0 mm.
        gated = select_slices_by_physical_span(sorted_slices, target_count=18, low_pct=0.06, high_pct=0.94)

        assert len(gated) == 18
        gated_coords = [s["physical_coord"] for s in gated]

        # Minimum physical coordinate in gated must be >= active start (approx 6.0 mm)
        assert gated_coords[0] >= 5.0, f"Expected first slice >= ~6.0, got {gated_coords[0]}"
        # Maximum physical coordinate in gated must be <= active end (approx 94.0 mm)
        assert gated_coords[-1] <= 95.0, f"Expected last slice <= ~94.0, got {gated_coords[-1]}"

    @pytest.mark.parametrize("plane,budget", [
        ("Sagittal", 20),
        ("Coronal", 18),
        ("Axial", 14),
        ("T1", 12)
    ])
    def test_exact_slice_budgets_returned(self, plane, budget):
        """Confirm exact slice budgets are returned for all challenge series."""
        raw_volume = generate_mock_dicom_volume(plane, num_slices=35)
        sorted_slices = sort_slices_by_physical_coordinate(raw_volume)
        gated = select_slices_by_physical_span(sorted_slices, target_count=budget)

        assert len(gated) == budget, f"Expected exact budget {budget} for {plane}, got {len(gated)}"


# ==============================================================================
# 4. In-Plane Physical Centering & Crop Dimensions Tests
# ==============================================================================

class TestInPlanePhysicalFOVNormalization:
    """Verifies FOV normalization to 140 mm x 140 mm, bilinear interpolation to 384x384."""

    def test_crop_dimension_evaluation(self):
        """Assert physical crop dimensions evaluate to crop_h = 140.0 / dy and crop_w = 140.0 / dx."""
        pixel_spacing = (0.36, 0.48)
        crop_h, crop_w = compute_physical_crop_dimensions(pixel_spacing, target_fov_mm=140.0)

        expected_h = 140.0 / 0.36
        expected_w = 140.0 / 0.48

        assert abs(crop_h - expected_h) < 1e-5, f"Expected crop_h {expected_h}, got {crop_h}"
        assert abs(crop_w - expected_w) < 1e-5, f"Expected crop_w {expected_w}, got {crop_w}"
        assert abs(crop_h - 388.888889) < 1e-3
        assert abs(crop_w - 291.666667) < 1e-3

    def test_output_tensor_resolution_and_value_bounds(self):
        """Confirm output 2D image tensors are bilinearly interpolated to exactly (384, 384) with float32 in [0.0, 1.0]."""
        raw_slice = [[0.5 for _ in range(256)] for _ in range(256)]
        resampled = normalize_physical_fov(
            raw_slice,
            pixel_spacing=(0.36, 0.48),
            target_fov_mm=140.0,
            output_size=(384, 384),
            center_femoral_tibial=True
        )

        assert len(resampled) == 384, f"Expected height 384, got {len(resampled)}"
        assert len(resampled[0]) == 384, f"Expected width 384, got {len(resampled[0])}"

        # Verify all values in [0.0, 1.0] and non-NaN
        min_v = min(min(row) for row in resampled)
        max_v = max(max(row) for row in resampled)

        assert min_v >= 0.0, f"Minimum value negative: {min_v}"
        assert max_v <= 1.0, f"Maximum value exceeds 1.0: {max_v}"
        assert not math.isnan(min_v)
        assert not math.isnan(max_v)

    def test_out_of_bounds_zero_padding(self):
        """Assert coordinates outside original image matrix are padded with zero intensity."""
        # 32x32 image with 1.0 values
        small_slice = [[1.0 for _ in range(32)] for _ in range(32)]
        # Requesting high-resolution spacing (0.1 mm) makes 140 mm FOV equal to 1400 pixels,
        # which extends well beyond the 32x32 image boundaries.
        resampled = normalize_physical_fov(
            small_slice,
            pixel_spacing=(0.1, 0.1),
            target_fov_mm=140.0,
            output_size=(64, 64)
        )
        # Corners should be zero-padded
        assert resampled[0][0] == 0.0
        assert resampled[0][-1] == 0.0
        assert resampled[-1][0] == 0.0
        assert resampled[-1][-1] == 0.0
        # Center where original image is located should have non-zero value
        assert resampled[32][32] > 0.0


# ==============================================================================
# 5. 2.5D Windowing & Final Batch Tensor Shapes Tests
# ==============================================================================

class TestWindowing25DAndBatchShapes:
    """Verifies 2.5D sliding windows, reflection padding, tensor shapes, and model forward pass."""

    def test_edge_reflection_padding_in_sliding_windows(self):
        """Assert 3-slice sliding windows (z-1, z, z+1) use edge reflection padding."""
        # 4 slices with distinct values
        slices = [
            [[float(i)] * 16 for _ in range(16)]
            for i in range(4)
        ]

        windows = build_sliding_25d_windows(slices, contrast_windowing=False, padding_mode="reflection")
        assert len(windows) == 4

        # Window 0 (z=0): channels should be [z1, z0, z1] by reflection
        ch0_w0 = windows[0][0][0][0] # z1
        ch1_w0 = windows[0][1][0][0] # z0
        ch2_w0 = windows[0][2][0][0] # z1
        assert ch0_w0 == 1.0, f"Expected channel 0 of window 0 to be 1.0 (reflection of z1), got {ch0_w0}"
        assert ch1_w0 == 0.0, f"Expected channel 1 of window 0 to be 0.0 (z0), got {ch1_w0}"
        assert ch2_w0 == 1.0, f"Expected channel 2 of window 0 to be 1.0 (z1), got {ch2_w0}"

        # Window 3 (z=3): channels should be [z2, z3, z2] by reflection
        ch0_w3 = windows[3][0][0][0] # z2
        ch1_w3 = windows[3][1][0][0] # z3
        ch2_w3 = windows[3][2][0][0] # z2
        assert ch0_w3 == 2.0, f"Expected channel 0 of window 3 to be 2.0 (z2), got {ch0_w3}"
        assert ch1_w3 == 3.0, f"Expected channel 1 of window 3 to be 3.0 (z3), got {ch1_w3}"
        assert ch2_w3 == 2.0, f"Expected channel 2 of window 3 to be 2.0 (reflection of z2), got {ch2_w3}"

    def test_study_windows_assembly_shape_52_and_64(self):
        """Assert output study window tensor conforms strictly to 52 windows (or 64 including T1)."""
        loader = MultiplanarDatasetLoader(img_size=(384, 384))

        sag_raw = generate_mock_dicom_volume("Sagittal", num_slices=35)
        cor_raw = generate_mock_dicom_volume("Coronal", num_slices=35)
        ax_raw = generate_mock_dicom_volume("Axial", num_slices=35)
        t1_raw = generate_mock_dicom_volume("Sagittal", num_slices=25)

        sag_proc = loader.process_raw_volume(sag_raw, target_plane="Sagittal", override_slice_budget=20)
        cor_proc = loader.process_raw_volume(cor_raw, target_plane="Coronal", override_slice_budget=18)
        ax_proc = loader.process_raw_volume(ax_raw, target_plane="Axial", override_slice_budget=14)
        t1_proc = loader.process_raw_volume(t1_raw, target_plane="T1_Anatomy", override_slice_budget=12)

        assert len(sag_proc) == 20
        assert len(cor_proc) == 18
        assert len(ax_proc) == 14
        assert len(t1_proc) == 12

        # 3-Plane Study: 20 + 18 + 14 = 52 windows
        study_52 = assemble_study_25d_tensor(sag_proc, cor_proc, ax_proc, t1_slices=None)
        assert len(study_52) == 52, f"Expected 52 windows, got {len(study_52)}"
        assert len(study_52[0]) == 3, f"Expected 3 channels per window, got {len(study_52[0])}"
        assert len(study_52[0][0]) == 384, f"Expected height 384, got {len(study_52[0][0])}"
        assert len(study_52[0][0][0]) == 384, f"Expected width 384, got {len(study_52[0][0][0])}"

        # 4-Series Study with T1: 52 + 12 = 64 windows
        study_64 = assemble_study_25d_tensor(sag_proc, cor_proc, ax_proc, t1_slices=t1_proc)
        assert len(study_64) == 64, f"Expected 64 windows, got {len(study_64)}"

    def test_batch_tensor_collation_and_forward_pass(self):
        """
        Asserts batch collation conforms to [Batch_Size, Num_Windows, 3, 384, 384]
        and passes through MultiplanarNet with zero NaNs, Infs, or memory errors.
        """
        seed_everything(1337)
        batch_size = 2
        num_windows = 52

        # Construct dummy batch: [Batch_Size, Num_Windows, 3, 384, 384]
        # Using 384x384 spatial dimensions with shared row buffer for memory efficiency
        sample_row = [0.25] * 384
        sample_channel = [sample_row for _ in range(384)]
        dummy_study = [[sample_channel, sample_channel, sample_channel] for _ in range(num_windows)]

        batch_tensors = [dummy_study for _ in range(batch_size)]
        collated = collate_25d_batch(batch_tensors)

        # Verify batch shape: [Batch_Size, Num_Windows, 3, 384, 384]
        assert len(collated) == batch_size
        assert len(collated[0]) == num_windows
        assert len(collated[0][0]) == 3
        assert len(collated[0][0][0]) == 384
        assert len(collated[0][0][0][0]) == 384

        # Pass through MultiplanarNet
        model = MultiplanarNet(feature_dim=64, num_targets=12)
        predictions = model.forward(collated)

        assert len(predictions) == batch_size, f"Expected {batch_size} prediction dicts"

        for row in predictions:
            assert len(row) == 12, f"Expected 12 target keys in prediction, got {len(row)}"
            for target in TARGET_KEYS:
                assert target in row, f"Missing target key {target} in predictions"
                prob = row[target]
                assert not math.isnan(prob), f"Target {target} prediction is NaN!"
                assert not math.isinf(prob), f"Target {target} prediction is Infinite!"
                assert 0.0 <= prob <= 1.0, f"Target {target} prediction {prob} out of [0.0, 1.0] bounds!"


if __name__ == "__main__":
    pytest.main(["-v", __file__])
