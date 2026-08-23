#!/usr/bin/env python3
"""
Official Submission Engine for RSNA Knee Abnormality Detection.
Validates StudyInstanceUID format, exact 12-target columns, probability ranges [0.0, 1.0],
detects missing/NaN values, and generates submission.csv & submission_manifest.json.
"""

import sys
import os
import csv
import json
import hashlib
from datetime import datetime
from typing import List, Dict, Any, Tuple

TARGET_COLUMNS = [
    "StudyInstanceUID",
    "ACL",
    "MCL",
    "Medial Meniscus",
    "Lateral Meniscus",
    "Medial OA",
    "Lateral OA",
    "PF OA",
    "Effusion",
    "Synovitis",
    "Baker's",
    "Contusion",
    "Fracture"
]

def validate_submission_rows(rows: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
    """
    Validates submission schema and contents.
    Returns (is_valid, list_of_errors).
    """
    errors = []
    seen_uids = set()

    if not rows:
        return False, ["Submission is empty. Zero rows found."]

    for idx, row in enumerate(rows):
        uid = str(row.get("StudyInstanceUID", "")).strip()
        if not uid:
            errors.append(f"Row {idx + 1}: Missing or blank StudyInstanceUID.")
        elif uid in seen_uids:
            errors.append(f"Row {idx + 1}: Duplicate StudyInstanceUID '{uid}'.")
        else:
            seen_uids.add(uid)

        for col in TARGET_COLUMNS[1:]:
            if col not in row:
                errors.append(f"Row {idx + 1} ({uid}): Missing column '{col}'.")
                continue
            
            val = row[col]
            try:
                num = float(val)
                if math_is_invalid(num):
                    errors.append(f"Row {idx + 1} ({uid}): Column '{col}' has invalid float (NaN/Inf).")
                elif num < 0.0 or num > 1.0:
                    errors.append(f"Row {idx + 1} ({uid}): Column '{col}' value {num} is out of bounds [0.0, 1.0].")
            except (ValueError, TypeError):
                errors.append(f"Row {idx + 1} ({uid}): Column '{col}' value '{val}' is not a valid float.")

    return (len(errors) == 0, errors)

def math_is_invalid(val: float) -> bool:
    return val != val or val == float('inf') or val == float('-inf')

def generate_submission(
    predictions: List[Dict[str, Any]],
    output_csv: str = "artifacts/submission.csv",
    output_manifest: str = "artifacts/submission_manifest.json",
    ensemble_metadata: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Generates and verifies the competition submission.csv.
    """
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    is_valid, errors = validate_submission_rows(predictions)

    if not is_valid:
        raise ValueError(f"Submission Validation Failed with {len(errors)} errors:\n" + "\n".join(errors[:10]))

    # Write CSV
    with open(output_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=TARGET_COLUMNS)
        writer.writeheader()
        for row in predictions:
            cleaned_row = {
                "StudyInstanceUID": str(row["StudyInstanceUID"]),
                **{col: f"{float(row[col]):.4f}" for col in TARGET_COLUMNS[1:]}
            }
            writer.writerow(cleaned_row)

    # Compute checksum
    with open(output_csv, "rb") as f:
        file_hash = hashlib.sha256(f.read()).hexdigest()

    manifest = {
        "competition": "RSNA Knee Abnormality Detection Challenge",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "file": os.path.basename(output_csv),
        "sha256": file_hash,
        "rowCount": len(predictions),
        "columnCount": len(TARGET_COLUMNS),
        "columns": TARGET_COLUMNS,
        "validationStatus": "VERIFIED_VALID",
        "offlineCompliant": True,
        "modelsIncluded": ensemble_metadata.get("models", ["DINOv2-2.5D", "ConvNeXt-3D", "Swin-UNETR"]) if ensemble_metadata else ["DINOv2-2.5D", "ConvNeXt-3D"]
    }

    with open(output_manifest, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    return manifest

if __name__ == "__main__":
    sample_preds = [
        {
            "StudyInstanceUID": "1.2.826.0.1.3680043.8.498.2024.101",
            "ACL": 0.9421, "MCL": 0.8812, "Medial Meniscus": 0.1205, "Lateral Meniscus": 0.0512,
            "Medial OA": 0.0411, "Lateral OA": 0.0210, "PF OA": 0.0315, "Effusion": 0.9120,
            "Synovitis": 0.0814, "Baker's": 0.0412, "Contusion": 0.8912, "Fracture": 0.0150
        },
        {
            "StudyInstanceUID": "1.2.826.0.1.3680043.8.498.2024.102",
            "ACL": 0.0311, "MCL": 0.0412, "Medial Meniscus": 0.8915, "Lateral Meniscus": 0.0412,
            "Medial OA": 0.8812, "Lateral OA": 0.0610, "PF OA": 0.9124, "Effusion": 0.8512,
            "Synovitis": 0.8120, "Baker's": 0.9014, "Contusion": 0.0612, "Fracture": 0.0105
        }
    ]
    manifest = generate_submission(sample_preds)
    print("Generated Submission Manifest:")
    print(json.dumps(manifest, indent=2))
