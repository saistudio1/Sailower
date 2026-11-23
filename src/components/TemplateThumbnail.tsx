import React from 'react';
import type { StudioTemplate } from '../types/studio';

interface TemplateThumbnailProps {
  template: StudioTemplate;
}

export const TemplateThumbnail: React.FC<TemplateThumbnailProps> = ({ template }) => {
  const { design } = template;
  const shapes = design.shapes.filter((s) => s.visible);
  const titleText = design.texts.find((t) => t.role === 'title' && t.visible);
  const subText = design.texts.find(
    (t) => (t.role === 'subtitle' || t.role === 'description') && t.visible
  );
  const labelText = design.texts.find((t) => t.role === 'label' && t.visible);

  // Compute bounding viewbox from template shapes so thumbnail always frames accurately
  let minX = 0;
  let minY = -44;
  let maxX = 820;
  let maxY = 160;
  if (shapes.length > 0) {
    minX = Math.min(0, ...shapes.map((s) => s.x)) - 20;
    minY = Math.min(-10, ...shapes.map((s) => s.y)) - 18;
    maxX = Math.max(400, ...shapes.map((s) => s.x + s.width)) + 20;
    maxY = Math.max(120, ...shapes.map((s) => s.y + s.height)) + 18;
  }
  const vbW = Math.max(420, maxX - minX);
  const vbH = Math.max(170, maxY - minY);

  return (
    <div className="w-full aspect-[16/7] rounded-md overflow-hidden checkerboard-bg border border-white/10 flex items-center justify-center p-1.5">
      <svg
        viewBox={`${minX} ${minY} ${vbW} ${vbH}`}
        className="w-full h-full"
        aria-hidden="true"
      >
        {shapes
          .slice()
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((s) => {
            if (s.kind === 'circle') {
              return (
                <ellipse
                  key={s.id}
                  cx={s.x + s.width / 2}
                  cy={s.y + s.height / 2}
                  rx={s.width / 2}
                  ry={s.height / 2}
                  fill={s.fillColor}
                  fillOpacity={s.fillOpacity}
                  stroke={s.strokeWidth > 0 ? s.strokeColor : 'none'}
                  strokeWidth={s.strokeWidth}
                />
              );
            }
            if (s.kind === 'diamond') {
              const mx = s.x + s.width / 2;
              const my = s.y + s.height / 2;
              return (
                <polygon
                  key={s.id}
                  points={`${mx},${s.y} ${s.x + s.width},${my} ${mx},${s.y + s.height} ${s.x},${my}`}
                  fill={s.fillColor}
                  fillOpacity={s.fillOpacity}
                />
              );
            }
            return (
              <rect
                key={s.id}
                x={s.x}
                y={s.y}
                width={s.width}
                height={s.height}
                rx={s.borderRadius}
                fill={s.kind === 'frame' ? 'none' : s.fillColor}
                fillOpacity={s.kind === 'frame' ? 0 : s.fillOpacity}
                stroke={s.strokeWidth > 0 ? s.strokeColor : 'none'}
                strokeWidth={s.strokeWidth}
              />
            );
          })}

        {labelText && (
          <text
            x={design.layout.paddingLeft + labelText.offsetX}
            y={design.layout.paddingTop + labelText.offsetY + labelText.fontSize * 0.9}
            fill={labelText.color}
            fontSize={Math.max(14, labelText.fontSize)}
            fontWeight={labelText.fontWeight}
            fontFamily="sans-serif"
          >
            {(labelText.uppercase ? labelText.content.toUpperCase() : labelText.content).slice(0, 26)}
          </text>
        )}

        {titleText && (
          <text
            x={design.layout.paddingLeft + titleText.offsetX}
            y={design.layout.paddingTop + titleText.offsetY + titleText.fontSize * 0.92}
            fill={titleText.color}
            fontSize={Math.max(22, Math.min(34, titleText.fontSize))}
            fontWeight={titleText.fontWeight}
            fontFamily="sans-serif"
          >
            {(() => {
              const str = titleText.uppercase ? titleText.content.toUpperCase() : titleText.content;
              return str.length > 30 ? `${str.slice(0, 28)}…` : str;
            })()}
          </text>
        )}

        {subText && (
          <text
            x={design.layout.paddingLeft + subText.offsetX}
            y={design.layout.paddingTop + subText.offsetY + subText.fontSize * 0.95}
            fill={subText.color}
            fontSize={Math.max(15, Math.min(20, subText.fontSize))}
            fontWeight={subText.fontWeight}
            fontFamily="sans-serif"
          >
            {subText.content.length > 38 ? `${subText.content.slice(0, 36)}…` : subText.content}
          </text>
        )}
      </svg>
    </div>
  );
};
