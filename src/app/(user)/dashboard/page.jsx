// app/dashboard/page.js
'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../../context/userContext';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../../../firebase/firebase';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../../utils/getCroppedImg';
import { toast } from 'react-toastify';
import DigitalCard from '../../../components/DigitalCard';

/* Simple debounce helper */
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

const ProfilePage = () => {
  const router = useRouter();
  const { user, userInfo, updateUserInfo } = useUser();
  const [loading, setLoading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    title: '',
    mobile: '',
    email: '',
    businessName: '',
    website: '',
    address: '',
    about: '',
    socialLinks: [],
  });

  /* Sync formData from userInfo */
  useEffect(() => {
    if (userInfo) {
      setFormData({
        firstName: userInfo.firstName || '',
        lastName: userInfo.lastName || '',
        title: userInfo.title || '',
        mobile: userInfo.mobile || '',
        email: userInfo.email || '',
        businessName: userInfo.businessName || '',
        website: userInfo.website || '',
        address: userInfo.address || '',
        about: userInfo.about || '',
        socialLinks: userInfo.socialLinks || [],
      });
    }
  }, [userInfo]);

  const trialDaysRemaining = userInfo?.isTrialActive
    ? Math.max(
        0,
        Math.ceil(
          (new Date(userInfo.trialStartDate?.toDate?.() || userInfo.trialStartDate).getTime() +
            30 * 24 * 60 * 60 * 1000 -
            new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const onCropComplete = useCallback((_, pixels) => setCroppedAreaPixels(pixels), []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeMB = 5;
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please select a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Image size exceeds ${maxSizeMB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const saveCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      toast.info('Uploading avatar...', { autoClose: 2000 });
      const croppedUrl = await getCroppedImg(imageSrc, croppedAreaPixels);
      const imgRef = ref(storage, `avatars/${user.uid}.png`);
      await uploadString(imgRef, croppedUrl, 'data_url');
      const url = await getDownloadURL(imgRef);

      await updateDoc(doc(db, 'users', user.uid), { imgUrl: url });
      updateUserInfo({ imgUrl: url });
      setShowCropper(false);
      setImageSrc(null);
      toast.success('Avatar updated successfully! ✨');
    } catch (error) {
      console.error('Error saving cropped image:', error);
      toast.error('Failed to update avatar. Please try again.');
    }
  };

  const debouncedUpdateUserInfo = useMemo(() => debounce(updateUserInfo, 500), [updateUserInfo]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      debouncedUpdateUserInfo(updated);
      return updated;
    });
  };

  const handleSocialLinkChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedLinks = [...(prev.socialLinks || [])];
      updatedLinks[index] = { ...updatedLinks[index], [field]: value };
      const updated = { ...prev, socialLinks: updatedLinks };
      debouncedUpdateUserInfo(updated);
      return updated;
    });
  };

  const addSocialLink = () => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: [...(prev.socialLinks || []), { platform: '', url: '' }],
    }));
  };

  const removeSocialLink = (index) => {
    setFormData((prev) => {
      const updatedLinks = [...(prev.socialLinks || [])];
      updatedLinks.splice(index, 1);
      return { ...prev, socialLinks: updatedLinks };
    });
  };

  const saveProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      toast.info('Saving profile...', { autoClose: 2000 });
      await updateDoc(doc(db, 'users', user.uid), formData);
      updateUserInfo(formData);
      toast.success('Profile updated successfully! 🎉');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main form area */}
      <div className="flex-1 p-4 lg:pr-[440px]">
        {/* Premium/Trial Banner */}
        <div
          onClick={() => router.push('/payment')}
          className={`mb-6 rounded-xl p-4 text-center text-sm font-semibold text-white shadow-lg cursor-pointer ${
            userInfo?.isPremium
              ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
              : userInfo?.isTrialActive
              ? 'bg-gradient-to-r from-green-500 to-green-700'
              : 'bg-gradient-to-r from-red-500 to-red-700'
          }`}
        >
          {userInfo?.isPremium
            ? "🎉 You're a Premium Member! Manage Your Plan"
            : userInfo?.isTrialActive
            ? `🚀 Free Trial: ${trialDaysRemaining} days left! Upgrade now!`
            : '⚡ Trial ended. Upgrade to Premium to unlock all features!'}
        </div>

        {/* Avatar Upload */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Profile Picture</h2>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <label
              htmlFor="avatarUpload"
              className="relative h-24 w-24 cursor-pointer overflow-hidden rounded-full border-4 border-gray-200 bg-gray-100 hover:border-blue-300"
            >
              {userInfo?.imgUrl && (
                <img src={userInfo.imgUrl} alt="avatar" className="h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 text-white opacity-0 hover:opacity-100">
                <span className="text-xs">{userInfo?.imgUrl ? 'Change' : 'Upload'}</span>
              </div>
            </label>
            <input
              type="file"
              id="avatarUpload"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div>
              <p className="text-sm font-medium text-gray-700">Profile Picture</p>
              <p className="text-xs text-gray-500">JPG, PNG or WebP, max 5MB</p>
            </div>
          </div>
        </div>

         {/* Personal Information */}
          <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Personal Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    className="w-full rounded-lg border text-gray-900 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    className="w-full rounded-lg border text-gray-900 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">
                  Job Title / Profession
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Software Engineer"
                  className="w-full rounded-lg border text-gray-900 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className="w-full rounded-lg border text-gray-900 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                  />
                </div>

                <div>
                  <label htmlFor="mobile" className="mb-2 block text-sm font-medium text-gray-700">
                    Mobile Number
                  </label>
                  <input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="+1 234 567 8900"
                    className="w-full rounded-lg border text-gray-900 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Business Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="businessName" className="mb-2 block text-sm font-medium text-gray-700">
                  Business/Company Name
                </label>
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  placeholder="Acme Corporation"
                  className="w-full rounded-lg border text-gray-900 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                />
              </div>

              <div>
                <label htmlFor="website" className="mb-2 block text-sm font-medium text-gray-700">
                  Website
                </label>
                <input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://yourwebsite.com"
                  className="w-full rounded-lg border text-gray-900 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                />
              </div>

              <div>
                <label htmlFor="address" className="mb-2 block text-sm font-medium text-gray-700">
                  Business Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="123 Business St, City, State 12345"
                  className="w-full rounded-lg border text-gray-900 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                />
              </div>

              <div>
                <label htmlFor="about" className="mb-2 block text-sm font-medium text-gray-700">
                  About / Bio
                </label>
                <textarea
                  id="about"
                  name="about"
                  value={formData.about}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Tell people about yourself or your business..."
                  className="w-full rounded-lg border text-gray-900 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                />
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="mb-20 rounded-xl bg-white p-6 shadow-sm md:mb-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Social Media Links</h2>
              <button
                type="button"
                onClick={addSocialLink}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Add Link
              </button>
            </div>

            <div className="space-y-4">
              {formData.socialLinks.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-8">
                  No social links added yet. Click "Add Link" to get started.
                </p>
              ) : (
                formData.socialLinks.map((link, index) => (
                  <div key={index} className="rounded-lg border border-gray-200 p-4">
                    <div className="space-y-3">
                      <select
                        value={link.platform}
                        onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                        className="w-full text-gray-900 rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                      >
                        <option value="">Select Platform</option>
                        <option value="Instagram">📷 Instagram</option>
                        <option value="YouTube">📺 YouTube</option>
                        <option value="LinkedIn">💼 LinkedIn</option>
                        <option value="Twitter">🐦 Twitter</option>
                        <option value="Facebook">📘 Facebook</option>
                        <option value="WhatsApp">💬 WhatsApp</option>
                        <option value="TikTok">🎵 TikTok</option>
                        <option value="Pinterest">📌 Pinterest</option>
                        <option value="Snapchat">👻 Snapchat</option>
                        <option value="Website">🌐 Website</option>
                        <option value="Custom">⚙️ Custom</option>
                      </select>

                      <input
                        type="url"
                        placeholder="https://yourprofile.com"
                        value={link.url}
                        onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                        className="w-full rounded-lg border text-gray-900 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                      />

                      <button
                        type="button"
                        onClick={() => removeSocialLink(index)}
                        className="w-full rounded-lg border border-red-300 bg-red-50 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
                      >
                        Remove Link
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        {/* Mobile Preview Toggle */}
        <div className="mb-6 md:hidden">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="w-full rounded-lg bg-gray-200 py-2 text-sm"
          >
            {showPreview ? 'Hide Live Preview' : 'Show Live Preview'}
          </button>
          {showPreview && (
            <div className="mt-4 mx-auto w-[375px] rounded-3xl border-8 border-gray-300 shadow-lg overflow-y-auto max-h-[600px] bg-white">
              <DigitalCard userInfo={{ ...userInfo, ...formData }} />
            </div>
          )}
        </div>

        {/* Desktop Save Button */}
    <div className="hidden md:flex justify-end mb-6">
      <button
        onClick={saveProfile}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </div>

    {/* Mobile Save Button (fixed at bottom) */}
    <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg md:hidden">
      <button
        onClick={saveProfile}
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 py-4 text-white font-semibold disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </div>
      </div>

      {/* Desktop Preview Panel */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:right-4 lg:top-4 lg:w-[400px] lg:h-[calc(100vh-2rem)] rounded-3xl border-8 border-gray-300 bg-white shadow-lg">
        <header className="p-4 border-b">
          <h3 className="text-center text-lg font-semibold">Live Preview</h3>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto w-[375px] rounded-3xl overflow-hidden">
            <DigitalCard userInfo={{ ...userInfo, ...formData }} />
          </div>
        </div>
        <footer className="p-4 border-t text-xs text-center text-gray-500">
          Mobile device simulation
        </footer>
      </aside>

      {/* Cropper Modal */}
      {showCropper && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="relative bg-white rounded-xl p-6 shadow-2xl max-w-lg w-full h-[80vh] flex flex-col">
            <h3 className="mb-4 text-center text-lg font-semibold text-gray-900">Crop Your Photo</h3>
            <div className="flex-1 relative">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="round"
                showGrid={false}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 border py-2 rounded-lg"
                onClick={() => setShowCropper(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
                onClick={saveCroppedImage}
              >
                Save Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
