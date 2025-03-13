const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
const interpolate = require('color-interpolate');

const settings = {
  animate: true,
  dimensions: [800, 600]
};

const particles = [];
const cursor = { x: 9999, y: 9999 };
let mouseInside = true;

let imgA, imgB, imgC, imgD;

// Load image
const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(`Failed to load image: ${url}`);
    img.src = url;
  });
};

// Particle Class
class Particle {
  constructor({ x, y, radius = 100, colMap }) {
    this.x = x;
    this.y = y;
    this.ix = x;
    this.iy = y;
    this.radius = radius;
    this.scale = 1;
    this.colMap = colMap;
    this.color = colMap(0);  // Initial color
    this.minDist = random.range(100, 200);
    this.pushFactor = random.range(0.01, 0.02);
    this.pullFactor = random.range(0.002, 0.006);
    this.dampFactor = random.range(0.90, 0.95);
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
  }

  update() {
    if (!mouseInside) {
      this.reset(); // Reset particles when the mouse is outside
    }

    let dx = this.ix - this.x;
    let dy = this.iy - this.y;
    let dd = Math.sqrt(dx * dx + dy * dy);
    this.ax = dx * this.pullFactor;
    this.ay = dy * this.pullFactor;
    this.scale = math.mapRange(dd, 0, 200, 1, 5);
    // this.color = this.colMap(math.mapRange(dd, 0, 200, 0, 1, true));  // Update color based on distance
    const colMap = interpolate(['#FFFF00', '#FF7F00', '#FF0000']);  // From yellow -> orange -> red

    // this.color = 'rgb(255, 0, 0)';  // Set color to red

    // Interaction with cursor
    dx = this.x - cursor.x;
    dy = this.y - cursor.y;
    dd = Math.sqrt(dx * dx + dy * dy);
    let distDelta = this.minDist - dd;
    if (dd < this.minDist) {
      this.ax += (dx / dd) * distDelta * this.pushFactor;
      this.ay += (dy / dd) * distDelta * this.pushFactor;
    }

    this.vx += this.ax;
    this.vy += this.ay;
    this.vx *= this.dampFactor;
    this.vy *= this.dampFactor;
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(context) {
    context.save();
    context.translate(this.x, this.y);
    context.fillStyle = this.color;
    context.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5; // Divide circle into 5 parts
      const x = this.radius * this.scale * Math.cos(angle);
      const y = this.radius * this.scale * Math.sin(angle);
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.fill();
    context.restore();
  }
  
  

  reset() {
    this.x = this.ix;
    this.y = this.iy;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
    this.scale = 1;
    this.color = this.colMap(0);  // Reset color
  }
}

// Sketch function
const sketch = ({ context, width, height }) => {
  if (!imgA) {
    console.error("Images not loaded");
    return;
  }

  // Define number of columns and calculate column width
  const numColumns = 1;
  const columnWidth = width / numColumns;

  // Create canvas for each image
  const imgCanvases = [imgA].map(img => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = columnWidth;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { canvas, ctx };
  });

  const colMap = interpolate(['#FFFF00', '#FF7F00', '#FF0000']);  // From yellow -> orange -> red

  // Generate particles from image data
  imgCanvases.forEach(({ canvas, ctx }, index) => {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const spacing = 7;
    const offsetX = index * columnWidth;

    for (let y = 0; y < canvas.height; y += spacing) {
      for (let x = 0; x < canvas.width; x += spacing) {
        const idx = (y * canvas.width + x) * 4;
        const r = imgData[idx + 0];
        const g = imgData[idx + 1];
        const b = imgData[idx + 2];
        const brightness = (r + g + b) / 3;

        // Only create particles for bright enough pixels
        if (brightness > 30) {
          particles.push(new Particle({
            x: offsetX + x,
            y: y,
            radius: 2,
            colMap: interpolate([`rgb(${r}, ${g}, ${b})`, `rgb(${255 - r}, ${255 - g}, ${255 - b})`])
          }));
        }
      }
    }
  });

  return ({ context, width, height }) => {
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

    // Update and draw particles
    for (const particle of particles) {
      particle.update();
      particle.draw(context);
    }
  };
};

// Load images and start sketch
const start = async () => {
  try {
    imgA = await loadImage('images/bg7.png');
    // imgB = await loadImage('images/bg2.png');
    // imgC = await loadImage('images/bg3.png');
    // imgD = await loadImage('images/bg4.png');

    console.log("Images loaded successfully");

    canvasSketch(sketch, settings);
  } catch (err) {
    console.error("Error loading images", err);
  }
};

start();

const borderPadding = 100; // Set the threshold distance from the border
const onPointerMove = (e) => {
    const x = e.clientX || e.touches[0].clientX;
    const y = e.clientY || e.touches[0].clientY;
  
    if (x > borderPadding && x < settings.dimensions[0] - borderPadding &&
        y > borderPadding && y < settings.dimensions[1] - borderPadding) {
      cursor.x = x;
      cursor.y = y;
    } else {
        cursor.x = -1000;
      cursor.y = -1000;
    }
  };
  
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerleave', onMouseLeave);
  