import React from 'react';
import { Play, RotateCcw, RotateCw, Square } from 'lucide-react';
import type { AnimationConfig, AnimationType, EasingOption } from '../types/studio';
import type { AnimationFrameState } from '../utils/layoutMath';

interface AnimationBarProps {
  animation: AnimationConfig;
  onChange: (next: AnimationConfig) => void;
  isPlaying: boolean;
  animFrame?: AnimationFrameState;
  onPlay: () => void;
  onReplay: () => void;
  onStop: () => void;
  onReset: () => void;
}

const ANIMATION_OPTIONS: Array<{ value: AnimationType; label: string }> = [
  { value: 'slide-left', label: 'Slide In Left' },
  { value: 'slide-right', label: 'Slide In Right' },
  { value: 'slide-up', label: 'Slide In Up' },
  { value: 'fade-in', label: 'Fade In' },
  { value: 'reveal', label: 'Reveal' },
  { value: 'scale-in', label: 'Scale In' },
  { value: 'smooth-motion', label: 'Smooth Motion' },
  { value: 'line-reveal', label: 'Line Reveal' },
];

const EASING_OPTIONS: Array<{ value: EasingOption; label: string }> = [
  { value: 'ease-out-expo', label: 'Expo Out (Broadcast)' },
  { value: 'ease-out-cubic', label: 'Cubic Out' },
  { value: 'ease-in-out', label: 'Smooth In-Out' },
  { value: 'spring-soft', label: 'Soft Spring' },
  { value: 'linear', label: 'Linear' },
];

export const AnimationBar: React.FC<AnimationBarProps> = ({
  animation,
  onChange,
  isPlaying,
  animFrame,
  onPlay,
  onReplay,
  onStop,
  onReset,
}) => {
  return (
    <footer className="bg-[#11151d] border-t border-white/10 px-3 py-2 shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Playback Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
            Animation Preview
          </span>

          <button
            type="button"
            onClick={onPlay}
            disabled={isPlaying}
            className="h-7 px-2.5 rounded bg-[#092c25] hover:bg-[#0e4238] border border-[#d9b66d]/50 disabled:opacity-50 text-[#f5edda] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Play Preview</span>
          </button>

          <button
            type="button"
            onClick={onReplay}
            className="h-7 px-2.5 rounded bg-[#171c26] hover:bg-[#1f2633] border border-white/10 text-slate-200 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCw className="w-3 h-3" />
            <span>Replay</span>
          </button>

          <button
            type="button"
            onClick={onStop}
            disabled={!isPlaying}
            className="h-7 px-2.5 rounded bg-[#171c26] hover:bg-[#1f2633] border border-white/10 disabled:opacity-40 text-slate-200 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Stop</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            title="Reset pengaturan animasi ke default"
            className="h-7 px-2.5 rounded bg-[#171c26] hover:bg-[#1f2633] border border-white/10 text-slate-300 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>

          {isPlaying && animFrame && (
            <span className="text-[11px] font-mono tabular-nums text-[#d9b66d] ml-1 uppercase">
              [{animFrame.phase}]
            </span>
          )}
        </div>

        {/* Right: Animation Parameters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <label htmlFor="anim-type-select" className="text-[11px] text-slate-400">
              Style:
            </label>
            <select
              id="anim-type-select"
              value={animation.type}
              onChange={(e) =>
                onChange({ ...animation, type: e.target.value as AnimationType })
              }
              className="h-7 px-2 rounded bg-[#0b0e14] border border-white/10 text-xs text-slate-100 cursor-pointer"
            >
              {ANIMATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <label htmlFor="anim-in-ms" className="text-[11px] text-slate-400">
              In
            </label>
            <input
              id="anim-in-ms"
              type="number"
              min={100}
              max={3000}
              step={50}
              value={animation.inDuration}
              onChange={(e) =>
                onChange({ ...animation, inDuration: Math.max(100, Number(e.target.value) || 600) })
              }
              className="w-16 h-7 px-1.5 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
            />
          </div>

          <div className="flex items-center gap-1">
            <label htmlFor="anim-hold-ms" className="text-[11px] text-slate-400">
              Hold
            </label>
            <input
              id="anim-hold-ms"
              type="number"
              min={200}
              max={10000}
              step={100}
              value={animation.holdDuration}
              onChange={(e) =>
                onChange({
                  ...animation,
                  holdDuration: Math.max(200, Number(e.target.value) || 2000),
                })
              }
              className="w-16 h-7 px-1.5 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
            />
          </div>

          <div className="flex items-center gap-1">
            <label htmlFor="anim-out-ms" className="text-[11px] text-slate-400">
              Out
            </label>
            <input
              id="anim-out-ms"
              type="number"
              min={100}
              max={3000}
              step={50}
              value={animation.outDuration}
              onChange={(e) =>
                onChange({
                  ...animation,
                  outDuration: Math.max(100, Number(e.target.value) || 500),
                })
              }
              className="w-16 h-7 px-1.5 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
            />
          </div>

          <div className="flex items-center gap-1">
            <label htmlFor="anim-delay-ms" className="text-[11px] text-slate-400">
              Delay
            </label>
            <input
              id="anim-delay-ms"
              type="number"
              min={0}
              max={3000}
              step={50}
              value={animation.delay}
              onChange={(e) =>
                onChange({ ...animation, delay: Math.max(0, Number(e.target.value) || 0) })
              }
              className="w-14 h-7 px-1.5 rounded bg-[#0b0e14] border border-white/10 text-xs font-mono tabular-nums text-slate-100"
            />
          </div>

          <div className="flex items-center gap-1">
            <label htmlFor="anim-easing-select" className="text-[11px] text-slate-400">
              Easing
            </label>
            <select
              id="anim-easing-select"
              value={animation.easing}
              onChange={(e) =>
                onChange({ ...animation, easing: e.target.value as EasingOption })
              }
              className="h-7 px-2 rounded bg-[#0b0e14] border border-white/10 text-xs text-slate-100 cursor-pointer"
            >
              {EASING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
};
