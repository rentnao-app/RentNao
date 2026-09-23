import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

let aosInitialized = false;

function shouldDisableAos() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function revealUnanimatedAosNodes() {
  document.querySelectorAll('[data-aos]').forEach((el) => {
    el.classList.add('aos-init', 'aos-animate');
  });
}

export function ensureAos() {
  if (aosInitialized) return;
  AOS.init({
    duration: 650,
    easing: 'ease-out-cubic',
    once: true,
    offset: 24,
    disable: shouldDisableAos,
  });
  aosInitialized = true;
}

export function refreshAos() {
  ensureAos();
  if (shouldDisableAos()) {
    revealUnanimatedAosNodes();
    return;
  }
  AOS.refreshHard();
}

/** Re-scan AOS after SPA navigations and async lists. Falls back so nodes never stay opacity: 0. */
export function syncAosAfterPaint() {
  ensureAos();
  const run = () => {
    refreshAos();
    window.setTimeout(revealUnanimatedAosNodes, 400);
  };
  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(run);
  } else {
    run();
  }
}

export function useHomeAos(refreshDeps = []) {
  useEffect(() => {
    const timer = window.setTimeout(() => syncAosAfterPaint(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => syncAosAfterPaint(), 0);
    return () => window.clearTimeout(timer);
  }, refreshDeps);
}

export function useFooterAos() {
  useEffect(() => {
    const timer = window.setTimeout(() => syncAosAfterPaint(), 0);
    return () => window.clearTimeout(timer);
  }, []);
}

/** Call once in AppLayout so every client-side route remounts AOS. */
export function useRouteAos() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = window.setTimeout(() => syncAosAfterPaint(), 40);
    return () => window.clearTimeout(timer);
  }, [pathname]);
}
