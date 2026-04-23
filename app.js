const aiStyles = [
  {
    "id": "original",
    "name": "Original",
    "emoji": "📸",
    "loadingMsg": "Restaurando...",
    "mockFilter": "none",
    "prompt": ""
  },
  {
    "id": "anime",
    "name": "Anime",
    "emoji": "🌸",
    "loadingMsg": "Viajando a Tokyo...",
    "mockFilter": "contrast(1.2) saturate(1.5) brightness(1.1)",
    "prompt": "Anime style illustration, Studio Ghibli, highly detailed, beautiful colors, masterpiece"
  },
  {
    "id": "lego",
    "name": "Lego",
    "emoji": "🧱",
    "loadingMsg": "Ensamblando bloques...",
    "mockFilter": "contrast(1.5) saturate(2.0)", // We will also pixelate this in canvas
    "prompt": "Made entirely of Lego bricks, plastic texture, bright colors, 3d render"
  },
  {
    "id": "simpsons",
    "name": "Simpsons",
    "emoji": "🍩",
    "loadingMsg": "Viajando a Springfield...",
    "mockFilter": "sepia(0.8) hue-rotate(20deg) saturate(2.5) contrast(1.2)",
    "prompt": "In the style of The Simpsons, yellow skin, cartoon, 2d animation, flat colors"
  },
  {
    "id": "dungeons",
    "name": "Dungeons & Castles",
    "emoji": "🐉",
    "loadingMsg": "Lanzando los dados...",
    "mockFilter": "contrast(1.5) brightness(0.6) sepia(0.5) hue-rotate(-20deg)",
    "prompt": "Dark fantasy, dungeons and dragons art style, cinematic lighting, epic, highly detailed oil painting"
  },
  {
    "id": "rugrats",
    "name": "Rugrats",
    "emoji": "🍼",
    "loadingMsg": "Buscando a Reptar...",
    "mockFilter": "contrast(0.9) saturate(1.8) brightness(1.2) hue-rotate(-10deg)",
    "prompt": "90s nickelodeon cartoon style, rugrats style, wacky perspectives, pastel colors, 2d"
  },
  {
    "id": "pokemon",
    "name": "Pokemon",
    "emoji": "⚡",
    "loadingMsg": "Atrápalos ya...",
    "mockFilter": "contrast(1.3) saturate(1.7) brightness(1.1)",
    "prompt": "Pokemon anime style, vibrant, creature design, cel shaded, official art style"
  },
  {
    "id": "cyberpunk",
    "name": "Cyberpunk",
    "emoji": "🤖",
    "loadingMsg": "Hackeando la red...",
    "mockFilter": "contrast(1.6) brightness(0.9) saturate(2.2) sepia(0.6) hue-rotate(280deg)",
    "prompt": "Cyberpunk 2077 style, neon lights, futuristic city, highly detailed digital art"
  }
];

// DOM Elements
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const editorArea = document.getElementById('editor-area');
const photoCanvas = document.getElementById('photo-canvas');
const ctx = photoCanvas.getContext('2d', { willReadFrequently: true });
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const presetCarousel = document.getElementById('preset-carousel');
const btnRemix = document.getElementById('btn-remix');
const btnDownload = document.getElementById('btn-download');
const btnReset = document.getElementById('btn-reset');

let currentImage = null;
let currentStyle = aiStyles[0];
let originalImageSrc = null;

// Initialize ColorThief
const colorThief = new ColorThief();

// --- Initialization ---
function init() {
  renderCarousel();
  setupEventListeners();
}

// --- Event Listeners ---
function setupEventListeners() {
  uploadArea.addEventListener('click', () => fileInput.click());
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleFileUpload(e.target.files[0]);
    }
  });

  btnReset.addEventListener('click', resetApp);
  
  btnRemix.addEventListener('click', () => {
    // Select random style (excluding original)
    const randomIdx = Math.floor(Math.random() * (aiStyles.length - 1)) + 1;
    applyStyle(aiStyles[randomIdx]);
    
    const cards = document.querySelectorAll('.preset-card');
    if(cards[randomIdx]) {
      cards[randomIdx].scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }
  });

  btnDownload.addEventListener('click', downloadImage);
}

// --- File Handling ---
function handleFileUpload(file) {
  if (!file.type.startsWith('image/')) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      originalImageSrc = e.target.result;
      
      uploadArea.classList.add('hidden');
      editorArea.classList.remove('hidden');
      
      updateDynamicBackground(img);
      
      // Draw initial image (Original)
      applyStyle(aiStyles[0]);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function updateDynamicBackground(img) {
  if (img.complete) {
    extractAndApplyColors(img);
  } else {
    img.addEventListener('load', function() {
      extractAndApplyColors(img);
    });
  }
}

function extractAndApplyColors(img) {
  try {
    const palette = colorThief.getPalette(img, 2);
    if (palette && palette.length >= 2) {
      const color1 = `rgba(${palette[0][0]}, ${palette[0][1]}, ${palette[0][2]}, 0.8)`;
      const color2 = `rgba(${palette[1][0]}, ${palette[1][1]}, ${palette[1][2]}, 0.8)`;
      document.documentElement.style.setProperty('--dynamic-color-1', color1);
      document.documentElement.style.setProperty('--dynamic-color-2', color2);
    }
  } catch (err) {
    console.error("ColorThief extraction failed", err);
  }
}

// --- Rendering ---
function renderCarousel() {
  presetCarousel.innerHTML = '';
  
  aiStyles.forEach((style) => {
    const card = document.createElement('div');
    card.className = `preset-card ${style.id === currentStyle.id ? 'active' : ''}`;
    // Using emoji instead of color preview for AI styles
    card.innerHTML = `
      <div class="preset-color-preview" style="background: transparent; font-size: 24px; display:flex; align-items:center; justify-content:center;">${style.emoji}</div>
      <div class="preset-name">${style.name}</div>
    `;
    
    card.addEventListener('click', () => {
      applyStyle(style);
    });
    
    presetCarousel.appendChild(card);
  });
}

// --- AI Generation Simulation ---

// This function simulates sending the image to an AI API (like Replicate or OpenAI)
// and receiving a transformed image back.
async function generateAIImage(image, style) {
  return new Promise((resolve) => {
    // TODO: REPLACE THIS BLOCK WITH REAL API CALL WHEN API KEY IS AVAILABLE
    /*
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token YOUR_API_KEY`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: "stable-diffusion-img2img-model-version",
          input: { image: imageBase64, prompt: style.prompt }
        })
      });
      const data = await response.json();
      // polling logic...
      resolve(data.output);
    */

    // MOCK IMPLEMENTATION FOR PROTOTYPE:
    // We use Canvas to simulate a complex transformation while waiting 2.5 seconds
    setTimeout(() => {
      const offscreenCanvas = document.createElement('canvas');
      const offCtx = offscreenCanvas.getContext('2d');
      offscreenCanvas.width = image.width;
      offscreenCanvas.height = image.height;
      
      offCtx.filter = style.mockFilter;
      
      // If it's lego, pixelate it!
      if (style.id === 'lego') {
        const pixelSize = 10;
        const w = image.width / pixelSize;
        const h = image.height / pixelSize;
        offCtx.drawImage(image, 0, 0, w, h);
        offCtx.imageSmoothingEnabled = false;
        offCtx.drawImage(offscreenCanvas, 0, 0, w, h, 0, 0, image.width, image.height);
      } else {
        offCtx.drawImage(image, 0, 0, image.width, image.height);
      }
      
      const newImg = new Image();
      newImg.onload = () => resolve(newImg);
      newImg.src = offscreenCanvas.toDataURL();
    }, 2500); // Simulate network delay
  });
}

async function applyStyle(style) {
  if (!currentImage) return;
  if (style.id === currentStyle.id && style.id !== 'original') return;

  currentStyle = style;
  
  document.querySelectorAll('.preset-card').forEach((card, idx) => {
    if (aiStyles[idx].id === style.id) card.classList.add('active');
    else card.classList.remove('active');
  });

  loadingText.innerText = style.loadingMsg;
  loadingOverlay.classList.remove('hidden');
  
  try {
    let resultImage;
    if (style.id === 'original') {
      resultImage = currentImage;
    } else {
      // Call the AI!
      resultImage = await generateAIImage(currentImage, style);
    }
    
    const maxDimension = 2000;
    let width = resultImage.width;
    let height = resultImage.height;
    
    if (width > maxDimension || height > maxDimension) {
      const ratio = Math.min(maxDimension / width, maxDimension / height);
      width = width * ratio;
      height = height * ratio;
    }
    
    photoCanvas.width = width;
    photoCanvas.height = height;
    ctx.filter = 'none'; // We apply no further filters to the AI output
    ctx.drawImage(resultImage, 0, 0, width, height);
    
  } catch (e) {
    console.error("AI Generation failed:", e);
    alert("Hubo un error al generar la imagen AI.");
  } finally {
    loadingOverlay.classList.add('hidden');
  }
}

// --- Actions ---
function downloadImage() {
  if (!currentImage) return;
  const link = document.createElement('a');
  link.download = `KellynAI_${currentStyle.name}_${Date.now()}.jpg`;
  link.href = photoCanvas.toDataURL('image/jpeg', 0.9);
  link.click();
}

function resetApp() {
  currentImage = null;
  originalImageSrc = null;
  currentStyle = aiStyles[0];
  
  editorArea.classList.add('hidden');
  uploadArea.classList.remove('hidden');
  document.documentElement.style.setProperty('--dynamic-color-1', '#e0e7ff');
  document.documentElement.style.setProperty('--dynamic-color-2', '#fae8ff');
  fileInput.value = '';
  renderCarousel();
}

init();
