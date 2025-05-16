// Settings object
const settings = {
    particleCount: 5,
    initialParticleCount: 1,
    particleSpeed: 1,
    trailLength: 0.1,
    gravity: 0,
    colorMode: 'random',
    backgroundMode: 'gradient',
    presets: {}
};

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 2;
        this.speedX = (Math.random() * 2 - 1) * settings.particleSpeed;
        this.speedY = (Math.random() * 2 - 1) * settings.particleSpeed;
        this.color = this.getInitialColor();
        this.shape = 'circle';
        this.originalSize = this.size;
        this.energy = Math.random() * 100;
        this.charge = Math.random() > 0.5 ? 1 : -1;
        this.isExcited = false;
        this.hue = Math.random() * 360;
    }

    getInitialColor() {
        switch(settings.colorMode) {
            case 'random':
                return `hsl(${Math.random() * 360}, 100%, 50%)`;
            case 'energy':
                return `hsl(${this.energy * 2}, 100%, 50%)`;
            case 'speed':
                const speed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
                return `hsl(${speed * 50}, 100%, 50%)`;
            case 'rainbow':
                return `hsl(${this.hue}, 100%, 50%)`;
            default:
                return `hsl(${Math.random() * 360}, 100%, 50%)`;
        }
    }

    update(mouseX, mouseY, particles, isNuclearMode) {
        // Apply gravity
        this.speedY += settings.gravity;

        // Update position
        this.x += this.speedX;
        this.y += this.speedY;

        // Bounce off edges with energy loss in nuclear mode
        if (this.x < 0 || this.x > canvas.width) {
            this.speedX *= -1;
            if (isNuclearMode) this.energy *= 0.95;
        }
        if (this.y < 0 || this.y > canvas.height) {
            this.speedY *= -1;
            if (isNuclearMode) this.energy *= 0.95;
        }

        if (isNuclearMode) {
            this.updateNuclear(particles);
        } else {
            this.updateNormal(mouseX, mouseY);
        }

        // Update color based on mode
        this.updateColor();

        // Decay excited state
        if (this.isExcited) {
            this.energy -= 0.5;
            if (this.energy <= 0) {
                this.isExcited = false;
                this.energy = 0;
            }
        }
    }

    updateColor() {
        switch(settings.colorMode) {
            case 'energy':
                this.color = `hsl(${this.energy * 2}, 100%, 50%)`;
                break;
            case 'speed':
                const speed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
                this.color = `hsl(${speed * 50}, 100%, 50%)`;
                break;
            case 'rainbow':
                this.hue = (this.hue + 1) % 360;
                this.color = `hsl(${this.hue}, 100%, 50%)`;
                break;
        }
    }

    updateNuclear(particles) {
        // Check for collisions with other particles
        particles.forEach(particle => {
            if (particle === this) return;

            const dx = particle.x - this.x;
            const dy = particle.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.size + particle.size) {
                // Collision detected
                this.handleCollision(particle);
            }

            // Attract/repel based on charge
            if (distance < 100) {
                const force = (this.charge * particle.charge) / (distance * distance);
                this.speedX -= (dx / distance) * force * 0.1;
                this.speedY -= (dy / distance) * force * 0.1;
            }
        });

        // Update size based on energy
        this.size = this.originalSize * (1 + this.energy / 200);
        
        // Update color based on energy
        const hue = (this.energy * 2) % 360;
        this.color = `hsl(${hue}, 100%, 50%)`;
    }

    updateNormal(mouseX, mouseY) {
        // Mouse interaction
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
            this.size = this.originalSize * 2;
            this.x -= dx * 0.03;
            this.y -= dy * 0.03;
        } else {
            this.size = this.originalSize;
        }
    }

    handleCollision(otherParticle) {
        // Energy transfer
        const totalEnergy = this.energy + otherParticle.energy;
        this.energy = totalEnergy * 0.5;
        otherParticle.energy = totalEnergy * 0.5;

        // Chance of excitation
        if (Math.random() < 0.3) {
            this.isExcited = true;
            this.energy += 50;
        }
        if (Math.random() < 0.3) {
            otherParticle.isExcited = true;
            otherParticle.energy += 50;
        }

        // Elastic collision
        const tempSpeedX = this.speedX;
        const tempSpeedY = this.speedY;
        this.speedX = otherParticle.speedX;
        this.speedY = otherParticle.speedY;
        otherParticle.speedX = tempSpeedX;
        otherParticle.speedY = tempSpeedY;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        
        if (this.isExcited) {
            // Draw excited state with glow effect
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
        } else {
            ctx.shadowBlur = 0;
        }
        
        switch(this.shape) {
            case 'circle':
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                break;
            case 'square':
                ctx.rect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
                break;
            case 'triangle':
                ctx.moveTo(this.x, this.y - this.size);
                ctx.lineTo(this.x + this.size, this.y + this.size);
                ctx.lineTo(this.x - this.size, this.y + this.size);
                break;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Canvas setup
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let mouseX = 0;
let mouseY = 0;
let currentShape = 'circle';
let frameCount = 0;
let lastTime = performance.now();
let fps = 0;
let isNuclearMode = false;
let totalEnergy = 0;

// UI Elements
const settingsPanel = document.getElementById('settingsPanel');
const infoPanel = document.getElementById('infoPanel');
const settingsToggle = document.getElementById('settingsToggle');
const closeInfo = document.getElementById('closeInfo');

// Settings controls
const particleCountSlider = document.getElementById('particleCountSlider');
const initialParticleSlider = document.getElementById('initialParticleSlider');
const speedSlider = document.getElementById('speedSlider');
const trailSlider = document.getElementById('trailSlider');
const gravitySlider = document.getElementById('gravitySlider');
const colorMode = document.getElementById('colorMode');
const backgroundMode = document.getElementById('backgroundMode');
const savePreset = document.getElementById('savePreset');
const loadPreset = document.getElementById('loadPreset');

// Initialize settings
function initializeSettings() {
    particleCountSlider.value = settings.particleCount;
    initialParticleSlider.value = settings.initialParticleCount;
    speedSlider.value = settings.particleSpeed;
    trailSlider.value = settings.trailLength;
    gravitySlider.value = settings.gravity;
    colorMode.value = settings.colorMode;
    backgroundMode.value = settings.backgroundMode;
}

// Update settings
function updateSettings() {
    settings.particleCount = parseInt(particleCountSlider.value);
    settings.initialParticleCount = parseInt(initialParticleSlider.value);
    settings.particleSpeed = parseFloat(speedSlider.value);
    settings.trailLength = parseFloat(trailSlider.value);
    settings.gravity = parseFloat(gravitySlider.value);
    settings.colorMode = colorMode.value;
    settings.backgroundMode = backgroundMode.value;

    // Update display values
    document.getElementById('particleCountValue').textContent = settings.particleCount;
    document.getElementById('initialParticleValue').textContent = settings.initialParticleCount;
    document.getElementById('speedValue').textContent = settings.particleSpeed.toFixed(1);
    document.getElementById('trailValue').textContent = settings.trailLength.toFixed(2);
    document.getElementById('gravityValue').textContent = settings.gravity.toFixed(1);

    // Reinitialize particles if initial count changed
    if (particles.length !== settings.initialParticleCount) {
        initParticles();
    }

    // Update background
    updateBackground();
}

// Update background based on mode
function updateBackground() {
    const body = document.body;
    switch(settings.backgroundMode) {
        case 'gradient':
            body.style.background = 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)';
            break;
        case 'dark':
            body.style.background = '#000000';
            break;
        case 'light':
            body.style.background = '#ffffff';
            break;
        case 'custom':
            body.style.background = 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)';
            break;
    }
}

// Save current settings as preset
function saveCurrentPreset() {
    const presetName = prompt('Enter a name for this preset:');
    if (presetName) {
        settings.presets[presetName] = { ...settings };
        localStorage.setItem('particlePresets', JSON.stringify(settings.presets));
    }
}

// Load a saved preset
function loadPresetSettings() {
    const presets = JSON.parse(localStorage.getItem('particlePresets') || '{}');
    const presetNames = Object.keys(presets);
    
    if (presetNames.length === 0) {
        alert('No saved presets found!');
        return;
    }

    const presetName = prompt(`Enter preset name to load (${presetNames.join(', ')}):`);
    if (presetName && presets[presetName]) {
        Object.assign(settings, presets[presetName]);
        initializeSettings();
        updateSettings();
    }
}

// Event Listeners
settingsToggle.addEventListener('click', () => {
    settingsPanel.classList.toggle('active');
});

// Close settings panel when clicking outside
document.addEventListener('click', (e) => {
    if (settingsPanel.classList.contains('active') && 
        !settingsPanel.contains(e.target) && 
        !settingsToggle.contains(e.target)) {
        settingsPanel.classList.remove('active');
    }
});

// Close settings panel when pressing Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsPanel.classList.contains('active')) {
        settingsPanel.classList.remove('active');
    }
});

closeInfo.addEventListener('click', () => {
    infoPanel.style.display = 'none';
});

// Settings change listeners
particleCountSlider.addEventListener('input', updateSettings);
initialParticleSlider.addEventListener('input', updateSettings);
speedSlider.addEventListener('input', updateSettings);
trailSlider.addEventListener('input', updateSettings);
gravitySlider.addEventListener('input', updateSettings);
colorMode.addEventListener('change', updateSettings);
backgroundMode.addEventListener('change', updateSettings);

savePreset.addEventListener('click', saveCurrentPreset);
loadPreset.addEventListener('click', loadPresetSettings);

// Resize canvas to window size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Initialize particles
function initParticles() {
    particles = [];
    // Create particles based on the initial particle count setting
    for (let i = 0; i < settings.initialParticleCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particles.push(new Particle(x, y));
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Clear canvas with slight trail effect
    ctx.fillStyle = isNuclearMode ? 'rgba(15, 12, 41, 0.2)' : 'rgba(15, 12, 41, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    totalEnergy = 0;
    particles.forEach(particle => {
        particle.update(mouseX, mouseY, particles, isNuclearMode);
        particle.draw(ctx);
        totalEnergy += particle.energy;
    });

    // Update stats
    frameCount++;
    const currentTime = performance.now();
    if (currentTime - lastTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
        document.getElementById('fps').textContent = `FPS: ${fps}`;
        document.getElementById('particleCount').textContent = `Particles: ${particles.length}`;
        document.getElementById('energy').textContent = `Energy: ${Math.round(totalEnergy)}`;
    }
}

// Event listeners
window.addEventListener('resize', () => {
    resizeCanvas();
    initParticles();
});

window.addEventListener('mousemove', (e) => {
    mouseX = e.x;
    mouseY = e.y;
});

window.addEventListener('click', (e) => {
    // Don't create particles if clicking on info panel, settings panel, or their buttons
    if (infoPanel.contains(e.target) || 
        settingsPanel.contains(e.target) || 
        e.target.id === 'resetButton' || 
        e.target.id === 'settingsToggle' ||
        e.target.closest('#resetButton') || 
        e.target.closest('#settingsToggle')) {
        return;
    }

    if (isNuclearMode) {
        // Create high-energy particle on click in nuclear mode
        const particle = new Particle(e.x, e.y);
        particle.energy = 200;
        particle.isExcited = true;
        particle.speedX = (Math.random() - 0.5) * 8;
        particle.speedY = (Math.random() - 0.5) * 8;
        particles.push(particle);
    } else {
        // Create particles based on the particle count setting
        for (let i = 0; i < settings.particleCount; i++) {
            const particle = new Particle(e.x, e.y);
            particle.speedX = (Math.random() - 0.5) * 8;
            particle.speedY = (Math.random() - 0.5) * 8;
            particles.push(particle);
        }
    }
});

// Shape toggle
const shapeToggle = document.getElementById('shapeToggle');
if (shapeToggle) {
    shapeToggle.addEventListener('click', () => {
        const shapes = ['circle', 'square', 'triangle'];
        const currentIndex = shapes.indexOf(currentShape);
        currentShape = shapes[(currentIndex + 1) % shapes.length];
        particles.forEach(particle => particle.shape = currentShape);
    });
}

// Nuclear mode toggle
const nuclearToggle = document.getElementById('nuclearToggle');
if (nuclearToggle) {
    nuclearToggle.addEventListener('click', () => {
        isNuclearMode = !isNuclearMode;
        nuclearToggle.classList.toggle('active');
        if (isNuclearMode) {
            // Initialize particles with more energy in nuclear mode
            particles.forEach(particle => {
                particle.energy = Math.random() * 100;
                particle.charge = Math.random() > 0.5 ? 1 : -1;
            });
        }
    });
}

// Reset button
const resetButton = document.getElementById('resetButton');
if (resetButton) {
    resetButton.addEventListener('click', () => {
        // Clear all particles
        particles = [];
        // Create a new single particle in the center
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        particles.push(new Particle(centerX, centerY));
        // Reset nuclear mode if active
        if (isNuclearMode) {
            isNuclearMode = false;
            nuclearToggle.classList.remove('active');
        }
    });
}

// Initialize
initializeSettings();
updateSettings();
resizeCanvas();
initParticles();
animate(); 