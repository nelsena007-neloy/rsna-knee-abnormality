import React, { useState, useRef, useEffect } from 'react';
import { Activity, Sparkles, ChevronDown, Check, Plus, FolderOpen, Layers, BarChart3, Bot, FileText } from 'lucide-react';
import { StudyInstance } from '../types';

export type ActiveTab = 'viewer' | 'architecture' | 'leaderboard';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  studies: StudyInstance[];
  selectedStudyId: string;
  onSelectStudy: (study: StudyInstance) => void;
  onCustomUpload?: (newStudy: Partial<StudyInstance>) => void;
  macroAuc: number;
  onRunAiPrediction: () => void;
  isPredicting: boolean;
  onOpenCopilot?: () => void;
  onExportReport?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  studies,
  selectedStudyId,
  onSelectStudy,
  onCustomUpload,
  macroAuc,
  onRunAiPrediction,
  isPredicting,
  onOpenCopilot,
  onExportReport
}) => {
  const [isCaseMenuOpen, setIsCaseMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentStudy = studies.find(s => s.patientId === selectedStudyId) || studies[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCaseMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-12 shrink-0 border-b border-[#1E293B] bg-[#07090E] px-3.5 flex items-center justify-between z-40 select-none">
      {/* Left: Studio Icon + RSNA-OmniKnee + Compact Case Dropdown */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00E5FF] to-[#0077B6] p-0.5 flex items-center justify-center shadow-sm shadow-[#00E5FF]/20">
            <div className="w-full h-full bg-[#07090E] rounded-[6px] flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-[#00E5FF]" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-bold text-white tracking-tight">RSNA-OmniKnee</span>
            <span className="text-[9px] font-mono text-cyan-400/80 px-1 py-0.2 rounded bg-cyan-950/60 border border-cyan-800/40 hidden sm:inline">
              3.0T MSK
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Compact Case Dropdown [RSNA-KNEE-8891 (24yo M) ▾] */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="btn-case-dropdown-trigger"
            onClick={() => setIsCaseMenuOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0B0F19] hover:bg-[#111827] border border-[#1E293B] text-slate-200 text-xs font-mono transition-all hover:border-slate-700"
          >
            <span className="font-bold text-[#00E5FF]">{currentStudy.patientId}</span>
            <span className="text-[11px] text-slate-400">
              ({currentStudy.patientAge}yo {currentStudy.patientGender} • {currentStudy.kneeSide})
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {isCaseMenuOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-72 bg-[#0B0F19] border border-[#1E293B] rounded-xl shadow-2xl z-50 p-1.5 space-y-1 backdrop-blur-xl">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                <span>Select Clinical Study</span>
                <span className="text-[#00E5FF] font-mono">{studies.length} Loaded</span>
              </div>

              <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1 py-0.5">
                {studies.map(study => {
                  const isSelected = study.patientId === selectedStudyId;
                  const positiveCount = Object.values(study.groundTruth).filter(v => v === 1).length;

                  return (
                    <button
                      key={study.patientId}
                      id={`dropdown-case-${study.patientId}`}
                      onClick={() => {
                        onSelectStudy(study);
                        setIsCaseMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-all ${
                        isSelected
                          ? 'bg-[#00E5FF18] text-white border border-[#00E5FF55]'
                          : 'text-slate-300 hover:bg-[#111827] hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#00E5FF]">{study.patientId}</span>
                          <span className="text-[10px] text-slate-400">
                            {study.patientAge}y {study.patientGender} • {study.kneeSide}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate max-w-[190px]">
                          {study.clinicalIndication}
                        </p>
                      </div>

                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          positiveCount > 0
                            ? 'bg-rose-950/70 text-rose-400 border border-rose-800/50'
                            : 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40'
                        }`}
                      >
                        {positiveCount} Pos
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Minimal Segmented Control [Viewer | Architecture | Leaderboard] */}
      <nav className="hidden md:flex items-center gap-1 bg-[#0B0F19] p-0.5 rounded-lg border border-[#1E293B] text-xs">
        <button
          id="nav-tab-viewer"
          onClick={() => onTabChange('viewer')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'viewer'
              ? 'bg-[#00E5FF] text-[#07090E] shadow-sm font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Diagnostic Viewer</span>
        </button>

        <button
          id="nav-tab-architecture"
          onClick={() => onTabChange('architecture')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'architecture'
              ? 'bg-[#00E5FF] text-[#07090E] shadow-sm font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Architecture</span>
        </button>

        <button
          id="nav-tab-leaderboard"
          onClick={() => onTabChange('leaderboard')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-[#00E5FF] text-[#07090E] shadow-sm font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Leaderboard & Evaluation</span>
        </button>
      </nav>

      {/* Right: Monospace Pill [Macro-AUC: 0.9037] + Gradient Button [Run Inference] */}
      <div className="flex items-center gap-2 shrink-0">
        {onExportReport && (
          <button
            id="btn-nav-export-report"
            onClick={onExportReport}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0B0F19] hover:bg-[#111827] text-slate-300 border border-[#1E293B] text-xs font-medium transition-all"
            title="Export Structured Clinical Diagnostic PDF / JSON Report"
          >
            <FileText className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span className="hidden lg:inline text-[11px]">Export Report</span>
          </button>
        )}

        {onOpenCopilot && (
          <button
            id="btn-nav-copilot"
            onClick={onOpenCopilot}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0B0F19] hover:bg-[#111827] text-slate-300 border border-[#1E293B] text-xs font-medium transition-all"
            title="Open AI Radiologist Copilot Assistant"
          >
            <Bot className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span className="hidden xl:inline text-[11px]">Copilot</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0B0F19] border border-[#1E293B] font-mono text-xs">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Macro-AUC:</span>
          <span className="font-bold text-[#00E5FF]">{macroAuc.toFixed(4)}</span>
        </div>

        <button
          id="btn-run-inference"
          onClick={onRunAiPrediction}
          disabled={isPredicting}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] hover:opacity-95 text-[#07090E] font-bold text-xs shadow-md shadow-[#00E5FF]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isPredicting ? 'animate-spin' : ''}`} />
          <span>{isPredicting ? 'Inferencing...' : 'Run Inference'}</span>
        </button>
      </div>
    </header>
  );
};


