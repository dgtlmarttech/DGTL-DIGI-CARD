// File: usePWAInstall.ts
'use client';

import { useCallback, useEffect, useState } from 'react';

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
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
    const isAndroid = /Android/.test(ua);
    const isIOS =
      /iPhone|iPad|iPod/.test(ua) ||
      (/(Macintosh)/.test(ua) && 'ontouchend' in document);

    setDeviceType(isIOS ? 'iOS' : isAndroid ? 'Android' : 'PC');
    setCanShare(typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function');

    const checkStandalone = () => {
      const mq = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
      const navStandalone = (navigator as any).standalone === true;
      setIsStandalone(Boolean(mq || navStandalone));
    };
    checkStandalone();

    const onBeforeInstallPrompt = (e: Event) => {
      const possible = e as Partial<BeforeInstallPromptEvent>;
      if (typeof possible.prompt !== 'function') {
        console.debug('[PWA] beforeinstallprompt received but prompt() missing');
        return;
      }

      try {
        e.preventDefault(); // prevent automatic mini-infobar
      } catch (err) {
        console.warn('[PWA] beforeinstallprompt.preventDefault() failed', err);
      }

      console.debug('[PWA] beforeinstallprompt fired — storing event');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallAvailable(true);
    };

    const onAppInstalled = () => {
      console.debug('[PWA] appinstalled event fired — clearing prompt');
      setDeferredPrompt(null);
      setInstallAvailable(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', onAppInstalled);

    const onVisibilityChange = () => checkStandalone();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', onAppInstalled);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    console.debug('[PWA] promptInstall called — deferredPrompt present?', !!deferredPrompt);

    if (!deferredPrompt) {
      return { outcome: 'no-prompt' } as const;
    }

    if (typeof deferredPrompt.prompt !== 'function') {
      console.warn('[PWA] stored event has no prompt() — clearing and returning');
      setDeferredPrompt(null);
      setInstallAvailable(false);
      return { outcome: 'no-prompt' } as const;
    }

    try {
      // IMPORTANT: this must be called from a user gesture (e.g., click handler)
      await deferredPrompt.prompt();
      console.debug('[PWA] prompt() shown, awaiting userChoice...');
      const choiceResult = await deferredPrompt.userChoice;
      console.debug('[PWA] userChoice:', choiceResult);

      // clear stored prompt after use
      setDeferredPrompt(null);
      setInstallAvailable(false);

      return choiceResult;
    } catch (error) {
      console.error('[PWA] promptInstall error', error);
      setDeferredPrompt(null);
      setInstallAvailable(false);
      return { outcome: 'error', error } as any;
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

export default usePWAInstall;
