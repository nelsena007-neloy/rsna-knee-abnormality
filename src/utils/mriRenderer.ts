import { ViewPlane, MriSlice, AbnormalityKey } from '../types';
import { ABNORMALITIES_META } from '../data/abnormalities';

export interface WindowLevelPreset {
  name: string;
  windowWidth: number;
  windowLevel: number;
  description: string;
}

export const WL_PRESETS: Record<string, WindowLevelPreset> = {
  Default: { name: 'Standard / PD', windowWidth: 100, windowLevel: 50, description: 'Balanced soft tissue & fluid contrast' },
  STIR: { name: 'Fluid / STIR', windowWidth: 80, windowLevel: 70, description: 'Emphasizes joint effusion, bone edema, and Baker cyst' },
  Bone: { name: 'Bone / Sclerosis', windowWidth: 140, windowLevel: 40, description: 'High contrast for subchondral cortex & fractures' },
  Cartilage: { name: 'Cartilage Detail', windowWidth: 90, windowLevel: 55, description: 'Optimized for articular surface wear & menisci' },
  HighContrast: { name: 'High Contrast', windowWidth: 60, windowLevel: 50, description: 'Sharp edge boundaries and ligament fibers' }
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
export function getFilterStyles(presetKey: string, invert: boolean) {
  const preset = WL_PRESETS[presetKey] || WL_PRESETS.Default;
  const contrast = (120 / (preset.windowWidth || 100)) * 100;
  const brightness = ((preset.windowLevel || 50) / 50) * 100;
  const invertFilter = invert ? 'invert(100%)' : 'none';

  return {
    filter: `contrast(${contrast}%) brightness(${brightness}%) ${invertFilter}`
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
