import React, { useState } from 'react';
import { getTheme } from './letterThemes';

const MAX_LENGTH = 5000;

export default function LetterWriter({ themeId, onBack, onSent }) {
  const theme = getTheme(themeId);
  const [title, setTitle] = useState('To my favorite person,');
  const [content, setContent] = useState('');
  const [signature, setSignature] = useState('I love you, always.');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!content.trim()) {
      setError("Letter khali hai, kuch to likho 💌");
      return;
    }
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/letters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ themeId, title, content, signature }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to send letter');
      }
      const letter = await res.json();
      onSent(letter);
    } catch (err) {
      setError(err.message || 'Something went wrong, try again');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="writer-wrap">
      <button className="writer-back" onClick={onBack} type="button">
        ← Change theme
      </button>

      <div className="letter-canvas" style={{ backgroundImage: `url(${theme.image})` }}>
        <div
          className="letter-text-area"
          style={{
            top: theme.textArea.top,
            left: theme.textArea.left,
            width: theme.textArea.width,
            height: theme.textArea.height,
          }}
        >
          <input
            className="letter-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              color: theme.textColor,
              fontFamily: theme.fontFamily,
              fontSize: `calc(${theme.fontSize} * 1.15)`,
            }}
            placeholder="To my favorite person,"
            maxLength={100}
          />
          <textarea
            className="letter-content-input"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
            style={{
              color: theme.textColor,
              fontFamily: theme.fontFamily,
              fontSize: theme.fontSize,
              lineHeight: theme.lineHeight,
            }}
            placeholder="Likho jo dil mein hai..."
          />
          <input
            className="letter-signature-input"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            style={{
              color: theme.textColor,
              fontFamily: theme.fontFamily,
              fontSize: theme.fontSize,
            }}
            placeholder="I love you, always."
            maxLength={100}
          />
        </div>
      </div>

      <div className="writer-footer">
        <span className="char-count">{content.length}/{MAX_LENGTH}</span>
        {error && <span className="writer-error">{error}</span>}
        <button
          className="writer-send"
          onClick={handleSend}
          disabled={sending || !content.trim()}
          type="button"
        >
          {sending ? 'Sending...' : 'Send letter 💌'}
        </button>
      </div>

      <style jsx>{`
        .writer-wrap {
          max-width: 480px;
          margin: 0 auto;
          padding: 16px;
        }
        .writer-back {
          background: none;
          border: none;
          color: #8a7a70;
          font-size: 0.85rem;
          margin-bottom: 12px;
          cursor: pointer;
          padding: 0;
        }
        .letter-canvas {
          position: relative;
          width: 100%;
          aspect-ratio: 1146 / 2038;
          background-size: cover;
          background-position: center;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
        }
        .letter-text-area {
          position: absolute;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .letter-title-input,
        .letter-signature-input,
        .letter-content-input {
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          width: 100%;
        }
        .letter-content-input {
          flex: 1;
          font-family: inherit;
        }
        .letter-title-input::placeholder,
        .letter-content-input::placeholder,
        .letter-signature-input::placeholder {
          color: inherit;
          opacity: 0.45;
        }
        .writer-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 14px;
          gap: 10px;
        }
        .char-count {
          font-size: 0.75rem;
          color: #8a7a70;
        }
        .writer-error {
          font-size: 0.8rem;
          color: #e0507a;
        }
        .writer-send {
          margin-left: auto;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, #e0507a, #f5a25d);
          color: white;
          font-weight: 700;
          cursor: pointer;
        }
        .writer-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
