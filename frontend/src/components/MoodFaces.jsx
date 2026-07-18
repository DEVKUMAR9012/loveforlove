// Custom SVG mood face components matching the design system
// All faces share the same golden skin radial gradient and cheek blush

function FaceBase({ children, size = 56 }) {
  const uid = `mfg_${Math.random().toString(36).slice(2, 7)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id={uid} cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#FFE29A" />
          <stop offset="55%" stopColor="#FFC14D" />
          <stop offset="100%" stopColor="#F2A93B" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="38" fill={`url(#${uid})`} stroke="#B8791F" strokeWidth="1.5" />
      <ellipse cx="18" cy="54" rx="8" ry="5" fill="#F4874B" opacity="0.5" />
      <ellipse cx="62" cy="54" rx="8" ry="5" fill="#F4874B" opacity="0.5" />
      {children}
    </svg>
  );
}

// 1. In Love — heart eyes, big smile, floating heart
export function InLoveFace({ size = 56 }) {
  return (
    <FaceBase size={size}>
      <g transform="translate(27,30) scale(1.25)">
        <path d="M0,3 C0,-2 -5,-2 -5,2.5 C-5,6 -2,9 0,11 C2,9 5,6 5,2.5 C5,-2 0,-2 0,3 Z" fill="#E23B5E" />
      </g>
      <g transform="translate(51,30) scale(1.25)">
        <path d="M0,3 C0,-2 -5,-2 -5,2.5 C-5,6 -2,9 0,11 C2,9 5,6 5,2.5 C5,-2 0,-2 0,3 Z" fill="#E23B5E" />
      </g>
      <g transform="translate(37,5) scale(0.9)">
        <path d="M0,3 C0,-2 -5,-2 -5,2.5 C-5,6 -2,9 0,11 C2,9 5,6 5,2.5 C5,-2 0,-2 0,3 Z" fill="#F2597B" />
      </g>
      <path d="M26 55 Q40 68 54 55" fill="none" stroke="#8A5A1C" strokeWidth="3" strokeLinecap="round" />
    </FaceBase>
  );
}

// 2. Happy — lifted brows, open smile with teeth
export function HappyFace({ size = 56 }) {
  return (
    <FaceBase size={size}>
      <path d="M18 28 Q28 20 38 27" fill="none" stroke="#8A5A1C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M42 27 Q52 20 62 28" fill="none" stroke="#8A5A1C" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="28" cy="36" rx="7" ry="9" fill="#1E1618" />
      <circle cx="25.5" cy="31.5" r="2.2" fill="#fff" />
      <ellipse cx="52" cy="36" rx="7" ry="9" fill="#1E1618" />
      <circle cx="49.5" cy="31.5" r="2.2" fill="#fff" />
      <path d="M23 51 Q40 68 57 51 Q50 61 40 62 Q30 61 23 51 Z" fill="#7A3B1D" />
      <path d="M28 53 Q40 61 52 53" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
    </FaceBase>
  );
}

// 3. Calm — half-closed brows, gentle closed-mouth smile
export function CalmFace({ size = 56 }) {
  return (
    <FaceBase size={size}>
      <path d="M20 34 Q28 28 36 34" fill="none" stroke="#5A3B1C" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M44 34 Q52 28 60 34" fill="none" stroke="#5A3B1C" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M30 52 Q40 60 50 52" fill="none" stroke="#8A5A1C" strokeWidth="2.6" strokeLinecap="round" />
    </FaceBase>
  );
}

// 4. Miss You — worried brows, sad eyes, tear drop, flat mouth
export function MissYouFace({ size = 56 }) {
  return (
    <FaceBase size={size}>
      <path d="M20 27 Q29 23 37 29" fill="none" stroke="#5A3B1C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M43 29 Q51 23 60 27" fill="none" stroke="#5A3B1C" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="28" cy="38" rx="6" ry="7" fill="#1E1618" />
      <circle cx="26" cy="35" r="1.8" fill="#fff" />
      <ellipse cx="52" cy="38" rx="6" ry="7" fill="#1E1618" />
      <circle cx="50" cy="35" r="1.8" fill="#fff" />
      <path d="M54 43 C54 49 60 51 60 56 C60 60 56.5 62 54 62 C51.5 62 48 60 48 56 C48 51 54 49 54 43 Z" fill="#6FB8E0" opacity="0.9" />
      <path d="M32 55 Q40 52 48 55" fill="none" stroke="#8A5A1C" strokeWidth="2.4" strokeLinecap="round" />
    </FaceBase>
  );
}

// 5. Stressed — angry diagonal brows, squiggly mouth, sweat drop
export function StressedFace({ size = 56 }) {
  return (
    <FaceBase size={size}>
      <path d="M18 26 L34 31" fill="none" stroke="#5A3B1C" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M62 26 L46 31" fill="none" stroke="#5A3B1C" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="28" cy="39" r="5.5" fill="#1E1618" />
      <circle cx="26.3" cy="37" r="1.6" fill="#fff" />
      <circle cx="52" cy="38" r="5" fill="#1E1618" />
      <circle cx="50.5" cy="36.2" r="1.4" fill="#fff" />
      <path d="M28 52 Q32 48 36 52 Q40 48 44 52 Q48 48 52 52 L50 62 Q40 66 30 62 Z" fill="#7A3B1D" />
      <path d="M64 22 C64 27 69 29 69 33 C69 36 66.3 38 64 38 C61.7 38 59 36 59 33 C59 29 64 27 64 22 Z" fill="#6FB8E0" opacity="0.9" />
    </FaceBase>
  );
}
