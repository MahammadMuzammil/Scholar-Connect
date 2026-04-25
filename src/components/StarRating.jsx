import { useState } from 'react';

export default function StarRating({ value, onChange, size = 28, readOnly = false }) {
  const [hover, setHover] = useState(0);
  const display = hover || value || 0;

  return (
    <div
      className="star-rating"
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={`Rating: ${value || 0} out of 5`}
      style={{ display: 'inline-flex', gap: 4 }}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= display;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(n)}
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(0)}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: readOnly ? 'default' : 'pointer',
              fontSize: size,
              lineHeight: 1,
              color: filled ? '#fbbf24' : '#444c6e',
              transition: 'color .15s ease, transform .1s ease',
              transform: hover === n ? 'scale(1.15)' : 'scale(1)',
            }}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
