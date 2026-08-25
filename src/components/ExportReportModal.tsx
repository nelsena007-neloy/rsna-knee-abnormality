import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StudyInstance, AbnormalityKey, PredictionResult, EnsembleConfig } from '../types';
import { ABNORMALITIES_META } from '../data/abnormalities';
import { exportStudyToPdf, exportStudyToJson, buildStructuredReportData } from '../utils/reportExporter';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  ShieldCheck,
  Sparkles,
  FileCode,
  Calendar,
  User,
  Activity,
  Layers
} from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  study: StudyInstance;
  predictions: Record<AbnormalityKey, number>;
  aiExplanation?: PredictionResult;
  ensembleConfig?: EnsembleConfig;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  study,
  predictions,
  aiExplanation,
  ensembleConfig
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const reportData = buildStructuredReportData(study, predictions, aiExplanation, ensembleConfig);

  const handleExportPdf = () => {
    try {
      exportStudyToPdf(study, predictions, aiExplanation, ensembleConfig);
      setDownloadSuccess('Clinical PDF Report generated & downloaded successfully!');
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (e) {
      console.error('Failed to export PDF:', e);
    }
  };

  const handleExportJson = () => {
    try {
      exportStudyToJson(study, predictions, aiExplanation, ensembleConfig);
      setDownloadSuccess('Structured JSON Diagnostic Package exported successfully!');
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (e) {
      console.error('Failed to export JSON:', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25 }}
          className="bg-[#0A0E17] border border-slate-700/80 rounded-2xl max-w-3xl w-full flex flex-col max-h-[90vh] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-800 bg-[#070A10] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#00E5FF15] text-[#00E5FF] border border-[#00E5FF33]">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Export Clinical Diagnostic Documentation
                </h3>
                <p className="text-[11px] text-slate-400">
                  Case {study.patientId} • {study.patientAge}yo {study.patientGender} • {study.kneeSide} Knee
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Success Banner if triggered */}
          {downloadSuccess && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-emerald-950/80 border-b border-emerald-800/80 px-4 py-2 text-emerald-300 text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{downloadSuccess}</span>
            </motion.div>
          )}

          {/* Body Content / Interactive Preview */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 space-y-4 text-xs">
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-[#0D131F] p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Patient Demographics</span>
                <span className="text-sm font-bold text-white block mt-0.5">{study.patientId}</span>
                <span className="text-[11px] text-slate-300">{study.patientAge}yo {study.patientGender} • {study.kneeSide} Knee</span>
              </div>
              <div className="bg-[#0D131F] p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Ingestion Stream & Fidelity</span>
                <span className="text-sm font-bold text-[#00E5FF] block mt-0.5 truncate">{study.magnetStrength} {study.sourceFidelity?.includes('16-bit') ? '16-bit PACS' : '8-bit Film'}</span>
                <span className="text-[11px] text-slate-300">{study.sourceFidelity || '16-bit Native Volumetric'}</span>
              </div>
              <div className="bg-[#0D131F] p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">RSNA Targets Evaluated</span>
                <span className="text-sm font-bold text-white block mt-0.5">12 Pathologies</span>
                <span className="text-[11px] text-slate-300">Macro AUC 0.942 Calibrated</span>
              </div>
            </div>

            {/* Pathology Prediction Summary Table */}
            <div className="bg-[#0D131F] rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-3.5 py-2 bg-[#06080B] border-b border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Target Pathology Matrix Preview (12 RSNA Conditions)
                </span>
                <span className="text-[10px] font-mono text-[#00E5FF]">Calibrated Posteriors</span>
              </div>
              <div className="divide-y divide-slate-800/80 max-h-48 overflow-y-auto custom-scrollbar">
                {reportData.aiPathologyMatrix.map((item, idx) => (
                  <div key={idx} className="px-3.5 py-2 flex items-center justify-between hover:bg-slate-800/40 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-slate-200">{item.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">({item.category})</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-[#00E5FF]">{item.probabilityPercent}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          item.classification === 'Positive'
                            ? 'bg-[#FF3B5C26] text-[#FF3B5C] border border-[#FF3B5C66]'
                            : item.classification === 'Equivocal'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-[#00E5FF15] text-[#00E5FF] border border-[#00E5FF33]'
                        }`}
                      >
                        {item.classification}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Impression & Findings Preview */}
            <div className="bg-[#0D131F] p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Radiologist Impression Summary
              </span>
              <ul className="space-y-1 text-slate-200 text-[11px]">
                {study.report.impression.map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#00E5FF] font-bold">•</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Clinical Rationale Callout if available */}
            {aiExplanation && (
              <div className="bg-[#06080B] p-3.5 rounded-xl border border-[#00E5FF44] space-y-1.5 text-xs">
                <div className="font-bold text-[#00E5FF] flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00E5FF]" />
                  AI Radiologist Reasoning ({aiExplanation.modelVariant})
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {aiExplanation.clinicalReasoning}
                </p>
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="px-5 py-3.5 bg-[#070A10] border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Report Ref: {reportData.reportHeader.reportId}
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-export-json-package"
                onClick={handleExportJson}
                className="px-3.5 py-2 rounded-xl bg-[#0D131F] hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <FileCode className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>Download JSON</span>
              </button>

              <button
                id="btn-export-pdf-report"
                onClick={handleExportPdf}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] hover:opacity-95 text-[#06080B] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#00E5FF]/20 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-[#06080B]" />
                <span>Download PDF Report</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
