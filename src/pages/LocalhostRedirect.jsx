import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

function LocalhostRedirect() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Obtener todos los parámetros de la URL
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');
    const expiresAt = searchParams.get('expires_at');
    const expiresIn = searchParams.get('expires_in');
    const tokenType = searchParams.get('token_type');

    // Construir la nueva URL con los parámetros
    const newUrl = new URL('https://solizra.github.io/ANTOMIA_Frontend/password-reset');
    
    if (accessToken) newUrl.searchParams.set('access_token', accessToken);
    if (refreshToken) newUrl.searchParams.set('refresh_token', refreshToken);
    if (type) newUrl.searchParams.set('type', type);
    if (expiresAt) newUrl.searchParams.set('expires_at', expiresAt);
    if (expiresIn) newUrl.searchParams.set('expires_in', expiresIn);
    if (tokenType) newUrl.searchParams.set('token_type', tokenType);

    // Redirigir a la URL correcta
    window.location.href = newUrl.toString();
  }, [searchParams]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#1a1a1d',
      color: '#fff',
      fontFamily: 'Segoe UI, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        backgroundColor: '#2a2a2e',
        borderRadius: '12px',
        boxShadow: '0 0 20px #5ec5cc'
      }}>
        <h1 style={{ color: '#76f6ff', marginBottom: '20px' }}>Redirigiendo...</h1>
        <p style={{ color: '#aaa' }}>Te estamos llevando a la página correcta para cambiar tu contraseña.</p>
        <div style={{
          marginTop: '20px',
          width: '40px',
          height: '40px',
          border: '4px solid #444',
          borderTop: '4px solid #76f6ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '20px auto'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default LocalhostRedirect;
