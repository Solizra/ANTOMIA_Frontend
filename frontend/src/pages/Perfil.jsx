import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Perfil.css';

function Perfil() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editEmail, setEditEmail] = useState(false);
  const [editPassword, setEditPassword] = useState(false);
  const [emailData, setEmailData] = useState({
    newEmail: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      setUser(user);
      setEmailData({
        newEmail: user?.email || ''
      });
    } catch (error) {
      setError('Error cargando datos del usuario');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (emailData.newEmail === user?.email) {
      setError('El nuevo email debe ser diferente al actual');
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        email: emailData.newEmail
      });
      
      if (error) throw error;
      
      setSuccess('Email actualizado. Revisa tu correo para confirmar el cambio.');
      setEditEmail(false);
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      setError('Error actualizando email: ' + error.message);
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
      
      if (getUserError) {
        throw new Error(`Error obteniendo usuario actual: ${getUserError.message}`);
      }

      // Verificar que el email se actualizó correctamente
      if (currentUser && currentUser.email === formData.email) {
        // Actualizar en localStorage
        const updatedUser = { ...user, email: formData.email };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setEditMode(false);
        
        // Mostrar mensaje de éxito
        alert("✅ Email actualizado correctamente en Supabase. Deberás verificar el cambio en tu casilla de mail.");
        
      } else if (currentUser && currentUser.email !== formData.email) {
        // El email no se actualizó inmediatamente, pero Supabase puede estar procesando
        console.log('⚠️ Email no actualizado inmediatamente, pero Supabase está procesando el cambio');
        
        // Actualizar en localStorage de todas formas (optimista)
        const updatedUser = { ...user, email: formData.email };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setEditMode(false);
        
        alert("✅ Solicitud enviada a Supabase. Deberás verificar el cambio en tu casilla de mail.");
        
        // Opcional: Cerrar sesión para que el usuario use el nuevo email
        setTimeout(() => {
          if (window.confirm("¿Quieres cerrar sesión para probar el nuevo email?")) {
            supabase.auth.signOut();
            navigate("/");
          }
        }, 2000);
      } else {
        throw new Error("No se pudo obtener información del usuario actual");
      }
    } catch (error) {
      setError('Error actualizando contraseña: ' + error.message);
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
      <div className="perfil-container">
        <div className="loading">Cargando perfil...</div>
      </div>
    );
  }

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <h1>Mi Perfil</h1>
        <p>Administra tu información personal</p>
      </div>

      <div className="perfil-content">
        <div className="perfil-card">
          <div className="perfil-avatar">
            <div className="avatar-placeholder">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
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

          <div className="perfil-info">
            {!editMode ? (
              <>
                <div className="info-row" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ minWidth: 60 }}>Email:</label>
                  <span style={{ flex: 1 }}>{user?.email || 'No especificado'}</span>
                  <button 
                    className="primary-btn"
                    onClick={() => setEditMode(true)}
                    style={{ minWidth: 110 }}
                  >
                    Editar email
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="form-row">
                  <label>Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="tu@email.com"
                  />
                </div>
                                 <div className="form-actions">
                  <button className="primary-btn save-btn" onClick={handleSave}>Guardar</button>
                  <button className="danger-btn" onClick={handleCancel}>Cancelar</button>
                 </div>
                 <div className="save-info" style={{
                   marginTop: '1rem',
                   padding: '0.75rem',
                   background: '#1a1a1d',
                   border: '1px solid #444',
                   borderRadius: '6px',
                   fontSize: '0.9rem',
                   color: '#ccc'
                 }}>
                   <p>💡 <strong>Nota:</strong> El cambio de email puede tardar unos segundos en procesarse.</p>
                 </div>
              </>
            )}
          </div>
        </div>

                 <div className="perfil-stats">
           <h3>Estadísticas</h3>
           <div className="stats-grid">
             <div className="stat-item">
               <div className="stat-number">
                 {JSON.parse(localStorage.getItem('archivados') || '[]').filter(item => item.tipo === 'trend').length}
               </div>
               <div className="stat-label">Archivados</div>
             </div>
           </div>
           
           <div className="email-info">
             <h4>ℹ️ Información sobre cambio de email</h4>
             <p>Al cambiar tu email, Supabase enviará un enlace de verificación al nuevo email. Deberás verificar el nuevo email antes de poder usarlo para iniciar sesión.</p>
              <button 
                onClick={async () => {
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                      alert(`📧 Estado del Email:\n\n` +
                            `🔵 En Supabase: ${user.email}\n` +
                            `🟡 En localStorage: ${localUser.email || 'No encontrado'}\n` +
                            `🟢 En estado local: ${user?.email || 'No encontrado'}\n\n` +
                            `💡 Si los emails son diferentes, espera unos segundos y verifica nuevamente.`);
                    } else {
                      alert('❌ No se pudo obtener información del usuario de Supabase');
                    }
                  } catch (error) {
                    alert(`❌ Error obteniendo usuario: ${error.message}`);
                  }
                }}
                className="primary-btn"
                style={{ marginTop: '1rem' }}
              >
                Verificar estado del email
              </button>
           </div>
         </div>
      </div>
    </div>
  );
}

export default Perfil;