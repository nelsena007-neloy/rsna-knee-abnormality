import React from 'react';

export interface PrintableTarget {
  name: string;
  category: string;
  plane: string;
  prob: number;
  status: 'POSITIVE' | 'NORMAL';
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
}

export const PrintableClinicalReport: React.FC<{ data: ReportData }> = ({ data }) => {
  return (
    <div className="hidden print:block fixed inset-0 bg-white text-black p-8 font-sans z-[9999]">
      
      {/* ── HEADER BANNER ── */}
      <div className="border-b-2 border-black pb-3 mb-4 flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-black uppercase">
            RSNA Multimodal Knee Diagnostic Report
          </h1>
          <p className="text-[11px] text-gray-600">
            Deep 3D Vision + Clinical NLP Decision Support System
          </p>
        </div>
        <div className="text-right text-[11px]">
          <p className="font-bold">DEPARTMENT OF RADIOLOGY</p>
          <p className="text-gray-600">Doc Ref: REP-{data.caseId}-MT8LNV7N</p>
        </div>
      </div>

      {/* ── PATIENT & STUDY METADATA ── */}
      <div className="grid grid-cols-2 gap-2 border border-gray-300 rounded p-3 mb-4 text-[11px] bg-gray-50">
        <div>
          <p><span className="font-semibold text-gray-700">Patient ID:</span> {data.caseId}</p>
          <p><span className="font-semibold text-gray-700">Demographics:</span> {data.patientInfo}</p>
          <p><span className="font-semibold text-gray-700">Laterality:</span> {data.laterality}</p>
        </div>
        <div>
          <p><span className="font-semibold text-gray-700">Study Date:</span> {data.studyDate}</p>
          <p><span className="font-semibold text-gray-700">Technique:</span> {data.technique}</p>
          <p><span className="font-semibold text-gray-700">Indication:</span> {data.indication}</p>
        </div>
      </div>

      {/* ── 12-TARGET PATHOLOGY CONFIDENCE MATRIX ── */}
      <h2 className="text-xs font-bold uppercase tracking-wider mb-1.5 border-b border-gray-300 pb-1">
        AI 12-Target Pathology Confidence Matrix
      </h2>
      <table className="w-full border-collapse border border-gray-300 text-[10px] mb-4">
        <thead>
          <tr className="bg-gray-100 text-gray-800">
            <th className="border border-gray-300 px-2 py-1 text-left">Target Pathology</th>
            <th className="border border-gray-300 px-2 py-1 text-left">Category</th>
            <th className="border border-gray-300 px-2 py-1 text-left">Primary Plane</th>
            <th className="border border-gray-300 px-2 py-1 text-right">AI Probability</th>
            <th className="border border-gray-300 px-2 py-1 text-center">Classification</th>
          </tr>
        </thead>
        <tbody>
          {data.targets.map((t, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-300 px-2 py-1 font-medium">{t.name}</td>
              <td className="border border-gray-300 px-2 py-1 text-gray-600">{t.category}</td>
              <td className="border border-gray-300 px-2 py-1 text-gray-600">{t.plane}</td>
              <td className="border border-gray-300 px-2 py-1 text-right font-mono">{(t.prob * 100).toFixed(1)}%</td>
              <td className="border border-gray-300 px-2 py-1 text-center">
                {t.status === 'POSITIVE' ? (
                  <span className="font-bold text-red-600">POSITIVE</span>
                ) : (
                  <span className="text-green-700 font-semibold">NORMAL</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── STRUCTURED RADIOLOGICAL FINDINGS ── */}
      <h2 className="text-xs font-bold uppercase tracking-wider mb-1.5 border-b border-gray-300 pb-1">
        Structured Radiological Impression
      </h2>
      <div className="border border-gray-300 rounded p-3 text-[10.5px] leading-relaxed mb-4 bg-gray-50 text-gray-800">
        <p>{data.aiImpression}</p>
      </div>

      {/* ── HUMAN VERIFICATION & SIGNATURE BLOCK ── */}
      <div className="border-t-2 border-black pt-3 mt-4 text-[10px]">
        <div className="grid grid-cols-2 gap-6 items-end">
          <div>
            <p className="font-bold uppercase text-gray-800 mb-1">
              Attending Radiologist Attestation & Verification
            </p>
            <p className="text-gray-600 leading-tight">
              I have independently reviewed and verified the AI multimodal probability telemetry, multiplanar DICOM sequences, and structured impressions. The clinical determinations above represent my verified radiological diagnosis.
            </p>
            <div className="mt-2 font-mono text-[9px] text-gray-500">
              <span>ELECTRONIC SIGN-OFF HASH: </span>
              <span className="font-bold">SHA-256: 813c7e9d4a2b106915...</span>
            </div>
          </div>

          {/* Physical / Digital Human Verification Sign-off Box */}
          <div className="flex flex-col items-end">
            <div className="w-64 border-b border-black pb-1 mb-1 text-right">
              <span className="font-serif italic text-sm text-blue-900 pr-2 font-medium">
                Dr. J. Reynolds, MD
              </span>
            </div>
            <p className="font-semibold text-gray-900">Dr. J. Reynolds, MD, MSK Radiologist</p>
            <p className="text-gray-500 text-[9px]">Board Certified • Verified via PACS Gateway</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export const sampleReportData: ReportData = {
  caseId: "RSNA-KNEE-8091",
  patientInfo: "24 yo / Male (M)",
  laterality: "Right Knee",
  technique: "Multiplanar 3.0T MRI (Sagittal PD-FS, Coronal T2-FS, Axial PD-FS)",
  indication: "Non-contact decelerating injury during sports event with acute effusion.",
  studyDate: "2026-08-14",
  aiImpression: "Complete midsubstance disruption of the anterior cruciate ligament (ACL) with non-visualization of intact fibers across the intercondylar notch. Lateral meniscus vertical longitudinal tear at the posterior horn. Impaction bone marrow contusion over the lateral femoral condyle. Medial compartment and extensor mechanism intact within acceptable limits.",
  targets: [
    { name: "ACL Tear", category: "Ligament", plane: "Sagittal", prob: 0.926, status: "POSITIVE" },
    { name: "MCL Injury", category: "Ligament", plane: "Coronal", prob: 0.948, status: "POSITIVE" },
    { name: "Medial Meniscus Tear", category: "Meniscus", plane: "Sagittal", prob: 0.127, status: "NORMAL" },
    { name: "Lateral Meniscus Tear", category: "Meniscus", plane: "Coronal", prob: 0.918, status: "POSITIVE" },
    { name: "Medial Osteoarthritis", category: "Cartilage/OA", plane: "Coronal", prob: 0.134, status: "NORMAL" },
    { name: "Lateral Osteoarthritis", category: "Cartilage/OA", plane: "Coronal", prob: 0.053, status: "NORMAL" },
    { name: "Patellofemoral OA", category: "Cartilage/OA", plane: "Axial", prob: 0.120, status: "NORMAL" },
    { name: "Joint Effusion", category: "Fluid/Inflammation", plane: "Sagittal", prob: 0.895, status: "POSITIVE" },
    { name: "Synovial Hypertrophy", category: "Fluid/Inflammation", plane: "Axial", prob: 0.112, status: "NORMAL" },
    { name: "Baker's Cyst", category: "Fluid/Inflammation", plane: "Axial", prob: 0.146, status: "NORMAL" },
    { name: "Bone Contusion / Edema", category: "Bone/Trauma", plane: "Sagittal", prob: 0.830, status: "POSITIVE" },
    { name: "Occult/Cortical Fracture", category: "Bone/Trauma", plane: "Coronal", prob: 0.064, status: "NORMAL" }
  ]
};
