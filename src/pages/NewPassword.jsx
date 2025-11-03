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

  // Establecer sesión cuando el componente se monte si vienen tokens de la URL
  useEffect(() => {
    const establishSession = async () => {
      // Intentar obtener tokens tanto de searchParams como del hash
      let accessToken = searchParams.get('access_token');
      let refreshToken = searchParams.get('refresh_token');
      let type = searchParams.get('type');

      // Si no están en query params, buscar en el hash (para HashRouter)
      if (!accessToken || !refreshToken) {
        try {
          const hashParams = new URLSearchParams(location.hash.substring(1));
          accessToken = accessToken || hashParams.get('access_token');
          refreshToken = refreshToken || hashParams.get('refresh_token');
          type = type || hashParams.get('type');
        } catch (e) {
          console.log('No se encontraron parámetros en el hash');
        }
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
          // Si no hay usuario ni tokens, redirigir al login
          setError('No se encontró sesión válida. Por favor, solicita un nuevo enlace de recuperación.');
          setTimeout(() => navigate('/'), 3000);
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
      </div>
    </div>
  );
}

export default NewPassword;


