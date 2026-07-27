/**
 * Helper utilities for converting and generating Base64 Data URIs 
 * to store all images directly inside the Firestore database documents.
 */

// Converts an uploaded image File object into a Base64 Data URI string for direct database storage
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// Generates clean, human-readable document IDs (slugs) for Firestore collections
export const createSlug = (text: string, prefix = ''): string => {
  const clean = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const slug = clean || `${Date.now()}`;
  return prefix ? `${prefix}-${slug}` : slug;
};

// Generates embedded SVG Base64 Data URIs for rich Kerala festival artwork stored directly in Firestore
const createSvgBase64 = (svgContent: string): string => {
  const encoded = typeof btoa !== 'undefined' 
    ? btoa(unescape(encodeURIComponent(svgContent)))
    : btoa(unescape(encodeURIComponent(svgContent))); // Fallback for browser
  return `data:image/svg+xml;base64,${encoded}`;
};

// 1. Athapookalam Floral Carpet Base64 Image for Onam Celebration
export const ONAM_POOKALAM_BASE64 = createSvgBase64(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#1b4332"/>
      <stop offset="60%" stop-color="#012d1d"/>
      <stop offset="100%" stop-color="#00140c"/>
    </radialGradient>
    <radialGradient id="centerGold" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffe16d"/>
      <stop offset="100%" stop-color="#fcd400"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Canvas Background -->
  <rect width="800" height="500" fill="url(#bgGrad)"/>
  
  <!-- Subtle Coconut Leaf Pattern Background -->
  <g opacity="0.15" stroke="#86af99" stroke-width="2" fill="none">
    <path d="M 0 0 Q 400 250 800 0"/>
    <path d="M 0 500 Q 400 250 800 500"/>
  </g>

  <!-- ATHAPOOKALAM FLORAL CARPET DESIGN -->
  <g transform="translate(400, 250)">
    <!-- Outer Marigold Ring (Orange) -->
    <circle cx="0" cy="0" r="190" fill="#ff7b00" opacity="0.9"/>
    
    <!-- Outer Petal Rings -->
    <g id="petals36">
      ${Array.from({ length: 36 }).map((_, i) => `
        <ellipse cx="0" cy="-185" rx="14" ry="30" fill="${i % 2 === 0 ? '#ffb700' : '#e63946'}" transform="rotate(${i * 10})" />
      `).join('')}
    </g>

    <!-- Deep Red Rose Ring -->
    <circle cx="0" cy="0" r="150" fill="#9e2a2b"/>
    
    <!-- Yellow Jasmine Layer -->
    <g id="petals24">
      ${Array.from({ length: 24 }).map((_, i) => `
        <polygon points="0,-145 18,-115 0,-100 -18,-115" fill="${i % 2 === 0 ? '#fcd400' : '#ffffff'}" transform="rotate(${i * 15})" />
      `).join('')}
    </g>

    <!-- Green Leaf Star Base -->
    <g id="leafStar">
      ${Array.from({ length: 12 }).map((_, i) => `
        <path d="M 0 0 L 20 -110 L 0 -130 L -20 -110 Z" fill="#2d8a3c" transform="rotate(${i * 30})" />
      `).join('')}
    </g>

    <!-- Inner Purple & White Violet Petals -->
    <g id="innerPetals">
      ${Array.from({ length: 16 }).map((_, i) => `
        <circle cx="0" cy="-70" r="18" fill="${i % 2 === 0 ? '#7209b7' : '#ffffff'}" transform="rotate(${i * 22.5})" />
      `).join('')}
    </g>

    <!-- Center Bright Lamp Ring -->
    <circle cx="0" cy="0" r="50" fill="#ff9f1c"/>
    <circle cx="0" cy="0" r="35" fill="url(#centerGold)"/>

    <!-- Illuminated Brass Nilavilakku Oil Lamp in Center -->
    <g id="nilavilakku" filter="url(#glow)">
      <!-- Base & Stem -->
      <path d="M -18 20 L 18 20 L 12 10 L 4 10 L 6 -10 L -6 -10 L -4 10 L -12 10 Z" fill="#b5838d" />
      <!-- Lamp Bowl -->
      <path d="M -22 -10 Q 0 -22 22 -10 Q 0 -5 -22 -10" fill="#ffd700" stroke="#b5838d" stroke-width="1.5"/>
      <!-- Glowing Flames -->
      <path d="M 0 -10 Q -6 -28 0 -42 Q 6 -28 0 -10" fill="#ff0000"/>
      <path d="M 0 -10 Q -4 -24 0 -36 Q 4 -24 0 -10" fill="#ffb700"/>
      <path d="M 0 -10 Q -2 -20 0 -28 Q 2 -20 0 -10" fill="#ffffff"/>
    </g>
  </g>

  <!-- Text Overlay -->
  <text x="400" y="470" text-anchor="middle" fill="#ffe16d" font-family="sans-serif" font-size="20" font-weight="800" letter-spacing="3">
    GRAND ONAM CELEBRATION • ATHAPOOKALAM
  </text>
</svg>
`);

// 2. Vishukkani Base64 Image
export const VISHU_BASE64 = createSvgBase64(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <linearGradient id="vishuBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3a2e00"/>
      <stop offset="60%" stop-color="#1c1600"/>
      <stop offset="100%" stop-color="#0a0800"/>
    </linearGradient>
    <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffe16d"/>
      <stop offset="100%" stop-color="#fcd400"/>
    </radialGradient>
  </defs>

  <rect width="800" height="500" fill="url(#vishuBg)"/>

  <!-- Golden Cassia Fistula (Kanikonna) Flowers -->
  <g transform="translate(400, 150)">
    ${Array.from({ length: 40 }).map((_, i) => {
      const angle = (i * 137.5) % 360;
      const radius = 20 + i * 4;
      const x = Math.cos(angle * Math.PI / 180) * radius;
      const y = Math.sin(angle * Math.PI / 180) * radius;
      return `<circle cx="${x}" cy="${y}" r="${8 + (i % 5)}" fill="#ffe16d" opacity="0.9"/>`;
    }).join('')}
  </g>

  <!-- Uruli Brass Vessel with Vishukkani Items -->
  <g transform="translate(400, 310)">
    <!-- Golden Vessel -->
    <ellipse cx="0" cy="40" rx="180" ry="45" fill="#8c6d00"/>
    <ellipse cx="0" cy="30" rx="180" ry="40" fill="#fcd400"/>
    <ellipse cx="0" cy="30" rx="165" ry="32" fill="#544600"/>

    <!-- Kanivellari (Golden Cucumber), Rice & Mangoes inside Uruli -->
    <ellipse cx="-60" cy="20" rx="35" ry="20" fill="#e9c400" transform="rotate(-15 -60 20)"/>
    <ellipse cx="50" cy="22" rx="25" ry="18" fill="#e76f51"/>
    <circle cx="0" cy="15" r="28" fill="#ffffff" opacity="0.8"/>
    <circle cx="10" cy="18" r="8" fill="#ffd166"/>

    <!-- Valkannadi (Traditional Brass Mirror) -->
    <g transform="translate(0, -60)">
      <circle cx="0" cy="0" r="38" fill="#fcd400" stroke="#ffe16d" stroke-width="4"/>
      <circle cx="0" cy="0" r="28" fill="#e2e2e2" opacity="0.9"/>
      <path d="M 0 38 L 0 80 L -8 90 L 8 90 Z" fill="#fcd400"/>
    </g>
  </g>

  <text x="400" y="465" text-anchor="middle" fill="#ffe16d" font-family="sans-serif" font-size="20" font-weight="800" letter-spacing="3">
    VISHU & KERALA NEW YEAR FEST
  </text>
</svg>
`);

// 3. Sports & Picnic Base64 Image
export const PICNIC_BASE64 = createSvgBase64(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1d3557"/>
      <stop offset="60%" stop-color="#457b9d"/>
      <stop offset="100%" stop-color="#f1faee"/>
    </linearGradient>
    <linearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2d8a3c"/>
      <stop offset="100%" stop-color="#012d1d"/>
    </linearGradient>
  </defs>

  <rect width="800" height="300" fill="url(#skyGrad)"/>
  <rect y="280" width="800" height="220" fill="url(#grassGrad)"/>

  <!-- Pacific Northwest & Kerala Palm Trees Hybrid Horizon -->
  <g fill="#012d1d" opacity="0.4">
    <polygon points="50,280 80,180 110,280"/>
    <polygon points="90,280 115,160 140,280"/>
    <polygon points="680,280 710,170 740,280"/>
  </g>

  <!-- Tug of War Rope (Vadam Vali) -->
  <g transform="translate(0, 360)">
    <path d="M 50 0 C 250 30, 550 -30, 750 0" stroke="#fcd400" stroke-width="12" fill="none" stroke-dasharray="16 6"/>
    <!-- Red Center Ribbon -->
    <circle cx="400" cy="0" r="16" fill="#ba1a1a"/>
    <path d="M 400 0 L 400 40" stroke="#ba1a1a" stroke-width="4"/>
  </g>

  <text x="400" y="465" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="800" letter-spacing="3">
    KAW ANNUAL SPORTS & FAMILY PICNIC
  </text>
</svg>
`);

// 4. Youth Drama & Music Night Base64 Image
export const DRAMA_BASE64 = createSvgBase64(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <radialGradient id="spotlight" cx="50%" cy="20%" r="80%">
      <stop offset="0%" stop-color="#7209b7" stop-opacity="0.8"/>
      <stop offset="60%" stop-color="#3a0ca3" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#03071e"/>
    </radialGradient>
  </defs>

  <rect width="800" height="500" fill="url(#spotlight)"/>

  <!-- Stage Lights Rays -->
  <polygon points="400,0 200,500 600,500" fill="#fcd400" opacity="0.12"/>

  <!-- Kathakali / Drama Mask Silhouette & Musical Notes -->
  <g transform="translate(400, 220)">
    <!-- Stage Platform -->
    <ellipse cx="0" cy="120" rx="280" ry="40" fill="#ba1a1a" opacity="0.6"/>

    <!-- Theater Drama Masks -->
    <g transform="translate(-60, -20)">
      <path d="M -40 -50 C -40 -90 40 -90 40 -50 C 40 10 -40 10 -40 -50 Z" fill="#ffffff" opacity="0.9"/>
      <circle cx="-15" cy="-55" r="7" fill="#03071e"/>
      <circle cx="15" cy="-55" r="7" fill="#03071e"/>
      <path d="M -20 -30 Q 0 -10 20 -30" stroke="#03071e" stroke-width="4" fill="none"/>
    </g>

    <g transform="translate(60, 10)">
      <path d="M -35 -45 C -35 -80 35 -80 35 -45 C 35 10 -35 10 -35 -45 Z" fill="#ffd166"/>
      <circle cx="-12" cy="-50" r="6" fill="#03071e"/>
      <circle cx="12" cy="-50" r="6" fill="#03071e"/>
      <path d="M -15 -25 Q 0 -40 15 -25" stroke="#03071e" stroke-width="4" fill="none"/>
    </g>
  </g>

  <text x="400" y="465" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="800" letter-spacing="3">
    YOUTH CULTURAL NIGHT & DRAMA FEST
  </text>
</svg>
`);
