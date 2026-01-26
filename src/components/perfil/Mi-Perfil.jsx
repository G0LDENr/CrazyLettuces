import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../../context/config';
import '../../css/perfil.css';

// Importar íconos para el diseño
import editIcon from '../../img/edit.png';
import saveIcon from '../../img/mas.png';
import cancelIcon from '../../img/cancelar.png';
import passwordIcon from '../../img/password.png';
import logoutIcon from '../../img/salida.png';
import userIcon from '../../img/user.png';
import backIcon from '../../img/atras.png';

const Perfil = () => {
  const navigate = useNavigate();
  const { t, darkMode } = useConfig();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Datos del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    sexo: '',
    correo: ''
  });

  // Verificar si el usuario está autenticado
  const isAuthenticated = localStorage.getItem('token') !== null;

  // Cargar datos del usuario solo si está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://127.0.0.1:5000/user/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        setFormData({
          nombre: data.nombre || '',
          telefono: data.telefono || '',
          sexo: data.sexo || '',
          correo: data.correo || ''
        });
      } else {
        console.error('Error al obtener datos del usuario');
        // Intentar obtener de localStorage como respaldo
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserData(user);
          setFormData({
            nombre: user.nombre || '',
            telefono: user.telefono || '',
            sexo: user.sexo || '',
            correo: user.correo || ''
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateProfileForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    } else if (!/^\d{10}$/.test(formData.telefono.trim())) {
      newErrors.telefono = 'El teléfono debe tener 10 dígitos';
    }

    if (!formData.correo.trim()) {
      newErrors.correo = 'El correo es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.correo)) {
      newErrors.correo = 'Correo electrónico inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData.currentPassword.trim()) {
      newErrors.currentPassword = 'La contraseña actual es requerida';
    }

    if (!passwordData.newPassword.trim()) {
      newErrors.newPassword = 'La nueva contraseña es requerida';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!passwordData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirma la nueva contraseña';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('⚠️ Debes iniciar sesión para actualizar tu perfil');
      navigate('/login');
      return;
    }
    
    if (!validateProfileForm()) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://127.0.0.1:5000/user/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        
        // Actualizar localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser.user));
        localStorage.setItem('userData', JSON.stringify(updatedUser.user));
        
        setUserData(updatedUser.user);
        setSuccessMessage('✅ Perfil actualizado exitosamente');
        setEditing(false);
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
        
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.msg || 'Error al actualizar el perfil'}`);
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert('❌ Error de conexión');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('⚠️ Debes iniciar sesión para cambiar tu contraseña');
      navigate('/login');
      return;
    }
    
    if (!validatePasswordForm()) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://127.0.0.1:5000/user/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        })
      });

      if (response.ok) {
        setSuccessMessage('✅ Contraseña cambiada exitosamente');
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
        
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.msg || 'Error al cambiar la contraseña'}`);
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      alert('❌ Error de conexión');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <div className={`perfil-container ${darkMode ? 'dark-mode' : ''}`}>
        <div className="perfil-loading-spinner"></div>
        <p style={{textAlign: 'center', color: darkMode ? '#e2e8f0' : '#666'}}>
          Cargando perfil...
        </p>
      </div>
    );
  }

  return (
    <div className={`perfil-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* Header con estilo similar */}
      <header className="perfil-header">
        <div className="perfil-content">
          <div className="perfil-section-header">
            <div className="perfil-header-title-container">
              <button 
                onClick={handleGoBack} 
                className="perfil-back-button"
                title="Regresar"
              >
                <img src={backIcon} alt="Regresar" className="perfil-btn-icon-img" />
              </button>
              <h3>Mi Perfil</h3>
            </div>
            <div className="perfil-header-buttons">
              {isAuthenticated ? (
                <button 
                  onClick={handleLogout} 
                  className="perfil-verify-code-btn"
                >
                  <img src={logoutIcon} alt="Salir" className="perfil-btn-icon-img" />
                  Cerrar Sesión
                </button>
              ) : (
                <button 
                  onClick={handleLoginRedirect} 
                  className="perfil-add-orden-btn"
                >
                  <img src={editIcon} alt="Iniciar sesión" className="perfil-btn-icon-img" />
                  Iniciar Sesión
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="perfil-content">
        {/* Mensaje de éxito */}
        {successMessage && (
          <div className="perfil-message-container success">
            <div className="perfil-message-icon">✓</div>
            <div className="perfil-message-text">{successMessage}</div>
          </div>
        )}

        {/* Aviso si no está autenticado */}
        {!isAuthenticated && (
          <div className="perfil-warning-container">
            <div className="perfil-warning-icon">⚠️</div>
            <div className="perfil-warning-text">
              <h4>Inicia sesión para gestionar tu perfil</h4>
              <p>Para guardar tus datos personales, cambiar contraseña y acceder a todas las funciones, necesitas iniciar sesión.</p>
              <button 
                onClick={handleLoginRedirect}
                className="perfil-primary-btn"
              >
                Iniciar Sesión
              </button>
            </div>
          </div>
        )}

        {/* Información del Usuario */}
        <div className="perfil-card">
          {/* Sección de Información del Usuario - CENTRADA */}
          <div className="perfil-user-info-section">
            <div className="perfil-user-avatar">
              <div className="perfil-avatar-circle">
                <img src={userIcon} alt="Usuario" className="perfil-avatar-img" />
              </div>
              <h3>{isAuthenticated && userData ? userData.nombre : 'Usuario'}</h3>
              <p className="perfil-user-email">
                {isAuthenticated && userData ? userData.correo : 'No autenticado'}
              </p>
              <div className="perfil-user-badge">
                {isAuthenticated && userData ? 
                  (userData.rol_texto === 'admin' ? '👑 Administrador' : '👤 Cliente') : 
                  '👤 Invitado'}
              </div>
              
              {/* Estadísticas debajo de la información del usuario */}
              <div className="perfil-user-stats">
                <div className="perfil-stat-item">
                  <span className="perfil-stat-label">Miembro desde</span>
                  <span className="perfil-stat-value">
                    {isAuthenticated && userData && userData.fecha_registro ? 
                      new Date(userData.fecha_registro).toLocaleDateString('es-MX') : 
                      'No disponible'}
                  </span>
                </div>
                <div className="perfil-stat-item">
                  <span className="perfil-stat-label">Rol</span>
                  <span className="perfil-stat-value">
                    {isAuthenticated && userData ? userData.rol_texto || 'Cliente' : 'Invitado'}
                  </span>
                </div>
                <div className="perfil-stat-item">
                  <span className="perfil-stat-label">Estado</span>
                  <span className={`perfil-stat-value ${isAuthenticated ? 'perfil-status-active' : 'perfil-status-inactive'}`}>
                    {isAuthenticated ? 'Activo' : 'No autenticado'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de Perfil */}
          <div className="perfil-form-section">
            <div className="perfil-section-header">
              <h3>Información Personal</h3>
              <div className="perfil-header-buttons">
                {isAuthenticated ? (
                  !editing ? (
                    <button 
                      className="perfil-add-orden-btn"
                      onClick={() => setEditing(true)}
                    >
                      <img src={editIcon} alt="Editar" className="perfil-btn-icon-img" />
                      Editar Perfil
                    </button>
                  ) : (
                    <button 
                      className="perfil-verify-code-btn"
                      onClick={() => {
                        setEditing(false);
                        if (userData) {
                          setFormData({
                            nombre: userData.nombre || '',
                            telefono: userData.telefono || '',
                            sexo: userData.sexo || '',
                            correo: userData.correo || ''
                          });
                        }
                        setErrors({});
                      }}
                    >
                      <img src={cancelIcon} alt="Cancelar" className="perfil-btn-icon-img" />
                      Cancelar
                    </button>
                  )
                ) : (
                  <button 
                    className="perfil-verify-code-btn"
                    onClick={handleLoginRedirect}
                  >
                    <img src={editIcon} alt="Iniciar sesión" className="perfil-btn-icon-img" />
                    Iniciar Sesión para Editar
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="perfil-profile-form">
              <div className="perfil-form-grid">
                <div className="perfil-form-group">
                  <label htmlFor="nombre">Nombre Completo *</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    disabled={!editing || !isAuthenticated}
                    className={`perfil-search-input ${errors.nombre ? 'perfil-input-error' : ''}`}
                    placeholder={isAuthenticated ? "Tu nombre completo" : "Inicia sesión para editar"}
                  />
                  {errors.nombre && (
                    <span className="perfil-error-message">{errors.nombre}</span>
                  )}
                </div>

                <div className="perfil-form-group">
                  <label htmlFor="correo">Correo Electrónico *</label>
                  <input
                    type="email"
                    id="correo"
                    name="correo"
                    value={formData.correo}
                    onChange={handleInputChange}
                    disabled={!editing || !isAuthenticated}
                    className={`perfil-search-input ${errors.correo ? 'perfil-input-error' : ''}`}
                    placeholder={isAuthenticated ? "correo@ejemplo.com" : "Inicia sesión para editar"}
                  />
                  {errors.correo && (
                    <span className="perfil-error-message">{errors.correo}</span>
                  )}
                </div>

                <div className="perfil-form-group">
                  <label htmlFor="telefono">Teléfono *</label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    disabled={!editing || !isAuthenticated}
                    className={`perfil-search-input ${errors.telefono ? 'perfil-input-error' : ''}`}
                    placeholder={isAuthenticated ? "10 dígitos" : "Inicia sesión para editar"}
                  />
                  {errors.telefono && (
                    <span className="perfil-error-message">{errors.telefono}</span>
                  )}
                </div>

                <div className="perfil-form-group">
                  <label htmlFor="sexo">Sexo</label>
                  <select
                    id="sexo"
                    name="sexo"
                    value={formData.sexo}
                    onChange={handleInputChange}
                    disabled={!editing || !isAuthenticated}
                    className="perfil-filter-select"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              {editing && isAuthenticated && (
                <div className="perfil-modal-footer">
                  <button type="submit" className="perfil-btn-save">
                    <img src={saveIcon} alt="Guardar" className="perfil-btn-icon-img" />
                    Guardar Cambios
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Sección de Seguridad */}
          <div className="perfil-security-section">
            <div className="perfil-section-header">
              <h3>Seguridad</h3>
            </div>
            <div className="perfil-security-content">
              <div className="perfil-security-info">
                <p className="perfil-security-note">
                  {isAuthenticated 
                    ? "Para cambiar tu contraseña, necesitarás ingresar tu contraseña actual. La nueva contraseña debe tener al menos 6 caracteres."
                    : "Inicia sesión para acceder a las opciones de seguridad y cambiar tu contraseña."
                  }
                </p>
                <button 
                  className="perfil-verify-code-btn"
                  onClick={() => {
                    if (!isAuthenticated) {
                      alert('⚠️ Debes iniciar sesión para cambiar tu contraseña');
                      navigate('/login');
                      return;
                    }
                    setShowPasswordModal(true);
                  }}
                  disabled={!isAuthenticated}
                >
                  <img src={passwordIcon} alt="Contraseña" className="perfil-btn-icon-img" />
                  {isAuthenticated ? "Cambiar Contraseña" : "Inicia sesión primero"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Cambiar Contraseña - Solo si está autenticado */}
      {showPasswordModal && isAuthenticated && (
        <div className="perfil-modal-overlay">
          <div className="perfil-modal-content">
            <div className="perfil-modal-header">
              <h3>🔒 Cambiar Contraseña</h3>
              <button 
                className="perfil-close-modal"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                  setErrors({});
                }}
              >
                ✕
              </button>
            </div>
            <div className="perfil-modal-body">
              <form onSubmit={handleChangePassword} className="perfil-password-form">
                <div className="perfil-form-group">
                  <label htmlFor="currentPassword">Contraseña Actual *</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className={`perfil-search-input ${errors.currentPassword ? 'perfil-input-error' : ''}`}
                    placeholder="Ingresa tu contraseña actual"
                  />
                  {errors.currentPassword && (
                    <span className="perfil-error-message">{errors.currentPassword}</span>
                  )}
                </div>

                <div className="perfil-form-group">
                  <label htmlFor="newPassword">Nueva Contraseña *</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={`perfil-search-input ${errors.newPassword ? 'perfil-input-error' : ''}`}
                    placeholder="Mínimo 6 caracteres"
                  />
                  {errors.newPassword && (
                    <span className="perfil-error-message">{errors.newPassword}</span>
                  )}
                </div>

                <div className="perfil-form-group">
                  <label htmlFor="confirmPassword">Confirmar Nueva Contraseña *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={`perfil-search-input ${errors.confirmPassword ? 'perfil-input-error' : ''}`}
                    placeholder="Repite la nueva contraseña"
                  />
                  {errors.confirmPassword && (
                    <span className="perfil-error-message">{errors.confirmPassword}</span>
                  )}
                </div>

                <div className="perfil-modal-footer">
                  <button 
                    type="button" 
                    className="perfil-btn-cancel"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                      setErrors({});
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="perfil-btn-save">
                    Cambiar Contraseña
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Perfil;