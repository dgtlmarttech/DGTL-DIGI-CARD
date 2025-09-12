// File: usePWAInstall.ts
import { useEffect, useState, useCallback } from 'react';

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>;
};

export function usePWAInstall() {
  const [deviceType, setDeviceType] = useState<'iOS' | 'Android' | 'PC' | ''>('');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [installAvailable, setInstallAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || '';
    const userAgentData = (navigator as any).userAgentData;
    const isAndroid = /Android/.test(ua);
    const isIOS = /iPhone|iPad|iPod/.test(ua) || (/(Macintosh)/.test(ua) && 'ontouchend' in document);

    if (userAgentData && Array.isArray(userAgentData.brands)) {
      const brands = userAgentData.brands.map((b: any) => b.brand).join(' ');
      if (brands.includes('Android')) setDeviceType('Android');
      else if (brands.includes('Apple')) setDeviceType('iOS');
      else setDeviceType(isIOS ? 'iOS' : isAndroid ? 'Android' : 'PC');
    } else {
      setDeviceType(isIOS ? 'iOS' : isAndroid ? 'Android' : 'PC');
    }

    setCanShare(typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function');

    const checkStandalone = () => {
      const mq = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
      const nav = (navigator as any).standalone === true;
      setIsStandalone(Boolean(mq || nav));
    };

    checkStandalone();

    const mediaQuery = window.matchMedia ? window.matchMedia('(display-mode: standalone)') : null;
    const onDisplayChange = () => checkStandalone();
    if (mediaQuery && 'addEventListener' in mediaQuery) mediaQuery.addEventListener('change', onDisplayChange);
    else if (mediaQuery && 'addListener' in mediaQuery) (mediaQuery as any).addListener(onDisplayChange);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallAvailable(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setInstallAvailable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    document.addEventListener('visibilitychange', checkStandalone);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      document.removeEventListener('visibilitychange', checkStandalone);
      if (mediaQuery && 'removeEventListener' in mediaQuery) mediaQuery.removeEventListener('change', onDisplayChange);
      else if (mediaQuery && 'removeListener' in mediaQuery) (mediaQuery as any).removeListener(onDisplayChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return { outcome: 'no-prompt' } as any;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setInstallAvailable(false);
      return choice;
    } catch (err) {
      console.error('promptInstall error', err);
      return { outcome: 'error' } as any;
    }
  }, [deferredPrompt]);

  return {
    deviceType,
    deferredPrompt,
    isStandalone,
    canShare,
    installAvailable,
    promptInstall,
  };
}