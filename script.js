/**
 * @fileoverview javascript code to draw and animate the Orrery from Seven Part Pact (a playtested game by Jay Dragon)
 * @copyright To avoid any conflict with the copyright of Possum Creek Games, this work is not available to license.
 * @TheHeidal
 */

// Canvas declarations
const canvas = document.querySelector(".myCanvas");
var width = (height = canvas.width = 700),
  height = (canvas.height = 700),
  center = { x: width / 2, y: height / 2 };
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");

var state = { redrawOrrery: false, idle: true, darkMode: true };
var secondsPerMonth = 1000000;

/**
 * A planet on the Orrery, representing both the token and the ring it is on.
 * @property {String} name
 * @property {Number} numDivisions how many positions exist on the ring.
 * @property {Degrees} divisionArcLength the angle between the ws and cw edges.
 * @property {Degrees} divisionOffset The angle that the widdershins edge of the
 * first division is offset from the x-axis.
 * @property {Number} divisionSpan How many divisions the token takes up.
 * @property {Degrees} tokenArcLength the angle between the ws and cw edges.
 * @property {Degrees} wsAngle the angle of the widdershins edge of the token.
 * @property {Degrees} cwAngle the angle of the clockwise edge of the token.
 */
class CelestialBody {
  name;
  numDivisions;
  divisionOffset;

  wsAngle;
  divisionSpan;

  outerRadius;
  innerRadius;
  ringFillStyle;

  tokenFillStyle;
  tokenStrokeStyle;

  destinationWsAngle;

  /**
   * @param {String} name
   * @param {Number} outerRadius The distance from the center of the orrery to the outside of the ring.
   * @param {Number} innerRadius The distance from the center of the orrery to the inside of the ring.
   * @param {Number} numDivisions
   * @param {Number} divisionOffset the offset of the first division from the x-axis
   * @param {string | CanvasGradient | CanvasPattern} ringFillStyle
   * @param {Number} divisionsTokenSpans
   * @param {Number} tokenPosition: which division shares a ws edge with the token (0-indexed from the first position on the x-axis)
   * @param {string | CanvasGradient | CanvasPattern} tokenFillStyle
   */
  constructor(
    name,
    outerRadius,
    innerRadius,
    numDivisions,
    divisionOffset,
    ringFillStyle,
    divisionsTokenSpans,
    tokenPosition,
    tokenFillStyle,
    tokenStrokeStyle
  ) {
    this.name = name;

    this.outerRadius = outerRadius;
    this.innerRadius = innerRadius;

    this.ringFillStyle = ringFillStyle;

    this.tokenFillStyle = tokenFillStyle;
    this.tokenStrokeStyle = tokenStrokeStyle;

    this.numDivisions = numDivisions;
    this.divisionOffset = divisionOffset;
    this.divisionSpan = divisionsTokenSpans;
    this.wsAngle = this.divisionArcLength * tokenPosition + this.divisionOffset;
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
      this.wsAngle += this.speed * timestamp;
      state.redrawOrrery = true;
    } else {
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
   * Draws the ring onto the given context. Does not do subdivisions or text!
   * @param {CanvasRenderingContext2D} context
   */
  drawRing(context) {
    context.fillStyle = this.ringFillStyle;
    context.beginPath();
    context.arc(center.x, center.y, this.outerRadius, 0, degToRad(360), false);
    context.arc(center.x, center.y, this.innerRadius, 0, degToRad(360), true);
    context.fill();
  }

  /**
   * Returns whether a position is within the bounds of the planet's token.
   * @param {Number} x the x-offset relative to the center of the Orrery, positive is right.
   * @param {Number} y the y-offset relative to the center of the Orrery, positive is down.
   */
  withinRing(x, y) {
    var radius = Math.sqrt(x ** 2 + y ** 2);
    return radius > this.innerRadius && radius < this.outerRadius;
  }

  /**
   * Abstract method to draw a token on context
   * @param {CanvasRenderingContext2D} context
   */
  drawToken(context) {
    throw TypeError("Celestial Bodies can't draw tokens on their own!");
  }
  /**
   * Abstract method to identify if a position is within the token.
   */
  withinToken(x, y) {
    throw TypeError("Celestial Bodies can't identify tokens on their own!");
  }

  get speed() {
    return this.tokenArcLength / secondsPerMonth;
  }

  /**
   * @returns {Degree}
   */
  get cwAngle() {
    return this.wsAngle + this.tokenArcLength;
  }
  /**
   * The angle between the token's widdershins and clockwise edges
   * @returns {Degrees}
   */
  get tokenArcLength() {
    return this.divisionSpan * this.divisionArcLength;
  }
  /**
   * The angle of one division of the ring
   * @returns {Degrees}
   */
  get divisionArcLength() {
    return 360 / this.numDivisions;
  }
}
/**Celestial Bodies with pie-crust shaped tokens */
class Planet extends CelestialBody {
  /**
   * Draws a token onto the Planet's ring.
   * @param {CanvasRenderingContext2D} context
   */
  drawToken(context) {
    context.fillStyle = this.tokenFillStyle;
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
    context.fill();
  }

  /**
   * Returns whether a position is within the bounds of the planet's token.
   * @param {Degree} x the x-offset relative to the center of the Orrery, positive is right.
   * @param {Degree} y the y-offset relative to the center of the Orrery, positive is down.
   */
  withinToken(x, y) {
    var angle = radToDeg(vecToAngle(x, y));
    return (
      this.withinRing(x, y) &&
      posMod(angle - this.wsAngle, 360) < this.tokenArcLength
    );
  }
}
/**
 * Celestial bodies with circular tokens.
 */
class Star extends CelestialBody {
  /**
   * @param {String} name
   * @param {Number} outerRadius The distance from the center of the orrery to the outside of the ring.
   * @param {Number} innerRadius
   * @param {Number} numDivisions
   * @param {Number} divisionOffset the offset of the first division from the x-axis
   * @param {string | CanvasGradient | CanvasPattern} ringFillStyle
   * @param {Number} span
   * @param {Number} position: which division shares a ws edge with the token (0-indexed from the first position on the x-axis)
   * @param {Number} tokenDistance the distance from the center of the orrery to the center of the token
   * @param {Number} tokenRadius the token's radius
   * @param {string | CanvasGradient | CanvasPattern} tokenFillStyle
   */
  constructor(
    name,
    outerRadius,
    innerRadius,
    numDivisions,
    divisionOffset,
    ringFillStyle, //TODO: group with radii?
    span,
    position,

    tokenDistance,
    tokenRadius,
    tokenFillStyle
  ) {
    super(
      name,
      outerRadius,
      innerRadius,
      numDivisions,
      divisionOffset,
      ringFillStyle,
      span,
      position,
      tokenFillStyle
    );
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
          Math.cos(degToRad(this.wsAngle + this.divisionArcLength / 2)),
      y:
        center.y +
        this.tokenDistance *
          Math.sin(degToRad(this.wsAngle + this.divisionArcLength / 2)),
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
  drawToken(context) {
    context.fillStyle = this.tokenFillStyle;
    context.beginPath();
    context.arc(
      this.tokenCenterAbsolute.x,
      this.tokenCenterAbsolute.y,
      this.tokenRadius,
      0,
      degToRad(360),
      false
    );
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

const monRingColor = offWhite;
const satRingColor = nearBlack;
const jupRingColor = "#dcb894";
const marRingColor = "#dda1a1";
const venRingColor = "#efefd7";
const merRingColor = "#d8c7e7";

const sunTokenFillColor = "#ffab40";
const satTokenColor = "#434343";
const jupTokenColor = "#e69137";
const marTokenColor = "#cc0001";
const venTokenColor = "#69a84f";
const merTokenColor = "#8d7cc2";

var Sun = new Star(
  "Sun",
  distances.mon,
  distances.sat,
  12,
  0,
  monRingColor,
  1,
  7,
  distances.sun,
  30,
  sunTokenFillColor,
);
var Sat = new Planet(
  "Saturn",
  distances.sat,
  distances.jup,
  36,
  -5,
  satRingColor,
  1,
  3,
  satTokenColor
);
var Jup = new Planet(
  "Jupiter",
  distances.jup,
  distances.mar,
  48,
  0,
  jupRingColor,
  3,
  40,
  jupTokenColor
);
var Mar = new Planet(
  "Mars",
  distances.mar,
  distances.ven,
  24,
  0,
  marRingColor,
  3,
  22,
  marTokenColor
);
var Ven = new Planet(
  "Venus",
  distances.ven,
  distances.mer,
  24,
  0,
  venRingColor,
  5,
  14,
  venTokenColor
);
var Mer = new Planet(
  "Mercury",
  distances.mer,
  distances.moo,
  24,
  0,
  merRingColor,
  7,
  12,
  merTokenColor
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
 * @param {Number} degrees
 * @returns
 */
function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
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
