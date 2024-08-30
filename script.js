// Canvas declarations
const canvas = document.querySelector(".myCanvas");
var width = (height = canvas.width = 700),
  height = (canvas.height = 700),
  canvasLeft = canvas.offsetLeft + canvas.clientLeft,
  canvasTop = canvas.offsetTop + canvas.clientTop;
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");
var centerX = width / 2;
var centerY = height / 2;

var state = { clickToggle: false };

/**
 * A planet on the Orrery, representing both the token and the ring it is on.
 * @property {String} name
 * @property {Number} numDivisions how many positions exist on the ring.
 * @property {Degrees} divisionOffset The angle that the widdershins edge of the
 * first division is offset from the x-axis.
 * @property {Number} span How many divisions the token takes up.
 * @property {Degrees} arc the angle between the ws and cw edges.
 * @property {Degrees} wsAngle the angle of the widdershins edge of the token.
 * @property {Degrees} cwAngle the angle of the clockwise edge of the token.
 * @property {Boolean} synced Whether the position matches the actual angles.
 */
class CelestialBody {
  name;

  outerRadius;
  innerRadius;
  ringFillStyle;

  tokenFillStyle;

  numDivisions;
  divisionOffset;
  span;
  position;
  #truePosition;
  wsAngle;
  #trueWsAngle;
  synced;

  /**
   * @param {String} name
   * @param {Number} outerRadius The distance from the center of the orrery to the outside of the ring.
   * @param {Number} innerRadius
   * @param {Number} numDivisions
   * @param {Number} divisionOffset the offset of the first division from the x-axis
   * @param {string | CanvasGradient | CanvasPattern} ringFillStyle
   * @param {Number} span
   * @param {Number} position: which division shares a ws edge with the token (0-indexed from the first position on the x-axis)
   * @param {string | CanvasGradient | CanvasPattern} tokenFillStyle
   */
  constructor(
    name,
    outerRadius,
    innerRadius,
    numDivisions,
    divisionOffset,
    ringFillStyle,
    span,
    position,
    tokenFillStyle
  ) {
    this.name = name;
    this.outerRadius = outerRadius;
    this.innerRadius = innerRadius;
    this.numDivisions = numDivisions;
    this.divisionOffset = divisionOffset;
    this.ringFillStyle = ringFillStyle;
    this.span = span;
    this.position = position;
    this.tokenFillStyle = tokenFillStyle;

    this.setAngleFromPosition();
  }

  /**
   * Draws the ring onto the given context. Does not do subdivisions or text!
   * @param {CanvasRenderingContext2D} context
   */
  drawRing(context) {
    context.fillStyle = this.ringFillStyle;
    context.beginPath();
    context.arc(centerX, centerY, this.outerRadius, 0, degToRad(360), false);
    context.arc(centerX, centerY, this.innerRadius, 0, degToRad(360), true);
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
   * Abstract method for drawing tokens
   * @param {CanvasRenderingContext2D} context
   */
  drawToken(context) {
    throw TypeError("Celestial Bodies can't draw tokens on their own!");
  }

  /**
   * Abstract method.
   * Returns whether a position is within the bounds of the body's token.
   * @param {Degree} x the x-offset relative to the center of the Orrery, positive is right.
   * @param {Degree} y the y-offset relative to the center of the Orrery, positive is down.
   */
  withinToken(x, y) {
    throw TypeError("Celestial Bodies can't identify tokens on their own!");
  }

  advance() {
    this.position += this.span;
    this.wsAngle += this.divisionAngle;
    requestAnimationFrame(render);
  }

  /**
   * Sets the angle of the token from the current position.
   */
  setAngleFromPosition() {
    this.wsAngle =
      (360 / this.numDivisions) * this.position - this.divisionOffset;
    this.synced = true;
  }

  setPositionFromAngle() {
    //TODO make it so the token will snap to a position. Not sure how to determine which one.
    console.warn(`${this.name} tried to set its position!`);
  }

  /**
   * @param {Number} n
   */
  set position(n) {
    //setter is necessary so we always know if we desync
    this.#truePosition = n;
    this.synced = false;
  }

  /**
   * @returns {Degree}
   */
  get position() {
    return this.#truePosition;
  }
  /**
   * @param {Degrees} n
   */
  set wsAngle(n) {
    //setter is necessary so we always know if we desync
    this.#trueWsAngle = n;
    this.synced = false;
  }

  /**
   * @returns {Degree}
   */
  get wsAngle() {
    return this.#trueWsAngle;
  }

  /**
   * @returns {Degree}
   */
  get cwAngle() {
    return this.wsAngle + this.divisionAngle;
  }
  /**
   * @returns {Degree}
   */
  get divisionAngle() {
    return this.span * (360 / this.numDivisions);
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
   * @param {Degree} x the x-offset relative to the center of the Orrery, positive is right.
   * @param {Degree} y the y-offset relative to the center of the Orrery, positive is down.
   */
  withinToken(x, y) {
    var angle = radToDeg(vecToAngle(x, y));
    // if (this.withinRing(x, y)) {
    //   console.log(
    //     `debug: ${this.name}
    //     mouse angle:    ${angle}
    //     planet angle:   ${this.wsAngle}
    //     planet arc:     ${this.arc}
    //     mod difference: ${posMod(angle - this.wsAngle, 360)}`
    //   );
    // }
    return (
      this.withinRing(x, y) &&
      posMod(angle - this.wsAngle, 360) < this.divisionAngle
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
    ringFillStyle, //TODO: group with radii
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
        centerX +
        this.tokenDistance *
          Math.cos(degToRad(this.wsAngle + this.divisionAngle / 2)),
      y:
        centerY +
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
        2 * centerX +
        this.tokenDistance *
          Math.cos(degToRad(this.wsAngle + this.divisionAngle / 2)),
      y:
        2 * centerY +
        this.tokenDistance *
          Math.sin(degToRad(this.wsAngle + this.divisionAngle / 2)),
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
    return dist(x, y, this.tokenCenterRelative.x, this.tokenCenterRelative.y) < this.tokenRadius;
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
const bgColorLite = "#f0edec";
const bgColorDark = "#503020";

const monRingColor = offWhite;
const satRingColor = nearBlack;
const jupRingColor = "#dcb894";
const marRingColor = "#dda1a1";
const venRingColor = "#efefd7";
const merRingColor = "#d8c7e7";

const sunTokenColor = "#ffab40";
const satTokenColor = "#434343";
const jupTokenColor = "#e69137";
const marTokenColor = "#cc0001";
const venTokenColor = "#69a84f";
const merTokenColor = "#8d7cc2";

var Sun = new Star(
  "Sun",
  monthDist,
  satDist,
  12,
  0,
  monRingColor,
  1,
  7,
  265,
  20,
  sunTokenColor
);
// var Mon = new Ring("Months", monthDist, satDist, 12, 0, monRingColor);
var Sat = new Planet(
  "Saturn",
  satDist,
  jupDist,
  36,
  -5,
  satRingColor,
  1,
  3,
  satTokenColor
);
var Jup = new Planet(
  "Jupiter",
  jupDist,
  marDist,
  48,
  0,
  jupRingColor,
  3,
  40,
  jupTokenColor
);
var Mar = new Planet(
  "Mars",
  marDist,
  venDist,
  24,
  0,
  marRingColor,
  3,
  22,
  marTokenColor
);
var Ven = new Planet(
  "Venus",
  venDist,
  merDist,
  24,
  0,
  venRingColor,
  5,
  14,
  venTokenColor
);
var Mer = new Planet(
  "Mercury",
  merDist,
  mooDist,
  24,
  0,
  merRingColor,
  7,
  12,
  merTokenColor
);

/**
 * Draws a new frame for the Orrery's canvas.
 * Intended to be called by requestAnimationFrame.
 *
 * @param {DOMHighResTimeStamp} timeElapsed the end time of the previous
 * frame's rendering
 */
function render(timeElapsed = 0) {
  // Background

  ctx.fillStyle = state.clickToggle ? bgColorDark : bgColorLite;
  ctx.fillRect(0, 0, width, height);

  drawOrrery();
  requestAnimationFrame(render);
}

/**
 * Draws the Orrery ring by ring
 */
function drawOrrery() {
  //Sun ring
  ctx.lineWidth = 3;
  ctx.strokeStyle = "red";
  ctx.beginPath();
  ctx.arc(centerX, centerY, sunDist, 0, degToRad(360));
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
  Sun.drawToken(ctx);
  Sat.drawToken(ctx);
  Jup.drawToken(ctx);
  Mar.drawToken(ctx);
  Ven.drawToken(ctx);
  Mer.drawToken(ctx);

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
      console.debug(planet.name, planet.position, planet.wsAngle);
      planet.advance();
      console.debug(planet.name, planet.position, planet.wsAngle);
    }
    requestAnimationFrame(render);
  },
  false
);

render();
