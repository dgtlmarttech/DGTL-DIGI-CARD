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
    <div className={`min-h-screen ${pageUserInfo.effectiveIsPremium ? "bg-gradient-to-br from-purple-50 to-blue-50" : "bg-gray-50"}`}>
      {isCurrentUser(userId) && (
        <div className="fixed top-4 right-4 z-50">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            onClick={() => router.push("/dashboard")}
          >
            Visit Dashboard
          </button>
        </div>
      )}
      <div className="container mx-auto">{renderCard()}</div>
    </div>
  );
}
