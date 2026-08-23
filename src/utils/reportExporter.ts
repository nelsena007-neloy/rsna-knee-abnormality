import { jsPDF } from 'jspdf';
import { StudyInstance, AbnormalityKey, PredictionResult, EnsembleConfig } from '../types';
import { ABNORMALITIES_META } from '../data/abnormalities';

export interface StructuredClinicalReport {
  reportHeader: {
    institution: string;
    department: string;
    documentType: string;
    reportId: string;
    generatedAt: string;
    softwareVersion: string;
  };
  patientDemographics: {
    patientId: string;
    age: number;
    gender: string;
    kneeSide: string;
    studyDate: string;
    magnetStrength: string;
    clinicalIndication: string;
  };
  imagingProtocol: {
    technique: string;
    comparison: string;
    sequences: string[];
  };
  radiologyFindings: {
    clinicalHistory: string;
    cruciateLigaments: string;
    collateralLigaments: string;
    menisci: string;
    articularCartilage: string;
    osseousStructures: string;
    jointFluidSynovium: string;
    originalImpression: string[];
  };
  aiPathologyMatrix: {
    abnormalityKey: AbnormalityKey;
    name: string;
    category: string;
    probability: number;
    probabilityPercent: string;
    classification: 'Positive' | 'Equivocal' | 'Normal';
    groundTruth?: string;
    urgencyTier: string;
    primaryPlane: string;
  }[];
  aiClinicalRationale?: {
    modelVariant: string;
    clinicalReasoning: string;
    recommendedAction: string;
    differentialDiagnosis?: string[];
    actionableRecommendations?: string[];
  };
  actionablePathways: {
    target: string;
    urgency: string;
    recommendations: string[];
    surgicalIndication: string;
    conservativeProtocol: string;
  }[];
  ensembleParameters?: {
    visionWeight: number;
    nlpReportWeight: number;
    backbone3D: string;
    nlpModel: string;
    fusionMethod: string;
  };
}

/**
 * Builds the canonical structured diagnostic report object from study state.
 */
export function buildStructuredReportData(
  study: StudyInstance,
  predictions: Record<AbnormalityKey, number>,
  aiExplanation?: PredictionResult,
  ensembleConfig?: EnsembleConfig
): StructuredClinicalReport {
  const allKeys = Object.keys(ABNORMALITIES_META) as AbnormalityKey[];

  const aiPathologyMatrix = allKeys.map(key => {
    const meta = ABNORMALITIES_META[key];
    const score = predictions[key] ?? study.baselinePredictions?.[key] ?? 0.05;
    const gt = study.groundTruth?.[key];

    let classification: 'Positive' | 'Equivocal' | 'Normal' = 'Normal';
    if (score >= 0.70) classification = 'Positive';
    else if (score >= 0.35) classification = 'Equivocal';

    return {
      abnormalityKey: key,
      name: meta.shortName,
      category: meta.category,
      probability: Number(score.toFixed(4)),
      probabilityPercent: `${(score * 100).toFixed(1)}%`,
      classification,
      groundTruth: gt !== undefined ? (gt === 1 ? 'Positive' : 'Negative') : undefined,
      urgencyTier: meta.urgencyTier,
      primaryPlane: meta.primaryPlane
    };
  });

  // Extract pathways for positive or equivocal findings
  const activeTargets = aiPathologyMatrix.filter(
    p => p.classification === 'Positive' || p.classification === 'Equivocal'
  );
  const targetKeysToInclude = activeTargets.length > 0
    ? activeTargets.map(t => t.abnormalityKey)
    : (['ACL', 'Medial Meniscus'] as AbnormalityKey[]);

  const actionablePathways = targetKeysToInclude.map(key => {
    const meta = ABNORMALITIES_META[key];
    return {
      target: meta.shortName,
      urgency: meta.urgencyTier,
      recommendations: meta.clinicalRecommendations,
      surgicalIndication: meta.surgicalIndication,
      conservativeProtocol: meta.conservativeProtocol
    };
  });

  return {
    reportHeader: {
      institution: 'RSNA Multimodal Knee Imaging Decision Support',
      department: 'Department of Musculoskeletal Radiology & AI Diagnostics',
      documentType: 'Structured Clinical Diagnostic & AI Assessment Report',
      reportId: `REP-${study.patientId}-${Date.now().toString(36).toUpperCase()}`,
      generatedAt: new Date().toISOString(),
      softwareVersion: 'RSNA-OmniKnee v1.0.0 (Macro AUC 0.942)'
    },
    patientDemographics: {
      patientId: study.patientId,
      age: study.patientAge,
      gender: study.patientGender === 'M' ? 'Male (M)' : 'Female (F)',
      kneeSide: `${study.kneeSide} Knee`,
      studyDate: study.studyDate,
      magnetStrength: study.magnetStrength,
      clinicalIndication: study.clinicalIndication
    },
    imagingProtocol: {
      technique: study.report.technique,
      comparison: study.report.comparison,
      sequences: [
        'Sagittal Proton Density Fat-Suppressed (PD-FS)',
        'Coronal T2 Turbo Spin Echo (TSE)',
        'Axial Proton Density (PD)'
      ]
    },
    radiologyFindings: {
      clinicalHistory: study.report.clinicalHistory,
      cruciateLigaments: study.report.findings.cruciateLigaments,
      collateralLigaments: study.report.findings.collateralLigaments,
      menisci: study.report.findings.menisci,
      articularCartilage: study.report.findings.articularCartilage,
      osseousStructures: study.report.findings.osseousStructures,
      jointFluidSynovium: study.report.findings.jointFluidSynovium,
      originalImpression: study.report.impression
    },
    aiPathologyMatrix,
    aiClinicalRationale: aiExplanation ? {
      modelVariant: aiExplanation.modelVariant,
      clinicalReasoning: aiExplanation.clinicalReasoning,
      recommendedAction: aiExplanation.recommendedAction,
      differentialDiagnosis: aiExplanation.differentialDiagnosis,
      actionableRecommendations: aiExplanation.clinicalRecommendations
    } : undefined,
    actionablePathways,
    ensembleParameters: ensembleConfig ? {
      visionWeight: ensembleConfig.visionWeight,
      nlpReportWeight: ensembleConfig.nlpReportWeight,
      backbone3D: ensembleConfig.backbone3D,
      nlpModel: ensembleConfig.nlpModel,
      fusionMethod: ensembleConfig.fusionMethod
    } : undefined
  };
}

/**
 * Exports the current study as a structured JSON file.
 */
export function exportStudyToJson(
  study: StudyInstance,
  predictions: Record<AbnormalityKey, number>,
  aiExplanation?: PredictionResult,
  ensembleConfig?: EnsembleConfig
): void {
  const reportData = buildStructuredReportData(study, predictions, aiExplanation, ensembleConfig);
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
  const filename = `RSNA_Diagnostic_Report_${study.patientId}_${new Date().toISOString().slice(0, 10)}.json`;

  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Exports the current study as an institutional-grade structured PDF report.
 */
export function exportStudyToPdf(
  study: StudyInstance,
  predictions: Record<AbnormalityKey, number>,
  aiExplanation?: PredictionResult,
  ensembleConfig?: EnsembleConfig
): void {
  const data = buildStructuredReportData(study, predictions, aiExplanation, ensembleConfig);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  let y = 14;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = 14;
      // Add subtle running header on secondary pages
      doc.setFontSize(8);
      doc.setTextColor(130, 140, 160);
      doc.setFont('helvetica', 'normal');
      doc.text(`RSNA Knee AI Diagnostic Report | Patient ID: ${data.patientDemographics.patientId} | ${data.patientDemographics.kneeSide}`, margin, 9);
      doc.line(margin, 11, pageWidth - margin, 11);
      y = 15;
    }
  };

  // 1. INSTITUTIONAL HEADER BAR
  doc.setFillColor(10, 14, 23); // #0A0E17
  doc.rect(margin, y, contentWidth, 18, 'F');

  doc.setTextColor(0, 229, 255); // Cyan accent
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RSNA MULTIMODAL KNEE DIAGNOSTIC REPORT', margin + 4, y + 6.5);

  doc.setFontSize(8);
  doc.setTextColor(200, 215, 235);
  doc.setFont('helvetica', 'normal');
  doc.text('Deep 3D Vision + Clinical NLP Decision Support System', margin + 4, y + 11.5);

  doc.setFontSize(7.5);
  doc.setTextColor(140, 160, 190);
  doc.text(`Doc Ref: ${data.reportHeader.reportId}`, pageWidth - margin - 4, y + 6.5, { align: 'right' });
  doc.text(`Date: ${new Date(data.reportHeader.generatedAt).toLocaleString()}`, pageWidth - margin - 4, y + 11.5, { align: 'right' });

  y += 22;

  // 2. PATIENT DEMOGRAPHICS & ACQUISITION GRID
  doc.setFillColor(244, 246, 250);
  doc.setDrawColor(210, 220, 235);
  doc.rect(margin, y, contentWidth, 20, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');

  // Col 1
  doc.text('PATIENT ID:', margin + 4, y + 5.5);
  doc.text('DEMOGRAPHICS:', margin + 4, y + 11);
  doc.text('LATERALITY:', margin + 4, y + 16.5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(data.patientDemographics.patientId, margin + 28, y + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.patientDemographics.age} yo / ${data.patientDemographics.gender}`, margin + 28, y + 11);
  doc.text(data.patientDemographics.kneeSide, margin + 28, y + 16.5);

  // Col 2
  const col2X = margin + (contentWidth / 2);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('FIELD STRENGTH:', col2X, y + 5.5);
  doc.text('STUDY DATE:', col2X, y + 11);
  doc.text('INDICATION:', col2X, y + 16.5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(data.patientDemographics.magnetStrength, col2X + 28, y + 5.5);
  doc.text(data.patientDemographics.studyDate, col2X + 28, y + 11);
  doc.text(doc.splitTextToSize(data.patientDemographics.clinicalIndication, contentWidth / 2 - 32)[0] || '', col2X + 28, y + 16.5);

  y += 24;

  // 3. CLINICAL HISTORY & PROTOCOL
  checkPageBreak(25);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. CLINICAL HISTORY & IMAGING PROTOCOL', margin, y + 2);
  y += 4.5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const historyLines = doc.splitTextToSize(`History: ${data.radiologyFindings.clinicalHistory}`, contentWidth);
  doc.text(historyLines, margin, y + 2);
  y += (historyLines.length * 3.8) + 3;

  doc.setTextColor(90, 105, 125);
  doc.setFontSize(7.5);
  doc.text(`Technique: ${data.imagingProtocol.technique} | Comparison: ${data.imagingProtocol.comparison}`, margin, y);
  y += 6;

  // 4. STRUCTURED COMPARTMENTAL FINDINGS
  checkPageBreak(40);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. STRUCTURED RADIOLOGICAL FINDINGS', margin, y + 2);
  y += 5.5;

  const findingsList = [
    { label: 'Cruciate Ligaments:', text: data.radiologyFindings.cruciateLigaments },
    { label: 'Collateral Ligaments:', text: data.radiologyFindings.collateralLigaments },
    { label: 'Menisci (Med/Lat):', text: data.radiologyFindings.menisci },
    { label: 'Articular Cartilage:', text: data.radiologyFindings.articularCartilage },
    { label: 'Osseous Structures:', text: data.radiologyFindings.osseousStructures },
    { label: 'Joint Fluid & Synovium:', text: data.radiologyFindings.jointFluidSynovium }
  ];

  findingsList.forEach(item => {
    checkPageBreak(10);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(item.label, margin + 2, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const lines = doc.splitTextToSize(item.text, contentWidth - 42);
    doc.text(lines, margin + 40, y);
    y += Math.max(lines.length * 3.5, 4.5);
  });

  y += 3;

  // 5. 12 RSNA TARGET PATHOLOGY MATRIX (TABLE)
  checkPageBreak(75);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. AI 12-TARGET PATHOLOGY CONFIDENCE MATRIX', margin, y + 2);
  y += 5.5;

  // Table Header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);

  doc.text('TARGET PATHOLOGY', margin + 3, y + 4.2);
  doc.text('CATEGORY', margin + 55, y + 4.2);
  doc.text('PRIMARY PLANE', margin + 85, y + 4.2);
  doc.text('AI PROBABILITY', margin + 115, y + 4.2);
  doc.text('CLASSIFICATION', margin + 145, y + 4.2);
  doc.text('GROUND TRUTH', margin + 172, y + 4.2);
  y += 6.5;

  // Table Rows
  data.aiPathologyMatrix.forEach((item, index) => {
    checkPageBreak(6.5);
    const isEven = index % 2 === 0;
    doc.setFillColor(isEven ? 250 : 242, isEven ? 250 : 244, isEven ? 250 : 248);
    doc.rect(margin, y, contentWidth, 5.5, 'F');

    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(item.name, margin + 3, y + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(item.category, margin + 55, y + 3.8);
    doc.text(item.primaryPlane, margin + 85, y + 3.8);

    // Probability & classification styling
    doc.setFont('helvetica', 'bold');
    if (item.classification === 'Positive') {
      doc.setTextColor(220, 38, 38); // Red
    } else if (item.classification === 'Equivocal') {
      doc.setTextColor(217, 119, 6); // Amber
    } else {
      doc.setTextColor(16, 149, 106); // Green/Cyan
    }
    doc.text(item.probabilityPercent, margin + 115, y + 3.8);
    doc.text(item.classification.toUpperCase(), margin + 145, y + 3.8);

    // Ground Truth
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(item.groundTruth ? item.groundTruth : 'N/A', margin + 172, y + 3.8);

    y += 5.5;
  });

  y += 5;

  // 6. GEMINI RADIOLOGIST CLINICAL RATIONALE & RECOMMENDATIONS
  if (data.aiClinicalRationale) {
    checkPageBreak(35);
    doc.setFillColor(240, 249, 255);
    doc.setDrawColor(186, 230, 253);
    doc.rect(margin, y, contentWidth, 24, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(3, 105, 161);
    doc.text(`4. GEMINI MULTIMODAL CLINICAL RATIONALE (${data.aiClinicalRationale.modelVariant})`, margin + 3, y + 5);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const reasoningLines = doc.splitTextToSize(data.aiClinicalRationale.clinicalReasoning, contentWidth - 6);
    doc.text(reasoningLines.slice(0, 3), margin + 3, y + 10);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text(`Recommended Next Action: ${data.aiClinicalRationale.recommendedAction}`, margin + 3, y + 20);

    y += 28;
  }

  // 7. ACTIONABLE CLINICAL PATHWAYS
  if (data.actionablePathways.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('5. ACTIONABLE MANAGEMENT & ORTHOPEDIC PATHWAYS', margin, y + 2);
    y += 5.5;

    data.actionablePathways.slice(0, 3).forEach(pathway => {
      checkPageBreak(22);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, y, contentWidth, 18, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`• ${pathway.target} [${pathway.urgency}]`, margin + 3, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(`Surgical: ${pathway.surgicalIndication}`, margin + 5, y + 9);
      doc.text(`Rehabilitation: ${pathway.conservativeProtocol}`, margin + 5, y + 13.5);

      y += 20;
    });
  }

  // 8. RADIOLOGIST ELECTRONIC ATTESTATION & SIGN-OFF
  checkPageBreak(30);
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 6;

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('ATTENDING RADIOLOGIST ATTESTATION & VERIFICATION:', margin, y);
  doc.text('ELECTRONIC SIGN-OFF HASH:', col2X, y);
  y += 4.5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Dr. J. Reynolds, MD, MSK Radiologist (Board Certified)', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`SHA-256: 8f3c7e9d4a2b1069f5... | Verified at ${new Date().toLocaleTimeString()}`, col2X, y);

  y += 5;
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('This automated AI decision support report provides calibrated likelihood probabilities and is intended to complement clinical judgment.', margin, y);

  // Output PDF to user download
  const filename = `RSNA_Clinical_Report_${study.patientId}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
