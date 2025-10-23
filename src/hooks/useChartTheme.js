import { useEffect, useState } from 'react';

// Hook reutilizable para detectar tema (claro/oscuro) y leer variables CSS de paleta de gráficos
export default function useChartTheme() {
  const [isDark, setIsDark] = useState(false);
  const [vars, setVars] = useState({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = document.documentElement;
    const update = () => {
      setIsDark(el.classList.contains('theme-dark'));
      const styles = getComputedStyle(el);
      setVars({
        primary: styles.getPropertyValue('--chart-primary').trim(),
        primaryFill: styles.getPropertyValue('--chart-primary-fill').trim(),
        barBg: styles.getPropertyValue('--chart-bar-bg').trim(),
        barBorder: styles.getPropertyValue('--chart-bar-border').trim(),
        accent1: styles.getPropertyValue('--chart-accent-1').trim(),
        accent2: styles.getPropertyValue('--chart-accent-2').trim(),
        accent3: styles.getPropertyValue('--chart-accent-3').trim(),
        title: styles.getPropertyValue('--chart-title').trim(),
        tick: styles.getPropertyValue('--chart-tick').trim(),
        grid: styles.getPropertyValue('--chart-grid').trim(),
        tooltipBg: isDark ? 'rgba(17,20,26,0.95)' : 'rgba(255,255,255,0.95)',
        tooltipTitle: isDark ? '#fff' : '#111',
        tooltipBody: isDark ? '#e6e9ef' : '#222',
        tooltipBorder: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
      });
    };
    update();
    const obs = new MutationObserver(update);
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, [isDark]);

  return { isDark, cssVars: vars };
}
