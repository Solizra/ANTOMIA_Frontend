import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './ChangePassword.css';

function PasswordReset() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Procesando enlace de recuperación...');
  const [error, setError] = useState('');

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');

        console.log('Password reset params:', { 
          accessToken: !!accessToken, 
          refreshToken: !!refreshToken, 
          type 
        });

        // Verificar si venimos de localhost y redirigir automáticamente
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          const newUrl = new URL('https://solizra.github.io/ANTOMIA_Frontend/password-reset');
          newUrl.search = window.location.search;
          window.location.href = newUrl.toString();
          return;
        }

        if (accessToken && refreshToken && type === 'recovery') {
          // Establecer la sesión con los tokens del email
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('Error al establecer sesión:', error);
            setError('Error al procesar el enlace de recuperación. Por favor, solicita un nuevo enlace.');
            setStatus('Error en la verificación');
            return;
          }

          console.log('Sesión establecida correctamente:', data);
          setStatus('Enlace verificado correctamente. Redirigiendo...');
          
          // Redirigir a la página de cambio de contraseña con los parámetros
          setTimeout(() => {
            navigate('/change-password', { 
              state: { 
                isResetFlow: true,
                verified: true 
              }
            });
          }, 1500);

        } else {
          setError('Enlace de recuperación inválido o expirado.');
          setStatus('Error en la verificación');
        }
      } catch (err) {
        console.error('Error en password reset:', err);
        setError('Error al procesar el enlace de recuperación.');
        setStatus('Error en la verificación');
      }
    };

    handlePasswordReset();
  }, [searchParams, navigate]);

  return (
    <div className="change-password-container">
      <div className="change-password-card">
        <div className="change-password-header">
          <h1>Recuperación de Contraseña</h1>
          <p>{status}</p>
          {error && (
            <div className="error-message" style={{ marginTop: '20px' }}>
              {error}
            </div>
          )}
        </div>
        
        {error && (
          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/forgot-password')} 
              className="primary-btn"
            >
              Solicitar Nuevo Enlace
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/')} 
              className="secondary-btn"
            >
              Volver al Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PasswordReset;
