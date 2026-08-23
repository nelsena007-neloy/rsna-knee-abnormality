# Modeling Strategy & Architectural Taxonomy

## 1. Core Model Architectures

1. **DINOv2-2.5D with Sequence-Aware Attention Pooling:**
   - 2.5D slice encoder (ViT-Base/14 with DINOv2 self-supervised weights).
   - Dynamic sequence routing: passes Sagittal series to ACL/PCL heads, Coronal to Collateral/Menisci heads, Axial to PF OA heads.
   - Attention-weighted slice pooling over slice representations: $z_{\text{study}} = \sum \alpha_i z_i$.

2. **ConvNeXt-3D Volumetric Backbone:**
   - 3D depthwise separable convolutions processing full 3D anisotropic volumes ($D \times H \times W$).
   - Captures contiguous meniscal tears and bone contusion volumes across adjacent slices.

3. **Swin-UNETR-3D Hierarchical Vision Transformer:**
   - Shifted-window multi-head self-attention with multi-scale feature pyramids.
   - High spatial resolution preserved for subtle focal cartilage defects and Segond avulsions.

4. **Multi-Task Pathology Specialist Grouping:**
   - Group 1 (Ligaments & Menisci): ACL, MCL, Medial Meniscus, Lateral Meniscus.
   - Group 2 (Degenerative & Chondral): Medial OA, Lateral OA, PF OA.
   - Group 3 (Effusion & Inflammation): Effusion, Synovitis, Baker's Cyst.
   - Group 4 (Trauma & Osseous): Bone Contusion, Fracture.

---

## 2. Loss Formulations & Ranking Optimization

- **Asymmetric Focal BCE Loss:** Addresses high negative class imbalance for rare pathologies (Fracture, Synovitis):
$$L_{\text{focal}} = - \alpha_t (1 - p_t)^\gamma \log(p_t)$$
- **Pairwise AUC Ranking Loss (Smooth-AUC Surrogate):**
$$L_{\text{AUC}} = \sum_{i \in \text{Pos}} \sum_{j \in \text{Neg}} \sigma\left(\frac{p_j - p_i}{\tau}\right)$$
Directly maximizes concordance index (ROC-AUC) rather than cross-entropy log-loss.
