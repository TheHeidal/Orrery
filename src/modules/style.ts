export type TextStyle = {
  fillStyle: string | CanvasGradient | CanvasPattern;
  textAlign: CanvasTextAlign;
  font: string;
  yOffset: number;
};

export type Style =
  | { fillStyle: string | CanvasGradient | CanvasPattern }
  | {
      fillStyle: string | CanvasGradient | CanvasPattern;
      strokeStyle: string | CanvasGradient | CanvasPattern;
      lineWidth: number;
      lineDash?: number[];
    };
