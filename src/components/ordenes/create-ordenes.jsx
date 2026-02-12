import React, { useState, useEffect } from 'react';
import { useConfig } from '../../context/config';
import '../../css/create-ordenes.css';

// Importar ícono de ubicación
import locationIcon from '../../img/ubicacion.png';

const CreateOrdenes = ({ onClose, onOrdenCreated }) => {
  const { darkMode } = useConfig();
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    telefono_usuario: '',
    tipo_pedido: 'especial',
    especial_id: '',
    ingredientes_personalizados: '',
    direccion_texto: '', // Nuevo campo: dirección
    direccion_id: null   // ID de dirección si viene de un cliente existente
  });
  const [especiales, setEspeciales] = useState([]);
  const [ingredientesSeleccionados, setIngredientesSeleccionados] = useState([]);
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingIngredientes, setLoadingIngredientes] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [precioCalculado, setPrecioCalculado] = useState(0);
  
  // Estados para el autocompletado
  const [clientes, setClientes] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [cargandoClientes, setCargandoClientes] = useState(false);
  
  // Estados para modal de dirección
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');

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
        const ingredientesActivos = data
          .filter(ing => ing.activo)
          .map(ing => ing.nombre)
          .sort();
        
        setIngredientesDisponibles(ingredientesActivos);
      } else {
        console.error('Error al obtener ingredientes:', response.status);
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

  useEffect(() => {
    fetchEspecialesActivos();
    fetchClientes();
    fetchIngredientesDisponibles();
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
          email: user.correo,
          direccion: user.direccion || '', // Nuevo: obtener dirección si existe
          direccion_id: user.direccion_id || null
        }));
        
        setClientes(clientesData);
      } else {
        console.error('Error al obtener clientes por rol:', response.status);
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
        const clientesData = data
          .filter(user => user.rol === 2)
          .map(user => ({
            id: user.id,
            nombre: user.nombre,
            telefono: user.telefono || '',
            email: user.correo,
            direccion: user.direccion || '',
            direccion_id: user.direccion_id || null
          }));
        
        console.log('Clientes cargados (fallback):', clientesData.length);
        setClientes(clientesData);
      }
    } catch (fallbackError) {
      console.error('Error en fallback:', fallbackError);
    }
  };

  const buscarSugerencias = (texto) => {
    if (!texto || texto.trim() === '') {
      setSugerencias(clientes.slice(0, 20));
      setMostrarSugerencias(clientes.length > 0);
      return;
    }

    if (texto.length < 2) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    const textoLower = texto.toLowerCase().trim();
    const sugerenciasFiltradas = clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(textoLower) ||
      (cliente.telefono && cliente.telefono.includes(texto)) ||
      (cliente.email && cliente.email.toLowerCase().includes(textoLower)) ||
      (cliente.direccion && cliente.direccion.toLowerCase().includes(textoLower))
    );

    setSugerencias(sugerenciasFiltradas.slice(0, 15));
    setMostrarSugerencias(sugerenciasFiltradas.length > 0);
  };

  const handleNombreChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      nombre_usuario: value,
      telefono_usuario: '',
      direccion_texto: '', // Limpiar dirección cuando se cambia manualmente
      direccion_id: null
    }));
    
    buscarSugerencias(value);
    
    if (errors.nombre_usuario) {
      setErrors(prev => ({ ...prev, nombre_usuario: '' }));
    }
    if (errors.telefono_usuario) {
      setErrors(prev => ({ ...prev, telefono_usuario: '' }));
    }
    if (errors.direccion_texto) {
      setErrors(prev => ({ ...prev, direccion_texto: '' }));
    }
    
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const seleccionarCliente = (cliente) => {
    const telefonoLimpio = cliente.telefono ? 
      cliente.telefono.replace('+52', '').replace(/\s/g, '') : '';
    
    setFormData(prev => ({
      ...prev,
      nombre_usuario: cliente.nombre,
      telefono_usuario: telefonoLimpio,
      direccion_texto: cliente.direccion || '', // Cargar dirección del cliente si existe
      direccion_id: cliente.direccion_id || null
    }));
    setMostrarSugerencias(false);
    setSugerencias([]);
  };

  const handleFocusNombre = () => {
    setSugerencias(clientes.slice(0, 20));
    setMostrarSugerencias(clientes.length > 0);
  };

  const handleBlurNombre = () => {
    setTimeout(() => {
      setMostrarSugerencias(false);
    }, 200);
  };

  const calcularPrecio = () => {
    if (formData.tipo_pedido === 'especial') {
      const especial = especiales.find(esp => esp.id === parseInt(formData.especial_id));
      setPrecioCalculado(especial ? especial.precio : 0);
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
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    console.log(`Campo cambiado: ${name} = ${value} (tipo: ${typeof value})`);
    
    if (name === 'especial_id') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      return;
    }
    
    if (name === 'telefono_usuario') {
      const soloNumeros = value.replace(/\D/g, '');
      const telefonoLimpio = soloNumeros.slice(0, 10);
      
      setFormData(prev => ({
        ...prev,
        [name]: telefonoLimpio
      }));
      
      if (errors.telefono_usuario) {
        setErrors(prev => ({
          ...prev,
          telefono_usuario: ''
        }));
      }
      return;
    }
    
    // Para el campo de dirección
    if (name === 'direccion_texto') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        direccion_id: null // Si se edita manualmente, limpiar el ID
      }));
    } else {
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

  // Función para mostrar modal con dirección
  const handleShowAddressModal = () => {
    if (formData.direccion_texto && formData.direccion_texto.trim() !== '') {
      setSelectedAddress(formData.direccion_texto);
      setShowAddressModal(true);
    }
  };

  // Función para cerrar modal de dirección
  const handleCloseAddressModal = () => {
    setShowAddressModal(false);
    setSelectedAddress('');
  };

  // Función para copiar dirección al portapapeles
  const handleCopyAddress = () => {
    if (selectedAddress && selectedAddress.trim() !== '') {
      navigator.clipboard.writeText(selectedAddress)
        .then(() => {
          alert('Dirección copiada al portapapeles');
        })
        .catch(err => {
          console.error('Error al copiar:', err);
        });
    }
  };

  // Función para abrir dirección en Google Maps
  const handleOpenInMaps = () => {
    if (selectedAddress && selectedAddress.trim() !== '') {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedAddress)}`;
      window.open(mapsUrl, '_blank');
    }
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
    } else {
      const telefonoLimpio = formData.telefono_usuario.replace(/\D/g, '');
      if (!/^\d{10}$/.test(telefonoLimpio)) {
        newErrors.telefono_usuario = 'El teléfono debe tener exactamente 10 dígitos';
      }
    }

    // Validar dirección (opcional, pero recomendado)
    if (!formData.direccion_texto.trim()) {
      newErrors.direccion_texto = 'La dirección de entrega es recomendada';
    } else if (formData.direccion_texto.trim().length < 10) {
      newErrors.direccion_texto = 'Por favor, proporciona una dirección más detallada';
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
      const especialIdNumero = formData.especial_id ? parseInt(formData.especial_id) : null;
      const telefonoLimpio = formData.telefono_usuario.replace(/\D/g, '');
      
      // Preparar datos estructurados del pedido
      const pedidoJson = {
        tipo: formData.tipo_pedido,
        especial: formData.tipo_pedido === 'especial' && especialIdNumero ? 
          especiales.find(esp => esp.id === especialIdNumero)?.nombre : null,
        ingredientes: formData.tipo_pedido === 'personalizado' ? 
          ingredientesSeleccionados : [],
        cantidad: 1
      };

      const ordenData = {
        nombre_usuario: formData.nombre_usuario.trim(),
        telefono_usuario: telefonoLimpio,
        tipo_pedido: formData.tipo_pedido,
        especial_id: formData.tipo_pedido === 'especial' ? especialIdNumero : null,
        ingredientes_personalizados: formData.tipo_pedido === 'personalizado' ? formData.ingredientes_personalizados : null,
        // ✅ Nuevos campos de dirección
        direccion_texto: formData.direccion_texto.trim(),
        direccion_id: formData.direccion_id,
        // ✅ Campo para datos estructurados del pedido
        pedido_json: JSON.stringify(pedidoJson),
        precio: precioCalculado // Agregar el precio calculado
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
          setSuccessMessage(`Orden creada exitosamente. Código: ${result.orden.codigo_unico}`);
          
          // Limpiar el formulario
          setFormData({
            nombre_usuario: '',
            telefono_usuario: '',
            tipo_pedido: 'especial',
            especial_id: '',
            ingredientes_personalizados: '',
            direccion_texto: '',
            direccion_id: null
          });
          setIngredientesSeleccionados([]);
          setSugerencias([]);
          setMostrarSugerencias(false);
          
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
    <>
      <div className={`create-orden-form ${darkMode ? 'create-orden-form-dark-mode' : ''}`}>
        <div className="create-orden-form-scroll-container">
          <form className="create-orden-form-form" onSubmit={handleSubmit}>
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
                              {cliente.telefono && <span>📞 {cliente.telefono.replace('+52', '')}</span>}
                              {cliente.email && <span>✉️ {cliente.email}</span>}
                              {cliente.direccion && <span>📍 {cliente.direccion.substring(0, 30)}...</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
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
                <div className="create-form-group create-form-group-half">
                  <label htmlFor="create-telefono-usuario">Teléfono *</label>
                  <div className="telefono-input-container">
                    <input
                      type="tel"
                      id="create-telefono-usuario"
                      name="telefono_usuario"
                      value={formData.telefono_usuario}
                      onChange={handleChange}
                      className={errors.telefono_usuario ? 'create-input-error' : ''}
                      placeholder="10 dígitos"
                      maxLength="10"
                    />
                  </div>
                  {errors.telefono_usuario && <span className="create-error-message">{errors.telefono_usuario}</span>}
                </div>
              </div>

              {/* NUEVO: Campo de dirección */}
              <div className="create-form-row">
                <div className="create-form-group create-form-group-full-width">
                  <div className="direccion-header">
                    <label htmlFor="create-direccion-texto">Dirección de entrega *</label>
                    {formData.direccion_texto && formData.direccion_texto.trim() !== '' && (
                      <button 
                        type="button"
                        className="ver-direccion-btn"
                        onClick={handleShowAddressModal}
                        title="Ver dirección completa"
                      >
                        <img src={locationIcon} alt="Ver dirección" className="address-icon-small" />
                      </button>
                    )}
                  </div>
                  <textarea
                    id="create-direccion-texto"
                    name="direccion_texto"
                    value={formData.direccion_texto}
                    onChange={handleChange}
                    className={`create-textarea ${errors.direccion_texto ? 'create-input-error' : ''}`}
                    placeholder="Ej: Calle Principal #123, Colonia Centro, Ciudad, Estado"
                    rows="3"
                    maxLength="255"
                  />
                  {errors.direccion_texto && <span className="create-error-message">{errors.direccion_texto}</span>}
                  <div className="direccion-hint">
                    <small>Proporciona una dirección detallada para facilitar la entrega</small>
                  </div>
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
                    <label>
                      Selecciona los ingredientes *
                      {loadingIngredientes && (
                        <span className="loading-ingredientes-text"> (Cargando ingredientes...)</span>
                      )}
                    </label>
                    {loadingIngredientes ? (
                      <div className="loading-ingredientes">
                        <div className="spinner-small"></div>
                        <span>Cargando lista de ingredientes...</span>
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}

                    {ingredientesSeleccionados.length > 0 && (
                      <div className="ingredientes-preview">
                        <strong>Ingredientes seleccionados:</strong>
                        <div className="ingredientes-list">
                          {ingredientesSeleccionados.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Resumen del pedido */}
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
                <div className="resumen-item">
                  <strong>Dirección:</strong>
                  <span className="direccion-resumen">
                    {formData.direccion_texto && formData.direccion_texto.length > 40 
                      ? `${formData.direccion_texto.substring(0, 40)}...`
                      : formData.direccion_texto || 'No especificada'}
                  </span>
                </div>
                <div className="resumen-precio">
                  <strong>Precio total:</strong>
                  <span className="precio-final">{formatPrice(precioCalculado)}</span>
                </div>
              </div>
            </div>
          </form>
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
            onClick={handleSubmit}
            disabled={loading || successMessage}
          >
            {loading ? 'Creando...' : 'Crear Orden'}
          </button>
        </div>
      </div>

      {/* Modal para ver dirección completa */}
      {showAddressModal && (
        <div className="modal-overlay">
          <div className="modal-content create-address-modal">
            <div className="modal-header">
              <h3>Dirección de Entrega</h3>
              <button className="close-modal" onClick={handleCloseAddressModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="create-address-content">
                <p className="create-address-title">Dirección registrada:</p>
                <div className="create-address-display">
                  {selectedAddress}
                </div>
                {selectedAddress && selectedAddress.trim() !== '' && (
                  <div className="create-address-actions">
                    <button 
                      className="btn btn-secondary"
                      onClick={handleCopyAddress}
                    >
                      Copiar Dirección
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={handleOpenInMaps}
                    >
                      <img src={locationIcon} alt="Mapa" className="btn-icon-img" style={{marginRight: '8px'}} />
                      Abrir en Google Maps
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-close"
                onClick={handleCloseAddressModal}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateOrdenes;