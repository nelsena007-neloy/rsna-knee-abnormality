# Competition Rules & Evaluation Protocol

## 1. Primary Evaluation Metric

The competition evaluation metric is **Macro-Averaged Area Under the Receiver Operating Characteristic Curve (Macro ROC-AUC)** across the 12 binary abnormality targets:

$$\text{Macro-AUC} = \frac{1}{12} \sum_{c=1}^{12} \text{AUC}_c$$

Where $\text{AUC}_c$ is computed using the Wilcoxon-Mann-Whitney trapezoidal integration over all predicted probabilities $p_{i, c} \in [0.0, 1.0]$ against binary gold indicators $y_{i, c} \in \{0, 1\}$.

---

## 2. Competition Submission Constraints

1. **Submission Format:** A standard CSV file named `submission.csv` containing exactly 13 columns:
   - `StudyInstanceUID` (string identifier)
   - `ACL`, `MCL`, `Medial Meniscus`, `Lateral Meniscus`, `Medial OA`, `Lateral OA`, `PF OA`, `Effusion`, `Synovitis`, `Baker's`, `Contusion`, `Fracture` (each float $\in [0.0000, 1.0000]$).
2. **Missing Predictions:** Any row with `NaN`, `null`, `Inf`, or missing column will cause immediate evaluation failure (score 0.000).
3. **No Duplicate Studies:** Every test `StudyInstanceUID` must appear exactly once.
4. **Offline Inference:** The test submission pipeline must execute in an isolated runtime with no internet connectivity. No remote API calls (e.g. OpenAI, Anthropic, or external cloud endpoints) are permitted during the official test run.
5. **Runtime Limits:** Maximum 9 hours GPU compute budget on Kaggle / competition runtime for test inference over ~2,000 test studies.

---

## 3. Supervision Protocol & Leaks Prevention

- **Reports Are Not Available at Test Time:** Models must never require or assume the presence of free-text radiology reports during test evaluation.
- **Pseudo-label Provenance:** All pseudo-labels generated from training reports must be partitioned into stages (Gold -> High Confidence -> Medium Confidence) to prevent label noise from degrading gradient stability.
- **Strict GroupKFold by Patient UID:** No cross-series or cross-time contamination across validation folds.
