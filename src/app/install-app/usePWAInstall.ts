// File: usePWAInstall.ts
'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Minimal type for the beforeinstallprompt event (not present in some DOM libs).
 * Matches the spec: has prompt() and userChoice promise.
 */
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

    // Detect device roughly
    const ua = navigator.userAgent || '';
    const isAndroid = /Android/.test(ua);
    const isIOS =
      /iPhone|iPad|iPod/.test(ua) ||
      (/(Macintosh)/.test(ua) && 'ontouchend' in document); // iPadOS detection fallback

    setDeviceType(isIOS ? 'iOS' : isAndroid ? 'Android' : 'PC');

    setCanShare(typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function');

    const checkStandalone = () => {
      const mq = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
      const navStandalone = (navigator as any).standalone === true;
      setIsStandalone(Boolean(mq || navStandalone));
    };
    checkStandalone();

    // MDN recommended pattern: preventDefault() and store the event
    const onBeforeInstallPrompt = (e: Event) => {
      // If the event doesn't support prompt(), ignore it
      const possible = e as Partial<BeforeInstallPromptEvent>;
      if (typeof possible.prompt !== 'function') return;

      // Prevent the mini-infobar from appearing on mobile
      try {
        e.preventDefault();
      } catch {
        // Some browsers might not allow preventDefault — ignore errors
      }

      // Save the event for later and mark install available
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallAvailable(true);
    };

    const onAppInstalled = () => {
      // Clear stored prompt; the app is installed
      setDeferredPrompt(null);
      setInstallAvailable(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', onAppInstalled);

    // visibilitychange: user might install via browser UI -> re-check standalone state
    const onVisibilityChange = () => checkStandalone();
    document.addEventListener('visibilitychange', onVisibilityChange);

    // cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', onAppInstalled);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  /**
   * Call this to prompt installation when available.
   * Mirrors MDN: call prompt() on the stored event, await userChoice, then clear.
   *
   * Returns:
   * - { outcome: 'accepted' | 'dismissed' } when prompt run
   * - { outcome: 'no-prompt' } if there was no stored prompt
   * - { outcome: 'error', error } on unexpected failures
   */
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return { outcome: 'no-prompt' } as const;
    }

    // Defensive: ensure prompt() exists
    if (typeof deferredPrompt.prompt !== 'function') {
      // Not a proper beforeinstallprompt event
      setDeferredPrompt(null);
      setInstallAvailable(false);
      return { outcome: 'no-prompt' } as const;
    }

    try {
      // Show the native install prompt (must be called from a user gesture)
      await deferredPrompt.prompt();

      // Wait for the user's choice
      const choiceResult = await deferredPrompt.userChoice;

      // Clear stored prompt per spec so it cannot be reused
      setDeferredPrompt(null);
      setInstallAvailable(false);

      return choiceResult;
    } catch (error) {
      // Some browsers may throw — return error status
      console.error('promptInstall error', error);
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
