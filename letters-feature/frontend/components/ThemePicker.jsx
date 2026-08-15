import React from 'react';
import { THEME_LIST } from './letterThemes';

export default function ThemePicker({ selectedThemeId, onSelect, onNext }) {
  return (
    <div className="theme-picker">
      <h2 className="theme-picker-title">Pick a theme for your letter</h2>
      <p className="theme-picker-subtitle">She'll see this the moment she opens it</p>

      <div className="theme-grid">
        {THEME_LIST.map((theme) => (
          <button
            key={theme.id}
            className={`theme-card ${selectedThemeId === theme.id ? 'theme-card--selected' : ''}`}
            onClick={() => onSelect(theme.id)}
            type="button"
          >
            <img src={theme.image} alt={theme.name} className="theme-card-img" />
            <span className="theme-card-name">{theme.name}</span>
            {selectedThemeId === theme.id && (
              <span className="theme-card-check">✓</span>
            )}
          </button>
        ))}
      </div>

      <button
        className="theme-picker-next"
        disabled={!selectedThemeId}
        onClick={onNext}
        type="button"
      >
        Continue to write →
      </button>

      <style jsx>{`
        .theme-picker {
          padding: 24px 16px 40px;
          max-width: 720px;
          margin: 0 auto;
        }
        .theme-picker-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2b1a12;
          margin-bottom: 4px;
        }
        .theme-picker-subtitle {
          color: #8a7a70;
          margin-bottom: 20px;
          font-size: 0.9rem;
        }
        .theme-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 14px;
        }
        .theme-card {
          position: relative;
          border: 2px solid transparent;
          border-radius: 12px;
          overflow: hidden;
          padding: 0;
          cursor: pointer;
          background: #f5f0e8;
          transition: transform 0.15s ease, border-color 0.15s ease;
        }
        .theme-card:hover {
          transform: translateY(-2px);
        }
        .theme-card--selected {
          border-color: #e0507a;
        }
        .theme-card-img {
          width: 100%;
          height: 160px;
          object-fit: cover;
          display: block;
        }
        .theme-card-name {
          display: block;
          padding: 8px 6px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #4a2c1f;
          text-align: center;
        }
        .theme-card-check {
          position: absolute;
          top: 6px;
          right: 6px;
          background: #e0507a;
          color: white;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
        }
        .theme-picker-next {
          margin-top: 24px;
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #e0507a, #f5a25d);
          color: white;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
        }
        .theme-picker-next:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
