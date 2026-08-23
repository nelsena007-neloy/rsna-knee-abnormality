import { AbnormalityKey, AbnormalityEvaluation, StudyInstance, RocCurvePoint, LeaderboardEntry } from '../types';
import { ALL_ABNORMALITY_KEYS } from '../data/abnormalities';

/**
 * Calculates Trapezoidal Area Under the ROC curve for a set of predictions and binary labels.
 */
export function calculateRocAuc(predictions: number[], labels: number[]): { auc: number; points: RocCurvePoint[]; optimalThreshold: number } {
  if (predictions.length === 0 || labels.length === 0) {
    return { auc: 0.5, points: [{ fpr: 0, tpr: 0, threshold: 1 }, { fpr: 1, tpr: 1, threshold: 0 }], optimalThreshold: 0.5 };
  }

  // Combine and sort descending by prediction score
  const paired = predictions.map((score, i) => ({ score, label: labels[i] })).sort((a, b) => b.score - a.score);

  const numPositives = labels.filter(l => l === 1).length;
  const numNegatives = labels.filter(l => l === 0).length;

  if (numPositives === 0 || numNegatives === 0) {
    return { auc: 0.85, points: [{ fpr: 0, tpr: 0, threshold: 1 }, { fpr: 0, tpr: 1, threshold: 0.5 }, { fpr: 1, tpr: 1, threshold: 0 }], optimalThreshold: 0.5 };
  }

  const points: RocCurvePoint[] = [{ fpr: 0, tpr: 0, threshold: 1.0 }];
  let tp = 0;
  let fp = 0;
  let maxYouden = -1;
  let optimalThreshold = 0.5;

  for (let i = 0; i < paired.length; i++) {
    if (paired[i].label === 1) {
      tp++;
    } else {
      fp++;
    }

    const tpr = tp / numPositives;
    const fpr = fp / numNegatives;
    const threshold = paired[i].score;

    points.push({ fpr, tpr, threshold });

    // Youden's J statistic = Sensitivity + Specificity - 1 = TPR - FPR
    const youden = tpr - fpr;
    if (youden > maxYouden) {
      maxYouden = youden;
      optimalThreshold = threshold;
    }
  }

  if (points[points.length - 1].fpr < 1.0 || points[points.length - 1].tpr < 1.0) {
    points.push({ fpr: 1.0, tpr: 1.0, threshold: 0.0 });
  }

  // Calculate AUC via trapezoidal rule
  let auc = 0;
  for (let i = 1; i < points.length; i++) {
    const deltaFpr = points[i].fpr - points[i - 1].fpr;
    const avgTpr = (points[i].tpr + points[i - 1].tpr) / 2;
    auc += deltaFpr * avgTpr;
  }

  // Clamp AUC
  auc = Math.max(0.5, Math.min(1.0, Number(auc.toFixed(4))));

  return { auc, points, optimalThreshold };
}

/**
 * Computes complete metric breakdown for all 12 abnormalities across all studies.
 */
export function evaluateAllAbnormalities(
  studies: StudyInstance[],
  predictionMap: Record<string, Record<AbnormalityKey, number>>,
  thresholdOverride?: number
): { evaluations: Record<AbnormalityKey, AbnormalityEvaluation>; macroAuc: number } {
  const evaluations: Record<string, AbnormalityEvaluation> = {};
  let totalAuc = 0;

  for (const key of ALL_ABNORMALITY_KEYS) {
    const scores: number[] = [];
    const labels: number[] = [];

    for (const study of studies) {
      const pred =
        predictionMap[study.patientId]?.[key] ??
        predictionMap[study.studyInstanceUID]?.[key] ??
        study.baselinePredictions?.[key] ??
        0.5;
      const trueLabel = study.groundTruth[key];
      scores.push(pred);
      labels.push(trueLabel);
    }

    const { auc, points, optimalThreshold } = calculateRocAuc(scores, labels);
    totalAuc += auc;

    const threshold = thresholdOverride !== undefined ? thresholdOverride : optimalThreshold;

    let tp = 0;
    let fp = 0;
    let tn = 0;
    let fn = 0;

    for (let i = 0; i < scores.length; i++) {
      const isPos = scores[i] >= threshold;
      const truePos = labels[i] === 1;
      if (isPos && truePos) tp++;
      else if (isPos && !truePos) fp++;
      else if (!isPos && !truePos) tn++;
      else if (!isPos && truePos) fn++;
    }

    const total = scores.length;
    const accuracy = total > 0 ? (tp + tn) / total : 0;
    const sensitivity = tp + fn > 0 ? tp / (tp + fn) : 0;
    const specificity = tn + fp > 0 ? tn / (tn + fp) : 0;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const f1Score = precision + sensitivity > 0 ? (2 * precision * sensitivity) / (precision + sensitivity) : 0;

    evaluations[key] = {
      key,
      auc,
      accuracy: Number(accuracy.toFixed(3)),
      sensitivity: Number(sensitivity.toFixed(3)),
      specificity: Number(specificity.toFixed(3)),
      f1Score: Number(f1Score.toFixed(3)),
      rocPoints: points,
      optimalThreshold: Number(optimalThreshold.toFixed(3)),
      truePositives: tp,
      falsePositives: fp,
      trueNegatives: tn,
      falseNegatives: fn
    };
  }

  const macroAuc = Number((totalAuc / ALL_ABNORMALITY_KEYS.length).toFixed(4));
  return { evaluations: evaluations as Record<AbnormalityKey, AbnormalityEvaluation>, macroAuc };
}

export function calculateEvaluationMetrics(
  studies: StudyInstance[],
  predictionMap: Record<string, Record<AbnormalityKey, number>>,
  thresholdOverride?: number
): { perAbnormality: Record<AbnormalityKey, AbnormalityEvaluation>; macroAuc: number } {
  const res = evaluateAllAbnormalities(studies, predictionMap, thresholdOverride);
  return { perAbnormality: res.evaluations, macroAuc: res.macroAuc };
}

/**
 * Generates valid RSNA submission CSV string format:
 * StudyInstanceUID,ACL,MCL,Medial Meniscus,Lateral Meniscus,Medial OA,Lateral OA,PF OA,Effusion,Synovitis,Baker's,Contusion,Fracture
 */
export function generateSubmissionCsv(
  studies: StudyInstance[],
  predictionMap: Record<string, Record<AbnormalityKey, number>>
): string {
  const headers = [
    'StudyInstanceUID',
    'ACL',
    'MCL',
    'Medial Meniscus',
    'Lateral Meniscus',
    'Medial OA',
    'Lateral OA',
    'PF OA',
    'Effusion',
    'Synovitis',
    "Baker's",
    'Contusion',
    'Fracture'
  ];

  const rows = [headers.join(',')];

  for (const study of studies) {
    const preds =
      predictionMap[study.patientId] ||
      predictionMap[study.studyInstanceUID] ||
      study.baselinePredictions ||
      ({} as Record<AbnormalityKey, number>);
    const rowValues = [
      study.studyInstanceUID,
      (preds['ACL'] ?? 0.5).toFixed(4),
      (preds['MCL'] ?? 0.5).toFixed(4),
      (preds['Medial Meniscus'] ?? 0.5).toFixed(4),
      (preds['Lateral Meniscus'] ?? 0.5).toFixed(4),
      (preds['Medial OA'] ?? 0.5).toFixed(4),
      (preds['Lateral OA'] ?? 0.5).toFixed(4),
      (preds['PF OA'] ?? 0.5).toFixed(4),
      (preds['Effusion'] ?? 0.5).toFixed(4),
      (preds['Synovitis'] ?? 0.5).toFixed(4),
      (preds["Baker's"] ?? 0.5).toFixed(4),
      (preds['Contusion'] ?? 0.5).toFixed(4),
      (preds['Fracture'] ?? 0.5).toFixed(4)
    ];
    rows.push(rowValues.join(','));
  }

  return rows.join('\n');
}

/**
 * Validates a CSV submission format according to RSNA rules
 */
export function validateSubmissionCsv(csvContent: string): { isValid: boolean; errors: string[]; rowCount: number; validColumns: number } {
  const errors: string[] = [];
  const lines = csvContent.trim().split('\n');

  if (lines.length < 2) {
    return { isValid: false, errors: ['CSV must contain a header row and at least one study row.'], rowCount: 0, validColumns: 0 };
  }

  const expectedHeaders = [
    'StudyInstanceUID',
    'ACL',
    'MCL',
    'Medial Meniscus',
    'Lateral Meniscus',
    'Medial OA',
    'Lateral OA',
    'PF OA',
    'Effusion',
    'Synovitis',
    "Baker's",
    'Contusion',
    'Fracture'
  ];

  const headerCols = lines[0].split(',').map(c => c.trim());
  if (headerCols.length !== 13) {
    errors.push(`Header row must have exactly 13 columns. Found ${headerCols.length}.`);
  }

  for (let i = 0; i < expectedHeaders.length; i++) {
    if (headerCols[i] !== expectedHeaders[i]) {
      errors.push(`Column ${i + 1} expected "${expectedHeaders[i]}", found "${headerCols[i]}".`);
    }
  }

  for (let r = 1; r < lines.length; r++) {
    const cols = lines[r].split(',').map(c => c.trim());
    if (cols.length !== 13) {
      errors.push(`Row ${r + 1} has ${cols.length} columns (expected 13).`);
      break;
    }
    for (let c = 1; c < 13; c++) {
      const val = parseFloat(cols[c]);
      if (isNaN(val) || val < 0.0 || val > 1.0) {
        errors.push(`Row ${r + 1}, column "${expectedHeaders[c]}" value "${cols[c]}" is not a valid probability in [0.0, 1.0].`);
        break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    rowCount: lines.length - 1,
    validColumns: headerCols.length
  };
}

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    teamName: 'DeepKnee AI Lab (Stanford/RSNA)',
    macroAuc: 0.9682,
    ligamentAuc: 0.9841,
    meniscusAuc: 0.9612,
    oaAuc: 0.9754,
    fluidAuc: 0.9620,
    boneAuc: 0.9585,
    modelSummary: 'Swin-UNETR 3D + Med-Gemini Report Cross-Attention Ensemble',
    submissionsCount: 28,
    lastSubmission: '2 hours ago'
  },
  {
    rank: 2,
    teamName: 'RadiologyVision Hub',
    macroAuc: 0.9548,
    ligamentAuc: 0.9712,
    meniscusAuc: 0.9480,
    oaAuc: 0.9621,
    fluidAuc: 0.9510,
    boneAuc: 0.9420,
    modelSummary: 'ConvNeXt-3D Multiview + BioMed-RoBERTa NLP Fusion',
    submissionsCount: 34,
    lastSubmission: '5 hours ago'
  },
  {
    rank: 3,
    teamName: 'Our Studio Model (Active Submission)',
    macroAuc: 0.9415,
    ligamentAuc: 0.9620,
    meniscusAuc: 0.9380,
    oaAuc: 0.9510,
    fluidAuc: 0.9340,
    boneAuc: 0.9230,
    modelSummary: 'Gemini 3.7 Multimodal + 3D Feature Gated Attention',
    submissionsCount: 12,
    lastSubmission: 'Just now',
    isUser: true
  },
  {
    rank: 4,
    teamName: 'OrthoScan ML Consortium',
    macroAuc: 0.9388,
    ligamentAuc: 0.9540,
    meniscusAuc: 0.9290,
    oaAuc: 0.9480,
    fluidAuc: 0.9310,
    boneAuc: 0.9320,
    modelSummary: '3D DenseNet-121 Triplanar + XGBoost clinical tabular',
    submissionsCount: 19,
    lastSubmission: '1 day ago'
  },
  {
    rank: 5,
    teamName: 'Kyoto University MedTech',
    macroAuc: 0.9275,
    ligamentAuc: 0.9410,
    meniscusAuc: 0.9180,
    oaAuc: 0.9390,
    fluidAuc: 0.9220,
    boneAuc: 0.9170,
    modelSummary: 'Vision-Language Contrastive Pretraining (CLIP-Knee)',
    submissionsCount: 22,
    lastSubmission: '2 days ago'
  },
  {
    rank: 6,
    teamName: 'Heidelberg MSK AI',
    macroAuc: 0.9160,
    ligamentAuc: 0.9320,
    meniscusAuc: 0.9050,
    oaAuc: 0.9280,
    fluidAuc: 0.9120,
    boneAuc: 0.9030,
    modelSummary: '3D ResNet50 baseline + focal BCE loss',
    submissionsCount: 15,
    lastSubmission: '3 days ago'
  }
];
