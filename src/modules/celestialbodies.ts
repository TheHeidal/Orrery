import { degToRad } from "./misc.js";
import type { Name, Point, Style, StyleSet, TextStyle } from "./types.js";

/**
 * A planet on the Orrery, representing both the token and the ring it is on.
 * @property speed How many milliseconds it takes for the token to move forward by its angle.
 * @property numDivisions how many subdivisions the ring is split into.
 * @property divisionOffset The angle that the first division is offset from the x-axis.
 *
 * @property tokenAngle The angle between the token's edges in degrees
 * @property wsPosition the angle of the widdershins edge of the token in degrees.
 * @property cwPosition the angle of the clockwise edge of the token in degrees.
 *
 * @property ringPath The path describing the ring, centered on the origin.
 * @property tokenPath The path describing the token, centered on the origin.
 */
export abstract class CelestialBody {
  speed: number = 1000;
  protected renderState: { hoveredRing: boolean; hoveredToken: boolean } = {
    hoveredRing: false,
    hoveredToken: false,
  };
  protected ringPath: Path2D;
  protected tokenPath: Path2D;

  protected ringStyleSet: StyleSet;
  protected tokenStyleSet: StyleSet;

  protected tokenAngle: number;

  protected trueWiddershinsPosition: number; //protected to make sure tokenPath is updated any time the angle changes
  protected destinationWsPosition: number;

  /**
   * @param numDivisions How many segments the ring is divided into.
   * @param divisionOffset The offset of the first division from the
   * x-axis.
   * @param divisionsTokenSpans How many divisions the token takes up.
   *
   * @param outerRadius The distance from the center of the orrery to
   * the outside of the ring.
   * @param  innerRadius The distance from the center of the orrery to
   * the inside of the ring.
   *
   * @param ringStyle Instructions for styling the ring.
   * @param tokenStyle Instructions for styling the token.
   *
   * @param tokenStartingDivision Which division shares a widdershins edge
   * with the token (0-indexed from the first position on the x-axis)
   */
  constructor(
    public orrery: { canvas: CanvasRenderingContext2D; orreryCenter: Point },
    public readonly name: Name,
    protected readonly numDivisions: number,
    protected readonly divisionOffset: number,
    divisionsTokenSpans: number,

    protected outerRadius: number,
    protected innerRadius: number,
    ringStyle: Style | StyleSet,
    tokenStyle: Style | StyleSet,

    tokenStartingDivision: number
  ) {
    if ("default" in ringStyle) {
      this.ringStyleSet = ringStyle;
    } else this.ringStyleSet = { default: ringStyle };
    if ("default" in tokenStyle) {
      this.tokenStyleSet = tokenStyle;
    } else this.tokenStyleSet = { default: tokenStyle };

    this.ringPath = new Path2D();
    this.ringPath.arc(0, 0, this.outerRadius, 0, degToRad(360), false);
    this.ringPath.arc(0, 0, this.innerRadius, 0, degToRad(360), true);
    // tokenPath has to be calculated by the subclass

    this.tokenAngle = divisionsTokenSpans * (360 / numDivisions);
    this.wsPosition =
      (360 / numDivisions) * tokenStartingDivision + this.divisionOffset;
    this.destinationWsPosition = this.wsPosition;
  }

  /**
   * Moves the destination position of the body clockwise by its arc length
   */
  passMonth(): void {
    this.destinationWsPosition += this.tokenAngle;
  }

  /**
   *Updates whether the mouse is hovering over the body.
   * @param mousePosition false if the mouse is not on the canvas,
   * otherwise the position of the mouse relative to the canvas origin.
   */
  updateHover(mousePosition: Point | false) {
    if (mousePosition === false) {
      this.renderState = { hoveredRing: false, hoveredToken: false };
    } else {
      this.renderState = {
        hoveredRing: this.isPointInRing(mousePosition),
        hoveredToken: this.isPointInToken(mousePosition),
      };
    }
  }

  updateTokenPosition(elapsed: DOMHighResTimeStamp): void {
    if (this.destinationWsPosition > this.wsPosition) {
      this.wsPosition = Math.min(
        this.wsPosition + (this.tokenAngle / this.speed) * elapsed,
        this.destinationWsPosition
      );
    }
  }

  /**
   * Draws the ring onto the given context with its center on the origin
   *
   * . Does not do subdivisions, stroke or text! (yet)
   * @param {CanvasRenderingContext2D} context
   */
  drawRing(context: CanvasRenderingContext2D) {
    let currStyle =
      this.renderState.hoveredRing && "hovered" in this.ringStyleSet
        ? this.ringStyleSet.hovered
        : this.ringStyleSet.default;
    setStyle(context, currStyle);
    context.fill(this.ringPath);
  }

  /**
   *
   * @param position a point relative to the canvas origin
   */
  isPointInRing(position: Point): boolean {
    return this.orrery.canvas.isPointInPath(
      this.ringPath,
      position.x,
      position.y
    );
  }

  /**
   * Creates the path describing a token.
   */
  abstract updateTokenPath(): void;

  /**
   * Draws a token on the given context.
   * @param {CanvasRenderingContext2D} context
   */
  drawToken(context: CanvasRenderingContext2D) {
    this.updateTokenPath();

    let currStyle =
      this.renderState.hoveredToken && "hovered" in this.tokenStyleSet
        ? this.tokenStyleSet.hovered
        : this.tokenStyleSet.default;
    setStyle(context, this.tokenStyleSet.default);
    context.fill(this.tokenPath);
    if ("strokeStyle" in currStyle) {
      context.stroke(this.tokenPath);
    }
  }

  /**
   * @param position A position relative the canvas origin, unaffected by the current transformation
   */
  isPointInToken(position: Point): boolean {
    return this.orrery.canvas.isPointInPath(
      this.tokenPath,
      position.x,
      position.y
    );
  }

  /**
   * The position of the widdershins edge of the token as an angle in degrees.
   *
   * 0 is the positive x axis, 90 is the positive y axis.
   */
  get wsPosition(): number {
    return this.trueWiddershinsPosition;
  }

  set wsPosition(angle: number) {
    this.trueWiddershinsPosition = angle;
    this.updateTokenPath;
  }

  /**
   * The position of the clockwise edge of the token as an angle in degrees.
   *
   * 0 is the positive x axis, 90 is the positive y axis.
   */
  get cwPosition(): number {
    return this.wsPosition + this.tokenAngle;
  }
}
/**Celestial Bodies with pie-crust shaped tokens */
export class Planet extends CelestialBody {
  updateTokenPath(): void {
    this.tokenPath = new Path2D();
    this.tokenPath.arc(
      0,
      0,
      this.outerRadius,
      degToRad(this.wsPosition),
      degToRad(this.cwPosition),
      false
    );
    this.tokenPath.lineTo(
      this.innerRadius * Math.cos(degToRad(this.cwPosition)),
      this.innerRadius * Math.sin(degToRad(this.cwPosition))
    );
    this.tokenPath.arc(
      0,
      0,
      this.innerRadius,
      degToRad(this.cwPosition),
      degToRad(this.wsPosition),
      true
    );
    this.tokenPath.closePath();
  }
}
/**
 * A Celestial body with a circular tokens.
 */
export class Star extends CelestialBody {
  tokenDistance: number;
  tokenRadius: number;
  textStyle: TextStyle;
  /**
   * @param name The name of the body.
   *
   * @param numDivisions How many segments the ring is divided into.
   * @param divisionOffset The offset of the first division from the
   * x-axis.
   * @param divisionsTokenSpans How many divisions the token takes up.
   *
   * @param outerRadius The distance from the center of the orrery to
   * the outside of the ring.
   * @param innerRadius The distance from the center of the orrery to
   * the inside of the ring.
   * @param tokenDistance The distance of the token from the centerpoint.
   * @param tokenRadius The radius of the token.
   * @param ringStyle How to style the ring.
   * @param tokenStyle How to style the token.
   * @param textStyle How to style the text.
   *
   * @param {number} tokenPosition Which division shares a widdershins edge
   * with the token (0-indexed from the first position on the x-axis)
   */
  constructor(
    orrery: { canvas: CanvasRenderingContext2D; orreryCenter: Point },
    name: Name,

    numDivisions: number,
    divisionOffset: number,

    divisionsTokenSpans: number,

    outerRadius: number,
    innerRadius: number,
    tokenDistance: number,
    tokenRadius: number,
    ringStyle: Style,
    tokenStyle: Style,
    textStyle: TextStyle,

    tokenPosition: number
  ) {
    super(
      orrery,
      name,
      numDivisions,
      divisionOffset,
      divisionsTokenSpans,
      outerRadius,
      innerRadius,
      ringStyle,
      tokenStyle,
      tokenPosition
    );
    this.textStyle = textStyle;
    this.tokenDistance = tokenDistance;
    this.tokenRadius = tokenRadius;
  }

  /**
   * The center of the token relative to the center of the orrery
   */
  get tokenCenterpoint() {
    const x =
      this.tokenDistance *
      Math.cos(degToRad(this.wsPosition + this.tokenAngle / 2));
    const y =
      this.tokenDistance *
      Math.sin(degToRad(this.wsPosition + this.tokenAngle / 2));
    return {
      x: x,
      y: y,
    };
  }

  updateTokenPath(): void {
    this.tokenPath = new Path2D();
    var x = this.tokenCenterpoint.x;
    var y = this.tokenCenterpoint.y;
    var tokenRadius = this.tokenRadius;
    this.tokenPath.arc(x, y, tokenRadius, 0, degToRad(360), false);
  }

  drawRing(context: CanvasRenderingContext2D): void {
    super.drawRing(context);
    this.drawLabels(context);
  }

  drawLabels(context: CanvasRenderingContext2D): void {
    context.save();
    context.rotate(degToRad(360 / (2 * this.numDivisions)));
    context.fillStyle = this.textStyle.fillStyle;
    context.textAlign = this.textStyle.textAlign;
    context.font = this.textStyle.font;

    for (const sign of [
      "Aries",
      "Taurus",
      "Gemini",
      "Cancer",
      "Leo",
      "Virgo",
      "Libra",
      "Scorpio",
      "Sagittarius",
      "Capricorn",
      "Aquarius",
      "Pisces",
    ]) {
      context.fillText(sign, 0, -this.textStyle.yOffset);
      context.rotate(degToRad(360 / this.numDivisions));
    }

    context.restore();
  }
}

/**
 * Sets the styling properties of context.
 * @param context The context to be updated.
 * @param style The style to be applied.
 */
function setStyle(context: CanvasRenderingContext2D, style: Style) {
  context.fillStyle = style.fillStyle;
  if ("strokeStyle" in style) {
    context.strokeStyle = style.strokeStyle;
    context.lineWidth = style.lineWidth;
    context.setLineDash("lineDash" in style ? style.lineDash : []);
  }
}
