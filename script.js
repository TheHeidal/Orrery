// Canvas declarations
const canvas = document.querySelector(".myCanvas");
var width = (height = canvas.width = 800),
  height = (canvas.height = 800),
  canvasLeft = canvas.offsetLeft + canvas.clientLeft,
  canvasTop = canvas.offsetTop + canvas.clientTop;
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");
var centerX = width / 2;
var centerY = height / 2;

class Ring {
  outerRadius;
  innerRadius;
  ringFillStyle;

  /**
   *
   * @param {Number} outerRadius
   * @param {Number} innerRadius
   * @param {string | CanvasGradient | CanvasPattern} ringFillStyle
   */
  constructor(outerRadius, innerRadius, ringFillStyle) {
    this.outerRadius = outerRadius;
    this.innerRadius = innerRadius;
    this.ringFillStyle = ringFillStyle;
  }

  /**
   * Draws the ring onto the given context. Does not do subdivisions or text!
   * @param {CanvasRenderingContext2D} context
   */
  drawRing(context) {
    context.fillStyle = this.ringFillStyle;
    context.beginPath();
    context.arc(centerX, centerY, this.outerRadius, deg_0, deg_360, false);
    context.arc(centerX, centerY, this.innerRadius, deg_0, deg_360, true);
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
}

/**
 * A planet on the Orrery, representing both the token and the ring it is on.
 */
class Planet extends Ring {
  span;
  wsAngle;
  tokenFillStyle;

  /**
   *
   * @param {Number} outerRadius
   * @param {Number} innerRadius
   * @param {string | CanvasGradient | CanvasPattern} ringFillStyle
   * @param {Degrees} span
   * @param {Degrees} wsAngle the widdershins angle of the token from the x-axis
   * @param {string | CanvasGradient | CanvasPattern} tokenFillStyle
   */
  constructor(
    outerRadius,
    innerRadius,
    ringFillStyle,
    span,
    wsAngle,
    tokenFillStyle
  ) {
    super(outerRadius, innerRadius, ringFillStyle);
    this.span = span;
    this.wsAngle = wsAngle;
    this.tokenFillStyle = tokenFillStyle;
  }

  get cwAngle() {
    return this.wsAngle + this.span;
  }

  /**
   * Draws a token onto the Planet's ring.
   * @param {CanvasRenderingContext2D} context
   */
  drawToken(context) {
    context.fillStyle = this.tokenFillStyle;
    context.beginPath();
    context.arc(
      centerX,
      centerY,
      this.outerRadius,
      degToRad(this.wsAngle),
      degToRad(this.cwAngle),
      false
    );
    context.lineTo(
      centerX + this.innerRadius * Math.cos(degToRad(this.cwAngle)),
      centerY + this.innerRadius * Math.sin(degToRad(this.cwAngle))
    );
    context.arc(
      centerX,
      centerY,
      this.innerRadius,
      degToRad(this.cwAngle),
      degToRad(this.wsAngle),
      true
    );
    context.fill();
  }

  /**
   * Returns whether a position is within the bounds of the planet's token.
   * @param {Number} x the x-offset relative to the center of the Orrery, positive is right.
   * @param {Number} y the y-offset relative to the center of the Orrery, positive is down.
   */
  withinToken(x, y) {
    var angle = radToDeg(vecToAngle(x, y));
    return (
      this.withinRing(x, y) && posMod(angle - this.wsAngle, 360) < this.span
    );
  }
}

var sunDist = 265;
var monthDist = 250;
var textDist = 215;
var satDist = 200;
var jupDist = 170;
var marDist = 140;
var venDist = 110;
var merDist = 80;
var mooDist = 50;

// colors
const nearBlack = "#1e1e1e";
const offWhite = "rgb(255,250,250)";

const satRingColor = nearBlack;
const jupRingColor = "#dcb894";
const marRingColor = "#dda1a1";
const venRingColor = "#efefd7";
const merRingColor = "#d8c7e7";

const satTokenColor = "#434343";
const jupTokenColor = "#e69137";
const marTokenColor = "#cc0001";
const venTokenColor = "#69a84f";
const merTokenColor = "#8d7cc2";

var Months = new Ring(monthDist, satDist, offWhite);
var Sat = new Planet(satDist, jupDist, satRingColor, 10, 355, satTokenColor);
var Jup = new Planet(
  jupDist,
  marDist,
  jupRingColor,
  (360 / 48) * 3,
  355,
  jupTokenColor
);
var Mar = new Planet(marDist, venDist, marRingColor, 10, 355, marTokenColor);
var Ven = new Planet(venDist, merDist, venRingColor, 10, 355, venTokenColor);
var Mer = new Planet(merDist, mooDist, merRingColor, 10, 355, merTokenColor);

const bgColor = "#f0edec";
/**
 * Draws a new frame for the Orrery's canvas.
 * Intended to be called by requestAnimationFrame.
 *
 * @param {DOMHighResTimeStamp} timeElapsed the end time of the previous
 * frame's rendering
 */
function render(timeElapsed = 0) {
  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  drawOrrery();
}

/**
 * Draws the Orrery ring by ring
 */
function drawOrrery() {
  //Sun ring
  ctx.lineWidth = 3;
  ctx.strokeStyle = "red";
  ctx.beginPath();
  ctx.arc(centerX, centerY, sunDist, deg_0, deg_360);
  ctx.stroke();

  //Rings
  Months.drawRing(ctx);
  Sat.drawRing(ctx);
  Sat.drawRing(ctx);
  Jup.drawRing(ctx);
  Mar.drawRing(ctx);
  Ven.drawRing(ctx);
  Mer.drawRing(ctx);

  //Text
  drawMonthText();

  //Divisions
  ctx.lineWidth = 2;
  ctx.strokeStyle = nearBlack;
  subdivide(centerX, centerY, monthDist, satDist, 12, 0);

  ctx.lineWidth = 1;
  ctx.strokeStyle = offWhite;
  subdivide(centerX, centerY, satDist, jupDist, 36, 5);

  ctx.strokeStyle = nearBlack;
  subdivide(centerX, centerY, jupDist, mooDist, 12, 0);

  ctx.setLineDash([5, 3]);
  subdivide(centerX, centerY, jupDist, mooDist, 12, 15);
  subdivide(centerX, centerY, jupDist, marDist, 24, 7.5);
  ctx.setLineDash([]);

  //Tokens
  Sat.drawToken(ctx);
  Jup.drawToken(ctx);
  Mar.drawToken(ctx);
  Ven.drawToken(ctx);
  Mer.drawToken(ctx);
  // ctx.fillStyle = Sat.tokenFillStyle;
  // ctx.beginPath();
  // ctx.arc(centerX, centerY, satDist, degToRad(-5), degToRad(5), false);
  // ctx.lineTo(
  //   centerX + jupDist * Math.cos(degToRad(5)),
  //   centerY + jupDist * Math.sin(degToRad(5))
  // );
  // ctx.arc(centerX, centerY, jupDist, degToRad(5), degToRad(-5), true);
  // ctx.fill();

  function drawMonthText() {
    ctx.save();
    ctx.translate(centerX, centerY);
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
      ctx.fillText(sign, 0, -textDist);
      ctx.rotate(degToRad(30));
    }

    ctx.restore();
  }
}

// Interactivity
canvas.addEventListener(
  "click",
  function (event) {
    var mouseX = event.pageX - canvasLeft - centerX,
      mouseY = event.pageY - canvasTop - centerY,
      mouseRadius = Math.sqrt(mouseX ** 2 + mouseY ** 2);
    console.log(
      `${mouseX}, ${mouseY}\nangle: ${radToDeg(
        vecToAngle(mouseX, mouseY)
      )}\nsat diff: ${posMod(
        radToDeg(vecToAngle(mouseX, mouseY)) - Sat.wsAngle,
        360
      )}`
    );
    if (Sat.withinToken(mouseX, mouseY)) {
      console.log("that's saturn!");
    }
  },
  false
);

// helper constants
const deg_0 = degToRad(0);
const deg_360 = degToRad(360);

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

render();
