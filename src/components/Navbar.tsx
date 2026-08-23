import React from 'react';
import { Activity, Layers, BarChart3, FileSpreadsheet, Bot, Sparkles, Stethoscope } from 'lucide-react';

export type ActiveTab = 'viewer' | 'architecture' | 'evaluation' | 'submission';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenCopilot: () => void;
  onRunAiPrediction: () => void;
  onOpenRecommendations?: () => void;
  isPredicting: boolean;
  macroAuc: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenCopilot,
  onRunAiPrediction,
  onOpenRecommendations,
  isPredicting,
  macroAuc
}) => {
  return (
    <header className="h-14 shrink-0 border-b border-slate-800/80 bg-[#090D14]/90 backdrop-blur px-4 flex items-center justify-between z-30 select-none">
      {/* Left Cluster */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00E5FF] to-[#0077B6] p-0.5 shadow-lg shadow-[#00E5FF]/20 flex items-center justify-center shrink-0">
          <div className="w-full h-full bg-[#06080B] rounded-[6px] flex items-center justify-center">
            <Activity className="w-4 h-4 text-[#00E5FF]" />
          </div>
        </div>

        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-tight leading-none">
              RSNA Knee AI Studio
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#00E5FF22] text-[#00E5FF] border border-[#00E5FF44] leading-none">
              Challenge 2026
            </span>
          </div>
          <span className="text-[10px] text-[#64748B] tracking-normal leading-tight truncate mt-0.5 hidden sm:block">
            Multimodal Knee Abnormality Detection • 12 Clinical Targets
          </span>
        </div>
      </div>

      {/* Center Navigation Segmented Control */}
      <nav className="hidden md:flex items-center gap-1 bg-[#0D131F]/90 p-1 rounded-xl border border-slate-800/80 text-xs">
        <button
          id="nav-tab-viewer"
          onClick={() => onTabChange('viewer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'viewer'
              ? 'bg-[#00E5FF] text-[#06080B] shadow-sm shadow-[#00E5FF]/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Diagnostic Viewer</span>
        </button>

        <button
          id="nav-tab-architecture"
          onClick={() => onTabChange('architecture')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'architecture'
              ? 'bg-[#00E5FF] text-[#06080B] shadow-sm shadow-[#00E5FF]/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Model Architecture</span>
        </button>

        <button
          id="nav-tab-evaluation"
          onClick={() => onTabChange('evaluation')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'evaluation'
              ? 'bg-[#00E5FF] text-[#06080B] shadow-sm shadow-[#00E5FF]/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>ROC-AUC Matrix ({macroAuc.toFixed(3)})</span>
        </button>

        <button
          id="nav-tab-submission"
          onClick={() => onTabChange('submission')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'submission'
              ? 'bg-[#00E5FF] text-[#06080B] shadow-sm shadow-[#00E5FF]/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Submission & LB</span>
        </button>
      </nav>

      {/* Right Cluster */}
      <div className="flex items-center gap-2 shrink-0">
        {onOpenRecommendations && (
          <button
            id="btn-navbar-recommendations"
            onClick={onOpenRecommendations}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#00E5FF55] bg-[#00E5FF10] hover:bg-[#00E5FF22] text-[#00E5FF] text-xs font-bold transition-all"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clinical Recommendations</span>
          </button>
        )}

        <button
          id="btn-run-ai-inference"
          onClick={onRunAiPrediction}
          disabled={isPredicting}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] hover:opacity-95 text-[#06080B] font-bold text-xs shadow-md shadow-[#00E5FF]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isPredicting ? 'animate-spin' : 'animate-pulse'}`} />
          <span>{isPredicting ? 'Inferencing...' : 'Run Gemini AI Inference'}</span>
        </button>

        <button
          id="btn-open-copilot"
          onClick={onOpenCopilot}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0D131F] hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-colors"
          title="Open AI Radiologist Copilot"
        >
          <Bot className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span className="hidden lg:inline">AI Copilot</span>
        </button>
      </div>
    </header>
  );
};

