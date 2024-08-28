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
// TODO: group under template?
var centerX = 300;
var centerY = 300;
var sunDist = 265;
var monthDist = 250;
var satDist = 200;
var jupDist = 170;
var marDist = 140;
var venDist = 110;
var merDist = 80;

function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

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

ctx.fillStyle = "rgb(0,0,0)";
ctx.fillRect(0, 0, width, height);

ctx.fillStyle = "rgb(255,0,0)";
ctx.beginPath();
ctx.arc(300, 300, 50, degToRad(0), degToRad(360), false);
ctx.fill();

// drawOrrery();

// canvas.addEventListener(
//   "click",
//   function (event) {
//     var x = event.pageX - canvasLeft,
//       y = event.pageY - canvasTop;
//     ctx.fillStyle = "rgb(255,0,0)";
//     ctx.beginPath();
//     ctx.arc(x, y, 20, degToRad(0), degToRad(360), false);
//     ctx.fill();
//   },
//   false
// );

function drawOrrery() {
  ctx.lineWidth = 3;
  // sun circle
  ctx.strokeStyle = "rgb(255,0,0)";
  ctx.beginPath();
  ctx.arc(centerX, centerY, sunDist, degToRad(0), degToRad(360), false);
  ctx.stroke();

  // months
  ctx.fillStyle = "rgb(255,250,250)";
  ctx.beginPath();
  ctx.arc(centerX, centerY, monthDist, degToRad(0), degToRad(360), false);
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "#767777";
  subdivide(centerX, centerY, monthDist, satDist, 12, 0);

  ctx.translate(centerX, centerY);
  ctx.rotate(degToRad(15));

  ctx.fillStyle = "#767777";
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
    ctx.fillText(sign, 0, -215);
    ctx.rotate(degToRad(30));
  }

  ctx.rotate(degToRad(-15));

  ctx.translate(-300, -300);

  //Saturn
  ctx.fillStyle = "#1e1e1e";
  ctx.beginPath();
  ctx.arc(centerX, centerY, satDist, degToRad(0), degToRad(360), false);
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "#f3f0f0";
  subdivide(centerX, centerY, satDist, jupDist, 36, 5);

  // jupiter
  ctx.fillStyle = "#dcbc95";
  ctx.beginPath();
  ctx.arc(centerX, centerY, jupDist, degToRad(0), degToRad(360), false);
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "#1e1e1e";
  subdivide(centerX, centerY, jupDist, marDist, 24, 0);
}
