export type AbnormalityKey =
  | 'ACL'
  | 'MCL'
  | 'Medial Meniscus'
  | 'Lateral Meniscus'
  | 'Medial OA'
  | 'Lateral OA'
  | 'PF OA'
  | 'Effusion'
  | 'Synovitis'
  | "Baker's"
  | 'Contusion'
  | 'Fracture';

export interface AbnormalityMeta {
  key: AbnormalityKey;
  shortName: string;
  category: 'Ligament' | 'Meniscus' | 'Cartilage/OA' | 'Fluid/Inflammation' | 'Bone/Trauma';
  description: string;
  primaryPlane: 'Sagittal' | 'Coronal' | 'Axial';
  keySequence: string;
  clinicalSignificance: string;
  color: string;
  urgencyTier: 'Urgent Surgical' | 'Moderate Orthopedic' | 'Conservative Management' | 'Routine Monitoring';
  clinicalRecommendations: string[];
  surgicalIndication: string;
  conservativeProtocol: string;
  imagingFollowUp: string;
  mlModelingRecommendations: string[];
  baselineAuc?: number;
}

export type ViewPlane = 'Sagittal' | 'Coronal' | 'Axial';

export interface MriSlice {
  sliceIndex: number;
  totalSlices: number;
  plane: ViewPlane;
  sequenceName: string; // e.g. 'Sagittal PD-FS', 'Coronal T2', 'Axial PD'
  thicknessMm: number;
  findings?: string;
  pathologyHighlights?: {
    abnormality: AbnormalityKey;
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    radius: number;
    severity: 'mild' | 'moderate' | 'severe';
    description: string;
  }[];
}

export interface RadiologyReportSection {
  title: string;
  content: string;
  highlightedEntities?: {
    text: string;
    abnormality: AbnormalityKey;
    findingType: 'positive' | 'negative' | 'equivocal';
    planeHint?: ViewPlane;
    sliceHint?: number;
  }[];
}

export type IngestionStream = 'PACS_DICOM' | 'FILM_SHEET_OCR';
export type SourceFidelity = '16-bit Native Volumetric' | '8-bit Digitized Tiles';

export interface FilmGridTile {
  tileId: string;
  gridRow: number;
  gridCol: number;
  plane: ViewPlane;
  estimatedSliceIndex: number;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number }; // percentages
  included: boolean;
  intensityNormalized?: boolean;
}

export interface IngestionMetadata {
  stream: IngestionStream;
  sourceFidelity: SourceFidelity;
  ingestionTimestamp: string;
  pacsServerAETitle?: string;
  port?: number;
  transferSyntaxUID?: string;
  photometricInterpretation?: string;
  pixelSpacing?: [number, number];
  sliceThicknessMm?: number;
  repetitionTimeMs?: number;
  echoTimeMs?: number;
  directionCosines?: number[];
  ocrConfidence?: number;
  gridShape?: [number, number]; // e.g. [3, 4] for 12 tiles
  tiledSlicesCount?: number;
}

export interface StudyInstance {
  studyInstanceUID: string;
  patientId: string;
  patientAge: number;
  patientGender: 'M' | 'F';
  kneeSide: 'Left' | 'Right';
  clinicalIndication: string;
  studyDate: string;
  magnetStrength: '1.5T' | '3.0T';
  sourceFidelity?: SourceFidelity;
  ingestionStream?: IngestionStream;
  ingestionMetadata?: IngestionMetadata;
  report: {
    clinicalHistory: string;
    technique: string;
    comparison: string;
    findings: {
      cruciateLigaments: string;
      collateralLigaments: string;
      menisci: string;
      articularCartilage: string;
      osseousStructures: string;
      jointFluidSynovium: string;
    };
    impression: string[];
  };
  slices: {
    sagittal: MriSlice[];
    coronal: MriSlice[];
    axial: MriSlice[];
  };
  groundTruth: Record<AbnormalityKey, number>; // 0 or 1
  baselinePredictions?: Record<AbnormalityKey, number>; // 0.0 - 1.0
  difficulty: 'Standard' | 'Subtle' | 'Complex Multi-trauma' | 'Normal' | 'Post-surgical';
  clinicalNotes: string;
}

export interface PredictionResult {
  studyInstanceUID: string;
  scores: Record<AbnormalityKey, number>;
  predictions?: Record<AbnormalityKey, number>;
  groundTruth?: Record<AbnormalityKey, number>;
  macroAuc?: number;
  clinicalReasoning: string;
  sliceFindings: {
    plane: ViewPlane;
    sliceNumber: number;
    description: string;
    associatedAbnormality: AbnormalityKey;
  }[];
  differentialDiagnosis: string[];
  recommendedAction: string;
  clinicalRecommendations?: string[];
  researchRecommendations?: string[];
  confidence: number;
  processingTimeMs: number;
  modelVariant: string;
  structuredCopilotOutput?: StructuredMskCopilotResponse;
  modelParams?: {
    model: string;
    temperature: number;
    topP: number;
    responseFormat: string;
  };
}

export interface RocCurvePoint {
  fpr: number;
  tpr: number;
  threshold: number;
}

export interface AbnormalityEvaluation {
  key: AbnormalityKey;
  auc: number;
  accuracy: number;
  sensitivity: number;
  specificity: number;
  f1Score: number;
  rocPoints: RocCurvePoint[];
  optimalThreshold: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
}

export interface LeaderboardEntry {
  rank: number;
  teamName: string;
  macroAuc: number;
  ligamentAuc: number;
  meniscusAuc: number;
  oaAuc: number;
  fluidAuc: number;
  boneAuc: number;
  modelSummary: string;
  submissionsCount: number;
  lastSubmission: string;
  isUser?: boolean;
}

export interface EnsembleConfig {
  visionWeight: number; // 0-1
  nlpReportWeight: number; // 0-1
  backbone3D: '3D-ResNet50' | 'ConvNeXt-3D' | 'Swin-UNETR-3D' | 'DenseNet-121-3D';
  nlpModel: 'BioMed-RoBERTa' | 'ClinicalBERT' | 'Med-Gemini-Embeddings' | 'GatorTron';
  fusionMethod: 'Cross-Attention Gating' | 'Late Fusion Concat' | 'Tensor Bilinear Pooling';
  temperatureScaling: number;
  useTTA: boolean; // Test-Time Augmentation
}

export type MacroRiskLevel = 'Critical / High Risk' | 'Moderate / Borderline' | 'Unremarkable / Negative';

export interface AnatomicalFindingItem {
  target: string;
  status: string;
  confidence_score: number;
  optimal_plane: ViewPlane;
  key_slice_index: number;
  radiological_evidence: string;
}

export interface StructuredMskCopilotResponse {
  study_id: string;
  primary_diagnosis: string;
  macro_risk_level: MacroRiskLevel;
  anatomical_findings: AnatomicalFindingItem[];
  copilot_rationale: string;
  clinical_management_protocol: string;
}

export interface ModelSettingsConfig {
  selectedModel: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-1.5-pro' | 'gemini-1.5-flash';
  temperature: number;
  topP: number;
  responseFormat: 'JSON';
}
