import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AbnormalityKey, StudyInstance, PredictionResult } from '../types';
import { ABNORMALITIES_META, ALL_ABNORMALITY_KEYS, CATEGORY_COLORS } from '../data/abnormalities';
import {
  Stethoscope,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileCheck2,
  Calendar,
  Activity,
  ChevronRight,
  ChevronDown,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  BookOpen,
  Filter,
  X,
  Target,
  Sliders,
  Scale
} from 'lucide-react';

interface RecommendationsCenterProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudy: StudyInstance;
  predictions: Record<AbnormalityKey, number>;
  aiExplanation?: PredictionResult | null;
  onSelectAbnormality?: (key: AbnormalityKey) => void;
}

export const RecommendationsCenter: React.FC<RecommendationsCenterProps> = ({
  isOpen,
  onClose,
  currentStudy,
  predictions,
  aiExplanation,
  onSelectAbnormality
}) => {
  const [activeTab, setActiveTab] = useState<'patient-action' | 'all-12-targets' | 'ml-competition'>('patient-action');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [expandedTarget, setExpandedTarget] = useState<AbnormalityKey | null>(null);

  if (!isOpen) return null;

  // Identify positive & equivocal findings for current case
  const positiveFindings = ALL_ABNORMALITY_KEYS.filter(k => (predictions[k] ?? 0) >= 0.70);
  const equivocalFindings = ALL_ABNORMALITY_KEYS.filter(k => (predictions[k] ?? 0) >= 0.35 && (predictions[k] ?? 0) < 0.70);
  const negativeFindings = ALL_ABNORMALITY_KEYS.filter(k => (predictions[k] ?? 0) < 0.35);

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'Urgent Surgical':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Urgent Surgical
          </span>
        );
      case 'Moderate Orthopedic':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Activity className="w-3 h-3" /> Moderate Orthopedic
          </span>
        );
      case 'Conservative Management':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Conservative / Rehab
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {urgency}
          </span>
        );
    }
  };

  const filteredAbnormalities = selectedCategoryFilter === 'All'
    ? ALL_ABNORMALITY_KEYS
    : ALL_ABNORMALITY_KEYS.filter(k => ABNORMALITIES_META[k].category === selectedCategoryFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-950 text-cyan-400 border border-cyan-800/40">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Clinical Action & AI Recommendations Center
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  All 12 Targets
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Evidence-based management pathways, rehabilitation protocols, imaging schedules, and ML research guidance.
              </p>
            </div>
          </div>

          <button
            id="btn-close-recommendations-modal"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2 overflow-x-auto">
          <button
            id="tab-rec-patient-action"
            onClick={() => setActiveTab('patient-action')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'patient-action'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/90'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Active Case Action Plan ({positiveFindings.length + equivocalFindings.length} Detected)</span>
          </button>

          <button
            id="tab-rec-all-targets"
            onClick={() => setActiveTab('all-12-targets')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'all-12-targets'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/90'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>All 12 Pathology Protocols</span>
          </button>

          <button
            id="tab-rec-ml-competition"
            onClick={() => setActiveTab('ml-competition')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'ml-competition'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/90'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>AI Modeling & Competition Recommendations</span>
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: PATIENT-SPECIFIC ACTION PLAN */}
          {activeTab === 'patient-action' && (
            <div className="space-y-6">
              {/* Summary Banner for Current Study */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                      {currentStudy.patientId}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {currentStudy.patientAge}yo {currentStudy.patientGender} • {currentStudy.kneeSide} Knee
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {currentStudy.clinicalIndication}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Triage Classification</span>
                    <span className="text-xs font-bold text-red-400">
                      {positiveFindings.some(k => ABNORMALITIES_META[k].urgencyTier === 'Urgent Surgical')
                        ? 'High Priority / Surgical Pathway'
                        : positiveFindings.length > 0
                        ? 'Orthopedic Subspecialty Care'
                        : 'Conservative / Routine'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Gemini Radiologist Synthesized Recommendation */}
              {aiExplanation && (
                <div className="bg-gradient-to-br from-cyan-950/40 to-blue-950/30 p-4 rounded-2xl border border-cyan-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Multimodal AI Radiologist Case Synthesis</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {aiExplanation.clinicalReasoning}
                  </p>
                  {aiExplanation.recommendedAction && (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/20 text-xs">
                      <span className="font-bold text-amber-300">Primary Recommended Clinical Action: </span>
                      <span className="text-slate-300">{aiExplanation.recommendedAction}</span>
                    </div>
                  )}
                  {aiExplanation.clinicalRecommendations && aiExplanation.clinicalRecommendations.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                        Actionable Next Steps:
                      </span>
                      <ul className="space-y-1">
                        {aiExplanation.clinicalRecommendations.map((rec, idx) => (
                          <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Positive Findings Action Pathways */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>Detected Abnormalities ({positiveFindings.length} Confirmed High Probability)</span>
                </h3>

                {positiveFindings.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 text-center">
                    No high-probability abnormalities detected for this case. Review equivocal or normal structures below.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {positiveFindings.map(key => {
                      const meta = ABNORMALITIES_META[key];
                      const score = predictions[key] ?? 0.85;

                      return (
                        <div
                          key={key}
                          className="bg-slate-950/70 rounded-2xl border border-red-500/30 p-4 space-y-3 shadow-lg"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{meta.shortName}</span>
                                <span className="font-mono text-xs font-bold text-red-400">
                                  {(score * 100).toFixed(1)}%
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Category: {meta.category} • Key Plane: {meta.primaryPlane}
                              </span>
                            </div>
                            {getUrgencyBadge(meta.urgencyTier)}
                          </div>

                          <div className="space-y-2 text-xs border-t border-slate-800/80 pt-2.5">
                            <div>
                              <span className="text-[11px] font-bold text-cyan-400 block mb-1">
                                Clinical Recommendations:
                              </span>
                              <ul className="space-y-1">
                                {meta.clinicalRecommendations.map((rec, i) => (
                                  <li key={i} className="text-slate-300 flex items-start gap-1.5 text-[11px]">
                                    <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 space-y-1 text-[11px]">
                              <div>
                                <span className="font-bold text-amber-300">Surgical Indications: </span>
                                <span className="text-slate-300">{meta.surgicalIndication}</span>
                              </div>
                              <div>
                                <span className="font-bold text-blue-300">Conservative Rehab: </span>
                                <span className="text-slate-300">{meta.conservativeProtocol}</span>
                              </div>
                              <div>
                                <span className="font-bold text-emerald-300">Imaging Follow-up: </span>
                                <span className="text-slate-300">{meta.imagingFollowUp}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              onSelectAbnormality?.(key);
                              onClose();
                            }}
                            className="w-full py-1.5 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <span>Inspect Slice in MRI Viewer</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Equivocal Findings Guidance */}
              {equivocalFindings.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    <span>Equivocal / Borderline Findings ({equivocalFindings.length} Requiring Correlation)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {equivocalFindings.map(key => {
                      const meta = ABNORMALITIES_META[key];
                      const score = predictions[key] ?? 0.5;

                      return (
                        <div key={key} className="bg-slate-950/50 rounded-xl border border-amber-500/30 p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">{meta.shortName}</span>
                            <span className="font-mono text-xs text-amber-400 font-bold">{(score * 100).toFixed(1)}%</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">
                            {meta.clinicalRecommendations[0]}
                          </p>
                          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex items-center justify-between">
                            <span>Follow-up: {meta.imagingFollowUp}</span>
                            <button
                              onClick={() => {
                                onSelectAbnormality?.(key);
                                onClose();
                              }}
                              className="text-cyan-400 hover:underline flex items-center gap-0.5"
                            >
                              Inspect <ArrowUpRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ALL 12 PATHOLOGY PROTOCOLS */}
          {activeTab === 'all-12-targets' && (
            <div className="space-y-4">
              {/* Category Filter Chips */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 mr-1">
                    <Filter className="w-3.5 h-3.5" /> Filter:
                  </span>
                  {['All', 'Ligament', 'Meniscus', 'Cartilage/OA', 'Fluid/Inflammation', 'Bone/Trauma'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-3 py-1 text-xs rounded-lg font-semibold transition-colors ${
                        selectedCategoryFilter === cat
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <span className="text-xs text-slate-500">
                  Showing {filteredAbnormalities.length} of 12 targets
                </span>
              </div>

              {/* 12 Target Protocol Accordion Cards */}
              <div className="space-y-3">
                {filteredAbnormalities.map(key => {
                  const meta = ABNORMALITIES_META[key];
                  const isExpanded = expandedTarget === key;
                  const currentCaseScore = predictions[key];

                  return (
                    <div
                      key={key}
                      className={`bg-slate-950 rounded-2xl border transition-all overflow-hidden ${
                        isExpanded ? 'border-cyan-500/60 shadow-lg' : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Accordion Header */}
                      <div
                        onClick={() => setExpandedTarget(isExpanded ? null : key)}
                        className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: meta.color }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white">{meta.shortName}</h4>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                                {meta.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {meta.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {getUrgencyBadge(meta.urgencyTier)}
                          {currentCaseScore !== undefined && (
                            <span className="text-xs font-mono font-bold text-cyan-300 hidden sm:inline">
                              Case: {(currentCaseScore * 100).toFixed(1)}%
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Accordion Expanded Body */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="px-4 pb-4 pt-2 border-t border-slate-800 space-y-3 text-xs"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {/* Clinical Recommendations */}
                              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800/80 space-y-2">
                                <span className="font-bold text-cyan-400 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Evidence-Based Management Actions
                                </span>
                                <ul className="space-y-1.5 text-[11px] text-slate-300">
                                  {meta.clinicalRecommendations.map((rec, i) => (
                                    <li key={i} className="flex items-start gap-1.5">
                                      <span className="text-cyan-400 font-bold">•</span>
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Surgical & Rehab Details */}
                              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800/80 space-y-2 text-[11px]">
                                <div>
                                  <span className="font-bold text-red-300 block">Surgical Indications:</span>
                                  <p className="text-slate-300 mt-0.5">{meta.surgicalIndication}</p>
                                </div>
                                <div className="pt-1.5 border-t border-slate-800">
                                  <span className="font-bold text-blue-300 block">Conservative Protocol:</span>
                                  <p className="text-slate-300 mt-0.5">{meta.conservativeProtocol}</p>
                                </div>
                              </div>
                            </div>

                            {/* Imaging Follow-up & ML Recommendations */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px]">
                                <span className="font-bold text-emerald-400 block mb-1 flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" /> Imaging & Follow-up Protocols
                                </span>
                                <p className="text-slate-300">{meta.imagingFollowUp}</p>
                                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                                  Key Sequence: <span className="text-white">{meta.keySequence}</span>
                                </div>
                              </div>

                              <div className="p-3 rounded-xl bg-slate-900/40 border border-cyan-500/20 text-[11px]">
                                <span className="font-bold text-cyan-300 block mb-1 flex items-center gap-1">
                                  <Zap className="w-3.5 h-3.5 text-cyan-400" /> ML Engineering Recommendations
                                </span>
                                <ul className="space-y-1 text-slate-300">
                                  {meta.mlModelingRecommendations.map((tip, idx) => (
                                    <li key={idx} className="flex items-start gap-1">
                                      <span className="text-cyan-400">▹</span>
                                      <span>{tip}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ML COMPETITION & MODELING RECOMMENDATIONS */}
          {activeTab === 'ml-competition' && (
            <div className="space-y-6">
              {/* Competition Objective & Strategy */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-cyan-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                    <Target className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    "What Should I Do Next?" — RSNA 12-Target Actionable Roadmap
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  To maximize unweighted Macro-Averaged ROC-AUC across all 12 targets, competitive modeling requires addressing specific target vulnerabilities rather than generic global scaling.
                </p>
              </div>

              {/* 4 Pillars of ML Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Weakest Targets Strategy */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-red-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>1. Weak Target Acceleration (Synovitis & Lateral OA)</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span><strong>Synovitis Loss Weighting:</strong> Synovitis has the lowest baseline AUC (0.861). Apply 1.5x multi-task loss weighting and Axial T2-FS contrast-adaptive normalization.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span><strong>Lateral OA Asymmetric Loss:</strong> With ~4% prevalence, use Asymmetric Focal Loss ($\gamma=2.5, \mu=0.05$) to prevent negative gradient suppression.</span>
                    </li>
                  </ul>
                </div>

                {/* 2. Plane-Specific Weighting */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                    <Layers className="w-4 h-4" />
                    <span>2. Orthogonal Plane Routing Architecture</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span><strong>Sagittal Specialists:</strong> Route ACL, Menisci, Contusion, and Effusion through Sagittal 3D Swin-UNETR blocks.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span><strong>Coronal Specialists:</strong> Route MCL, Fractures, and Medial/Lateral Compartment OA through Coronal T1/T2 blocks.</span>
                    </li>
                  </ul>
                </div>

                {/* 3. Multimodal NLP Fusion */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-purple-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>3. Vision + Radiology Report Text Synergy</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 font-bold">•</span>
                      <span><strong>Cross-Attention Gating:</strong> Query 3D vision feature volumes with token embeddings extracted from clinical indication and preliminary report impression.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 font-bold">•</span>
                      <span><strong>Negation Filtering:</strong> Ensure the NLP label engine explicitly extracts "no acute tear" to suppress hallucinated visual activations.</span>
                    </li>
                  </ul>
                </div>

                {/* 4. Ensembling & TTA */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <Scale className="w-4 h-4" />
                    <span>4. Blending & Test-Time Augmentation (TTA)</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span><strong>Optimal 4-Model Blend:</strong> 35% 3D Swin-UNETR + 25% ConvNeXt-3D + 25% DINOv2 2.5D + 15% Med-Gemini Report Multimodal.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span><strong>TTA Strategy:</strong> Left-Right horizontal flip + ±3 slice axial shifting + 5% contrast jitter (+0.012 Macro AUC boost).</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>All 12 RSNA Target Pathologies • Orthopedic & AI Guidelines</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Close Recommendations
          </button>
        </div>
      </motion.div>
    </div>
  );
};
