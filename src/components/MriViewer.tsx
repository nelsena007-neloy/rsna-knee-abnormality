import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ViewPlane, MriSlice, AbnormalityKey } from '../types';
import { ABNORMALITIES_META } from '../data/abnormalities';
import { WL_PRESETS, getFilterStyles } from '../utils/mriRenderer';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  Eye,
  Sliders,
  Ruler,
  Crosshair,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  Move
} from 'lucide-react';

interface MriViewerProps {
  currentPlane: ViewPlane;
  onPlaneChange: (plane: ViewPlane) => void;
  slices: {
    sagittal: MriSlice[];
    coronal: MriSlice[];
    axial: MriSlice[];
  };
  activeAbnormality?: AbnormalityKey | null;
  onSelectAbnormality?: (key: AbnormalityKey) => void;
}

export const MriViewer: React.FC<MriViewerProps> = ({
  currentPlane,
  onPlaneChange,
  slices,
  activeAbnormality,
  onSelectAbnormality
}) => {
  const [sliceIndex, setSliceIndex] = useState<number>(12);
  const [wlPreset, setWlPreset] = useState<string>('Default');
  const [invert, setInvert] = useState<boolean>(false);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [showCrosshairs, setShowCrosshairs] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<'pan' | 'measure' | 'pointer'>('pointer');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [cineFps, setCineFps] = useState<number>(6);
  const [measurePoints, setMeasurePoints] = useState<{ x: number; y: number }[]>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const activeSliceList = currentPlane === 'Sagittal' ? slices.sagittal : currentPlane === 'Coronal' ? slices.coronal : slices.axial;
  const totalSlices = activeSliceList.length || 20;
  const currentSliceData = activeSliceList[Math.min(sliceIndex - 1, totalSlices - 1)] || activeSliceList[0];

  // Auto-jump to relevant slice if an abnormality with primary plane is selected
  useEffect(() => {
    if (activeAbnormality) {
      const meta = ABNORMALITIES_META[activeAbnormality];
      if (meta && meta.primaryPlane !== currentPlane) {
        onPlaneChange(meta.primaryPlane);
      }
      const targetList = meta?.primaryPlane === 'Coronal' ? slices.coronal : meta?.primaryPlane === 'Axial' ? slices.axial : slices.sagittal;
      const targetIdx = targetList.findIndex(s => s.pathologyHighlights?.some(h => h.abnormality === activeAbnormality));
      if (targetIdx !== -1) {
        setSliceIndex(targetIdx + 1);
      }
    }
  }, [activeAbnormality]);

  // Cine Playback Loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSliceIndex(prev => (prev >= totalSlices ? 1 : prev + 1));
    }, 1000 / cineFps);
    return () => clearInterval(interval);
  }, [isPlaying, totalSlices, cineFps]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        setSliceIndex(prev => Math.min(totalSlices, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        setSliceIndex(prev => Math.max(1, prev - 1));
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    },
    [totalSlices]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool !== 'measure') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (measurePoints.length >= 2) {
      setMeasurePoints([{ x, y }]);
    } else {
      setMeasurePoints(prev => [...prev, { x, y }]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const calculateDistanceMm = () => {
    if (measurePoints.length < 2) return null;
    const [p1, p2] = measurePoints;
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const distMm = Math.sqrt(dx * dx + dy * dy) * 1.6;
    return distMm.toFixed(1);
  };

  // Render SVG cross-section based on plane and slice position
  const renderMriVisual = () => {
    const norm = sliceIndex / totalSlices;

    return (
      <g>
        {/* Dark MRI Background with subtle noise grid */}
        <rect width="100" height="100" fill="#04070D" />
        <circle cx="50" cy="50" r="47" fill="#0A0F1A" opacity="0.95" />

        {/* Dynamic anatomical structures based on current plane */}
        {currentPlane === 'Sagittal' && (
          <g>
            {/* Femoral Shaft & Condyle */}
            <path
              d={`M 32 10 L 34 ${30 + norm * 4} Q 36 50, 48 54 Q 68 56, 74 44 Q 78 30, 68 20 Q 60 14, 52 10 Z`}
              fill="#182332"
              stroke="#33475D"
              strokeWidth="0.8"
            />
            {/* Femoral Cartilage layer */}
            <path
              d="M 38 48 Q 50 56, 64 54 Q 72 48, 73 42"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.85"
            />

            {/* Tibial Plateau & Shaft */}
            <path
              d={`M 30 64 Q 50 ${60 + (1 - norm) * 4}, 76 62 Q 78 68, 70 82 L 64 96 L 36 96 L 30 80 Z`}
              fill="#182332"
              stroke="#33475D"
              strokeWidth="0.8"
            />
            {/* Tibial Cartilage */}
            <path
              d="M 32 63 Q 50 61, 74 62"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity="0.85"
            />

            {/* Patella (Anterior) */}
            <path
              d="M 18 28 Q 24 24, 28 32 Q 26 44, 20 46 Q 16 38, 18 28 Z"
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="0.8"
            />
            {/* Patellar Cartilage */}
            <path d="M 27 28 Q 28 36, 23 44" fill="none" stroke="#94a3b8" strokeWidth="1.2" />

            {/* Quadriceps & Patellar Tendons */}
            <path d="M 22 10 L 22 26" stroke="#475569" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M 20 46 L 32 68" stroke="#334155" strokeWidth="2.8" strokeLinecap="round" />

            {/* Hoffa's Fat Pad */}
            <path
              d="M 25 48 Q 36 48, 38 60 Q 32 64, 26 56 Z"
              fill="#1e293b"
              opacity="0.75"
            />

            {/* Cruciate Ligaments (ACL & PCL in middle slices 8-14) */}
            {sliceIndex >= 7 && sliceIndex <= 15 && (
              <g id="acl-group">
                {/* PCL Curve */}
                <path
                  d="M 58 38 Q 62 50, 48 64"
                  fill="none"
                  stroke="#0b111e"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                {/* ACL Fibers (intercondylar notch) */}
                <path
                  d="M 44 64 L 62 38"
                  fill="none"
                  stroke={currentSliceData.pathologyHighlights?.some(h => h.abnormality === 'ACL') ? '#ef4444' : '#0b111e'}
                  strokeWidth="2.8"
                  strokeDasharray={currentSliceData.pathologyHighlights?.some(h => h.abnormality === 'ACL') ? '3,2' : 'none'}
                />
              </g>
            )}

            {/* Meniscal Triangles (Anterior & Posterior horns in slices 3-8 and 12-18) */}
            {(sliceIndex <= 8 || sliceIndex >= 12) && (
              <g id="meniscus-group">
                {/* Anterior horn triangle */}
                <polygon points="34,62 42,62 38,56" fill="#0b111e" stroke="#334155" strokeWidth="0.5" />
                {/* Posterior horn triangle */}
                <polygon points="66,62 74,62 70,54" fill="#0b111e" stroke="#334155" strokeWidth="0.5" />
              </g>
            )}

            {/* Suprapatellar bursa / Effusion */}
            <path
              d="M 28 16 Q 34 22, 32 30 Q 24 28, 26 18 Z"
              fill="#38bdf8"
              opacity={currentSliceData.pathologyHighlights?.some(h => h.abnormality === 'Effusion') ? 0.8 : 0.2}
            />

            {/* Popliteal Fossa / Baker Cyst */}
            {sliceIndex >= 14 && (
              <circle
                cx="74"
                cy="68"
                r={currentSliceData.pathologyHighlights?.some(h => h.abnormality === "Baker's") ? 10 : 3}
                fill="#10b981"
                opacity={currentSliceData.pathologyHighlights?.some(h => h.abnormality === "Baker's") ? 0.75 : 0.15}
              />
            )}
          </g>
        )}

        {currentPlane === 'Coronal' && (
          <g>
            {/* Medial & Lateral Femoral Condyles */}
            <path
              d="M 28 10 L 30 36 Q 26 52, 38 54 Q 48 54, 50 44 Q 52 54, 62 54 Q 74 52, 70 36 L 72 10 Z"
              fill="#182332"
              stroke="#33475D"
              strokeWidth="0.8"
            />
            {/* Joint Cartilage Condyles */}
            <path d="M 30 50 Q 38 55, 46 51" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 54 51 Q 62 55, 70 50" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />

            {/* Tibial Plateau with Intercondylar Eminence Spines */}
            <path
              d="M 26 62 Q 38 61, 48 56 L 50 53 L 52 56 Q 62 61, 74 62 L 72 96 L 28 96 Z"
              fill="#182332"
              stroke="#33475D"
              strokeWidth="0.8"
            />
            {/* Proximal Fibula Head (Lateral) */}
            <path d="M 74 70 Q 82 72, 80 90 L 76 96 L 72 90 Z" fill="#1e293b" stroke="#475569" strokeWidth="0.6" />

            {/* Medial Collateral Ligament (MCL band on left medial side) */}
            <path
              d="M 24 34 Q 20 54, 23 78"
              fill="none"
              stroke={currentSliceData.pathologyHighlights?.some(h => h.abnormality === 'MCL') ? '#f97316' : '#0b111e'}
              strokeWidth={currentSliceData.pathologyHighlights?.some(h => h.abnormality === 'MCL') ? '3.5' : '2.2'}
              opacity="0.9"
            />

            {/* Lateral Collateral Ligament (LCL on right lateral side) */}
            <path d="M 74 38 Q 78 56, 76 74" fill="none" stroke="#0b111e" strokeWidth="2.0" opacity="0.9" />

            {/* Medial & Lateral Meniscus bodies */}
            <polygon points="26,58 34,58 30,53" fill="#0b111e" stroke="#334155" strokeWidth="0.5" />
            <polygon points="66,58 74,58 70,53" fill="#0b111e" stroke="#334155" strokeWidth="0.5" />

            {/* Joint Fluid in gutters */}
            <ellipse
              cx="50"
              cy="36"
              rx="18"
              ry="6"
              fill="#38bdf8"
              opacity={currentSliceData.pathologyHighlights?.some(h => h.abnormality === 'Effusion') ? 0.7 : 0.1}
            />
          </g>
        )}

        {currentPlane === 'Axial' && (
          <g>
            {/* Patellofemoral Trochlear Groove & Patella */}
            <path
              d="M 30 18 Q 50 14, 70 18 Q 66 32, 50 36 Q 34 32, 30 18 Z"
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="0.8"
            />
            {/* Patellar Cartilage */}
            <path d="M 34 26 Q 50 34, 66 26" fill="none" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" />

            {/* Distal Femur Metaphysis / Condylar cross-section */}
            <path
              d="M 24 50 Q 50 42, 76 50 Q 82 72, 68 84 Q 50 78, 32 84 Q 18 72, 24 50 Z"
              fill="#182332"
              stroke="#33475D"
              strokeWidth="0.8"
            />
            {/* Trochlear Cartilage */}
            <path d="M 28 48 Q 50 42, 72 48" fill="none" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" />

            {/* Retinacular Bands */}
            <path d="M 28 22 L 20 48" stroke="#334155" strokeWidth="1.2" />
            <path d="M 72 22 L 80 48" stroke="#334155" strokeWidth="1.2" />

            {/* Popliteal Vessels & Baker's pouch (Posteromedial) */}
            <circle cx="50" cy="88" r="3" fill="#ef4444" opacity="0.6" />
            <circle cx="55" cy="87" r="3" fill="#3b82f6" opacity="0.6" />

            {/* Baker Cyst */}
            {currentSliceData.pathologyHighlights?.some(h => h.abnormality === "Baker's") && (
              <path
                d="M 62 70 Q 78 68, 76 86 Q 64 88, 62 70 Z"
                fill="#10b981"
                opacity="0.8"
                stroke="#34d399"
                strokeWidth="0.8"
              />
            )}
          </g>
        )}

        {/* Grad-CAM Saliency / AI Attention Heatmap Overlay */}
        {showHeatmap && currentSliceData.pathologyHighlights && currentSliceData.pathologyHighlights.length > 0 && (
          <g id="gradcam-overlay" opacity="0.85">
            {currentSliceData.pathologyHighlights.map((hl, i) => (
              <g key={i}>
                <radialGradient id={`heatmapGrad-${i}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ff0055" stopOpacity="0.9" />
                  <stop offset="35%" stopColor="#ffaa00" stopOpacity="0.7" />
                  <stop offset="70%" stopColor="#00E5FF" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
                </radialGradient>
                <circle
                  cx={hl.x}
                  cy={hl.y}
                  r={hl.radius * 1.5}
                  fill={`url(#heatmapGrad-${i})`}
                  className="animate-pulse"
                />
              </g>
            ))}
          </g>
        )}

        {/* Vector Target Marker & Focus Ring */}
        {showAnnotations && currentSliceData.pathologyHighlights && (
          <g id="pathology-annotations">
            {currentSliceData.pathologyHighlights.map((hl, i) => {
              const meta = ABNORMALITIES_META[hl.abnormality];
              const isSelected = activeAbnormality === hl.abnormality;
              return (
                <g key={i} className="cursor-pointer" onClick={() => onSelectAbnormality?.(hl.abnormality)}>
                  {/* Trajectory dashed guide line */}
                  <line
                    x1={hl.x - 12}
                    y1={hl.y - 12}
                    x2={hl.x}
                    y2={hl.y}
                    stroke="#FF3B5C"
                    strokeWidth="0.8"
                    strokeDasharray="2,2"
                  />
                  {/* Red circular focus ring */}
                  <circle
                    cx={hl.x}
                    cy={hl.y}
                    r={hl.radius}
                    fill="none"
                    stroke={isSelected ? '#00E5FF' : '#FF3B5C'}
                    strokeWidth={isSelected ? '2.4' : '1.4'}
                    strokeDasharray={isSelected ? 'none' : '3,2'}
                  />
                  {/* Center Target Point */}
                  <circle cx={hl.x} cy={hl.y} r="2.2" fill={isSelected ? '#00E5FF' : '#FF3B5C'} />
                  {/* Target Pill */}
                  <rect
                    x={hl.x - 12}
                    y={hl.y - hl.radius - 8}
                    width="24"
                    height="7"
                    rx="2"
                    fill="#06080B"
                    stroke={isSelected ? '#00E5FF' : '#FF3B5C'}
                    strokeWidth="0.8"
                    opacity="0.95"
                  />
                  <text
                    x={hl.x}
                    y={hl.y - hl.radius - 3}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="3.6"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {hl.abnormality}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* Caliper Measurement Drawing */}
        {measurePoints.length > 0 && (
          <g id="caliper-group">
            {measurePoints.map((pt, i) => (
              <circle key={i} cx={pt.x} cy={pt.y} r="2" fill="#00E5FF" stroke="#ffffff" strokeWidth="0.6" />
            ))}
            {measurePoints.length === 2 && (
              <g>
                <line
                  x1={measurePoints[0].x}
                  y1={measurePoints[0].y}
                  x2={measurePoints[1].x}
                  y2={measurePoints[1].y}
                  stroke="#00E5FF"
                  strokeWidth="1.2"
                  strokeDasharray="2,2"
                />
                <rect
                  x={(measurePoints[0].x + measurePoints[1].x) / 2 - 12}
                  y={(measurePoints[0].y + measurePoints[1].y) / 2 - 6}
                  width="24"
                  height="6"
                  rx="1.5"
                  fill="#06080B"
                  stroke="#00E5FF"
                  strokeWidth="0.6"
                />
                <text
                  x={(measurePoints[0].x + measurePoints[1].x) / 2}
                  y={(measurePoints[0].y + measurePoints[1].y) / 2 - 1.8}
                  fill="#00E5FF"
                  fontSize="3.4"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {calculateDistanceMm()} mm
                </text>
              </g>
            )}
          </g>
        )}

        {/* Crosshair Cursor */}
        {showCrosshairs && (
          <g id="crosshairs" opacity="0.6" pointerEvents="none">
            <line x1="0" y1={mousePos.y} x2="100" y2={mousePos.y} stroke="#00E5FF" strokeWidth="0.4" strokeDasharray="1,1" />
            <line x1={mousePos.x} y1="0" x2={mousePos.x} y2="100" stroke="#00E5FF" strokeWidth="0.4" strokeDasharray="1,1" />
            <circle cx={mousePos.x} cy={mousePos.y} r="3" fill="none" stroke="#00E5FF" strokeWidth="0.5" />
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-[#0A0E17] text-slate-100 overflow-hidden select-none">
      {/* Top Controls Toolbar */}
      <div className="px-3 py-2 border-b border-slate-800/80 bg-[#070A10] flex items-center justify-between gap-2 shrink-0">
        {/* Plane Selector Tabs */}
        <div className="flex items-center gap-1 bg-[#0D131F] p-0.5 rounded-lg border border-slate-800">
          {(['Sagittal', 'Coronal', 'Axial'] as ViewPlane[]).map(plane => (
            <button
              key={plane}
              id={`btn-plane-${plane.toLowerCase()}`}
              onClick={() => onPlaneChange(plane)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                currentPlane === plane
                  ? 'bg-[#00E5FF] text-[#06080B] shadow-sm shadow-[#00E5FF]/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {plane}
            </button>
          ))}
        </div>

        {/* Preset & Invert */}
        <div className="flex items-center gap-1.5">
          <select
            id="select-wl-preset"
            value={wlPreset}
            onChange={e => setWlPreset(e.target.value)}
            className="bg-[#0D131F] border border-slate-700/80 text-slate-200 text-[11px] font-medium rounded-md px-2 py-1 outline-none focus:border-[#00E5FF]"
          >
            {Object.keys(WL_PRESETS).map(key => (
              <option key={key} value={key}>
                {WL_PRESETS[key].name}
              </option>
            ))}
          </select>

          <button
            id="btn-toggle-invert"
            onClick={() => setInvert(prev => !prev)}
            className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-all ${
              invert
                ? 'bg-slate-200 text-slate-950 font-bold border-white'
                : 'bg-[#0D131F] text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            Inv
          </button>
        </div>

        {/* Tool Toggles */}
        <div className="flex items-center gap-1">
          <button
            id="btn-toggle-heatmap"
            onClick={() => setShowHeatmap(prev => !prev)}
            title="Toggle AI Attention / Grad-CAM"
            className={`p-1.5 rounded-lg border text-[11px] flex items-center gap-1 transition-all ${
              showHeatmap
                ? 'bg-[#FF3B5C26] text-[#FF3B5C] border-[#FF3B5C66]'
                : 'bg-[#0D131F] text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Heatmap</span>
          </button>

          <button
            id="btn-toggle-annotations"
            onClick={() => setShowAnnotations(prev => !prev)}
            title="Toggle Pathology Annotations"
            className={`p-1.5 rounded-lg border text-[11px] flex items-center gap-1 transition-all ${
              showAnnotations
                ? 'bg-[#00E5FF22] text-[#00E5FF] border-[#00E5FF55]'
                : 'bg-[#0D131F] text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Targets</span>
          </button>

          <button
            id="btn-toggle-caliper"
            onClick={() => {
              setActiveTool(prev => (prev === 'measure' ? 'pointer' : 'measure'));
              setMeasurePoints([]);
            }}
            title="Caliper Ruler"
            className={`p-1.5 rounded-lg border text-[11px] transition-all ${
              activeTool === 'measure'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-[#0D131F] text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
          </button>

          <button
            id="btn-toggle-crosshairs"
            onClick={() => setShowCrosshairs(prev => !prev)}
            title="Toggle Crosshairs"
            className={`p-1.5 rounded-lg border text-[11px] transition-all ${
              showCrosshairs
                ? 'bg-[#00E5FF22] text-[#00E5FF] border-[#00E5FF55]'
                : 'bg-[#0D131F] text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main MRI Canvas Viewport (flex-1 min-h-0 relative) */}
      <div className="flex-1 min-h-0 relative bg-[#04060A] flex items-center justify-center overflow-hidden">
        {/* Metadata Overlay Header (Top-Left of Viewport) */}
        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none text-[10px] font-mono text-cyan-300/90 bg-[#06080B]/85 p-2 rounded-lg border border-slate-800/80 backdrop-blur-sm space-y-0.5 leading-tight shadow-md">
          <div className="font-bold text-white flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse"></span>
            {currentSliceData.sequenceName} (TR 2800 / TE 35)
          </div>
          <div>Plane: <span className="text-white font-semibold">{currentPlane}</span></div>
          <div>Slice: <span className="text-white font-semibold">{sliceIndex} / {totalSlices}</span> (Thk: {currentSliceData.thicknessMm}mm)</div>
          <div>WW: {WL_PRESETS[wlPreset]?.windowWidth} / WL: {WL_PRESETS[wlPreset]?.windowLevel}</div>
        </div>

        {/* Top Right Focus Status */}
        {activeAbnormality && (
          <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none text-[10px] font-mono bg-[#06080B]/85 px-2.5 py-1 rounded-lg border border-[#FF3B5C55] text-[#FF3B5C] font-bold backdrop-blur-sm shadow-md">
            Focus: {activeAbnormality}
          </div>
        )}

        {/* The SVG Canvas Container */}
        <div
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transition: activeTool === 'pan' ? 'none' : 'transform 0.15s ease-out'
          }}
          className="w-full h-full max-w-[480px] max-h-[480px] aspect-square flex items-center justify-center p-2"
        >
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full rounded-lg shadow-2xl cursor-crosshair"
            style={getFilterStyles(wlPreset, invert)}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
          >
            {renderMriVisual()}
          </svg>
        </div>

        {/* Floating Canvas Tool Buttons (Zoom / Pan / Reset) */}
        <div className="absolute top-12 right-2.5 z-20 flex flex-col gap-1 bg-[#06080B]/90 p-1 rounded-xl border border-slate-800/80 backdrop-blur-sm shadow-lg">
          <button
            id="btn-zoom-in"
            onClick={() => setZoom(z => Math.min(2.5, z + 0.25))}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-zoom-out"
            onClick={() => setZoom(z => Math.max(0.75, z - 0.25))}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-zoom-reset"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Active Slice Finding Banner (Floating bottom overlay) */}
        {currentSliceData.findings && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 bg-[#06080B]/90 border border-[#00E5FF44] px-3 py-1.5 rounded-lg backdrop-blur-md text-[11px] text-slate-200 flex items-center gap-2 shadow-lg truncate">
            <Info className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
            <span className="truncate">
              <span className="font-bold text-[#00E5FF]">Slice {sliceIndex} Finding: </span>
              {currentSliceData.findings}
            </span>
          </div>
        )}
      </div>

      {/* Cine Playback & Keyframe Slider (Bottom Bar) */}
      <div className="p-2.5 bg-[#070A10] border-t border-slate-800/80 space-y-1.5 shrink-0">
        <div className="flex items-center justify-between text-xs text-slate-400">
          {/* Scrub controls: [|<] [> Play / Pause] [>|] */}
          <div className="flex items-center gap-1.5">
            <button
              id="btn-slice-first"
              onClick={() => setSliceIndex(1)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
              title="First Slice"
            >
              <span className="font-mono text-[10px] font-bold">|&lt;</span>
            </button>
            <button
              id="btn-slice-prev"
              onClick={() => setSliceIndex(prev => Math.max(1, prev - 1))}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-slice-play"
              onClick={() => setIsPlaying(p => !p)}
              className="px-2 py-0.5 rounded bg-[#0D131F] hover:bg-slate-800 text-slate-200 flex items-center gap-1 border border-slate-700/80 font-mono text-[10px] font-bold"
            >
              {isPlaying ? <Pause className="w-3 h-3 text-[#00E5FF]" /> : <Play className="w-3 h-3 text-[#00E5FF]" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              id="btn-slice-next"
              onClick={() => setSliceIndex(prev => Math.min(totalSlices, prev + 1))}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-slice-last"
              onClick={() => setSliceIndex(totalSlices)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
              title="Last Slice"
            >
              <span className="font-mono text-[10px] font-bold">&gt;|</span>
            </button>
          </div>

          <div className="font-mono text-[#00E5FF] font-bold text-[11px]">
            Slice {sliceIndex} / {totalSlices}
          </div>

          {isPlaying && (
            <div className="flex items-center gap-1 text-[10px]">
              <span>FPS:</span>
              {[4, 6, 10].map(fps => (
                <button
                  key={fps}
                  onClick={() => setCineFps(fps)}
                  className={`px-1.5 py-0.2 rounded font-mono ${
                    cineFps === fps ? 'bg-[#00E5FF] text-[#06080B] font-bold' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {fps}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Precision Slider with custom cyan accent */}
        <input
          type="range"
          id="mri-slice-slider"
          min="1"
          max={totalSlices}
          value={sliceIndex}
          onChange={e => setSliceIndex(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#00E5FF]"
        />

        {/* Key Pathology Slice Markers */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pt-0.5 text-[10px]">
          <span className="text-slate-500 shrink-0 font-medium text-[9px] uppercase tracking-wider">Key:</span>
          {activeSliceList.map(s => {
            if (!s.pathologyHighlights || s.pathologyHighlights.length === 0) return null;
            const isCurrent = s.sliceIndex === sliceIndex;
            return (
              <button
                key={s.sliceIndex}
                onClick={() => setSliceIndex(s.sliceIndex)}
                className={`px-1.5 py-0.5 rounded font-mono text-[10px] shrink-0 transition-all ${
                  isCurrent
                    ? 'bg-[#00E5FF] text-[#06080B] font-bold shadow-sm'
                    : 'bg-[#0D131F] hover:bg-slate-800 text-[#00E5FF] border border-slate-800'
                }`}
              >
                #{s.sliceIndex} {s.pathologyHighlights.map(h => h.abnormality).join(', ')}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

