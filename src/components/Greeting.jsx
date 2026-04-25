import { useEffect, useState } from 'react';

const KEY = 'imam-connect:greeted';

function CartoonImam() {
  return (
    <svg
      className="imam-figure"
      viewBox="0 0 220 260"
      width="180"
      height="212"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="imam-skin" cx="50%" cy="40%" r="60%">
          <stop offset="0%"  stop-color="#fbe4cf" />
          <stop offset="100%" stop-color="#e7c5a4" />
        </radialGradient>
        <linearGradient id="imam-turban" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stop-color="#f8fafc" />
          <stop offset="100%" stop-color="#cbd5e1" />
        </linearGradient>
        <linearGradient id="imam-robe" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stop-color="#0e7c47" />
          <stop offset="100%" stop-color="#085c33" />
        </linearGradient>
      </defs>

      {/* Robe / shoulders */}
      <path
        d="M 35 250 Q 40 195 110 195 Q 180 195 185 250 Z"
        fill="url(#imam-robe)"
        stroke="#073d22" strokeWidth="2"
      />

      {/* Neck */}
      <rect x="98" y="170" width="24" height="20" rx="4" fill="url(#imam-skin)" />

      {/* Head */}
      <ellipse cx="110" cy="125" rx="55" ry="62" fill="url(#imam-skin)" stroke="#c9a07a" strokeWidth="1" />

      {/* Beard */}
      <path
        d="M 56 140 Q 65 215 110 215 Q 155 215 164 140 Q 158 185 110 195 Q 62 185 56 140 Z"
        fill="#2a221f"
      />
      <path
        d="M 70 155 Q 110 175 150 155 Q 130 175 110 178 Q 90 175 70 155 Z"
        fill="#3a2e2a"
        opacity="0.6"
      />

      {/* Eyebrows */}
      <path d="M 72 100 Q 82 92 92 100" stroke="#2a221f" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M 128 100 Q 138 92 148 100" stroke="#2a221f" strokeWidth="3.5" fill="none" strokeLinecap="round"/>

      {/* Eyes */}
      <circle cx="82" cy="115" r="4.5" fill="#111827" />
      <circle cx="138" cy="115" r="4.5" fill="#111827" />
      <circle cx="83.5" cy="113" r="1.5" fill="#fff" />
      <circle cx="139.5" cy="113" r="1.5" fill="#fff" />

      {/* Smile */}
      <path d="M 90 150 Q 110 162 130 150" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round"/>

      {/* Turban — bottom band */}
      <ellipse cx="110" cy="78" rx="68" ry="22" fill="url(#imam-turban)" stroke="#94a3b8" strokeWidth="1.5"/>
      {/* Turban — top */}
      <ellipse cx="110" cy="60" rx="58" ry="28" fill="url(#imam-turban)" stroke="#94a3b8" strokeWidth="1.5"/>
      <path
        d="M 60 70 Q 110 38 160 70 L 160 78 Q 110 58 60 78 Z"
        fill="#0e7c47"
        opacity="0.85"
      />
      {/* Turban — small jewel/star */}
      <text x="110" y="68" textAnchor="middle" fontSize="18" fill="#fbbf24" fontFamily="serif">☪</text>

      {/* Right arm — drawn raised in "wave" pose, animated to rock back and forth.
          Pivot point lives at the right shoulder (~165, 205); see .imam-arm in CSS. */}
      <g className="imam-arm">
        {/* Sleeve curve from shoulder up toward the hand */}
        <path
          d="M 158 210 Q 150 180 165 150 Q 180 128 200 120 Q 216 122 220 134 Q 210 145 195 154 Q 182 175 178 200 Q 173 213 165 213 Z"
          fill="url(#imam-robe)"
          stroke="#073d22"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Hand */}
        <circle cx="208" cy="122" r="13" fill="url(#imam-skin)" stroke="#c9a07a" strokeWidth="1.2" />
        {/* Thumb hint */}
        <path
          d="M 218 117 Q 222 124 218 132"
          stroke="#c9a07a"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export default function Greeting() {
  const [visible, setVisible] = useState(() => {
    try { return sessionStorage.getItem(KEY) !== '1'; } catch { return true; }
  });
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const start = setTimeout(() => setLeaving(true), 4200);
    const end = setTimeout(() => {
      setVisible(false);
      try { sessionStorage.setItem(KEY, '1'); } catch {}
    }, 5000);
    return () => { clearTimeout(start); clearTimeout(end); };
  }, [visible]);

  if (!visible) return null;

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => {
      setVisible(false);
      try { sessionStorage.setItem(KEY, '1'); } catch {}
    }, 500);
  };

  return (
    <div
      className={`greeting ${leaving ? 'greeting-leave' : ''}`}
      onClick={dismiss}
      role="button"
      aria-label="Welcome — tap to dismiss"
    >
      <div className="greeting-inner">
        <div className="imam-stage">
          <CartoonImam />
          <div className="speech-bubble" aria-hidden="true">Assalamualaikum!</div>
        </div>

        <div className="greeting-arabic" aria-hidden="true">السلام عليكم</div>
        <div className="greeting-english">Welcome to Imam Connect</div>
        <div className="greeting-subtitle">Peace be upon you</div>
      </div>
    </div>
  );
}
