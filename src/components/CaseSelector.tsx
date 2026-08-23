import React, { useState } from 'react';
import { StudyInstance } from '../types';
import { User, Activity, AlertCircle, Upload, Plus, CheckCircle2, ChevronDown, FolderOpen } from 'lucide-react';

interface CaseSelectorProps {
  studies: StudyInstance[];
  selectedStudyId: string;
  onSelectStudy: (study: StudyInstance) => void;
  onCustomUpload?: (newStudy: Partial<StudyInstance>) => void;
}

export const CaseSelector: React.FC<CaseSelectorProps> = ({
  studies,
  selectedStudyId,
  onSelectStudy,
  onCustomUpload
}) => {
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [customAge, setCustomAge] = useState<number>(35);
  const [customGender, setCustomGender] = useState<'M' | 'F'>('M');
  const [customSide, setCustomSide] = useState<'Left' | 'Right'>('Right');
  const [customIndication, setCustomIndication] = useState<string>('Acute twisting knee trauma');
  const [customReportText, setCustomReportText] = useState<string>('');

  const currentStudy = studies.find(s => s.patientId === selectedStudyId) || studies[0];

  const handleCreateCustom = () => {
    const newUid = `1.2.826.0.1.3680043.8.498.custom.${Date.now()}`;
    const customStudy: StudyInstance = {
      studyInstanceUID: newUid,
      patientId: `USER-CASE-${Date.now().toString().slice(-4)}`,
      patientAge: customAge,
      patientGender: customGender,
      kneeSide: customSide,
      clinicalIndication: customIndication,
      studyDate: new Date().toISOString().split('T')[0],
      magnetStrength: '3.0T',
      difficulty: 'Standard',
      clinicalNotes: 'User-provided custom clinical study for multimodal evaluation.',
      report: {
        clinicalHistory: customIndication,
        technique: 'MRI 3.0T Knee multiplanar evaluation.',
        comparison: 'None.',
        findings: {
          cruciateLigaments: 'Evaluation pending.',
          collateralLigaments: 'Evaluation pending.',
          menisci: 'Evaluation pending.',
          articularCartilage: 'Evaluation pending.',
          osseousStructures: 'Evaluation pending.',
          jointFluidSynovium: 'Evaluation pending.'
        },
        impression: ['Clinical evaluation in progress.']
      },
      slices: currentStudy.slices,
      groundTruth: {
        'ACL': 0,
        'MCL': 0,
        'Medial Meniscus': 0,
        'Lateral Meniscus': 0,
        'Medial OA': 0,
        'Lateral OA': 0,
        'PF OA': 0,
        'Effusion': 0,
        'Synovitis': 0,
        "Baker's": 0,
        'Contusion': 0,
        'Fracture': 0
      }
    };

    onCustomUpload?.(customStudy);
    onSelectStudy(customStudy);
    setShowUploadModal(false);
  };

  return (
    <div className="bg-[#0A0E17] border border-slate-800/80 rounded-lg px-3 py-1.5 flex items-center justify-between gap-2 shrink-0">
      {/* Left: Study Selector Pill Carousel */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar flex-1 min-w-0 py-0.5">
        <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider shrink-0 flex items-center gap-1">
          <FolderOpen className="w-3 h-3 text-[#00E5FF]" />
          Cases:
        </span>

        {studies.map(study => {
          const isSelected = study.patientId === selectedStudyId;
          const positiveCount = Object.values(study.groundTruth).filter(v => v === 1).length;

          return (
            <button
              key={study.patientId}
              id={`case-selector-${study.patientId}`}
              onClick={() => onSelectStudy(study)}
              className={`px-2 py-1 rounded-md border text-[11px] shrink-0 flex items-center gap-1.5 transition-all ${
                isSelected
                  ? 'bg-[#00E5FF18] text-[#00E5FF] border-[#00E5FF] shadow-sm font-bold ring-1 ring-[#00E5FF]/40'
                  : 'bg-[#0D131F] text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              <span className="font-mono text-[10.5px]">{study.patientId}</span>
              <span className="text-[9.5px] text-slate-400">
                ({study.patientAge}y {study.patientGender})
              </span>
              <span
                className={`text-[9px] font-mono px-1 py-0.1 rounded font-bold ${
                  positiveCount > 0
                    ? 'bg-[#FF3B5C26] text-[#FF3B5C] border border-[#FF3B5C44]'
                    : 'bg-[#00E5FF15] text-[#00E5FF] border border-[#00E5FF33]'
                }`}
              >
                {positiveCount} Pos
              </span>
            </button>
          );
        })}
      </div>

      {/* Right: Add Custom Case Upload Button */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          id="btn-open-upload-study"
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0D131F] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-[11px] font-medium transition-colors"
        >
          <Plus className="w-3 h-3 text-[#00E5FF]" />
          <span>New Case</span>
        </button>
      </div>

      {/* Upload Custom Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0E17] border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#00E5FF]" />
                Upload New Clinical Knee MRI Study
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Patient Age:</label>
                <input
                  type="number"
                  value={customAge}
                  onChange={e => setCustomAge(Number(e.target.value))}
                  className="w-full bg-[#06080B] border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Gender:</label>
                <select
                  value={customGender}
                  onChange={e => setCustomGender(e.target.value as any)}
                  className="w-full bg-[#06080B] border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="M">Male (M)</option>
                  <option value="F">Female (F)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Laterality:</label>
                <select
                  value={customSide}
                  onChange={e => setCustomSide(e.target.value as any)}
                  className="w-full bg-[#06080B] border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="Right">Right Knee</option>
                  <option value="Left">Left Knee</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-slate-400 block">Clinical Indication:</label>
              <input
                type="text"
                value={customIndication}
                onChange={e => setCustomIndication(e.target.value)}
                placeholder="e.g. Non-contact twisting pivot injury playing soccer"
                className="w-full bg-[#06080B] border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-slate-400 block">Radiology Report Text / Findings:</label>
              <textarea
                value={customReportText}
                onChange={e => setCustomReportText(e.target.value)}
                rows={4}
                placeholder="Optional: Paste radiology report notes to run multimodal extraction..."
                className="w-full bg-[#06080B] border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustom}
                className="px-4 py-2 bg-[#00E5FF] text-[#06080B] font-bold rounded-xl text-xs shadow-md"
              >
                Load Study into Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
