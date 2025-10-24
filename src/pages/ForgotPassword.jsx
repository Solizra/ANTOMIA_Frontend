import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { apiURL } from '../constants';
import './ForgotPassword.css';

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Usar la URL actual del navegador para la redirección
      const currentOrigin = window.location.origin;
      const redirectUrl = `${currentOrigin}/password-reset`;
      
      console.log('Redirigiendo a:', redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }

      setMessage('Se ha enviado un código de verificación a tu correo electrónico. Revisa tu bandeja de entrada y spam.');
    } catch (error) {
      console.error('Error al enviar email de recuperación:', error);
      setError('Error al enviar el email de recuperación. Verifica que el email esté registrado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <h1>Recuperar Contraseña</h1>
          <p>Ingresa tu email para recibir un código de verificación</p>
        </div>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@antom.la"
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <div className="form-actions">
            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? 'Enviando...' : 'Enviar Código'}
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

export default ForgotPassword;
