import React, { useState, useEffect } from 'react';
import { useConfig } from '../../context/config';
import '../../css/create-especial.css';

const EditEspecialForm = ({ especial, onClose, onEspecialUpdated }) => {
  const { darkMode } = useConfig();
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    activo: 'true'
  });
  const [ingredientes, setIngredientes] = useState(['']); // Array de ingredientes
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]); // Lista dinámica de ingredientes
  const [loading, setLoading] = useState(false);
  const [loadingIngredientes, setLoadingIngredientes] = useState(true);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Cargar datos del especial y ingredientes disponibles
  useEffect(() => {
    if (especial) {
      console.log('Especial recibido para editar:', especial);

      // Inicializar el formulario con los datos del especial existente
      setFormData({
        nombre: especial.nombre || '',
        precio: especial.precio ? especial.precio.toString() : '',
        activo: especial.activo ? 'true' : 'false'
      });

      // Inicializar los ingredientes desde el string separado por comas
      const ingredientesArray = especial.ingredientes 
        ? especial.ingredientes.split(',').map(ing => ing.trim()).filter(ing => ing)
        : [];
      
      // Agregar un campo vacío al final para que se pueda agregar más ingredientes
      setIngredientes([...ingredientesArray, '']);
    }
    
    fetchIngredientesDisponibles();
  }, [especial]);

  // Cargar ingredientes desde el backend
  const fetchIngredientesDisponibles = async () => {
    try {
      setLoadingIngredientes(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://127.0.0.1:5000/ingredientes/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filtrar solo ingredientes activos y mapear a un array de nombres
        const ingredientesActivos = data
          .filter(ing => ing.activo)
          .map(ing => ing.nombre)
          .sort(); // Ordenar alfabéticamente
        
        setIngredientesDisponibles(ingredientesActivos);
      } else {
        console.error('Error al obtener ingredientes:', response.status);
        // Si hay error, usar lista básica como fallback
        setIngredientesDisponibles([
          'Limon',
          'Chile en Polvo',
          'Sal',
          'Gomita Picante',
          'Gomita Dulce',
          'Gomitas Aciditas',
          'Chamoy',
          'salsa',
          'cacahuate',
          'Miguelito',
        ]);
      }
    } catch (error) {
      console.error('Error de conexión al obtener ingredientes:', error);
      setIngredientesDisponibles([
        'Limon',
        'Chile en Polvo',
        'Sal',
        'Gomita Picante',
        'Gomita Dulce',
        'Gomitas Aciditas',
        'Chamoy',
        'salsa',
        'cacahuate',
        'Miguelito',
      ]);
    } finally {
      setLoadingIngredientes(false);
    }
  };

  // Efecto para agregar automáticamente un nuevo select cuando se selecciona un ingrediente
  useEffect(() => {
    const ultimoIngrediente = ingredientes[ingredientes.length - 1];
    // Si el último ingrediente tiene un valor seleccionado
    if (ultimoIngrediente !== '') {
      setIngredientes(prev => [...prev, '']);
    }
  }, [ingredientes]);

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

  const handleIngredienteChange = (index, value) => {
    const newIngredientes = [...ingredientes];
    newIngredientes[index] = value;
    setIngredientes(newIngredientes);
    
    // Limpiar error de ingredientes si existe
    if (errors.ingredientes) {
      setErrors(prev => ({
        ...prev,
        ingredientes: ''
      }));
    }
  };

  const eliminarIngrediente = (index) => {
    if (ingredientes.length > 1) {
      const newIngredientes = ingredientes.filter((_, i) => i !== index);
      setIngredientes(newIngredientes);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del especial es obligatorio';
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validar que al menos un ingrediente esté seleccionado
    const ingredientesSeleccionados = ingredientes.filter(ing => ing !== '');
    if (ingredientesSeleccionados.length === 0) {
      newErrors.ingredientes = 'Debe seleccionar al menos un ingrediente';
    }

    if (!formData.precio) {
      newErrors.precio = 'El precio es obligatorio';
    } else {
      const precio = parseFloat(formData.precio);
      if (isNaN(precio) || precio <= 0) {
        newErrors.precio = 'El precio debe ser un número mayor a 0';
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
      
      // Convertir array de ingredientes a string separado por comas
      const ingredientesString = ingredientes
        .filter(ing => ing !== '')
        .join(', ');

      const especialData = {
        nombre: formData.nombre.trim(),
        ingredientes: ingredientesString,
        precio: parseFloat(formData.precio),
        activo: formData.activo === 'true'
      };

      console.log('Actualizando especial ID:', especial.id);
      console.log('Enviando datos del especial:', especialData);

      const response = await fetch(`http://127.0.0.1:5000/especiales/${especial.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(especialData)
      });

      console.log('Respuesta status:', response.status);
      
      const responseText = await response.text();
      console.log('Respuesta texto:', responseText);

      if (response.ok) {
        try {
          const result = JSON.parse(responseText);
          // Mostrar mensaje de éxito
          setSuccessMessage('El especial fue actualizado exitosamente');
          
          // Esperar 2 segundos antes de cerrar el modal y actualizar la lista
          setTimeout(() => {
            if (onEspecialUpdated) {
              onEspecialUpdated(result.especial);
            }
            onClose();
          }, 2000);
          
        } catch (parseError) {
          console.error('Error parseando JSON:', parseError);
          alert('Especial actualizado, pero hubo un error procesando la respuesta');
          onClose();
          if (onEspecialUpdated) {
            onEspecialUpdated();
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
        alert(`Error al actualizar especial: ${errorMsg}`);
      }

    } catch (error) {
      console.error('Error de conexión:', error);
      alert('Error de conexión al actualizar especial: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className={`create-especial-form ${darkMode ? 'create-especial-form-dark-mode' : ''}`}>
      <form className="create-especial-form-form" onSubmit={handleSubmit}>
        {/* Mensaje de éxito */}
        {successMessage && (
          <div className="create-success-message">
            {successMessage}
          </div>
        )}

        {/* Nombre del especial */}
        <div className="create-form-row">
          <div className="create-form-group create-form-group-full-width">
            <label htmlFor="edit-nombre">Nombre del especial *</label>
            <input
              type="text"
              id="edit-nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={errors.nombre ? 'create-input-error' : ''}
              placeholder="Ej: Especial de la Casa, Combo Familiar, etc."
              maxLength="100"
            />
            {errors.nombre && <span className="create-error-message">{errors.nombre}</span>}
          </div>
        </div>

        {/* Ingredientes - Selects dinámicos automáticos */}
        <div className="create-form-row">
          <div className="create-form-group create-form-group-full-width">
            <label>
              Ingredientes *
              {loadingIngredientes && (
                <span className="loading-ingredientes-text"> (Cargando ingredientes...)</span>
              )}
            </label>
            <div className="ingredientes-container">
              {loadingIngredientes ? (
                <div className="loading-ingredientes">
                  <div className="spinner-small"></div>
                  <span>Cargando lista de ingredientes...</span>
                </div>
              ) : (
                <>
                  {ingredientes.map((ingrediente, index) => (
                    <div key={index} className="ingrediente-row">
                      <select
                        value={ingrediente}
                        onChange={(e) => handleIngredienteChange(index, e.target.value)}
                        className={`create-select ${errors.ingredientes && index === 0 ? 'create-input-error' : ''}`}
                        disabled={loadingIngredientes}
                      >
                        <option value="">Selecciona un ingrediente</option>
                        {ingredientesDisponibles.map((ing, i) => (
                          <option 
                            key={i} 
                            value={ing}
                            disabled={ingredientes.includes(ing) && ingrediente !== ing}
                          >
                            {ing}
                          </option>
                        ))}
                      </select>
                      {ingredientes.length > 1 && (
                        <button
                          type="button"
                          className="remove-ingrediente-btn"
                          onClick={() => eliminarIngrediente(index)}
                          title="Eliminar ingrediente"
                          disabled={loadingIngredientes}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {errors.ingredientes && (
                    <span className="create-error-message">{errors.ingredientes}</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Precio y Estado - en la misma fila */}
        <div className="create-form-row">
          <div className="create-price-status-fields">
            <div className="create-form-group">
              <label htmlFor="edit-precio">Precio ($) *</label>
              <input
                type="number"
                id="edit-precio"
                name="precio"
                value={formData.precio}
                onChange={handleChange}
                className={errors.precio ? 'create-input-error' : ''}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              {errors.precio && <span className="create-error-message">{errors.precio}</span>}
            </div>

            <div className="create-form-group">
              <label htmlFor="edit-activo">Estado *</label>
              <select
                id="edit-activo"
                name="activo"
                value={formData.activo}
                onChange={handleChange}
                className="create-select"
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="create-form-actions">
          <button 
            type="button" 
            className="create-btn-cancel"
            onClick={handleCancel}
            disabled={loading || loadingIngredientes}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="create-btn-submit"
            disabled={loading || loadingIngredientes || successMessage}
          >
            {loading ? 'Actualizando...' : 'Actualizar Especial'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditEspecialForm;