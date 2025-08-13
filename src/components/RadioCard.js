// components/RadioCard.js
import React from 'react';
// import './RadioCard.css'; // You'll create this CSS file

function RadioCard({ id, title, description, isSelected, onSelect, isPremium, canAccessPremiumFeatures }) {
  const isDisabled = isPremium && !canAccessPremiumFeatures;

  const handleClick = () => {
    if (!isDisabled) {
      onSelect(id);
    }
  };

  return (
    <div
      className={`radio-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
      onClick={handleClick}
      role="radio"
      aria-checked={isSelected}
      tabIndex={isDisabled ? -1 : 0} // Disable tabbing if locked
      aria-disabled={isDisabled}
    >
      <div className="radio-card-content">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      {isSelected && <span className="radio-indicator"></span>} {/* Visually selected dot */}
      {isPremium && !canAccessPremiumFeatures && (
        <div className="premium-overlay">
          <span>🔒 Premium</span>
        </div>
      )}
    </div>
  );
}

export default RadioCard;