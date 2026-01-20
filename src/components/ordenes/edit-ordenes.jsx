import React, { useState, useEffect } from 'react';
import { useConfig } from '../../context/config';
import '../../css/edit-ordenes.css';

const EditOrdenForm = ({ orden, onClose, onOrdenUpdated }) => {
  const { darkMode } = useConfig();
  const [formData, setFormData] = useState({
    tipo_pedido: 'especial',
    especial_id: '',
    ingredientes_personalizados: '',
    estado: 'pendiente'
  });
  const [especiales, setEspeciales] = useState([]);
  const [ingredientesSeleccionados, setIngredientesSeleccionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [precioCalculado, setPrecioCalculado] = useState(0);

  // Lista de ingredientes disponibles
  const ingredientesDisponibles = [
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
  ];

  // Estados disponibles
  const estadosDisponibles = ['pendiente', 'preparando', 'listo', 'entregado', 'cancelado'];

  // Estado original de la orden para comparar cambios
  const [estadoOriginal, setEstadoOriginal] = useState('pendiente');

  useEffect(() => {
    if (orden) {
      console.log('Orden recibida:', orden);
      // Inicializar el formulario con los datos de la orden existente
      const ingredientesArray = orden.ingredientes_personalizados 
        ? orden.ingredientes_personalizados.split(',').map(ing => ing.trim()).filter(ing => ing)
        : [];

      // Obtener el especial_id del objeto especial si no viene directamente
      const especialId = orden.especial_id || (orden.especial ? orden.especial.id : '');

      setFormData({
        tipo_pedido: orden.tipo_pedido || 'especial',
        especial_id: especialId ? especialId.toString() : '',
        ingredientes_personalizados: orden.ingredientes_personalizados || '',
        estado: orden.estado || 'pendiente'
      });

      // Guardar el estado original
      setEstadoOriginal(orden.estado || 'pendiente');

      setIngredientesSeleccionados(ingredientesArray);
      setPrecioCalculado(orden.precio || 0);
    }
    
    fetchEspecialesActivos();
  }, [orden]);

  useEffect(() => {
    calcularPrecio();
  }, [formData.tipo_pedido, formData.especial_id, ingredientesSeleccionados]);

  // Función para verificar si hubo cambios en el pedido
  const huboCambiosEnPedido = () => {
    // Verificar si cambió el tipo de pedido
    if (formData.tipo_pedido !== (orden?.tipo_pedido || 'especial')) {
      return true;
    }

    // Verificar si cambió el especial (para pedidos especiales)
    if (formData.tipo_pedido === 'especial') {
      const especialOriginal = orden?.especial_id || (orden?.especial ? orden.especial.id : '');
      if (formData.especial_id !== (especialOriginal ? especialOriginal.toString() : '')) {
        return true;
      }
    }

    // Verificar si cambiaron los ingredientes (para pedidos personalizados)
    if (formData.tipo_pedido === 'personalizado') {
      const ingredientesOriginales = orden?.ingredientes_personalizados 
        ? orden.ingredientes_personalizados.split(',').map(ing => ing.trim()).filter(ing => ing)
        : [];
      
      if (ingredientesSeleccionados.length !== ingredientesOriginales.length) {
        return true;
      }
      
      // Verificar si los ingredientes son diferentes
      const ingredientesCambiados = ingredientesSeleccionados.some(ing => !ingredientesOriginales.includes(ing)) ||
                                   ingredientesOriginales.some(ing => !ingredientesSeleccionados.includes(ing));
      if (ingredientesCambiados) {
        return true;
      }
    }

    return false;
  };

  // Efecto para actualizar el estado automáticamente cuando hay cambios en el pedido
  useEffect(() => {
    if (huboCambiosEnPedido() && formData.estado !== 'pendiente') {
      console.log('Cambios detectados en el pedido, actualizando estado a "pendiente"');
      setFormData(prev => ({
        ...prev,
        estado: 'pendiente'
      }));
    }
  }, [formData.tipo_pedido, formData.especial_id, ingredientesSeleccionados]);

  const fetchEspecialesActivos = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/ordenes/especiales-activos');
      if (response.ok) {
        const data = await response.json();
        console.log('Especiales cargados:', data);
        
        // Si la orden tiene un especial que no está en la lista activa, lo agregamos
        if (orden && orden.especial) {
          const especialExistente = data.find(esp => esp.id === orden.especial.id);
          if (!especialExistente) {
            // Agregar el especial de la orden a la lista aunque no esté activo
            data.push(orden.especial);
          }
        }
        
        setEspeciales(data);
      }
    } catch (error) {
      console.error('Error al obtener especiales activos:', error);
    }
  };

  const calcularPrecio = () => {
    if (formData.tipo_pedido === 'especial') {
      // Si no se seleccionó un nuevo especial, usar el precio actual
      if (!formData.especial_id && orden) {
        setPrecioCalculado(orden.precio || 0);
      } else {
        const especial = especiales.find(esp => esp.id === parseInt(formData.especial_id));
        setPrecioCalculado(especial ? especial.precio : 0);
      }
    } else {
      // Si no se seleccionaron nuevos ingredientes, usar el precio actual
      if (ingredientesSeleccionados.length === 0 && orden) {
        setPrecioCalculado(orden.precio || 0);
      } else {
        const numIngredientes = ingredientesSeleccionados.length;
        if (numIngredientes <= 3) {
          setPrecioCalculado(30);
        } else if (numIngredientes <= 5) {
          setPrecioCalculado(35);
        } else {
          setPrecioCalculado(40);
        }
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    console.log(`Campo cambiado: ${name} = ${value}`);
    
    if (name === 'especial_id') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      return;
    }
    
    if (name === 'estado') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleTipoPedidoChange = (e) => {
    const tipo = e.target.value;
    console.log(`Cambiando tipo de pedido a: ${tipo}`);
    
    setFormData(prev => ({
      ...prev,
      tipo_pedido: tipo,
      especial_id: tipo === 'especial' ? prev.especial_id : '',
      ingredientes_personalizados: tipo === 'personalizado' ? prev.ingredientes_personalizados : ''
    }));
  };

  const handleIngredienteToggle = (ingrediente) => {
    setIngredientesSeleccionados(prev => {
      const nuevosIngredientes = prev.includes(ingrediente)
        ? prev.filter(ing => ing !== ingrediente)
        : [...prev, ingrediente];
      
      setFormData(prevData => ({
        ...prevData,
        ingredientes_personalizados: nuevosIngredientes.join(', ')
      }));
      
      return nuevosIngredientes;
    });
  };

  const validateForm = () => {
    const newErrors = {};

    // Validación de estado (siempre requerido)
    if (!formData.estado) {
      newErrors.estado = 'El estado es obligatorio';
    }

    console.log('Errores de validación:', newErrors);
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
      // Determinar qué datos enviar
      let especialIdNumero = null;
      let ingredientesPersonalizados = null;

      console.log('Datos del formulario:', formData);
      console.log('Orden original:', orden);

      if (formData.tipo_pedido === 'especial') {
        // SIEMPRE usar el especial seleccionado en el formulario
        if (formData.especial_id) {
          especialIdNumero = parseInt(formData.especial_id);
          console.log('Usando nuevo especial:', especialIdNumero);
        } else {
          // Si no hay especial seleccionado, mantener el actual si existe
          const especialActualId = orden?.especial?.id || orden?.especial_id;
          if (especialActualId) {
            especialIdNumero = especialActualId;
            console.log('Manteniendo especial actual:', especialIdNumero);
          }
        }
      } else if (formData.tipo_pedido === 'personalizado') {
        // Si se seleccionaron nuevos ingredientes, usar esos
        if (ingredientesSeleccionados.length > 0) {
          ingredientesPersonalizados = ingredientesSeleccionados.join(', ');
        } else {
          // Si no se cambiaron los ingredientes, mantener los actuales
          ingredientesPersonalizados = orden?.ingredientes_personalizados || null;
        }
      }

      const ordenData = {
        tipo_pedido: formData.tipo_pedido,
        especial_id: formData.tipo_pedido === 'especial' ? especialIdNumero : null,
        ingredientes_personalizados: formData.tipo_pedido === 'personalizado' ? ingredientesPersonalizados : null,
        estado: formData.estado
      };

      console.log('Enviando datos al backend:', ordenData);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:5000/ordenes/${orden.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(ordenData)
      });

      console.log('Respuesta status:', response.status);
      
      const responseText = await response.text();
      console.log('Respuesta texto:', responseText);

      if (response.ok) {
        try {
          const result = JSON.parse(responseText);
          setSuccessMessage(`Orden actualizada exitosamente. Estado: ${result.orden.estado}`);
          
          setTimeout(() => {
            if (onOrdenUpdated) {
              onOrdenUpdated(result.orden);
            }
            onClose();
          }, 3000);
          
        } catch (parseError) {
          console.error('Error parseando JSON:', parseError);
          alert('Orden actualizada, pero hubo un error procesando la respuesta');
          onClose();
          if (onOrdenUpdated) {
            onOrdenUpdated();
          }
        }
      } else {
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        try {
          if (responseText.trim()) {
            const errorData = JSON.parse(responseText);
            errorMsg = errorData.msg || errorMsg;
          }
        } catch (e) {
          errorMsg = responseText || errorMsg;
        }
        alert(`Error al actualizar orden: ${errorMsg}`);
      }

    } catch (error) {
      console.error('Error de conexión:', error);
      alert('Error de conexión al actualizar orden: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const getStatusBadge = (estado) => {
    const statusConfig = {
      pendiente: { class: 'editOrd-pending', text: 'Pendiente' },
      preparando: { class: 'editOrd-preparing', text: 'Preparando' },
      listo: { class: 'editOrd-ready', text: 'Listo' },
      entregado: { class: 'editOrd-delivered', text: 'Entregado' },
      cancelado: { class: 'editOrd-cancelled', text: 'Cancelado' }
    };
    
    const config = statusConfig[estado] || { class: 'editOrd-pending', text: estado };
    
    return <span className={`editOrd-status-badge ${config.class}`}>{config.text}</span>;
  };

  // Obtener el especial actual de la orden
  const getEspecialActual = () => {
    if (!orden || !orden.especial) return null;
    return especiales.find(esp => esp.id === orden.especial.id) || orden.especial;
  };

  const especialActual = getEspecialActual();

  // Obtener el ID del especial actual
  const getEspecialActualId = () => {
    return especialActual?.id?.toString() || '';
  };

  const especialActualId = getEspecialActualId();

  return (
    <div className={`editOrd-form ${darkMode ? 'editOrd-form-dark-mode' : ''}`}>
      <div className="editOrd-scroll-container">
        <form className="editOrd-form-form" onSubmit={handleSubmit}>
          {/* Información del cliente (solo lectura) */}
          <div className="editOrd-section">
            <h4>Información del Cliente</h4>
            <div className="editOrd-info-existing">
              <div className="editOrd-info-row">
                <strong>Nombre:</strong>
                <span>{orden?.nombre_usuario || 'N/A'}</span>
              </div>
              <div className="editOrd-info-row">
                <strong>Teléfono:</strong>
                <span>{orden?.telefono_usuario || 'N/A'}</span>
              </div>
              <div className="editOrd-info-row">
                <strong>Código de orden:</strong>
                <span className="editOrd-codigo">{orden?.codigo_unico}</span>
              </div>
            </div>
          </div>

          {/* Mensaje de éxito */}
          {successMessage && (
            <div className="editOrd-success-message">
              {successMessage}
            </div>
          )}

          {/* Estado de la orden */}
          <div className="editOrd-section">
            <h4>Estado de la Orden</h4>
            <div className="editOrd-form-row">
              <div className="editOrd-form-group editOrd-form-group-full-width">
                <label htmlFor="editOrd-estado">Estado *</label>
                <select
                  id="editOrd-estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className={errors.estado ? 'editOrd-select-error editOrd-select' : 'editOrd-select'}
                >
                  <option value="">Selecciona un estado</option>
                  {estadosDisponibles.map(estado => (
                    <option key={estado} value={estado}>
                      {estado.charAt(0).toUpperCase() + estado.slice(1)}
                    </option>
                  ))}
                </select>
                {errors.estado && <span className="editOrd-error-message">{errors.estado}</span>}
                
                {/* Mensaje informativo cuando el estado cambió automáticamente */}
                {huboCambiosEnPedido() && estadoOriginal !== 'pendiente' && (
                  <div className="editOrd-info-message">
                    <small>El estado se cambió a "pendiente" automáticamente porque modificaste el pedido.</small>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tipo de pedido */}
          <div className="editOrd-section">
            <h4>Cambiar Tipo de Pedido (Opcional)</h4>
            <div className="editOrd-form-row">
              <div className="editOrd-form-group editOrd-form-group-full-width">
                <div className="editOrd-tipo-pedido-options">
                  <label className="editOrd-radio-option">
                    <input
                      type="radio"
                      name="tipo_pedido"
                      value="especial"
                      checked={formData.tipo_pedido === 'especial'}
                      onChange={handleTipoPedidoChange}
                    />
                    <span className="editOrd-radio-custom"></span>
                    Pedir un Especial (Combo)
                  </label>
                  <label className="editOrd-radio-option">
                    <input
                      type="radio"
                      name="tipo_pedido"
                      value="personalizado"
                      checked={formData.tipo_pedido === 'personalizado'}
                      onChange={handleTipoPedidoChange}
                    />
                    <span className="editOrd-radio-custom"></span>
                    Armar mi propio pedido
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Selección de especial */}
          {formData.tipo_pedido === 'especial' && (
            <div className="editOrd-section">
              <h4>Seleccionar Especial (Opcional)</h4>
              <div className="editOrd-form-row">
                <div className="editOrd-form-group editOrd-form-group-full-width">
                  <select
                    name="especial_id"
                    value={formData.especial_id}
                    onChange={handleChange}
                    className="editOrd-select"
                  >
                    {/* Mostrar el especial actual como opción seleccionada por defecto */}
                    {especialActual && (
                      <option value={especialActualId}>
                        {especialActual.nombre}
                      </option>
                    )}
                    {especiales
                      .filter(esp => esp.id !== (orden?.especial?.id || orden?.especial_id))
                      .map(especial => (
                        <option key={especial.id} value={especial.id.toString()}>
                          {especial.nombre}
                        </option>
                      ))
                    }
                  </select>
                </div>
              </div>

              {/* Información del especial seleccionado */}
              {formData.especial_id && formData.especial_id !== especialActualId && (
                <div className="editOrd-especial-info">
                  <div className="editOrd-especial-details">
                    <strong>Nuevo especial seleccionado:</strong>
                    <span>
                      {especiales.find(esp => esp.id === parseInt(formData.especial_id))?.nombre}
                    </span>
                  </div>
                  <div className="editOrd-especial-details">
                    <strong>Ingredientes:</strong>
                    <span>
                      {especiales.find(esp => esp.id === parseInt(formData.especial_id))?.ingredientes}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selección de ingredientes personalizados */}
          {formData.tipo_pedido === 'personalizado' && (
            <div className="editOrd-section">
              <h4>Seleccionar Ingredientes (Opcional)</h4>
              <div className="editOrd-form-row">
                <div className="editOrd-form-group editOrd-form-group-full-width">
                  <label>Selecciona los ingredientes</label>
                  <div className="editOrd-ingredientes-grid-container">
                    <div className="editOrd-ingredientes-grid">
                      {ingredientesDisponibles.map((ingrediente, index) => (
                        <label key={index} className="editOrd-ingrediente-checkbox">
                          <input
                            type="checkbox"
                            checked={ingredientesSeleccionados.includes(ingrediente)}
                            onChange={() => handleIngredienteToggle(ingrediente)}
                          />
                          <span className="editOrd-checkbox-custom"></span>
                          {ingrediente}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="editOrd-ingredientes-count">
                    {ingredientesSeleccionados.length} ingrediente(s) seleccionado(s)
                  </div>
                </div>
              </div>

              {/* Vista previa de ingredientes seleccionados */}
              {ingredientesSeleccionados.length > 0 && (
                <div className="editOrd-ingredientes-preview">
                  <strong>Nuevos ingredientes seleccionados:</strong>
                  <div className="editOrd-ingredientes-list">
                    {ingredientesSeleccionados.join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resumen del pedido */}
          <div className="editOrd-section">
            <h4>Resumen</h4>
            <div className="editOrd-resumen-pedido">
              <div className="editOrd-resumen-item">
                <strong>Tipo:</strong>
                <span>{formData.tipo_pedido === 'especial' ? 'Especial' : 'Personalizado'}</span>
              </div>
              
              {formData.tipo_pedido === 'especial' && (
                <div className="editOrd-resumen-item">
                  <strong>Especial:</strong>
                  <span>
                    {formData.especial_id && formData.especial_id !== especialActualId 
                      ? especiales.find(esp => esp.id === parseInt(formData.especial_id))?.nombre
                      : especialActual?.nombre || 'Especial actual'
                    }
                  </span>
                </div>
              )}
              
              {formData.tipo_pedido === 'personalizado' && (
                <div className="editOrd-resumen-item">
                  <strong>Ingredientes:</strong>
                  <span>
                    {ingredientesSeleccionados.length > 0 
                      ? ingredientesSeleccionados.join(', ')
                      : orden?.ingredientes_personalizados || 'Ingredientes actuales'
                    }
                  </span>
                </div>
              )}
              
              <div className="editOrd-resumen-precio">
                <strong>Precio total:</strong>
                <span className="editOrd-precio-final">{formatPrice(precioCalculado)}</span>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Botones de acción - FUERA del scroll */}
      <div className="editOrd-form-actions">
        <button 
          type="button" 
          className="editOrd-btn-cancel"
          onClick={handleCancel}
          disabled={loading}
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          className="editOrd-btn-submit"
          onClick={handleSubmit}
          disabled={loading || successMessage}
        >
          {loading ? 'Actualizando...' : 'Actualizar Orden'}
        </button>
      </div>
    </div>
  );
};

export default EditOrdenForm;