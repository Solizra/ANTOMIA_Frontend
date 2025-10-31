import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './ChangePassword.css';

function NewPassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');

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
      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      const passwordError = validatePassword(formData.newPassword);
      if (passwordError) {
        throw new Error(passwordError);
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword
      });
      if (updateError) {
        throw updateError;
      }

      setMessage('Contraseña establecida exitosamente. Serás redirigido al login.');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
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
            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? 'Guardando...' : 'Establecer Contraseña'}
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


