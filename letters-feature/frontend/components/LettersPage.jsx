import React, { useEffect, useState } from 'react';
import ThemePicker from './ThemePicker';
import LetterWriter from './LetterWriter';
import { getTheme } from './letterThemes';

// view states: 'list' | 'pick-theme' | 'write' | 'read'
export default function LettersPage() {
  const [view, setView] = useState('list');
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedThemeId, setSelectedThemeId] = useState(null);
  const [openLetter, setOpenLetter] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(
    localStorage.getItem('userId')
  );

  useEffect(() => {
    fetchLetters();
  }, []);

  const fetchLetters = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/letters', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      setLetters(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load letters', err);
    } finally {
      setLoading(false);
    }
  };

  const openLetterView = async (letter) => {
    // fetch single letter so it gets marked as read on the backend
    try {
      const res = await fetch(`/api/letters/${letter._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const fresh = await res.json();
      setOpenLetter(fresh);
      setView('read');
      // refresh list in background so unread badge updates
      fetchLetters();
    } catch (err) {
      console.error('Failed to open letter', err);
    }
  };

  const handleSent = (letter) => {
    setLetters((prev) => [letter, ...prev]);
    setView('list');
    setSelectedThemeId(null);
  };

  if (view === 'pick-theme') {
    return (
      <ThemePicker
        selectedThemeId={selectedThemeId}
        onSelect={setSelectedThemeId}
        onNext={() => setView('write')}
      />
    );
  }

  if (view === 'write') {
    return (
      <LetterWriter
        themeId={selectedThemeId}
        onBack={() => setView('pick-theme')}
        onSent={handleSent}
      />
    );
  }

  if (view === 'read' && openLetter) {
    const theme = getTheme(openLetter.themeId);
    return (
      <div className="reader-wrap">
        <button className="reader-back" onClick={() => setView('list')} type="button">
          ← Back to letters
        </button>
        <div className="letter-canvas" style={{ backgroundImage: `url(${theme.image})` }}>
          <div
            className="letter-text-area"
            style={{
              top: theme.textArea.top,
              left: theme.textArea.left,
              width: theme.textArea.width,
              height: theme.textArea.height,
              color: theme.textColor,
              fontFamily: theme.fontFamily,
              fontSize: theme.fontSize,
              lineHeight: theme.lineHeight,
            }}
          >
            <p className="reader-title">{openLetter.title}</p>
            <p className="reader-content">{openLetter.content}</p>
            <p className="reader-signature">{openLetter.signature}</p>
          </div>
        </div>
        <style jsx>{`
          .reader-wrap { max-width: 480px; margin: 0 auto; padding: 16px; }
          .reader-back { background: none; border: none; color: #8a7a70; font-size: 0.85rem; margin-bottom: 12px; cursor: pointer; padding: 0; }
          .letter-canvas { position: relative; width: 100%; aspect-ratio: 1146 / 2038; background-size: cover; background-position: center; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
          .letter-text-area { position: absolute; overflow-y: auto; white-space: pre-wrap; }
          .reader-title { font-weight: 700; margin-bottom: 10px; }
          .reader-content { margin-bottom: 14px; }
          .reader-signature { font-weight: 600; text-align: right; }
        `}</style>
      </div>
    );
  }

  // default: list view
  return (
    <div className="letters-list-wrap">
      <div className="letters-list-header">
        <h2>Messages</h2>
        <button
          className="new-letter-btn"
          onClick={() => setView('pick-theme')}
          type="button"
        >
          + Write a letter
        </button>
      </div>

      {loading && <p className="letters-empty">Loading...</p>}

      {!loading && letters.length === 0 && (
        <div className="letters-empty">
          <p>Koi letter nahi hai abhi.</p>
          <p>Pehla letter likho na 💌</p>
        </div>
      )}

      <div className="letters-list">
        {letters.map((letter) => {
          const theme = getTheme(letter.themeId);
          const isIncoming = letter.receiver._id === currentUserId;
          const isUnread = isIncoming && !letter.isRead;
          return (
            <button
              key={letter._id}
              className="letter-row"
              onClick={() => openLetterView(letter)}
              type="button"
            >
              <img src={theme.image} alt="" className="letter-row-thumb" />
              <div className="letter-row-info">
                <span className="letter-row-title">
                  {letter.title || 'A letter'}
                  {isUnread && <span className="unread-dot" />}
                </span>
                <span className="letter-row-meta">
                  {isIncoming ? `From ${letter.sender.name}` : `To ${letter.receiver.name}`}
                  {' · '}
                  {new Date(letter.createdAt).toLocaleDateString()}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .letters-list-wrap { max-width: 600px; margin: 0 auto; padding: 20px 16px; }
        .letters-list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
        .letters-list-header h2 { font-size: 1.4rem; color: #2b1a12; }
        .new-letter-btn { padding: 10px 16px; border: none; border-radius: 8px; background: linear-gradient(135deg, #e0507a, #f5a25d); color: white; font-weight: 700; font-size: 0.85rem; cursor: pointer; }
        .letters-empty { text-align: center; color: #8a7a70; padding: 40px 0; }
        .letters-list { display: flex; flex-direction: column; gap: 10px; }
        .letter-row { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 10px; text-align: left; cursor: pointer; }
        .letter-row-thumb { width: 48px; height: 60px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
        .letter-row-info { display: flex; flex-direction: column; gap: 3px; overflow: hidden; }
        .letter-row-title { font-weight: 600; color: #2b1a12; display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .letter-row-meta { font-size: 0.78rem; color: #8a7a70; }
        .unread-dot { width: 8px; height: 8px; border-radius: 50%; background: #e0507a; flex-shrink: 0; }
      `}</style>
    </div>
  );
}
