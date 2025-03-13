const canvas = document.getElementById('particleCanvas');
const context = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];
let waves = [];
const cursor = { x: 9999, y: 9999 };
let mouseInside = false;
let mouseClicked = false;
let mouseDoubleClicked = true;
let lastClickTime = 0;
let clickThreshold = 300; // Threshold for double-click detection (in milliseconds)
let isDoubleClick = false;

// Initialize particles
const colMap = (factor) => interpolateColors('#FFFF00', '#FF0000', factor);
const radius = 5;
for (let y = radius; y < canvas.height - radius; y += 10) {
  for (let x = radius; x < canvas.width - radius; x += 10) {
    particles.push(new Particle({
      x, y, radius, baseColor: 'rgb(128, 0, 128)', colMap
    }));
  }
}

findNeighbors(particles);

const animate = () => {
    requestAnimationFrame(animate);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);

    waves.forEach(wave => {
        wave.particles.forEach(p => {
            let d = Math.sqrt((p.x - wave.x) ** 2 + (p.y - wave.y) ** 2);
            const waveRadius = wave.strength * wave.elapsedTime * 2;

            if (d < waveRadius) {
                const waveEffect = wave.strength * Math.pow(1 - d / waveRadius, 2);
                p.waveStrength += waveEffect;
            }
        });
    });

    // Separate particles into moving and stable
    let movingParticles = particles.filter(p => p.moving);
    let stableParticles = particles.filter(p => !p.moving);

    // Sort moving particles by scale (larger first)
    movingParticles.sort((a, b) => a.scale - b.scale);  // Larger moving particles on top


    // Draw stable particles second (no sorting necessary)
    stableParticles.forEach(p => {
        p.draw(context);
        p.update();
    });

    // Draw moving particles first, sorted by scale
    movingParticles.forEach(p => {
        p.draw(context);
        p.update();
    });

    // Update wave state (slower spread)
    waves.forEach(wave => {
        wave.elapsedTime += 0.005;
    });
};



function findNeighbors(particles, maxDistance = 30) {
    particles.forEach(p => {
        p.neighbors = particles.filter(other => {
            let d = Math.sqrt((other.x - p.x) ** 2 + (other.y - p.y) ** 2);
            return d > 0 && d < maxDistance;
        });
    });
    // console.log(`Neighbours: ${particles[1000].neighbors}`);
}

// Event listeners
canvas.addEventListener('mousemove', (e) => {
  cursor.x = e.clientX;
  cursor.y = e.clientY;
  mouseInside = true;
});

canvas.addEventListener('mouseleave', () => {
  mouseInside = false;
});

// Add these variables to track clicks and time between them
let clickPosition = { x: 0, y: 0 };  // To store the position of the click

// Function to handle single-click
const handleSingleClick = (x, y) => {
    console.log("Single click at", x, y);
    // Create wave with movement angle
    waves.push({ 
        x: x, 
        y: y,
        particles: [], 
        strength: 2, 
        angle: Math.random() * Math.PI * 2,
        elapsedTime: 0.0005 // Initialize the elapsed time for the wave
    });
    mouseClicked = true;
};

// Function to handle double-click
const handleDoubleClick = (x, y) => {
    console.log("Double click at", x, y);
    if (mouseDoubleClicked) {
        mouseDoubleClicked = false;
    } else {
        mouseDoubleClicked = true;
    }
};

// Mouse click event listener
canvas.addEventListener('click', (e) => {
    const currentTime = new Date().getTime();
    const clickPosition = { x: e.clientX, y: e.clientY };

    if (currentTime - lastClickTime < clickThreshold) {
        handleDoubleClick(clickPosition.x, clickPosition.y);
        isDoubleClick = true;
    } else {
        isDoubleClick = false;
        setTimeout(() => {
            if (!isDoubleClick) {
                handleSingleClick(clickPosition.x, clickPosition.y);
            }
        }, clickThreshold);
    }

    lastClickTime = currentTime;
});

animate();
