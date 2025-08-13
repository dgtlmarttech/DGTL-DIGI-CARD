'use client'
import React, { useState, useEffect } from "react";
import ProgressIndicator from "../../../../components/ProgressIndicator";
import { getAdBannerSettings, updateAdBannerSettings } from "../../../../services/adService";
import "./AdControl.css"; // Import CSS file

const AdControl = () => {
  const [isLoading, setLoading] = useState(true);
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
      const settings = await getAdBannerSettings();
      if (settings) setAdSettings(settings);
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setAdSettings({ ...adSettings, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
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
    setLoading(true);
    await updateAdBannerSettings(adSettings);
    setLoading(false);
    alert("Ad banner settings updated.");
  };

  return (
    <div className="admin-container">
      <div className="admin-card">
        <h2 className="admin-title">Ad Banner Settings</h2>
        {isLoading ? (
          <ProgressIndicator />
        ) : (
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label>Ad Type:</label>
              <select
                name="type"
                value={adSettings.type}
                onChange={handleChange}
                className="input-field"
              >
                <option value="manual">Manual (Image & Link)</option>
                <option value="google">Google AdSense</option>
              </select>
            </div>

            {adSettings.type === "manual" && (
              <>
                <div className="form-group">
                  <label>Banner Link:</label>
                  <input
                    type="text"
                    name="link"
                    value={adSettings.link}
                    onChange={handleChange}
                    placeholder="https://yourlink.com"
                    className="input-field"
                  />
                </div>

                {/* Desktop Primary */}
                <div className="form-group">
                  <label>Desktop Banner Image (Primary) 1920x100:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "imageDesktop")}
                    className="file-input"
                  />
                  {adSettings.imageDesktop && (
                    <div className="desktop-preview">
                      <img src={adSettings.imageDesktop} alt="Desktop Preview" />
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => handleImageDelete("imageDesktop")}
                      >
                        Delete Image
                      </button>
                    </div>
                  )}
                </div>

                {/* Desktop Secondary */}
                <div className="form-group">
                  <label>Desktop Banner Image (Secondary) 1920x100:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "imageDesktop2")}
                    className="file-input"
                  />
                  {adSettings.imageDesktop2 && (
                    <div className="desktop-preview">
                      <img src={adSettings.imageDesktop2} alt="Desktop Secondary Preview" />
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => handleImageDelete("imageDesktop2")}
                      >
                        Delete Image
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Primary */}
                <div className="form-group">
                  <label>Mobile Banner Image (Primary) 320x50:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "imageMobile")}
                    className="file-input"
                  />
                  {adSettings.imageMobile && (
                    <div className="mobile-preview">
                      <img src={adSettings.imageMobile} alt="Mobile Preview" />
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => handleImageDelete("imageMobile")}
                      >
                        Delete Image
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Secondary */}
                <div className="form-group">
                  <label>Mobile Banner Image (Secondary) 320x50:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "imageMobile2")}
                    className="file-input"
                  />
                  {adSettings.imageMobile2 && (
                    <div className="mobile-preview">
                      <img src={adSettings.imageMobile2} alt="Mobile Secondary Preview" />
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => handleImageDelete("imageMobile2")}
                      >
                        Delete Image
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            <button type="submit" className="save-button">
              Save Settings
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdControl;
