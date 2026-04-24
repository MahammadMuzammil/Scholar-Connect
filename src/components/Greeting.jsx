import { useEffect, useState } from 'react';

const KEY = 'scholar-connect:greeted';
const ENGLISH = 'Assalamu alaikum';

export default function Greeting() {
  const [visible, setVisible] = useState(() => {
    try {
      return sessionStorage.getItem(KEY) !== '1';
    } catch {
      return true;
    }
  });
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const start = setTimeout(() => setLeaving(true), 2200);
    const end = setTimeout(() => {
      setVisible(false);
      try { sessionStorage.setItem(KEY, '1'); } catch {}
    }, 3000);
    return () => {
      clearTimeout(start);
      clearTimeout(end);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`greeting ${leaving ? 'greeting-leave' : ''}`}
      onClick={() => {
        setLeaving(true);
        setTimeout(() => {
          setVisible(false);
          try { sessionStorage.setItem(KEY, '1'); } catch {}
        }, 500);
      }}
    >
      <div className="greeting-inner">
        <div className="greeting-arabic" aria-hidden="true">السلام عليكم</div>
        <div className="greeting-english">
          {ENGLISH.split('').map((ch, i) => (
            <span
              key={i}
              className="greeting-letter"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
        </div>
        <div className="greeting-subtitle">Peace be upon you</div>
      </div>
    </div>
  );
}
