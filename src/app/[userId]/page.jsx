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


export default function LiveCardPage() {
    const params = useParams();
    const rawUserId = params?.userId;
    const userId = rawUserId ? decodeURIComponent(rawUserId) : null;
    const router = useRouter();
    const { user, userInfo, isCurrentUser, loading: userLoading, isStandalone } = useUser();

    const [pageUserInfo, setPageUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    // Deep linking fallback to open the native app on mobile devices
    useEffect(() => {
        if (!userId || typeof window === 'undefined') return;

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile) {
            const appScheme = `digicard://${userId}`;
            // Attempt to open the app directly. If it fails, the web card will simply continue to show.
            const timer = setTimeout(() => {
                window.location.assign(appScheme);
            }, 300);
            
            return () => clearTimeout(timer);
        }
    }, [userId]);

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

    // Track views when the card is successfully loaded
    useEffect(() => {
        if (!pageUserInfo || isCurrentUser(userId)) return;

        const trackView = async () => {
            try {
                const viewKey = `viewed_${pageUserInfo.uid}`;
                if (sessionStorage.getItem(viewKey)) return;

                const res = await fetch('/api/track-view', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: pageUserInfo.uid }),
                });

                if (res.ok) {
                    sessionStorage.setItem(viewKey, 'true');
                }
            } catch (err) {
                console.error("Error tracking view:", err);
            }
        };

        trackView();
    }, [pageUserInfo, userId, isCurrentUser]);

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

    const buttonTopClass = "top-4";

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
