import React, { useState } from 'react';
import { useConfig } from '../../context/config';
import '../../css/create-user.css';

const CreateUserForm = ({ onClose, onUserCreated }) => {
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

    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.sexo) {
      newErrors.sexo = 'El sexo es obligatorio';
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
      
      // Usar la ruta correcta: /add_user
      const userData = {
        name: formData.nombre,
        email: formData.correo,
        telefono: formData.telefono,
        password: formData.password,
        role: parseInt(formData.rol),
        sexo: formData.sexo
      };

      console.log('Enviando datos:', userData);

      const response = await fetch('http://127.0.0.1:5000/user/add_user', {
        method: 'POST',
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
          // Mostrar mensaje de éxito en lugar de alert
          setSuccessMessage('El usuario fue creado exitosamente');
          
          // Limpiar el formulario
          setFormData({
            nombre: '',
            correo: '',
            telefono: '',
            password: '',
            confirmPassword: '',
            rol: '2',
            sexo: ''
          });
          
          // Esperar 2 segundos antes de cerrar el modal y actualizar la lista
          setTimeout(() => {
            if (onUserCreated) {
              onUserCreated(result.user);
            }
            onClose();
          }, 2000);
          
        } catch (parseError) {
          console.error('Error parseando JSON:', parseError);
          alert('Usuario creado, pero hubo un error procesando la respuesta');
          onClose();
          if (onUserCreated) {
            onUserCreated();
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
        alert(`Error al crear usuario: ${errorMsg}`);
      }

    } catch (error) {
      console.error('Error de conexión:', error);
      alert('Error de conexión al crear usuario: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className={`create-user-form ${darkMode ? 'create-user-form-dark-mode' : ''}`}>
      <form className="create-user-form-form" onSubmit={handleSubmit}>
        {/* Mensaje de éxito */}
        {successMessage && (
          <div className="create-success-message">
            {successMessage}
          </div>
        )}

        {/* Nombre completo */}
        <div className="create-form-row">
          <div className="create-form-group create-form-group-full-width">
            <label htmlFor="create-nombre">Nombre completo *</label>
            <input
              type="text"
              id="create-nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={errors.nombre ? 'create-input-error' : ''}
              placeholder="Ingresa el nombre completo"
            />
            {errors.nombre && <span className="create-error-message">{errors.nombre}</span>}
          </div>
        </div>

        {/* Correo electrónico */}
        <div className="create-form-row">
          <div className="create-form-group create-form-group-full-width">
            <label htmlFor="create-correo">Correo electrónico *</label>
            <input
              type="email"
              id="create-correo"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              className={errors.correo ? 'create-input-error' : ''}
              placeholder="Ingresa el correo electrónico"
            />
            {errors.correo && <span className="create-error-message">{errors.correo}</span>}
          </div>
        </div>

        {/* Teléfono */}
        <div className="create-form-row">
          <div className="create-form-group create-form-group-full-width">
            <label htmlFor="create-telefono">Teléfono *</label>
            <input
              type="tel"
              id="create-telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className={errors.telefono ? 'create-input-error' : ''}
              placeholder="Ingresa el número de teléfono"
            />
            {errors.telefono && <span className="create-error-message">{errors.telefono}</span>}
          </div>
        </div>

        {/* Contraseñas - en la misma fila */}
        <div className="create-form-row">
          <div className="create-password-fields">
            <div className="create-form-group">
              <label htmlFor="create-password">Contraseña *</label>
              <input
                type="password"
                id="create-password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'create-input-error' : ''}
                placeholder="Ingresa la contraseña"
              />
              {errors.password && <span className="create-error-message">{errors.password}</span>}
            </div>

            <div className="create-form-group">
              <label htmlFor="create-confirmPassword">Confirmar contraseña *</label>
              <input
                type="password"
                id="create-confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'create-input-error' : ''}
                placeholder="Confirma la contraseña"
              />
              {errors.confirmPassword && <span className="create-error-message">{errors.confirmPassword}</span>}
            </div>
          </div>
        </div>

        {/* Rol y Sexo - en la misma fila */}
        <div className="create-form-row">
          <div className="create-role-sex-fields">
            <div className="create-form-group">
              <label htmlFor="create-rol">Rol *</label>
              <select
                id="create-rol"
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="create-select"
              >
                <option value="2">Usuario</option>
                <option value="3">Estilista</option>
                <option value="1">Administrador</option>
              </select>
            </div>

            <div className="create-form-group">
              <label htmlFor="create-sexo">Sexo *</label>
              <select
                id="create-sexo"
                name="sexo"
                value={formData.sexo}
                onChange={handleChange}
                className={errors.sexo ? 'create-select-error' : 'create-select'}
              >
                <option value="">Selecciona una opción</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
              {errors.sexo && <span className="create-error-message">{errors.sexo}</span>}
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="create-form-actions">
          <button 
            type="button" 
            className="create-btn-cancel"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="create-btn-submit"
            disabled={loading || successMessage}
          >
            {loading ? 'Creando...' : 'Crear Usuario'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateUserForm;