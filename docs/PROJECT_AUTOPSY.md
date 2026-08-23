# Project Autopsy — RSNA Knee Abnormality Detection Challenge

**Date:** 2026-08-22  
**Target:** Win the RSNA Knee Abnormality Detection Competition  
**System Platform:** Linux x86_64 (Cloud Run Container / gVisor)  
**Node Version:** v22.23.1  
**Python Version:** 3.10.12  
**GPU / Hardware Acceleration:** CPU Mode (Zero-GPU container sandbox with multi-threaded vectorized fallbacks)

---

## 1. Repository Inventory & Inspection

- **Source Codebase:**
  - `server.ts`: Express 4.x + Vite middleware full-stack API server binding to `0.0.0.0:3000`.
  - `src/App.tsx`: High-performance React 19 single-page research command center.
  - `src/components/`: Modular component hierarchy for MRI viewing, reporting, experiments, cross-validation, error analysis, ensemble, and submissions.
  - `src/data/`: Structured gold-standard clinical cases, annotations, and 12-target metadata.
  - `src/utils/`: High-precision ROC-AUC mathematical evaluation engine, 2.5D/3D MRI slice rendering engine.

- **Available Pipelines & Scripts:**
  - `pipelines/data/data_audit.py`: Scans, audits, checks DICOM metadata, orientations, missingness.
  - `pipelines/labels/label_engine.py`: Multilingual clinical NLP, negation extraction, teacher consensus engine.
  - `pipelines/inference/inference_pipeline.py`: Fully offline-capable, sequence-aware 12-target inference engine.
  - `ml/evaluation/metrics.py`: Official RSNA macro-averaged ROC-AUC, bootstrap confidence intervals, Youden's J.
  - `ml/ensemble/ensemble_lab.py`: Rank and probability ensemble blending with correlation analysis.
  - `scripts/make_submission.py`: Schema validation, bounds checking, and `submission.csv` + `submission_manifest.json` generation.

---

## 2. Competition Dataset Specifications

- **Target Pathologies (12 Classes):**
  1. `ACL`: Anterior Cruciate Ligament tear
  2. `MCL`: Medial Collateral Ligament injury / tear
  3. `Medial Meniscus`: Medial Meniscus tear / degeneration
  4. `Lateral Meniscus`: Lateral Meniscus tear
  5. `Medial OA`: Medial compartment osteoarthritis / chondromalacia
  6. `Lateral OA`: Lateral compartment osteoarthritis
  7. `PF OA`: Patellofemoral osteoarthritis
  8. `Effusion`: Joint effusion / suprapatellar fluid distension
  9. `Synovitis`: Synovial thickening / inflammatory proliferation
  10. `Baker's`: Popliteal / Baker's cyst
  11. `Contusion`: Bone marrow edema / trabecular contusion
  12. `Fracture`: Cortical bone fracture / avulsion injury

- **Input Modalities:**
  - **Training Phase:** Multiplanar Knee MRI DICOM series (Sagittal, Coronal, Axial; PD, PD-FS, T1, T2), series metadata, paired free-text radiology reports, sparse gold labels.
  - **Testing / Inference Phase:** MRI DICOM series and series metadata ONLY. **Radiology reports are strictly withheld at test time.**
  - **Evaluation Metric:** Unweighted Macro-Averaged ROC-AUC across all 12 target pathologies.

---

## 3. Engineering Decisions & Constraints

1. **Strict Offline Test Inference:** Zero remote API calls in the competition inference path (`pipelines/inference/inference_pipeline.py`).
2. **Deterministic Sequence-Aware Slicing:** Dynamically routes condition-specific 2.5D windows to their optimal planes (e.g. ACL -> Sagittal PD-FS; MCL -> Coronal T2; Menisci -> Sagittal + Coronal).
3. **Multi-Teacher Label Distillation:** Uses rule-based clinical NLP + multilingual LLM extraction + MRI teacher model consensus to build high-quality pseudo-labels for weakly supervised pretraining.
