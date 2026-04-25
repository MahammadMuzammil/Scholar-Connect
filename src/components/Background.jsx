import { useEffect, useState } from 'react';

// Islamic-themed photos. Hosted on Unsplash (CDN-stable hotlinks). If any go
// missing the gradient layer below still renders so the page never looks bare.
const IMAGES = [
  // Mosque interior with chandeliers (Sheikh Zayed Grand Mosque)
  'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=1920&q=70&auto=format&fit=crop',
  // Open Quran with calligraphy
  'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1920&q=70&auto=format&fit=crop',
  // Mosque arches and pillars
  'https://images.unsplash.com/photo-1591020132330-d5d6c5fbb1e7?w=1920&q=70&auto=format&fit=crop',
  // Mihrab with Islamic geometric patterns
  'https://images.unsplash.com/photo-1542379671-2adb9c4e0d28?w=1920&q=70&auto=format&fit=crop',
  // Crescent moon over a mosque dome
  'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1920&q=70&auto=format&fit=crop',
];

const SLIDE_MS = 9000; // 9 s per image

export default function Background() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % IMAGES.length);
    }, SLIDE_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-stage" aria-hidden="true">
      {IMAGES.map((src, i) => (
        <div
          key={src}
          className="bg-slide"
          style={{
            backgroundImage: `url(${src})`,
            opacity: i === index ? 1 : 0,
          }}
        />
      ))}
      <div className="bg-overlay" />
    </div>
  );
}
