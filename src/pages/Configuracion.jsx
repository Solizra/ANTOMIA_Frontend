import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import './Configuracion.css';

function Configuracion() {
  const { isDarkMode, setTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para formularios
  const [editProfile, setEditProfile] = useState(false);
  const [editPassword, setEditPassword] = useState(false);
  const [editPreferences, setEditPreferences] = useState(false);
  
  // Estados para datos del usuario
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    company: '',
    role: ''
  });
  
  // Estados para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Estados para preferencias
  const [preferences, setPreferences] = useState({
    notifications: true,
    emailDigest: true,
    darkMode: true,
    language: 'es',
    timezone: 'America/Argentina/Buenos_Aires',
    autoRefresh: true,
    itemsPerPage: 20
  });

  useEffect(() => {
    loadUserData();
  }, []);

  // Sincronizar el estado local de darkMode con el contexto global
  useEffect(() => {
    setPreferences(prev => ({ ...prev, darkMode: isDarkMode }));
  }, [isDarkMode]);

  const loadUserData = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      setUser(user);
      setProfileData({
        fullName: user?.user_metadata?.full_name || '',
        email: user?.email || '',
        company: user?.user_metadata?.company || '',
        role: user?.user_metadata?.role || ''
      });
      
      // Cargar preferencias desde la base de datos o localStorage
      const savedPreferences = user?.user_metadata?.preferences || 
                              JSON.parse(localStorage.getItem('userPreferences') || '{}');
      
      if (Object.keys(savedPreferences).length > 0) {
        setPreferences({...preferences, ...savedPreferences});
      }
    } catch (error) {
      setError('Error cargando datos del usuario');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.fullName,
          company: profileData.company,
          role: profileData.role
        }
      });
      
      if (error) throw error;
      
      setSuccess('Perfil actualizado correctamente');
      setEditProfile(false);
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      setError('Error actualizando perfil: ' + error.message);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      
      if (error) throw error;
      
      setSuccess('Contraseña actualizada correctamente');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setEditPassword(false);
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      setError('Error actualizando contraseña: ' + error.message);
    }
  };

  const handlePreferencesUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // Actualizar el tema global cuando cambie darkMode
      if (preferences.darkMode !== isDarkMode) {
        setTheme(preferences.darkMode);
      }
      
      // Guardar las preferencias en la base de datos usando Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          preferences: preferences
        }
      });
      
      if (error) throw error;
      
      // También guardar en localStorage como backup
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      
      setSuccess('Preferencias guardadas correctamente');
      setEditPreferences(false);
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      setError('Error guardando preferencias: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (loading) {
    return (
      <div className="configuracion-container">
        <div className="loading">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="configuracion-container">
      <div className="configuracion-inner">
        <div className="configuracion-header">
          <h1 className="configuracion-title">Configuración</h1>
          <p className="configuracion-subtitle">Administra tu cuenta y preferencias</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {success}
          </div>
        )}

        <div className="configuracion-sections">
          {/* Sección de Perfil */}
          <div className="config-section">
            <div className="section-header">
              <div className="section-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <h3>Información del Perfil</h3>
              </div>
              <button 
                className="btn-secondary"
                onClick={() => setEditProfile(!editProfile)}
              >
                {editProfile ? 'Cancelar' : 'Editar'}
              </button>
            </div>
            
            <div className="section-content">
              {!editProfile ? (
                <div className="profile-info">
                  <div className="info-item">
                    <label>Nombre completo</label>
                    <span>{profileData.fullName || 'No especificado'}</span>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <span>{profileData.email}</span>
                  </div>
                  <div className="info-item">
                    <label>Empresa</label>
                    <span>{profileData.company || 'No especificada'}</span>
                  </div>
                  <div className="info-item">
                    <label>Rol</label>
                    <span>{profileData.role || 'No especificado'}</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate} className="form">
                  <div className="form-group">
                    <label htmlFor="fullName">Nombre completo</label>
                    <input
                      type="text"
                      id="fullName"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      value={profileData.email}
                      disabled
                      className="disabled"
                    />
                    <small>El email no se puede cambiar</small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="company">Empresa</label>
                    <input
                      type="text"
                      id="company"
                      value={profileData.company}
                      onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                      placeholder="Nombre de tu empresa"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="role">Rol</label>
                    <input
                      type="text"
                      id="role"
                      value={profileData.role}
                      onChange={(e) => setProfileData({...profileData, role: e.target.value})}
                      placeholder="Tu rol o posición"
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">Guardar cambios</button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Sección de Seguridad */}
          <div className="config-section">
            <div className="section-header">
              <div className="section-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3>Seguridad</h3>
              </div>
              <button 
                className="btn-secondary"
                onClick={() => setEditPassword(!editPassword)}
              >
                {editPassword ? 'Cancelar' : 'Cambiar contraseña'}
              </button>
            </div>
            
            <div className="section-content">
              {!editPassword ? (
                <div className="security-info">
                  <div className="info-item">
                    <label>Último cambio de contraseña</label>
                    <span>Hace 30 días</span>
                  </div>
                  <div className="info-item">
                    <label>Estado de la cuenta</label>
                    <span className="status-active">Activa</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePasswordChange} className="form">
                  <div className="form-group">
                    <label htmlFor="currentPassword">Contraseña actual</label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      placeholder="Tu contraseña actual"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="newPassword">Nueva contraseña</label>
                    <input
                      type="password"
                      id="newPassword"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      placeholder="Nueva contraseña"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirmar nueva contraseña</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      placeholder="Confirma tu nueva contraseña"
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">Actualizar contraseña</button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Sección de Preferencias */}
          <div className="config-section">
            <div className="section-header">
              <div className="section-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <h3>Preferencias</h3>
              </div>
              <button 
                className="btn-secondary"
                onClick={() => setEditPreferences(!editPreferences)}
              >
                {editPreferences ? 'Cancelar' : 'Editar'}
              </button>
            </div>
            
            <div className="section-content">
              {!editPreferences ? (
                <div className="preferences-info">
                  <div className="info-item">
                    <label>Notificaciones</label>
                    <span className={preferences.notifications ? 'status-active' : 'status-inactive'}>
                      {preferences.notifications ? 'Activadas' : 'Desactivadas'}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Resumen por email</label>
                    <span className={preferences.emailDigest ? 'status-active' : 'status-inactive'}>
                      {preferences.emailDigest ? 'Activado' : 'Desactivado'}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Modo oscuro</label>
                    <span className={preferences.darkMode ? 'status-active' : 'status-inactive'}>
                      {preferences.darkMode ? 'Activado' : 'Desactivado'}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Idioma</label>
                    <span>{preferences.language === 'es' ? 'Español' : 'English'}</span>
                  </div>
                  <div className="info-item">
                    <label>Zona horaria</label>
                    <span>{preferences.timezone}</span>
                  </div>
                  <div className="info-item">
                    <label>Trends por página</label>
                    <span>{preferences.itemsPerPage}</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePreferencesUpdate} className="form">
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={preferences.notifications}
                        onChange={(e) => setPreferences({...preferences, notifications: e.target.checked})}
                      />
                      <span>Recibir notificaciones</span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={preferences.emailDigest}
                        onChange={(e) => setPreferences({...preferences, emailDigest: e.target.checked})}
                      />
                      <span>Recibir resumen por email</span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="toggle-label">
                      <span>Modo oscuro</span>
                      <div className="toggle-switch">
                        <input
                          type="checkbox"
                          id="darkMode"
                          checked={preferences.darkMode}
                          onChange={(e) => setPreferences({...preferences, darkMode: e.target.checked})}
                        />
                        <label htmlFor="darkMode" className="toggle-slider">
                          <span className="toggle-slider-button"></span>
                        </label>
                      </div>
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={preferences.autoRefresh}
                        onChange={(e) => setPreferences({...preferences, autoRefresh: e.target.checked})}
                      />
                      <span>Actualización automática</span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label htmlFor="language">Idioma</label>
                    <select
                      id="language"
                      value={preferences.language}
                      onChange={(e) => setPreferences({...preferences, language: e.target.value})}
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="timezone">Zona horaria</label>
                    <select
                      id="timezone"
                      value={preferences.timezone}
                      onChange={(e) => setPreferences({...preferences, timezone: e.target.value})}
                    >
                      <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                      <option value="America/New_York">Nueva York (GMT-5)</option>
                      <option value="Europe/Madrid">Madrid (GMT+1)</option>
                      <option value="UTC">UTC (GMT+0)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="itemsPerPage">Elementos por página</label>
                    <select
                      id="itemsPerPage"
                      value={preferences.itemsPerPage}
                      onChange={(e) => setPreferences({...preferences, itemsPerPage: parseInt(e.target.value)})}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">Guardar preferencias</button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Sección de Cuenta */}
          <div className="config-section">
            <div className="section-header">
              <div className="section-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3>Cuenta</h3>
              </div>
            </div>
            
            <div className="section-content">
              <div className="account-info">
                <div className="info-item">
                  <label>Miembro desde</label>
                  <span>{new Date(user?.created_at).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="info-item">
                  <label>Último acceso</label>
                  <span>{new Date(user?.last_sign_in_at).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="info-item">
                  <label>Estado de verificación</label>
                  <span className={user?.email_confirmed_at ? 'status-active' : 'status-inactive'}>
                    {user?.email_confirmed_at ? 'Verificado' : 'No verificado'}
                  </span>
                </div>
              </div>
              
              <div className="account-actions">
                <button className="btn-danger" onClick={handleLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m-5 5H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Configuracion;
