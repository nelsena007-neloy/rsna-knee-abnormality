#!/usr/bin/env python3
"""
Submission Artifact & Schema Validator for RSNA Knee Abnormality Challenge.
Enforces header conformity, target column order, non-empty UIDs, numerical boundaries [0.0, 1.0],
and row count constraints before submitting to competition host.
"""

import sys
import os
import csv
import math
import argparse
import json
from typing import List, Dict, Any, Tuple, Optional

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

def validate_submission_file(
    file_path: str,
    expected_rows: Optional[int] = None
) -> Tuple[bool, List[str], Dict[str, Any]]:
    """
    Validates CSV file against RSNA competition specifications.
    Returns: (is_valid, errors_list, summary_dict)
    """
    errors: List[str] = []
    summary: Dict[str, Any] = {
        "file": file_path,
        "exists": False,
        "rowCount": 0,
        "columnCount": 0,
        "headerValid": False,
        "allBounded": True,
        "noNaNInf": True,
        "uniqueUIDs": True
    }

    if not os.path.exists(file_path):
        errors.append(f"Submission file does not exist at path: {file_path}")
        return False, errors, summary

    summary["exists"] = True

    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        try:
            header = next(reader)
        except StopIteration:
            errors.append("File is completely empty (no header found).")
            return False, errors, summary

        # 1. Header Validation
        summary["columnCount"] = len(header)
        if header != TARGET_COLUMNS:
            errors.append(
                f"Header mismatch!\nExpected: {','.join(TARGET_COLUMNS)}\nReceived: {','.join(header)}"
            )
        else:
            summary["headerValid"] = True

        # 2. Row Parsing & Boundary Checks
        row_count = 0
        seen_uids = set()

        for line_idx, row in enumerate(reader, start=2):
            row_count += 1
            if len(row) != len(TARGET_COLUMNS):
                errors.append(f"Line {line_idx}: Expected {len(TARGET_COLUMNS)} columns, found {len(row)}.")
                continue

            uid = row[0].strip()
            if not uid:
                errors.append(f"Line {line_idx}: Blank or missing StudyInstanceUID.")
            elif uid in seen_uids:
                summary["uniqueUIDs"] = False
                errors.append(f"Line {line_idx}: Duplicate StudyInstanceUID '{uid}'.")
            else:
                seen_uids.add(uid)

            # Check 12 target columns
            for col_idx, col_name in enumerate(TARGET_COLUMNS[1:], start=1):
                raw_val = row[col_idx].strip()
                try:
                    val = float(raw_val)
                    if math.isnan(val) or math.isinf(val):
                        summary["noNaNInf"] = False
                        errors.append(f"Line {line_idx} ({uid}): Column '{col_name}' has NaN/Inf value '{raw_val}'.")
                    elif val < 0.0 or val > 1.0:
                        summary["allBounded"] = False
                        errors.append(f"Line {line_idx} ({uid}): Column '{col_name}' value {val} is outside [0.0, 1.0].")
                except ValueError:
                    errors.append(f"Line {line_idx} ({uid}): Column '{col_name}' value '{raw_val}' is not a valid float.")

        summary["rowCount"] = row_count

        # 3. Expected Row Count Check
        if expected_rows is not None and row_count != expected_rows:
            errors.append(f"Row count mismatch! Expected {expected_rows} rows, but got {row_count} rows.")

    is_valid = len(errors) == 0
    return is_valid, errors, summary


def main():
    parser = argparse.ArgumentParser(description="RSNA Submission CSV Validator")
    parser.add_argument("--file", type=str, required=True, help="Path to submission.csv file")
    parser.add_argument("--expected-rows", type=int, default=None, help="Expected number of test study rows")

    args = parser.parse_args()

    print(f"\n=======================================================")
    print(f"RSNA SUBMISSION SCHEMA & ARTIFACT VALIDATOR")
    print(f"=======================================================")
    print(f"Target File: {args.file}")
    if args.expected_rows:
        print(f"Expected Rows: {args.expected_rows}")
    print(f"-------------------------------------------------------")

    is_valid, errors, summary = validate_submission_file(args.file, args.expected_rows)

    print(f"Total Rows Checked: {summary['rowCount']}")
    print(f"Header Conformance: {'VALID' if summary['headerValid'] else 'INVALID'}")
    print(f"Numerical Boundaries [0.0, 1.0]: {'VERIFIED' if summary['allBounded'] else 'VIOLATED'}")
    print(f"NaN / Inf Protections: {'VERIFIED' if summary['noNaNInf'] else 'VIOLATED'}")
    print(f"Unique StudyInstanceUIDs: {'VERIFIED' if summary['uniqueUIDs'] else 'DUPLICATES_FOUND'}")
    print("-" * 55)

    if not is_valid:
        print(f"❌ SUBMISSION VALIDATION FAILED with {len(errors)} errors:")
        for err in errors[:15]:
            print(f"  - {err}")
        if len(errors) > 15:
            print(f"  ... and {len(errors) - 15} more errors.")
        sys.exit(1)

    print("✅ SUBMISSION VALIDATION PASSED: Artifact conforms strictly to RSNA specifications.")
    sys.exit(0)


if __name__ == "__main__":
    main()
