import React, { useState, useEffect } from 'react';
import { useConfig } from '../../context/config';
import '../../css/edit-user.css';

const EditUserForm = ({ user, onClose, onUserUpdated }) => {
  const { darkMode } = useConfig();
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    rol: '2',
    sexo: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [changePassword, setChangePassword] = useState(false);

  // Cargar datos del usuario cuando el componente se monta
  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        correo: user.correo || '',
        telefono: user.telefono || '',
        password: '',
        confirmPassword: '',
        rol: user.rol?.toString() || '2',
        sexo: user.sexo || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    // Limpiar mensaje de éxito cuando el usuario modifique algún campo
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handlePasswordToggle = () => {
    setChangePassword(!changePassword);
    // Limpiar campos de contraseña cuando se desactiva
    if (changePassword) {
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
      setErrors(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.correo.trim()) {
      newErrors.correo = 'El correo es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.correo)) {
      newErrors.correo = 'El correo no es válido';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es obligatorio';
    }

    if (!formData.sexo) {
      newErrors.sexo = 'El sexo es obligatorio';
    }

    // Validar contraseñas solo si se activó el cambio
    if (changePassword) {
      if (!formData.password) {
        newErrors.password = 'La contraseña es obligatoria';
      } else if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const userData = {
        name: formData.nombre,
        email: formData.correo,
        telefono: formData.telefono,
        role: parseInt(formData.rol),
        sexo: formData.sexo
      };

      // Solo incluir password si se activó el cambio
      if (changePassword && formData.password) {
        userData.password = formData.password;
      }

      console.log('Actualizando usuario:', user.id, userData);

      const response = await fetch(`http://127.0.0.1:5000/user/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      console.log('Respuesta status:', response.status);
      
      const responseText = await response.text();
      console.log('Respuesta texto:', responseText);

      if (response.ok) {
        try {
          const result = JSON.parse(responseText);
          // Mostrar mensaje de éxito
          setSuccessMessage('Usuario actualizado exitosamente');
          
          // Esperar 2 segundos antes de cerrar el modal y actualizar la lista
          setTimeout(() => {
            if (onUserUpdated) {
              onUserUpdated(result.user);
            }
            onClose();
          }, 2000);
          
        } catch (parseError) {
          console.error('Error parseando JSON:', parseError);
          alert('Usuario actualizado, pero hubo un error procesando la respuesta');
          onClose();
          if (onUserUpdated) {
            onUserUpdated();
          }
        }
      } else {
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMsg = errorData.msg || errorMsg;
        } catch (e) {
          errorMsg = responseText || errorMsg;
        }
        alert(`Error al actualizar usuario: ${errorMsg}`);
      }

    } catch (error) {
      console.error('Error de conexión:', error);
      alert('Error de conexión al actualizar usuario: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`edit-user-form ${darkMode ? 'edit-user-form-dark-mode' : ''}`}>
      <form className="edit-user-form-form" onSubmit={handleSubmit}>
        {/* Mensaje de éxito */}
        {successMessage && (
          <div className="edit-user-success-message">
            {successMessage}
          </div>
        )}

        {/* Nombre completo */}
        <div className="edit-form-row">
          <div className="edit-form-group edit-form-group-full-width">
            <label htmlFor="edit-nombre">Nombre completo *</label>
            <input
              type="text"
              id="edit-nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={errors.nombre ? 'edit-input-error' : ''}
              placeholder="Ingresa el nombre completo"
            />
            {errors.nombre && <span className="edit-error-message">{errors.nombre}</span>}
          </div>
        </div>

        {/* Correo electrónico */}
        <div className="edit-form-row">
          <div className="edit-form-group edit-form-group-full-width">
            <label htmlFor="edit-correo">Correo electrónico *</label>
            <input
              type="email"
              id="edit-correo"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              className={errors.correo ? 'edit-input-error' : ''}
              placeholder="Ingresa el correo electrónico"
            />
            {errors.correo && <span className="edit-error-message">{errors.correo}</span>}
          </div>
        </div>

        {/* Teléfono */}
        <div className="edit-form-row">
          <div className="edit-form-group edit-form-group-full-width">
            <label htmlFor="edit-telefono">Teléfono *</label>
            <input
              type="tel"
              id="edit-telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className={errors.telefono ? 'edit-input-error' : ''}
              placeholder="Ingresa el número de teléfono"
            />
            {errors.telefono && <span className="edit-error-message">{errors.telefono}</span>}
          </div>
        </div>

        {/* Opción para cambiar contraseña */}
        <div className="edit-password-toggle">
          <label className="edit-toggle-label">
            <input
              type="checkbox"
              checked={changePassword}
              onChange={handlePasswordToggle}
              className="edit-toggle-input"
            />
            <span className="edit-toggle-slider"></span>
            Cambiar contraseña
          </label>
        </div>

        {/* Campos de contraseña - solo se muestran si está activado */}
        {changePassword && (
          <div className="edit-form-row">
            <div className="edit-password-fields">
              <div className="edit-form-group">
                <label htmlFor="edit-password">Nueva contraseña *</label>
                <input
                  type="password"
                  id="edit-password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'edit-input-error' : ''}
                  placeholder="Ingresa la nueva contraseña"
                />
                {errors.password && <span className="edit-error-message">{errors.password}</span>}
              </div>

              <div className="edit-form-group">
                <label htmlFor="edit-confirmPassword">Confirmar contraseña *</label>
                <input
                  type="password"
                  id="edit-confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'edit-input-error' : ''}
                  placeholder="Confirma la nueva contraseña"
                />
                {errors.confirmPassword && <span className="edit-error-message">{errors.confirmPassword}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Rol y Sexo - en la misma fila */}
        <div className="edit-form-row">
          <div className="edit-role-sex-fields">
            <div className="edit-form-group">
              <label htmlFor="edit-rol">Rol *</label>
              <select
                id="edit-rol"
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="edit-select"
              >
                <option value="2">Usuario</option>
                <option value="3">Estilista</option>
                <option value="1">Administrador</option>
              </select>
            </div>

            <div className="edit-form-group">
              <label htmlFor="edit-sexo">Sexo *</label>
              <select
                id="edit-sexo"
                name="sexo"
                value={formData.sexo}
                onChange={handleChange}
                className={errors.sexo ? 'edit-select-error' : 'edit-select'}
              >
                <option value="">Selecciona una opción</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
              {errors.sexo && <span className="edit-error-message">{errors.sexo}</span>}
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="edit-form-actions">
          <button 
            type="button" 
            className="edit-btn-cancel"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="edit-btn-submit"
            disabled={loading || successMessage}
          >
            {loading ? 'Actualizando...' : 'Actualizar Usuario'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUserForm;