export type TextStyle = {
  fillStyle: string | CanvasGradient | CanvasPattern;
  textAlign: CanvasTextAlign;
  font: string;
  yOffset: number;
};

export type LineStyle = {
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  lineDash?: number[];
};

export type Style =
  | { fillStyle: string | CanvasGradient | CanvasPattern }
  | {      fillStyle: string | CanvasGradient | CanvasPattern;    } & LineStyle;

export type StyleSet = {
  default: Style;
  hovered?: Style;
};
export type Name = "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn" | "Sun";

export type Point = { x: number; y: number };

export type Orrery = {
  canvas: CanvasRenderingContext2D;
  center: Point;
  mousePosition: Point | false;
};
