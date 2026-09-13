import React from 'react';
import {
  X,
  Printer,
  FileText,
  CheckSquare,
  Square,
  Download,
  Eye,
  ShieldCheck,
  Layers,
  Sparkles
} from 'lucide-react';
import { PrintableClinicalReport, ReportData, PrintOptions } from './PrintableClinicalReport';

interface PrintCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPrint: () => void;
  onExportPdf?: () => void;
  reportData: ReportData;
  options: PrintOptions;
  onOptionsChange: (options: PrintOptions) => void;
}

export const PrintCustomizationModal: React.FC<PrintCustomizationModalProps> = ({
  isOpen,
  onClose,
  onConfirmPrint,
  onExportPdf,
  reportData,
  options,
  onOptionsChange
}) => {
  if (!isOpen) return null;

  const toggleOption = (key: keyof PrintOptions) => {
    onOptionsChange({
      ...options,
      [key]: !options[key]
    });
  };

  return (
    <div
      id="modal-print-customization"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-print"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0A0E17] border border-slate-700/80 rounded-2xl max-w-4xl w-full flex flex-col max-h-[92vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-[#070A10] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Print Diagnostic Clinical Report</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/60">
                  A4 / Letter Standard
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Choose output preferences before invoking the browser native destination selector (Save to PDF or Physical Printer).
              </p>
            </div>
          </div>

          <button
            id="btn-close-print-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Two columns (Left: Options & Settings, Right: Scaled Paper Preview) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-0 overflow-hidden">
          
          {/* Left Column: Preferences */}
          <div className="md:col-span-5 p-5 border-r border-slate-800/80 flex flex-col justify-between overflow-y-auto custom-scrollbar bg-[#080B12]">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Report Sections to Include</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Tailor the generated clinical document for institutional multidisciplinary rounds or electronic medical record archiving.
                </p>
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                {/* Key Slice Toggle */}
                <button
                  type="button"
                  onClick={() => toggleOption('includeKeySlice')}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    options.includeKeySlice !== false
                      ? 'bg-cyan-950/20 border-cyan-500/40 text-slate-100'
                      : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="mt-0.5 text-cyan-400">
                    {options.includeKeySlice !== false ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Active MRI Key Slice & Annotations</p>
                    <p className="text-[10.5px] text-slate-400">
                      Renders the center vector MRI cross-section with anatomical structures, Grad-CAM focus rings, and trajectory markers.
                    </p>
                  </div>
                </button>

                {/* 12-Target Matrix Toggle */}
                <button
                  type="button"
                  onClick={() => toggleOption('includeMatrix')}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    options.includeMatrix !== false
                      ? 'bg-cyan-950/20 border-cyan-500/40 text-slate-100'
                      : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="mt-0.5 text-cyan-400">
                    {options.includeMatrix !== false ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">12-Target Pathology Matrix</p>
                    <p className="text-[10.5px] text-slate-400">
                      Full multi-target table with model probability percentiles, primary imaging planes, and positive/normal classifications.
                    </p>
                  </div>
                </button>

                {/* Impression Toggle */}
                <button
                  type="button"
                  onClick={() => toggleOption('includeImpression')}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    options.includeImpression !== false
                      ? 'bg-cyan-950/20 border-cyan-500/40 text-slate-100'
                      : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="mt-0.5 text-cyan-400">
                    {options.includeImpression !== false ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Structured Radiological Impression</p>
                    <p className="text-[10.5px] text-slate-400">
                      Clinical NLP synthesized narrative, differential considerations, and recommended next orthopedic steps.
                    </p>
                  </div>
                </button>

                {/* Attestation Toggle */}
                <button
                  type="button"
                  onClick={() => toggleOption('includeAttestation')}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    options.includeAttestation !== false
                      ? 'bg-cyan-950/20 border-cyan-500/40 text-slate-100'
                      : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="mt-0.5 text-cyan-400">
                    {options.includeAttestation !== false ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Radiologist Attestation & Sign-off</p>
                    <p className="text-[10.5px] text-slate-400">
                      Attending physician verification statement, digital signature block, and cryptographic SHA-256 telemetry hash.
                    </p>
                  </div>
                </button>
              </div>

              {/* Tip callout */}
              <div className="p-2.5 rounded-lg bg-[#0F172A] border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  Tip: In the native system dialog, you can pick <strong>"Save as PDF"</strong> or your connected hardware printer.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Scaled Document Preview */}
          <div className="md:col-span-7 bg-[#05070B] p-4 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>Live Document Print Preview</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Scale: 100% standard layout
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar border border-slate-800 rounded-xl bg-slate-900/40 p-2 shadow-inner">
              <div className="bg-white rounded shadow-md overflow-hidden text-black transform origin-top transition-transform">
                <PrintableClinicalReport
                  data={{
                    ...reportData,
                    options
                  }}
                  isPreview={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#070A10] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            {onExportPdf && (
              <button
                type="button"
                onClick={() => {
                  onExportPdf();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                title="Direct PDF Download"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Download PDF File</span>
              </button>
            )}

            <button
              id="btn-confirm-system-print"
              type="button"
              onClick={() => {
                onClose();
                setTimeout(() => {
                  onConfirmPrint();
                }, 100);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Proceed to System Print Dialog</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
