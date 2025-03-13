class Particle {
    constructor({ x, y, radius = 20, baseColor, colMap }) {
        this.x = x;
        this.y = y;
        this.ix = x;
        this.iy = y;
        this.radius = radius;
        this.scale = 20;
        this.baseColor = baseColor || fallbackColor;
        this.colMap = colMap || (() => fallbackColor);
        this.color = this.baseColor;
        this.minDist = randomRange(100, 200);
        this.pushFactor = randomRange(0.005, 0.01);
        this.pullFactor = randomRange(0.002, 0.004);
        this.dampFactor = randomRange(0.95, 0.98);
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;
        this.moving = false;
        this.influenced = false;
        this.exploding = false;
        this.waveStrength = 0;
        this.waveDecay = 0.95;
        this.wavePropagation = 0.1;
        this.neighbors = []; // Store nearby particles
    }

    update() {
        let dx = this.ix - this.x;
        let dy = this.iy - this.y;
        let dd = Math.sqrt(dx * dx + dy * dy);
        this.ax = dx * this.pullFactor;
        this.ay = dy * this.pullFactor;
        this.scale = mapRange(dd, 0, 200, 1, 5);

        const minAcceleration = 0.002;
        if (Math.abs(this.ax) < minAcceleration && Math.abs(this.ay) < minAcceleration) {
            this.moving = false;
        }

        if (this.waveStrength > 0) {
            this.radius = this.radius * (1 + this.waveStrength * 0.1);
            this.waveStrength *= this.waveDecay;
            this.neighbors.forEach(p => {
                p.waveStrength += this.waveStrength * this.wavePropagation;
            });
        }

        if (this.moving) {
            this.color = this.colMap(mapRange(dd, 0, 200, 0, 1));
        } else {
            this.color = this.baseColor;
        }

        if (mouseInside && !mouseDoubleClicked) {
            // Apply mouse interaction only when mouse is inside the canvas
            dx = this.x - cursor.x;
            dy = this.y - cursor.y;
            dd = Math.sqrt(dx * dx + dy * dy);
            let distDelta = this.minDist - dd;
            if (dd < this.minDist) {
              this.ax += (dx / dd) * distDelta * this.pushFactor;
              this.ay += (dy / dd) * distDelta * this.pushFactor;
              this.moving = true;  // Start moving and change color
              this.influenced = true; // Mark as influenced by the mouse
            }
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
        const sides = 5;
        for (let i = 0; i < sides; i++) {
            const angle = (i * Math.PI * 2) / sides;
            const x = Math.cos(angle) * this.radius * this.scale;
            const y = Math.sin(angle) * this.radius * this.scale;
            if (i === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
        }
        context.closePath();
        context.fill();
        context.restore();
    }
}

function findNeighbors(particles, maxDistance = 50) {
    particles.forEach(p => {
        p.neighbors = particles.filter(other => {
            let d = Math.sqrt((other.x - p.x) ** 2 + (other.y - p.y) ** 2);
            return d > 0 && d < maxDistance;
        });
    });
}
