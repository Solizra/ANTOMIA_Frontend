import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import './Configuracion.css';

function Configuracion() {
  const navigate = useNavigate();
  const { isDarkMode, setTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para formularios
  const [editProfile, setEditProfile] = useState(false);
  const [editPassword, setEditPassword] = useState(false);
  const [editPreferences, setEditPreferences] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [creandoUsuario, setCreandoUsuario] = useState(false);
  
  // Estado para formulario de añadir usuario
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    jefeEmail: ''
  });
  
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
    loadUsers();
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
      const allowedEmails = [
        'sassonindiana@gmail.com',
        '48460067@est.ort.edu.ar',
        'ruben@antom.la',
        'solizraa@gmail.com',
        'paula@antom.la'
      ];
      const isAuthorized = !!user?.email && allowedEmails.includes(user.email.toLowerCase());
      setAuthorized(isAuthorized);
      if (!isAuthorized) {
        // Si no está autorizado, redirigir fuera de configuración
        navigate('/home');
        return;
      }
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

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      // Intentar obtener usuarios desde la tabla personalizada
      const { data: usersData, error } = await supabase
        .from('usuarios_registrados')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Error cargando desde usuarios_registrados:', error);
        // Intentar obtener desde la tabla auth.users usando una consulta directa
        try {
          const { data: authUsers, error: authError } = await supabase
            .from('auth.users')
            .select('email, created_at, last_sign_in_at');

          if (authError) {
            console.log('No se pueden cargar usuarios de auth.users:', authError);
            setUsers([]);
          } else if (authUsers) {
            // Mapear usuarios de auth
            const mappedUsers = authUsers.map(u => ({
              email: u.email,
              created_at: u.created_at,
              last_sign_in: u.last_sign_in_at,
              jefe_email: 'N/A',
              id: u.id || Date.now()
            }));
            setUsers(mappedUsers);
          }
        } catch (err) {
          console.log('No se puede acceder a auth.users desde el cliente');
          setUsers([]);
        }
      } else if (usersData && usersData.length > 0) {
        // Mapear los datos a un formato consistente
        const mappedUsers = usersData.map(u => ({
          email: u.email || u.user_email,
          created_at: u.created_at,
          last_sign_in: u.last_sign_in_at,
          jefe_email: u.jefe_email,
          id: u.id
        }));
        setUsers(mappedUsers);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCreandoUsuario(true);

    // Validación: NO permitir emails que terminen en @antom.la
    if (newUserData.email.toLowerCase().endsWith('@antom.la')) {
      setError('No se pueden crear cuentas con dominio @antom.la');
      setCreandoUsuario(false);
      return;
    }

    // Validaciones de contraseña
    if (newUserData.password !== newUserData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setCreandoUsuario(false);
      return;
    }

    if (newUserData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setCreandoUsuario(false);
      return;
    }

    try {
      // IMPORTANTE: Verificar que el email del jefe existe en la base de datos
      // Intentamos iniciar sesión con una contraseña temporal para validar existencia
      const { error: checkError } = await supabase.auth.signInWithPassword({
        email: newUserData.jefeEmail,
        password: 'temp-check-password-validation-12345'
      });

      // Si el error es "Invalid login credentials", significa que el usuario EXISTE (solo la contraseña es incorrecta)
      // Si es otro error, el usuario NO EXISTE
      if (checkError) {
        if (checkError.message.includes('Invalid login credentials') || 
            checkError.message.includes('Invalid email or password')) {
          // El email del jefe EXISTE en la base de datos ✅
          console.log('Email del jefe verificado exitosamente');
        } else {
          // El email NO EXISTE en la base de datos
          setError('❌ El email del jefe no está registrado en el sistema. Verifica que sea correcto.');
          setCreandoUsuario(false);
          return;
        }
      }

      console.log('Intentando crear usuario con:', {
        email: newUserData.email,
        jefe_email: newUserData.jefeEmail
      });

      // Crear el nuevo usuario en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: newUserData.email,
        password: newUserData.password,
        options: {
          data: {
            jefe_email: newUserData.jefeEmail
          }
        }
      });
      
      console.log('Respuesta de signUp:', { data, error });

      if (error) {
        // La validación del jefe fue exitosa pero hay error en el signup
        console.log('Error en el proceso de signup, pero el jefe fue verificado');
        console.error('Error completo de signup:', error);
        console.error('Detalles del error:', JSON.stringify(error, null, 2));
        
        // Mostrar el error específico
        let errorMessage = 'Error al crear el usuario';
        
        // Extraer el mensaje de error
        if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error.error_description) {
          errorMessage = error.error_description;
        } else {
          errorMessage = JSON.stringify(error);
        }
        
        // Traducir errores comunes
        if (errorMessage.toLowerCase().includes('already registered') || 
            errorMessage.toLowerCase().includes('already exists') ||
            errorMessage.toLowerCase().includes('duplicate')) {
          errorMessage = 'Este email ya está registrado en el sistema';
        } else if (errorMessage.toLowerCase().includes('invalid')) {
          errorMessage = 'Email o contraseña inválidos. Verifica los datos.';
        } else if (errorMessage.toLowerCase().includes('rate limit')) {
          errorMessage = 'Demasiados intentos. Espera un momento e intenta de nuevo.';
        } else if (errorMessage.toLowerCase().includes('email')) {
          errorMessage = 'El email proporcionado no es válido.';
        }
        
        console.log('Mensaje de error final:', errorMessage);
        setError(errorMessage);
        setCreandoUsuario(false);
        return;
      } else {
        // Guardar el usuario en nuestra tabla personalizada si existe
        try {
          const { error: insertError } = await supabase
            .from('usuarios_registrados')
            .insert({
              email: newUserData.email,
              created_at: new Date().toISOString(),
              jefe_email: newUserData.jefeEmail,
              user_metadata: { jefe_email: newUserData.jefeEmail }
            });

          if (insertError) {
            console.log('No se pudo insertar en usuarios_registrados:', insertError);
            // No es crítico, continuamos
          }
        } catch (err) {
          console.log('Tabla usuarios_registrados no existe o error al insertar');
        }

        setSuccess('Usuario creado exitosamente');
        setNewUserData({ email: '', password: '', confirmPassword: '', jefeEmail: '' });
        setShowAddUser(false);
        setTimeout(() => setSuccess(''), 4000);
        loadUsers(); // Recargar lista de usuarios
        setCreandoUsuario(false);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      setError('Ocurrió un error inesperado al crear el usuario: ' + (error.message || 'Error desconocido'));
      setCreandoUsuario(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setError('');
      setSuccess('');
      
      // Intentar eliminar de la tabla personalizada
      try {
        const { error: deleteError } = await supabase
          .from('usuarios_registrados')
          .delete()
          .eq('email', userToDelete.email);

        if (deleteError) {
          console.log('No se pudo eliminar de usuarios_registrados:', deleteError);
        }
      } catch (err) {
        console.log('Tabla usuarios_registrados no existe o no se puede eliminar');
      }

      setSuccess('Usuario eliminado exitosamente');
      setShowDeleteModal(false);
      setUserToDelete(null);
      setTimeout(() => setSuccess(''), 3000);
      
      // Recargar lista de usuarios
      loadUsers();
    } catch (error) {
      setError('Error al eliminar usuario: ' + error.message);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const openDeleteModal = (userData) => {
    setUserToDelete(userData);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setUserToDelete(null);
    setShowDeleteModal(false);
  };

  if (loading) {
    return (
      <div className="configuracion-container">
        <div className="loading">Cargando configuración...</div>
      </div>
    );
  }
  
  if (!authorized) {
    return (
      <div className="configuracion-container">
        <div className="configuracion-inner" style={{ textAlign: 'center', padding: '40px' }}>
          <h1 className="configuracion-title">Acceso no autorizado</h1>
          <p className="configuracion-subtitle">No tienes permisos para acceder a esta sección.</p>
          <button className="btn-primary" onClick={() => navigate('/home')} style={{ marginTop: 16 }}>
            Volver al Home
          </button>
        </div>
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

          {/* Sección de Administración de Usuarios */}
          <div className="config-section">
            <div className="section-header">
              <div className="section-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3>Administración de Usuarios</h3>
              </div>
              <button 
                className="btn-secondary"
                onClick={() => setShowAddUser(!showAddUser)}
              >
                {showAddUser ? 'Cancelar' : 'Añadir Usuario'}
              </button>
            </div>
            
            <div className="section-content">
              {!showAddUser ? (
                <div className="users-management">
                  {loadingUsers ? (
                    <div className="loading">Cargando usuarios...</div>
                  ) : users.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {users.map((u, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '10px 12px' }}>
                          <span style={{ color: 'var(--text-primary)' }}>{u.email}</span>
                          <button 
                            className="btn-delete-small"
                            onClick={() => openDeleteModal(u)}
                            title="Eliminar usuario"
                            style={{ color: '#ff4c4c' }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-users">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <p>No hay usuarios registrados</p>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleAddUser} className="form">
                  {error && (
                    <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {error}
                    </div>
                  )}
                  <div className="form-group">
                    <label htmlFor="jefeEmail">Email del Jefe/Supervisor</label>
                    <input
                      type="email"
                      id="jefeEmail"
                      value={newUserData.jefeEmail}
                      onChange={(e) => setNewUserData({...newUserData, jefeEmail: e.target.value})}
                      placeholder="jefe@antom.la"
                      required
                    />
                    <small>Email de un supervisor ya registrado</small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="newUserEmail">Email del Nuevo Usuario</label>
                    <input
                      type="email"
                      id="newUserEmail"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                      placeholder="nuevo@antom.la"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="newUserPassword">Contraseña</label>
                    <input
                      type="password"
                      id="newUserPassword"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="newUserConfirmPassword">Confirmar Contraseña</label>
                    <input
                      type="password"
                      id="newUserConfirmPassword"
                      value={newUserData.confirmPassword}
                      onChange={(e) => setNewUserData({...newUserData, confirmPassword: e.target.value})}
                      placeholder="Repite la contraseña"
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={creandoUsuario}>
                      {creandoUsuario ? 'Creando...' : 'Crear Usuario'}
                    </button>
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

        {/* Modal de confirmación para eliminar usuario */}
        {showDeleteModal && userToDelete && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '12px',
              width: 'min(480px, 90vw)',
              color: 'var(--text-primary)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-primary)'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: 12, color: 'var(--text-primary)' }}>
                Eliminar Usuario
              </h3>
              <p style={{ marginTop: 0, marginBottom: 16, color: 'var(--text-secondary)' }}>
                ¿Estás seguro de que deseas eliminar al usuario <strong>{userToDelete.email}</strong>?
                Esta acción no se puede deshacer.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button 
                  onClick={closeDeleteModal} 
                  className="btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteUser} 
                  className="btn-danger"
                  style={{ padding: '8px 16px' }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Configuracion;
