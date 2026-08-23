# KNEEAI ARENA — System Architecture

## 1. High-Level Architecture Overview

**KNEEAI ARENA** is an end-to-end competition workbench and multi-modal clinical intelligence platform built specifically for the RSNA Knee Abnormality Detection Challenge.

```
+-----------------------------------------------------------------------------------+
|                            KNEEAI ARENA Web Console                               |
| (React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Motion Layout Engine)|
|                                                                                   |
|  [ Dashboard ]  [ Dataset Explorer ]  [ MRI DICOM Viewer ]  [ Report & Labels ]   |
|  [ Experiments ] [ Cross Validation ] [ Error Analysis ]    [ Ensemble Lab ]      |
|  [ Submission Center ] [ Offline Health & Copilot Drawer ]                        |
+------------------------------------------+----------------------------------------+
                                           | HTTP REST / JSON API
+------------------------------------------v----------------------------------------+
|                               Server Backend (Node / Express)                     |
|  - /api/predict (Multimodal Gemini 3.7 Flash MSK Specialist + Offline Fallback)   |
|  - /api/copilot (Contextual AI MSK Radiologist Copilot)                           |
|  - /api/experiments & /api/models (Model Registry & Experiment Tracking)         |
|  - /api/error-analysis & /api/ensemble/optimize (Live Ensemble Engine)            |
|  - /api/submission/validate (Schema & Out-of-Bounds Integrity Verifier)           |
+------------------------------------------+----------------------------------------+
                                           |
+------------------------------------------v----------------------------------------+
|                               Python & ML Engine                                  |
|  1. pipelines/data/data_audit.py: DICOM & Metadata Quality Scanner                |
|  2. pipelines/labels/label_engine.py: Rule + LLM + MRI Consensus Pseudo-Labels    |
|  3. pipelines/inference/inference_pipeline.py: Offline 2.5D Sequence-Aware Router|
|  4. ml/evaluation/metrics.py: RSNA Macro ROC-AUC & Bootstrap Confidence Engine    |
|  5. ml/ensemble/ensemble_lab.py: Probability & Rank Ensemble Blend Optimizer      |
|  6. scripts/make_submission.py: 13-Column Schema Verifier & Manifest Generator    |
+-----------------------------------------------------------------------------------+
```

## 2. Key Modules & Subsystems

1. **Multiplanar MRI DICOM Viewer (`src/components/MriViewer.tsx`)**:
   - Triplanar navigation: Sagittal PD-FS, Coronal T2-TSE, Axial PD.
   - Cine video playback, window/level clinical presets (Bone Marrow, STIR Fluid, Cartilage Detail, High Contrast, Invert Grayscale).
   - Real-time Caliper distance measurement tool in millimeters.
   - Lesion bounding annotations and Grad-CAM saliency heatmaps.

2. **Report Intelligence & Label Engine (`src/components/ReportViewer.tsx`, `pipelines/labels/label_engine.py`)**:
   - Entity highlighting for 12 abnormalities with clickable plane/slice jump links.
   - Negation and uncertainty scope resolver.
   - 3-Teacher agreement matrix (Teacher A: Rule NLP, Teacher B: LLM NLP, Teacher C: MRI Model).

3. **Model Registry & Experiment Tracker (`src/components/ModelArchitecture.tsx`)**:
   - Live tracking of validation Macro-AUC, loss curves, parameter counts, FLOPs, and per-target deltas.
   - Interactive 4-stage pipeline graph: 3D Vision Backbone -> NLP Transformer -> Cross-Attention Gating -> 12-Sigmoid Output.

4. **Cross Validation & Metric Engine (`src/components/EvaluationDashboard.tsx`, `ml/evaluation/metrics.py`)**:
   - Live SVG interactive ROC Curves across all 12 pathologies.
   - Threshold calibration slider with real-time Youden's $J$, Sensitivity, Specificity, F1, and $2 \times 2$ Confusion Matrix updates.

5. **Ensemble Lab (`src/components/SubmissionLab.tsx`, `ml/ensemble/ensemble_lab.py`)**:
   - Interactive weight sliders for DINOv2-2.5D, ConvNeXt-3D, Swin-UNETR, Hybrid Specialist, and Clinical Multimodal models.
   - Real-time recalculation of validation Macro-AUC and per-condition AUCs.

6. **Competition Submission Engine (`scripts/make_submission.py`)**:
   - 13-column format verification, NaN/Inf bounds checking, single-click copy, CSV export, and `submission_manifest.json` generation.
