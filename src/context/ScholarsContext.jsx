import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { listScholars } from '../store/scholars.js';
import { getRatingSummaries } from '../store/reviews.js';

const ScholarsContext = createContext({
  scholars: [],
  loading: true,
  error: null,
  refresh: () => {},
});

export function ScholarsProvider({ children }) {
  const [scholars, setScholars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    // Retry once if the first attempt races with auth lock or a token refresh.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const [rows, summaries] = await Promise.all([
          listScholars(),
          getRatingSummaries(),
        ]);
        const summaryById = Object.fromEntries(
          summaries.map((s) => [s.scholar_id, s])
        );
        // Override the static rating/reviews on each scholar with the live aggregate
        // when one or more reviews exist.
        const merged = rows.map((s) => {
          const live = summaryById[s.id];
          if (!live || !live.review_count) return s;
          return {
            ...s,
            rating: Number(live.avg_rating),
            reviews: live.review_count,
          };
        });
        setScholars(merged);
        setError(null);
        break;
      } catch (e) {
        if (attempt === 1) {
          setError(e.message || 'Failed to load scholars');
        } else {
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <ScholarsContext.Provider value={{ scholars, loading, error, refresh }}>
      {children}
    </ScholarsContext.Provider>
  );
}

export function useScholars() {
  return useContext(ScholarsContext);
}

export function useScholar(id) {
  const { scholars, loading, error } = useScholars();
  return { scholar: scholars.find((s) => s.id === id) || null, loading, error };
}
