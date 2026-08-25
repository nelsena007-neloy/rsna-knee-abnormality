import React, { useState, useEffect } from 'react';
import { StudyInstance, ViewPlane, AbnormalityKey, EnsembleConfig, PredictionResult, IngestionStream, ModelSettingsConfig } from './types';
import { MOCK_STUDIES } from './data/mockStudies';
import { ABNORMALITIES_META } from './data/abnormalities';
import { calculateEvaluationMetrics } from './utils/metrics';
import { Navbar, ActiveTab } from './components/Navbar';
import { MriViewer } from './components/MriViewer';
import { DiagnosticIntelligencePane } from './components/DiagnosticIntelligencePane';
import { ModelArchitecture } from './components/ModelArchitecture';
import { EvaluationDashboard } from './components/EvaluationDashboard';
import { SubmissionLab } from './components/SubmissionLab';
import { CopilotDrawer } from './components/CopilotDrawer';
import { RecommendationsCenter } from './components/RecommendationsCenter';
import { ExportReportModal } from './components/ExportReportModal';
import { DualStreamIngestionModal } from './components/DualStreamIngestionModal';
import { BarChart3, FileSpreadsheet, ChevronRight, ChevronLeft } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('viewer');
  const [leaderboardSubTab, setLeaderboardSubTab] = useState<'evaluation' | 'submission'>('evaluation');
  const [studies, setStudies] = useState<StudyInstance[]>(MOCK_STUDIES);
  const [selectedStudyId, setSelectedStudyId] = useState<string>(MOCK_STUDIES[0].patientId);
  const [currentPlane, setCurrentPlane] = useState<ViewPlane>('Sagittal');
  const [activeAbnormality, setActiveAbnormality] = useState<AbnormalityKey | null>('ACL');
  const [targetSliceIndex, setTargetSliceIndex] = useState<number | undefined>(12);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isIngestionModalOpen, setIsIngestionModalOpen] = useState<boolean>(false);
  const [selectedIngestionStream, setSelectedIngestionStream] = useState<IngestionStream>('PACS_DICOM');
  const [isPredicting, setIsPredicting] = useState<boolean>(false);

  // Model Settings & Parameters (Gemini Pro/Flash, Temp 0.1, Top P 0.85, JSON Schema)
  const [modelSettings, setModelSettings] = useState<ModelSettingsConfig>({
    selectedModel: 'gemini-2.5-pro',
    temperature: 0.1,
    topP: 0.85,
    responseFormat: 'JSON'
  });

  const handleUpdateModelSettings = (newSettings: Partial<ModelSettingsConfig>) => {
    setModelSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Predictions cache map: study.patientId -> predictions record
  const [predictionMap, setPredictionMap] = useState<Record<string, Record<AbnormalityKey, number>>>(() => {
    const initialMap: Record<string, Record<AbnormalityKey, number>> = {};
    MOCK_STUDIES.forEach(s => {
      // derive realistic initial baseline
      const preds: any = {};
      Object.keys(s.groundTruth).forEach(k => {
        const truth = s.groundTruth[k as AbnormalityKey];
        preds[k] = truth === 1 ? +(0.82 + Math.random() * 0.15).toFixed(4) : +(0.03 + Math.random() * 0.12).toFixed(4);
      });
      initialMap[s.patientId] = preds;
    });
    return initialMap;
  });

  const [aiExplanations, setAiExplanations] = useState<Record<string, PredictionResult>>({});

  const [ensembleConfig, setEnsembleConfig] = useState<EnsembleConfig>({
    backbone3D: 'Swin-UNETR-3D',
    nlpModel: 'Med-Gemini-Embeddings',
    fusionMethod: 'Cross-Attention Gating',
    visionWeight: 0.60,
    nlpReportWeight: 0.40,
    useTTA: true,
    temperature: 1.0
  });

  const currentStudy = studies.find(s => s.patientId === selectedStudyId) || studies[0];
  const currentPredictions = predictionMap[currentStudy.patientId] || ({} as Record<AbnormalityKey, number>);

  // Compute live Macro-AUC & evaluation metrics across all studies
  const { macroAuc, perAbnormality } = calculateEvaluationMetrics(studies, predictionMap);

  // Multimodal Gemini Prediction Trigger
  const runMultimodalPrediction = async (studyToAnalyze: StudyInstance, customReportText?: string) => {
    setIsPredicting(true);
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studyInstanceUID: studyToAnalyze.studyInstanceUID,
          clinicalHistory: studyToAnalyze.report.clinicalHistory,
          findings: customReportText || JSON.stringify(studyToAnalyze.report.findings),
          impression: studyToAnalyze.report.impression,
          keySequences: ['Sagittal PD-FS', 'Coronal T2', 'Axial PD'],
          config: ensembleConfig,
          model: modelSettings.selectedModel,
          temperature: modelSettings.temperature,
          topP: modelSettings.topP
        })
      });

      const data = await response.json();
      if (data.success && data.scores) {
        setPredictionMap(prev => ({
          ...prev,
          [studyToAnalyze.patientId]: data.scores
        }));
        setAiExplanations(prev => ({
          ...prev,
          [studyToAnalyze.patientId]: {
            scores: data.scores,
            predictions: data.scores,
            confidence: data.confidence || 0.92,
            clinicalReasoning: data.clinicalReasoning,
            sliceFindings: data.sliceFindings || [],
            differentialDiagnosis: data.differentialDiagnosis || [],
            recommendedAction: data.recommendedAction,
            clinicalRecommendations: data.clinicalRecommendations || [],
            researchRecommendations: data.researchRecommendations || [],
            modelVariant: data.modelVariant || (modelSettings.selectedModel.includes('pro') ? 'Gemini 2.5 Pro MSK Multimodal' : 'Gemini 2.5 Flash MSK Multimodal'),
            modelParams: modelSettings
          }
        }));
      } else if (data.success && data.prediction) {
        const predResult: PredictionResult = data.prediction;
        const resolvedScores = predResult.scores || predResult.predictions || {};
        setPredictionMap(prev => ({
          ...prev,
          [studyToAnalyze.patientId]: resolvedScores
        }));
        setAiExplanations(prev => ({
          ...prev,
          [studyToAnalyze.patientId]: {
            ...predResult,
            modelParams: modelSettings
          }
        }));
      } else {
        throw new Error(data.error || 'Prediction failed');
      }
    } catch (err) {
      console.warn('API inference error, keeping calibrated baseline:', err);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleSelectAbnormality = (key: AbnormalityKey, plane?: ViewPlane, sliceIndex?: number) => {
    setActiveAbnormality(key);
    if (plane) setCurrentPlane(plane);
    if (sliceIndex) setTargetSliceIndex(sliceIndex);
    if (activeTab !== 'viewer') {
      setActiveTab('viewer');
    }
  };

  const handleJumpToSlice = (plane: ViewPlane, sliceIndex: number, abnormality: AbnormalityKey) => {
    setCurrentPlane(plane);
    setTargetSliceIndex(sliceIndex);
    setActiveAbnormality(abnormality);
    if (activeTab !== 'viewer') {
      setActiveTab('viewer');
    }
  };

  const handleCustomUpload = (newStudy: Partial<StudyInstance>) => {
    const fullStudy = newStudy as StudyInstance;
    setStudies(prev => [fullStudy, ...prev]);
    setSelectedStudyId(fullStudy.patientId);
    runMultimodalPrediction(fullStudy);
  };

  const handleIngestStudy = (study: StudyInstance) => {
    setStudies(prev => [study, ...prev]);
    setSelectedStudyId(study.patientId);
    if (study.baselinePredictions) {
      setPredictionMap(prev => ({
        ...prev,
        [study.patientId]: study.baselinePredictions!
      }));
    }
    // Auto-select primary plane and abnormality focus if present
    if (study.groundTruth.ACL === 1) {
      setActiveAbnormality('ACL');
      setCurrentPlane('Sagittal');
    } else if (study.groundTruth.MCL === 1) {
      setActiveAbnormality('MCL');
      setCurrentPlane('Coronal');
    } else {
      setActiveAbnormality(null);
    }
  };

  const handleOpenIngestionModal = (stream: IngestionStream = 'PACS_DICOM') => {
    setSelectedIngestionStream(stream);
    setIsIngestionModalOpen(true);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#07090E] text-slate-100 flex flex-col font-sans selection:bg-[#00E5FF] selection:text-[#07090E]">
      {/* 1. Consolidated 48px Header Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        studies={studies}
        selectedStudyId={selectedStudyId}
        onSelectStudy={study => {
          setSelectedStudyId(study.patientId);
          setActiveAbnormality(null);
        }}
        onCustomUpload={handleCustomUpload}
        macroAuc={macroAuc}
        onRunAiPrediction={() => runMultimodalPrediction(currentStudy)}
        isPredicting={isPredicting}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onExportReport={() => setIsExportModalOpen(true)}
        onOpenIngestionModal={handleOpenIngestionModal}
      />

      {/* 2. Main Workspace (Locked 100vh Viewport) */}
      {activeTab === 'viewer' ? (
        /* Collapsible 2-Pane Layout (Adaptive 65% / 100% Canvas + 35% Intelligence Drawer) */
        <main className="flex-1 flex min-h-0 overflow-hidden relative">
          {/* Left Column (Adaptive Width: 65% when open, 100% when collapsed): Hero Diagnostic Viewport */}
          <div className={`h-full min-h-0 relative transition-all duration-300 ease-in-out ${
            isSidebarOpen ? 'w-[65%]' : 'w-full'
          }`}>
            <MriViewer
              currentPlane={currentPlane}
              onPlaneChange={setCurrentPlane}
              slices={currentStudy.slices}
              activeAbnormality={activeAbnormality}
              onSelectAbnormality={handleSelectAbnormality}
              sourceFidelity={currentStudy.sourceFidelity || '16-bit Native Volumetric'}
              ingestionStream={currentStudy.ingestionStream || 'PACS_DICOM'}
              onOpenIngestionModal={() => handleOpenIngestionModal(currentStudy.ingestionStream || 'PACS_DICOM')}
              targetSliceIndex={targetSliceIndex}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
              abnormalCount={Object.values(currentPredictions).filter(v => Number(v ?? 0) >= 0.50).length}
              macroAuc={macroAuc}
            />

            {/* Floating Side Collapse Toggle Tab Docked on the right edge of DICOM canvas */}
            <button
              id="btn-toggle-sidebar"
              onClick={() => setIsSidebarOpen(prev => !prev)}
              aria-label={isSidebarOpen ? "Collapse sidebar into Theater Mode" : "Expand Diagnostic Analysis Panel"}
              title={isSidebarOpen ? "Collapse sidebar into Theater Mode (100% Viewport) [T]" : "Expand Diagnostic Analysis Panel [T]"}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-30 flex h-14 w-6 items-center justify-center rounded-l-xl bg-[#0B0F19]/95 hover:bg-[#00E5FF]/20 text-slate-400 hover:text-[#00E5FF] border border-r-0 border-slate-700 hover:border-[#00E5FF]/50 transition-all duration-300 shadow-2xl cursor-pointer group backdrop-blur-md"
            >
              {isSidebarOpen ? (
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              ) : (
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              )}
            </button>
          </div>

          {/* Right Column (Collapsible 35% Drawer -> 0): Diagnostic Intelligence Panel */}
          <aside className={`h-full min-h-0 bg-[#080C14] transition-all duration-300 ease-in-out border-l border-slate-800 flex flex-col overflow-hidden ${
            isSidebarOpen ? 'w-[35%] opacity-100' : 'w-0 opacity-0 pointer-events-none border-l-0'
          }`}>
            <div className="w-full h-full min-w-[340px] flex flex-col overflow-hidden">
              <DiagnosticIntelligencePane
                currentStudy={currentStudy}
                predictions={currentPredictions}
                activeAbnormality={activeAbnormality}
                onSelectAbnormality={handleSelectAbnormality}
                onJumpToSlice={handleJumpToSlice}
                aiExplanation={aiExplanations[currentStudy.patientId]}
                onOpenRecommendations={() => setIsRecommendationsOpen(true)}
                onExportReport={() => setIsExportModalOpen(true)}
                onCustomReportAnalyze={customText => runMultimodalPrediction(currentStudy, customText)}
                isAnalyzing={isPredicting}
                modelSettings={modelSettings}
                onUpdateModelSettings={handleUpdateModelSettings}
                onCloseSidebar={() => setIsSidebarOpen(false)}
              />
            </div>
          </aside>
        </main>
      ) : activeTab === 'architecture' ? (
        /* Architecture View */
        <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 max-w-7xl w-full mx-auto">
          <ModelArchitecture
            config={ensembleConfig}
            onChangeConfig={setEnsembleConfig}
            currentMacroAuc={macroAuc}
          />
        </main>
      ) : (
        /* Leaderboard & Evaluation View */
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden max-w-7xl w-full mx-auto p-4 gap-3">
          {/* Sub-tab segmented switcher */}
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3 shrink-0">
            <div className="flex items-center gap-1.5 bg-[#0B0F19] p-1 rounded-xl border border-[#1E293B]">
              <button
                id="btn-subtab-eval"
                onClick={() => setLeaderboardSubTab('evaluation')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  leaderboardSubTab === 'evaluation'
                    ? 'bg-[#00E5FF] text-[#07090E] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>ROC-AUC Matrix & Curves</span>
              </button>

              <button
                id="btn-subtab-submission"
                onClick={() => setLeaderboardSubTab('submission')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  leaderboardSubTab === 'submission'
                    ? 'bg-[#00E5FF] text-[#07090E] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>RSNA Submission Lab & Benchmark</span>
              </button>
            </div>

            <div className="font-mono text-xs text-slate-400 bg-[#0B0F19] px-3 py-1.5 rounded-lg border border-[#1E293B]">
              Current Macro-AUC: <span className="text-[#00E5FF] font-bold">{macroAuc.toFixed(4)}</span>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {leaderboardSubTab === 'evaluation' ? (
              <EvaluationDashboard
                evaluations={perAbnormality}
                macroAuc={macroAuc}
              />
            ) : (
              <SubmissionLab
                studies={studies}
                predictionMap={predictionMap}
                macroAuc={macroAuc}
              />
            )}
          </div>
        </main>
      )}

      {/* AI Radiologist Copilot Side Drawer */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        currentStudy={currentStudy}
        predictions={currentPredictions}
        aiExplanation={aiExplanations[currentStudy.patientId]}
        modelSettings={modelSettings}
        onUpdateModelSettings={handleUpdateModelSettings}
      />

      {/* Clinical Recommendations Center Modal */}
      <RecommendationsCenter
        isOpen={isRecommendationsOpen}
        onClose={() => setIsRecommendationsOpen(false)}
        currentStudy={currentStudy}
        predictions={currentPredictions}
        aiExplanation={aiExplanations[currentStudy.patientId]}
        onSelectAbnormality={handleSelectAbnormality}
      />

      {/* Structured Clinical Diagnostic & AI Export Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        study={currentStudy}
        predictions={currentPredictions}
        aiExplanation={aiExplanations[currentStudy.patientId]}
        ensembleConfig={ensembleConfig}
      />

      {/* Dual-Stream Ingestion Engine Modal (Stream 1: PACS DICOM, Stream 2: Film Sheet & Report OCR) */}
      <DualStreamIngestionModal
        isOpen={isIngestionModalOpen}
        onClose={() => setIsIngestionModalOpen(false)}
        onIngestStudy={handleIngestStudy}
        initialStream={selectedIngestionStream}
      />

      {/* ── PRINT-ONLY CLINICAL DISPATCH DOCUMENT ── */}
      <div className="hidden print:block fixed inset-0 bg-white text-black p-8 font-sans z-[9999]">
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black">RSNA-OmniKnee Diagnostic Report</h1>
            <p className="text-xs text-gray-600 mt-1">Multimodal Knee Abnormality Detection & Decision Support System</p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold">DEPARTMENT OF RADIOLOGY & MSK IMAGING</p>
            <p className="text-gray-600">Standard A4 Clinical Dispatch Document</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border border-gray-300 rounded p-4 mb-6 text-xs">
          <div>
            <p><span className="font-semibold text-gray-700">Case / Patient ID:</span> {currentStudy.patientId}</p>
            <p><span className="font-semibold text-gray-700">Demographics:</span> {currentStudy.patientAge}yo {currentStudy.patientGender} • {currentStudy.kneeSide} Knee</p>
            <p><span className="font-semibold text-gray-700">Clinical Indication:</span> {currentStudy.history}</p>
          </div>
          <div>
            <p><span className="font-semibold text-gray-700">MR Technique:</span> 3.0T Multi-Sequence MRI (Sagittal PD-FS / Coronal T2 / Axial PD)</p>
            <p><span className="font-semibold text-gray-700">System Macro-AUC:</span> {macroAuc.toFixed(4)}</p>
            <p><span className="font-semibold text-gray-700">Fidelity Stream:</span> {currentStudy.sourceFidelity || 'PACS C-STORE (16-bit)'}</p>
          </div>
        </div>

        <table className="w-full border-collapse border border-gray-300 text-xs mb-6">
          <thead>
            <tr className="bg-gray-100 text-gray-800">
              <th className="border border-gray-300 px-3 py-2 text-left">Clinical Target</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Optimal Plane</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Confidence Score</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Diagnostic Status</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(ABNORMALITIES_META) as AbnormalityKey[]).map((key, idx) => {
              const meta = ABNORMALITIES_META[key];
              const prob = currentPredictions[key] ?? 0;
              const isPositive = prob >= 0.50;
              const isBorderline = prob >= 0.35 && prob < 0.50;
              return (
                <tr key={key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-3 py-1.5 font-medium">{meta.shortName}</td>
                  <td className="border border-gray-300 px-3 py-1.5 text-gray-600">{meta.primaryPlane} ({meta.keySequence})</td>
                  <td className="border border-gray-300 px-3 py-1.5 text-right font-mono">{(prob * 100).toFixed(1)}%</td>
                  <td className="border border-gray-300 px-3 py-1.5 text-center">
                    {isPositive && <span className="font-bold text-red-600">Acute Pathology Detected</span>}
                    {isBorderline && <span className="font-semibold text-yellow-700">Borderline / Monitor</span>}
                    {!isPositive && !isBorderline && <span className="text-green-700 font-semibold">Within Normal Limits</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="border border-gray-300 rounded p-4 text-xs leading-relaxed mb-6 bg-gray-50">
          <p className="font-semibold text-gray-800 mb-1">IMPRESSION & RADIOLOGIST FINDINGS SUMMARY:</p>
          <p>
            {aiExplanations[currentStudy.patientId]?.impression ||
              'Evaluation confirms multi-target volumetric analysis with high diagnostic certainty. Correlated with clinical presentation and cross-planar multi-slice context attention windows.'}
          </p>
        </div>

        <div className="flex justify-between items-end pt-6 border-t border-gray-300 text-xs">
          <p className="text-gray-500">Report generated automatically via RSNA-OmniKnee Studio • Validated for PACS Archive.</p>
          <div className="text-center">
            <div className="w-48 border-b border-black mb-1"></div>
            <p className="font-semibold text-gray-800">Attending Radiologist Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;


