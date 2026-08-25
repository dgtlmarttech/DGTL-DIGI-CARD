'use client';
import React, { useState } from 'react';
import { useUser } from '../../../../context/userContext';
import { useRouter } from 'next/navigation';
import ProgressIndicator from '../../../../components/ProgressIndicator';
import DigitalCard from '../../../../components/DigitalCard';
import ContactCard from '../../../../components/template/card1';
import ContactCard2 from '../../../../components/template/card2';
import ContactCard3 from '../../../../components/template/card3';
import { toast } from 'react-toastify';
import { 
    ExternalLink, 
    Share2, 
    MoreHorizontal, 
    CreditCard, 
    Smartphone, 
    Copy, 
    Edit2, 
    Palette, 
    Link as LinkIcon,
    ChevronRight
} from 'lucide-react';

export default function ViewCardPage() {
    const { userInfo, loading } = useUser();
    const router = useRouter();
    const [viewMode, setViewMode] = useState('card'); // 'card' | 'mobile'

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <ProgressIndicator />
            </div>
        );
    }

    if (!userInfo) return null;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://my.dgtldigicard.com';
    const publicUrl = `${baseUrl}/${userInfo?.customUID || userInfo?.uid}`;
    // Strip http/https for display
    const displayUrl = publicUrl.replace(/^https?:\/\//, '');

    const handleCopyLink = () => {
        navigator.clipboard.writeText(publicUrl);
        toast.success("Link copied to clipboard!");
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Digital Business Card',
                    text: 'Check out my digital business card!',
                    url: publicUrl,
                });
            } else {
                handleCopyLink();
            }
        } catch (error) {
            console.error("Error sharing:", error);
        }
    };

    const renderCard = () => {
        const style = userInfo.hasAccess ? userInfo.cardStyle || "default" : "default";
        const props = { userInfo: userInfo, isPreview: true };
        
        switch (style) {
            case "style1": return <ContactCard {...props} />;
            case "style2": return <ContactCard2 {...props} />;
            case "style3": return <ContactCard3 {...props} />;
            default: return <DigitalCard {...props} />;
        }
    };

    return (
        <div className="flex flex-col w-full pb-24 text-slate-800">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">Your Digital Card</h1>
                    <p className="text-sm text-slate-500">Preview how your card appears to visitors.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.open(publicUrl, '_blank')}
                        className="flex items-center gap-2 bg-[#6b46c1] hover:bg-[#553c9a] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                        Open Public Link <ExternalLink className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={handleShare}
                        className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-sm"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                    <button className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-sm">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Preview */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                                Digital Card Preview
                            </h2>
                            <div className="flex items-center p-1 bg-slate-50 border border-slate-200 rounded-xl">
                                <button 
                                    onClick={() => setViewMode('card')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'card' ? 'bg-[#f3f0ff] text-[#6b46c1]' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <CreditCard className="w-4 h-4" /> Card View
                                </button>
                                <button 
                                    onClick={() => setViewMode('mobile')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'mobile' ? 'bg-[#f3f0ff] text-[#6b46c1]' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Smartphone className="w-4 h-4" /> Mobile View
                                </button>
                            </div>
                        </div>

                        {/* Card Container */}
                        <div className="flex items-start justify-center min-h-[600px] w-full pt-4">
                            <div className={`transition-all duration-300 ${viewMode === 'mobile' ? 'w-[375px] max-w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-slate-100 bg-white h-[700px]' : 'w-full bg-white rounded-3xl overflow-hidden'}`}>
                                <div className={viewMode === 'mobile' ? "h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" : ""}>
                                    {renderCard()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Status & Actions */}
                <div className="lg:col-span-1 space-y-6">
                    
                    {/* Status Box */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Card Status</h3>
                        
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="flex items-center justify-center w-4 h-4 bg-green-100 rounded-full">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                </span>
                                <span className="text-sm font-bold text-green-600">Live</span>
                            </div>
                            <p className="text-sm text-slate-500">Your card is live and visible to everyone.</p>
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-slate-700 mb-2">Public Link</p>
                            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                <span className="text-sm font-medium text-[#6b46c1] truncate mr-3">{displayUrl}</span>
                                <button onClick={handleCopyLink} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Box */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                        <div className="flex flex-col space-y-2">
                            <button onClick={() => router.push('/dashboard')} className="flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-xl transition-colors group border border-transparent hover:border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#f3f0ff] text-[#6b46c1] rounded-lg group-hover:bg-[#e9d8fd] transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Edit Card</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                            </button>

                            <button onClick={() => router.push('/dashboard/appearance')} className="flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-xl transition-colors group border border-transparent hover:border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-50 text-orange-500 rounded-lg group-hover:bg-orange-100 transition-colors">
                                        <Palette className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Change Card Style</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                            </button>

                            <button onClick={handleCopyLink} className="flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-xl transition-colors group border border-transparent hover:border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-100 transition-colors">
                                        <LinkIcon className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Copy Public Link</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                            </button>

                            <button onClick={() => setViewMode('mobile')} className="flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-xl transition-colors group border border-transparent hover:border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-500 rounded-lg group-hover:bg-blue-100 transition-colors">
                                        <Smartphone className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">View on Mobile</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
