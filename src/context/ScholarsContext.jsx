import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { listScholars } from '../store/scholars.js';

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
        const rows = await listScholars();
        setScholars(rows);
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
