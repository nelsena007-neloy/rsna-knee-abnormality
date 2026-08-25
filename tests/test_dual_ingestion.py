#!/usr/bin/env python3
import unittest
from pipelines.data.dual_ingestion import (
    DualIngestionService,
    IngestionStream,
    StandardizedCase
)

class TestDualIngestionService(unittest.TestCase):
    def setUp(self):
        self.service = DualIngestionService(num_slices_per_plane=16, target_resolution=(64, 64))

    def test_determine_plane_from_cosines(self):
        # Sagittal cosines (Row = 0,1,0, Col = 0,0,-1) -> Normal = (-1, 0, 0)
        sag_cosines = [0.0, 1.0, 0.0, 0.0, 0.0, -1.0]
        self.assertEqual(DualIngestionService.determine_plane_from_cosines(sag_cosines), "Sagittal")

        # Coronal cosines (Row = 1,0,0, Col = 0,0,-1) -> Normal = (0, 1, 0)
        cor_cosines = [1.0, 0.0, 0.0, 0.0, 0.0, -1.0]
        self.assertEqual(DualIngestionService.determine_plane_from_cosines(cor_cosines), "Coronal")

        # Axial cosines (Row = 1,0,0, Col = 0,1,0) -> Normal = (0, 0, 1)
        ax_cosines = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0]
        self.assertEqual(DualIngestionService.determine_plane_from_cosines(ax_cosines), "Axial")

    def test_pacs_dicom_processing(self):
        case = self.service.process_pacs_dicom(
            study_id="TEST-PACS-001",
            series_data={"magnetStrength": "3.0T", "sliceThickness": 3.0}
        )
        self.assertIsInstance(case, StandardizedCase)
        self.assertEqual(case.stream_type, IngestionStream.PACS_DICOM)
        self.assertEqual(case.source_fidelity, "16-bit Native Volumetric")
        self.assertEqual(len(case.multiplanar_tensor), 3)  # 3 planes
        self.assertEqual(len(case.multiplanar_tensor[0]), 16)  # 16 slices

    def test_film_sheet_processing(self):
        case = self.service.process_film_sheet_and_report(
            study_id="TEST-FILM-002",
            film_grid_shape=(3, 4),
            raw_report_ocr="Patient with lateral knee pain after collision."
        )
        self.assertIsInstance(case, StandardizedCase)
        self.assertEqual(case.stream_type, IngestionStream.FILM_SHEET_OCR)
        self.assertEqual(case.source_fidelity, "8-bit Digitized Tiles")
        self.assertEqual(case.metadata["total_tiles_segmented"], 12)
        self.assertEqual(len(case.metadata["tiles"]), 12)

    def test_normalize_dicom_16bit(self):
        raw = [[100.0, 200.0], [400.0, 800.0]]
        norm = self.service.normalize_dicom_16bit(raw, rescale_slope=1.0, rescale_intercept=0.0, window_center=400.0, window_width=800.0)
        self.assertEqual(len(norm), 2)
        self.assertTrue(0.0 <= norm[0][0] <= 1.0)
        self.assertTrue(0.0 <= norm[1][1] <= 1.0)

if __name__ == "__main__":
    unittest.main()
