#!/usr/bin/env python3
"""
Label Engine: Multilingual Report Intelligence & Consensus Teacher Strategy.
Extracts 12-target structured annotations, negations, uncertainty spans,
and resolves consensus across Rule-NLP (Teacher A), LLM NLP (Teacher B), and MRI Student (Teacher C).
"""

import sys
import re
import json
from typing import Dict, List, Any, Tuple

TARGET_ABNORMALITIES = [
    "ACL", "MCL", "Medial Meniscus", "Lateral Meniscus",
    "Medial OA", "Lateral OA", "PF OA", "Effusion",
    "Synovitis", "Baker's", "Contusion", "Fracture"
]

# Clinical lexicon and regular expressions for rule-based Teacher A
RULE_LEXICON = {
    "ACL": {
        "positive": [
            r"acl tear",
            r"anterior cruciate (ligament )?tear",
            r"tear of (the )?(anterior cruciate ligament|acl)",
            r"disrupted acl",
            r"complete rupture of the acl",
            r"high-grade (partial )?acl",
            r"torn acl"
        ],
        "negative": [
            r"acl (is )?intact",
            r"anterior cruciate ligament (is )?intact",
            r"no (evidence of )?acl tear",
            r"no (evidence of )?anterior cruciate",
            r"normal acl",
            r"unremarkable acl"
        ],
        "uncertain": [r"possible acl", r"attenuated acl", r"cannot exclude acl tear", r"indeterminate acl"]
    },
    "MCL": {
        "positive": [
            r"mcl tear",
            r"medial collateral (ligament )?tear",
            r"tear of (the )?(medial collateral ligament|mcl)",
            r"mcl sprain",
            r"grade [123] mcl",
            r"edema along the mcl"
        ],
        "negative": [
            r"mcl (is )?intact",
            r"medial collateral ligament (is )?intact",
            r"no (evidence of )?mcl tear",
            r"normal mcl",
            r"unremarkable mcl"
        ],
        "uncertain": [r"possible mcl", r"mild periligamentous edema"]
    },
    "Medial Meniscus": {
        "positive": [r"medial menisc(us|al) tear", r"tear of the medial meniscus", r"complex medial meniscal tear", r"horizontal cleavage.*medial meniscus", r"root tear.*medial meniscus"],
        "negative": [r"medial meniscus is intact", r"no medial meniscal tear", r"normal medial meniscus", r"unremarkable medial meniscus"],
        "uncertain": [r"possible medial meniscus tear", r"degenerative signal.*no discrete tear"]
    },
    "Lateral Meniscus": {
        "positive": [r"lateral menisc(us|al) tear", r"tear of the lateral meniscus", r"complex lateral meniscal tear", r"radial tear.*lateral meniscus"],
        "negative": [r"lateral meniscus is intact", r"no lateral meniscal tear", r"normal lateral meniscus", r"unremarkable lateral meniscus"],
        "uncertain": [r"possible lateral meniscus tear", r"intrasubstance signal.*lateral meniscus"]
    },
    "Medial OA": {
        "positive": [r"medial (compartment )?osteoarthritis", r"medial joint space narrowing", r"medial chondromalacia grade [34]", r"full-thickness cartilage loss.*medial"],
        "negative": [r"no medial osteoarthritis", r"preserved medial joint space", r"intact medial cartilage"],
        "uncertain": [r"mild medial chondral wear", r"grade 1-2 medial chondromalacia"]
    },
    "Lateral OA": {
        "positive": [r"lateral (compartment )?osteoarthritis", r"lateral joint space narrowing", r"lateral chondromalacia grade [34]"],
        "negative": [r"no lateral osteoarthritis", r"preserved lateral joint space", r"intact lateral cartilage"],
        "uncertain": [r"mild lateral chondral wear"]
    },
    "PF OA": {
        "positive": [r"patellofemoral (compartment )?osteoarthritis", r"patellar cartilage loss", r"trochlear chondromalacia grade [34]", r"severe pf oa"],
        "negative": [r"normal patellofemoral joint", r"intact patellofemoral cartilage", r"no patellofemoral oa"],
        "uncertain": [r"mild patellar chondromalacia"]
    },
    "Effusion": {
        "positive": [r"joint effusion", r"moderate (to large )?effusion", r"suprapatellar joint effusion", r"fluid distension"],
        "negative": [r"no (joint )?effusion", r"physiologic joint fluid only", r"trace joint fluid", r"no significant effusion"],
        "uncertain": [r"small to moderate effusion", r"equivocal fluid accumulation"]
    },
    "Synovitis": {
        "positive": [r"synovitis", r"synovial thickening", r"synovial proliferation", r"inflammatory synovitis"],
        "negative": [r"no synovitis", r"normal synovium", r"unremarkable synovium"],
        "uncertain": [r"mild synovial enhancement", r"possible synovitis"]
    },
    "Baker's": {
        "positive": [r"baker('s)? cyst", r"popliteal cyst", r"fluid in the gastrocnemius-semimembranosus bursa"],
        "negative": [r"no baker('s)? cyst", r"no popliteal cyst", r"unremarkable popliteal fossa"],
        "uncertain": [r"small fluid collection in semimembranosus bursa"]
    },
    "Contusion": {
        "positive": [r"bone (marrow )?contusion", r"bone (marrow )?edema", r"trabecular microfracture", r"subchondral marrow edema"],
        "negative": [r"no bone (marrow )?edema", r"no contusion", r"normal osseous signal"],
        "uncertain": [r"subtle marrow hyperintensity"]
    },
    "Fracture": {
        "positive": [r"fracture", r"cortical disruption", r"tibial plateau fracture", r"segond avulsion", r"patellar fracture"],
        "negative": [r"no fracture", r"intact cortical bone", r"no osseous disruption"],
        "uncertain": [r"possible microfracture", r"indeterminate cortical step-off"]
    }
}

def extract_rule_teacher(report_text: str) -> Dict[str, Dict[str, Any]]:
    """
    Teacher A: Deterministic Rule-Based Extraction with Negation & Uncertainty Scopes.
    """
    text_lower = report_text.lower()
    extracted = {}

    for target in TARGET_ABNORMALITIES:
        lexicon = RULE_LEXICON.get(target, {})
        status = "unknown"
        confidence = 0.50
        evidence = ""

        # Check positive matches first
        for pat in lexicon.get("positive", []):
            m = re.search(pat, text_lower)
            if m:
                # Check for direct negation scope e.g. "no evidence of acl tear"
                start_idx = max(0, m.start() - 30)
                preceding = text_lower[start_idx:m.start()]
                if re.search(r"\b(no|without|denies|negative for|free of)\b", preceding):
                    status = "negative"
                    confidence = 0.95
                    evidence = text_lower[start_idx:m.end()]
                else:
                    status = "positive"
                    confidence = 0.96
                    evidence = m.group(0)
                break

        if status == "unknown":
            # Check negative expressions
            for pat in lexicon.get("negative", []):
                m = re.search(pat, text_lower)
                if m:
                    status = "negative"
                    confidence = 0.95
                    evidence = m.group(0)
                    break

        if status == "unknown":
            # Check uncertain expressions
            for pat in lexicon.get("uncertain", []):
                m = re.search(pat, text_lower)
                if m:
                    status = "uncertain"
                    confidence = 0.60
                    evidence = m.group(0)
                    break

        extracted[target] = {
            "status": status,
            "confidence": confidence if status != "unknown" else 0.10,
            "evidence": evidence or "Implicit clinical context",
            "score": 0.95 if status == "positive" else (0.50 if status == "uncertain" else (0.05 if status == "negative" else 0.10))
        }

    return extracted

def compute_teacher_consensus(rule_teacher: Dict[str, Any], nlp_teacher: Dict[str, Any], mri_teacher: Dict[str, Any]) -> Dict[str, Any]:
    """
    Consensus Strategy across 3 Teachers.
    Generates Curriculum Stage tags: 'Stage-1-Gold', 'Stage-2-HighConf', 'Stage-3-Consensus', 'Stage-4-Medium'
    """
    consensus = {}
    for target in TARGET_ABNORMALITIES:
        s1 = rule_teacher.get(target, {}).get("score", 0.1)
        s2 = nlp_teacher.get(target, 0.1)
        s3 = mri_teacher.get(target, 0.1)

        avg_score = (s1 * 0.4) + (s2 * 0.35) + (s3 * 0.25)
        disagreement = max(abs(s1 - s2), abs(s1 - s3), abs(s2 - s3))

        if disagreement < 0.20 and (avg_score > 0.80 or avg_score < 0.15):
            stage = "Stage-2-HighConf"
            confidence_level = "HIGH"
        elif disagreement < 0.35:
            stage = "Stage-3-Consensus"
            confidence_level = "MEDIUM"
        else:
            stage = "Stage-4-Medium"
            confidence_level = "CONFLICT"

        consensus[target] = {
            "consensusScore": round(avg_score, 4),
            "disagreement": round(disagreement, 4),
            "confidenceLevel": confidence_level,
            "curriculumStage": stage
        }

    return consensus

if __name__ == "__main__":
    sample_report = "Complete tear of the anterior cruciate ligament with associated moderate joint effusion and lateral tibial plateau bone contusion. Medial meniscus and MCL appear completely intact. No fracture."
    extracted = extract_rule_teacher(sample_report)
    print("Teacher A (Rule NLP):")
    print(json.dumps(extracted, indent=2))
