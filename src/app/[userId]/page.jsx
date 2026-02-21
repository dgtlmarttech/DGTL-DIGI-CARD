'use client';
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useUser } from "../../context/userContext";
import { getUserData } from "../../services/firebaseAuthService";
import ProgressIndicator from "../../components/ProgressIndicator";
import DigitalCard from "../../components/DigitalCard";
import ContactCard from "../../components/template/card1";
import ContactCard2 from "../../components/template/card2";
import ContactCard3 from "../../components/template/card3";
import Head from "next/head";
import usePWAInstall from "../install-app/usePWAInstall";

// PWA Install Modal Component
function PWAInstallModal({ isOpen, onClose }) {
    const { deviceType, installAvailable, promptInstall, isStandalone, canShare } = usePWAInstall();

    if (!isOpen) return null;

    const handleInstallClick = async () => {
        if (installAvailable) {
            const result = await promptInstall();
            console.log('[UI] Install result:', result);
            if (result.outcome === 'accepted') {
                onClose();
            }
        }
    };

    const handleIOSShare = async () => {
        if (canShare && typeof navigator.share === 'function') {
            try {
                await navigator.share({
                    title: "DgtlDigiCard - Digital Business Cards",
                    text: "Add DgtlDigiCard to your home screen!",
                    url: window.location.href,
                });
            } catch (err) {
                console.log("Share cancelled", err);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-slide-up">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
                    aria-label="Close"
                >
                    ×
                </button>

                {/* Already installed */}
                {isStandalone ? (
                    <div className="text-center py-4">
                        <div className="text-6xl mb-4">✅</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Already Installed!</h2>
                        <p className="text-gray-600 mb-6">DgtlDigiCard is running as an installed app.</p>
                        <button
                            onClick={onClose}
                            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                            Got it
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-6">
                            <div className="text-5xl mb-3">📱</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Install DgtlDigiCard</h2>
                            <p className="text-gray-600 text-sm">Get quick access and offline features</p>
                        </div>

                        {/* Android/PC with install prompt */}
                        {(deviceType === 'Android' || deviceType === 'PC') && installAvailable && (
                            <div className="space-y-4">
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl">
                                    <h3 className="font-semibold text-gray-900 mb-2">Benefits:</h3>
                                    <ul className="text-sm text-gray-700 space-y-1">
                                        <li>⚡ Faster loading</li>
                                        <li>📴 Works offline</li>
                                        <li>🏠 Home screen access</li>
                                        <li>🔒 More secure</li>
                                    </ul>
                                </div>

                                <button
                                    onClick={handleInstallClick}
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition shadow-lg"
                                >
                                    Install Now
                                </button>
                            </div>
                        )}

                        {/* iOS Instructions */}
                        {deviceType === 'iOS' && (
                            <div className="space-y-4">
                                <div className="bg-blue-50 p-4 rounded-xl">
                                    <h3 className="font-semibold text-gray-900 mb-3">Installation Steps:</h3>
                                    <ol className="text-sm text-gray-700 space-y-2">
                                        <li className="flex items-start">
                                            <span className="font-bold text-blue-600 mr-2">1.</span>
                                            <span>Tap the Share button ⬆️ in Safari</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="font-bold text-blue-600 mr-2">2.</span>
                                            <span>Scroll and tap "Add to Home Screen" ➕</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="font-bold text-blue-600 mr-2">3.</span>
                                            <span>Tap "Add" in the top right</span>
                                        </li>
                                    </ol>
                                </div>

                                {canShare && (
                                    <button
                                        onClick={handleIOSShare}
                                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
                                    >
                                        Open Share Menu
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Fallback for browsers without install prompt */}
                        {!installAvailable && deviceType !== 'iOS' && (
                            <div className="space-y-4">
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                                    <p className="text-sm text-yellow-800">
                                        💡 To install, open this page in Chrome, Edge, or Samsung Internet browser.
                                    </p>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}

function PWAInstallBanner({ onVisibilityChange }) {
    const [showBanner, setShowBanner] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated } = useUser();

    useEffect(() => {
        // Check if redirected from install-app route
        if (searchParams.get('install') === 'true') {
            setShowModal(true);
            // Clean up URL
            const url = new URL(window.location.href);
            url.searchParams.delete('install');
            window.history.replaceState({}, '', url.toString());
        }
    }, [searchParams]);

    useEffect(() => {
        if (!isAuthenticated) {
            onVisibilityChange(false);
            return;
        }

        const timer = setTimeout(() => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone;
            const dismissed = localStorage.getItem('pwaInstallDismissed');

            if (!isStandalone && !dismissed) {
                setShowBanner(true);
                onVisibilityChange(true);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [isAuthenticated, onVisibilityChange]);

    useEffect(() => {
        onVisibilityChange(showBanner);
    }, [showBanner, onVisibilityChange]);

    const handleInstallClick = () => {
        setShowModal(true);
    };

    const handleDismiss = () => {
        localStorage.setItem('pwaInstallDismissed', 'true');
        setShowBanner(false);
        onVisibilityChange(false);
    };

    if (!showBanner) return <PWAInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />;

    return (
        <>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 relative animate-slide-down">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg">
                            📱
                        </div>
                        <div>
                            <p className="font-semibold text-sm">Install DgtlDigiCard App</p>
                            <p className="text-xs text-blue-100">Get quick access and offline features</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleInstallClick}
                            className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:cursor-pointer hover:bg-blue-50 transition-colors duration-200"
                        >
                            Install Now
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="text-white/80 hover:cursor-pointer hover:text-white hover:bg-white/10 rounded-full p-2 transition-colors duration-200"
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

            <PWAInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
        </>
    );
}

export default function LiveCardPage() {
    const { userId } = useParams();
    const router = useRouter();
    const { user, userInfo, isCurrentUser, loading: userLoading, isStandalone } = useUser();

    const [pageUserInfo, setPageUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bannerVisible, setBannerVisible] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            // Try to load from cache first for immediate display/offline
            const cacheKey = `dgtl_card_cache_${userId}`;
            if (typeof window !== 'undefined') {
                const cachedData = localStorage.getItem(cacheKey);
                if (cachedData) {
                    setPageUserInfo(JSON.parse(cachedData));
                    setLoading(false);
                }
            }

            if (isCurrentUser(userId)) {
                setPageUserInfo(userInfo);
                setLoading(false);
                // Save current user info to this userId cache too
                if (typeof window !== 'undefined' && userInfo) {
                    localStorage.setItem(cacheKey, JSON.stringify(userInfo));
                }
                return;
            }

            try {
                const data = await getUserData(userId);
                if (!data) {
                    // Only redirect if we have no cached data at all
                    const cachedData = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
                    if (!cachedData) {
                        router.push("/404");
                    }
                    return;
                }
                setPageUserInfo(data);
                setLoading(false);
                // Save to cache for offline support
                if (typeof window !== 'undefined') {
                    localStorage.setItem(cacheKey, JSON.stringify(data));
                }
            } catch (err) {
                console.error("Fetch error:", err);
                // If fetch fails (maybe offline), we keep the cached info if we have it
            }
        };

        if (!userLoading && userId) {
            fetchData();
        }
    }, [userId, userLoading, userInfo, isCurrentUser, router]);

    const renderCard = () => {
        const data = pageUserInfo;
        if (!data) return null;
        const style = data.effectiveIsPremium ? data.cardStyle || "default" : "default";
        const props = { userInfo: data };
        switch (style) {
            case "style1": return <ContactCard {...props} />;
            case "style2": return <ContactCard2 {...props} />;
            case "style3": return <ContactCard3 {...props} />;
            default: return <DigitalCard {...props} />;
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen"><ProgressIndicator /></div>;
    }

    if (!pageUserInfo) return null;

    const buttonTopClass = bannerVisible ? "top-[4.5rem]" : "top-4";

    return (
        <>
            <Head>
                <meta name="robots" content="noindex, nofollow" />
                <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
                <title>
                    {pageUserInfo.firstName && pageUserInfo.lastName
                        ? `${pageUserInfo.firstName} ${pageUserInfo.lastName} - Digital Business Card`
                        : 'Digital Business Card'
                    }
                </title>
            </Head>

            <div className={`min-h-screen ${pageUserInfo.effectiveIsPremium ? "bg-gradient-to-br from-purple-50 to-blue-50" : "bg-gray-50"}`}>
                <PWAInstallBanner onVisibilityChange={setBannerVisible} />

                {isCurrentUser(userId) && !isStandalone && (
                    <div className={`fixed ${buttonTopClass} right-4 z-[60] transition-all duration-300`}>
                        <button
                            className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:cursor-pointer hover:bg-blue-700 transition-colors duration-200 shadow-lg"
                            onClick={() => router.push("/dashboard")}
                        >
                            Dashboard
                        </button>
                    </div>
                )}

                {!isCurrentUser(userId) && !isStandalone && (
                    <div className={`fixed ${buttonTopClass} right-4 z-[60] transition-all duration-300`}>
                        <button
                            className="bg-gray-200 text-gray-800 p-2 rounded-full hover:bg-gray-300 transition-colors duration-200 shadow-lg"
                            onClick={() => router.push("/signin")}
                            aria-label="Login or Signup"
                        >
                            ⚙️
                        </button>
                    </div>
                )}

                <div className="container mx-auto">{renderCard()}</div>
            </div>
        </>
    );
}
