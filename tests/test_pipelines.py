#!/usr/bin/env python3
"""
Comprehensive Automated Test Suite for RSNA Knee Abnormality Detection Engine.
Runs unit and integration tests across data audit, label engine, offline inference, metrics, and submissions.
"""

import unittest
import os
import sys
import json

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from pipelines.data.data_audit import run_data_audit
from pipelines.labels.label_engine import extract_rule_teacher, compute_teacher_consensus, TARGET_ABNORMALITIES
from pipelines.inference.inference_pipeline import OfflineKneePredictor, TARGET_KEYS
from ml.evaluation.metrics import calculate_roc_auc, calculate_macro_auc
from ml.ensemble.ensemble_lab import blend_predictions, compute_model_correlation
from scripts.make_submission import validate_submission_rows, generate_submission, TARGET_COLUMNS

class TestDataAudit(unittest.TestCase):
    def test_audit_execution(self):
        audit = run_data_audit()
        self.assertEqual(audit["status"], "PASSED")
        self.assertGreaterEqual(audit["totalStudies"], 1)
        self.assertEqual(audit["dataIntegrityScore"], 1.0)
        self.assertIn("ACL", audit["labelPrevalence"])

class TestLabelEngine(unittest.TestCase):
    def test_positive_extraction(self):
        text = "There is a complete full-thickness tear of the anterior cruciate ligament with joint effusion."
        res = extract_rule_teacher(text)
        self.assertEqual(res["ACL"]["status"], "positive")
        self.assertEqual(res["Effusion"]["status"], "positive")
        self.assertGreater(res["ACL"]["score"], 0.8)

    def test_negation_extraction(self):
        text = "No evidence of anterior cruciate ligament tear. Medial meniscus is intact. No fracture."
        res = extract_rule_teacher(text)
        self.assertEqual(res["ACL"]["status"], "negative")
        self.assertEqual(res["Medial Meniscus"]["status"], "negative")
        self.assertEqual(res["Fracture"]["status"], "negative")
        self.assertLess(res["ACL"]["score"], 0.15)

    def test_consensus_logic(self):
        rule_t = {"ACL": {"score": 0.95}}
        nlp_t = {"ACL": 0.90}
        mri_t = {"ACL": 0.88}
        consensus = compute_teacher_consensus(rule_t, nlp_t, mri_t)
        self.assertIn("ACL", consensus)
        self.assertEqual(consensus["ACL"]["confidenceLevel"], "HIGH")
        self.assertEqual(consensus["ACL"]["curriculumStage"], "Stage-2-HighConf")

class TestOfflineInference(unittest.TestCase):
    def test_offline_prediction_shapes(self):
        predictor = OfflineKneePredictor()
        study = {
            "studyInstanceUID": "test-uid-123",
            "slices": {
                "sagittal": [{"pathologyHighlights": [{"abnormality": "ACL", "severity": "severe"}]}]
            },
            "baselinePredictions": {"ACL": 0.90, "MCL": 0.10}
        }
        preds = predictor.predict_study(study)
        self.assertEqual(len(preds), 12)
        for key in TARGET_KEYS:
            self.assertIn(key, preds)
            self.assertTrue(0.0 <= preds[key] <= 1.0)
        self.assertGreater(preds["ACL"], 0.8)

class TestMetricsEngine(unittest.TestCase):
    def test_roc_auc_perfect(self):
        y_true = [1, 1, 0, 0]
        y_score = [0.9, 0.8, 0.2, 0.1]
        auc = calculate_roc_auc(y_true, y_score)
        self.assertEqual(auc, 1.0)

    def test_roc_auc_inverse(self):
        y_true = [1, 1, 0, 0]
        y_score = [0.1, 0.2, 0.8, 0.9]
        auc = calculate_roc_auc(y_true, y_score)
        self.assertEqual(auc, 0.0)

    def test_macro_auc(self):
        gt = [
            {"ACL": 1, "MCL": 0, "Medial Meniscus": 1, "Lateral Meniscus": 0, "Medial OA": 0, "Lateral OA": 0, "PF OA": 0, "Effusion": 1, "Synovitis": 0, "Baker's": 0, "Contusion": 1, "Fracture": 0},
            {"ACL": 0, "MCL": 1, "Medial Meniscus": 0, "Lateral Meniscus": 1, "Medial OA": 1, "Lateral OA": 0, "PF OA": 1, "Effusion": 1, "Synovitis": 1, "Baker's": 1, "Contusion": 0, "Fracture": 0}
        ]
        preds = [
            {"ACL": 0.95, "MCL": 0.10, "Medial Meniscus": 0.90, "Lateral Meniscus": 0.05, "Medial OA": 0.10, "Lateral OA": 0.05, "PF OA": 0.10, "Effusion": 0.88, "Synovitis": 0.05, "Baker's": 0.05, "Contusion": 0.85, "Fracture": 0.02},
            {"ACL": 0.05, "MCL": 0.85, "Medial Meniscus": 0.10, "Lateral Meniscus": 0.92, "Medial OA": 0.88, "Lateral OA": 0.10, "PF OA": 0.90, "Effusion": 0.91, "Synovitis": 0.84, "Baker's": 0.92, "Contusion": 0.05, "Fracture": 0.01}
        ]
        macro_res = calculate_macro_auc(gt, preds)
        self.assertEqual(macro_res["numTargets"], 12)
        self.assertGreaterEqual(macro_res["macroAuc"], 0.0)
        self.assertLessEqual(macro_res["macroAuc"], 1.0)

class TestSubmissionEngine(unittest.TestCase):
    def test_valid_submission(self):
        valid_rows = [
            {
                "StudyInstanceUID": "1.2.3.4",
                "ACL": 0.5, "MCL": 0.5, "Medial Meniscus": 0.5, "Lateral Meniscus": 0.5,
                "Medial OA": 0.5, "Lateral OA": 0.5, "PF OA": 0.5, "Effusion": 0.5,
                "Synovitis": 0.5, "Baker's": 0.5, "Contusion": 0.5, "Fracture": 0.5
            }
        ]
        is_valid, errors = validate_submission_rows(valid_rows)
        self.assertTrue(is_valid)
        self.assertEqual(len(errors), 0)

    def test_invalid_bounds_and_missing_cols(self):
        invalid_rows = [
            {
                "StudyInstanceUID": "1.2.3.4",
                "ACL": 1.5, # Out of bounds
                "MCL": 0.5
                # Missing other 10 columns
            }
        ]
        is_valid, errors = validate_submission_rows(invalid_rows)
        self.assertFalse(is_valid)
        self.assertGreater(len(errors), 0)

if __name__ == "__main__":
    unittest.main(verbosity=2)
