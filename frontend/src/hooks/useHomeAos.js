import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

let aosInitialized = false;

function shouldDisableAos() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function ensureAos() {
  if (aosInitialized) return;
  AOS.init({
    duration: 650,
    easing: 'ease-out-cubic',
    once: true,
    offset: 56,
    disable: shouldDisableAos,
  });
  aosInitialized = true;
}

export function refreshAos() {
  if (!aosInitialized) return;
  AOS.refresh();
}

export function useHomeAos(refreshDeps = []) {
  useEffect(() => {
    ensureAos();
    refreshAos();
  }, []);

  useEffect(() => {
    if (!aosInitialized) return undefined;
    const timer = window.setTimeout(() => refreshAos(), 0);
    return () => window.clearTimeout(timer);
  }, refreshDeps);
}

export function useFooterAos() {
  useEffect(() => {
    ensureAos();
    const timer = window.setTimeout(() => refreshAos(), 0);
    return () => window.clearTimeout(timer);
  }, []);
}
