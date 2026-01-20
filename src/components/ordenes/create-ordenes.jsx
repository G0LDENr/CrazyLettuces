import React, { useState, useEffect } from 'react';
import { useConfig } from '../../context/config';
import '../../css/create-ordenes.css';

const CreateOrdenForm = ({ onClose, onOrdenCreated }) => {
  const { darkMode } = useConfig();
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    telefono_usuario: '',
    tipo_pedido: 'especial',
    especial_id: '',
    ingredientes_personalizados: ''
  });
  const [especiales, setEspeciales] = useState([]);
  const [ingredientesSeleccionados, setIngredientesSeleccionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [precioCalculado, setPrecioCalculado] = useState(0);
  
  // Estados para el autocompletado
  const [clientes, setClientes] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [cargandoClientes, setCargandoClientes] = useState(false);

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

  useEffect(() => {
    fetchEspecialesActivos();
    fetchClientes();
  }, []);

  useEffect(() => {
    calcularPrecio();
  }, [formData.tipo_pedido, formData.especial_id, ingredientesSeleccionados]);

  const fetchEspecialesActivos = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/ordenes/especiales-activos');
      if (response.ok) {
        const data = await response.json();
        console.log('Especiales cargados:', data);
        setEspeciales(data);
      }
    } catch (error) {
      console.error('Error al obtener especiales activos:', error);
    }
  };

  const fetchClientes = async () => {
    try {
      setCargandoClientes(true);
      const token = localStorage.getItem('token');
      
      // Intentar con el endpoint específico para rol 2 (clientes)
      const response = await fetch('http://127.0.0.1:5000/user/rol/2', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Clientes cargados (rol 2):', data.length);
        
        const clientesData = data.map(user => ({
          id: user.id,
          nombre: user.nombre,
          telefono: user.telefono || '',
          email: user.correo
        }));
        
        setClientes(clientesData);
      } else {
        console.error('Error al obtener clientes por rol:', response.status);
        // Fallback: usar endpoint general y filtrar en frontend
        await fetchClientesFallback(token);
      }
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      const token = localStorage.getItem('token');
      await fetchClientesFallback(token);
    } finally {
      setCargandoClientes(false);
    }
  };

  // Función fallback por si el endpoint de rol no está disponible
  const fetchClientesFallback = async (token) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/user/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filtrar solo usuarios con rol 2 en el frontend
        const clientesData = data
          .filter(user => user.rol === 2)
          .map(user => ({
            id: user.id,
            nombre: user.nombre,
            telefono: user.telefono || '',
            email: user.correo
          }));
        
        console.log('Clientes cargados (fallback):', clientesData.length);
        setClientes(clientesData);
      }
    } catch (fallbackError) {
      console.error('Error en fallback:', fallbackError);
    }
  };

  const buscarSugerencias = (texto) => {
    // Si no hay texto o está vacío, mostrar TODOS los clientes
    if (!texto || texto.trim() === '') {
      setSugerencias(clientes.slice(0, 20));
      setMostrarSugerencias(clientes.length > 0);
      return;
    }

    // Si el texto es muy corto, no mostrar sugerencias
    if (texto.length < 2) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    // Filtrar clientes que coincidan con el texto
    const textoLower = texto.toLowerCase().trim();
    const sugerenciasFiltradas = clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(textoLower) ||
      (cliente.telefono && cliente.telefono.includes(texto)) ||
      (cliente.email && cliente.email.toLowerCase().includes(textoLower))
    );

    setSugerencias(sugerenciasFiltradas.slice(0, 15));
    setMostrarSugerencias(sugerenciasFiltradas.length > 0);
  };

  const handleNombreChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      nombre_usuario: value,
      telefono_usuario: '' // Limpiar teléfono cuando se cambia el nombre manualmente
    }));
    
    // Buscar sugerencias inmediatamente con el nuevo texto
    buscarSugerencias(value);
    
    // Limpiar errores
    if (errors.nombre_usuario) {
      setErrors(prev => ({ ...prev, nombre_usuario: '' }));
    }
    if (errors.telefono_usuario) {
      setErrors(prev => ({ ...prev, telefono_usuario: '' }));
    }
    
    // Limpiar mensaje de éxito
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const seleccionarCliente = (cliente) => {
    setFormData(prev => ({
      ...prev,
      nombre_usuario: cliente.nombre,
      telefono_usuario: cliente.telefono || ''
    }));
    setMostrarSugerencias(false);
    setSugerencias([]);
  };

  const handleFocusNombre = () => {
    // Cuando se hace clic en el campo, mostrar TODOS los clientes inmediatamente
    setSugerencias(clientes.slice(0, 20));
    setMostrarSugerencias(clientes.length > 0);
  };

  const handleBlurNombre = () => {
    // Ocultar sugerencias después de un pequeño delay para permitir hacer clic
    setTimeout(() => {
      setMostrarSugerencias(false);
    }, 200);
  };

  const calcularPrecio = () => {
    if (formData.tipo_pedido === 'especial') {
      const especial = especiales.find(esp => esp.id === parseInt(formData.especial_id));
      setPrecioCalculado(especial ? especial.precio : 0);
    } else {
      // Calcular precio basado en número de ingredientes
      const numIngredientes = ingredientesSeleccionados.length;
      if (numIngredientes <= 3) {
        setPrecioCalculado(30);
      } else if (numIngredientes <= 5) {
        setPrecioCalculado(35);
      } else {
        setPrecioCalculado(40);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    console.log(`Campo cambiado: ${name} = ${value} (tipo: ${typeof value})`);
    
    // Manejar especial_id como string para el select
    if (name === 'especial_id') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      return;
    }
    
    // Si es el campo de teléfono, no permitir autocompletado
    if (name === 'telefono_usuario') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
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
      
      // Actualizar el campo de ingredientes personalizados
      setFormData(prevData => ({
        ...prevData,
        ingredientes_personalizados: nuevosIngredientes.join(', ')
      }));
      
      return nuevosIngredientes;
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre_usuario.trim()) {
      newErrors.nombre_usuario = 'El nombre del cliente es obligatorio';
    } else if (formData.nombre_usuario.trim().length < 2) {
      newErrors.nombre_usuario = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.telefono_usuario.trim()) {
      newErrors.telefono_usuario = 'El teléfono es obligatorio';
    } else if (!/^\d{10}$/.test(formData.telefono_usuario.trim())) {
      newErrors.telefono_usuario = 'El teléfono debe tener 10 dígitos';
    }

    if (formData.tipo_pedido === 'especial' && !formData.especial_id) {
      newErrors.especial_id = 'Debe seleccionar un especial';
    }

    if (formData.tipo_pedido === 'personalizado' && ingredientesSeleccionados.length === 0) {
      newErrors.ingredientes_personalizados = 'Debe seleccionar al menos un ingrediente';
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
      // Convertir especial_id a número para el envío
      const especialIdNumero = formData.especial_id ? parseInt(formData.especial_id) : null;
      
      const ordenData = {
        nombre_usuario: formData.nombre_usuario.trim(),
        telefono_usuario: formData.telefono_usuario.trim(),
        tipo_pedido: formData.tipo_pedido,
        especial_id: formData.tipo_pedido === 'especial' ? especialIdNumero : null,
        ingredientes_personalizados: formData.tipo_pedido === 'personalizado' ? formData.ingredientes_personalizados : null
      };

      console.log('Enviando datos de la orden:', ordenData);

      const response = await fetch('http://127.0.0.1:5000/ordenes/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ordenData)
      });

      console.log('Respuesta status:', response.status);
      
      const responseText = await response.text();
      console.log('Respuesta texto:', responseText);

      if (response.ok) {
        try {
          const result = JSON.parse(responseText);
          // Mostrar mensaje de éxito
          setSuccessMessage(`Orden creada exitosamente. Código: ${result.orden.codigo_unico}`);
          
          // Limpiar el formulario
          setFormData({
            nombre_usuario: '',
            telefono_usuario: '',
            tipo_pedido: 'especial',
            especial_id: '',
            ingredientes_personalizados: ''
          });
          setIngredientesSeleccionados([]);
          setSugerencias([]);
          setMostrarSugerencias(false);
          
          // Esperar 3 segundos antes de cerrar el modal y actualizar la lista
          setTimeout(() => {
            if (onOrdenCreated) {
              onOrdenCreated(result.orden);
            }
            onClose();
          }, 3000);
          
        } catch (parseError) {
          console.error('Error parseando JSON:', parseError);
          alert('Orden creada, pero hubo un error procesando la respuesta');
          onClose();
          if (onOrdenCreated) {
            onOrdenCreated();
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
        alert(`Error al crear orden: ${errorMsg}`);
      }

    } catch (error) {
      console.error('Error de conexión:', error);
      alert('Error de conexión al crear orden: ' + error.message);
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

  return (
    <div className={`create-orden-form ${darkMode ? 'create-orden-form-dark-mode' : ''}`}>
      <div className="create-orden-form-scroll-container">
        <form className="create-orden-form-form" onSubmit={handleSubmit}>
          {/* Mensaje de éxito */}
          {successMessage && (
            <div className="create-success-message">
              {successMessage}
            </div>
          )}

          {/* Información del cliente */}
          <div className="create-form-section">
            <h4>Información del Cliente</h4>
            <div className="create-form-row">
              <div className="create-form-group create-form-group-full-width">
                <label htmlFor="create-nombre-usuario">Nombre del cliente *</label>
                <div className="autocomplete-container">
                  <input
                    type="text"
                    id="create-nombre-usuario"
                    name="nombre_usuario"
                    value={formData.nombre_usuario}
                    onChange={handleNombreChange}
                    onFocus={handleFocusNombre}
                    onBlur={handleBlurNombre}
                    className={errors.nombre_usuario ? 'create-input-error' : ''}
                    placeholder="Escribe para buscar o haz clic para ver todos los clientes"
                    maxLength="100"
                    autoComplete="off"
                  />
                  {cargandoClientes && (
                    <div className="autocomplete-loading">Cargando clientes...</div>
                  )}
                  
                  {/* Sugerencias cuando hay coincidencias */}
                  {mostrarSugerencias && sugerencias.length > 0 && (
                    <div className="autocomplete-suggestions">
                      <div className="suggestions-header">
                        {formData.nombre_usuario.trim() === '' 
                          ? `Todos los clientes (${sugerencias.length})`
                          : `Coincidencias encontradas (${sugerencias.length})`
                        }
                      </div>
                      {sugerencias.map((cliente) => (
                        <div
                          key={cliente.id}
                          className="suggestion-item"
                          onClick={() => seleccionarCliente(cliente)}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <div className="suggestion-name">{cliente.nombre}</div>
                          <div className="suggestion-details">
                            {cliente.telefono && <span>📞 {cliente.telefono}</span>}
                            {cliente.email && <span>✉️ {cliente.email}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Mensaje cuando no hay coincidencias pero sí hay texto de búsqueda */}
                  {mostrarSugerencias && sugerencias.length === 0 && formData.nombre_usuario.length >= 2 && (
                    <div className="autocomplete-suggestions">
                      <div className="suggestion-item no-results">
                        No se encontraron clientes que coincidan con "{formData.nombre_usuario}"
                      </div>
                    </div>
                  )}
                </div>
                {errors.nombre_usuario && <span className="create-error-message">{errors.nombre_usuario}</span>}
              </div>
            </div>

            <div className="create-form-row">
              <div className="create-form-group create-form-group-full-width">
                <label htmlFor="create-telefono-usuario">Teléfono *</label>
                <input
                  type="tel"
                  id="create-telefono-usuario"
                  name="telefono_usuario"
                  value={formData.telefono_usuario}
                  onChange={handleChange}
                  className={errors.telefono_usuario ? 'create-input-error' : ''}
                  placeholder="Se completará automáticamente al seleccionar un cliente"
                  maxLength="10"
                  readOnly={!!formData.telefono_usuario} // Solo lectura si ya tiene valor
                />
                {errors.telefono_usuario && <span className="create-error-message">{errors.telefono_usuario}</span>}
                {formData.telefono_usuario && (
                  <div className="telefono-info">
                    Teléfono cargado automáticamente desde el cliente seleccionado
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tipo de pedido */}
          <div className="create-form-section">
            <h4>Tipo de Pedido</h4>
            <div className="create-form-row">
              <div className="create-form-group create-form-group-full-width">
                <div className="tipo-pedido-options">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="tipo_pedido"
                      value="especial"
                      checked={formData.tipo_pedido === 'especial'}
                      onChange={handleTipoPedidoChange}
                    />
                    <span className="radio-custom"></span>
                    Pedir un Especial (Combo)
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="tipo_pedido"
                      value="personalizado"
                      checked={formData.tipo_pedido === 'personalizado'}
                      onChange={handleTipoPedidoChange}
                    />
                    <span className="radio-custom"></span>
                    Armar mi propio pedido
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Selección de especial */}
          {formData.tipo_pedido === 'especial' && (
            <div className="create-form-section">
              <h4>Seleccionar Especial</h4>
              <div className="create-form-row">
                <div className="create-form-group create-form-group-full-width">
                  <select
                    name="especial_id"
                    value={formData.especial_id}
                    onChange={handleChange}
                    className={errors.especial_id ? 'create-select-error create-select' : 'create-select'}
                  >
                    <option value="">Selecciona un especial</option>
                    {especiales.map(especial => (
                      <option key={especial.id} value={especial.id.toString()}>
                        {especial.nombre} - {formatPrice(especial.precio)}
                      </option>
                    ))}
                  </select>
                  {errors.especial_id && <span className="create-error-message">{errors.especial_id}</span>}
                </div>
              </div>

              {/* Información del especial seleccionado */}
              {formData.especial_id && (
                <div className="especial-info">
                  <div className="especial-details">
                    <strong>Especial seleccionado:</strong>
                    <span>
                      {especiales.find(esp => esp.id === parseInt(formData.especial_id))?.nombre}
                    </span>
                  </div>
                  <div className="especial-details">
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
            <div className="create-form-section">
              <h4>Seleccionar Ingredientes</h4>
              <div className="create-form-row">
                <div className="create-form-group create-form-group-full-width">
                  <label>Selecciona los ingredientes *</label>
                  <div className="ingredientes-grid-container">
                    <div className="ingredientes-grid">
                      {ingredientesDisponibles.map((ingrediente, index) => (
                        <label key={index} className="ingrediente-checkbox">
                          <input
                            type="checkbox"
                            checked={ingredientesSeleccionados.includes(ingrediente)}
                            onChange={() => handleIngredienteToggle(ingrediente)}
                          />
                          <span className="checkbox-custom"></span>
                          {ingrediente}
                        </label>
                      ))}
                    </div>
                  </div>
                  {errors.ingredientes_personalizados && (
                    <span className="create-error-message">{errors.ingredientes_personalizados}</span>
                  )}
                  <div className="ingredientes-count">
                    {ingredientesSeleccionados.length} ingrediente(s) seleccionado(s)
                  </div>
                </div>
              </div>

              {/* Vista previa de ingredientes seleccionados */}
              {ingredientesSeleccionados.length > 0 && (
                <div className="ingredientes-preview">
                  <strong>Ingredientes seleccionados:</strong>
                  <div className="ingredientes-list">
                    {ingredientesSeleccionados.join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resumen del pedido y precio */}
          <div className="create-form-section">
            <h4>Resumen del Pedido</h4>
            <div className="resumen-pedido">
              <div className="resumen-item">
                <strong>Tipo:</strong>
                <span>{formData.tipo_pedido === 'especial' ? 'Especial' : 'Personalizado'}</span>
              </div>
              {formData.tipo_pedido === 'especial' && formData.especial_id && (
                <div className="resumen-item">
                  <strong>Especial:</strong>
                  <span>{especiales.find(esp => esp.id === parseInt(formData.especial_id))?.nombre}</span>
                </div>
              )}
              {formData.tipo_pedido === 'personalizado' && (
                <div className="resumen-item">
                  <strong>Ingredientes:</strong>
                  <span>{ingredientesSeleccionados.length} seleccionados</span>
                </div>
              )}
              <div className="resumen-precio">
                <strong>Precio total:</strong>
                <span className="precio-final">{formatPrice(precioCalculado)}</span>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Botones de acción - FUERA del scroll */}
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
          onClick={handleSubmit}
          disabled={loading || successMessage}
        >
          {loading ? 'Creando...' : 'Crear Orden'}
        </button>
      </div>
    </div>
  );
};

export default CreateOrdenForm;