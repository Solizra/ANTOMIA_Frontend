import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './ChangePassword.css';

function NewPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [sessionEstablished, setSessionEstablished] = useState(false);
  const [emailForResend, setEmailForResend] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  // Establecer sesión cuando el componente se monte si vienen tokens de la URL
  useEffect(() => {
    const establishSession = async () => {
      // Intentar obtener tokens desde múltiples fuentes (HashRouter puede generar doble hash)
      let accessToken = searchParams.get('access_token');
      let refreshToken = searchParams.get('refresh_token');
      let type = searchParams.get('type');

      const parseFromRawHash = () => {
        try {
          const rawHash = window.location.hash || '';
          // En HashRouter la URL puede lucir como .../#/new-password#access_token=...
          const lastHashIndex = rawHash.lastIndexOf('#');
          const fragment = lastHashIndex >= 0 ? rawHash.substring(lastHashIndex + 1) : rawHash.substring(1);
          const params = new URLSearchParams(fragment);
          return {
            accessToken: params.get('access_token'),
            refreshToken: params.get('refresh_token'),
            type: params.get('type')
          };
        } catch {
          return { accessToken: null, refreshToken: null, type: null };
        }
      };

      if (!accessToken || !refreshToken) {
        const fromHash = parseFromRawHash();
        accessToken = accessToken || fromHash.accessToken;
        refreshToken = refreshToken || fromHash.refreshToken;
        type = type || fromHash.type;
      }

      console.log('NewPassword - URL params:', { 
        hasAccessToken: !!accessToken, 
        hasRefreshToken: !!refreshToken, 
        type 
      });

      // Si vienen tokens de recuperación de contraseña, establecer la sesión
      if (accessToken && refreshToken && type === 'recovery') {
        try {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            console.error('Error al establecer sesión:', sessionError);
            setError('Error al procesar el enlace de recuperación. Por favor, solicita un nuevo enlace.');
            return;
          }

          console.log('Sesión establecida correctamente:', data);
          setSessionEstablished(true);
          setMessage('Enlace verificado correctamente. Puedes establecer tu nueva contraseña.');
        } catch (err) {
          console.error('Error inesperado al establecer sesión:', err);
          setError('Error al procesar el enlace de recuperación. Por favor, solicita un nuevo enlace.');
        }
      } else {
        // Si no hay tokens, verificar si el usuario ya está logueado
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setSessionEstablished(true);
        } else {
          // Mostrar opción para reenviar enlace en lugar de redirigir
          setError('No se encontró sesión válida. Puedes solicitar un nuevo enlace de recuperación.');
        }
      }
    };

    establishSession();
  }, [searchParams, navigate, location]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'newPassword') {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const calculatePasswordStrength = (password) => {
    if (password.length === 0) return '';
    if (password.length < 6) return 'Débil';
    if (password.length < 8) return 'Media';
    if (password.length >= 8 && /(?=.*[A-Za-z])(?=.*\d)/.test(password)) return 'Fuerte';
    return 'Media';
  };

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    if (password.length > 128) {
      return 'La contraseña no puede tener más de 128 caracteres';
    }
    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      return 'La contraseña debe contener al menos una letra y un número';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Verificar que la sesión esté establecida antes de proceder
      if (!sessionEstablished) {
        throw new Error('Por favor espera mientras se verifica tu enlace...');
      }

      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      const passwordError = validatePassword(formData.newPassword);
      if (passwordError) {
        throw new Error(passwordError);
      }

      // Verificar que aún tengamos sesión antes de actualizar
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('La sesión ha expirado. Por favor, solicita un nuevo enlace de recuperación.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword
      });
      
      if (updateError) {
        throw updateError;
      }

      setMessage('Contraseña establecida exitosamente. Serás redirigido al login.');
      setTimeout(() => {
        // Cerrar sesión después de cambiar la contraseña para forzar login con la nueva
        supabase.auth.signOut();
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error('Error al establecer la contraseña:', err);
      setError(err.message || 'Error al establecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResendLoading(true);
      setResendMessage('');
      if (!emailForResend) {
        throw new Error('Ingresa tu email para reenviar el enlace');
      }
      const { origin, pathname } = window.location;
      const redirectUrl = `${origin}${pathname}#/new-password`;
      const { error: resendError } = await supabase.auth.resetPasswordForEmail(emailForResend, {
        redirectTo: redirectUrl,
      });
      if (resendError) throw resendError;
      setResendMessage('Enlace enviado. Revisa tu correo y spam.');
    } catch (err) {
      setError(err.message || 'Error al reenviar el enlace');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <div className="change-password-card">
        <div className="change-password-header">
          <h1>Establecer Nueva Contraseña</h1>
          <p>Crea y confirma tu nueva contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className="change-password-form">
          <div className="form-group">
            <label htmlFor="newPassword">Nueva Contraseña</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              placeholder="Mínimo 6 caracteres, letra y número"
              required
              disabled={loading}
            />
            {passwordStrength && (
              <div className={`password-strength ${passwordStrength.toLowerCase()}`}>
                Fortaleza: {passwordStrength}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Repite la nueva contraseña"
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <div className="form-actions">
            <button type="submit" disabled={loading || !sessionEstablished} className="primary-btn">
              {loading ? 'Guardando...' : sessionEstablished ? 'Establecer Contraseña' : 'Verificando enlace...'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="secondary-btn"
              disabled={loading}
            >
              Volver al Login
            </button>
          </div>
        </form>

        {!sessionEstablished && (
          <div style={{ marginTop: '24px' }}>
            <h3>¿No funcionó el enlace?</h3>
            <p>Ingresa tu email y te enviaremos un nuevo enlace de recuperación.</p>
            <div className="form-group">
              <label htmlFor="resendEmail">Email</label>
              <input
                type="email"
                id="resendEmail"
                value={emailForResend}
                onChange={(e) => setEmailForResend(e.target.value)}
                placeholder="tu@antom.la"
                disabled={resendLoading}
              />
            </div>
            {resendMessage && <div className="success-message">{resendMessage}</div>}
            <div className="form-actions">
              <button type="button" className="primary-btn" disabled={resendLoading} onClick={handleResend}>
                {resendLoading ? 'Enviando...' : 'Reenviar enlace'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NewPassword;


