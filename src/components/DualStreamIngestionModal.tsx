import React, { useState } from 'react';
import {
  X,
  Database,
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Layers,
  Cpu,
  ArrowRight,
  Eye,
  Sliders,
  Check,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { IngestionStream, SourceFidelity, StudyInstance, FilmGridTile, ViewPlane } from '../types';

interface DualStreamIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestStudy: (study: StudyInstance) => void;
  initialStream?: IngestionStream;
}

export const DualStreamIngestionModal: React.FC<DualStreamIngestionModalProps> = ({
  isOpen,
  onClose,
  onIngestStudy,
  initialStream = 'PACS_DICOM'
}) => {
  const [activeStream, setActiveStream] = useState<IngestionStream>(initialStream);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [gridShape, setGridShape] = useState<[number, number]>([3, 4]); // 3 rows x 4 cols = 12 tiles

  // PACS Form State
  const [pacsPatientId, setPacsPatientId] = useState<string>('RSNA-PACS-8091');
  const [pacsMagnetStrength, setPacsMagnetStrength] = useState<'3.0T' | '1.5T'>('3.0T');
  const [pacsSliceThickness, setPacsSliceThickness] = useState<number>(3.0);
  const [pacsIndication, setPacsIndication] = useState<string>(
    '24yo male, non-contact decelerating injury playing basketball with audible pop, immediate hemarthrosis and inability to bear weight.'
  );

  // Film State
  const [filmPatientId, setFilmPatientId] = useState<string>('RSNA-FILM-9920');
  const [filmReportText, setFilmReportText] = useState<string>(
    'Clinical History: 31yo skier following acute high-velocity twisting fall with severe lateral knee pain and gross laxity.\nFindings: Complete midsubstance tear of the ACL with empty notch sign. Segond avulsion fracture fragment off the anterolateral proximal tibial rim. Severe lateral compartment bone contusion. Large hemarthrosis.\nImpression: 1. Segond fracture. 2. Complete ACL tear. 3. Lateral meniscus tear. 4. Large hemarthrosis.'
  );
  const [detectedTiles, setDetectedTiles] = useState<FilmGridTile[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Stream 1: PACS Direct Ingestion
  const handlePacsIngest = async () => {
    setIsProcessing(true);
    setProgressStep('Connecting to PACS C-STORE Listener (Port 104)...');

    try {
      setTimeout(() => setProgressStep('Extracting 16-bit Volumetric Multiplanar Arrays...'), 400);
      setTimeout(() => setProgressStep('Calculating Direction Cosines & Voxel Calibration...'), 800);

      const response = await fetch('/api/ingest/pacs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: pacsPatientId,
          magnetStrength: pacsMagnetStrength,
          sliceThickness: pacsSliceThickness,
          clinicalIndication: pacsIndication
        })
      });

      const data = await response.json();
      if (data.success && data.study) {
        setTimeout(() => {
          setIsProcessing(false);
          onIngestStudy(data.study);
          onClose();
        }, 1200);
      } else {
        throw new Error(data.error || 'Failed to ingest PACS series');
      }
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      setProgressStep('Error: ' + err.message);
    }
  };

  // Stream 2: Film Sheet & Report Digitization
  const handleFilmDigitize = async () => {
    setIsProcessing(true);
    setProgressStep('Running Automated Grid Contour Detection on Film Sheet...');

    try {
      setTimeout(() => setProgressStep('Segmenting 12 Individual 2D MRI Slice Tiles...'), 500);
      setTimeout(() => setProgressStep('Executing Gemini Multimodal Clinical Report OCR...'), 1000);
      setTimeout(() => setProgressStep('Standardizing Triplanar Tensors [3, Slices, Channels, H, W]...'), 1500);

      const response = await fetch('/api/ingest/digitize-film', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: filmPatientId,
          rawReportText: filmReportText,
          gridShape: gridShape
        })
      });

      const data = await response.json();
      if (data.success && data.study) {
        if (data.tiles) {
          setDetectedTiles(data.tiles);
        }
        setTimeout(() => {
          setIsProcessing(false);
          onIngestStudy(data.study);
          onClose();
        }, 1800);
      } else {
        throw new Error(data.error || 'Failed to digitize film sheet');
      }
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      setProgressStep('Error: ' + err.message);
    }
  };

  // Sample Load Handlers
  const loadPacsSample = (sampleId: string) => {
    if (sampleId === 'acute-acl') {
      setPacsPatientId('RSNA-PACS-8091');
      setPacsMagnetStrength('3.0T');
      setPacsSliceThickness(3.0);
      setPacsIndication('24yo male, non-contact decelerating injury playing basketball with audible pop, immediate hemarthrosis and inability to bear weight.');
    } else {
      setPacsPatientId('RSNA-PACS-4312');
      setPacsMagnetStrength('1.5T');
      setPacsSliceThickness(3.5);
      setPacsIndication('68yo female with progressive medial and patellofemoral knee pain, joint stiffness, and Baker cyst.');
    }
  };

  const loadFilmSample = (sampleId: string) => {
    if (sampleId === 'segond') {
      setFilmPatientId('RSNA-FILM-9920');
      setGridShape([3, 4]);
      setFilmReportText(
        'Clinical History: 31yo skier following acute high-velocity twisting fall with severe lateral knee pain and gross laxity.\nFindings: Complete midsubstance tear of the ACL with empty notch sign. Segond avulsion fracture fragment off the anterolateral proximal tibial rim. Severe lateral compartment bone contusion. Large hemarthrosis.\nImpression: 1. Segond fracture. 2. Complete ACL tear. 3. Lateral meniscus tear. 4. Large hemarthrosis.'
      );
    } else {
      setFilmPatientId('RSNA-FILM-2104');
      setGridShape([3, 4]);
      setFilmReportText(
        'Clinical History: 52yo female presenting with acute mechanical medial joint pain.\nFindings: Radial complete tear of the medial meniscus posterior horn root attachment with ghost sign and truncation. Associated 3.5mm medial meniscal extrusion. Early medial compartment cartilage loss. Mild effusion.\nImpression: 1. Complete radial root tear of medial meniscus with extrusion. 2. Early medial OA. 3. Joint effusion.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="bg-[#0B0F19] border border-[#1E293B] rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E293B] flex items-center justify-between bg-[#07090E]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00E5FF] to-[#0077B6] p-0.5 flex items-center justify-center shadow-md shadow-[#00E5FF]/20">
              <div className="w-full h-full bg-[#07090E] rounded-[6px] flex items-center justify-center">
                <Database className="w-4 h-4 text-[#00E5FF]" />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Dual-Stream Data Ingestion & Preprocessing</span>
                <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                  RSNA Ingestion Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Unified data normalization supporting 16-bit PACS DICOM streams and 8-bit digitized physical film grids
              </p>
            </div>
          </div>

          <button
            id="btn-close-ingestion-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stream Selector Segmented Bar */}
        <div className="p-4 bg-[#080C14] border-b border-[#1E293B] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-xl bg-[#0B0F19] p-1 rounded-xl border border-[#1E293B]">
            {/* Stream 1 Toggle Button */}
            <button
              id="tab-stream-pacs"
              onClick={() => setActiveStream('PACS_DICOM')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activeStream === 'PACS_DICOM'
                  ? 'bg-[#00E5FF] text-[#07090E] shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Stream 1: Direct PACS / DICOM C-STORE</span>
            </button>

            {/* Stream 2 Toggle Button */}
            <button
              id="tab-stream-film"
              onClick={() => setActiveStream('FILM_SHEET_OCR')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activeStream === 'FILM_SHEET_OCR'
                  ? 'bg-[#00E5FF] text-[#07090E] shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Stream 2: Film Sheet & Report Digitization</span>
            </button>
          </div>

          {/* Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-lg border bg-[#0B0F19]">
            {activeStream === 'PACS_DICOM' ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>16-Bit Native Volumetric • Live Port 104</span>
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>8-Bit Digitized Tiles • Gemini Multimodal OCR</span>
              </span>
            )}
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {activeStream === 'PACS_DICOM' ? (
            /* STREAM 1: PACS / DICOM C-STORE */
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Quick Sample Presets */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick Load PACS Series
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    id="btn-sample-pacs-acute"
                    onClick={() => loadPacsSample('acute-acl')}
                    className="text-left p-3 rounded-xl bg-[#080C14] hover:bg-[#111827] border border-[#1E293B] hover:border-[#00E5FF]/50 transition-all flex items-start gap-2.5 group"
                  >
                    <div className="p-1.5 rounded-lg bg-cyan-950/70 border border-cyan-800/40 text-[#00E5FF] shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-[#00E5FF]">
                        3.0T High-Res Triplanar Series
                      </div>
                      <p className="text-[10.5px] text-slate-400 line-clamp-1">
                        Acute pivot-shift: ACL disruption + lateral kissing bone bruises
                      </p>
                      <span className="text-[9.5px] font-mono text-emerald-400 mt-1 inline-block">
                        16-bit • 20 Sag / 18 Cor / 16 Ax Slices
                      </span>
                    </div>
                  </button>

                  <button
                    id="btn-sample-pacs-oa"
                    onClick={() => loadPacsSample('oa')}
                    className="text-left p-3 rounded-xl bg-[#080C14] hover:bg-[#111827] border border-[#1E293B] hover:border-[#00E5FF]/50 transition-all flex items-start gap-2.5 group"
                  >
                    <div className="p-1.5 rounded-lg bg-cyan-950/70 border border-cyan-800/40 text-[#00E5FF] shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-[#00E5FF]">
                        1.5T Tri-compartmental OA Series
                      </div>
                      <p className="text-[10.5px] text-slate-400 line-clamp-1">
                        Advanced Medial OA, PF OA, Baker cyst & Synovitis
                      </p>
                      <span className="text-[9.5px] font-mono text-emerald-400 mt-1 inline-block">
                        16-bit • 20 Sag / 18 Cor / 16 Ax Slices
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* DICOM File Dropzone */}
              <div className="border-2 border-dashed border-[#1E293B] hover:border-[#00E5FF]/50 rounded-2xl p-6 bg-[#080C14] text-center transition-all">
                <UploadCloud className="w-8 h-8 text-[#00E5FF] mx-auto mb-2 opacity-80" />
                <h4 className="text-xs font-bold text-white mb-1">
                  Drag & Drop DICOM Series (.dcm, .tar.gz, DICOMDIR)
                </h4>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto mb-3">
                  Automatic direction cosines calculation (ImageOrientationPatient) maps Sagittal, Coronal, and Axial planes with dynamic RescaleSlope/Intercept calibration.
                </p>
                <div className="inline-flex items-center gap-2 text-[10px] font-mono text-slate-500 bg-[#0B0F19] px-3 py-1 rounded-full border border-slate-800">
                  <span>C-STORE Listener: 0.0.0.0:104</span>
                  <span>•</span>
                  <span>AET: RSNA_PACS</span>
                </div>
              </div>

              {/* PACS Parameters Form */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#080C14] p-4 rounded-xl border border-[#1E293B]">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Patient ID / Study Tag
                  </label>
                  <input
                    type="text"
                    value={pacsPatientId}
                    onChange={e => setPacsPatientId(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-[#1E293B] text-slate-200 text-xs font-mono rounded-lg px-2.5 py-1.5 outline-none focus:border-[#00E5FF]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Magnetic Field Strength
                  </label>
                  <select
                    value={pacsMagnetStrength}
                    onChange={e => setPacsMagnetStrength(e.target.value as any)}
                    className="w-full bg-[#0B0F19] border border-[#1E293B] text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-[#00E5FF]"
                  >
                    <option value="3.0T">3.0 Tesla (High SNR / Fast Spin Echo)</option>
                    <option value="1.5T">1.5 Tesla (Standard Clinical MSK)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Slice Thickness
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={pacsSliceThickness}
                    onChange={e => setPacsSliceThickness(Number(e.target.value))}
                    className="w-full bg-[#0B0F19] border border-[#1E293B] text-slate-200 text-xs font-mono rounded-lg px-2.5 py-1.5 outline-none focus:border-[#00E5FF]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Clinical Indication / History
                  </label>
                  <textarea
                    rows={2}
                    value={pacsIndication}
                    onChange={e => setPacsIndication(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-[#1E293B] text-slate-200 text-xs rounded-lg p-2.5 outline-none focus:border-[#00E5FF] resize-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* STREAM 2: FILM SHEET & REPORT OCR */
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Quick Sample Presets */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick Load Digitized Film Samples
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    id="btn-sample-film-segond"
                    onClick={() => loadFilmSample('segond')}
                    className="text-left p-3 rounded-xl bg-[#080C14] hover:bg-[#111827] border border-[#1E293B] hover:border-[#00E5FF]/50 transition-all flex items-start gap-2.5 group"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-950/70 border border-amber-800/40 text-amber-400 shrink-0">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-[#00E5FF]">
                        12-Slice Multi-Trauma Film Sheet
                      </div>
                      <p className="text-[10.5px] text-slate-400 line-clamp-1">
                        Segond avulsion fracture, full ACL tear, severe hemarthrosis
                      </p>
                      <span className="text-[9.5px] font-mono text-amber-400 mt-1 inline-block">
                        8-bit Digitized Grid (3x4) • Gemini OCR Report
                      </span>
                    </div>
                  </button>

                  <button
                    id="btn-sample-film-root"
                    onClick={() => loadFilmSample('root')}
                    className="text-left p-3 rounded-xl bg-[#080C14] hover:bg-[#111827] border border-[#1E293B] hover:border-[#00E5FF]/50 transition-all flex items-start gap-2.5 group"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-950/70 border border-amber-800/40 text-amber-400 shrink-0">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-[#00E5FF]">
                        Film Sheet + Scanned Report Note
                      </div>
                      <p className="text-[10.5px] text-slate-400 line-clamp-1">
                        Medial meniscus posterior horn radial root tear with ghost sign
                      </p>
                      <span className="text-[9.5px] font-mono text-amber-400 mt-1 inline-block">
                        8-bit Digitized Grid (3x4) • Gemini OCR Report
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Dual Dropzone: Left Film Photo, Right Scanned Report */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Film Sheet Capture */}
                <div className="border border-[#1E293B] rounded-xl p-4 bg-[#080C14] flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Camera className="w-3.5 h-3.5 text-[#00E5FF]" />
                      <span>Backlit Physical Film Sheet (Photo / Scan)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                      <span>Grid:</span>
                      <select
                        value={`${gridShape[0]}x${gridShape[1]}`}
                        onChange={e => {
                          const [r, c] = e.target.value.split('x').map(Number);
                          setGridShape([r, c]);
                        }}
                        className="bg-[#0B0F19] border border-[#1E293B] text-slate-200 text-[10px] rounded px-1.5 py-0.5 outline-none"
                      >
                        <option value="3x4">3x4 (12 Slices)</option>
                        <option value="4x4">4x4 (16 Slices)</option>
                        <option value="3x3">3x3 (9 Slices)</option>
                      </select>
                    </div>
                  </div>

                  {/* Visual Grid Mockup of Film Tiles */}
                  <div className="bg-[#04070D] border border-slate-800 rounded-lg p-2.5 grid grid-cols-4 gap-1.5 aspect-video items-center">
                    {Array.from({ length: gridShape[0] * gridShape[1] }).map((_, i) => (
                      <div
                        key={i}
                        className="h-full w-full bg-[#0A101D] border border-slate-700/60 rounded flex flex-col items-center justify-center p-1 relative overflow-hidden group hover:border-[#00E5FF]/60 cursor-pointer"
                      >
                        <span className="text-[8px] font-mono text-slate-500">#{i + 1}</span>
                        <div className="w-3 h-3 rounded-full border border-slate-600/50 bg-slate-800/40 my-0.5"></div>
                        <span className="text-[7.5px] font-mono text-cyan-400/80">
                          {i < 6 ? 'Sag' : i < 9 ? 'Cor' : 'Ax'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">
                    Auto-grid contour segmentation tiles physical film into individual 2D MRI slices.
                  </p>
                </div>

                {/* Right: Clinical Report OCR Note */}
                <div className="border border-[#1E293B] rounded-xl p-4 bg-[#080C14] flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <FileText className="w-3.5 h-3.5 text-[#00E5FF]" />
                      <span>Printed Report / Clinical Note OCR</span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                      Gemini OCR
                    </span>
                  </div>

                  <textarea
                    rows={7}
                    value={filmReportText}
                    onChange={e => setFilmReportText(e.target.value)}
                    placeholder="Paste or edit clinical report findings & impression for multimodal parsing..."
                    className="w-full bg-[#0B0F19] border border-[#1E293B] text-slate-200 text-xs rounded-lg p-2.5 outline-none focus:border-[#00E5FF] resize-none font-mono text-[11px] flex-1 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Real-time processing progress bar */}
          {isProcessing && (
            <div className="bg-[#080C14] border border-[#00E5FF]/40 rounded-xl p-4 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white font-bold flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#00E5FF] animate-spin" />
                  <span>Dual Ingestion Pipeline Active</span>
                </span>
                <span className="font-mono text-cyan-400 text-[11px]">{progressStep}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-[#00E5FF] to-[#0077B6] h-full rounded-full animate-pulse w-full"></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#1E293B] bg-[#07090E] flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
            <span>Fidelity:</span>
            <span className="text-white font-bold">
              {activeStream === 'PACS_DICOM' ? '16-bit Native Volumetric' : '8-bit Digitized Photographic Tiles'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-cancel-ingestion"
              onClick={onClose}
              disabled={isProcessing}
              className="px-3.5 py-1.5 rounded-lg bg-[#111827] hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all"
            >
              Cancel
            </button>

            {activeStream === 'PACS_DICOM' ? (
              <button
                id="btn-execute-pacs-ingest"
                onClick={handlePacsIngest}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] text-[#07090E] font-bold text-xs shadow-md shadow-[#00E5FF]/20 hover:opacity-95 transition-all disabled:opacity-50"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'Ingesting PACS Series...' : 'Ingest PACS DICOM Series'}</span>
              </button>
            ) : (
              <button
                id="btn-execute-film-digitize"
                onClick={handleFilmDigitize}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] text-[#07090E] font-bold text-xs shadow-md shadow-[#00E5FF]/20 hover:opacity-95 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'Digitizing & Parsing OCR...' : 'Digitize Film Sheet & OCR'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
