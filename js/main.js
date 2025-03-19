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
const clickThreshold = 300;
let clickTimeout = null;

// Btn
const btnWidth = 100;
const btnHeight = 40;
const btnX = (canvas.width - btnWidth) / 2;
const btnY = (canvas.height - btnHeight) / 2;

// Set up image and its loading behavior
const img = new Image();
img.src = 'images/bg5.png'; // Replace with your image path
let imgLoaded = false;
let imgCache = null; // Cache for the image (offscreen canvas)

// Map color based on image pixel
const colMap = (factor) => interpolateColors('#FFFF00', '#FF0000', factor);
const radius = 7;

let btnsTextColor = 'black';

// Function to create particles
const createParticles = () => {
    const pixelData = imgCache.getImageData(0, 0, canvas.width, canvas.height).data;

    // Store average color values in an array instead of recalculating them dynamically
    const colors = [];

    for (let y = radius; y < canvas.height - radius; y += 10) {
        for (let x = radius; x < canvas.width - radius; x += 10) {
            let r = 0, g = 0, b = 0, count = 0;
            
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    let px = x + dx;
                    let py = y + dy;

                    if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
                        let i = (py * canvas.width + px) * 4;
                        r += pixelData[i];
                        g += pixelData[i + 1];
                        b += pixelData[i + 2];
                        count++;
                    }
                }
            }
            
            const color = `rgb(${Math.floor(r / count)},${Math.floor(g / count)},${Math.floor(b / count)})`;
            colors.push({ x, y, color });
        }
    }

    particles.length = 0; // Clear particles before re-adding
    colors.forEach(({ x, y, color }) => {
        particles.push(new Particle({ x, y, radius, baseColor: color, colMap }));
    });

    findNeighbors(particles);
};



// Image onload event to set the image as background and cache it
img.onload = () => {
    imgLoaded = true;
    // Create an offscreen canvas to cache the image
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
    const offscreenContext = offscreenCanvas.getContext('2d');
    offscreenContext.drawImage(img,(canvas.width - img.width) / 2, (canvas.height - img.height) / 2, img.width, img.height);
    imgCache = offscreenContext; // Store the cached context

    createParticles(); // Initialize particles after image is loaded
    imgCache = null;
    animate(); // Start animation after the image is loaded
};

const drawButton = () => {
    context.fillStyle = "black"; // "rgba(255, 255, 255, 0.8)";
    context.fillRect(btnX, btnY, btnWidth, btnHeight); // x, y, width, height
    context.fillStyle = btnsTextColor;
    context.font = "20px Arial";
    context.textAlign = "center";
    context.fillText("click me", btnX + btnWidth / 2, btnY + 10);
};

// Animate the particles
const animate = () => {
    const startTime = performance.now();

    requestAnimationFrame(animate);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawButton();

    let movingParticles = particles.filter(p => p.moving);
    let stableParticles = particles.filter(p => !p.moving);

    movingParticles.sort((a, b) => a.scale - b.scale);

    stableParticles.forEach(p => {
        p.draw(context);
        p.update();
    });

    movingParticles.forEach(p => {
        p.draw(context);
        p.update();
    });

    const endTime = performance.now();
    const deltaTime = endTime - startTime;
    // if (deltaTime > 16) {
    //     console.warn(`Frame took ${deltaTime}ms, which is more than 16ms`);
    // }

    drewAllParticlesOnce = true;
};

// Handle single click behavior (trigger ripples)
const handleSingleClick = (x, y) => {
    console.log("Single click at", x, y);

    // particles.forEach(p => {
    //     let dx = p.x - x;
    //     let dy = p.y - y;
    //     let distanceSquared = dx * dx + dy * dy;
        
    //     // Trigger ripple if the click is within a certain range of the particle
    //     if (distanceSquared < p.neighbourDistance * p.neighbourDistance) {
    //         p.rippling = true;
    //         p.rippleTime = 0; // Start ripple effect immediately
    //     }
    // });

    if (x > btnX && x < btnX + btnWidth && y > btnY && y < btnY + btnHeight) {
        console.log("Button clicked! Redirecting...");
        window.location.href = "kyra.html";
    }
};

// Function to find neighbors of the particles based on distance
function findNeighbors(particles, maxDistance = 20) {
    particles.forEach(p => {
        p.neighbors = particles.filter(other => {
            let d = Math.sqrt((other.x - p.x) ** 2 + (other.y - p.y) ** 2);
            return d > 0 && d < maxDistance;
        });
    });
}

let isTouch = false;
let touchMoved = false; // Flag to track touch move

// Handle double click behavior (trigger ripples)
const handleDoubleClick = (x, y) => {
    console.log("Double click at", x, y);
    mouseDoubleClicked = !mouseDoubleClicked;
};

// Handle pointer down event
canvas.addEventListener('pointerdown', (e) => {
    updateCursor(e.clientX, e.clientY);
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();

    isTouch = e.pointerType === 'touch';
    touchMoved = false;

    const currentTime = new Date().getTime();
    const isDoubleClick = currentTime - lastClickTime < clickThreshold;
    lastClickTime = currentTime;

    if (isDoubleClick) {
        clearTimeout(clickTimeout);  // Cancel pending single-click timeout
        handleDoubleClick(e.clientX, e.clientY);
    } else {
        handleSingleClick(e.clientX, e.clientY); // Trigger single-click behavior

        clickTimeout = setTimeout(() => {
            // Trigger single click if not double-clicked
        }, clickThreshold);
    }
});

// Unified function to update cursor position
const updateCursor = (x, y) => {
    cursor.x = x;
    cursor.y = y;
    mouseInside = true;
};

// Handle pointer move (unifies mousemove and touchmove)
const moveHandler = (x, y) => {
    updateCursor(x, y);
    if (isTouch) {
        touchMoved = true; // Mark that a touch move happened
    }
};

// Handle pointer events
canvas.addEventListener('pointermove', (e) => {
    moveHandler(e.clientX, e.clientY);

    if (mouseDoubleClicked || ((e.clientX - (btnX + btnWidth / 2) ) ** 2 + (e.clientY - (btnY + btnHeight / 2) ) ** 2 > 100 ** 2)) {
        btnsTextColor = 'black';
    } else {
        btnsTextColor = 'white';
    }
});

canvas.addEventListener('pointerup', (e) => {
    canvas.releasePointerCapture(e.pointerId);

    if (e.pointerType === 'touch') {
        setTimeout(() => {
            mouseInside = false;
            btnsTextColor = 'black';

        }, 100);  // Slight delay to prevent premature deactivation
    }
});

canvas.addEventListener('mouseleave', () => {
    mouseInside = false;
    btnsTextColor = 'black';

});

animate();  // Start animation
