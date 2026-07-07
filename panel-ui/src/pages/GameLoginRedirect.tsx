import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * This page is loaded in a hidden iframe from the game client.
 * It reads the game JWT from URL params, calls the panel's /auth/game-login,
 * stores the tokens, then redirects to the dashboard.
 */
export default function GameLoginRedirect() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Logging in...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameToken = params.get('token');
    const secret = params.get('secret');

    if (!gameToken || !secret) {
      setStatus('Missing token');
      return;
    }

    fetch('/api/auth/game-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-game-token': gameToken,
        'x-panel-secret': secret,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Login failed');
        return res.json();
      })
      .then((data) => {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        setStatus('Success! Redirecting...');
        // Redirect to dashboard after a short delay
        setTimeout(() => navigate('/'), 1000);
      })
      .catch((err) => {
        setStatus(`Error: ${err.message}`);
      });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black/50">
      <div className="text-center p-6 rounded-xl bg-white/10">
        <p className="text-white text-sm">{status}</p>
      </div>
    </div>
  );
}
