import { degToRad } from "./misc.js";
import type { Style, TextStyle } from "./style.js";

/**
 * A planet on the Orrery, representing both the token and the ring it is on.
 * @property numDivisions how many subdivisions the ring is split into.
 * @property divisionArcLength the angle between the ws and cw edges.
 * @property divisionOffset The angle that the widdershins edge of the
 * first division is offset from the x-axis.
 * @property divisionSpan How many divisions the token takes up.
 * @property tokenAngle the angle between the ws and cw edges.
 * @property wsPosition the angle of the widdershins edge of the token in degrees.
 * @property cwPosition the angle of the clockwise edge of the token in degrees.
 *
 * @property ringPath The path describing the ring, centered on the origin.
 * @property tokenPath The path describing the token, centered on the origin.
 */
export abstract class CelestialBody {
  //TODO: does it make more sense to split Ring and Token into their own classes and make CBs a container?
  protected ringPath: Path2D;
  protected tokenPath: Path2D;
  protected trueWiddershinsPosition: number; //protected to make sure tokenpath is updated any time the angle changes
  protected destinationWsPosition: number;

  /**
   * @param numDivisions How many segments the ring is divided into.
   * @param divisionOffset The offset of the first division from the
   * x-axis.
   * @param divisionsTokenSpans How many divisions the token takes up.
   * @param outerRadius The distance from the center of the orrery to
   * the outside of the ring.
   * @param  innerRadius The distance from the center of the orrery to
   * the inside of the ring.
   * @param tokenStartingDivision Which division shares a widdershins edge
   * with the token (0-indexed from the first position on the x-axis)
   */
  constructor(
    public readonly name: string,
    public readonly numDivisions: number,
    public readonly divisionOffset: number,
    public readonly divisionsTokenSpans: number,

    public outerRadius: number,
    public innerRadius: number,
    public ringStyle: Style,
    public tokenStyle: Style,

    tokenStartingDivision: number
  ) {
    this.ringPath = new Path2D();
    this.ringPath.arc(0, 0, this.outerRadius, 0, degToRad(360), false);
    this.ringPath.arc(0, 0, this.innerRadius, 0, degToRad(360), true);
    // tokenPath has to be calculated by the subclass
    this.destinationWsPosition = this.wsPosition =
      this.divisionAngle * tokenStartingDivision + this.divisionOffset;
  }

  /**
   * Moves the destination position of the body clockwise by its arc length
   */
  passMonth(): void {
    this.destinationWsPosition += this.tokenAngle;
  }

  moveToken(elapsed: DOMHighResTimeStamp): void {
    if (this.destinationWsPosition > this.wsPosition) {
      this.wsPosition = Math.min(
        this.wsPosition + this.speed * elapsed,
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
    context.fillStyle = this.ringStyle.fillStyle;
    context.fill(this.ringPath);
  }

  /**
   * Returns whether a position is within the bounds of the planet's ring.
   * Position is relative to the context
   */
  isPointInRing(x: number, y: number): boolean {
    var radius = Math.sqrt(x ** 2 + y ** 2);
    return radius > this.innerRadius && radius < this.outerRadius;
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

    context.fillStyle = this.tokenStyle.fillStyle;
    context.fill(this.tokenPath);

    if ("strokeStyle" in this.tokenStyle) {
      context.strokeStyle = this.tokenStyle.strokeStyle;
      context.lineWidth = this.tokenStyle.lineWidth;
      context.stroke(this.tokenPath);
    }
  }

  /**
   * @param {number} x the x-offset relative to the canvas origin, positive is right.
   * @param {number} y the y-offset relative to the canvas origin, positive is down.
   */
  isPointInToken(context: CanvasRenderingContext2D, x: number, y: number) {
    return context.isPointInPath(this.tokenPath, x, y);
  }

  get speed(): number {
    return this.tokenAngle / 1000;
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

  /**
   * The angle between the token's widdershins and clockwise edges in degrees
   */
  get tokenAngle(): number {
    return this.divisionsTokenSpans * this.divisionAngle;
  }

  /**
   * The angle of one division of the ring in degres
   * @returns {number}
   */
  get divisionAngle(): number {
    return 360 / this.numDivisions;
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
    name: string,

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
      Math.cos(degToRad(this.wsPosition + this.divisionAngle / 2));
    const y =
      this.tokenDistance *
      Math.sin(degToRad(this.wsPosition + this.divisionAngle / 2));
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
    //TODO: make a class property so I can customize them
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
      context.rotate(degToRad(this.divisionAngle));
    }

    context.restore();
  }
}
