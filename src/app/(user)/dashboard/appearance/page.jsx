// app/dashboard/appearance/page.js 
'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '../../../../context/userContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/firebase';
import { toast } from 'react-toastify';
import DigitalCard from '../../../../components/DigitalCard';
import ContactCard from '../../../../components/template/card1';
import ContactCard2 from '../../../../components/template/card2';
import ContactCard3 from '../../../../components/template/card3';

const cardStylesOptions = [
  { id: 'default', title: 'Classic', description: 'Simple & Clean', preview: '📄' },
  { id: 'style1', title: 'Radiant', description: 'Bright & Modern', preview: '✨' },
  { id: 'style2', title: 'Sleek', description: 'Minimal & Sophisticated', preview: '💎' },
  { id: 'style3', title: 'Heritage', description: 'Classic & Elegant', preview: '🏛️' },
];

const predefinedColors = [
  '#1187ac', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#84cc16', '#06b4d', '#636f', '#d946ef',
];

const Appearance = () => {
  const { user, userInfo, updateUserInfo } = useUser();
  const [loading, setLoading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('default');
  const [cardColor, setCardColor] = useState('#1187ac');
  const [showPreview, setShowPreview] = useState(false);



  useEffect(() => {
    if (userInfo) {
      setSelectedStyle(userInfo.cardStyle || 'default');
      setCardColor(userInfo.cardColor || '#1187ac');
    }
  }, [userInfo]);

  const handleStyleSelect = (styleId) => {
    const option = cardStylesOptions.find(opt => opt.id === styleId);
    if (option) setSelectedStyle(styleId);
  };

  const handleColorChange = (color) => setCardColor(color);

  const saveAppearance = async () => {
    if (!user) return;
    try {
      setLoading(true);
      toast.info('Saving appearance...', { autoClose: 2000 });
      const data = { cardStyle: selectedStyle, cardColor };
      await updateDoc(doc(db, 'users', user.uid), data);
      updateUserInfo(data);
      toast.success('Appearance updated successfully!');
    } catch {
      toast.error('Failed to save appearance');
    } finally {
      setLoading(false);
    }
  };

  const renderCard = () => {
    const cardProps = { ...userInfo, cardStyle: selectedStyle, cardColor };
    switch(selectedStyle) {
      case 'style1': return <ContactCard userInfo={cardProps} isPreview={true} />;
      case 'style2': return <ContactCard2 userInfo={cardProps} isPreview={true} />;
      case 'style3': return <ContactCard3 userInfo={cardProps} isPreview={true} />;
      default: return <DigitalCard userInfo={cardProps} isPreview={true} />;
    }
  };

  return (
    <div className="flex w-full">
      {/* Main content/form */}
      <main className="flex-1 w-full xl:pr-[450px] pb-24 xl:pb-4">
        {/* Style Selection */}
        <section className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Choose Your Style</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cardStylesOptions.map(option => (
              <div
                key={option.id}
                onClick={() => handleStyleSelect(option.id)}
                className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200
                  ${selectedStyle === option.id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{option.preview}</div>
                  <h3 className="font-semibold text-gray-900">{option.title}</h3>
                  <p className="text-gray-600 text-sm">{option.description}</p>
                  {selectedStyle === option.id && (
                    <div className="mt-3 inline-flex justify-center">
                      <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 01-1.414 1.414L9 10.414 6.707 8.12A1 1 0 015.293 6.707l4 4z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Color Selection */}
        {selectedStyle === 'default' && (
          <section className="mb-6 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Theme Color</h2>
            <div className="mb-4">
              <p className="text-sm font-medium mb-2 text-gray-700">Preset Colors</p>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                {predefinedColors.map(color => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`h-10 w-10 rounded-full transition hover:scale-110 focus:outline-none border-2 ${cardColor === color ? 'border-gray-400' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  >
                    {cardColor === color && (
                      <svg className="mx-auto h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 01-1.414 1.414L9 10.414 6.707 8.12A1 1 0 015.293 6.707l4 4z" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="color"
                value={cardColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-12 h-12 p-0 border rounded cursor-pointer border-gray-300"
              />
              <input
                type="text"
                value={cardColor}
                onChange={(e) => handleColorChange(e.target.value)}
                placeholder="#1187ac"
                className="flex-grow border rounded p-2 font-mono text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </section>
        )}

        {/* Desktop Save Button */}
        <div className="mb-6 hidden justify-end md:flex">
          <button
            onClick={saveAppearance}
            disabled={loading}
            className="rounded bg-blue-600 px-8 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Mobile Preview Toggle */}
        <section className="mb-6 xl:hidden">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="w-full rounded-lg bg-gray-200 py-2 text-sm"
          >
            {showPreview ? 'Hide Live Preview' : 'Show Live Preview'}
          </button>
          {showPreview && (
            <div className="mt-4 mx-auto w-full max-w-[375px] rounded-3xl border-8 border-gray-300 shadow-lg overflow-y-auto max-h-[600px] bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {renderCard()}
            </div>
          )}
        </section>

        {/* Mobile Save Button */}
        <section className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg xl:hidden z-40">
          <button
            onClick={saveAppearance}
            disabled={loading}
            className="w-full bg-blue-600 rounded py-4 text-white font-semibold disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </section>
      </main>

      {/* Desktop Live Preview */}
      <aside className="hidden xl:flex xl:flex-col xl:fixed xl:right-8 xl:top-[104px] xl:w-[420px] xl:h-[calc(100vh-8.5rem)] rounded-3xl border-8 border-gray-300 bg-white shadow-lg z-30">
        <header className="p-4">
          <h3 className="text-center text-lg font-semibold">Live Preview</h3>
        </header>
        <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="mx-auto w-full max-w-[375px] rounded-3xl overflow-hidden shadow-sm">
            {renderCard()}
          </div>
        </div>
        <footer className="p-4 text-xs text-center text-gray-500">
          Mobile device simulation
        </footer>
      </aside>
    </div>
  );
};

export default Appearance;
