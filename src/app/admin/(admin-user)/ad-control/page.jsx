'use client'
import React, { useState, useEffect } from "react";
import ProgressIndicator from "../../../../components/ProgressIndicator";
import { getAdBannerSettings, updateAdBannerSettings } from "../../../../services/adService";
import { 
  Monitor, 
  Smartphone, 
  Upload, 
  Trash2, 
  Save, 
  Link, 
  Image as ImageIcon,
  Settings,
  Eye,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const AdControl = () => {
  const [isLoading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [adSettings, setAdSettings] = useState({
    type: "manual",
    imageDesktop: "",
    imageDesktop2: "",
    imageMobile: "",
    imageMobile2: "",
    link: "",
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const settings = await getAdBannerSettings();
        if (settings) setAdSettings(settings);
      } catch (error) {
        console.error('Error fetching ad settings:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setAdSettings({ ...adSettings, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setAdSettings((prev) => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageDelete = (field) => {
    setAdSettings((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await updateAdBannerSettings(adSettings);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating ad settings:', error);
      alert('Failed to update settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const ImageUploadField = ({ label, field, dimensions, icon: Icon }) => (
    <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 transition-all duration-300 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
          <p className="text-sm text-gray-500">Recommended: {dimensions}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, field)}
            className="hidden"
            id={`upload-${field}`}
          />
          <label
            htmlFor={`upload-${field}`}
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-4 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
            </div>
          </label>
        </div>

        {adSettings[field] && (
          <div className="relative bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Preview</span>
              </div>
              <button
                type="button"
                onClick={() => handleImageDelete(field)}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
            <div className="w-full bg-white rounded-lg border border-gray-200 p-2">
              <img
                src={adSettings[field]}
                alt={`${label} Preview`}
                className="w-full h-auto max-h-32 object-contain rounded"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <ProgressIndicator />
          <p className="text-center text-gray-600 mt-4">Loading ad settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ad Banner Settings</h1>
              <p className="text-gray-600">Manage your website's advertisement banners</p>
            </div>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-green-800 font-medium">Settings updated successfully!</p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Ad Type Selection */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Advertisement Type</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                adSettings.type === 'manual' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="type"
                  value="manual"
                  checked={adSettings.type === 'manual'}
                  onChange={handleChange}
                  className="absolute top-4 right-4"
                />
                <div className="flex items-center space-x-3">
                  <ImageIcon className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Manual Upload</h3>
                    <p className="text-sm text-gray-600">Upload custom images with direct links</p>
                  </div>
                </div>
              </div>

              <div className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                adSettings.type === 'google' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="type"
                  value="google"
                  checked={adSettings.type === 'google'}
                  onChange={handleChange}
                  className="absolute top-4 right-4"
                />
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-yellow-500 rounded text-white text-xs flex items-center justify-center font-bold">G</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Google AdSense</h3>
                    <p className="text-sm text-gray-600">Automated ads from Google AdSense</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Ad Settings */}
          {adSettings.type === "manual" && (
            <>
              {/* Banner Link */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Link className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Banner Link</h2>
                </div>

                <div className="relative">
                  <input
                    type="url"
                    name="link"
                    value={adSettings.link}
                    onChange={handleChange}
                    placeholder="https://yourlink.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Link className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Enter the URL that users will be redirected to when they click the banner</p>
              </div>

              {/* Desktop Banners */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Desktop Banners</h2>
                </div>

                <div className="space-y-6">
                  <ImageUploadField
                    label="Primary Desktop Banner"
                    field="imageDesktop"
                    dimensions="1920x100px"
                    icon={Monitor}
                  />
                  <ImageUploadField
                    label="Secondary Desktop Banner"
                    field="imageDesktop2"
                    dimensions="1920x100px"
                    icon={Monitor}
                  />
                </div>
              </div>

              {/* Mobile Banners */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Mobile Banners</h2>
                </div>

                <div className="space-y-6">
                  <ImageUploadField
                    label="Primary Mobile Banner"
                    field="imageMobile"
                    dimensions="320x50px"
                    icon={Smartphone}
                  />
                  <ImageUploadField
                    label="Secondary Mobile Banner"
                    field="imageMobile2"
                    dimensions="320x50px"
                    icon={Smartphone}
                  />
                </div>
              </div>
            </>
          )}

          {/* Google AdSense Info */}
          {adSettings.type === "google" && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Google AdSense Configuration</h2>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">AdSense Setup Required</h3>
                    <p className="text-blue-800 mb-4">
                      To use Google AdSense, you need to configure your AdSense account and add the appropriate 
                      ad units to your website template. This setting will enable automatic ad serving once configured.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      <li>Ensure your AdSense account is approved and active</li>
                      <li>Create ad units for banner placements</li>
                      <li>Add the AdSense code to your website template</li>
                      <li>Test ad display before going live</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <p className="text-gray-600">Changes will be applied immediately after saving</p>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className={`
                  flex items-center space-x-3 px-8 py-3 rounded-lg font-semibold text-white
                  transition-all duration-300 transform hover:scale-105
                  ${isSaving 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                  }
                `}
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdControl;
