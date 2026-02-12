import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../../context/config';
import '../../css/perfil.css';

// Importar íconos existentes
import editIcon from '../../img/edit.png';
import saveIcon from '../../img/mas.png';
import cancelIcon from '../../img/cancelar.png';
import passwordIcon from '../../img/password.png';
import logoutIcon from '../../img/salida.png';
import userIcon from '../../img/user.png';
import backIcon from '../../img/atras.png';

// Nuevos íconos para direcciones
import addIcon from '../../img/mas.png';
import deleteIcon from '../../img/delete.png';
import homeIcon from '../../img/casa.png';
import workIcon from '../../img/trabajo.png';
import otherIcon from '../../img/ubicacion.png';
import defaultIcon from '../../img/estrella.png';
import chevronLeftIcon from '../../img/derecha.png';
import chevronRightIcon from '../../img/izquierda.png';

const Perfil = () => {
  const navigate = useNavigate();
  const { t, darkMode } = useConfig();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDirecciones, setLoadingDirecciones] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingDirecciones, setEditingDirecciones] = useState(false);
  const [currentStep, setCurrentStep] = useState('perfil'); // 'perfil' o 'direcciones'
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Datos del formulario de perfil
  const [profileForm, setProfileForm] = useState({
    nombre: '',
    telefono: '',
    sexo: '',
    correo: ''
  });

  // Datos para las direcciones
  const [direcciones, setDirecciones] = useState([]);
  const [direccionesForm, setDireccionesForm] = useState([{
    calle: '',
    numero_exterior: '',
    numero_interior: '',
    colonia: '',
    ciudad: '',
    estado: '',
    codigo_postal: '',
    referencias: '',
    tipo: 'casa',
    predeterminada: true
  }]);

  // Verificar si el usuario está autenticado
  const isAuthenticated = localStorage.getItem('token') !== null;

  // Cargar datos del usuario y direcciones
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserData();
      fetchDirecciones();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchUserData = async () => {
    try {
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
        setProfileForm({
          nombre: data.nombre || '',
          telefono: data.telefono || '',
          sexo: data.sexo || '',
          correo: data.correo || ''
        });
      }
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDirecciones = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoadingDirecciones(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://127.0.0.1:5000/direcciones/me/direcciones', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDirecciones(data.direcciones || []);
        
        // Si no hay direcciones, mantener el formulario vacío
        if (data.direcciones && data.direcciones.length > 0) {
          setDireccionesForm(data.direcciones.map(dir => ({
            id: dir.id,
            calle: dir.calle || '',
            numero_exterior: dir.numero_exterior || '',
            numero_interior: dir.numero_interior || '',
            colonia: dir.colonia || '',
            ciudad: dir.ciudad || '',
            estado: dir.estado || '',
            codigo_postal: dir.codigo_postal || '',
            referencias: dir.referencias || '',
            tipo: dir.tipo || 'casa',
            predeterminada: dir.predeterminada || false
          })));
        }
      }
    } catch (error) {
      console.error('Error al obtener direcciones:', error);
    } finally {
      setLoadingDirecciones(false);
    }
  };

  // Manejar cambios en el perfil
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Manejar cambios en direcciones
  const handleDireccionChange = (index, field, value) => {
    const updatedDirecciones = [...direccionesForm];
    updatedDirecciones[index][field] = value;
    
    // Si se marca como predeterminada, desmarcar las otras
    if (field === 'predeterminada' && value === true) {
      updatedDirecciones.forEach((dir, i) => {
        if (i !== index) dir.predeterminada = false;
      });
    }
    
    setDireccionesForm(updatedDirecciones);
  };

  // Agregar nueva dirección
  const handleAddDireccion = () => {
    setDireccionesForm(prev => [...prev, {
      calle: '',
      numero_exterior: '',
      numero_interior: '',
      colonia: '',
      ciudad: '',
      estado: '',
      codigo_postal: '',
      referencias: '',
      tipo: 'casa',
      predeterminada: prev.length === 0 // Primera dirección es predeterminada
    }]);
  };

  // Eliminar dirección
  const handleRemoveDireccion = (index) => {
    if (direccionesForm.length > 1) {
      const updatedDirecciones = direccionesForm.filter((_, i) => i !== index);
      const removedWasPredeterminada = direccionesForm[index].predeterminada;
      
      // Si se eliminó la dirección predeterminada, marcar la primera como predeterminada
      if (removedWasPredeterminada && updatedDirecciones.length > 0) {
        updatedDirecciones[0].predeterminada = true;
      }
      
      setDireccionesForm(updatedDirecciones);
    }
  };

  // Cambiar contraseña
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Validaciones
  const validateProfileForm = () => {
    const newErrors = {};

    if (!profileForm.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (profileForm.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!profileForm.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    } else if (!/^\d{10}$/.test(profileForm.telefono.trim())) {
      newErrors.telefono = 'El teléfono debe tener 10 dígitos';
    }

    if (!profileForm.correo.trim()) {
      newErrors.correo = 'El correo es requerido';
    } else if (!/\S+@\S+\.\S+/.test(profileForm.correo)) {
      newErrors.correo = 'Correo electrónico inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDireccionesForm = () => {
    const newErrors = {};
    
    direccionesForm.forEach((dir, index) => {
      if (!dir.calle.trim()) newErrors[`calle_${index}`] = 'La calle es requerida';
      if (!dir.numero_exterior.trim()) newErrors[`numero_exterior_${index}`] = 'El número exterior es requerido';
      if (!dir.colonia.trim()) newErrors[`colonia_${index}`] = 'La colonia es requerida';
      if (!dir.ciudad.trim()) newErrors[`ciudad_${index}`] = 'La ciudad es requerida';
      if (!dir.estado.trim()) newErrors[`estado_${index}`] = 'El estado es requerido';
      if (!dir.codigo_postal.trim()) newErrors[`codigo_postal_${index}`] = 'El código postal es requerido';
      else if (!/^\d{5}$/.test(dir.codigo_postal)) newErrors[`codigo_postal_${index}`] = 'El código postal debe tener 5 dígitos';
    });

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

  // Actualizar perfil
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('⚠️ Debes iniciar sesión para actualizar tu perfil');
      navigate('/login');
      return;
    }
    
    if (!validateProfileForm()) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://127.0.0.1:5000/user/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileForm)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUserData(updatedUser.user);
        setSuccessMessage('✅ Perfil actualizado exitosamente');
        setEditingProfile(false);
        
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.msg || 'Error al actualizar el perfil'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión');
    }
  };

  // Guardar direcciones
  const handleSaveDirecciones = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('⚠️ Debes iniciar sesión para guardar direcciones');
      navigate('/login');
      return;
    }
    
    if (!validateDireccionesForm()) return;

    try {
      const token = localStorage.getItem('token');
      let hasError = false;

      // Para cada dirección, crear o actualizar
      for (const dir of direccionesForm) {
        const url = dir.id 
          ? `http://127.0.0.1:5000/direcciones/${dir.id}`
          : 'http://127.0.0.1:5000/direcciones/me/direcciones';
        
        const method = dir.id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dir)
        });

        if (!response.ok) {
          hasError = true;
          const errorData = await response.json();
          console.error('Error al guardar dirección:', errorData);
        }
      }

      if (!hasError) {
        setSuccessMessage('✅ Direcciones actualizadas exitosamente');
        setEditingDirecciones(false);
        fetchDirecciones(); // Recargar direcciones
        
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('❌ Hubo un error al guardar algunas direcciones');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión');
    }
  };

  // Eliminar dirección de la base de datos
  const handleDeleteDireccion = async (direccionId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta dirección?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://127.0.0.1:5000/direcciones/${direccionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccessMessage('✅ Dirección eliminada exitosamente');
        fetchDirecciones(); // Recargar direcciones
        
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.msg || 'Error al eliminar la dirección'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión');
    }
  };

  // Cambiar contraseña
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('⚠️ Debes iniciar sesión para cambiar tu contraseña');
      navigate('/login');
      return;
    }
    
    if (!validatePasswordForm()) return;

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
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.msg || 'Error al cambiar la contraseña'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión');
    }
  };

  // Navegación
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  const handleGoBack = () => {
    if (currentStep === 'direcciones') {
      setCurrentStep('perfil');
      setEditingDirecciones(false);
    } else {
      navigate(-1);
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  // Renderizar paso de perfil
  const renderPerfilStep = () => (
    <>
      {/* Sección de Información del Usuario */}
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
              <span className="perfil-stat-label">Direcciones</span>
              <span className="perfil-stat-value">
                {direcciones.length} {direcciones.length === 1 ? 'dirección' : 'direcciones'}
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
              !editingProfile ? (
                <button 
                  className="perfil-add-orden-btn"
                  onClick={() => setEditingProfile(true)}
                >
                  <img src={editIcon} alt="Editar" className="perfil-btn-icon-img" />
                  Editar Perfil
                </button>
              ) : (
                <button 
                  className="perfil-verify-code-btn"
                  onClick={() => {
                    setEditingProfile(false);
                    if (userData) {
                      setProfileForm({
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
                value={profileForm.nombre}
                onChange={handleProfileChange}
                disabled={!editingProfile || !isAuthenticated}
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
                value={profileForm.correo}
                onChange={handleProfileChange}
                disabled={!editingProfile || !isAuthenticated}
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
                value={profileForm.telefono}
                onChange={handleProfileChange}
                disabled={!editingProfile || !isAuthenticated}
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
                value={profileForm.sexo}
                onChange={handleProfileChange}
                disabled={!editingProfile || !isAuthenticated}
                className="perfil-filter-select"
              >
                <option value="">Seleccionar</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          {editingProfile && isAuthenticated && (
            <div className="perfil-modal-footer">
              <button type="submit" className="perfil-btn-save">
                <img src={saveIcon} alt="Guardar" className="perfil-btn-icon-img" />
                Guardar Cambios
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Sección de Direcciones */}
      <div className="perfil-security-section">
        <div className="perfil-section-header">
          <h3>Mis Direcciones</h3>
          <div className="perfil-header-buttons">
            {isAuthenticated && (
              <button 
                className="perfil-add-orden-btn"
                onClick={() => setCurrentStep('direcciones')}
              >
                <img src={addIcon} alt="Direcciones" className="perfil-btn-icon-img" />
                Gestionar Direcciones
              </button>
            )}
          </div>
        </div>
        <div className="perfil-security-content">
          {loadingDirecciones ? (
            <div className="perfil-loading-spinner"></div>
          ) : direcciones.length === 0 ? (
            <p className="perfil-security-note">
              {isAuthenticated 
                ? "No tienes direcciones registradas. Agrega al menos una dirección para recibir tus pedidos."
                : "Inicia sesión para ver y gestionar tus direcciones."
              }
            </p>
          ) : (
            <div className="direcciones-list">
              {direcciones.slice(0, 2).map((dir, index) => (
                <div key={dir.id || index} className="direccion-item">
                  <div className="direccion-item-header">
                    <div className="direccion-tipo">
                      {dir.tipo === 'casa' && <img src={homeIcon} alt="Casa" className="direccion-icon" />}
                      {dir.tipo === 'trabajo' && <img src={workIcon} alt="Trabajo" className="direccion-icon" />}
                      {dir.tipo === 'otro' && <img src={otherIcon} alt="Otro" className="direccion-icon" />}
                      <span>{dir.tipo === 'casa' ? 'Casa' : dir.tipo === 'trabajo' ? 'Trabajo' : 'Otro'}</span>
                      {dir.predeterminada && (
                        <span className="direccion-predeterminada">
                          <img src={defaultIcon} alt="Predeterminada" className="direccion-icon" />
                          Predeterminada
                        </span>
                      )}
                    </div>
                    {isAuthenticated && (
                      <button 
                        className="direccion-delete-btn"
                        onClick={() => handleDeleteDireccion(dir.id)}
                        title="Eliminar dirección"
                      >
                        <img src={deleteIcon} alt="Eliminar" className="direccion-icon" />
                      </button>
                    )}
                  </div>
                  <div className="direccion-info">
                    <p>{dir.calle} #{dir.numero_exterior}{dir.numero_interior ? ` Int. ${dir.numero_interior}` : ''}</p>
                    <p>{dir.colonia}, {dir.ciudad}, {dir.estado}</p>
                    <p>CP: {dir.codigo_postal}</p>
                    {dir.referencias && <p className="direccion-referencias">{dir.referencias}</p>}
                  </div>
                </div>
              ))}
              {direcciones.length > 2 && (
                <p className="perfil-security-note">
                  +{direcciones.length - 2} dirección(es) más...
                </p>
              )}
            </div>
          )}
        </div>
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
    </>
  );

  // Renderizar paso de direcciones
  const renderDireccionesStep = () => (
    <>
      <div className="perfil-section-header">
        <h3>Gestionar Direcciones</h3>
        <div className="perfil-header-buttons">
          <button 
            className="perfil-verify-code-btn"
            onClick={() => {
              setCurrentStep('perfil');
              setEditingDirecciones(false);
              fetchDirecciones(); // Recargar direcciones
            }}
          >
            <img src={chevronLeftIcon} alt="Regresar" className="perfil-btn-icon-img" />
            Volver al Perfil
          </button>
        </div>
      </div>

      <div className="direcciones-form-container">
        <form onSubmit={handleSaveDirecciones} className="perfil-profile-form">
          {direccionesForm.map((direccion, index) => (
            <div key={index} className="direccion-form-card">
              <div className="direccion-form-header">
                <h4>Dirección {index + 1}</h4>
                {direccionesForm.length > 1 && (
                  <button
                    type="button"
                    className="direccion-delete-btn"
                    onClick={() => handleRemoveDireccion(index)}
                    disabled={direccion.predeterminada}
                    title={direccion.predeterminada ? "No se puede eliminar la dirección predeterminada" : "Eliminar dirección"}
                  >
                    <img src={deleteIcon} alt="Eliminar" className="direccion-icon" />
                  </button>
                )}
              </div>
              
              <div className="direccion-form-grid">
                <div className="perfil-form-group">
                  <label>Calle *</label>
                  <input
                    type="text"
                    value={direccion.calle}
                    onChange={(e) => handleDireccionChange(index, 'calle', e.target.value)}
                    disabled={!isAuthenticated}
                    className={`perfil-search-input ${errors[`calle_${index}`] ? 'perfil-input-error' : ''}`}
                    placeholder="Nombre de la calle"
                  />
                  {errors[`calle_${index}`] && (
                    <span className="perfil-error-message">{errors[`calle_${index}`]}</span>
                  )}
                </div>
                
                <div className="perfil-form-group">
                  <label>Número Exterior *</label>
                  <input
                    type="text"
                    value={direccion.numero_exterior}
                    onChange={(e) => handleDireccionChange(index, 'numero_exterior', e.target.value)}
                    disabled={!isAuthenticated}
                    className={`perfil-search-input ${errors[`numero_exterior_${index}`] ? 'perfil-input-error' : ''}`}
                    placeholder="123"
                  />
                  {errors[`numero_exterior_${index}`] && (
                    <span className="perfil-error-message">{errors[`numero_exterior_${index}`]}</span>
                  )}
                </div>
                
                <div className="perfil-form-group">
                  <label>Número Interior</label>
                  <input
                    type="text"
                    value={direccion.numero_interior}
                    onChange={(e) => handleDireccionChange(index, 'numero_interior', e.target.value)}
                    disabled={!isAuthenticated}
                    className="perfil-search-input"
                    placeholder="A"
                  />
                </div>
                
                <div className="perfil-form-group">
                  <label>Colonia *</label>
                  <input
                    type="text"
                    value={direccion.colonia}
                    onChange={(e) => handleDireccionChange(index, 'colonia', e.target.value)}
                    disabled={!isAuthenticated}
                    className={`perfil-search-input ${errors[`colonia_${index}`] ? 'perfil-input-error' : ''}`}
                    placeholder="Nombre de la colonia"
                  />
                  {errors[`colonia_${index}`] && (
                    <span className="perfil-error-message">{errors[`colonia_${index}`]}</span>
                  )}
                </div>
                
                <div className="perfil-form-group">
                  <label>Ciudad *</label>
                  <input
                    type="text"
                    value={direccion.ciudad}
                    onChange={(e) => handleDireccionChange(index, 'ciudad', e.target.value)}
                    disabled={!isAuthenticated}
                    className={`perfil-search-input ${errors[`ciudad_${index}`] ? 'perfil-input-error' : ''}`}
                    placeholder="Nombre de la ciudad"
                  />
                  {errors[`ciudad_${index}`] && (
                    <span className="perfil-error-message">{errors[`ciudad_${index}`]}</span>
                  )}
                </div>
                
                <div className="perfil-form-group">
                  <label>Estado *</label>
                  <input
                    type="text"
                    value={direccion.estado}
                    onChange={(e) => handleDireccionChange(index, 'estado', e.target.value)}
                    disabled={!isAuthenticated}
                    className={`perfil-search-input ${errors[`estado_${index}`] ? 'perfil-input-error' : ''}`}
                    placeholder="Nombre del estado"
                  />
                  {errors[`estado_${index}`] && (
                    <span className="perfil-error-message">{errors[`estado_${index}`]}</span>
                  )}
                </div>
                
                <div className="perfil-form-group">
                  <label>Código Postal *</label>
                  <input
                    type="text"
                    value={direccion.codigo_postal}
                    onChange={(e) => handleDireccionChange(index, 'codigo_postal', e.target.value)}
                    disabled={!isAuthenticated}
                    className={`perfil-search-input ${errors[`codigo_postal_${index}`] ? 'perfil-input-error' : ''}`}
                    placeholder="12345"
                    maxLength="5"
                  />
                  {errors[`codigo_postal_${index}`] && (
                    <span className="perfil-error-message">{errors[`codigo_postal_${index}`]}</span>
                  )}
                </div>
                
                <div className="perfil-form-group">
                  <label>Tipo de Dirección</label>
                  <select
                    value={direccion.tipo}
                    onChange={(e) => handleDireccionChange(index, 'tipo', e.target.value)}
                    disabled={!isAuthenticated}
                    className="perfil-filter-select"
                  >
                    <option value="casa">🏠 Casa</option>
                    <option value="trabajo">💼 Trabajo</option>
                    <option value="otro">📍 Otro</option>
                  </select>
                </div>
                
                <div className="perfil-form-group full-width">
                  <label>Referencias</label>
                  <textarea
                    value={direccion.referencias}
                    onChange={(e) => handleDireccionChange(index, 'referencias', e.target.value)}
                    disabled={!isAuthenticated}
                    className="perfil-search-input"
                    placeholder="Entre calles, puntos de referencia, etc."
                    rows="3"
                  />
                </div>
                
                <div className="perfil-form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={direccion.predeterminada}
                      onChange={(e) => handleDireccionChange(index, 'predeterminada', e.target.checked)}
                      disabled={!isAuthenticated}
                    />
                    <span className="checkbox-custom"></span>
                    Dirección predeterminada
                  </label>
                </div>
              </div>
            </div>
          ))}
          
          <div className="direcciones-actions">
            <button
              type="button"
              className="perfil-add-orden-btn"
              onClick={handleAddDireccion}
              disabled={!isAuthenticated}
            >
              <img src={addIcon} alt="Agregar" className="perfil-btn-icon-img" />
              Agregar otra dirección
            </button>
            
            <div className="perfil-modal-footer">
              <button 
                type="button" 
                className="perfil-btn-cancel"
                onClick={() => {
                  setCurrentStep('perfil');
                  setEditingDirecciones(false);
                  fetchDirecciones();
                }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="perfil-btn-save"
                disabled={!isAuthenticated}
              >
                <img src={saveIcon} alt="Guardar" className="perfil-btn-icon-img" />
                Guardar todas las direcciones
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );

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
      {/* Header */}
      <header className="perfil-header">
        <div className="perfil-content">
          <div className="perfil-section-header">
            <div className="perfil-header-title-container">
              <button 
                onClick={handleGoBack} 
                className="perfil-back-button"
                title={currentStep === 'direcciones' ? "Volver al perfil" : "Regresar"}
              >
                <img src={backIcon} alt="Regresar" className="perfil-btn-icon-img" />
              </button>
              <h3>{currentStep === 'direcciones' ? 'Mis Direcciones' : 'Mi Perfil'}</h3>
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

        {/* Perfil Card */}
        <div className="perfil-card">
          {currentStep === 'perfil' ? renderPerfilStep() : renderDireccionesStep()}
        </div>
      </div>

      {/* Modal para Cambiar Contraseña */}
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