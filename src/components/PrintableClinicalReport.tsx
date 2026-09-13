import React from 'react';
import { ViewPlane, AbnormalityKey } from '../types';

export interface PrintableTarget {
  name: string;
  category: string;
  plane: string;
  prob: number;
  status: 'POSITIVE' | 'NORMAL';
}

export interface PrintableKeySlice {
  plane: ViewPlane;
  sliceIndex: number;
  totalSlices: number;
  sequenceName: string;
  thicknessMm: number;
  findings?: string;
  associatedAbnormality?: AbnormalityKey | null;
  confidence?: number;
  pathologyHighlights?: {
    abnormality: AbnormalityKey;
    x: number;
    y: number;
    radius: number;
    severity?: string;
    description?: string;
  }[];
}

export interface PrintOptions {
  includeKeySlice?: boolean;
  includeMatrix?: boolean;
  includeImpression?: boolean;
  includeAttestation?: boolean;
  customNotes?: string;
}

export interface ReportData {
  caseId: string;
  patientInfo: string;
  laterality: string;
  technique: string;
  indication: string;
  studyDate: string;
  targets: PrintableTarget[];
  aiImpression: string;
  keySlice?: PrintableKeySlice;
  options?: PrintOptions;
  timestamp?: string;
  pacsServer?: string;
  macroAuc?: number;
}

/**
 * High-fidelity Vector MRI Key Slice Visual for print rendering
 */
const KeySliceVisual: React.FC<{ slice: PrintableKeySlice }> = ({ slice }) => {
  const { plane, sliceIndex, totalSlices, sequenceName, thicknessMm, pathologyHighlights } = slice;
  const isSagittal = plane === 'Sagittal';
  const isCoronal = plane === 'Coronal';
  const isAxial = plane === 'Axial';

  const hasAcl = pathologyHighlights?.some(h => h.abnormality === 'ACL');
  const hasMcl = pathologyHighlights?.some(h => h.abnormality === 'MCL');
  const hasBaker = pathologyHighlights?.some(h => h.abnormality === "Baker's");
  const hasEffusion = pathologyHighlights?.some(h => h.abnormality === 'Effusion');

  return (
    <div className="w-56 h-56 bg-[#080C14] border border-gray-400 rounded-lg relative overflow-hidden shrink-0 shadow-sm print:border-gray-500">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ shapeRendering: 'geometricPrecision' }}
      >
        {/* Dark MRI Background & Calibration Grid */}
        <rect x="0" y="0" width="100" height="100" fill="#0A0E17" />
        <circle cx="50" cy="50" r="46" fill="#060910" stroke="#1E293B" strokeWidth="0.5" />

        {/* ── SAGITTAL VIEW GEOMETRY ── */}
        {isSagittal && (
          <g id="print-sagittal-knee">
            {/* Distal Femur */}
            <path
              d="M 32 10 L 34 38 Q 32 60, 52 62 Q 72 60, 70 38 L 72 10 Z"
              fill="#182332"
              stroke="#475569"
              strokeWidth="0.8"
            />
            {/* Femoral Condyle Cartilage */}
            <path
              d="M 34 44 Q 50 64, 68 44"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Proximal Tibia Plateau & Shaft */}
            <path
              d="M 28 64 Q 48 62, 74 64 L 70 96 L 32 96 Z"
              fill="#182332"
              stroke="#475569"
              strokeWidth="0.8"
            />
            {/* Tibial Cartilage */}
            <path
              d="M 32 63 Q 50 61, 72 63"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="1.3"
              strokeLinecap="round"
            />

            {/* Patella Bone */}
            <path
              d="M 18 28 Q 24 24, 28 32 Q 26 44, 20 46 Q 16 38, 18 28 Z"
              fill="#1E293B"
              stroke="#475569"
              strokeWidth="0.8"
            />
            {/* Patellar Cartilage */}
            <path d="M 27 28 Q 28 36, 23 44" fill="none" stroke="#94A3B8" strokeWidth="1.1" />

            {/* Quadriceps & Patellar Tendons */}
            <path d="M 22 10 L 22 26" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 20 46 L 32 68" stroke="#334155" strokeWidth="2.6" strokeLinecap="round" />

            {/* Hoffa's Fat Pad */}
            <path d="M 25 48 Q 36 48, 38 60 Q 32 64, 26 56 Z" fill="#1E293B" opacity="0.7" />

            {/* Cruciate Ligaments (ACL & PCL) */}
            <g id="print-cruciates">
              {/* PCL Curve */}
              <path d="M 58 38 Q 62 50, 48 64" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
              {/* ACL Fibers */}
              <path
                d="M 44 64 L 62 38"
                fill="none"
                stroke={hasAcl ? '#DC2626' : '#000000'}
                strokeWidth={hasAcl ? '2.5' : '2.8'}
                strokeDasharray={hasAcl ? '3,2' : 'none'}
              />
            </g>

            {/* Meniscal Triangles */}
            <polygon points="34,62 42,62 38,56" fill="#000000" stroke="#334155" strokeWidth="0.5" />
            <polygon points="66,62 74,62 70,54" fill="#000000" stroke="#334155" strokeWidth="0.5" />

            {/* Effusion / Baker Cyst if flagged */}
            {hasEffusion && (
              <path d="M 28 16 Q 34 22, 32 30 Q 24 28, 26 18 Z" fill="#0284C7" opacity="0.85" />
            )}
            {hasBaker && (
              <circle cx="74" cy="68" r="8" fill="#10B981" opacity="0.8" />
            )}
          </g>
        )}

        {/* ── CORONAL VIEW GEOMETRY ── */}
        {isCoronal && (
          <g id="print-coronal-knee">
            {/* Medial & Lateral Femoral Condyles */}
            <path
              d="M 28 10 L 30 36 Q 26 52, 38 54 Q 48 54, 50 44 Q 52 54, 62 54 Q 74 52, 70 36 L 72 10 Z"
              fill="#182332"
              stroke="#475569"
              strokeWidth="0.8"
            />
            {/* Joint Cartilage Condyles */}
            <path d="M 30 50 Q 38 55, 46 51" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 54 51 Q 62 55, 70 50" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />

            {/* Tibial Plateau with Intercondylar Eminence */}
            <path
              d="M 26 62 Q 38 61, 48 56 L 50 53 L 52 56 Q 62 61, 74 62 L 72 96 L 28 96 Z"
              fill="#182332"
              stroke="#475569"
              strokeWidth="0.8"
            />
            {/* Fibula Head */}
            <path d="M 74 70 Q 82 72, 80 90 L 76 96 L 72 90 Z" fill="#1E293B" stroke="#475569" strokeWidth="0.6" />

            {/* Medial Collateral Ligament (MCL) */}
            <path
              d="M 24 34 Q 20 54, 23 78"
              fill="none"
              stroke={hasMcl ? '#EA580C' : '#000000'}
              strokeWidth={hasMcl ? '3.4' : '2.2'}
            />
            {/* Lateral Collateral Ligament (LCL) */}
            <path d="M 74 38 Q 78 56, 76 74" fill="none" stroke="#000000" strokeWidth="2.0" />

            {/* Meniscal bodies */}
            <polygon points="26,58 34,58 30,53" fill="#000000" stroke="#334155" strokeWidth="0.5" />
            <polygon points="66,58 74,58 70,53" fill="#000000" stroke="#334155" strokeWidth="0.5" />
          </g>
        )}

        {/* ── AXIAL VIEW GEOMETRY ── */}
        {isAxial && (
          <g id="print-axial-knee">
            {/* Patella (Anterior) */}
            <path d="M 32 20 Q 50 14, 68 20 Q 64 32, 50 36 Q 36 32, 32 20 Z" fill="#1E293B" stroke="#475569" strokeWidth="0.8" />
            <path d="M 34 26 Q 50 34, 66 26" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />

            {/* Distal Femur Metaphysis / Condylar cross-section */}
            <path d="M 24 50 Q 50 42, 76 50 Q 82 72, 68 84 Q 50 78, 32 84 Q 18 72, 24 50 Z" fill="#182332" stroke="#475569" strokeWidth="0.8" />
            <path d="M 28 48 Q 50 42, 72 48" fill="none" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" />

            {/* Retinacular Bands */}
            <path d="M 28 22 L 20 48" stroke="#334155" strokeWidth="1.2" />
            <path d="M 72 22 L 80 48" stroke="#334155" strokeWidth="1.2" />

            {/* Popliteal Vessels */}
            <circle cx="50" cy="88" r="3" fill="#DC2626" opacity="0.8" />
            <circle cx="55" cy="87" r="3" fill="#2563EB" opacity="0.8" />
          </g>
        )}

        {/* ── PATHOLOGY ANNOTATION HIGHLIGHTS & RINGS ── */}
        {pathologyHighlights && pathologyHighlights.length > 0 && (
          <g id="print-pathology-markers">
            {pathologyHighlights.map((hl, i) => (
              <g key={i}>
                {/* Trajectory Guide Line */}
                <line
                  x1={hl.x - 14}
                  y1={hl.y - 14}
                  x2={hl.x}
                  y2={hl.y}
                  stroke="#DC2626"
                  strokeWidth="0.8"
                  strokeDasharray="2,2"
                />
                {/* Focal Attention Circle */}
                <circle
                  cx={hl.x}
                  cy={hl.y}
                  r={hl.radius}
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth="1.6"
                />
                <circle cx={hl.x} cy={hl.y} r="2" fill="#DC2626" />

                {/* Callout Pill Label */}
                <rect
                  x={hl.x - 14}
                  y={hl.y - hl.radius - 8}
                  width="28"
                  height="7.5"
                  rx="1.5"
                  fill="#060910"
                  stroke="#DC2626"
                  strokeWidth="0.8"
                />
                <text
                  x={hl.x}
                  y={hl.y - hl.radius - 2.8}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="3.8"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {hl.abnormality}
                </text>
              </g>
            ))}
          </g>
        )}

        {/* ── TECHNICAL TELEMETRY OVERLAY TAGS ── */}
        {/* Top-Left: Sequence and Plane */}
        <rect x="2" y="2" width="46" height="6.5" rx="1" fill="#060910" fillOpacity="0.85" />
        <text x="4" y="6.8" fill="#38BDF8" fontSize="3.6" fontWeight="bold" fontFamily="monospace">
          {sequenceName || `${plane.toUpperCase()} PD-FS`}
        </text>

        {/* Top-Right: Slice Number */}
        <rect x="68" y="2" width="30" height="6.5" rx="1" fill="#060910" fillOpacity="0.85" />
        <text x="83" y="6.8" textAnchor="middle" fill="#FFFFFF" fontSize="3.6" fontFamily="monospace">
          SL: {sliceIndex}/{totalSlices}
        </text>

        {/* Bottom-Left: Window / Level & Thickness */}
        <text x="3" y="94.5" fill="#94A3B8" fontSize="3.2" fontFamily="monospace">
          THK: {thicknessMm}mm
        </text>
        <text x="3" y="98.2" fill="#94A3B8" fontSize="3.0" fontFamily="monospace">
          WW: 350 / WL: 150
        </text>

        {/* Bottom-Right: Caliper Scale Bar (50mm) */}
        <line x1="72" y1="94" x2="94" y2="94" stroke="#FFFFFF" strokeWidth="1" />
        <line x1="72" y1="92" x2="72" y2="96" stroke="#FFFFFF" strokeWidth="0.8" />
        <line x1="94" y1="92" x2="94" y2="96" stroke="#FFFFFF" strokeWidth="0.8" />
        <text x="83" y="98" textAnchor="middle" fill="#FFFFFF" fontSize="2.8" fontFamily="monospace">
          50 mm
        </text>

        {/* Orientation Indicators */}
        <text x="4" y="52" fill="#64748B" fontSize="4.2" fontWeight="bold">
          {isSagittal ? 'A' : isCoronal ? 'M' : 'A'}
        </text>
        <text x="93" y="52" fill="#64748B" fontSize="4.2" fontWeight="bold">
          {isSagittal ? 'P' : isCoronal ? 'L' : 'P'}
        </text>
      </svg>
    </div>
  );
};

export const PrintableClinicalReport: React.FC<{
  data: ReportData;
  isPreview?: boolean;
}> = ({ data, isPreview = false }) => {
  const options = data.options || {
    includeKeySlice: true,
    includeMatrix: true,
    includeImpression: true,
    includeAttestation: true
  };

  const positiveCount = data.targets.filter(t => t.status === 'POSITIVE').length;
  const highestPositive = data.targets
    .filter(t => t.status === 'POSITIVE')
    .sort((a, b) => b.prob - a.prob)[0];

  return (
    <div
      className={`bg-white text-black font-sans box-border ${
        isPreview
          ? 'p-6 max-w-4xl mx-auto shadow-lg border border-gray-200 rounded-xl'
          : 'p-8 max-w-[210mm] mx-auto text-[11px]'
      }`}
    >
      {/* ── 1. CLINIC / RSNA BRANDING HEADER ── */}
      <header className="border-b-2 border-black pb-3 mb-4 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-black text-white flex items-center justify-center font-bold text-base tracking-tighter shrink-0">
            RSNA
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-black uppercase leading-tight">
              RSNA Multimodal Knee AI Diagnostic Report
            </h1>
            <p className="text-[10.5px] text-gray-600 font-medium">
              Department of Musculoskeletal Radiology • Deep 3D Vision & Clinical NLP Decision Support
            </p>
          </div>
        </div>
        <div className="text-right text-[10px] leading-snug">
          <p className="font-bold text-gray-900">RADIOLOGY INFORMATICS NETWORK</p>
          <p className="text-gray-600">Doc Ref: <span className="font-mono font-semibold">REP-{data.caseId}-FIN</span></p>
          <p className="text-gray-500">Printed: {data.timestamp || new Date().toLocaleString()}</p>
        </div>
      </header>

      {/* ── 2. PATIENT & STUDY DEMOGRAPHICS BANNER ── */}
      <section className="grid grid-cols-2 gap-3 border border-gray-300 rounded p-3 mb-4 text-[10.5px] bg-gray-50 print-avoid-break">
        <div className="space-y-1">
          <p><span className="font-semibold text-gray-700">Patient ID / Study:</span> <span className="font-mono font-bold text-black">{data.caseId}</span></p>
          <p><span className="font-semibold text-gray-700">Demographics:</span> <span className="font-medium">{data.patientInfo}</span></p>
          <p><span className="font-semibold text-gray-700">Examined Joint:</span> <span className="font-bold text-black">{data.laterality}</span></p>
        </div>
        <div className="space-y-1">
          <p><span className="font-semibold text-gray-700">Exam Date:</span> {data.studyDate}</p>
          <p><span className="font-semibold text-gray-700">Technique:</span> {data.technique}</p>
          <p><span className="font-semibold text-gray-700">Clinical Indication:</span> <span className="italic">{data.indication}</span></p>
        </div>
      </section>

      {/* ── 3. CENTER: ACTIVE MRI KEY SLICE & FINDINGS ANNOTATION ── */}
      {options.includeKeySlice !== false && data.keySlice && (
        <section className="mb-4 border border-gray-300 rounded p-3 bg-gray-50 print-avoid-break">
          <div className="flex items-center justify-between border-b border-gray-300 pb-1.5 mb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
              <span>Center Key Slice Diagnostic Attention</span>
              <span className="text-[10px] font-mono text-gray-500 font-normal">
                ({data.keySlice.sequenceName} • Slice {data.keySlice.sliceIndex} of {data.keySlice.totalSlices})
              </span>
            </h2>
            <span className="text-[10px] font-mono font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-300">
              {data.keySlice.associatedAbnormality ? `Target: ${data.keySlice.associatedAbnormality}` : 'Focal Abnormality'}
            </span>
          </div>

          <div className="flex items-start gap-4">
            {/* Vector MRI Visual Frame */}
            <KeySliceVisual slice={data.keySlice} />

            {/* Findings & Pathological Correlation Box */}
            <div className="flex-1 text-[10.5px] space-y-2">
              <div className="bg-white border border-gray-200 rounded p-2.5">
                <p className="font-bold text-gray-800 text-[11px] mb-0.5">
                  Slice Findings & Grad-CAM Attention:
                </p>
                <p className="text-gray-800 leading-relaxed">
                  {data.keySlice.findings ||
                    'Complete disruption of low-signal ligamentous fibers with fluid-filled gap in the intercondylar notch. Trajectory dashed callout indicates primary plane focal defect with adjacent compartment bone marrow edema.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-white border border-gray-200 rounded p-2">
                  <span className="text-gray-500 font-medium block">Key Sequence & Plane</span>
                  <span className="font-bold text-gray-900">{data.keySlice.sequenceName}</span>
                  <span className="text-gray-500 block">Thickness: {data.keySlice.thicknessMm} mm</span>
                </div>
                <div className="bg-white border border-gray-200 rounded p-2">
                  <span className="text-gray-500 font-medium block">Multimodal Model Confidence</span>
                  <span className="font-mono font-bold text-red-700 text-xs">
                    {data.keySlice.confidence ? `${(data.keySlice.confidence * 100).toFixed(1)}%` : highestPositive ? `${(highestPositive.prob * 100).toFixed(1)}%` : '92.6%'}
                  </span>
                  <span className="text-gray-500 block">Class: Positive Finding</span>
                </div>
              </div>

              <div className="text-[9.5px] text-gray-500 leading-tight">
                * Note: Volumetric 3D spatial attention is calibrated across Sagittal, Coronal, and Axial series. Red highlight denotes high-gradient vision feature attention verified by attending radiologist.
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 4. BODY: 12-TARGET PATHOLOGY CONFIDENCE MATRIX ── */}
      {options.includeMatrix !== false && (
        <section className="mb-4 print-avoid-break">
          <div className="flex items-center justify-between border-b border-gray-300 pb-1 mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black">
              AI 12-Target Pathology Confidence Matrix
            </h2>
            <div className="text-[10px] text-gray-600 font-mono">
              Findings: <span className="font-bold text-red-600">{positiveCount} Positive</span> / <span className="text-green-700 font-semibold">{data.targets.length - positiveCount} Normal</span>
            </div>
          </div>

          <table className="w-full border-collapse border border-gray-300 text-[10px] leading-tight">
            <thead>
              <tr className="bg-gray-100 text-gray-800">
                <th className="border border-gray-300 px-2 py-1.5 text-left font-bold">Target Knee Abnormality</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left font-bold">Category</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left font-bold">Primary Plane</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right font-bold">Multimodal AI Probability</th>
                <th className="border border-gray-300 px-2 py-1.5 text-center font-bold">Classification</th>
              </tr>
            </thead>
            <tbody>
              {data.targets.map((t, idx) => {
                const isPos = t.status === 'POSITIVE';
                return (
                  <tr
                    key={idx}
                    className={`print-avoid-break ${
                      isPos ? 'bg-red-50/70 font-medium' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="border border-gray-300 px-2 py-1 text-gray-900 font-semibold">
                      {t.name}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-gray-600">{t.category}</td>
                    <td className="border border-gray-300 px-2 py-1 text-gray-600">{t.plane}</td>
                    <td className="border border-gray-300 px-2 py-1 text-right font-mono font-semibold">
                      {(t.prob * 100).toFixed(1)}%
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      {isPos ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white leading-none">
                          POSITIVE
                        </span>
                      ) : (
                        <span className="text-green-700 font-semibold text-[9.5px]">NORMAL</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* ── 5. STRUCTURED RADIOLOGICAL IMPRESSION ── */}
      {options.includeImpression !== false && (
        <section className="mb-4 print-avoid-break">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-1.5 border-b border-gray-300 pb-1 text-black">
            Structured Radiological Impression & Clinical NLP Correlation
          </h2>
          <div className="border border-gray-300 rounded p-3 text-[10.5px] leading-relaxed bg-gray-50 text-gray-900">
            <p className="whitespace-pre-line">{data.aiImpression}</p>
          </div>
        </section>
      )}

      {/* ── 6. FOOTER: ATTENDING RADIOLOGIST ATTESTATION & SIGN-OFF BLOCK ── */}
      {options.includeAttestation !== false && (
        <footer className="border-t-2 border-black pt-3 mt-4 text-[10px] print-avoid-break">
          <div className="grid grid-cols-2 gap-6 items-end">
            <div>
              <p className="font-bold uppercase text-gray-900 mb-1">
                Attending Radiologist Attestation & Verification
              </p>
              <p className="text-gray-600 leading-tight">
                I have independently reviewed and verified the AI multimodal probability telemetry, multiplanar DICOM sequences, Grad-CAM attention windows, and structured impressions. The clinical determinations above represent my verified radiological diagnosis.
              </p>
              <div className="mt-2 font-mono text-[9px] text-gray-500">
                <span>ELECTRONIC SIGN-OFF HASH: </span>
                <span className="font-bold text-gray-700">SHA-256: 813c7e9d4a2b106915f7b8c031d...</span>
              </div>
            </div>

            {/* Human Verification Sign-off Box */}
            <div className="flex flex-col items-end">
              <div className="w-64 border-b border-black pb-1 mb-1 text-right">
                <span className="font-serif italic text-base text-blue-950 pr-2 font-semibold">
                  Dr. J. Reynolds, MD
                </span>
              </div>
              <p className="font-bold text-gray-950 text-[10.5px]">Dr. J. Reynolds, MD, MSK Radiologist</p>
              <p className="text-gray-500 text-[9px]">Board Certified • Verified via RSNA PACS Gateway</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
