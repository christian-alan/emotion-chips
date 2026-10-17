import { useState } from 'react';
import MoodChips from './components/MoodChips';
import ThemeToggle from './components/ThemeToggle';
import { useReducedMotion, useSystemDark } from './hooks';

export default function App() {
  const [theme, setTheme] = useState('classic');
  const systemDark = useSystemDark();
  const reducedMotion = useReducedMotion();

  // Classic follows the system appearance; Liquid Glass is always dark.
  const resolved = theme === 'glass' ? 'glass' : systemDark ? 'dark' : 'light';

  return (
    <main
      data-theme={resolved}
      className="relative flex min-h-svh items-center justify-center overflow-hidden font-sans text-(--fg) [background:var(--bg)] transition-colors duration-300"
    >
      <div className="origin-center scale-[0.62] sm:scale-100">
        <MoodChips glass={resolved === 'glass'} reducedMotion={reducedMotion} />
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <ThemeToggle value={theme} onChange={setTheme} />
      </div>
    </main>
  );
}
