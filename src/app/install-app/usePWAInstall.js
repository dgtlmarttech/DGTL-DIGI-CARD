"use client";
import { useState, useEffect } from 'react';

/**
 * Custom hook to handle PWA installation logic across different devices.
 * Provides status information and a trigger for the installation prompt.
 */
export default function usePWAInstall() {
  const [installAvailable, setInstallAvailable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deviceType, setDeviceType] = useState('Unknown');
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    // 1. Detect Standalone mode
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone ||
        document.referrer.includes('android-app://');
      setIsStandalone(!!standalone);
    };

    // 2. Detect Device Type
    const detectDevice = () => {
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      if (/android/i.test(ua)) return 'Android';
      if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
      return 'PC';
    };

    // 3. Handle Installation Prompt (Chromium/Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallAvailable(true);
      console.log('PWA: installAvailable set to true');
    };

    if (typeof window !== 'undefined') {
      checkStandalone();
      setDeviceType(detectDevice());
      setCanShare(!!navigator.share);

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Check if already installed
      window.addEventListener('appinstalled', () => {
        setInstallAvailable(false);
        setDeferredPrompt(null);
        setIsStandalone(true);
        console.log('PWA: appinstalled event fired');
      });
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      }
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.warn('PWA: No deferred prompt available');
      return { outcome: 'dismissed' };
    }

    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      console.log(`PWA: User choice: ${choiceResult.outcome}`);

      // Reset after prompt is consumed
      setDeferredPrompt(null);
      setInstallAvailable(false);

      return choiceResult;
    } catch (err) {
      console.error('PWA: Install error:', err);
      return { outcome: 'dismissed' };
    }
  };

  return {
    deviceType,
    installAvailable,
    promptInstall,
    isStandalone,
    canShare
  };
}
