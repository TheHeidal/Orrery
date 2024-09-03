/**
 * @fileoverview javascript code to draw and animate the Orrery from Seven Part Pact (a game by Jay Dragon)
 * @copyright To avoid any conflict with the copyright of Possum Creek Games, this work is not available to license.
 * @TheHeidal
 */

type Style =
  | { fillStyle: string | CanvasGradient | CanvasPattern }
  | {
      fillStyle: string | CanvasGradient | CanvasPattern;
      strokeStyle: string | CanvasGradient | CanvasPattern;
      lineWidth: number;
      lineDash?: number[];
    };

// Canvas declarations
const canvas = document.querySelector(".myCanvas") as HTMLCanvasElement;
canvas.height = canvas.width = 700;
var height: number,
  width = (height = canvas.width),
  center = { x: width / 2, y: height / 2 };
const ctx = canvas.getContext("2d");

var state = { redrawOrrery: false, idle: false, darkMode: true };
var speedVar = 1000000;

/**
 * A planet on the Orrery, representing both the token and the ring it is on.
 * @property {number} numDivisions how many subdivisions the ring is split into.
 * @property {degree} divisionArcLength the angle between the ws and cw edges.
 * @property {degree} divisionOffset The angle that the widdershins edge of the
 * first division is offset from the x-axis.
 * @property {number} divisionSpan How many divisions the token takes up.
 * @property {degree} tokenArcLength the angle between the ws and cw edges.
 * @property {degree} wsPosition the angle of the widdershins edge of the token in degrees.
 * @property {degree} cwPosition the angle of the clockwise edge of the token in degrees.
 */

abstract class CelestialBody {
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
    this.destinationWsPosition = this.wsPosition =
      this.divisionAngle * tokenStartingDivision + this.divisionOffset;
  }

  /**
   * Moves the destination position of the body clockwise by its arc length
   */
  passMonth(): void {
    this.destinationWsPosition += this.tokenAngle;
  }

  moveToken(timestamp: DOMHighResTimeStamp): void {
    //TODO: I have misunderstood timestamp. Timestamp records how long the window has been open.
    console.debug(timestamp);
    var timeDelta;
    if (state.idle) {
      this.wsPosition += this.speed * timestamp;
      state.redrawOrrery = true;
    } else {
      if (this.destinationWsPosition > this.wsPosition) {
        this.wsPosition = Math.min(
          this.wsPosition + this.speed * timestamp,
          this.destinationWsPosition
        );
        state.redrawOrrery = true;
      }
    }
  }

  /**
   * Draws the ring onto the given context. Does not do subdivisions, stroke or text!
   * @param {CanvasRenderingContext2D} context
   */
  drawRing(context: CanvasRenderingContext2D) {
    this.ringPath = new Path2D();
    this.ringPath.arc(
      center.x,
      center.y,
      this.outerRadius,
      0,
      degToRad(360),
      false
    );
    this.ringPath.arc(
      center.x,
      center.y,
      this.innerRadius,
      0,
      degToRad(360),
      true
    );
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
    return this.tokenAngle / speedVar;
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
class Planet extends CelestialBody {
  updateTokenPath(): void {
    this.tokenPath = new Path2D();
    this.tokenPath.arc(
      center.x,
      center.y,
      this.outerRadius,
      degToRad(this.wsPosition),
      degToRad(this.cwPosition),
      false
    );
    this.tokenPath.lineTo(
      center.x + this.innerRadius * Math.cos(degToRad(this.cwPosition)),
      center.y + this.innerRadius * Math.sin(degToRad(this.cwPosition))
    );
    this.tokenPath.arc(
      center.x,
      center.y,
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
class Star extends CelestialBody {
  tokenDistance: number;
  tokenRadius: number;
  /**
   * @param {string} name The name of the body.
   *
   * @param {number} numDivisions How many segments the ring is divided into.
   * @param {dumber} divisionOffset The offset of the first division from the
   * x-axis.
   * @param {Number} divisionsTokenSpans How many divisions the token takes up.
   *
   * @param {number} outerRadius The distance from the center of the orrery to
   * the outside of the ring.
   * @param {number} innerRadius The distance from the center of the orrery to
   * the inside of the ring.
   * @param {number} tokenDistance The distance of the token from the centerpoint.
   * @param {number} tokenRadius The radius of the token.
   * @param {Style} ringStyle How to style the ring.
   * @param {Style} tokenStyle How to style the token.
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
    this.tokenDistance = tokenDistance;
    this.tokenRadius = tokenRadius;
  }

  /**
   * The center of the token relative to the canvas origin
   */
  get tokenCenterpoint() {
    const x =
      center.x +
      this.tokenDistance *
        Math.cos(degToRad(this.wsPosition + this.divisionAngle / 2));
    const y =
      center.y +
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
    var circle = degToRad(360);
    this.tokenPath.arc(x, y, tokenRadius, 0, circle, false);
    this.tokenPath.closePath();
  }
}

var distances = {
  sun: 265,
  mon: 250,
  txt: 215,
  sat: 200,
  jup: 170,
  mar: 140,
  ven: 110,
  mer: 80,
  moo: 50,
};

var colors = {
  nearBlack: "#3e2e2e",
  offWhite: "rgb(255,250,250)",

  bgColorLite: "#f0edec",
  bgColorDark: "#503020",

  jupRingFillColor: "#dcb894",
  marRingFillColor: "#dda1a1",
  venRingFillColor: "#efefd7",
  merRingFillColor: "#d8c7e7",
  sunTokenFillColor: "#ffab40",
  satTokenFillColor: "#434343",
  jupTokenFillColor: "#e69137",
  marTokenFillColor: "#cc0001",
  venTokenFillColor: "#69a84f",
  merTokenFillColor: "#8d7cc2",
};

var Sun = new Star(
  "Sun",
  12,
  0,
  1,
  distances.mon,
  distances.sat,
  distances.sun,
  30,
  { fillStyle: colors.offWhite },
  {
    fillStyle: colors.sunTokenFillColor,
    lineWidth: 2,
    strokeStyle: colors.marTokenFillColor,
  },
  7
);

var Sat = new Planet(
  "Saturn",
  36,
  -5,
  1,
  distances.sat,
  distances.jup,
  { fillStyle: colors.nearBlack },
  { fillStyle: colors.satTokenFillColor },
  3
);
var Jup = new Planet(
  "Jupiter",
  48,
  0,
  3,
  distances.jup,
  distances.mar,
  { fillStyle: colors.jupRingFillColor },
  { fillStyle: colors.jupTokenFillColor },
  3
);

var Mar = new Planet(
  "Mars",
  24,
  0,
  3,
  distances.mar,
  distances.ven,
  { fillStyle: colors.marRingFillColor },
  { fillStyle: colors.marTokenFillColor },
  22
);

var Ven = new Planet(
  "Venus",
  24,
  0,
  5,
  distances.ven,
  distances.mer,
  { fillStyle: colors.venRingFillColor },
  { fillStyle: colors.venTokenFillColor },
  14
);

var Mer = new Planet(
  "Mercury",
  24,
  0,
  7,
  distances.mer,
  distances.moo,
  { fillStyle: colors.merRingFillColor },
  { fillStyle: colors.merTokenFillColor },
  12
);

// const bodies = [Sun, Sat, Jup, Mar, Ven, Mer];
const bodies: CelestialBody[] = [Sun, Sat, Jup, Mar, Ven, Mer];

/**
 * Draws a new frame for the Orrery's canvas.
 * Intended to be called by requestAnimationFrame.
 *
 * @param {DOMHighResTimeStamp} timeElapsed the end time of the previous
 * frame's rendering
 */
function render(timeElapsed: DOMHighResTimeStamp) {
  // Background
  state.redrawOrrery = false;
  for (var body of bodies) {
    body.moveToken(timeElapsed);
  }
  if (state.redrawOrrery) drawOrrery();
  requestAnimationFrame(render);
}

/**
 * Draws the Orrery ring by ring
 */
function drawOrrery() {
  ctx.fillStyle = state.darkMode ? colors.bgColorDark : colors.bgColorLite;
  ctx.fillRect(0, 0, width, height);
  //Sun ring
  ctx.lineWidth = 3;
  ctx.strokeStyle = "red";
  ctx.beginPath();
  ctx.arc(center.x, center.y, distances.sun, 0, degToRad(360));
  ctx.stroke();

  //Rings
  Sun.drawRing(ctx);
  drawMonthText();
  Sat.drawRing(ctx);
  Sat.drawRing(ctx);
  Jup.drawRing(ctx);
  Mar.drawRing(ctx);
  Ven.drawRing(ctx);
  Mer.drawRing(ctx);

  //Text

  //Divisions
  ctx.lineWidth = 2;
  ctx.strokeStyle = colors.nearBlack;
  subdivide(distances.mon, distances.sat, 12);

  ctx.lineWidth = 2;
  ctx.strokeStyle = colors.offWhite;
  subdivide(
    (distances.sat - distances.jup) * 0.7 + distances.jup,
    (distances.sat - distances.jup) * 0.3 + distances.jup,
    36,
    5
  );

  ctx.lineWidth = 1;
  ctx.strokeStyle = colors.nearBlack;
  subdivide(distances.jup, distances.moo, 12);

  ctx.setLineDash([5, 3]);
  subdivide(distances.jup, distances.moo, 12, 15);
  subdivide(distances.jup, distances.mar, 24, 7.5);
  ctx.setLineDash([]);

  //Tokens
  for (var body of bodies) {
    body.drawToken(ctx);
  }

  function drawMonthText() {
    //TODO: move to Star
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(degToRad(15));

    ctx.fillStyle = colors.nearBlack;
    ctx.textAlign = "center";
    ctx.font = "25px serif";

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
      ctx.fillText(sign, 0, -distances.txt);
      ctx.rotate(degToRad(30));
    }

    ctx.restore();
  }
}

/**
 * Draws equally spaced lines about the center from outerRadius to innerRadius
 * @param {number} outerRadius
 * @param {number} innerRadius
 * @param {number} divisions number of lines
 * @param {number} offsetAngle degrees offset from the x-axis
 */
function divisionPath(
  outerRadius: number,
  innerRadius: number,
  divisions: number,
  offsetAngle: number
): Path2D {
  const path = new Path2D();

  for (let i = 0; i < divisions; i++) {
    const angle = degToRad((360 / divisions) * i + offsetAngle);
    path.moveTo(
      center.x + outerRadius * Math.cos(angle),
      center.y + outerRadius * Math.sin(angle)
    );
    path.lineTo(
      center.x + innerRadius * Math.cos(angle),
      center.y + innerRadius * Math.sin(angle)
    );
  }
  return path;
}

/**
 * Draws equally spaced lines about the center from outerRadius to innerRadius
 * @param {Number} outerRadius
 * @param {Number} innerRadius
 * @param {Number} divisions number of lines
 * @param {Number} offsetAngle offset from the x-axis
 */
function subdivide(
  outerRadius: number,
  innerRadius: number,
  divisions: number,
  offsetAngle: number = 0
) {
  for (let i = 0; i < divisions; i++) {
    ctx.beginPath();
    const angle = degToRad((360 / divisions) * i + offsetAngle);
    ctx.moveTo(
      center.x + outerRadius * Math.cos(angle),
      center.y + outerRadius * Math.sin(angle)
    );
    ctx.lineTo(
      center.x + innerRadius * Math.cos(angle),
      center.y + innerRadius * Math.sin(angle)
    );
    ctx.stroke();
  }
}

/**
 *
 * @param x1 x-component of coordinate 1
 * @param y1 y-component of coordinate 1
 * @param x2 x-component of coordinate 2
 * @param y2 y-component of coordinate 2
 * @returns
 */
function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Converts an angle in degrees to radians
 */
function degToRad(degrees: number): number {
  return ((degrees * Math.PI) / 180);
}

// Interactivity
canvas.addEventListener(
  "click",
  function (event) {
    // var mouseX = event.pageX - canvasLeft - centerX,
    //   mouseY = event.pageY - canvasTop - centerY,
    //   mouseRadius = Math.sqrt(mouseX ** 2 + mouseY ** 2);
    // console.log(
    //   `(${mouseX}, ${mouseY})\nangle: ${radToDeg(vecToAngle(mouseX, mouseY))}`
    // );
    // state.clickToggle = state.clickToggle == false;
    for (const body of bodies) {
      body.passMonth();
    }
    requestAnimationFrame(render);
  },
  false
);

drawOrrery();
requestAnimationFrame(render);
