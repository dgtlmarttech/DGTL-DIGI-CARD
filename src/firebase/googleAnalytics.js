export const initializeGoogleAnalytics = () => {
    if (typeof window !== "undefined") {
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        window.dataLayer.push(arguments);
      }
      window.gtag = gtag;
      
      gtag("js", new Date());
      gtag("config", "G-5VW1K9T1EZ");
  
      // Inject Google Tag Manager script
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://www.googletagmanager.com/gtag/js?id=G-5VW1K9T1EZ";
      document.head.appendChild(script);
    }
  };
  