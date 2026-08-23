# rsna-knee-abnormality

> **RSNA Knee Abnormality Detection & Multimodal Diagnostic Decision Support System**  
> A competition-grade modeling workbench, multiplanar DICOM imaging console, and clinical intelligence platform built for evaluating 12 key knee pathologies with macro ROC-AUC optimization.

---

## 🌟 Overview

The `rsna-knee-abnormality` studio brings together deep learning architectures (DINOv2-2.5D, ConvNeXt-3D, Swin-UNETR, Hybrid Graph Specialists) and multimodal LLM text-vision extraction into a desktop diagnostic workstation:

- **12 RSNA Target Pathologies**: ACL Tear, MCL Tear, Medial Meniscus Tear, Lateral Meniscus Tear, Medial Compartment OA, Lateral Compartment OA, Patellofemoral (PF) OA, Joint Effusion, Synovitis, Baker's Cyst, Bone Contusion, and Occult / Subchondral Fracture.
- **Triplanar DICOM Slice Navigation**: Real-time crosshair inspection across Sagittal PD-FS, Coronal T2-TSE, and Axial PD sequences.
- **Interactive Multi-Teacher Pseudo-Label Distillation**: Agreement calibration across rule-based NLP, vision backbones, and multimodal Gemini extraction.
- **ROC-AUC Calibration & Interactive Confusion Matrix**: Live Youden's $J$ index optimization, sensitivity/specificity curves, and per-condition threshold sliders.
- **Dynamic Ensemble Sandbox**: Real-time weight blending and Bayesian calibration across 5 distinct vision and NLP backbones.
- **RSNA Submission Lab**: 13-column `submission.csv` validator, probability boundary checks $[0.0, 1.0]$, and cryptographic validation manifests.

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Motion / Framer Motion, Lucide Icons, Canvas Confetti
- **Backend / API**: Node.js, Express, Google Gen AI SDK (`@google/genai`)
- **Build / Tooling**: Vite 6, `tsx`, `esbuild`

---

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/your-username/rsna-knee-abnormality.git
cd rsna-knee-abnormality

# Install dependencies
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Development Server

```bash
# Start development server on port 3000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build

```bash
# Build frontend assets and bundle backend server
npm run build

# Start production server
npm start
```

---

## 📊 Evaluation & Verification

- **Lint / TypeScript Validation**:
  ```bash
  npm run lint
  ```
- **Automated Validation Pipelines**:
  ```bash
  python3 tests/test_pipelines.py
  python3 pipelines/data/data_audit.py
  python3 pipelines/inference/inference_pipeline.py
  python3 scripts/make_submission.py
  ```

---

## 📂 Project Structure

```text
├── src/
│   ├── components/       # UI Workstation Components (DICOM Viewer, Prediction Matrix, Report Viewer, etc.)
│   ├── data/             # Study datasets, 12 RSNA pathology metadata, clinical benchmark cases
│   ├── types.ts          # TypeScript interfaces and target schemas
│   ├── App.tsx           # 100vh locked desktop workstation entrypoint
│   └── main.tsx          # Client bootstrap
├── server.ts             # Express + Vite proxy and Gemini server-side API integration
├── metadata.json         # AI Studio applet specifications
└── package.json          # Dependencies and script definitions
```

---

## 📄 License

MIT
