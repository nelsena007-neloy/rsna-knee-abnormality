import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AbnormalityKey, StudyInstance, PredictionResult } from '../types';
import { ABNORMALITIES_META, ALL_ABNORMALITY_KEYS } from '../data/abnormalities';
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
  Info
} from 'lucide-react';

interface DiagnosticIntelligencePaneProps {
  currentStudy: StudyInstance;
  predictions: Record<AbnormalityKey, number>;
  activeAbnormality?: AbnormalityKey | null;
  onSelectAbnormality: (key: AbnormalityKey) => void;
  aiExplanation?: PredictionResult | null;
  onOpenRecommendations?: () => void;
  onExportReport?: () => void;
  onCustomReportAnalyze?: (text: string) => void;
  isAnalyzing?: boolean;
}

// Group definitions for clean Apple-grade categorization
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
    id: 'joint_cartilage',
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

export const DiagnosticIntelligencePane: React.FC<DiagnosticIntelligencePaneProps> = ({
  currentStudy,
  predictions,
  activeAbnormality,
  onSelectAbnormality,
  aiExplanation,
  onOpenRecommendations,
  onExportReport,
  onCustomReportAnalyze,
  isAnalyzing
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'report'>('matrix');
  const [expandedKey, setExpandedKey] = useState<AbnormalityKey | null>(null);
  const [isEditingReport, setIsEditingReport] = useState<boolean>(false);
  const [customReportText, setCustomReportText] = useState<string>(
    `${currentStudy.report.clinicalHistory}\n\nFINDINGS:\nCruciate: ${currentStudy.report.findings.cruciateLigaments}\nCollateral: ${currentStudy.report.findings.collateralLigaments}\nMenisci: ${currentStudy.report.findings.menisci}\nCartilage: ${currentStudy.report.findings.articularCartilage}\nBones: ${currentStudy.report.findings.osseousStructures}\nFluid: ${currentStudy.report.findings.jointFluidSynovium}\n\nIMPRESSION:\n${currentStudy.report.impression.join('\n')}`
  );

  const positiveCount = ALL_ABNORMALITY_KEYS.filter(k => (predictions[k] ?? 0) >= 0.5).length;

  return (
    <div className="h-full flex flex-col min-h-0 bg-[#07090E] border-l border-[#1E293B] overflow-hidden select-none">
      {/* Top 2-Tab Segmented Switcher */}
      <div className="p-3 border-b border-[#1E293B] bg-[#07090E] shrink-0">
        <div className="grid grid-cols-2 gap-1 bg-[#0B0F19] p-1 rounded-xl border border-[#1E293B]">
          <button
            id="tab-btn-matrix"
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'matrix'
                ? 'bg-[#00E5FF] text-[#07090E] font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>12-Target Matrix</span>
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                activeTab === 'matrix'
                  ? 'bg-[#07090E]/20 text-[#07090E]'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {positiveCount} Pos
            </span>
          </button>

          <button
            id="tab-btn-report"
            onClick={() => setActiveTab('report')}
            className={`flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'report'
                ? 'bg-[#00E5FF] text-[#07090E] font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Radiology Report</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3">
        {activeTab === 'matrix' ? (
          /* TAB 1: 12-TARGET MATRIX */
          <div className="space-y-4">
            {TARGET_GROUPS.map(group => (
              <div key={group.id} className="space-y-1.5">
                {/* Group Heading */}
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1 flex items-center justify-between">
                  <span>{group.name}</span>
                  <span className="font-mono text-[9px] text-slate-600">{group.keys.length} Targets</span>
                </div>

                {/* Group Items */}
                <div className="space-y-1">
                  {group.keys.map(key => {
                    const meta = ABNORMALITIES_META[key];
                    const prob = predictions[key] ?? 0;
                    const isPositive = prob >= 0.5;
                    const isSelected = activeAbnormality === key;
                    const isExpanded = expandedKey === key;

                    return (
                      <div
                        key={key}
                        id={`row-target-${key}`}
                        className={`rounded-xl border transition-all overflow-hidden ${
                          isSelected
                            ? 'bg-[#00E5FF10] border-[#00E5FF66] shadow-sm shadow-[#00E5FF]/10'
                            : 'bg-[#0B0F19] hover:bg-[#111827] border-[#1E293B] hover:border-slate-750'
                        }`}
                      >
                        {/* Target Row Bar */}
                        <div
                          onClick={() => {
                            onSelectAbnormality(key);
                            setExpandedKey(prev => (prev === key ? null : key));
                          }}
                          className="p-2.5 flex items-center justify-between gap-2 cursor-pointer"
                        >
                          {/* Target Name & Primary Plane */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-slate-200 truncate">
                                {meta.shortName}
                              </span>
                              <span className="text-[9px] font-mono text-slate-500 uppercase px-1 py-0.2 rounded bg-slate-900 border border-slate-800 shrink-0">
                                {meta.primaryPlane}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {meta.clinicalSignificance}
                            </p>
                          </div>

                          {/* Right Side: Score & High-Risk Pill */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right font-mono">
                              <span
                                className={`text-xs font-bold ${
                                  isPositive ? 'text-rose-400' : 'text-slate-400'
                                }`}
                              >
                                {(prob * 100).toFixed(1)}%
                              </span>
                              <span className="block text-[9px] text-slate-600">
                                {prob.toFixed(4)}
                              </span>
                            </div>

                            {/* Status Pill */}
                            {isPositive ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-rose-950/80 text-rose-400 border border-rose-800/60 shadow-sm shadow-rose-950/50">
                                Positive
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-800">
                                Normal
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Expandable Clinical Intelligence Drawer */}
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1 border-t border-slate-800/80 bg-[#07090E]/60 text-xs space-y-2 text-slate-300">
                            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                              <div className="bg-[#0B0F19] p-2 rounded-lg border border-slate-800">
                                <span className="text-slate-500 block text-[9px] uppercase">Plane & Sequence</span>
                                <span className="text-[#00E5FF] font-semibold">{meta.primaryPlane} PD-FS</span>
                              </div>
                              <div className="bg-[#0B0F19] p-2 rounded-lg border border-slate-800">
                                <span className="text-slate-500 block text-[9px] uppercase">Urgency Tier</span>
                                <span className="text-slate-300 font-semibold">{meta.urgencyTier}</span>
                              </div>
                            </div>

                            <div className="bg-[#0B0F19] p-2 rounded-lg border border-slate-800 space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Clinical Radiologist Guidelines
                              </span>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                {meta.clinicalSignificance}. Visualized optimally on {meta.primaryPlane} views with soft tissue or fluid-sensitive MRI sequences.
                              </p>
                            </div>

                            <button
                              id={`btn-focus-viewer-${key}`}
                              onClick={() => onSelectAbnormality(key)}
                              className="w-full py-1.5 rounded-lg bg-[#00E5FF15] hover:bg-[#00E5FF25] text-[#00E5FF] font-bold text-xs border border-[#00E5FF44] flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Focus in Diagnostic Viewport</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* TAB 2: RADIOLOGY REPORT */
          <div className="space-y-4 text-slate-200">
            {/* Header / Actions Card */}
            <div className="bg-[#0B0F19] rounded-xl p-3.5 border border-[#1E293B] space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Diagnostic Report
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Case: {currentStudy.patientId} • {currentStudy.patientAge}yo {currentStudy.patientGender}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {onExportReport && (
                    <button
                      id="btn-report-pane-export"
                      onClick={onExportReport}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#00E5FF15] hover:bg-[#00E5FF25] text-[#00E5FF] border border-[#00E5FF44] flex items-center gap-1 transition-all"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export</span>
                    </button>
                  )}
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

              {/* Patient Demographics & Indication */}
              <div className="p-2.5 rounded-lg bg-[#07090E] border border-slate-800/80 text-xs space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Clinical Indication
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
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Compartmental Findings
                  </span>

                  <div className="space-y-2 text-slate-300">
                    <div
                      onClick={() => onSelectAbnormality('ACL')}
                      className="p-2 rounded-lg bg-[#07090E] hover:bg-[#111827] border border-slate-800/80 cursor-pointer transition-colors"
                    >
                      <span className="font-bold text-[#00E5FF] block text-[11px]">Cruciate Ligaments:</span>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {currentStudy.report.findings.cruciateLigaments}
                      </p>
                    </div>

                    <div
                      onClick={() => onSelectAbnormality('MCL')}
                      className="p-2 rounded-lg bg-[#07090E] hover:bg-[#111827] border border-slate-800/80 cursor-pointer transition-colors"
                    >
                      <span className="font-bold text-[#00E5FF] block text-[11px]">Collateral Ligaments:</span>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {currentStudy.report.findings.collateralLigaments}
                      </p>
                    </div>

                    <div
                      onClick={() => onSelectAbnormality('Medial Meniscus')}
                      className="p-2 rounded-lg bg-[#07090E] hover:bg-[#111827] border border-slate-800/80 cursor-pointer transition-colors"
                    >
                      <span className="font-bold text-[#00E5FF] block text-[11px]">Menisci:</span>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {currentStudy.report.findings.menisci}
                      </p>
                    </div>

                    <div
                      onClick={() => onSelectAbnormality('Medial OA')}
                      className="p-2 rounded-lg bg-[#07090E] hover:bg-[#111827] border border-slate-800/80 cursor-pointer transition-colors"
                    >
                      <span className="font-bold text-[#00E5FF] block text-[11px]">Articular Cartilage:</span>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {currentStudy.report.findings.articularCartilage}
                      </p>
                    </div>

                    <div
                      onClick={() => onSelectAbnormality('Contusion')}
                      className="p-2 rounded-lg bg-[#07090E] hover:bg-[#111827] border border-slate-800/80 cursor-pointer transition-colors"
                    >
                      <span className="font-bold text-[#00E5FF] block text-[11px]">Osseous Structures:</span>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {currentStudy.report.findings.osseousStructures}
                      </p>
                    </div>

                    <div
                      onClick={() => onSelectAbnormality('Effusion')}
                      className="p-2 rounded-lg bg-[#07090E] hover:bg-[#111827] border border-slate-800/80 cursor-pointer transition-colors"
                    >
                      <span className="font-bold text-[#00E5FF] block text-[11px]">Joint Fluid & Synovium:</span>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {currentStudy.report.findings.jointFluidSynovium}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Impression Section */}
                <div className="bg-[#0B0F19] rounded-xl p-3.5 border border-[#1E293B] space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Diagnostic Impression
                  </span>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 text-xs">
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
        )}
      </div>

      {/* Bottom Clinical Actions Strip */}
      <div className="p-2.5 border-t border-[#1E293B] bg-[#07090E] shrink-0 flex items-center gap-2">
        {onExportReport && (
          <button
            id="btn-pane-bottom-export"
            onClick={onExportReport}
            className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#00E5FF15] hover:bg-[#00E5FF25] text-[#00E5FF] border border-[#00E5FF44] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (PDF / JSON)</span>
          </button>
        )}

        {onOpenRecommendations && (
          <button
            id="btn-pane-bottom-recommendations"
            onClick={onOpenRecommendations}
            className="py-1.5 px-2.5 rounded-lg bg-[#0B0F19] hover:bg-[#111827] text-slate-300 border border-[#1E293B] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
            title="View Orthopedic Guidelines & Recommendations"
          >
            <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Pathways</span>
          </button>
        )}
      </div>
    </div>
  );
};
