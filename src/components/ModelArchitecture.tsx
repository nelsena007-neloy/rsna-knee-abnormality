import React, { useState } from 'react';
import { EnsembleConfig } from '../types';
import {
  Layers,
  Cpu,
  FileText,
  GitMerge,
  Sparkles,
  Sliders,
  SlidersHorizontal,
  CheckCircle2,
  HelpCircle,
  Network,
  Zap,
  Activity
} from 'lucide-react';

interface ModelArchitectureProps {
  config: EnsembleConfig;
  onChangeConfig: (newConfig: EnsembleConfig) => void;
  currentMacroAuc: number;
}

export const ModelArchitecture: React.FC<ModelArchitectureProps> = ({
  config,
  onChangeConfig,
  currentMacroAuc
}) => {
  const [activeStage, setActiveStage] = useState<'vision' | 'nlp' | 'fusion' | 'head'>('fusion');

  // Compute simulated AUC boost based on configuration
  const calculateSimulatedAuc = () => {
    let base = 0.925;
    if (config.backbone3D === 'Swin-UNETR-3D') base += 0.018;
    else if (config.backbone3D === 'ConvNeXt-3D') base += 0.012;
    else base += 0.006;

    if (config.nlpModel === 'Med-Gemini-Embeddings') base += 0.016;
    else if (config.nlpModel === 'BioMed-RoBERTa') base += 0.011;
    else base += 0.005;

    if (config.fusionMethod === 'Cross-Attention Gating') base += 0.012;
    else if (config.fusionMethod === 'Tensor Bilinear Pooling') base += 0.008;

    if (config.useTTA) base += 0.005;

    // Weight balance penalty if extreme
    const balancePenalty = Math.abs(config.visionWeight - 0.6) * 0.015;
    return Math.min(0.985, Math.max(0.88, base - balancePenalty));
  };

  const simulatedAuc = calculateSimulatedAuc();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/50">
              <Network className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">
              Multimodal 3D Vision + Clinical NLP Fusion Architecture
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            The winning paradigm in the RSNA Knee Abnormality Detection challenge couples volumetric 3D MRI representation (Sagittal, Coronal, Axial) with transformer-encoded radiology reports via cross-attention gating.
          </p>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-cyan-500/30 flex items-center gap-4 shrink-0">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Ensemble Valid AUC</div>
            <div className="text-2xl font-mono font-bold text-cyan-300">
              {simulatedAuc.toFixed(4)}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Target Count</div>
            <div className="text-sm font-semibold text-emerald-400">12 Abnormalities</div>
          </div>
        </div>
      </div>

      {/* Interactive Pipeline Diagram */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          End-to-End Multimodal Inference Graph
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Stage 1: Volumetric 3D Vision Encoder */}
          <div
            id="arch-step-vision"
            onClick={() => setActiveStage('vision')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              activeStage === 'vision'
                ? 'bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/20 shadow-lg'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold block">STAGE 1</span>
                <span className="text-xs font-bold text-white">3D Vision Backbone</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Processes 3 orthogonal volume stacks (Sagittal PD, Coronal T2, Axial PD) into dense 3D spatial feature tensors.
            </p>
            <div className="space-y-1 text-[11px] font-mono bg-slate-950 p-2 rounded-lg border border-slate-800">
              <div className="text-slate-400">Model: <span className="text-cyan-300">{config.backbone3D}</span></div>
              <div className="text-slate-400">Input: <span className="text-slate-200">3x[D, 256, 256]</span></div>
              <div className="text-slate-400">Embedding: <span className="text-slate-200">1024-D</span></div>
            </div>
          </div>

          {/* Stage 2: Clinical Report NLP Encoder */}
          <div
            id="arch-step-nlp"
            onClick={() => setActiveStage('nlp')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              activeStage === 'nlp'
                ? 'bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/20 shadow-lg'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/40">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-indigo-400 font-bold block">STAGE 2</span>
                <span className="text-xs font-bold text-white">Clinical Text Transformer</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Extracts medical semantics, anatomical qualifiers, and negation context from paired radiology findings.
            </p>
            <div className="space-y-1 text-[11px] font-mono bg-slate-950 p-2 rounded-lg border border-slate-800">
              <div className="text-slate-400">NLP Model: <span className="text-indigo-300">{config.nlpModel}</span></div>
              <div className="text-slate-400">Tokens: <span className="text-slate-200">512 Subwords</span></div>
              <div className="text-slate-400">Embedding: <span className="text-slate-200">768-D</span></div>
            </div>
          </div>

          {/* Stage 3: Cross-Attention Fusion */}
          <div
            id="arch-step-fusion"
            onClick={() => setActiveStage('fusion')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              activeStage === 'fusion'
                ? 'bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/20 shadow-lg'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-purple-950 text-purple-400 border border-purple-800/40">
                <GitMerge className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-purple-400 font-bold block">STAGE 3</span>
                <span className="text-xs font-bold text-white">Cross-Attention Gating</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Aligns visual slice representations with report tokens using multi-head query-key-value cross-attention.
            </p>
            <div className="space-y-1 text-[11px] font-mono bg-slate-950 p-2 rounded-lg border border-slate-800">
              <div className="text-slate-400">Method: <span className="text-purple-300">{config.fusionMethod}</span></div>
              <div className="text-slate-400">Heads: <span className="text-slate-200">8 Multi-Head</span></div>
              <div className="text-slate-400">Fused Rep: <span className="text-slate-200">1024-D</span></div>
            </div>
          </div>

          {/* Stage 4: Multi-label Classification Head */}
          <div
            id="arch-step-head"
            onClick={() => setActiveStage('head')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              activeStage === 'head'
                ? 'bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/20 shadow-lg'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold block">STAGE 4</span>
                <span className="text-xs font-bold text-white">12-Head Multi-Label</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Computes independent calibrated probabilities for each abnormality with focal binary cross-entropy loss.
            </p>
            <div className="space-y-1 text-[11px] font-mono bg-slate-950 p-2 rounded-lg border border-slate-800">
              <div className="text-slate-400">Outputs: <span className="text-emerald-300">12 Sigmoids</span></div>
              <div className="text-slate-400">Metric: <span className="text-slate-200">Macro AUC-ROC</span></div>
              <div className="text-slate-400">Loss: <span className="text-slate-200">Focal BCE + AUC</span></div>
            </div>
          </div>
        </div>

        {/* Interactive Hyperparameter & Weight Tuning Console */}
        <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              Multimodal Ensemble Hyperparameter Sandbox
            </h4>
            <span className="text-[11px] text-cyan-400 font-mono">Real-time AUC Feedback</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Vision Backbone Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                3D Vision Backbone:
              </label>
              <select
                id="select-vision-backbone"
                value={config.backbone3D}
                onChange={e => onChangeConfig({ ...config, backbone3D: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              >
                <option value="Swin-UNETR-3D">Swin-UNETR-3D (Hierarchical Vision Transformer)</option>
                <option value="ConvNeXt-3D">ConvNeXt-3D Large (Pure Modern CNN)</option>
                <option value="DenseNet-121-3D">DenseNet-121-3D (Triplanar Feature Re-use)</option>
                <option value="3D-ResNet50">3D-ResNet50 (Residual Medical Baseline)</option>
              </select>
            </div>

            {/* NLP Encoder Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Radiology NLP Model:
              </label>
              <select
                id="select-nlp-model"
                value={config.nlpModel}
                onChange={e => onChangeConfig({ ...config, nlpModel: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              >
                <option value="Med-Gemini-Embeddings">Med-Gemini Multimodal Clinical Embeddings</option>
                <option value="BioMed-RoBERTa">BioMed-RoBERTa (PubMed & MIMIC-III)</option>
                <option value="ClinicalBERT">ClinicalBERT (Hospital Notes Pretrained)</option>
                <option value="GatorTron">GatorTron 345M (Clinical LLM)</option>
              </select>
            </div>

            {/* Fusion Strategy */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Fusion Architecture:
              </label>
              <select
                id="select-fusion-method"
                value={config.fusionMethod}
                onChange={e => onChangeConfig({ ...config, fusionMethod: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              >
                <option value="Cross-Attention Gating">Cross-Attention Gated Multimodal Fusion</option>
                <option value="Tensor Bilinear Pooling">Tensor Bilinear Pooling (Compact bilinear)</option>
                <option value="Late Fusion Concat">Late Fusion Concatenation + Dense</option>
              </select>
            </div>
          </div>

          {/* Sliders: Vision Weight vs Report Weight */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-slate-800">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">3D Vision Weight (MRI Scans):</span>
                <span className="font-mono text-cyan-300 font-bold">{(config.visionWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.9"
                step="0.05"
                value={config.visionWeight}
                onChange={e => onChangeConfig({ ...config, visionWeight: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">NLP Text Weight (Radiology Reports):</span>
                <span className="font-mono text-indigo-300 font-bold">{(config.nlpReportWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={config.nlpReportWeight}
                onChange={e => onChangeConfig({ ...config, nlpReportWeight: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          {/* Test Time Augmentation Toggle */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="checkbox-use-tta"
                checked={config.useTTA}
                onChange={e => onChangeConfig({ ...config, useTTA: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="checkbox-use-tta" className="text-xs text-slate-300 font-medium cursor-pointer">
                Enable Test-Time Augmentation (TTA) with orthogonal flips and slight rotations (+0.005 AUC)
              </label>
            </div>

            <span className="text-[11px] text-emerald-400 font-mono font-semibold">
              Projected AUC: {simulatedAuc.toFixed(4)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
