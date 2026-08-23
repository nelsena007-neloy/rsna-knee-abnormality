import { ViewPlane, MriSlice, AbnormalityKey } from '../types';
import { ABNORMALITIES_META } from '../data/abnormalities';

export interface WindowLevelPreset {
  name: string;
  shortName: string;
  windowWidth: number;
  windowLevel: number;
  description: string;
  optimizedPathologies: string[];
}

export const WL_PRESETS: Record<string, WindowLevelPreset> = {
  SoftTissue: {
    name: 'Soft Tissue (Ligaments / Menisci)',
    shortName: 'Soft Tissue',
    windowWidth: 90,
    windowLevel: 52,
    description: 'High contrast for cruciate & collateral ligaments, meniscal horns, and tendon slips',
    optimizedPathologies: ['ACL Tear', 'PCL Tear', 'Medial Meniscus', 'Lateral Meniscus', 'MCL / LCL Sprain']
  },
  Bone: {
    name: 'Bone / Cortical Sclerosis',
    shortName: 'Bone',
    windowWidth: 160,
    windowLevel: 42,
    description: 'Wide dynamic range for trabecular bone, subchondral sclerosis, marrow contusions & fractures',
    optimizedPathologies: ['Bone Contusion / Fracture', 'Subchondral Sclerosis', 'Osteophytes', 'Tibial Plateau']
  },
  MAR: {
    name: 'Metal Artifact Reduction (MARS)',
    shortName: 'Metal Artifact Reduction',
    windowWidth: 220,
    windowLevel: 38,
    description: 'Suppresses susceptibility blooming, hardware flare & gradient distortion around metallic anchors or implants',
    optimizedPathologies: ['Post-Surgical Hardware', 'ACL Interference Screws', 'Knee Arthroplasty', 'Suture Anchors']
  },
  STIR: {
    name: 'Fluid Sensitive / STIR',
    shortName: 'Fluid / STIR',
    windowWidth: 75,
    windowLevel: 72,
    description: 'Emphasizes joint effusion, synovitis, popliteal Baker cysts, and high-signal marrow edema',
    optimizedPathologies: ['Joint Effusion', 'Baker Cyst', 'Synovial Thickening', 'Bone Marrow Edema']
  },
  Cartilage: {
    name: 'Cartilage Detail',
    shortName: 'Cartilage',
    windowWidth: 85,
    windowLevel: 56,
    description: 'Specialized intermediate contrast for articular surface thinning, chondral defects & wear',
    optimizedPathologies: ['Medial Cartilage Defect', 'Lateral Cartilage Wear', 'Patellofemoral Chondromalacia']
  },
  Default: {
    name: 'Standard / Proton Density',
    shortName: 'Standard',
    windowWidth: 100,
    windowLevel: 50,
    description: 'Balanced baseline contrast for general musculoskeletal survey',
    optimizedPathologies: ['General Knee Survey', 'Multi-Compartment Assessment']
  }
};

export interface RenderOptions {
  plane: ViewPlane;
  sliceIndex: number;
  totalSlices: number;
  preset: string;
  zoom: number;
  pan: { x: number; y: number };
  invert: boolean;
  showHeatmap: boolean;
  showAnnotations: boolean;
  showCrosshairs: boolean;
  crosshairPos?: { x: number; y: number };
  activePathologyHighlight?: AbnormalityKey | null;
  highlights?: MriSlice['pathologyHighlights'];
}

/**
 * Returns SVG filter and color matrices according to Window/Level adjustments
 */
export function getFilterStyles(presetKey: string, invert: boolean, customWw?: number, customWl?: number) {
  const preset = WL_PRESETS[presetKey] || WL_PRESETS.Default;
  const effectiveWw = customWw ?? preset.windowWidth ?? 100;
  const effectiveWl = customWl ?? preset.windowLevel ?? 50;

  const contrast = (120 / effectiveWw) * 100;
  const brightness = (effectiveWl / 50) * 100;
  const invertFilter = invert ? 'invert(100%)' : '';

  let extraEffects = '';
  if (presetKey === 'MAR') {
    // Metal Artifact Reduction (MARS): subtle desaturation and anti-blooming clamp
    extraEffects = 'saturate(85%)';
  } else if (presetKey === 'Bone') {
    extraEffects = 'contrast(108%)';
  } else if (presetKey === 'SoftTissue') {
    extraEffects = 'contrast(104%)';
  }

  const filterString = [
    `contrast(${contrast.toFixed(1)}%)`,
    `brightness(${brightness.toFixed(1)}%)`,
    extraEffects,
    invertFilter
  ].filter(Boolean).join(' ');

  return {
    filter: filterString
  };
}

/**
 * Procedural SVG generator for Knee MRI Cross-Sections
 */
export function generateMriSvgPaths(
  plane: ViewPlane,
  sliceIndex: number,
  totalSlices: number,
  highlights?: MriSlice['pathologyHighlights'],
  activeHighlightKey?: AbnormalityKey | null
) {
  const normalizedSlice = sliceIndex / totalSlices; // 0 to 1

  return {
    plane,
    normalizedSlice,
    highlights,
    activeHighlightKey
  };
}
