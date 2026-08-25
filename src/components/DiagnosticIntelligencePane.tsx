import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AbnormalityKey, StudyInstance, PredictionResult, ModelSettingsConfig, StructuredMskCopilotResponse, ViewPlane } from '../types';
import { ABNORMALITIES_META, ALL_ABNORMALITY_KEYS, ABNORMALITY_KEY_SLICES } from '../data/abnormalities';
import { exportStudyToPdf } from '../utils/reportExporter';
import {
  Activity,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Stethoscope,
  ChevronRight,
  Download,
  Edit3,
  Check,
  RotateCcw,
  Layers,
  ArrowUpRight,
  Info,
  Sliders,
  Code2,
  Copy,
  Cpu,
  ShieldCheck,
  Zap,
  Filter,
  CheckCheck
} from 'lucide-react';

interface DiagnosticIntelligencePaneProps {
  currentStudy: StudyInstance;
  predictions: Record<AbnormalityKey, number>;
  activeAbnormality?: AbnormalityKey | null;
  onSelectAbnormality: (key: AbnormalityKey, plane?: ViewPlane, sliceIndex?: number) => void;
  onJumpToSlice?: (plane: ViewPlane, sliceIndex: number, abnormality: AbnormalityKey) => void;
  aiExplanation?: PredictionResult | null;
  onOpenRecommendations?: () => void;
  onExportReport?: () => void;
  onCustomReportAnalyze?: (text: string) => void;
  isAnalyzing?: boolean;
  modelSettings?: ModelSettingsConfig;
  onUpdateModelSettings?: (settings: Partial<ModelSettingsConfig>) => void;
  onCloseSidebar?: () => void;
}

// Group definitions for clean categorization
const TARGET_GROUPS: {
  id: string;
  name: string;
  keys: AbnormalityKey[];
}[] = [
  {
    id: 'ligaments',
    name: 'Ligamentous Complex',
    keys: ['ACL', 'MCL']
  },
  {
    id: 'menisci',
    name: 'Meniscal Cartilage',
    keys: ['Medial Meniscus', 'Lateral Meniscus']
  },
  {
    id: 'cartilage_bone',
    name: 'Cartilage, Osseous & Joint',
    keys: [
      'Medial OA',
      'Lateral OA',
      'PF OA',
      'Effusion',
      'Synovitis',
      "Baker's",
      'Contusion',
      'Fracture'
    ]
  }
];

const STRUCTURED_JSON_SCHEMA_TEXT = `{
  "type": "object",
  "properties": {
    "study_id": { "type": "string" },
    "primary_diagnosis": { "type": "string" },
    "macro_risk_level": { 
      "type": "string", 
      "enum": ["Critical / High Risk", "Moderate / Borderline", "Unremarkable / Negative"] 
    },
    "anatomical_findings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "target": { "type": "string" },
          "status": { "type": "string" },
          "confidence_score": { "type": "number" },
          "optimal_plane": { "type": "string", "enum": ["Sagittal", "Coronal", "Axial"] },
          "key_slice_index": { "type": "integer" },
          "radiological_evidence": { "type": "string" }
        },
        "required": ["target", "status", "confidence_score", "optimal_plane", "key_slice_index", "radiological_evidence"]
      }
    },
    "copilot_rationale": { "type": "string" },
    "clinical_management_protocol": { "type": "string" }
  },
  "required": [
    "study_id",
    "primary_diagnosis",
    "macro_risk_level",
    "anatomical_findings",
    "copilot_rationale",
    "clinical_management_protocol"
  ]
}`;

export type MatrixFilterType = 'all' | 'abnormal' | 'ligaments' | 'menisci' | 'cartilage_bone';

export const DiagnosticIntelligencePane: React.FC<DiagnosticIntelligencePaneProps> = ({
  currentStudy,
  predictions,
  activeAbnormality,
  onSelectAbnormality,
  onJumpToSlice,
  aiExplanation,
  onOpenRecommendations,
  onExportReport,
  onCustomReportAnalyze,
  isAnalyzing,
  modelSettings = {
    selectedModel: 'gemini-2.5-pro',
    temperature: 0.1,
    topP: 0.85,
    responseFormat: 'JSON'
  },
  onUpdateModelSettings,
  onCloseSidebar
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'report' | 'settings'>('matrix');
  const [matrixFilter, setMatrixFilter] = useState<MatrixFilterType>('all');
  const [expandedKey, setExpandedKey] = useState<AbnormalityKey | null>(null);
  const [isEditingReport, setIsEditingReport] = useState<boolean>(false);
  const [copiedSchema, setCopiedSchema] = useState<boolean>(false);
  const [copiedStructuredJson, setCopiedStructuredJson] = useState<boolean>(false);
  const [pdfGenerating, setPdfGenerating] = useState<boolean>(false);
  const [customReportText, setCustomReportText] = useState<string>(
    `${currentStudy.report.clinicalHistory}\n\nFINDINGS:\nCruciate: ${currentStudy.report.findings.cruciateLigaments}\nCollateral: ${currentStudy.report.findings.collateralLigaments}\nMenisci: ${currentStudy.report.findings.menisci}\nCartilage: ${currentStudy.report.findings.articularCartilage}\nBones: ${currentStudy.report.findings.osseousStructures}\nFluid: ${currentStudy.report.findings.jointFluidSynovium}\n\nIMPRESSION:\n${currentStudy.report.impression.join('\n')}`
  );

  // Filter calculations
  const abnormalTargets = ALL_ABNORMALITY_KEYS.filter(k => (predictions[k] ?? 0) >= 0.40);
  const abnormalCount = abnormalTargets.length;
  const positiveCount = ALL_ABNORMALITY_KEYS.filter(k => (predictions[k] ?? 0) >= 0.50).length;

  const ligamentKeys: AbnormalityKey[] = ['ACL', 'MCL'];
  const meniscusKeys: AbnormalityKey[] = ['Medial Meniscus', 'Lateral Meniscus'];
  const cartilageBoneKeys: AbnormalityKey[] = [
    'Medial OA',
    'Lateral OA',
    'PF OA',
    'Effusion',
    'Synovitis',
    "Baker's",
    'Contusion',
    'Fracture'
  ];

  const handleCopySchema = () => {
    navigator.clipboard.writeText(STRUCTURED_JSON_SCHEMA_TEXT);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleOneClickDownloadPdf = () => {
    setPdfGenerating(true);
    try {
      exportStudyToPdf(currentStudy, predictions, aiExplanation || undefined);
      setTimeout(() => setPdfGenerating(false), 1200);
    } catch (e) {
      console.error('PDF generation error:', e);
      setPdfGenerating(false);
    }
  };

  const handleCardInteraction = (key: AbnormalityKey) => {
    const meta = ABNORMALITIES_META[key];
    const sliceInfo = ABNORMALITY_KEY_SLICES[key] || { plane: meta.primaryPlane, slice: 12 };
    
    if (onJumpToSlice) {
      onJumpToSlice(sliceInfo.plane, sliceInfo.slice, key);
    } else {
      onSelectAbnormality(key, sliceInfo.plane, sliceInfo.slice);
    }
    setExpandedKey(prev => (prev === key ? null : key));
  };

  const structuredData: StructuredMskCopilotResponse = aiExplanation?.structuredCopilotOutput || {
    study_id: currentStudy.studyInstanceUID || currentStudy.patientId,
    primary_diagnosis: aiExplanation?.differentialDiagnosis?.[0] || (currentStudy.groundTruth.ACL ? 'Complete ACL Midsubstance Disruption' : 'Multicompartment Evaluation Complete'),
    macro_risk_level: positiveCount >= 2 ? 'Critical / High Risk' : positiveCount === 1 ? 'Moderate / Borderline' : 'Unremarkable / Negative',
    anatomical_findings: ALL_ABNORMALITY_KEYS.map(key => {
      const meta = ABNORMALITIES_META[key];
      const score = predictions[key] ?? 0;
      const sliceInfo = ABNORMALITY_KEY_SLICES[key] || { plane: meta.primaryPlane, slice: 12 };
      return {
        target: key,
        status: score >= 0.70 ? 'Definite Pathology / Disrupted' : score >= 0.35 ? 'Equivocal / Low-grade Irregularity' : 'Intact / Normal Baseline',
        confidence_score: Number(score.toFixed(4)),
        optimal_plane: meta.primaryPlane,
        key_slice_index: sliceInfo.slice,
        radiological_evidence: `${meta.shortName} demonstrates ${score >= 0.70 ? 'focal high T2/PD signal hyperintensity with structural fiber discontinuity' : score >= 0.35 ? 'mild contour blunting and low-grade periligamentous signal' : 'preserved low-signal intensity and morphological continuity'}.`
      };
    }),
    copilot_rationale: aiExplanation?.clinicalReasoning || `Multimodal triplanar evaluation of patient ${currentStudy.patientId} confirms anatomic concordance across Sagittal PD-FS, Coronal T2, and Axial series.`,
    clinical_management_protocol: aiExplanation?.recommendedAction || 'Orthopedic sports medicine consultation with protected weight-bearing.'
  };

  const handleCopyStructuredOutput = () => {
    navigator.clipboard.writeText(JSON.stringify(structuredData, null, 2));
    setCopiedStructuredJson(true);
    setTimeout(() => setCopiedStructuredJson(false), 2000);
  };

  // Determine filtered groups to render
  const getFilteredGroups = () => {
    if (matrixFilter === 'all') {
      return TARGET_GROUPS;
    }
    if (matrixFilter === 'abnormal') {
      return [
        {
          id: 'abnormal_findings',
          name: 'Abnormal & Borderline Findings',
          keys: abnormalTargets
        }
      ];
    }
    if (matrixFilter === 'ligaments') {
      return [
        {
          id: 'ligaments',
          name: 'Ligamentous Complex',
          keys: ligamentKeys
        }
      ];
    }
    if (matrixFilter === 'menisci') {
      return [
        {
          id: 'menisci',
          name: 'Meniscal Cartilage',
          keys: meniscusKeys
        }
      ];
    }
    if (matrixFilter === 'cartilage_bone') {
      return [
        {
          id: 'cartilage_bone',
          name: 'Cartilage, Osseous & Joint',
          keys: cartilageBoneKeys
        }
      ];
    }
    return TARGET_GROUPS;
  };

  const filteredGroups = getFilteredGroups();

  return (
    <div className="h-full flex flex-col min-h-0 bg-[#080C14] border-l border-slate-800 overflow-hidden select-none">
      {/* Header Bar with Panel Hide Action */}
      <div className="px-3.5 py-2.5 border-b border-slate-800 bg-[#07090E] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Diagnostic Analysis</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 font-bold">
            12 TARGETS
          </span>
        </div>
        {onCloseSidebar && (
          <button
            id="btn-hide-analysis-panel"
            onClick={onCloseSidebar}
            className="text-xs text-slate-400 hover:text-[#00E5FF] flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Collapse Sidebar (100% Viewport Mode)"
          >
            <span>Hide Panel</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Top 3-Tab Segmented Switcher */}
      <div className="p-3 border-b border-slate-800 bg-[#07090E] shrink-0">
        <div className="grid grid-cols-3 gap-1.5 bg-[#0B0F19] p-1 rounded-xl border border-slate-800">
          <button
            id="tab-btn-matrix"
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'matrix'
                ? 'bg-[#00E5FF] text-[#07090E] font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            <span className="truncate">12-Target Matrix</span>
            <span
              className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                activeTab === 'matrix'
                  ? 'bg-[#07090E]/20 text-[#07090E]'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {abnormalCount > 0 ? abnormalCount : positiveCount}
            </span>
          </button>

          <button
            id="tab-btn-report"
            onClick={() => setActiveTab('report')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'report'
                ? 'bg-[#00E5FF] text-[#07090E] font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="truncate">Radiology Report</span>
          </button>

          <button
            id="tab-btn-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-[#00E5FF] text-[#07090E] font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
            title="Model Settings & Parameters (Gemini Pro/Flash, Temp 0.1, JSON Schema)"
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span className="truncate">Model Config</span>
          </button>
        </div>
      </div>

      {/* QUICK-FILTER TRIAGE RIBBON (Only displayed when Matrix tab is active) */}
      {activeTab === 'matrix' && (
        <div className="px-3 py-2 border-b border-slate-800/80 bg-[#07090E]/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
            {/* 1. All (12) */}
            <button
              id="filter-chip-all"
              onClick={() => setMatrixFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                matrixFilter === 'all'
                  ? 'bg-[#00E5FF] text-[#07090E] shadow-sm'
                  : 'bg-[#0B0F19] text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              <span>All</span>
              <span className={`font-mono text-[10px] px-1 py-0.2 rounded ${matrixFilter === 'all' ? 'bg-[#07090E]/20 text-[#07090E]' : 'bg-slate-800 text-slate-300'}`}>
                12
              </span>
            </button>

            {/* 2. ⚠️ Abnormal Only (X) */}
            <button
              id="filter-chip-abnormal"
              onClick={() => setMatrixFilter('abnormal')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                matrixFilter === 'abnormal'
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-950 font-bold'
                  : abnormalCount > 0
                  ? 'bg-rose-950/40 text-rose-300 border border-rose-500/40 hover:border-rose-500/70'
                  : 'bg-[#0B0F19] text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <span>⚠️ Abnormal Only</span>
              <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-bold ${
                matrixFilter === 'abnormal'
                  ? 'bg-white/20 text-white'
                  : abnormalCount > 0
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {abnormalCount}
              </span>
            </button>

            {/* 3. Ligaments (2) */}
            <button
              id="filter-chip-ligaments"
              onClick={() => setMatrixFilter('ligaments')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                matrixFilter === 'ligaments'
                  ? 'bg-[#00E5FF] text-[#07090E] shadow-sm'
                  : 'bg-[#0B0F19] text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              <span>Ligaments</span>
              <span className={`font-mono text-[10px] px-1 py-0.2 rounded ${matrixFilter === 'ligaments' ? 'bg-[#07090E]/20 text-[#07090E]' : 'bg-slate-800 text-slate-300'}`}>
                2
              </span>
            </button>

            {/* 4. Menisci (2) */}
            <button
              id="filter-chip-menisci"
              onClick={() => setMatrixFilter('menisci')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                matrixFilter === 'menisci'
                  ? 'bg-[#00E5FF] text-[#07090E] shadow-sm'
                  : 'bg-[#0B0F19] text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              <span>Menisci</span>
              <span className={`font-mono text-[10px] px-1 py-0.2 rounded ${matrixFilter === 'menisci' ? 'bg-[#07090E]/20 text-[#07090E]' : 'bg-slate-800 text-slate-300'}`}>
                2
              </span>
            </button>

            {/* 5. Cartilage & Bone (8) */}
            <button
              id="filter-chip-cartilage"
              onClick={() => setMatrixFilter('cartilage_bone')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                matrixFilter === 'cartilage_bone'
                  ? 'bg-[#00E5FF] text-[#07090E] shadow-sm'
                  : 'bg-[#0B0F19] text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              <span>Cartilage & Bone</span>
              <span className={`font-mono text-[10px] px-1 py-0.2 rounded ${matrixFilter === 'cartilage_bone' ? 'bg-[#07090E]/20 text-[#07090E]' : 'bg-slate-800 text-slate-300'}`}>
                8
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {activeTab === 'matrix' ? (
          /* TAB 1: 12-TARGET MATRIX WITH INTERACTIVE SYNC & ACCESSIBLE TYPOGRAPHY */
          <div className="space-y-4">
            {filteredGroups.length === 0 || (filteredGroups.length === 1 && filteredGroups[0].keys.length === 0) ? (
              <div className="bg-[#0B0F19] rounded-xl p-6 text-center border border-slate-800 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">All Compartments Within Normal Limits</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  No positive or borderline abnormalities detected for this case.
                </p>
                <button
                  onClick={() => setMatrixFilter('all')}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-[#00E5FF15] text-[#00E5FF] text-xs font-bold border border-[#00E5FF33]"
                >
                  View All 12 Targets
                </button>
              </div>
            ) : (
              filteredGroups.map(group => (
                <div key={group.id} className="space-y-2">
                  {/* Category Superheader */}
                  <div className="text-[11px] font-bold tracking-wider uppercase text-cyan-400/90 px-1 flex items-center justify-between">
                    <span>{group.name}</span>
                    <span className="font-mono text-xs text-slate-400">{group.keys.length} Targets</span>
                  </div>

                  {/* Group Items */}
                  <div className="space-y-2.5">
                    {group.keys.map(key => {
                      const meta = ABNORMALITIES_META[key];
                      const prob = predictions[key] ?? 0;
                      const isSelected = activeAbnormality === key;
                      const isExpanded = expandedKey === key;
                      const sliceInfo = ABNORMALITY_KEY_SLICES[key] || { plane: meta.primaryPlane, slice: 12 };

                      // 3-State Clinical Visual Triage System
                      const isHighRisk = prob >= 0.70;
                      const isBorderline = prob >= 0.40 && prob < 0.70;
                      const isNormal = prob < 0.40;

                      let cardClasses = 'p-3.5 rounded-xl border transition-all overflow-hidden cursor-pointer group hover:shadow-lg ';
                      if (isSelected) {
                        cardClasses += 'bg-[#00E5FF15] border-[#00E5FF] shadow-md shadow-[#00E5FF]/10 ring-1 ring-[#00E5FF]/50';
                      } else if (isHighRisk) {
                        cardClasses += 'border-rose-500/50 bg-rose-950/15 hover:border-rose-500/80 shadow-sm';
                      } else if (isBorderline) {
                        cardClasses += 'border-amber-500/40 bg-amber-950/15 hover:border-amber-500/60 shadow-sm';
                      } else {
                        cardClasses += 'border-slate-800/90 bg-[#0B0F19] hover:bg-[#111827] hover:border-slate-700';
                      }

                      return (
                        <div
                          key={key}
                          id={`row-target-${key}`}
                          className={cardClasses}
                          onClick={() => handleCardInteraction(key)}
                        >
                          {/* Row 1: Target Title (15px Bold White) + Plane Pill (Left) & Prob (17px Monospace) + Badge (Right) */}
                          <div className="flex items-center justify-between gap-3">
                            {/* Left: Target Title (15px) & Plane Pill */}
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[15px] font-bold text-white tracking-tight truncate group-hover:text-[#00E5FF] transition-colors">
                                {meta.shortName}
                              </span>
                              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded uppercase shrink-0">
                                {meta.primaryPlane}
                              </span>
                            </div>

                            {/* Right: Big Metric (17px Monospace) & Triage Badges */}
                            <div className="flex items-center gap-2.5 shrink-0">
                              <span
                                className={`text-[17px] font-mono font-bold tracking-wide tabular-nums ${
                                  isHighRisk
                                    ? 'text-rose-400'
                                    : isBorderline
                                    ? 'text-amber-400'
                                    : 'text-[#00E599]'
                                }`}
                              >
                                {(prob * 100).toFixed(1)}%
                              </span>

                              {/* Triage Status Badges with Precise Clinical Wording */}
                              {isHighRisk ? (
                                <span className="text-xs font-bold px-3 py-1 rounded-md bg-[#FF3B5C26] text-[#FF3B5C] border border-[#FF3B5C66] shadow-[0_0_12px_rgba(255,59,92,0.35)] whitespace-nowrap">
                                  ● Acute Tear Detected
                                </span>
                              ) : isBorderline ? (
                                <span className="text-xs font-semibold px-3 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/45 whitespace-nowrap">
                                  ● Borderline / Monitor
                                </span>
                              ) : (
                                <span className="text-xs font-bold px-3 py-1 rounded-md bg-emerald-500/15 text-[#00E599] border border-emerald-500/40 whitespace-nowrap">
                                  ● Within Normal Limits
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Row 2: Pathology Explanatory Subtext (13px High-Contrast Slate, no squishing) */}
                          <p className="text-[13px] font-normal text-slate-300 leading-normal mt-1.5 block">
                            {meta.clinicalSignificance}
                          </p>

                          {/* Row 3: Interactive Sync Action Bar & Jump Tag */}
                          <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                            <span className="text-[11px] font-mono text-slate-400">
                              Seq: <span className="text-slate-200 font-semibold">{meta.keySequence}</span>
                            </span>

                            {/* Interactive Jump Tag: [ Jump to Slice X ↗ ] */}
                            <button
                              id={`btn-jump-slice-${key}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCardInteraction(key);
                              }}
                              className="text-[11px] font-mono font-bold text-[#00E5FF] bg-[#00E5FF12] hover:bg-[#00E5FF25] border border-[#00E5FF44] hover:border-[#00E5FF] px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all shadow-sm group-hover:scale-105"
                              title={`Jump to ${sliceInfo.plane} Slice ${sliceInfo.slice} with CAM Heatmap`}
                            >
                              <span>Jump to Slice {sliceInfo.slice}</span>
                              <ArrowUpRight className="w-3.5 h-3.5 text-[#00E5FF]" />
                            </button>
                          </div>

                          {/* Expandable Clinical Intelligence Drawer */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-slate-800/80 bg-[#07090E]/80 rounded-lg p-3 text-xs space-y-3 text-slate-200">
                              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                <div className="bg-[#0B0F19] p-2.5 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Optimal Plane</span>
                                  <span className="text-[#00E5FF] font-bold text-xs">{sliceInfo.plane} (Slice {sliceInfo.slice})</span>
                                </div>
                                <div className="bg-[#0B0F19] p-2.5 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Urgency Tier</span>
                                  <span className="text-slate-100 font-semibold text-xs">{meta.urgencyTier}</span>
                                </div>
                              </div>

                              <div className="bg-[#0B0F19] p-2.5 rounded-lg border border-slate-800 space-y-1">
                                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                                  Clinical Guidelines & Rationale
                                </span>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                  {meta.description}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  id={`btn-focus-drawer-${key}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCardInteraction(key);
                                  }}
                                  className="flex-1 py-2 rounded-lg bg-[#00E5FF] text-[#07090E] font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#00E5FF]/20 transition-all hover:brightness-110"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Sync Viewport & CAM Overlay</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'report' ? (
          /* TAB 2: RADIOLOGY REPORT */
          <div className="space-y-4 text-slate-200">
            {/* Header / Actions Card */}
            <div className="bg-[#0B0F19] rounded-xl p-3.5 border border-[#1E293B] space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Diagnostic Report
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Case: {currentStudy.patientId} • {currentStudy.patientAge}yo {currentStudy.patientGender}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    id="btn-report-pane-pdf"
                    onClick={handleOneClickDownloadPdf}
                    disabled={pdfGenerating}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#00E5FF15] hover:bg-[#00E5FF25] text-[#00E5FF] border border-[#00E5FF44] flex items-center gap-1 transition-all"
                    title="Download Structured Radiology PDF"
                  >
                    <Download className="w-3 h-3" />
                    <span>{pdfGenerating ? 'Generating...' : 'PDF'}</span>
                  </button>
                  <button
                    id="btn-report-pane-edit"
                    onClick={() => setIsEditingReport(p => !p)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    title="Edit Report"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Patient Demographics, Indication & Ingestion Provenance */}
              <div className="p-2.5 rounded-lg bg-[#07090E] border border-slate-800/80 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Clinical Indication
                  </div>
                  <span
                    className={`text-[9.5px] font-mono px-2 py-0.5 rounded-full border ${
                      currentStudy.sourceFidelity?.includes('16-bit') || currentStudy.ingestionStream === 'PACS_DICOM' || (!currentStudy.sourceFidelity && !currentStudy.ingestionStream)
                        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-950/70 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {currentStudy.sourceFidelity || '16-bit Native Volumetric'}
                  </span>
                </div>
                <p className="text-slate-300 font-medium leading-relaxed">
                  {currentStudy.clinicalIndication}
                </p>
              </div>
            </div>

            {/* Editable or Formatted Report View */}
            {isEditingReport ? (
              <div className="bg-[#0B0F19] rounded-xl p-3.5 border border-[#1E293B] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Edit Clinical Report Narrative</span>
                  <button
                    onClick={() => setIsEditingReport(false)}
                    className="text-xs text-[#00E5FF] hover:underline"
                  >
                    Done
                  </button>
                </div>
                <textarea
                  value={customReportText}
                  onChange={e => setCustomReportText(e.target.value)}
                  rows={14}
                  className="w-full bg-[#07090E] border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:border-[#00E5FF] outline-none"
                />
                {onCustomReportAnalyze && (
                  <button
                    onClick={() => onCustomReportAnalyze(customReportText)}
                    disabled={isAnalyzing}
                    className="w-full py-2 rounded-lg bg-[#00E5FF] text-[#07090E] font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAnalyzing ? 'Re-analyzing with Gemini...' : 'Analyze with Gemini NLP'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-xs leading-relaxed">
                {/* Findings Section */}
                <div className="bg-[#0B0F19] rounded-xl p-3.5 border border-[#1E293B] space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Compartmental Findings
                  </span>

                  <div className="space-y-2 text-slate-300">
                    <div
                      onClick={() => handleCardInteraction('ACL')}
                      className="p-2.5 rounded-lg bg-[#07090E] hover:bg-[#111827] border border-slate-800/80 cursor-pointer transition-colors"
                    >
                      <span className="font-bold text-[#00E5FF] block text-[12px]">Cruciate Ligaments:</span>
                      <p className="text-[12px] text-slate-300 mt-0.5">
                        {currentStudy.report.findings.cruciateLigaments}
                      </p>
                    </div>

                    <div
                      onClick={() => handleCardInteraction('MCL')}
                      className="p-2.5 rounded-lg bg-[#07090E] hover:bg-[#111827] border border-slate-800/80 cursor-pointer transition-colors"
                    >
                      <span className="font-bold text-[#00E5FF] block text-[12px]">Collateral Ligaments:</span>
                      <p className="text-[12px] text-slate-300 mt-0.5">
                        {currentStudy.report.findings.collateralLigaments}
                      </p>
                    </div>

                    <div
                      onClick={() => handleCardInteraction('Medial Meniscus')}
                      className="p-2.5 rounded-lg bg-[#07090E] hover:bg-[#111827] border border-slate-800/80 cursor-pointer transition-colors"
                    >
                      <span className="font-bold text-[#00E5FF] block text-[12px]">Menisci:</span>
                      <p className="text-[12px] text-slate-300 mt-0.5">
                        {currentStudy.report.findings.menisci}
                      </p>
                    </div>

                    <div
                      onClick={() => handleCardInteraction('Medial OA')}
                      className="p-2.5 rounded-lg bg-[#07090E] hover:bg-[#111827] border border-slate-800/80 cursor-pointer transition-colors"
                    >
                      <span className="font-bold text-[#00E5FF] block text-[12px]">Articular Cartilage:</span>
                      <p className="text-[12px] text-slate-300 mt-0.5">
                        {currentStudy.report.findings.articularCartilage}
                      </p>
                    </div>

                    <div
                      onClick={() => handleCardInteraction('Contusion')}
                      className="p-2.5 rounded-lg bg-[#07090E] hover:bg-[#111827] border border-slate-800/80 cursor-pointer transition-colors"
                    >
                      <span className="font-bold text-[#00E5FF] block text-[12px]">Osseous Structures:</span>
                      <p className="text-[12px] text-slate-300 mt-0.5">
                        {currentStudy.report.findings.osseousStructures}
                      </p>
                    </div>

                    <div
                      onClick={() => handleCardInteraction('Effusion')}
                      className="p-2.5 rounded-lg bg-[#07090E] hover:bg-[#111827] border border-slate-800/80 cursor-pointer transition-colors"
                    >
                      <span className="font-bold text-[#00E5FF] block text-[12px]">Joint Fluid & Synovium:</span>
                      <p className="text-[12px] text-slate-300 mt-0.5">
                        {currentStudy.report.findings.jointFluidSynovium}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Impression Section */}
                <div className="bg-[#0B0F19] rounded-xl p-3.5 border border-[#1E293B] space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Diagnostic Impression
                  </span>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-200 text-xs">
                    {currentStudy.report.impression.map((item, idx) => (
                      <li key={idx} className="font-medium">
                        {item}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* TAB 3: MODEL SETTINGS & PARAMETERS */
          <div className="space-y-4 text-xs">
            {/* Header Banner */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#0B0F19] to-[#111827] border border-cyan-900/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#00E5FF] font-bold text-xs">
                  <Cpu className="w-4 h-4" />
                  <span>Model Settings & Parameters</span>
                </div>
                <span className="text-[9.5px] font-mono font-bold bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/50">
                  AI Studio Specs
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Deterministic clinical-grade inference configuration with JSON Structured Outputs enabled.
              </p>
            </div>

            {/* 1. Model Selector */}
            <div className="bg-[#0B0F19] rounded-xl p-3 border border-[#1E293B] space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Active Gemini Foundation Model</span>
                <span className="font-mono text-[#00E5FF] text-[9.5px]">Multi-modal</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-model-pro"
                  onClick={() => onUpdateModelSettings?.({ selectedModel: 'gemini-2.5-pro' })}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    modelSettings.selectedModel === 'gemini-2.5-pro' || modelSettings.selectedModel === 'gemini-1.5-pro'
                      ? 'bg-[#00E5FF]/10 border-[#00E5FF] text-white shadow-sm shadow-cyan-950'
                      : 'bg-[#07090E] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-white">Gemini Pro</span>
                    {modelSettings.selectedModel.includes('pro') && <Check className="w-3.5 h-3.5 text-[#00E5FF]" />}
                  </div>
                  <p className="text-[9.5px] text-slate-400 mt-1 leading-snug">
                    Complex multi-image reasoning & report synthesis
                  </p>
                </button>

                <button
                  id="btn-model-flash"
                  onClick={() => onUpdateModelSettings?.({ selectedModel: 'gemini-2.5-flash' })}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    modelSettings.selectedModel === 'gemini-2.5-flash' || modelSettings.selectedModel === 'gemini-1.5-flash'
                      ? 'bg-[#00E5FF]/10 border-[#00E5FF] text-white shadow-sm shadow-cyan-950'
                      : 'bg-[#07090E] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-white">Gemini Flash</span>
                    {modelSettings.selectedModel.includes('flash') && <Check className="w-3.5 h-3.5 text-[#00E5FF]" />}
                  </div>
                  <p className="text-[9.5px] text-slate-400 mt-1 leading-snug">
                    High-speed real-time UI scrubbing & low latency
                  </p>
                </button>
              </div>
            </div>

            {/* 2. Temperature (0.1) & Top P (0.85) */}
            <div className="bg-[#0B0F19] rounded-xl p-3 border border-[#1E293B] space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300">Temperature</span>
                  <span className="font-mono font-bold text-[#00E5FF] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {modelSettings.temperature.toFixed(2)} (Deterministic)
                  </span>
                </div>
                <input
                  id="range-temperature"
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={modelSettings.temperature}
                  onChange={(e) => onUpdateModelSettings?.({ temperature: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#00E5FF]"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                  <span>0.0 (Clinical Fixed)</span>
                  <span className="text-[#00E5FF] font-semibold">0.1 (Optimal MSK)</span>
                  <span>1.0 (Creative)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300">Top P</span>
                  <span className="font-mono font-bold text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {modelSettings.topP.toFixed(2)}
                  </span>
                </div>
                <input
                  id="range-topp"
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={modelSettings.topP}
                  onChange={(e) => onUpdateModelSettings?.({ topP: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#00E5FF]"
                />
              </div>
            </div>

            {/* 3. Response Format & Schema Inspector */}
            <div className="bg-[#0B0F19] rounded-xl p-3 border border-[#1E293B] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-300 font-bold text-xs">
                  <Code2 className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>Response Format: JSON Schema</span>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                  Structured Outputs Enabled
                </span>
              </div>

              {/* JSON Schema Box */}
              <div className="relative">
                <button
                  id="btn-copy-schema"
                  onClick={handleCopySchema}
                  className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium flex items-center gap-1 z-10"
                  title="Copy Schema JSON"
                >
                  {copiedSchema ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSchema ? 'Copied' : 'Copy'}</span>
                </button>

                <pre className="p-2.5 bg-[#07090E] rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300 max-h-44 overflow-y-auto custom-scrollbar">
                  {STRUCTURED_JSON_SCHEMA_TEXT}
                </pre>
              </div>
            </div>

            {/* 4. Live Structured Output Inspector */}
            <div className="bg-[#0B0F19] rounded-xl p-3 border border-[#1E293B] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-300 font-bold text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Live Structured Output Payload</span>
                </div>
                <button
                  id="btn-copy-live-json"
                  onClick={handleCopyStructuredOutput}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium flex items-center gap-1"
                >
                  {copiedStructuredJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedStructuredJson ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Macro Risk Level Badge */}
              <div className="p-2.5 rounded-lg bg-[#07090E] border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Macro Risk Level:</span>
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                    structuredData.macro_risk_level === 'Critical / High Risk'
                      ? 'bg-rose-950 text-rose-300 border-rose-600/50'
                      : structuredData.macro_risk_level === 'Moderate / Borderline'
                      ? 'bg-amber-950 text-amber-300 border-amber-600/50'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-600/50'
                  }`}>
                    {structuredData.macro_risk_level}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-slate-200">
                  {structuredData.primary_diagnosis}
                </div>
              </div>

              {/* Full JSON Viewer */}
              <pre className="p-2.5 bg-[#07090E] rounded-lg border border-slate-800 font-mono text-[10px] text-emerald-300/90 max-h-56 overflow-y-auto custom-scrollbar">
                {JSON.stringify(structuredData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* ONE-CLICK STRUCTURED EXPORT & ACTION FOOTER */}
      <div className="p-3 border-t border-slate-800 bg-[#07090E] shrink-0 space-y-2">
        {/* Primary 1-Click PDF Action Button */}
        <button
          id="btn-one-click-pdf-summary"
          onClick={handleOneClickDownloadPdf}
          disabled={pdfGenerating}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] hover:opacity-95 text-[#07090E] font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#00E5FF]/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          <Download className={`w-4 h-4 ${pdfGenerating ? 'animate-bounce' : ''}`} />
          <span>{pdfGenerating ? 'Compiling 1-Page Summary...' : '📄 Download Structured Radiology Summary (PDF)'}</span>
        </button>

        <div className="flex items-center gap-2">
          {onExportReport && (
            <button
              id="btn-pane-bottom-export"
              onClick={onExportReport}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#0B0F19] hover:bg-[#111827] text-slate-300 border border-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>Full Export Hub (JSON/DICOM)</span>
            </button>
          )}

          {onOpenRecommendations && (
            <button
              id="btn-pane-bottom-recommendations"
              onClick={onOpenRecommendations}
              className="py-1.5 px-2.5 rounded-lg bg-[#0B0F19] hover:bg-[#111827] text-slate-300 border border-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
              title="View Orthopedic Guidelines & Recommendations"
            >
              <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pathways</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

