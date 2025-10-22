// src/pages/AuthCallback.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function AuthCallback() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [status, setStatus] = useState('Procesando verificación...');

  useEffect(() => {
    const params = new URLSearchParams(search);
    const tokenHash = params.get('token_hash');
    const type = params.get('type'); // 'email_change' | 'recovery' | 'magiclink' | 'signup'

    async function handleVerify() {
      try {
        if (tokenHash && type) {
          const { data, error } = await supabase.auth.verifyOtp({
            type,
            token_hash: tokenHash,
          });
          if (error) {
            // Si no hay sesión, redirigimos al login y reintentamos luego del login
            if (String(error.message).toLowerCase().includes('auth session missing')) {
              try {
                localStorage.setItem('postLoginRedirect', `${window.location.pathname}${window.location.search}`);
              } catch {}
              setStatus('Necesitas iniciar sesión para completar la verificación...');
              navigate('/', { replace: true });
              return;
            }
            throw error;
          }
          
          // Si es un flujo de recuperación, redirigir a change-password
          if (type === 'recovery') {
            setStatus('Verificación completada. Redirigiendo a cambio de contraseña...');
            navigate('/change-password', { replace: true });
          } else {
            setStatus('Verificación completada. Redirigiendo...');
            navigate('/perfil', { replace: true });
          }
          return;
        }

        // (Opcional) Si usas OAuth/PKCE y llega ?code=...:
        const code = params.get('code');
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession({ code });
          if (error) throw error;
          setStatus('Sesión establecida. Redirigiendo...');
          navigate('/perfil', { replace: true });
          return;
        }

        setStatus('No se encontraron parámetros de verificación válidos.');
        navigate('/', { replace: true });
      } catch (err) {
        console.error(err);
        setStatus('Error al verificar el enlace.');
        navigate('/', { replace: true });
      }
    }

    handleVerify();
  }, [search, navigate]);

  return <div>{status}</div>;
}

export default AuthCallback;