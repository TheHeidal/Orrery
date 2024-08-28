// Canvas declarations
const canvas = document.querySelector(".myCanvas");
var width = (canvas.width = 600),
  height = (canvas.height = 600),
  canvasLeft = canvas.offsetLeft + canvas.clientLeft,
  canvasTop = canvas.offsetTop + canvas.clientTop;

// const width = (canvas.width = window.innerWidth);
// const height = (canvas.height = window.innerHeight);
const ctx = canvas.getContext("2d");

// orrery declarations
var Orrery = {
  x: 300,
  y: 300,
  sunDist: 265,
  monthDist: 250,
  textDist: 215,
  satDist: 200,
  jupDist: 170,
  marDist: 140,
  venDist: 110,
  merDist: 80,
  mooDist: 50,
};

// state

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

const testingGlow = ctx.createRadialGradient(
  Orrery.x,
  Orrery.y,
  50,
  Orrery.x,
  Orrery.y,
  60
);
testingGlow.addColorStop(0, "white");
testingGlow.addColorStop(1, "rgb(255 255 255 / 0%");

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
  // ctx.fillStyle = "rgb(0,0,0)";
  ctx.fillRect(0, 0, width, height);

  drawOrrery();
}

// canvas.addEventListener(
//   "click",
//   function (event) {
//     var x = event.pageX - canvasLeft,
//       y = event.pageY - canvasTop;
//     radius = dist(Orrery.centerX, Orrery.centerY, x, y);
//     console.log(radius);
//     if (radius <= 50) {
//       stateTesting.glow = !stateTesting.glow;
//       requestAnimationFrame(draw);
//     }
//   },
//   false
// );

/**
 * Draws the Orrery ring by ring
 */
function drawOrrery() {
  //Sun ring
  ctx.lineWidth = 3;
  ctx.strokeStyle = "red";
  ctx.beginPath();
  ctx.arc(Orrery.x, Orrery.y, Orrery.sunDist, deg_0, deg_360);
  ctx.stroke();

  //Rings
  rings = [
    { fillStyle: offWhite, radius: Orrery.monthDist },
    { fillStyle: satRingColor, radius: Orrery.satDist },
    { fillStyle: jupRingColor, radius: Orrery.jupDist },
    { fillStyle: marRingColor, radius: Orrery.marDist },
    { fillStyle: venRingColor, radius: Orrery.venDist },
    { fillStyle: merRingColor, radius: Orrery.merDist },
    { fillStyle: offWhite, radius: Orrery.mooDist },
  ];

  for (ring of rings) {
    ctx.fillStyle = ring.fillStyle;
    ctx.beginPath();
    ctx.arc(Orrery.x, Orrery.y, ring.radius, deg_0, deg_360, false);
    ctx.fill();
  }
  //Text
  drawMonthText();

  //Divisions
  ctx.lineWidth = 2;
  ctx.strokeStyle = nearBlack;
  subdivide(Orrery.x, Orrery.y, Orrery.monthDist, Orrery.satDist, 12, 0);

  ctx.lineWidth = 1;
  ctx.strokeStyle = offWhite;
  subdivide(Orrery.x, Orrery.y, Orrery.satDist, Orrery.jupDist, 36, 5);

  ctx.strokeStyle = nearBlack;
  subdivide(Orrery.x, Orrery.y, Orrery.jupDist, Orrery.mooDist, 12, 0);

  ctx.setLineDash([5, 3]);
  subdivide(Orrery.x, Orrery.y, Orrery.jupDist, Orrery.mooDist, 12, 15);
  subdivide(Orrery.x, Orrery.y, Orrery.jupDist, Orrery.marDist, 24, 7.5);
  ctx.setLineDash([]);

  //Tokens
  ctx.fillStyle = satColor;
  ctx.beginPath();
  ctx.arc(Orrery.x, Orrery.y, Orrery.satDist, degToRad(-5), degToRad(5), false);
  ctx.lineTo(
    Orrery.x + Orrery.jupDist * Math.cos(degToRad(5)),
    Orrery.y + Orrery.jupDist * Math.sin(degToRad(5))
  );
  ctx.arc(Orrery.x, Orrery.y, Orrery.jupDist, degToRad(5), degToRad(-5), true);
  ctx.fill();

  function drawMonthText() {
    ctx.save();
    ctx.translate(Orrery.x, Orrery.y);
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
      ctx.fillText(sign, 0, -Orrery.textDist);
      ctx.rotate(degToRad(30));
    }

    ctx.restore();
  }
}

// helper constants
const deg_0 = degToRad(0);
const deg_360 = degToRad(360);

// helper functions
function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}
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
