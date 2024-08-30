/**
 * @fileoverview javascript code to draw and animate the Orrery from Seven Part Pact (a game by Jay Dragon)
 * @copyright To avoid any conflict with the copyright of Possum Creek Games, this work is not available to license.
 * @TheHeidal
 */

// Canvas declarations
const canvas = document.querySelector(".myCanvas") as HTMLCanvasElement;
canvas.height = canvas.width = 700;
var height: number,
  width = (height = canvas.width),
  center = { x: width / 2, y: height / 2 };
const ctx = canvas.getContext("2d");

var state = { redrawOrrery: false, idle: false, darkMode: true };
var speedVar = 1000000; //TODO: understand the units for this

type degree = number;
type radian = number;

type style =
  | { fillStyle: string | CanvasGradient | CanvasPattern }
  | {
      fillStyle: string | CanvasGradient | CanvasPattern;
      strokeStyle: string | CanvasGradient | CanvasPattern;
      lineWidth: number;
    };

//TODO: update class documentation
/**
 * A planet on the Orrery, representing both the token and the ring it is on.
 * @property {string} name
 * @property {number} numDivisions how many positions exist on the ring.
 * @property {degree} divisionArcLength the angle between the ws and cw edges.
 * @property {degree} divisionOffset The angle that the widdershins edge of the
 * first division is offset from the x-axis.
 * @property {number} divisionSpan How many divisions the token takes up.
 * @property {degree} tokenArcLength the angle between the ws and cw edges.
 * @property {degree} wsAngle the angle of the widdershins edge of the token.
 * @property {degree} cwAngle the angle of the clockwise edge of the token.
 */

class CelestialBody {
  readonly name: string;
  // angle constants
  readonly numDivisions: number;
  readonly divisionOffset: degree;
  readonly divisionsTokenSpans: number;
  // drawing properties
  outerRadius: number;
  innerRadius: number;
  ringStyle: style;
  tokenStyle: style;
  // angle properties
  wsAngle: degree;
  destinationWsAngle: degree;
  /**
   * @param {string} name The name of the body.
   * @param {number} numDivisions How many segments the ring is divided into.
   * @param {dumber} divisionOffset The offset of the first division from the
   * x-axis.
   * @param {Number} divisionsTokenSpans How many divisions the token takes up.
   * @param {number} outerRadius The distance from the center of the orrery to
   * the outside of the ring.
   * @param {number} innerRadius The distance from the center of the orrery to
   * the inside of the ring.
   * @param {style} ringStyle How to style the ring.
   * @param {style} tokenStyle How to style the token.
   *
   * @param {number} tokenPosition Which division shares a widdershins edge
   * with the token (0-indexed from the first position on the x-axis)
   */
  constructor(
    name: string,

    numDivisions: number,
    divisionOffset: degree,
    divisionsTokenSpans: number,

    outerRadius: number,
    innerRadius: number,
    ringStyle: style,
    tokenStyle: style,

    tokenPosition: number
  ) {
    this.name = name;
    this.numDivisions = numDivisions;
    this.divisionOffset = divisionOffset;
    this.divisionsTokenSpans = divisionsTokenSpans;

    this.outerRadius = outerRadius;
    this.innerRadius = innerRadius;
    this.ringStyle = ringStyle;
    this.tokenStyle = tokenStyle;

    this.wsAngle = this.divisionAngle * tokenPosition + this.divisionOffset;
    this.destinationWsAngle = this.wsAngle;
  }

  /**
   * Moves the destination angle of the body clockwise by its arc length
   */
  passMonth() {
    this.destinationWsAngle += this.tokenArcLength;
  }

  move(timestamp) {
    if (state.idle) {
      //TODO: tokens accelerate for some reason?
      this.wsAngle += this.speed * timestamp;
      state.redrawOrrery = true;
    } else {
      //TODO: tokens also accelerate
      if (this.destinationWsAngle > this.wsAngle) {
        this.wsAngle = Math.min(
          this.wsAngle + this.speed * timestamp,
          this.destinationWsAngle
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
    context.fillStyle = this.ringStyle.fillStyle;
    context.beginPath();
    context.arc(center.x, center.y, this.outerRadius, 0, degToRad(360), false);
    context.arc(center.x, center.y, this.innerRadius, 0, degToRad(360), true);
    context.fill();
  }

  /**
   * Returns whether a position is within the bounds of the planet's token.
   * @param {number} x the x-offset relative to the center of the Orrery, positive is right.
   * @param {number} y the y-offset relative to the center of the Orrery, positive is down.
   */
  withinRing(x: number, y: number): boolean {
    var radius = Math.sqrt(x ** 2 + y ** 2);
    return radius > this.innerRadius && radius < this.outerRadius;
  }

  /**
   * Abstract method to draw a token on context
   * @param {CanvasRenderingContext2D} context
   */
  drawToken(context: CanvasRenderingContext2D) {
    throw TypeError("Celestial Bodies can't draw tokens on their own!");
  }
  /**
   * Abstract method to identify if a position is within the token.
   * @param {number} x the x-offset relative to the canvas origin, positive is right.
   * @param {number} y the y-offset relative to the canvas origin, positive is down.
   */
  withinToken(x: number, y: number) {
    throw TypeError("Celestial Bodies can't identify tokens on their own!");
  }

  get speed() {
    return this.tokenArcLength / speedVar;
  }

  /**
   * @returns {Degree}
   */
  get cwAngle() {
    return this.wsAngle + this.tokenArcLength;
  }
  /**
   * The angle between the token's widdershins and clockwise edges
   * @returns {degree}
   */
  get tokenArcLength() {
    return this.divisionsTokenSpans * this.divisionAngle;
  }
  /**
   * The angle of one division of the ring
   * @returns {degree}
   */
  get divisionAngle(): degree {
    return (360 / this.numDivisions) as degree;
  }
}
/**Celestial Bodies with pie-crust shaped tokens */
class Planet extends CelestialBody {
  /**
   * Draws a token onto the Planet's ring on the given context.
   * @param {CanvasRenderingContext2D} context
   */
  drawToken(context: CanvasRenderingContext2D) {
    //TODO: we can separate drawing the path to a different method and then push this up to the superclass.
    context.beginPath();
    context.arc(
      center.x,
      center.y,
      this.outerRadius,
      degToRad(this.wsAngle),
      degToRad(this.cwAngle),
      false
    );
    context.lineTo(
      center.x + this.innerRadius * Math.cos(degToRad(this.cwAngle)),
      center.y + this.innerRadius * Math.sin(degToRad(this.cwAngle))
    );
    context.arc(
      center.x,
      center.y,
      this.innerRadius,
      degToRad(this.cwAngle),
      degToRad(this.wsAngle),
      true
    );
    context.closePath();
    context.fillStyle = this.tokenStyle.fillStyle;
    context.fill();
    if ("strokeStyle" in this.tokenStyle) {
      context.strokeStyle = this.tokenStyle.strokeStyle;
      context.lineWidth = this.tokenStyle.lineWidth;
      context.stroke();
    }
  }

  /**
   * Returns whether a position is within the bounds of the planet's token.
   * @param {number} x the x-offset relative to the center of the Orrery, positive is right.
   * @param {number} y the y-offset relative to the center of the Orrery, positive is down.
   */
  withinToken(x: number, y: number): boolean {
    var angle = radToDeg(vecToAngle(x, y));
    return (
      this.withinRing(x, y) &&
      posMod(angle - this.wsAngle, 360) < this.tokenArcLength
    );
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
   * @param {style} ringStyle How to style the ring.
   * @param {style} tokenStyle How to style the token.
   *
   * @param {number} tokenPosition Which division shares a widdershins edge
   * with the token (0-indexed from the first position on the x-axis)
   */
  constructor(
    name: string,

    numDivisions: number,
    divisionOffset: degree,
    divisionsTokenSpans: number,

    outerRadius: number,
    innerRadius: number,
    tokenDistance: number,
    tokenRadius: number,
    ringStyle: style,
    tokenStyle: style,

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
      tokenPosition)
    this.tokenDistance = tokenDistance;
    this.tokenRadius = tokenRadius;
  }
  /**
   * The center of the token relative to the canvas origin
   */
  get tokenCenterAbsolute() {
    return {
      x:
        center.x +
        this.tokenDistance *
          Math.cos(degToRad(this.wsAngle + this.divisionAngle / 2)),
      y:
        center.y +
        this.tokenDistance *
          Math.sin(degToRad(this.wsAngle + this.divisionAngle / 2)),
    };
  }
  /**
   * The center of the token relative to the center of the orrery.
   */
  get tokenCenterRelative() {
    return {
      x:
        2 * center.x +
        this.tokenDistance *
          Math.cos(degToRad(this.wsAngle + this.tokenArcLength / 2)),
      y:
        2 * center.y +
        this.tokenDistance *
          Math.sin(degToRad(this.wsAngle + this.tokenArcLength / 2)),
    };
  }

  /**
   * Draws a circular token
   * @param {CanvasRenderingContext2D} context
   */
  drawToken(context: CanvasRenderingContext2D) {
    context.beginPath();
    context.arc(
      this.tokenCenterAbsolute.x,
      this.tokenCenterAbsolute.y,
      this.tokenRadius,
      0,
      degToRad(360),
      false
    );
    context.fillStyle = this.tokenStyle.fillStyle;
    context.fill();
  }

  /**
   * Returns whether a position is within the bounds of the planet's token.
   * @param {Degree} x the x-offset relative to the center of the Orrery, positive is right.
   * @param {Degree} y the y-offset relative to the center of the Orrery, positive is down.
   */

  withinToken(x, y) {
    return (
      dist(x, y, this.tokenCenterRelative.x, this.tokenCenterRelative.y) <
      this.tokenRadius
    );
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

// colors
const nearBlack = "#3e2e2e";
const offWhite = "rgb(255,250,250)";
const bgColorLite = "#f0edec";
const bgColorDark = "#503020";

const monRingFillColor = offWhite;
const satRingFillColor = nearBlack;
const jupRingFillColor = "#dcb894";
const marRingFillColor = "#dda1a1";
const venRingFillColor = "#efefd7";
const merRingFillColor = "#d8c7e7";

const sunTokenFillColor = "#ffab40";
const satTokenFillColor = "#434343";
const jupTokenFillColor = "#e69137";
const marTokenFillColor = "#cc0001";
const venTokenFillColor = "#69a84f";
const merTokenFillColor = "#8d7cc2";

var Sun = new Star(
  "Sun",
  distances.mon,
  distances.sat,
  12,
  0,
  monRingFillColor,
  1,
  7,
  distances.sun,
  30,
  sunTokenFillColor
);
var Sat = new Planet(
  "Saturn",
  distances.sat,
  distances.jup,
  36,
  -5,
  satRingFillColor,
  1,
  3,
  satTokenFillColor
);
var Jup = new Planet(
  "Jupiter",
  distances.jup,
  distances.mar,
  48,
  0,
  jupRingFillColor,
  3,
  40,
  jupTokenFillColor
);
var Mar = new Planet(
  "Mars",
  distances.mar,
  distances.ven,
  24,
  0,
  marRingFillColor,
  3,
  22,
  marTokenFillColor
);
var Ven = new Planet(
  "Venus",
  distances.ven,
  distances.mer,
  24,
  0,
  venRingFillColor,
  5,
  14,
  venTokenFillColor
);
var Mer = new Planet(
  "Mercury",
  distances.mer,
  distances.moo,
  24,
  0,
  merRingFillColor,
  7,
  12,
  merTokenFillColor
);

const bodies = [Sun, Sat, Jup, Mar, Ven, Mer];

/**
 * Draws a new frame for the Orrery's canvas.
 * Intended to be called by requestAnimationFrame.
 *
 * @param {DOMHighResTimeStamp} timeElapsed the end time of the previous
 * frame's rendering
 */
function render(timeElapsed = 0) {
  // Background
  state.redrawOrrery = false;
  for (body of bodies) {
    body.move(timeElapsed);
  }
  if (state.redrawOrrery) drawOrrery();
  requestAnimationFrame(render);
}

/**
 * Draws the Orrery ring by ring
 */
function drawOrrery() {
  ctx.fillStyle = state.darkMode ? bgColorDark : bgColorLite;
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
  ctx.strokeStyle = nearBlack;
  subdivide(center.x, center.y, distances.mon, distances.sat, 12, 0);

  ctx.lineWidth = 2;
  ctx.strokeStyle = offWhite;
  subdivide(
    center.x,
    center.y,
    (distances.sat - distances.jup) * 0.7 + distances.jup,
    (distances.sat - distances.jup) * 0.3 + distances.jup,
    36,
    5
  );
  // subdivide(center.x, center.y, distances.sat, distances.jup, 36, 5);

  ctx.lineWidth = 1;
  ctx.strokeStyle = nearBlack;
  subdivide(center.x, center.y, distances.jup, distances.moo, 12, 0);

  ctx.setLineDash([5, 3]);
  subdivide(center.x, center.y, distances.jup, distances.moo, 12, 15);
  subdivide(center.x, center.y, distances.jup, distances.mar, 24, 7.5);
  ctx.setLineDash([]);

  //Tokens
  Sun.drawToken(ctx);
  Sat.drawToken(ctx);
  Jup.drawToken(ctx);
  Mar.drawToken(ctx);
  Ven.drawToken(ctx);
  Mer.drawToken(ctx);

  function drawMonthText() {
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(degToRad(15));

    ctx.fillStyle = nearBlack;
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

// helper functions
/**
 * Converts an angle in degrees to radians
 * @param {degree}
 * @returns {radian}
 */
function degToRad(degrees: degree) {
  return ((degrees * Math.PI) / 180) as radian;
}

/**
 * Converts an angle in radians to degrees
 * @param radians An angle in degrees.
 */
function radToDeg(radians) {
  return (radians * 180) / Math.PI;
}
/**
 * Returns the angle in radians between a 2d vector and the x-axis.
 * @param {Number} xComponent
 * @param {Number} yComponent
 * @returns
 */
function vecToAngle(xComponent, yComponent) {
  if (xComponent >= 0) {
    return (Math.atan(yComponent / xComponent) + Math.PI * 2) % (Math.PI * 2);
  } else {
    return Math.atan(yComponent / xComponent) + Math.PI;
  }
}
/**
 * Returns a positive solution to n % m
 * @param {Number} n
 * @param {Number} m
 */
function posMod(n, m) {
  return ((n % m) + m) % m;
}
// /**
//  * Returns whether the order clockwise is A, N, B.
//  * @param {Number} N an angle in degrees
//  * @param {Number} A an angle in degrees
//  * @param {Number} B an
//  */
// function angleBetweenAngles(N, A, B) {
//   A = A % 360
// }

/**
 * Divides a ring into equal parts
 * @param {Number} centerX the x-coord of the Orrery's center
 * @param {Number} centerY the y-coord of the Orrery's center
 * @param {Number} outerRadius
 * @param {Number} innerRadius
 * @param {Number} divisions number of divisions
 * @param {Number} offsetAngle offset from the vertical of the first division
 */
function subdivide(
  centerX,
  centerY,
  outerRadius,
  innerRadius,
  divisions,
  offsetAngle
) {
  for (let i = 0; i < divisions; i++) {
    ctx.beginPath();
    const angle = degToRad((360 / divisions) * i + offsetAngle);
    ctx.moveTo(
      centerX + outerRadius * Math.cos(angle),
      centerY + outerRadius * Math.sin(angle)
    );
    ctx.lineTo(
      centerX + innerRadius * Math.cos(angle),
      centerY + innerRadius * Math.sin(angle)
    );
    ctx.stroke();
  }
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
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
    for (const planet of [Sun, Sat, Jup, Mar, Ven, Mer]) {
      planet.passMonth();
    }
    requestAnimationFrame(render);
  },
  false
);
drawOrrery();
render();
