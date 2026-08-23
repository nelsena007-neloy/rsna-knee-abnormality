import React, { useState } from 'react';
import { StudyInstance, AbnormalityKey } from '../types';
import { FileText, Edit3, CheckCircle2, Sparkles, CornerDownRight, AlertCircle, Sparkle, Download } from 'lucide-react';

interface ReportViewerProps {
  study: StudyInstance;
  onSelectAbnormality: (key: AbnormalityKey) => void;
  activeAbnormality?: AbnormalityKey | null;
  onCustomReportAnalyze?: (customReport: string) => void;
  onExportReport?: () => void;
  isAnalyzing?: boolean;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  study,
  onSelectAbnormality,
  activeAbnormality,
  onCustomReportAnalyze,
  onExportReport,
  isAnalyzing
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [customText, setCustomText] = useState<string>(
    `${study.report.clinicalHistory}\n\nFINDINGS:\nCruciate: ${study.report.findings.cruciateLigaments}\nCollateral: ${study.report.findings.collateralLigaments}\nMenisci: ${study.report.findings.menisci}\nCartilage: ${study.report.findings.articularCartilage}\nBones: ${study.report.findings.osseousStructures}\nFluid: ${study.report.findings.jointFluidSynovium}\n\nIMPRESSION:\n${study.report.impression.join('\n')}`
  );

  return (
    <div className="h-full flex flex-col min-h-0 bg-[#0A0E17] text-slate-100 overflow-hidden">
      {/* Header Bar */}
      <div className="px-3.5 py-2.5 border-b border-slate-800/80 bg-[#070A10] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-[#00E5FF15] text-[#00E5FF] border border-[#00E5FF33]">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider truncate">
              Clinical Indication & Reports
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              NLP Multimodal Visual Grounding
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onExportReport && (
            <button
              id="btn-report-viewer-export"
              onClick={onExportReport}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#00E5FF10] hover:bg-[#00E5FF22] text-[#00E5FF] border border-[#00E5FF44] transition-colors"
              title="Export Clinical Diagnostic Report"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}

          <button
            id="btn-toggle-report-edit"
            onClick={() => setIsEditing(prev => !prev)}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#0D131F] hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-colors"
          >
            <Edit3 className="w-3 h-3 text-[#00E5FF]" />
            <span>{isEditing ? 'View Report' : 'Edit Text'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Header Meta Bar: Compact dark grid displaying Case # | 24yo M | 3.0T Magnet */}
      <div className="grid grid-cols-4 gap-1.5 px-3 py-2 bg-[#06080B] border-b border-slate-800/80 text-[10px] shrink-0 font-mono">
        <div className="bg-[#0D131F] p-1.5 rounded border border-slate-800/80">
          <span className="text-[#64748B] block text-[9px] uppercase">Case ID</span>
          <span className="font-bold text-[#00E5FF] truncate block">{study.patientId}</span>
        </div>
        <div className="bg-[#0D131F] p-1.5 rounded border border-slate-800/80">
          <span className="text-[#64748B] block text-[9px] uppercase">Demographics</span>
          <span className="font-semibold text-white truncate block">{study.patientAge}yo {study.patientGender}</span>
        </div>
        <div className="bg-[#0D131F] p-1.5 rounded border border-slate-800/80">
          <span className="text-[#64748B] block text-[9px] uppercase">Laterality</span>
          <span className="font-semibold text-slate-200 truncate block">{study.kneeSide} Knee</span>
        </div>
        <div className="bg-[#0D131F] p-1.5 rounded border border-slate-800/80">
          <span className="text-[#64748B] block text-[9px] uppercase">Magnet</span>
          <span className="font-semibold text-[#00E5FF] truncate block">{study.magnetStrength}</span>
        </div>
      </div>

      {/* Scrollable Content Body (overflow-y-auto custom-scrollbar p-3 space-y-3 flex-1 min-h-0) */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 space-y-3 text-xs">
        {isEditing ? (
          <div className="space-y-3">
            <label className="block text-slate-300 font-bold text-xs">
              Custom Radiology Report (Editable NLP input):
            </label>
            <textarea
              id="textarea-custom-report"
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              rows={12}
              className="w-full bg-[#06080B] border border-slate-700/80 rounded-xl p-3 text-slate-200 font-mono text-xs focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] outline-none resize-none leading-relaxed"
              placeholder="Enter patient clinical history and MRI findings..."
            />
            <button
              id="btn-analyze-custom-report"
              onClick={() => onCustomReportAnalyze?.(customText)}
              disabled={isAnalyzing}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] hover:opacity-95 text-[#06080B] font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#00E5FF]/20 transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Extracting Multimodal Features...' : 'Analyze Custom Report with AI'}</span>
            </button>
          </div>
        ) : (
          <>
            {/* Card 1: Clinical Indication & History */}
            <div className="bg-[#0D131F] p-3 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                  Clinical Indication & History
                </span>
                <span className="text-[10px] text-cyan-400/80 font-mono">Acute Trauma</span>
              </div>
              <p className="text-slate-200 leading-relaxed font-sans text-xs">
                {study.report.clinicalHistory}
              </p>

              {/* Two-column sub-box: Technique vs. Comparison */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60 text-[10px]">
                <div className="bg-[#06080B] p-2 rounded-lg border border-slate-800/60">
                  <span className="text-[#64748B] font-bold block mb-0.5 uppercase text-[9px]">Technique:</span>
                  <p className="text-slate-300 truncate">{study.report.technique}</p>
                </div>
                <div className="bg-[#06080B] p-2 rounded-lg border border-slate-800/60">
                  <span className="text-[#64748B] font-bold block mb-0.5 uppercase text-[9px]">Comparison:</span>
                  <p className="text-slate-300 truncate">{study.report.comparison}</p>
                </div>
              </div>
            </div>

            {/* Card 2: Compartmental Findings */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                  Compartmental Findings
                </span>
                <span className="text-[10px] text-slate-500 font-mono">6 Sub-systems</span>
              </div>

              <div className="space-y-1.5">
                {/* Cruciate Ligaments (ACL / PCL) */}
                <div
                  onClick={() => onSelectAbnormality('ACL')}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    activeAbnormality === 'ACL'
                      ? 'bg-[#FF3B5C15] border-[#FF3B5C88] text-white shadow-sm'
                      : 'bg-[#0D131F] border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-[#FF3B5C] animate-pulse shrink-0"></span>
                      Cruciate Ligaments (ACL / PCL)
                    </span>
                    <span className="text-[10px] text-[#00E5FF] font-mono flex items-center gap-1">
                      Sagittal <CornerDownRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-slate-300 font-sans">
                    {study.report.findings.cruciateLigaments}
                  </p>
                </div>

                {/* Collateral Ligaments (MCL / LCL) */}
                <div
                  onClick={() => onSelectAbnormality('MCL')}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    activeAbnormality === 'MCL'
                      ? 'bg-amber-500/15 border-amber-500/70 text-white shadow-sm'
                      : 'bg-[#0D131F] border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                      Collateral Ligaments (MCL / LCL)
                    </span>
                    <span className="text-[10px] text-[#00E5FF] font-mono flex items-center gap-1">
                      Coronal <CornerDownRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-slate-300 font-sans">
                    {study.report.findings.collateralLigaments}
                  </p>
                </div>

                {/* Menisci (Medial & Lateral) */}
                <div
                  onClick={() => onSelectAbnormality('Medial Meniscus')}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    activeAbnormality === 'Medial Meniscus' || activeAbnormality === 'Lateral Meniscus'
                      ? 'bg-[#00E5FF15] border-[#00E5FF77] text-white shadow-sm'
                      : 'bg-[#0D131F] border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-[#00E5FF] shrink-0"></span>
                      Menisci (Medial & Lateral)
                    </span>
                    <span className="text-[10px] text-[#00E5FF] font-mono flex items-center gap-1">
                      Sag/Cor <CornerDownRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-slate-300 font-sans">
                    {study.report.findings.menisci}
                  </p>
                </div>

                {/* Articular Cartilage & OA */}
                <div
                  onClick={() => onSelectAbnormality('Medial OA')}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    activeAbnormality === 'Medial OA' || activeAbnormality === 'Lateral OA' || activeAbnormality === 'PF OA'
                      ? 'bg-purple-500/15 border-purple-500/70 text-white shadow-sm'
                      : 'bg-[#0D131F] border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0"></span>
                      Articular Cartilage & OA
                    </span>
                    <span className="text-[10px] text-[#00E5FF] font-mono flex items-center gap-1">
                      Axial/Cor <CornerDownRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-slate-300 font-sans">
                    {study.report.findings.articularCartilage}
                  </p>
                </div>

                {/* Osseous Structures (Contusion / Fracture) */}
                <div
                  onClick={() => onSelectAbnormality('Contusion')}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    activeAbnormality === 'Contusion' || activeAbnormality === 'Fracture'
                      ? 'bg-amber-500/15 border-amber-500/70 text-white shadow-sm'
                      : 'bg-[#0D131F] border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                      Osseous Structures (Contusion / Fracture)
                    </span>
                    <span className="text-[10px] text-[#00E5FF] font-mono flex items-center gap-1">
                      Sagittal <CornerDownRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-slate-300 font-sans">
                    {study.report.findings.osseousStructures}
                  </p>
                </div>

                {/* Fluid & Synovium (Effusion / Baker's) */}
                <div
                  onClick={() => onSelectAbnormality('Effusion')}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    activeAbnormality === 'Effusion' || activeAbnormality === 'Synovitis' || activeAbnormality === "Baker's"
                      ? 'bg-blue-500/15 border-blue-500/70 text-white shadow-sm'
                      : 'bg-[#0D131F] border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
                      Fluid & Synovium (Effusion / Baker's)
                    </span>
                    <span className="text-[10px] text-[#00E5FF] font-mono flex items-center gap-1">
                      Axial/Sag <CornerDownRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-slate-300 font-sans">
                    {study.report.findings.jointFluidSynovium}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Radiologist Diagnostic Impression */}
            <div className="bg-[#06080B] p-3 rounded-xl border border-[#00E5FF44] space-y-2">
              <div className="text-[10px] font-bold text-[#00E5FF] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00E5FF]" />
                Radiologist Diagnostic Impression
              </div>
              <ul className="space-y-1 text-slate-200 text-[11px] leading-relaxed">
                {study.report.impression.map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#00E5FF] font-mono font-bold shrink-0">•</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

