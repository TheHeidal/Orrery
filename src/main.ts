/**
 * @fileoverview javascript code to draw and animate the Orrery from Seven Part Pact (a game by Jay Dragon)
 * @copyright To avoid any conflict with the copyright of Possum Creek Games, this work is not available to license.
 * @TheHeidal
 */

import { degToRad } from "./modules/misc.js";
import type { CelestialBody } from "./modules/celestialbodies.js";
import { Star, Planet } from "./modules/celestialbodies.js";
import { LineStyle, Orrery, Point } from "./modules/types.js";

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

// Canvas declarations
const canvas = document.querySelector(".myCanvas") as HTMLCanvasElement;
canvas.height = canvas.width = 700;
const ctx = canvas.getContext("2d");
/**
 * @param mousePosition: position of the mouse relative to the canvas origin, irrespective of transformations.
 */
const orrery: Orrery = {
  canvas: ctx,
  center: { x: canvas.width / 2, y: canvas.height / 2 },
  mousePosition: false,
};

var Sun = new Star(
  orrery,
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
  {
    fillStyle: colors.nearBlack,
    textAlign: "center",
    font: "25px serif",
    yOffset: distances.txt,
  },
  7
);

var Sat = new Planet(
  orrery,
  "Saturn",
  36,
  -5,
  1,
  distances.sat,
  distances.jup,
  {
    default: { fillStyle: colors.nearBlack },
    hovered: { fillStyle: "#FF88DD" },
  },
  { fillStyle: colors.satTokenFillColor },
  3
);
var Jup = new Planet(
  orrery,
  "Jupiter",
  48,
  0,
  3,
  distances.jup,
  distances.mar,
  {
    default: { fillStyle: colors.jupRingFillColor },
    hovered: { fillStyle: "#FF88DD" },
  },
  { fillStyle: colors.jupTokenFillColor },
  3
);

var Mar = new Planet(
  orrery,
  "Mars",
  24,
  0,
  3,
  distances.mar,
  distances.ven,
  {
    default: { fillStyle: colors.marRingFillColor },
    hovered: { fillStyle: "#FF88DD" },
  },

  { fillStyle: colors.marTokenFillColor },
  22
);

var Ven = new Planet(
  orrery,
  "Venus",
  24,
  0,
  5,
  distances.ven,
  distances.mer,
  {
    default: { fillStyle: colors.venRingFillColor },
    hovered: { fillStyle: "#FF88DD" },
  },

  { fillStyle: colors.venTokenFillColor },
  14
);

var Mer = new Planet(
  orrery,
  "Mercury",
  24,
  0,
  7,
  distances.mer,
  distances.moo,
  {
    default: { fillStyle: colors.merRingFillColor },
    hovered: { fillStyle: "#FF88DD" },
  },
  {
    default: { fillStyle: colors.merTokenFillColor },
    hovered: { fillStyle: "#CC44BB" },
  },

  12
);

// const bodies = [Sun, Sat, Jup, Mar, Ven, Mer];
const bodies: CelestialBody[] = [Sun, Sat, Jup, Mar, Ven, Mer];

let lastFrame: DOMHighResTimeStamp;

var state = { orreryUpdated: false, idle: false, darkMode: true };

function init() {
  drawOrrery();
  window.requestAnimationFrame(render);
}

function drawBG() {
  ctx.fillStyle = state.darkMode ? colors.bgColorDark : colors.bgColorLite;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Draws the Orrery ring by ring
 */
function drawOrrery() {
  drawBG();

  //Sun ring
  ctx.lineWidth = 3;
  ctx.strokeStyle = "red";
  ctx.beginPath();
  ctx.arc(orrery.center.x, orrery.center.y, distances.sun, 0, degToRad(360));
  ctx.stroke();

  //Rings
  for (var body of bodies) {
    body.drawRing(ctx);
  }

  //Divisions
  subdivide(
    { strokeStyle: colors.nearBlack, lineWidth: 2 },
    orrery.center,
    distances.mon,
    distances.sat,
    12
  );

  subdivide(
    { strokeStyle: colors.offWhite, lineWidth: 2 },
    orrery.center,
    (distances.sat - distances.jup) * 0.7 + distances.jup,
    (distances.sat - distances.jup) * 0.3 + distances.jup,
    36,
    5
  );

  ctx.lineWidth = 1;
  ctx.strokeStyle = colors.nearBlack;
  subdivide(
    { strokeStyle: colors.nearBlack, lineWidth: 1 },
    orrery.center,
    distances.jup,
    distances.moo,
    12
  );

  subdivide(
    { strokeStyle: colors.nearBlack, lineWidth: 1, lineDash: [5, 3] },
    orrery.center,
    distances.jup,
    distances.moo,
    12,
    15
  );
  subdivide(
    { strokeStyle: colors.nearBlack, lineWidth: 1, lineDash: [5, 3] },
    orrery.center,
    distances.jup,
    distances.mar,
    24,
    7.5
  );

  //Tokens
  for (var body of bodies) {
    body.drawToken(ctx);
  }

  /**
   * Draws equally spaced lines about the origin from outerRadius to innerRadius
   * @param {Number} outerRadius
   * @param {Number} innerRadius
   * @param {Number} divisions number of divisions
   * @param {Number} offsetAngle offset from the x-axis in degrees
   */
  function subdivide(
    //TODO: is it worth optimizing it so we don't recreate the path every frame?
    style: LineStyle,
    center: Point,
    outerRadius: number,
    innerRadius: number,
    divisions: number,
    offsetAngle: number = 0
  ) {
    ctx.strokeStyle = style.strokeStyle;
    ctx.lineWidth = style.lineWidth;
    ctx.setLineDash("lineDash" in style ? style.lineDash : []);
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.beginPath();
    ctx.rotate(degToRad(offsetAngle));
    for (let i = 0; i < divisions; i++) {
      ctx.rotate((2 * Math.PI) / divisions);
      ctx.moveTo(outerRadius, 0);
      ctx.lineTo(innerRadius, 0);
    }
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Draws a new frame.
 *
 * @param {DOMHighResTimeStamp} timeStamp the end time of the previous
 * frame's rendering
 */
function render(timeStamp: DOMHighResTimeStamp) {
  if (lastFrame === undefined) {
    lastFrame = timeStamp;
  }
  const elapsed = timeStamp - lastFrame;

  for (var body of bodies) {
    body.updateTokenPosition(elapsed);
    updateLabel(body);
  }
  drawOrrery();
  lastFrame = timeStamp;
  requestAnimationFrame(render);
}

// Interactivity
canvas.addEventListener(
  "click",
  function (event) {
    for (const body of bodies) {
      body.passMonth();
    }
  },
  false
);

canvas.addEventListener("mousemove", function (event) {
  orrery.mousePosition = {
    x: event.offsetX,
    y: event.offsetY,
  };
  for (const body of bodies) {
    body.updateHover(orrery.mousePosition);
  }
});

canvas.addEventListener("mouseleave", function (event) {
  orrery.mousePosition = false;
  for (const body of bodies) {
    body.updateHover(false);
  }
});

function updateLabel(body: CelestialBody) {
  const positionLabels = {
    Mercury: document.getElementById("mercuryPosition") as HTMLParagraphElement,
    Venus: document.getElementById("venusPosition") as HTMLParagraphElement,
    Mars: document.getElementById("marsPosition") as HTMLParagraphElement,
    Jupiter: document.getElementById("jupiterPosition") as HTMLParagraphElement,
    Saturn: document.getElementById("saturnPosition") as HTMLParagraphElement,
    Sun: document.getElementById("sunPosition") as HTMLParagraphElement,
  };

  if (body.name in positionLabels) {
    positionLabels[body.name].innerText = `${Math.round(body.wsPosition)}`;
  }
}

init();
