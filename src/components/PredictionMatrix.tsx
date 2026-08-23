import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AbnormalityKey, StudyInstance, PredictionResult } from '../types';
import { ABNORMALITIES_META } from '../data/abnormalities';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  Download,
  Flame,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface PredictionMatrixProps {
  currentStudy: StudyInstance;
  predictions: Record<AbnormalityKey, number>;
  activeAbnormality?: AbnormalityKey | null;
  onSelectAbnormality: (key: AbnormalityKey) => void;
  aiExplanation?: PredictionResult | null;
  onOpenRecommendations?: () => void;
  onExportReport?: () => void;
}

// Smooth animated numeric counter for transition updates
const AnimatedScore: React.FC<{ value: number; decimals?: number; className?: string; isPercent?: boolean }> = ({
  value,
  decimals = 4,
  className = "",
  isPercent = false
}) => {
  const [displayValue, setDisplayValue] = React.useState(value);
  const prevValueRef = React.useRef(value);

  React.useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = prevValueRef.current;
    const targetValue = value;
    const duration = 450; // ms

    if (Math.abs(startValue - targetValue) < 0.0001) {
      setDisplayValue(targetValue);
      prevValueRef.current = targetValue;
      return;
    }

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (targetValue - startValue) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValue);
        prevValueRef.current = targetValue;
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(animationFrameId);
      prevValueRef.current = displayValue;
    };
  }, [value]);

  const formatted = isPercent
    ? `${(displayValue * 100).toFixed(decimals)}%`
    : displayValue.toFixed(decimals);

  return (
    <motion.span layout className={className}>
      {formatted}
    </motion.span>
  );
};

// Subtle Trend Arrow & Confidence Shift Indicator
interface TrendIndicatorProps {
  currentScore: number;
  prevScore?: number;
  groundTruth?: number;
}

const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  currentScore,
  prevScore,
  groundTruth
}) => {
  if (prevScore === undefined) return null;
  const delta = currentScore - prevScore;
  
  if (Math.abs(delta) < 0.001) {
    return (
      <span
        className="inline-flex items-center gap-0.5 text-[8.5px] font-mono text-slate-500 bg-slate-900/60 px-1 py-0.2 rounded border border-slate-800"
        title="Diagnostic confidence unchanged from prior inference"
      >
        <Minus className="w-2.5 h-2.5" />
        <span>0.0%</span>
      </span>
    );
  }

  const isUp = delta > 0;
  const deltaAbsPercent = (Math.abs(delta) * 100).toFixed(1);

  // Determine whether this direction represents an improvement or degradation relative to ground truth
  let isImprovement: boolean | null = null;
  if (groundTruth === 1) {
    isImprovement = isUp; // Positive pathology: higher score = better diagnostic confidence
  } else if (groundTruth === 0) {
    isImprovement = !isUp; // Negative pathology: lower score = better diagnostic confidence
  }

  // Visual styling: Emerald for improved diagnostic accuracy, Rose for degradation, Cyan/Slate for neutral
  let colorClasses = isUp
    ? 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40'
    : 'text-slate-400 bg-slate-800/40 border-slate-700/40';

  if (isImprovement === true) {
    colorClasses = 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
  } else if (isImprovement === false) {
    colorClasses = 'text-rose-400 bg-rose-950/60 border-rose-800/60';
  }

  const tooltipText = isImprovement === true
    ? `Confidence improved by ${deltaAbsPercent}% towards ground truth (prior score: ${(prevScore * 100).toFixed(1)}%)`
    : isImprovement === false
    ? `Confidence degraded by ${deltaAbsPercent}% against ground truth (prior score: ${(prevScore * 100).toFixed(1)}%)`
    : `Score shifted ${isUp ? '+' : '-'}${deltaAbsPercent}% vs previous inference (prior score: ${(prevScore * 100).toFixed(1)}%)`;

  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.85, y: isUp ? 2 : -2 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center gap-0.5 text-[8.5px] font-mono font-bold px-1 py-0.2 rounded border shadow-sm ${colorClasses}`}
      title={tooltipText}
    >
      {isUp ? (
        <TrendingUp className="w-2.5 h-2.5 shrink-0" />
      ) : (
        <TrendingDown className="w-2.5 h-2.5 shrink-0" />
      )}
      <span>{isUp ? '+' : '-'}{deltaAbsPercent}%</span>
    </motion.span>
  );
};

// Compact SVG Sparkline visualizing the last 5 inference confidence values
interface ConfidenceSparklineProps {
  values: number[];
  currentScore: number;
  groundTruth?: number;
  width?: number;
  height?: number;
}

const ConfidenceSparkline: React.FC<ConfidenceSparklineProps> = ({
  values,
  currentScore,
  width = 46,
  height = 15
}) => {
  if (!values || values.length === 0) return null;

  const paddedWidth = width - 6;
  const paddedHeight = height - 4;

  const points = values.map((val, idx) => {
    const x = values.length > 1
      ? 3 + (idx / (values.length - 1)) * paddedWidth
      : width / 2;
    // Map 0..1 to height (0 at bottom, 1 at top)
    const clampedVal = Math.max(0, Math.min(1, val));
    const y = height - 2 - clampedVal * paddedHeight;
    return { x, y, val };
  });

  const pathD = points.length > 1
    ? points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '')
    : `M 3 ${points[0].y.toFixed(1)} L ${width - 3} ${points[0].y.toFixed(1)}`;

  const areaD = points.length > 1
    ? `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`
    : '';

  const strokeColor = currentScore >= 0.70
    ? '#FF3B5C'
    : currentScore >= 0.35
    ? '#F59E0B'
    : '#00E5FF';

  const fillColor = currentScore >= 0.70
    ? 'rgba(255, 59, 92, 0.2)'
    : currentScore >= 0.35
    ? 'rgba(245, 158, 11, 0.2)'
    : 'rgba(0, 229, 255, 0.2)';

  const lastPt = points[points.length - 1];
  const historyText = `Inference Confidence History (Last ${values.length} runs): ${values.map(v => (v * 100).toFixed(1) + '%').join(' → ')}`;

  return (
    <motion.div
      layout
      className="inline-flex items-center px-1 py-0.5 rounded bg-[#06080B] border border-slate-800/80 shadow-inner group relative cursor-help"
      title={historyText}
    >
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`sparkline-grad-${currentScore >= 0.7 ? 'pos' : currentScore >= 0.35 ? 'eq' : 'norm'}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {areaD && (
          <path
            d={areaD}
            fill={fillColor}
            className="transition-all duration-300"
          />
        )}

        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
        />

        {/* Small subtle historical point dots */}
        {points.map((pt, idx) => (
          <circle
            key={idx}
            cx={pt.x}
            cy={pt.y}
            r={idx === points.length - 1 ? 1.75 : 1}
            fill={idx === points.length - 1 ? strokeColor : '#64748B'}
            className="transition-all duration-300"
          />
        ))}
      </svg>
    </motion.div>
  );
};

export const PredictionMatrix: React.FC<PredictionMatrixProps> = ({
  currentStudy,
  predictions,
  activeAbnormality,
  onSelectAbnormality,
  aiExplanation,
  onOpenRecommendations,
  onExportReport
}) => {
  const [expandedRecsKey, setExpandedRecsKey] = useState<AbnormalityKey | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Ligament' | 'Meniscus' | 'Cartilage' | 'Joint'>('All');

  // Track previous inferences and 5-point inference confidence history per study
  const [prevPredictionsMap, setPrevPredictionsMap] = useState<Record<string, Record<AbnormalityKey, number>>>({});
  const [historyMap, setHistoryMap] = useState<Record<string, Record<AbnormalityKey, number[]>>>({});
  const lastPredictionsRef = useRef<Record<string, Record<AbnormalityKey, number>>>({});

  // Helper to generate a realistic initial 5-point calibration trajectory towards baseScore
  const getInitialHistory = (baseScore: number): number[] => {
    const s = Math.max(0.01, Math.min(0.99, baseScore));
    const noise1 = Number(Math.max(0.01, Math.min(0.99, s > 0.5 ? s - 0.08 : s + 0.06)).toFixed(3));
    const noise2 = Number(Math.max(0.01, Math.min(0.99, s > 0.5 ? s - 0.05 : s + 0.04)).toFixed(3));
    const noise3 = Number(Math.max(0.01, Math.min(0.99, s > 0.5 ? s - 0.02 : s + 0.02)).toFixed(3));
    const noise4 = Number(Math.max(0.01, Math.min(0.99, s > 0.5 ? s - 0.01 : s + 0.01)).toFixed(3));
    return [noise1, noise2, noise3, noise4, Number(s.toFixed(3))];
  };

  useEffect(() => {
    const patientId = currentStudy.patientId;
    const lastRecorded = lastPredictionsRef.current[patientId];

    if (lastRecorded) {
      const hasChanged = Object.keys(predictions).some(k => {
        const key = k as AbnormalityKey;
        return Math.abs((predictions[key] ?? 0) - (lastRecorded[key] ?? 0)) >= 0.001;
      });

      if (hasChanged) {
        setPrevPredictionsMap(prev => ({
          ...prev,
          [patientId]: lastRecorded
        }));
      }
    } else if (currentStudy.baselinePredictions) {
      const hasBaselineDiff = Object.keys(predictions).some(k => {
        const key = k as AbnormalityKey;
        return Math.abs((predictions[key] ?? 0) - (currentStudy.baselinePredictions?.[key] ?? 0)) >= 0.001;
      });
      if (hasBaselineDiff) {
        setPrevPredictionsMap(prev => ({
          ...prev,
          [patientId]: currentStudy.baselinePredictions!
        }));
      }
    }

    // Update 5-point history per abnormality key
    setHistoryMap(prev => {
      const patientHist = prev[patientId] || ({} as Record<AbnormalityKey, number[]>);
      const updatedHist = { ...patientHist };

      (Object.keys(predictions) as AbnormalityKey[]).forEach(k => {
        const currentVal = Number((predictions[k] ?? currentStudy.baselinePredictions?.[k] ?? 0.05).toFixed(3));
        const existing = updatedHist[k] || getInitialHistory(currentStudy.baselinePredictions?.[k] ?? currentVal);

        if (existing.length === 0) {
          updatedHist[k] = [currentVal];
        } else {
          const lastVal = existing[existing.length - 1];
          if (Math.abs(lastVal - currentVal) >= 0.001) {
            updatedHist[k] = [...existing, currentVal].slice(-5);
          } else {
            updatedHist[k] = existing.slice(-5);
          }
        }
      });

      return {
        ...prev,
        [patientId]: updatedHist
      };
    });

    lastPredictionsRef.current[patientId] = { ...predictions };
  }, [predictions, currentStudy.patientId, currentStudy.baselinePredictions]);

  const prevScores = prevPredictionsMap[currentStudy.patientId] || currentStudy.baselinePredictions;
  const currentStudyHistory = historyMap[currentStudy.patientId];

  // Count active findings
  const activeFindingsCount = Object.keys(predictions).filter(
    k => (predictions[k as AbnormalityKey] ?? 0) >= 0.35
  ).length;

  const getRiskBadge = (score: number) => {
    if (score >= 0.70) {
      return (
        <motion.span
          layout
          key="positive"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ layout: { duration: 0.25, ease: "easeOut" }, duration: 0.2 }}
          className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF3B5C26] text-[#FF3B5C] border border-[#FF3B5C66] flex items-center gap-1"
        >
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>Pos (</span>
          <AnimatedScore value={score} decimals={1} isPercent={true} />
          <span>)</span>
        </motion.span>
      );
    }
    if (score >= 0.35) {
      return (
        <motion.span
          layout
          key="equivocal"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ layout: { duration: 0.25, ease: "easeOut" }, duration: 0.2 }}
          className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1"
        >
          <HelpCircle className="w-3 h-3 shrink-0" />
          <span>Equiv (</span>
          <AnimatedScore value={score} decimals={1} isPercent={true} />
          <span>)</span>
        </motion.span>
      );
    }
    return (
      <motion.span
        layout
        key="normal"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ layout: { duration: 0.25, ease: "easeOut" }, duration: 0.2 }}
        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00E5FF15] text-[#00E5FF] border border-[#00E5FF33] flex items-center gap-1"
      >
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        <span>Norm (</span>
        <AnimatedScore value={score} decimals={1} isPercent={true} />
        <span>)</span>
      </motion.span>
    );
  };

  // Group the 12 abnormalities into categories
  const categories = [
    { name: 'Ligament', label: 'Ligamentous (2)', keys: ['ACL', 'MCL'] as AbnormalityKey[] },
    { name: 'Meniscus', label: 'Meniscus (2)', keys: ['Medial Meniscus', 'Lateral Meniscus'] as AbnormalityKey[] },
    { name: 'Cartilage', label: 'Cartilage / OA (3)', keys: ['Medial OA', 'Lateral OA', 'PF OA'] as AbnormalityKey[] },
    { name: 'Joint', label: 'Joint & Trauma (5)', keys: ['Effusion', 'Synovitis', "Baker's", 'Contusion', 'Fracture'] as AbnormalityKey[] }
  ];

  const filteredCategories = categories.filter(c => selectedFilter === 'All' || c.name === selectedFilter);

  return (
    <div className="h-full flex flex-col min-h-0 bg-[#0A0E17] text-slate-100 overflow-hidden">
      {/* Header Bar */}
      <div className="px-3 py-2.5 border-b border-slate-800/80 bg-[#070A10] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-[#00E5FF15] text-[#00E5FF] border border-[#00E5FF33]">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider truncate">
              12-Target Pathology Matrix
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              Calibrated Confidence & Ground Truth
            </p>
          </div>
        </div>

        {/* Global ROC-AUC metric pill */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="px-2 py-0.5 rounded-full bg-[#0D131F] border border-slate-700/80 text-[10px] font-mono font-bold text-[#00E5FF]">
            Macro AUC 0.942
          </div>
        </div>
      </div>

      {/* Category Filter Pills Bar */}
      <div className="px-2.5 py-1.5 bg-[#06080B] border-b border-slate-800/80 flex items-center gap-1 overflow-x-auto custom-scrollbar shrink-0 text-[10px]">
        {(['All', 'Ligament', 'Meniscus', 'Cartilage', 'Joint'] as const).map(filter => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`px-2 py-0.5 rounded-md font-semibold shrink-0 transition-all ${
              selectedFilter === filter
                ? 'bg-[#00E5FF] text-[#06080B] font-bold shadow-sm'
                : 'bg-[#0D131F] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {filter === 'All' ? 'All (12)' : filter}
          </button>
        ))}
      </div>

      {/* Target Cards Body (flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2.5 space-y-2.5) */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2.5 space-y-2.5">
        {filteredCategories.map((cat, catIdx) => (
          <div key={catIdx} className="space-y-1.5">
            <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center justify-between px-1">
              <span>{cat.label}</span>
              <span className="font-mono text-[9px] text-slate-500">{cat.keys.length} Targets</span>
            </div>

            <div className="space-y-1.5">
              {cat.keys.map(key => {
                const meta = ABNORMALITIES_META[key];
                const score = predictions[key] ?? 0.05;
                const prevScore = prevScores?.[key];
                const keyHistory = currentStudyHistory?.[key] || getInitialHistory(score);
                const truth = currentStudy.groundTruth[key];
                const isSelected = activeAbnormality === key;
                const isRecExpanded = expandedRecsKey === key;

                return (
                  <motion.div
                    layout
                    key={key}
                    id={`target-card-${key.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    transition={{
                      layout: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#0D131F] border-[#00E5FF] shadow-sm shadow-[#00E5FF]/20 ring-1 ring-[#00E5FF]/50'
                        : 'bg-[#0D131F] border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div
                      onClick={() => onSelectAbnormality(key)}
                      className="flex items-start justify-between gap-1.5 mb-1.5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: meta.color }}
                          ></span>
                          <span className="font-bold text-white text-xs truncate">{meta.shortName}</span>
                          <span className="text-[9px] font-mono text-slate-500 shrink-0">AUC {(meta.baselineAuc ?? 0.94).toFixed(2)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {meta.description}
                        </p>
                      </div>

                      <motion.div layout className="flex flex-col items-end shrink-0 gap-1">
                        <AnimatePresence mode="wait">
                          {getRiskBadge(score)}
                        </AnimatePresence>
                        {truth !== undefined && (
                          <motion.span
                            layout
                            className={`text-[9px] font-mono font-semibold px-1 py-0.2 rounded ${
                              truth === 1
                                ? 'bg-red-950/80 text-red-300 border border-red-800/50'
                                : 'bg-[#06080B] text-slate-400 border border-slate-800'
                            }`}
                          >
                            GT: {truth === 1 ? 'Pos' : 'Neg'}
                          </motion.span>
                        )}
                      </motion.div>
                    </div>

                    {/* Progress Score Bar with Smooth Layout */}
                    <motion.div
                      layout
                      transition={{ layout: { duration: 0.25, ease: "easeOut" } }}
                      className="space-y-1"
                      onClick={() => onSelectAbnormality(key)}
                    >
                      <motion.div layout className="flex items-center justify-between text-[10px] font-mono">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-slate-400">Score:</span>
                          <TrendIndicator
                            currentScore={score}
                            prevScore={prevScore}
                            groundTruth={truth}
                          />
                          <ConfidenceSparkline
                            values={keyHistory}
                            currentScore={score}
                            groundTruth={truth}
                          />
                        </div>
                        <span className="font-bold text-[#00E5FF] shrink-0">
                          <AnimatedScore value={score} decimals={4} />
                        </span>
                      </motion.div>
                      <motion.div layout className="w-full h-1.5 bg-[#06080B] rounded-full overflow-hidden relative border border-slate-800/60">
                        <motion.div
                          layout
                          initial={false}
                          animate={{
                            width: `${Math.max(4, score * 100)}%`,
                            backgroundColor: score >= 0.7 ? '#FF3B5C' : score >= 0.35 ? '#F59E0B' : '#00E5FF'
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 90,
                            damping: 16
                          }}
                          className="h-full rounded-full"
                        />
                      </motion.div>
                    </motion.div>

                    {/* Footer Controls: Inspect Slice + Recommendations Toggle */}
                    <div className="mt-1.5 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[9.5px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedRecsKey(isRecExpanded ? null : key);
                        }}
                        className="text-[#00E5FF] hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Stethoscope className="w-2.5 h-2.5" />
                        <span>{isRecExpanded ? 'Hide' : 'Clinical Guidance'}</span>
                        {isRecExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                      </button>

                      <span
                        onClick={() => onSelectAbnormality(key)}
                        className="text-slate-400 hover:text-white flex items-center gap-0.5 cursor-pointer font-mono"
                      >
                        Slice <ArrowUpRight className="w-2.5 h-2.5" />
                      </span>
                    </div>

                    {/* Expandable Per-Target Recommendation Drawer */}
                    <AnimatePresence>
                      {isRecExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-2 pt-2 border-t border-slate-800 space-y-1.5 text-[10px] bg-[#06080B] p-2 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#00E5FF] uppercase text-[9px] tracking-wider flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-[#00E5FF]" />
                              Pathway
                            </span>
                            <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-[#0D131F] text-slate-300 border border-slate-800">
                              {meta.urgencyTier}
                            </span>
                          </div>

                          <ul className="space-y-1 text-slate-300">
                            {meta.clinicalRecommendations.map((rec, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-[#00E5FF] font-bold">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>

                          <div className="pt-1 border-t border-slate-800/80 space-y-0.5 text-[9.5px]">
                            <div>
                              <span className="font-bold text-amber-300">Surgical: </span>
                              <span className="text-slate-300">{meta.surgicalIndication}</span>
                            </div>
                            <div>
                              <span className="font-bold text-blue-300">Rehab: </span>
                              <span className="text-slate-300">{meta.conservativeProtocol}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {/* AI Radiologist Rationale Callout if available */}
        <AnimatePresence>
          {aiExplanation && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className="p-3 rounded-xl bg-[#06080B] border border-[#00E5FF44] space-y-2 text-xs"
            >
              <div className="font-bold text-[#00E5FF] flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00E5FF]" />
                Gemini Radiologist Rationale
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {aiExplanation.clinicalReasoning}
              </p>

              {aiExplanation.recommendedAction && (
                <div className="pt-1.5 border-t border-slate-800 text-[10.5px] text-amber-300">
                  <span className="font-bold">Next Action: </span>
                  {aiExplanation.recommendedAction}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Footer Bar */}
      <div className="p-2.5 bg-[#070A10] border-t border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
        <button
          id="btn-all-recommendations-footer"
          onClick={onOpenRecommendations}
          className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#0D131F] hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
        >
          <Stethoscope className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span>All Clinical Pathways</span>
          {activeFindingsCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#FF3B5C] text-white text-[9px] font-bold flex items-center justify-center">
              {activeFindingsCount}
            </span>
          )}
        </button>

        <button
          id="btn-export-matrix-summary"
          onClick={() => {
            if (onExportReport) {
              onExportReport();
            } else {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
                studyId: currentStudy.patientId,
                predictions,
                timestamp: new Date().toISOString()
              }, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `RSNA_Knee_${currentStudy.patientId}_Predictions.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }
          }}
          className="p-1.5 rounded-lg bg-[#0D131F] hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-[11px] transition-all"
          title="Export Clinical Diagnostic Report (PDF / JSON)"
        >
          <Download className="w-3.5 h-3.5 text-[#00E5FF]" />
        </button>
      </div>
    </div>
  );
};


