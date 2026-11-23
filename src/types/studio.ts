export type TemplateCategory = 'bolt' | 'corporate' | 'islamic' | 'news' | 'ukin';

export type LayoutComposition =
  | 'horizontal-panel'
  | 'floating-label'
  | 'minimal-type'
  | 'split-layout'
  | 'accent-bar'
  | 'geometric'
  | 'elegant-frame'
  | 'academic';

export type ResolutionPreset = '1920x1080' | '1280x720' | '1080x1920' | '1080x1080' | 'custom';

export interface CanvasResolution {
  preset: ResolutionPreset;
  width: number;
  height: number;
}

export type TextRole = 'title' | 'subtitle' | 'description' | 'label' | 'custom';

export type TextAlignment = 'left' | 'center' | 'right';

export interface TextElement {
  id: string;
  role: TextRole;
  fieldLabel: string;
  placeholder: string;
  content: string;
  visible: boolean;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  letterSpacing: number;
  lineHeight: number;
  textAlign: TextAlignment;
  color: string;
  opacity: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  uppercase: boolean;
  maxWidth: number;
  zIndex: number;
}

export type ShapeKind =
  | 'panel'
  | 'accentBar'
  | 'line'
  | 'badgeBox'
  | 'frame'
  | 'circle'
  | 'diamond';

export interface ShapeElement {
  id: string;
  name: string;
  kind: ShapeKind;
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWidth: number;
  borderRadius: number;
  rotation: number;
  zIndex: number;
}

export interface LogoElement {
  id: string;
  name: string;
  dataUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  rotation: number;
  zIndex: number;
}

export type AnimationType =
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'fade-in'
  | 'reveal'
  | 'scale-in'
  | 'smooth-motion'
  | 'line-reveal';

export type EasingOption =
  | 'ease-out-expo'
  | 'ease-out-cubic'
  | 'ease-in-out'
  | 'linear'
  | 'spring-soft';

export interface AnimationConfig {
  type: AnimationType;
  inDuration: number;
  holdDuration: number;
  outDuration: number;
  delay: number;
  easing: EasingOption;
}

export interface EffectsConfig {
  shadowEnabled: boolean;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowColor: string;
  shadowOpacity: number;
}

export interface LayoutConfig {
  anchorX: number;
  anchorY: number;
  scale: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  marginX: number;
  marginY: number;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
}

export interface LowerThirdDesign {
  version: 1;
  templateId: string;
  category: TemplateCategory;
  composition: LayoutComposition;
  colors: ColorPalette;
  layout: LayoutConfig;
  effects: EffectsConfig;
  texts: TextElement[];
  shapes: ShapeElement[];
  logos: LogoElement[];
  animation: AnimationConfig;
}

export interface StudioTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  composition: LayoutComposition;
  description: string;
  design: LowerThirdDesign;
}

export interface ProjectRecord {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  resolution: CanvasResolution;
  design: LowerThirdDesign;
}

export type InspectorTab =
  | 'text'
  | 'typography'
  | 'colors'
  | 'shapes'
  | 'logos'
  | 'layout'
  | 'effects';

export type SelectableElementRef =
  | { kind: 'group' }
  | { kind: 'text'; id: string }
  | { kind: 'shape'; id: string }
  | { kind: 'logo'; id: string };

export interface ElementBounds {
  kind: 'text' | 'shape' | 'logo';
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}
