import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, facebookProvider, instagramProvider } from '../firebaseConfig';

const AuthContext = createContext(null);

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// ── Silent token refresh ──────────────────────────────────────────────────
// Calls /api/auth/refresh (uses HttpOnly cookie automatically).
// Returns new access token or null if refresh token is expired/invalid.
async function silentRefresh() {
  try {
    const res = await fetch(`${API}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // sends HttpOnly cookie
    });
    if (!res.ok) return null;
    const { token } = await res.json();
    return token;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer          = useRef(null); // holds the setTimeout id

  // ── Schedule next silent refresh 14 minutes from now (token lasts 15m) ──
  const scheduleRefresh = useCallback(() => {
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(async () => {
      const newToken = await silentRefresh();
      if (newToken) {
        localStorage.setItem('token', newToken);
        scheduleRefresh(); // schedule the next one
      } else {
        // Refresh token expired — log the user out gracefully
        localStorage.removeItem('token');
        setUser(null);
      }
    }, 14 * 60 * 1000); // 14 minutes
  }, []);

  // ── On mount: try existing token, if 401 try silent refresh ──────────────
  useEffect(() => {
    const bootstrap = async () => {
      let token = localStorage.getItem('token');

      if (token) {
        // Try existing token
        let res = await fetch(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }).catch(() => null);

        if (res?.status === 401) {
          // Access token expired — silently get a new one
          token = await silentRefresh();
          if (token) localStorage.setItem('token', token);
        }

        if (token) {
          res = await fetch(`${API}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include',
          }).catch(() => null);

          if (res?.ok) {
            const userData = await res.json();
            setUser(userData);
            scheduleRefresh();
          } else {
            localStorage.removeItem('token');
          }
        }
      }

      setLoading(false);
    };

    bootstrap();
    return () => clearTimeout(refreshTimer.current);
  }, [scheduleRefresh]);

  // ── Login ──────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const res  = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // receive HttpOnly cookie
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');

    localStorage.setItem('token', data.token);
    setUser({ 
      _id: data._id, 
      name: data.name, 
      email: data.email, 
      avatarUrl: data.avatarUrl,
      role: data.role,
      relationshipStartDate: data.relationshipStartDate
    });
    scheduleRefresh();
  };

  // ── Social Login ───────────────────────────────────────────────────────
  const signInWithSocial = async (providerName) => {
    let provider;
    if (providerName === 'google') provider = googleProvider;
    else if (providerName === 'facebook') provider = facebookProvider;
    else if (providerName === 'instagram') provider = instagramProvider;
    else throw new Error('Unknown provider');

    try {
      // 1. Sign in with Firebase popup
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      // 2. Send the Firebase token to our custom backend
      const res = await fetch(`${API}/api/auth/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken }),
        credentials: 'include',
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Social login failed');

      // 3. Set the custom session from our backend
      localStorage.setItem('token', data.token);
      setUser({ 
        _id: data._id, 
        name: data.name, 
        email: data.email, 
        avatarUrl: data.avatarUrl,
        role: data.role,
        relationshipStartDate: data.relationshipStartDate
      });
      scheduleRefresh();
    } catch (err) {
      console.error("Social login error:", err);
      // Firebase throws errors with a code property
      if (err.code === 'auth/popup-closed-by-user') {
         throw new Error('Sign in popup was closed.');
      }
      throw new Error(err.message || 'Social login failed');
    }
  };

  // ── Register ───────────────────────────────────────────────────────────
  const register = async (name, email, password) => {
    const res  = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) {
      // Surface validation errors nicely if backend returned them
      const msg = data.errors?.map((e) => e.message).join(', ') || data.message || 'Registration failed';
      throw new Error(msg);
    }

    localStorage.setItem('token', data.token);
    setUser({ 
      _id: data._id, 
      name: data.name, 
      email: data.email, 
      avatarUrl: data.avatarUrl,
      role: data.role,
      relationshipStartDate: data.relationshipStartDate
    });
    scheduleRefresh();
  };

  // ── Logout ─────────────────────────────────────────────────────────────
  const logout = async () => {
    clearTimeout(refreshTimer.current);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include', // clears the HttpOnly cookie server-side
      });
    } catch { /* ignore network errors on logout */ }

    localStorage.removeItem('token');
    setUser(null);
  };

  const updateRelationshipDate = (date) => {
    setUser(prev => ({ ...prev, relationshipStartDate: date }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateRelationshipDate, signInWithSocial, backendUrl: API }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
