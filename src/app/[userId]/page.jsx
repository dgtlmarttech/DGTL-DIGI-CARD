'use client';
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "../../context/userContext";
import { getUserData } from "../../services/firebaseAuthService";
import ProgressIndicator from "../../components/ProgressIndicator";
import DigitalCard from "../../components/DigitalCard";
import ContactCard from "../../components/template/card1";
import ContactCard2 from "../../components/template/card2";
import ContactCard3 from "../../components/template/card3";
import ContactCard4 from "../../components/template/card4";
import ContactCard5 from "../../components/template/card5";
import ContactCard6 from "../../components/template/card6";
import { getAdBannerSettings } from "../../services/adService";
import Head from "next/head";

// Add robots meta tag to prevent indexing
export const metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    nocache: true,
  },
};

function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Show banner after 3 seconds if not dismissed and not already installed
    const timer = setTimeout(() => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone;
      const dismissed = localStorage.getItem('pwaInstallDismissed');
      
      if (!isStandalone && !dismissed) {
        setShowBanner(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleInstallClick = () => {
    router.push('/install-app');
  };

  const handleDismiss = () => {
    localStorage.setItem('pwaInstallDismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-2 px-4 relative animate-slide-down">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center text-sm">
            📱
          </div>
          <div>
            <p className="font-medium text-sm">Install DgtlDigiCard</p>
            <p className="text-xs text-green-100">Access cards offline</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="bg-white text-green-600 px-3 py-1 rounded-md text-xs font-semibold hover:cursor-pointer hover:bg-green-50 transition-colors duration-200"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:cursor-pointer hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors duration-200 text-sm"
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function LiveCardPage() {
  const { userId } = useParams();
  const router = useRouter();

  // ✅ Pull data & helpers from UserContext
  const { user, userInfo, isCurrentUser, loading: userLoading } = useUser();

  const [pageUserInfo, setPageUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adSettings, setAdSettings] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // If we're viewing our own card and already have userInfo, reuse it
      if (isCurrentUser(userId)) {
        setPageUserInfo(userInfo);
        setLoading(false);
        return;
      }

      // Otherwise fetch that user's public data
      const data = await getUserData(userId);
      if (!data) {
        router.push("/404");
        return;
      }
      setPageUserInfo(data);
      setLoading(false);
    };

    if (!userLoading && userId) {
      fetchData();
    }
  }, [userId, userLoading, userInfo, isCurrentUser, router]);

  // Load ads (optional)
  useEffect(() => {
    (async () => {
      const settings = await getAdBannerSettings();
      setAdSettings(settings);
    })();
  }, []);

  const renderCard = () => {
    const data = pageUserInfo;
    if (!data) return null;
    const style = data.effectiveIsPremium ? data.cardStyle || "default" : "default";
    const props = { userInfo: data };
    switch (style) {
      case "style1": return <ContactCard {...props} />;
      case "style2": return <ContactCard2 {...props} />;
      case "style3": return <ContactCard3 {...props} />;
      case "style4": return <ContactCard4 {...props} />;
      case "style5": return <ContactCard5 {...props} />;
      case "style6": return <ContactCard6 {...props} />;
      default: return <DigitalCard {...props} />;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><ProgressIndicator /></div>;
  }

  if (!pageUserInfo) return null;

  return (
    <>
      {/* Add robots meta tag using Head component */}
      <Head>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
        <title>{pageUserInfo.firstName && pageUserInfo.lastName ? 
          `${pageUserInfo.firstName} ${pageUserInfo.lastName} - Digital Business Card` : 
          'Digital Business Card'
        }</title>
      </Head>

      <div className={`min-h-screen ${pageUserInfo.effectiveIsPremium ? "bg-gradient-to-br from-purple-50 to-blue-50" : "bg-gray-50"}`}>
        {/* PWA Install Banner - At the top */}
        <PWAInstallBanner />
        
        {isCurrentUser(userId) && (
          <div className="fixed top-4 right-4 z-50">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:cursor-pointer hover:bg-blue-700 transition-colors duration-200"
              onClick={() => router.push("/dashboard")}
            >
              Visit Dashboard
            </button>
          </div>
        )}
        <div className="container mx-auto">{renderCard()}</div>
      </div>
    </>
  );
}
