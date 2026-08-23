# Label Engine & Pseudo-Label Curriculum

## 1. Multi-Teacher Consensus Framework

To exploit weakly labeled training reports without corrupting gradients with noise, we employ a 3-Teacher curriculum distillation pipeline:

1. **Teacher A (Deterministic Rule-Based Clinical NLP):**
   - Lexicon parsing with regex capturing explicit mentions, negation windows ($[-30 \text{ chars}, +0]$), and uncertainty modifiers (e.g., *"cannot rule out"*, *"possible"*).

2. **Teacher B (Multilingual Clinical LLM / Transformer NLP):**
   - High-capacity transformer encoder extracting semantic representations from varied institutional report templates and multilingual descriptions.

3. **Teacher C (Vision-Only MRI Teacher Model):**
   - 3D ConvNeXt / DINOv2 visual predictions evaluated on clean gold subsets.

---

## 2. 5-Stage Curriculum Scheduling

- **Stage 1 (Gold Supervision):** Train solely on verified manual radiologist labels (highest loss weight $\lambda = 1.0$).
- **Stage 2 (High-Confidence Consensus):** Introduce pseudo-labels where $\Delta(\text{Teacher A}, \text{Teacher B}, \text{Teacher C}) < 0.20$ ($\lambda = 0.8$).
- **Stage 3 (Report-MRI Consensus):** Incorporate agreed multi-modal predictions ($\lambda = 0.5$).
- **Stage 4 (Medium-Confidence Distillation):** Incorporate single-teacher confident extractions ($\lambda = 0.2$).
- **Stage 5 (Self-Training / EMA Consistency):** Polyak-averaged student ensemble filtering.
