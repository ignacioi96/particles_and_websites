class Particle {
    constructor({ x, y, radius = 20, baseColor, colMap }) {
        this.x = x;
        this.y = y;
        this.ix = x;
        this.iy = y;
        this.radius = radius;
        this.iradius = radius;
        this.scale = 20;
        this.iscale = 20;
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
        this.neighbourDistance = 20;
        this.rippling = 0;
        this.rippleTime = 7;
        this.rippleDecay = 0.5;
        this.neighbors = [];
        this.passedToNeighbors = false;
    }

    isAtEdge() {
        return this.neighbors.length < 4; // If fewer than 3 neighbors, it's likely near an edge
    }

    update() {
        let dx = this.ix - this.x;
        let dy = this.iy - this.y;
        let dd = Math.sqrt(dx * dx + dy * dy);
        this.ax = dx * this.pullFactor;
        this.ay = dy * this.pullFactor;
        this.scale = mapRange(dd, 0, 200, 1, 5);

        const minAcceleration = 0.002;
        if (Math.abs(this.vx) < minAcceleration && Math.abs(this.vy) < minAcceleration) {
            this.moving = false;
        }

        if (this.rippling) {
            if (!this.passedToNeighbors) {
                this.neighbors.forEach(p => {
                    let delayFactor = Math.sqrt((this.x - p.x) ** 2 + (this.y - p.y) ** 2) / 50;

                    setTimeout(() => {
                        if (!p.rippling && !this.isAtEdge()) {  // Stop ripple if at edge
                            p.rippling = true;
                            p.rippleTime = this.rippleTime + this.rippleDecay / 2;
                            p.passedToNeighbors = false;
                        }
                    }, delayFactor * 50);
                });
                this.passedToNeighbors = true;
            }

            this.radius += 2 * (Math.sin(this.rippleTime / Math.PI));
            this.rippleTime += this.rippleDecay;

            if (this.rippleTime > 7) {
                this.rippleTime = 7;
                this.rippling = false;
                this.passedToNeighbors = false;
                this.radius = this.iradius;
                this.color = 200;
            }
        }

        if (this.moving) {
            this.color = this.colMap(mapRange(dd, 0, 200, 0, 1));
        } else if (this.radius !== this.iradius ) {
            this.color = this.colMap(mapRange(this.rippleTime, 0, 7, 0, 1));  
        } else {
            this.color = this.baseColor;
        }

        if (mouseInside && mouseCreatesInfluence) {
            dx = this.x - cursor.x;
            dy = this.y - cursor.y;
            dd = Math.sqrt(dx * dx + dy * dy);
            let distDelta = this.minDist - dd;
            if (dd < this.minDist) {
                this.ax += (dx / dd) * distDelta * this.pushFactor;
                this.ay += (dy / dd) * distDelta * this.pushFactor;
                this.moving = true;
                this.influenced = true;
            }
        }

        if (mouseClicked && !this.rippling) { 
            let dx = this.x - cursor.x;
            let dy = this.y - cursor.y;
            let ddSquared = dx * dx + dy * dy;
            if (ddSquared < this.neighbourDistance * this.neighbourDistance) { 
                this.rippling = true;
                this.rippleTime = 0; // Reset to avoid timing issues
                this.moving = true;
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
