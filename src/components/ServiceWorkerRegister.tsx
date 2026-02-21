'use client';
import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // register when page is loaded
      const registerSW = async () => {
        try {
          const reg = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
          console.log('Service worker registered:', reg);
        } catch (err) {
          console.error('Service worker registration failed:', err);
        }
      };

      // Only register over secure contexts (https:// or localhost)
      if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
        registerSW();
      }
    }
  }, []);

  return null;
}
