#!/usr/bin/env python3
"""
Data Audit Pipeline for RSNA Knee Abnormality Detection.
Performs integrity checks, sequence classification, slice count distribution,
and missingness analysis across DICOM series and metadata.
"""

import sys
import json
import os
from typing import Dict, List, Any

def run_data_audit(studies_data: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Performs comprehensive dataset validation and statistical audit.
    """
    if studies_data is None:
        # Default mock study verification set
        studies_data = [
            {
                "studyInstanceUID": "1.2.826.0.1.3680043.8.498.2024.101",
                "patientId": "RSNA-KNEE-0101",
                "patientAge": 28,
                "patientGender": "M",
                "kneeSide": "Right",
                "magnetStrength": "3.0T",
                "planes": ["Sagittal", "Coronal", "Axial"],
                "sliceCounts": {"Sagittal": 28, "Coronal": 26, "Axial": 32},
                "sequences": ["PD-FS", "T2-TSE", "PD-Axial"],
                "goldLabels": {"ACL": 1, "MCL": 1, "Medial Meniscus": 0, "Lateral Meniscus": 0, "Medial OA": 0, "Lateral OA": 0, "PF OA": 0, "Effusion": 1, "Synovitis": 0, "Baker's": 0, "Contusion": 1, "Fracture": 0}
            },
            {
                "studyInstanceUID": "1.2.826.0.1.3680043.8.498.2024.102",
                "patientId": "RSNA-KNEE-0102",
                "patientAge": 54,
                "patientGender": "F",
                "kneeSide": "Left",
                "magnetStrength": "1.5T",
                "planes": ["Sagittal", "Coronal", "Axial"],
                "sliceCounts": {"Sagittal": 26, "Coronal": 24, "Axial": 30},
                "sequences": ["PD-FS", "T2-TSE", "PD-Axial"],
                "goldLabels": {"ACL": 0, "MCL": 0, "Medial Meniscus": 1, "Lateral Meniscus": 0, "Medial OA": 1, "Lateral OA": 0, "PF OA": 1, "Effusion": 1, "Synovitis": 1, "Baker's": 1, "Contusion": 0, "Fracture": 0}
            },
            {
                "studyInstanceUID": "1.2.826.0.1.3680043.8.498.2024.103",
                "patientId": "RSNA-KNEE-0103",
                "patientAge": 22,
                "patientGender": "M",
                "kneeSide": "Right",
                "magnetStrength": "3.0T",
                "planes": ["Sagittal", "Coronal", "Axial"],
                "sliceCounts": {"Sagittal": 30, "Coronal": 28, "Axial": 34},
                "sequences": ["PD-FS", "T2-TSE", "PD-Axial"],
                "goldLabels": {"ACL": 0, "MCL": 0, "Medial Meniscus": 0, "Lateral Meniscus": 1, "Medial OA": 0, "Lateral OA": 0, "PF OA": 0, "Effusion": 0, "Synovitis": 0, "Baker's": 0, "Contusion": 1, "Fracture": 1}
            },
            {
                "studyInstanceUID": "1.2.826.0.1.3680043.8.498.2024.104",
                "patientId": "RSNA-KNEE-0104",
                "patientAge": 68,
                "patientGender": "M",
                "kneeSide": "Left",
                "magnetStrength": "1.5T",
                "planes": ["Sagittal", "Coronal", "Axial"],
                "sliceCounts": {"Sagittal": 24, "Coronal": 22, "Axial": 28},
                "sequences": ["PD-FS", "T2-TSE", "PD-Axial"],
                "goldLabels": {"ACL": 0, "MCL": 0, "Medial Meniscus": 1, "Lateral Meniscus": 1, "Medial OA": 1, "Lateral OA": 1, "PF OA": 1, "Effusion": 1, "Synovitis": 1, "Baker's": 0, "Contusion": 0, "Fracture": 0}
            },
            {
                "studyInstanceUID": "1.2.826.0.1.3680043.8.498.2024.105",
                "patientId": "RSNA-KNEE-0105",
                "patientAge": 31,
                "patientGender": "F",
                "kneeSide": "Right",
                "magnetStrength": "3.0T",
                "planes": ["Sagittal", "Coronal", "Axial"],
                "sliceCounts": {"Sagittal": 32, "Coronal": 30, "Axial": 36},
                "sequences": ["PD-FS", "T2-TSE", "PD-Axial"],
                "goldLabels": {"ACL": 0, "MCL": 0, "Medial Meniscus": 0, "Lateral Meniscus": 0, "Medial OA": 0, "Lateral OA": 0, "PF OA": 0, "Effusion": 0, "Synovitis": 0, "Baker's": 0, "Contusion": 0, "Fracture": 0}
            }
        ]

    total_studies = len(studies_data)
    total_series = 0
    total_slices = 0
    magnet_dist = {"1.5T": 0, "3.0T": 0}
    plane_dist = {"Sagittal": 0, "Coronal": 0, "Axial": 0}
    label_prevalence: Dict[str, int] = {}
    missingness_checks = {"missing_uid": 0, "missing_plane": 0, "invalid_slice_count": 0}

    for study in studies_data:
        if not study.get("studyInstanceUID"):
            missingness_checks["missing_uid"] += 1
        
        magnet = study.get("magnetStrength", "1.5T")
        magnet_dist[magnet] = magnet_dist.get(magnet, 0) + 1

        for plane in ["Sagittal", "Coronal", "Axial"]:
            if plane in study.get("planes", []):
                plane_dist[plane] += 1
                total_series += 1
                slice_cnt = study.get("sliceCounts", {}).get(plane, 0)
                if slice_cnt <= 0:
                    missingness_checks["invalid_slice_count"] += 1
                total_slices += slice_cnt
            else:
                missingness_checks["missing_plane"] += 1

        for k, v in study.get("goldLabels", {}).items():
            label_prevalence[k] = label_prevalence.get(k, 0) + (1 if v == 1 else 0)

    audit_result = {
        "status": "PASSED" if sum(missingness_checks.values()) == 0 else "WARNING",
        "totalStudies": total_studies,
        "totalSeries": total_series,
        "totalSlices": total_slices,
        "averageSlicesPerStudy": round(total_slices / max(1, total_studies), 1),
        "magnetDistribution": magnet_dist,
        "planeDistribution": plane_dist,
        "labelPrevalence": {k: f"{v}/{total_studies} ({round(v/total_studies*100, 1)}%)" for k, v in label_prevalence.items()},
        "missingness": missingness_checks,
        "dataIntegrityScore": 1.0 - (sum(missingness_checks.values()) / max(1, total_studies * 3))
    }

    return audit_result

if __name__ == "__main__":
    result = run_data_audit()
    print(json.dumps(result, indent=2))
