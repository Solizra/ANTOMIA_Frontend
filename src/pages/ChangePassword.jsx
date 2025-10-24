import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './ChangePassword.css';

function ChangePassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isResetFlow, setIsResetFlow] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');

  useEffect(() => {
    // Verificar si venimos del password reset
    if (location.state?.isResetFlow && location.state?.verified) {
      setIsResetFlow(true);
      setMessage('Enlace verificado correctamente. Puedes establecer tu nueva contraseña.');
      return;
    }

    // Verificar si venimos de un flujo de reset de contraseña
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');
    
    console.log('URL params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });
    
    // Detectar si es un flujo de recuperación de contraseña
    if (accessToken && refreshToken && type === 'recovery') {
      setIsResetFlow(true);
      // Establecer la sesión con los tokens del email
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).then(({ data, error }) => {
        if (error) {
          console.error('Error al establecer sesión:', error);
          setError('Error al procesar el enlace de recuperación. Por favor, solicita un nuevo enlace.');
        } else {
          console.log('Sesión establecida correctamente:', data);
          setMessage('Enlace verificado correctamente. Puedes establecer tu nueva contraseña.');
        }
      });
    } else if (type === 'recovery') {
      // Si es tipo recovery pero no hay tokens, puede ser que venga del callback
      setIsResetFlow(true);
      setMessage('Procesando enlace de recuperación...');
    } else {
      // Verificar si el usuario está logueado (flujo normal desde perfil)
      const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // Si no hay usuario y no es un flujo de reset, redirigir al login
          navigate('/');
          return;
        }
        setIsResetFlow(false);
      };
      checkUser();
    }
  }, [searchParams, navigate, location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Calcular fortaleza de contraseña
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
    // Validación adicional: al menos una letra y un número
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
      // Validaciones
      if (!isResetFlow && !formData.currentPassword) {
        throw new Error('Debes ingresar tu contraseña actual');
      }

      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error('Las contraseñas nuevas no coinciden');
      }

      const passwordError = validatePassword(formData.newPassword);
      if (passwordError) {
        throw new Error(passwordError);
      }

      if (isResetFlow) {
        // Flujo de reset de contraseña
        const { error: updateError } = await supabase.auth.updateUser({
          password: formData.newPassword
        });

        if (updateError) {
          throw updateError;
        }

        setMessage('Contraseña actualizada exitosamente. Serás redirigido al login.');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        // Flujo normal de cambio de contraseña
        const { error: updateError } = await supabase.auth.updateUser({
          password: formData.newPassword
        });

        if (updateError) {
          throw updateError;
        }

        setMessage('Contraseña actualizada exitosamente.');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setError(error.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <div className="change-password-card">
        <div className="change-password-header">
          <h1>{isResetFlow ? 'Establecer Nueva Contraseña' : 'Cambiar Contraseña'}</h1>
          <p>
            {isResetFlow 
              ? 'Crea una nueva contraseña para tu cuenta' 
              : 'Ingresa tu contraseña actual y la nueva contraseña'
            }
          </p>
          {!isResetFlow && !searchParams.get('access_token') && (
            <p style={{ color: '#ffaa00', fontSize: '0.9rem', marginTop: '10px' }}>
              💡 Para recuperar tu contraseña, usa el enlace "¿Olvidaste tu contraseña?" en el login
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="change-password-form">
          {!isResetFlow && (
            <div className="form-group">
              <label htmlFor="currentPassword">Contraseña Actual</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                placeholder="Tu contraseña actual"
                required
                disabled={loading}
              />
            </div>
          )}

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
            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? 'Actualizando...' : (isResetFlow ? 'Establecer Contraseña' : 'Actualizar Contraseña')}
            </button>
            {!isResetFlow && (
              <button 
                type="button" 
                onClick={() => navigate('/perfil')} 
                className="secondary-btn"
                disabled={loading}
              >
                Volver al Perfil
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;
