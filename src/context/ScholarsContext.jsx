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

  const refresh = useCallback(() => {
    setLoading(true);
    listScholars()
      .then((rows) => { setScholars(rows); setError(null); })
      .catch((e) => setError(e.message || 'Failed to load scholars'))
      .finally(() => setLoading(false));
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
