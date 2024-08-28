// Canvas declarations
const canvas = document.querySelector(".myCanvas");
var width = (canvas.width = 600),
  height = (canvas.height = 600),
  canvasLeft = canvas.offsetLeft + canvas.clientLeft,
  canvasTop = canvas.offsetTop + canvas.clientTop;

// const width = (canvas.width = window.innerWidth);
// const height = (canvas.height = window.innerHeight);
const ctx = canvas.getContext("2d");

var centerX = width / 2;
var centerY = height / 2;
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
const jupRingColor = "#dcbc95";
const marRingColor = "red";
const venRingColor = "green";
const merRingColor = "purple";

const satColor = "grey";
const jupColor = "#dcbc95";
const marColor = "red";
const venColor = "green";
const merColor = "purple";

/**
 * A planet on the Orrery, representing both the token and the ring it is on.
 */
class Planet {
  outerRadius;
  innerRadius;
  span;
  ccwAngle;
  tokenColor;

  constructor(outerRadius, innerRadius, span, ccwAngle, tokenColor) {
    this.outerRadius = outerRadius;
    this.innerRadius = innerRadius;
    this.span = span;
    this.ccwAngle = ccwAngle;
    this.tokenColor = tokenColor;
  }

  /**
   * Returns whether a position is within the bounds of the planet's token.
   * @param {Number} x the x-offset relative to the center of the Orrery.
   * @param {*} y the y-offset relative to the center of the Orrery.
   */
  withinToken(x, y) {
    var radius = Math.sqrt(x ** 2 + y ** 2),
      angle = radToDeg(vecToAngle(x, y));
    return (
      radius > this.innerRadius &&
      radius < this.outerRadius &&
      posMod(angle - this.ccwAngle, 360) < this.span
    );
  }
}

var Sat = new Planet(satDist, jupDist, 10, 355, satColor);
var Jup = new Planet(jupDist, marDist, 10, 355, jupColor);
var Mar = new Planet(marDist, venDist, 10, 355, marColor);
var Ven = new Planet(venDist, merDist, 10, 355, venColor);
var Mer = new Planet(merDist, mooDist, 10, 355, merColor);
var XXX = new Planet(satDist, jupDist, 10, 355, satColor);

/**
 * Draws a new frame for the Orrery's canvas.
 * Intended to be called by requestAnimationFrame.
 *
 * @param {DOMHighResTimeStamp} timeElapsed the end time of the previous
 * frame's rendering
 */
function draw(timeElapsed = 0) {
  // Background
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);

  drawOrrery();
}

canvas.addEventListener(
  "click",
  function (event) {
    var mouseX = event.pageX - canvasLeft - centerX,
      mouseY = event.pageY - canvasTop - centerY,
      mouseRadius = Math.sqrt(mouseX ** 2 + mouseY ** 2),
      mouseAngle = radToDeg(vecToAngle(mouseX, mouseY));
    console.log(
      `${mouseX}, ${mouseY}\nangle: ${mouseAngle}\nsat diff: ${posMod(
        mouseAngle - Sat.ccwAngle,
        360
      )}`
    );
    if (
      mouseRadius > Sat.innerRadius &&
      mouseRadius < Sat.outerRadius &&
      posMod(mouseAngle - Sat.ccwAngle, 360) < Sat.span
    ) {
      console.log("that's saturn!");
    }
  },
  false
);

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
  rings = [
    { fillStyle: offWhite, radius: monthDist },
    { fillStyle: satRingColor, radius: satDist },
    { fillStyle: jupRingColor, radius: jupDist },
    { fillStyle: marRingColor, radius: marDist },
    { fillStyle: venRingColor, radius: venDist },
    { fillStyle: merRingColor, radius: merDist },
    { fillStyle: offWhite, radius: mooDist },
  ];

  for (ring of rings) {
    ctx.fillStyle = ring.fillStyle;
    ctx.beginPath();
    ctx.arc(centerX, centerY, ring.radius, deg_0, deg_360, false);
    ctx.fill();
  }
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

  ctx.fillStyle = satColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, satDist, degToRad(-5), degToRad(5), false);
  ctx.lineTo(
    centerX + jupDist * Math.cos(degToRad(5)),
    centerY + jupDist * Math.sin(degToRad(5))
  );
  ctx.arc(centerX, centerY, jupDist, degToRad(5), degToRad(-5), true);
  ctx.fill();

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

draw();
