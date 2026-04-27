import { useEffect, useState } from 'react';

// Islamic-themed photos. Hosted on Unsplash (CDN-stable hotlinks). If any
// 404, the validation effect drops them from the rotation automatically so
// the slideshow never shows an empty slot.
const SOURCE_IMAGES = [
  // Mosque interior with chandeliers (Sheikh Zayed Grand Mosque)
  'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=1920&q=70&auto=format&fit=crop',
  // Open Quran with calligraphy
  'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1920&q=70&auto=format&fit=crop',
  // Mihrab with Islamic geometric patterns
  'https://images.unsplash.com/photo-1542379671-2adb9c4e0d28?w=1920&q=70&auto=format&fit=crop',
  // Crescent moon over a mosque dome
  'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1920&q=70&auto=format&fit=crop',
];

const SLIDE_MS = 9000;

// Probe the URL by loading it as an Image; resolves true if it loads, false on
// network/HTTP error. Runs once at mount so we don't keep dead URLs in rotation.
function probe(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

export default function Background() {
  const [images, setImages] = useState(SOURCE_IMAGES);
  const [index, setIndex] = useState(0);

  // Drop any URL that fails to load (e.g. Unsplash deleted the photo).
  useEffect(() => {
    let cancelled = false;
    Promise.all(SOURCE_IMAGES.map(probe)).then((results) => {
      if (cancelled) return;
      const ok = SOURCE_IMAGES.filter((_, i) => results[i]);
      if (ok.length && ok.length !== SOURCE_IMAGES.length) {
        setImages(ok);
        setIndex(0);
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, SLIDE_MS);
    return () => clearInterval(t);
  }, [images.length]);

  return (
    <div className="bg-stage" aria-hidden="true">
      {images.map((src, i) => (
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
