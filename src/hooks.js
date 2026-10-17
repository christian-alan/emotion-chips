import { useEffect, useState } from 'react';

/** Live boolean for a CSS media query. */
export function useMediaQuery(query) {
  const get = () => typeof window !== 'undefined' && window.matchMedia(query).matches;
  const [matches, setMatches] = useState(get);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export const useSystemDark = () => useMediaQuery('(prefers-color-scheme: dark)');
export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
