const canvas = document.getElementById('particleCanvas');
const context = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];
let waves = [];
const cursor = { x: 9999, y: 9999 };
let mouseInside = false;
let mouseClicked = false;
let mouseDoubleClicked = false;
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

const animate = () => {
    requestAnimationFrame(animate);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);
  
    // **Sort particles by radius before drawing**
    particles.sort((a, b) => a.scale - b.scale);

    // particles.forEach(p => {
    // })

    particles.forEach(p => {
        p.waveStrength = 0;
        waves.forEach(wave => {
            let d = Math.sqrt((p.x - wave.x) ** 2 + (p.y - wave.y) ** 2);
            if (d < 100) {
                p.waveStrength += wave.strength * (1 - d / 100);
            }
        });

        p.draw(context);
        p.update();
    });


        
    // for (const particle of particles) {
    //   particle.draw(context);
    //   particle.update();
    // }
  };
  
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
// Function to handle single-click: Spread particles out
const handleSingleClick = (x, y) => {
    console.log("Single click at", x, y);
    waves.push({ x: x, y: y, strength: 1 });
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
    // Add your double-click effect logic here (e.g., particles pulsating or changing color)
};

// Mouse click event listener
canvas.addEventListener('click', (e) => {
    const currentTime = new Date().getTime();
    const clickPosition = { x: e.clientX, y: e.clientY };

    // Check if the time between the current and the last click is below the threshold for a double-click
    if (currentTime - lastClickTime < clickThreshold) {
        // If a double-click is detected, handle it and mark it
        handleDoubleClick(clickPosition.x, clickPosition.y);
        isDoubleClick = true;
    } else {
        // If not a double-click, mark it as a single-click
        isDoubleClick = false;
        setTimeout(() => {
            if (!isDoubleClick) {
                handleSingleClick(clickPosition.x, clickPosition.y);
            }
        }, clickThreshold);
    }

    // Update the last click time
    lastClickTime = currentTime;
});

animate();
