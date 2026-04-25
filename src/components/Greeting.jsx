import { useEffect, useState } from 'react';
import { Player } from '@lottiefiles/react-lottie-player';

const KEY = 'imam-connect:greeted';

// Drop a Lottie JSON file at scholar-connect/public/salam.json — anything from
// LottieFiles works (search "muslim greeting", "salam", "praying"). If the file
// is missing the greeting falls back to a simple emoji so nothing breaks.
const LOTTIE_SRC = '/salam.json';

function ImamFallback() {
  return (
    <div className="imam-fallback" aria-hidden="true">🤲</div>
  );
}

export default function Greeting() {
  const [visible, setVisible] = useState(() => {
    try { return sessionStorage.getItem(KEY) !== '1'; } catch { return true; }
  });
  const [leaving, setLeaving] = useState(false);
  const [lottieFailed, setLottieFailed] = useState(false);

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
          <div className="imam-lottie-wrap">
            {lottieFailed ? (
              <ImamFallback />
            ) : (
              <Player
                autoplay
                loop
                src={LOTTIE_SRC}
                style={{ width: 240, height: 240 }}
                onEvent={(event) => {
                  if (event === 'error') setLottieFailed(true);
                }}
              />
            )}
          </div>
          <div className="speech-bubble" aria-hidden="true">Assalamualaikum!</div>
        </div>

        <div className="greeting-arabic" aria-hidden="true">السلام عليكم</div>
        <div className="greeting-english">Welcome to Imam Connect</div>
        <div className="greeting-subtitle">Peace be upon you</div>
      </div>
    </div>
  );
}
