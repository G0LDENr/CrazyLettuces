import React, { useState, useEffect } from 'react';
import { useConfig } from '../../context/config';
import '../../css/create-producto.css';

// Importar íconos
import closeIcon from '../../img/cancelar.png';
import homeIcon from '../../img/casa.png';
import workIcon from '../../img/trabajo.png';
import otherIcon from '../../img/ubicacion.png';
import addIcon from '../../img/mas.png';

const CrearPedidoModal = ({ onClose, onOrderCreated }) => {
  const { darkMode } = useConfig();
  
  // Estados del modal
  const [step, setStep] = useState(1); // 1: Ingredientes, 2: Dirección, 3: Pago, 4: Confirmar
  const [loading, setLoading] = useState(false);
  const [loadingDirecciones, setLoadingDirecciones] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [ordenCreada, setOrdenCreada] = useState(null);
  
  // Verificar autenticación
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    telefono_usuario: '',
    tipo_pedido: 'personalizado',
    ingredientes_personalizados: '',
    direccion_id: null,
    direccion_texto: '',
    metodo_pago: 'efectivo',
    precio: 0
  });
  
  // Estados para ingredientes
  const [ingredientesSeleccionados, setIngredientesSeleccionados] = useState([]);
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [loadingIngredientes, setLoadingIngredientes] = useState(true);
  
  // Estados para direcciones
  const [direcciones, setDirecciones] = useState([]);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    calle: '',
    numero_exterior: '',
    numero_interior: '',
    colonia: '',
    ciudad: '',
    estado: '',
    codigo_postal: '',
    referencias: '',
    tipo: 'casa',
    predeterminada: false
  });

  // Estados para formulario de tarjeta
  const [tarjetaForm, setTarjetaForm] = useState({
    nombre_titular: '',
    numero_tarjeta: '',
    fecha_vencimiento: '',
    cvv: '',
    tipo_tarjeta: 'visa'
  });
  const [aceptoTerminos, setAceptoTerminos] = useState(false);
  const [showPoliticaSeguridad, setShowPoliticaSeguridad] = useState(false);

  // ========== FUNCIONES DE CARGA DE DATOS ==========
  useEffect(() => {
    fetchIngredientesDisponibles();
    if (isAuthenticated) {
      loadUserData();
      fetchDirecciones();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    calcularPrecio();
  }, [ingredientesSeleccionados]);

  const loadUserData = () => {
    try {
      const userStr = localStorage.getItem('user') || localStorage.getItem('userData');
      if (userStr) {
        const user = JSON.parse(userStr);
        setFormData(prev => ({
          ...prev,
          nombre_usuario: user.nombre || '',
          telefono_usuario: user.telefono || ''
        }));
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
    }
  };

  const fetchIngredientesDisponibles = async () => {
    try {
      setLoadingIngredientes(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://127.0.0.1:5000/ingredientes/', {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const ingredientesActivos = data
          .filter(ing => ing.activo === true || ing.activo === 'true')
          .map(ing => ing.nombre)
          .sort((a, b) => a.localeCompare(b));
        
        setIngredientesDisponibles(ingredientesActivos);
      } else {
        console.error('Error al obtener ingredientes:', response.status);
        setIngredientesDisponibles([
          'Limon', 'Chile en Polvo', 'Sal', 'Gomita Picante', 'Gomita Dulce',
          'Gomitas Aciditas', 'Chamoy', 'Salsa', 'Cacahuate', 'Miguelito',
          'Lechuga Romana', 'Tomate Cherry', 'Queso Feta', 'Pollo a la Parrilla',
          'Aderezo Ranch', 'Pepino', 'Zanahoria', 'Maíz', 'Aguacate', 'Croutones'
        ]);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setIngredientesDisponibles([
        'Limon', 'Chile en Polvo', 'Sal', 'Gomita Picante', 'Gomita Dulce',
        'Gomitas Aciditas', 'Chamoy', 'Salsa', 'Cacahuate', 'Miguelito',
        'Lechuga Romana', 'Tomate Cherry', 'Queso Feta', 'Pollo a la Parrilla',
        'Aderezo Ranch', 'Pepino', 'Zanahoria', 'Maíz', 'Aguacate', 'Croutones'
      ]);
    } finally {
      setLoadingIngredientes(false);
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
        
        const direccionPredeterminada = data.direcciones?.find(dir => dir.predeterminada);
        if (direccionPredeterminada) {
          handleDireccionSelect(direccionPredeterminada);
        }
      }
    } catch (error) {
      console.error('Error al obtener direcciones:', error);
    } finally {
      setLoadingDirecciones(false);
    }
  };

  // ========== FUNCIONES DE CÁLCULO ==========
  const calcularPrecio = () => {
    const numIngredientes = ingredientesSeleccionados.length;
    let precio = 0;
    
    if (numIngredientes <= 3) {
      precio = 30;
    } else if (numIngredientes <= 5) {
      precio = 35;
    } else if (numIngredientes <= 7) {
      precio = 40;
    } else {
      precio = 45 + ((numIngredientes - 7) * 2);
    }
    
    setFormData(prev => ({ ...prev, precio }));
  };

  // ========== MANEJADORES DE EVENTOS ==========
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

    if (errors.ingredientes_personalizados) {
      setErrors(prev => ({ ...prev, ingredientes_personalizados: '' }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTarjetaChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    
    if (name === 'numero_tarjeta') {
      newValue = value.replace(/\D/g, '').slice(0, 16);
      if (newValue.length > 0) {
        newValue = newValue.match(/.{1,4}/g).join(' ');
      }
      
      const firstDigit = newValue.charAt(0);
      if (firstDigit === '4') {
        setTarjetaForm(prev => ({ ...prev, tipo_tarjeta: 'visa' }));
      } else if (firstDigit === '5') {
        setTarjetaForm(prev => ({ ...prev, tipo_tarjeta: 'mastercard' }));
      } else if (firstDigit === '3') {
        setTarjetaForm(prev => ({ ...prev, tipo_tarjeta: 'amex' }));
      }
    } else if (name === 'fecha_vencimiento') {
      newValue = value.replace(/\D/g, '').slice(0, 4);
      if (newValue.length >= 2) {
        newValue = newValue.slice(0, 2) + '/' + newValue.slice(2);
      }
    } else if (name === 'cvv') {
      newValue = value.replace(/\D/g, '');
      const maxLength = tarjetaForm.tipo_tarjeta === 'amex' ? 4 : 3;
      newValue = newValue.slice(0, maxLength);
    }
    
    setTarjetaForm(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleNewAddressChange = (e) => {
    const { name, value } = e.target;
    setNewAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleDireccionSelect = (direccion) => {
    const direccionTexto = `${direccion.calle} #${direccion.numero_exterior}${direccion.numero_interior ? ` Int. ${direccion.numero_interior}` : ''}, ${direccion.colonia}, ${direccion.ciudad}, ${direccion.estado}, CP: ${direccion.codigo_postal}`;
    
    setFormData(prev => ({
      ...prev,
      direccion_id: direccion.id,
      direccion_texto: direccionTexto
    }));
    
    setShowNewAddressForm(false);
  };

  const saveNewAddress = async () => {
    if (!isAuthenticated) {
      const direccionTexto = `${newAddress.calle} #${newAddress.numero_exterior}${newAddress.numero_interior ? ` Int. ${newAddress.numero_interior}` : ''}, ${newAddress.colonia}, ${newAddress.ciudad}, ${newAddress.estado}, CP: ${newAddress.codigo_postal}`;
      
      setFormData(prev => ({
        ...prev,
        direccion_id: null,
        direccion_texto: direccionTexto
      }));
      
      return true;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://127.0.0.1:5000/direcciones/me/direcciones', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAddress)
      });

      if (response.ok) {
        const data = await response.json();
        const direccionTexto = `${data.direccion.calle} #${data.direccion.numero_exterior}${data.direccion.numero_interior ? ` Int. ${data.direccion.numero_interior}` : ''}, ${data.direccion.colonia}, ${data.direccion.ciudad}, ${data.direccion.estado}, CP: ${data.direccion.codigo_postal}`;
        
        setFormData(prev => ({
          ...prev,
          direccion_id: data.direccion.id,
          direccion_texto: direccionTexto
        }));
        
        fetchDirecciones();
        return true;
      } else {
        const errorData = await response.json();
        alert(`Error al guardar dirección: ${errorData.msg || 'Error desconocido'}`);
        return false;
      }
    } catch (error) {
      console.error('Error al guardar dirección:', error);
      alert('Error de conexión al guardar dirección');
      return false;
    }
  };

  // ========== FUNCIONES DE VALIDACIÓN ==========
  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.nombre_usuario.trim()) {
      newErrors.nombre_usuario = 'El nombre es requerido';
    } else if (formData.nombre_usuario.trim().length < 2) {
      newErrors.nombre_usuario = 'El nombre debe tener al menos 2 caracteres';
    }
    
    if (!formData.telefono_usuario.trim()) {
      newErrors.telefono_usuario = 'El teléfono es requerido';
    } else {
      const telefono = formData.telefono_usuario.trim();
      const formatoValido = /^(\+52\d{10}|\d{10})$/.test(telefono);
      
      if (!formatoValido) {
        newErrors.telefono_usuario = 'Formato: 10 dígitos o +52 seguido de 10 dígitos (ej: +521234567890)';
      }
    }
    
    if (ingredientesSeleccionados.length === 0) {
      newErrors.ingredientes_personalizados = 'Selecciona al menos un ingrediente';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!isAuthenticated) {
      if (!newAddress.calle.trim()) newErrors.calle = 'La calle es requerida';
      if (!newAddress.numero_exterior.trim()) newErrors.numero_exterior = 'El número exterior es requerido';
      if (!newAddress.colonia.trim()) newErrors.colonia = 'La colonia es requerida';
      if (!newAddress.ciudad.trim()) newErrors.ciudad = 'La ciudad es requerida';
      if (!newAddress.estado.trim()) newErrors.estado = 'El estado es requerido';
      if (!newAddress.codigo_postal.trim()) newErrors.codigo_postal = 'El código postal es requerido';
      else if (!/^\d{5}$/.test(newAddress.codigo_postal)) newErrors.codigo_postal = 'El código postal debe tener 5 dígitos';
    } else {
      if (!formData.direccion_id && !showNewAddressForm) {
        newErrors.direccion = 'Selecciona una dirección o crea una nueva';
      }
      
      if (showNewAddressForm) {
        if (!newAddress.calle.trim()) newErrors.calle = 'La calle es requerida';
        if (!newAddress.numero_exterior.trim()) newErrors.numero_exterior = 'El número exterior es requerido';
        if (!newAddress.colonia.trim()) newErrors.colonia = 'La colonia es requerida';
        if (!newAddress.ciudad.trim()) newErrors.ciudad = 'La ciudad es requerida';
        if (!newAddress.estado.trim()) newErrors.estado = 'El estado es requerido';
        if (!newAddress.codigo_postal.trim()) newErrors.codigo_postal = 'El código postal es requerido';
        else if (!/^\d{5}$/.test(newAddress.codigo_postal)) newErrors.codigo_postal = 'El código postal debe tener 5 dígitos';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateTarjeta = () => {
    const errors = {};
    
    const numeroLimpio = tarjetaForm.numero_tarjeta.replace(/\s/g, '');
    if (numeroLimpio.length !== 16) {
      errors.numero_tarjeta = 'El número de tarjeta debe tener 16 dígitos';
    } else if (!/^\d+$/.test(numeroLimpio)) {
      errors.numero_tarjeta = 'El número de tarjeta solo debe contener dígitos';
    }
    
    if (!tarjetaForm.nombre_titular.trim()) {
      errors.nombre_titular = 'El nombre del titular es requerido';
    } else if (tarjetaForm.nombre_titular.trim().length < 3) {
      errors.nombre_titular = 'El nombre debe tener al menos 3 caracteres';
    }
    
    const fechaRegex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
    if (!fechaRegex.test(tarjetaForm.fecha_vencimiento)) {
      errors.fecha_vencimiento = 'Formato inválido (MM/YY)';
    } else {
      const [mes, año] = tarjetaForm.fecha_vencimiento.split('/');
      const ahora = new Date();
      const añoActual = ahora.getFullYear() % 100;
      const mesActual = ahora.getMonth() + 1;
      
      const añoNum = parseInt(año, 10);
      const mesNum = parseInt(mes, 10);
      
      if (añoNum < añoActual || (añoNum === añoActual && mesNum < mesActual)) {
        errors.fecha_vencimiento = 'La tarjeta está vencida';
      }
    }
    
    const cvvLength = tarjetaForm.tipo_tarjeta === 'amex' ? 4 : 3;
    if (!tarjetaForm.cvv) {
      errors.cvv = 'El CVV es requerido';
    } else if (tarjetaForm.cvv.length !== cvvLength) {
      errors.cvv = tarjetaForm.tipo_tarjeta === 'amex' 
        ? 'El CVV de Amex tiene 4 dígitos' 
        : 'El CVV tiene 3 dígitos';
    } else if (!/^\d+$/.test(tarjetaForm.cvv)) {
      errors.cvv = 'El CVV solo debe contener dígitos';
    }
    
    if (!aceptoTerminos) {
      errors.terminos = 'Debes aceptar los términos y condiciones';
    }
    
    return errors;
  };

  const validateStep3 = () => {
    if (formData.metodo_pago === 'tarjeta') {
      const tarjetaErrors = validateTarjeta();
      if (Object.keys(tarjetaErrors).length > 0) {
        setErrors(tarjetaErrors);
        return false;
      }
    }
    return true;
  };

  // ========== FUNCIONES DE NAVEGACIÓN ==========
  const handleNextStep = async () => {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      if (!validateStep2()) return;
      
      if (showNewAddressForm || !isAuthenticated) {
        const saved = await saveNewAddress();
        if (!saved) return;
      }
      
      setStep(3);
    } else if (step === 3) {
      if (!validateStep3()) return;
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // ========== FUNCIONES DE NOTIFICACIONES ==========
  const generarNotificaciones = async (ordenId) => {
    try {
      console.log(`Generando notificaciones para orden personalizada ${ordenId}`);
      
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`http://127.0.0.1:5000/notificaciones/pedido/${ordenId}/nuevo`, {
        method: 'POST',
        headers
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Notificaciones generadas:', result);
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        console.error('Error al generar notificaciones:', errorData);
        return { success: false, error: errorData };
      }
    } catch (error) {
      console.error('Error de conexión al generar notificaciones:', error);
      return { success: false, error: error.message };
    }
  };

  // ========== FUNCIÓN PRINCIPAL ==========
  const handleSubmitOrder = async () => {
    try {
      setLoading(true);
      console.log('Iniciando creación de pedido personalizado...');
      
      let direccionTextoFinal = formData.direccion_texto;
      
      if (!direccionTextoFinal || direccionTextoFinal.trim() === '' || direccionTextoFinal === 'null') {
        if (showNewAddressForm || !isAuthenticated || direcciones.length === 0) {
          if (newAddress.calle && newAddress.numero_exterior && newAddress.colonia && newAddress.ciudad && newAddress.estado && newAddress.codigo_postal) {
            direccionTextoFinal = `${newAddress.calle} #${newAddress.numero_exterior}${newAddress.numero_interior ? ` Int. ${newAddress.numero_interior}` : ''}, ${newAddress.colonia}, ${newAddress.ciudad}, ${newAddress.estado}, CP: ${newAddress.codigo_postal}`;
          } else {
            direccionTextoFinal = 'Dirección no especificada completamente';
          }
        } else if (formData.direccion_id && direcciones.length > 0) {
          const direccionSeleccionada = direcciones.find(d => d.id === formData.direccion_id);
          if (direccionSeleccionada) {
            direccionTextoFinal = `${direccionSeleccionada.calle} #${direccionSeleccionada.numero_exterior}${direccionSeleccionada.numero_interior ? ` Int. ${direccionSeleccionada.numero_interior}` : ''}, ${direccionSeleccionada.colonia}, ${direccionSeleccionada.ciudad}, ${direccionSeleccionada.estado}, CP: ${direccionSeleccionada.codigo_postal}`;
          } else {
            direccionTextoFinal = 'Dirección seleccionada no encontrada';
          }
        } else {
          direccionTextoFinal = 'Dirección no especificada';
        }
      }
      
      const pedidoJson = {
        tipo: 'personalizado',
        producto_nombre: 'Pedido Personalizado',
        ingredientes: formData.ingredientes_personalizados.trim(),
        cantidad: 1,
        precio_unitario: formData.precio,
        total: formData.precio,
        metodo_pago: formData.metodo_pago,
        fecha_pedido: new Date().toISOString(),
        items: [
          {
            nombre: 'Pedido Personalizado',
            ingredientes: formData.ingredientes_personalizados.trim(),
            cantidad: 1,
            precio_unitario: formData.precio,
            subtotal: formData.precio,
            tipo: 'personalizado'
          }
        ],
        direccion_entrega: direccionTextoFinal,
        cliente_nombre: formData.nombre_usuario.trim(),
        cliente_telefono: formData.telefono_usuario.trim(),
        num_ingredientes: ingredientesSeleccionados.length
      };
      
      const orderData = {
        nombre_usuario: formData.nombre_usuario.trim(),
        telefono_usuario: formData.telefono_usuario.trim(),
        tipo_pedido: 'personalizado',
        metodo_pago: formData.metodo_pago,
        ingredientes_personalizados: formData.ingredientes_personalizados.trim(),
        precio: formData.precio,
        direccion_texto: direccionTextoFinal,
        direccion_id: formData.direccion_id || null,
        pedido_json: JSON.stringify(pedidoJson),
        estado: 'pendiente'
      };

      if (formData.metodo_pago === 'tarjeta') {
        const numeroLimpio = tarjetaForm.numero_tarjeta.replace(/\s/g, '');
        orderData.info_pago = {
          tipo: tarjetaForm.tipo_tarjeta,
          ultimos_4_digitos: numeroLimpio.slice(-4),
          titular: tarjetaForm.nombre_titular
        };
      }
      
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('http://127.0.0.1:5000/ordenes/', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        setOrdenCreada(result.orden);
        
        let mensajeExito = `Pedido personalizado creado exitosamente! 
          Código: ${result.orden?.codigo_unico || result.orden?.codigo || 'N/A'}
          Método de pago: ${formData.metodo_pago === 'efectivo' ? 'Efectivo' : 'Tarjeta'}`;
        
        if (result.notificaciones_generadas) {
          mensajeExito += '\nSe han enviado notificaciones a administradores.';
        } else {
          setTimeout(async () => {
            try {
              await generarNotificaciones(result.orden.id);
            } catch (notificationError) {
              console.warn('No se pudieron generar notificaciones:', notificationError);
            }
          }, 1000);
        }
        
        setSuccessMessage(mensajeExito);
        
        setTimeout(() => {
          if (onOrderCreated && result.orden) {
            onOrderCreated(result.orden);
          }
          onClose();
        }, 5000);
        
      } else {
        const errorData = await response.json();
        alert(`Error al crear el pedido: ${errorData.msg || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      alert('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price || 0);
  };

  // ========== FUNCIONES DE RENDERIZADO ==========
  const renderStep1 = () => (
    <div className="crear-pedido-step">
      <h3>Paso 1: Ingredientes y Datos Personales</h3>
      
      <div className="form-section">
        <h4>Información Personal</h4>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nombre_usuario">Nombre Completo *</label>
            {isAuthenticated ? (
              <>
                <input
                  type="text"
                  id="nombre_usuario"
                  name="nombre_usuario"
                  value={formData.nombre_usuario}
                  readOnly
                  className="readonly-input"
                  placeholder="Cargando información del perfil..."
                />
                <div className="field-info">
                  <small>Obtenido de tu perfil</small>
                </div>
              </>
            ) : (
              <input
                type="text"
                id="nombre_usuario"
                name="nombre_usuario"
                value={formData.nombre_usuario}
                onChange={handleInputChange}
                placeholder="Ingresa tu nombre completo"
                className={errors.nombre_usuario ? 'input-error' : ''}
                disabled={loading}
              />
            )}
            {errors.nombre_usuario && (
              <span className="error-message">{errors.nombre_usuario}</span>
            )}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="telefono_usuario">Teléfono *</label>
            {isAuthenticated ? (
              <>
                <input
                  type="tel"
                  id="telefono_usuario"
                  name="telefono_usuario"
                  value={formData.telefono_usuario}
                  readOnly
                  className="readonly-input"
                  placeholder="Cargando información del perfil..."
                />
                <div className="field-info">
                  <small>Obtenido de tu perfil</small>
                </div>
              </>
            ) : (
              <>
                <input
                  type="tel"
                  id="telefono_usuario"
                  name="telefono_usuario"
                  value={formData.telefono_usuario}
                  onChange={handleInputChange}
                  placeholder="10 dígitos o +521234567890"
                  className={errors.telefono_usuario ? 'input-error' : ''}
                  disabled={loading}
                />
                <div className="form-helper">
                  <small>Formato: 10 dígitos o +52 seguido de 10 dígitos</small>
                </div>
              </>
            )}
            {errors.telefono_usuario && (
              <span className="error-message">{errors.telefono_usuario}</span>
            )}
          </div>
        </div>
        
        {!isAuthenticated && (
          <div className="auth-suggestion">
            <span>
              ¿Quieres guardar tus datos para futuros pedidos? 
              <a href="/login" className="auth-link"> Inicia sesión</a>
            </span>
          </div>
        )}
      </div>

      <div className="form-section">
        <h4>Selecciona tus Ingredientes</h4>
        <div className="form-row">
          <div className="form-group">
            {loadingIngredientes ? (
              <div className="loading-ingredientes">
                <div className="spinner"></div>
                <span>Cargando ingredientes disponibles...</span>
              </div>
            ) : (
              <>
                <div className="ingredientes-grid-container-large">
                  <div className="ingredientes-grid-large">
                    {ingredientesDisponibles.map((ingrediente, index) => (
                      <label 
                        key={index} 
                        className={`ingrediente-checkbox-large ${ingredientesSeleccionados.includes(ingrediente) ? 'selected' : ''}`}
                        htmlFor={`ingrediente-${index}`}
                      >
                        <input
                          type="checkbox"
                          id={`ingrediente-${index}`}
                          checked={ingredientesSeleccionados.includes(ingrediente)}
                          onChange={() => handleIngredienteToggle(ingrediente)}
                          disabled={loading}
                        />
                        <span className="checkbox-custom-large"></span>
                        <span className="ingrediente-text-large">{ingrediente}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {errors.ingredientes_personalizados && (
                  <span className="error-message">{errors.ingredientes_personalizados}</span>
                )}
                
                <div className="ingredientes-count">
                  {ingredientesSeleccionados.length} ingrediente(s) seleccionado(s)
                </div>
              </>
            )}
          </div>
        </div>

        {ingredientesSeleccionados.length > 0 && (
          <div className="ingredientes-preview">
            <strong>Ingredientes seleccionados:</strong>
            <div className="ingredientes-list">
              {ingredientesSeleccionados.join(', ')}
            </div>
          </div>
        )}
      </div>

      <div className="price-summary">
        <div className="price-item">
          <span>Total ingredientes:</span>
          <span>{ingredientesSeleccionados.length}</span>
        </div>
        <div className="price-total">
          <span>Precio total:</span>
          <span className="total-price">{formatPrice(formData.precio)}</span>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="crear-pedido-step">
      <h3>Paso 2: Dirección de Entrega</h3>
      
      {isAuthenticated && direcciones.length > 0 && !showNewAddressForm && (
        <div className="form-section">
          <h4>Tus Direcciones Guardadas</h4>
          <div className="direcciones-list">
            {direcciones.map((direccion, index) => (
              <div 
                key={direccion.id} 
                className={`direccion-item ${formData.direccion_id === direccion.id ? 'selected' : ''}`}
                onClick={() => handleDireccionSelect(direccion)}
              >
                <div className="direccion-item-header">
                  <div className="direccion-tipo">
                    {direccion.tipo === 'casa' && <img src={homeIcon} alt="Casa" className="direccion-icon" />}
                    {direccion.tipo === 'trabajo' && <img src={workIcon} alt="Trabajo" className="direccion-icon" />}
                    {direccion.tipo === 'otro' && <img src={otherIcon} alt="Otro" className="direccion-icon" />}
                    <span>{direccion.tipo === 'casa' ? 'Casa' : direccion.tipo === 'trabajo' ? 'Trabajo' : 'Otro'}</span>
                    {direccion.predeterminada && <span className="direccion-predeterminada">(Predeterminada)</span>}
                  </div>
                </div>
                <div className="direccion-info">
                  <p>{direccion.calle} #{direccion.numero_exterior}{direccion.numero_interior ? ` Int. ${direccion.numero_interior}` : ''}</p>
                  <p>{direccion.colonia}, {direccion.ciudad}, {direccion.estado}</p>
                  <p>CP: {direccion.codigo_postal}</p>
                  {direccion.referencias && <p className="direccion-referencias">{direccion.referencias}</p>}
                </div>
              </div>
            ))}
          </div>
          
          <button 
            type="button"
            className="btn-secondary"
            onClick={() => setShowNewAddressForm(true)}
            style={{ marginTop: '15px' }}
          >
            <img src={addIcon} alt="Agregar" style={{ width: '16px', marginRight: '8px' }} />
            Usar una dirección nueva
          </button>
        </div>
      )}

      {(showNewAddressForm || !isAuthenticated || direcciones.length === 0) && (
        <div className="form-section">
          <h4>{isAuthenticated ? 'Nueva Dirección' : 'Dirección de Entrega'}</h4>
          
          <div className="address-form-grid">
            <div className="form-group">
              <label>Calle *</label>
              <input
                type="text"
                name="calle"
                value={newAddress.calle}
                onChange={handleNewAddressChange}
                className={errors.calle ? 'input-error' : ''}
                placeholder="Nombre de la calle"
                disabled={loading}
              />
              {errors.calle && <span className="error-message">{errors.calle}</span>}
            </div>
            
            <div className="form-group">
              <label>Número Exterior *</label>
              <input
                type="text"
                name="numero_exterior"
                value={newAddress.numero_exterior}
                onChange={handleNewAddressChange}
                className={errors.numero_exterior ? 'input-error' : ''}
                placeholder="123"
                disabled={loading}
              />
              {errors.numero_exterior && <span className="error-message">{errors.numero_exterior}</span>}
            </div>
            
            <div className="form-group">
              <label>Número Interior</label>
              <input
                type="text"
                name="numero_interior"
                value={newAddress.numero_interior}
                onChange={handleNewAddressChange}
                placeholder="A"
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label>Colonia *</label>
              <input
                type="text"
                name="colonia"
                value={newAddress.colonia}
                onChange={handleNewAddressChange}
                className={errors.colonia ? 'input-error' : ''}
                placeholder="Nombre de la colonia"
                disabled={loading}
              />
              {errors.colonia && <span className="error-message">{errors.colonia}</span>}
            </div>
            
            <div className="form-group">
              <label>Ciudad *</label>
              <input
                type="text"
                name="ciudad"
                value={newAddress.ciudad}
                onChange={handleNewAddressChange}
                className={errors.ciudad ? 'input-error' : ''}
                placeholder="Nombre de la ciudad"
                disabled={loading}
              />
              {errors.ciudad && <span className="error-message">{errors.ciudad}</span>}
            </div>
            
            <div className="form-group">
              <label>Estado *</label>
              <input
                type="text"
                name="estado"
                value={newAddress.estado}
                onChange={handleNewAddressChange}
                className={errors.estado ? 'input-error' : ''}
                placeholder="Nombre del estado"
                disabled={loading}
              />
              {errors.estado && <span className="error-message">{errors.estado}</span>}
            </div>
            
            <div className="form-group">
              <label>Código Postal *</label>
              <input
                type="text"
                name="codigo_postal"
                value={newAddress.codigo_postal}
                onChange={handleNewAddressChange}
                className={errors.codigo_postal ? 'input-error' : ''}
                placeholder="12345"
                maxLength="5"
                disabled={loading}
              />
              {errors.codigo_postal && <span className="error-message">{errors.codigo_postal}</span>}
            </div>
            
            <div className="form-group">
              <label>Tipo de Dirección</label>
              <select
                name="tipo"
                value={newAddress.tipo}
                onChange={handleNewAddressChange}
                disabled={loading}
                className="form-select"
              >
                <option value="casa">Casa</option>
                <option value="trabajo">Trabajo</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            
            <div className="form-group full-width">
              <label>Referencias</label>
              <textarea
                name="referencias"
                value={newAddress.referencias}
                onChange={handleNewAddressChange}
                placeholder="Entre calles, puntos de referencia, etc."
                rows="3"
                disabled={loading}
                className="form-textarea"
              />
            </div>
          </div>
          
          {isAuthenticated && direcciones.length > 0 && (
            <button 
              type="button"
              className="btn-secondary"
              onClick={() => setShowNewAddressForm(false)}
              style={{ marginTop: '15px' }}
            >
              Usar una dirección existente
            </button>
          )}
        </div>
      )}
      
      {errors.direccion && (
        <div className="error-message" style={{ marginTop: '10px' }}>
          {errors.direccion}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="crear-pedido-step">
      <h3>Paso 3: Método de Pago</h3>
      
      <div className="pago-container">
        <div className="pago-metodos">
          <div className="metodos-grid">
            <div 
              className={`metodo-pago-card ${formData.metodo_pago === 'efectivo' ? 'seleccionado' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, metodo_pago: 'efectivo' }))}
            >
              <div className="metodo-icon">💵</div>
              <div className="metodo-info">
                <h4>Pago en Efectivo</h4>
                <p>Paga cuando recibas tu pedido</p>
                <div className="metodo-desc">
                  Entrega el dinero al repartidor al momento de la entrega.
                </div>
              </div>
              <div className="metodo-radio">
                <input 
                  type="radio" 
                  name="metodoPago" 
                  checked={formData.metodo_pago === 'efectivo'}
                  onChange={() => setFormData(prev => ({ ...prev, metodo_pago: 'efectivo' }))}
                />
              </div>
            </div>
            
            <div 
              className={`metodo-pago-card ${formData.metodo_pago === 'tarjeta' ? 'seleccionado' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, metodo_pago: 'tarjeta' }))}
            >
              <div className="metodo-icon">💳</div>
              <div className="metodo-info">
                <h4>Pago con Tarjeta</h4>
                <p>Pago seguro en línea</p>
                <div className="metodo-desc">
                  Paga ahora con tarjeta de crédito o débito.
                </div>
              </div>
              <div className="metodo-radio">
                <input 
                  type="radio" 
                  name="metodoPago" 
                  checked={formData.metodo_pago === 'tarjeta'}
                  onChange={() => setFormData(prev => ({ ...prev, metodo_pago: 'tarjeta' }))}
                />
              </div>
            </div>
          </div>
        </div>

        {formData.metodo_pago === 'tarjeta' && (
          <div className="tarjeta-form-container">
            <h3>Información de la tarjeta</h3>
            
            <div className="tarjeta-form-grid">
              <div className="form-group full-width">
                <label>Nombre del titular *</label>
                <input
                  type="text"
                  name="nombre_titular"
                  value={tarjetaForm.nombre_titular}
                  onChange={handleTarjetaChange}
                  placeholder="Como aparece en la tarjeta"
                  className={`form-input ${errors.nombre_titular ? 'input-error' : ''}`}
                  required
                />
                {errors.nombre_titular && (
                  <span className="error-message">{errors.nombre_titular}</span>
                )}
              </div>
              
              <div className="form-group full-width">
                <label>Número de tarjeta *</label>
                <div className="tarjeta-input-container">
                  <input
                    type="text"
                    name="numero_tarjeta"
                    value={tarjetaForm.numero_tarjeta}
                    onChange={handleTarjetaChange}
                    placeholder="1234 5678 9012 3456"
                    className={`form-input tarjeta-input ${errors.numero_tarjeta ? 'input-error' : ''}`}
                    maxLength="19"
                    required
                  />
                  <div className="tarjeta-icons">
                    {tarjetaForm.tipo_tarjeta === 'visa' && (
                      <span className="tarjeta-icon">Visa</span>
                    )}
                    {tarjetaForm.tipo_tarjeta === 'mastercard' && (
                      <span className="tarjeta-icon">Mastercard</span>
                    )}
                    {tarjetaForm.tipo_tarjeta === 'amex' && (
                      <span className="tarjeta-icon">Amex</span>
                    )}
                  </div>
                </div>
                {errors.numero_tarjeta && (
                  <span className="error-message">{errors.numero_tarjeta}</span>
                )}
                <small className="form-hint">Ingrese los 16 dígitos de su tarjeta</small>
              </div>
              
              <div className="form-group">
                <label>Fecha de vencimiento *</label>
                <input
                  type="text"
                  name="fecha_vencimiento"
                  value={tarjetaForm.fecha_vencimiento}
                  onChange={handleTarjetaChange}
                  placeholder="MM/YY"
                  className={`form-input ${errors.fecha_vencimiento ? 'input-error' : ''}`}
                  maxLength="5"
                  required
                />
                {errors.fecha_vencimiento && (
                  <span className="error-message">{errors.fecha_vencimiento}</span>
                )}
                <small className="form-hint">Mes/Año</small>
              </div>
              
              <div className="form-group">
                <label>CVV *</label>
                <div className="cvv-input-container">
                  <input
                    type="password"
                    name="cvv"
                    value={tarjetaForm.cvv}
                    onChange={handleTarjetaChange}
                    placeholder={tarjetaForm.tipo_tarjeta === 'amex' ? '1234' : '123'}
                    className={`form-input cvv-input ${errors.cvv ? 'input-error' : ''}`}
                    maxLength={tarjetaForm.tipo_tarjeta === 'amex' ? 4 : 3}
                    required
                  />
                  <button 
                    type="button" 
                    className="cvv-info-btn"
                    title="Código de seguridad de 3 o 4 dígitos en el reverso de la tarjeta"
                  >
                    ?
                  </button>
                </div>
                {errors.cvv && (
                  <span className="error-message">{errors.cvv}</span>
                )}
                <small className="form-hint">
                  {tarjetaForm.tipo_tarjeta === 'amex' 
                    ? '4 dígitos en el frente' 
                    : '3 dígitos en el reverso'}
                </small>
              </div>
            </div>
            
            <div className="terminos-tarjeta">
              <div className="terminos-checkbox">
                <input
                  type="checkbox"
                  id="aceptoTerminos"
                  checked={aceptoTerminos}
                  onChange={(e) => setAceptoTerminos(e.target.checked)}
                  className="terminos-input"
                />
                <label htmlFor="aceptoTerminos" className="terminos-label">
                  Acepto los <a href="/terminos" target="_blank">Términos y Condiciones</a> y 
                  la <button 
                    type="button" 
                    className="politica-link"
                    onClick={() => setShowPoliticaSeguridad(!showPoliticaSeguridad)}
                  >
                    Política de Seguridad
                  </button>
                </label>
              </div>
              {errors.terminos && (
                <span className="error-message">{errors.terminos}</span>
              )}
              
              {showPoliticaSeguridad && (
                <div className="politica-seguridad-popup">
                  <div className="politica-header">
                    <h4>🔒 Política de Seguridad de Pagos</h4>
                    <button 
                      className="close-politica"
                      onClick={() => setShowPoliticaSeguridad(false)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="politica-content">
                    <p><strong>Tu seguridad es nuestra prioridad:</strong></p>
                    <ul>
                      <li>Encriptación SSL 256-bit de grado bancario</li>
                      <li>Cumplimiento PCI DSS - Estándar de seguridad más alto</li>
                      <li>Nunca almacenamos números completos de tarjetas</li>
                      <li>No guardamos códigos CVV en nuestros servidores</li>
                      <li>Procesamiento seguro con proveedores certificados</li>
                      <li>Monitoreo anti-fraude 24/7</li>
                      <li>Autenticación 3D Secure para mayor protección</li>
                    </ul>
                    <p className="politica-nota">
                      Los datos de pago son procesados directamente por nuestro proveedor de pagos certificado PCI DSS Nivel 1.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="info-seguridad">
              <div className="seguridad-icon">🔒</div>
              <div className="seguridad-text">
                <p><strong>Pago 100% seguro</strong></p>
                <p>Tus datos están protegidos con encriptación SSL de 256 bits. Nunca almacenamos información sensible de tu tarjeta.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="crear-pedido-step">
      <h3>Paso 4: Confirmar Pedido</h3>
      
      {successMessage ? (
        <div className="success-message">
          <div className="success-icon"></div>
          <div className="success-text">
            {successMessage.split('\n').map((line, index) => (
              <div key={index}>{line}</div>
            ))}
            <div className="success-subtext">
              {ordenCreada ? `Se han enviado notificaciones para la orden ${ordenCreada.codigo_unico || ordenCreada.codigo}` : 'Generando notificaciones...'}
            </div>
            <div className="success-subtext">Cerrando en 5 segundos...</div>
          </div>
        </div>
      ) : (
        <>
          <div className="form-section">
            <h4>Resumen del Pedido</h4>
            
            <div className="order-summary">
              <div className="summary-item">
                <strong>Cliente:</strong>
                <span>{formData.nombre_usuario}</span>
              </div>
              
              <div className="summary-item">
                <strong>Contacto:</strong>
                <span>{formData.telefono_usuario}</span>
              </div>
              
              <div className="summary-item">
                <strong>Tipo de pedido:</strong>
                <span>Personalizado</span>
              </div>
              
              <div className="summary-item">
                <strong>Ingredientes seleccionados:</strong>
                <span>{ingredientesSeleccionados.length}</span>
              </div>
              
              <div className="summary-item ingredientes-list-summary">
                <strong>Lista de ingredientes:</strong>
                <p>{formData.ingredientes_personalizados}</p>
              </div>
              
              <div className="summary-item">
                <strong>Dirección de entrega:</strong>
                <p className="address-summary">{formData.direccion_texto}</p>
              </div>
              
              <div className="summary-item">
                <strong>Método de pago:</strong>
                <span className="metodo-pago-tag">
                  {formData.metodo_pago === 'efectivo' ? 'Efectivo' : 'Tarjeta'}
                </span>
              </div>
              
              {formData.metodo_pago === 'tarjeta' && tarjetaForm.numero_tarjeta && (
                <div className="summary-item">
                  <strong>Tarjeta:</strong>
                  <span>
                    {tarjetaForm.tipo_tarjeta} •••• {tarjetaForm.numero_tarjeta.replace(/\s/g, '').slice(-4)}
                  </span>
                </div>
              )}
              
              <div className="summary-item">
                <strong>Precio calculado:</strong>
                <span>{formatPrice(formData.precio)}</span>
              </div>
              
              <div className="summary-item total-price-summary">
                <strong>Total a pagar:</strong>
                <span className="final-price">{formatPrice(formData.precio)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch(step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  return (
    <div className="modal-overlay">
      <div className={`modal-content crear-pedido-modal ${darkMode ? 'dark-mode' : ''}`}>
        <div className="modal-header">
          <h2>Crear Pedido Personalizado</h2>
          <button className="close-modal" onClick={onClose} disabled={loading}>
            <img src={closeIcon} alt="Cerrar" />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="progress-steps">
            <div className={`step-indicator ${step >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Ingredientes</div>
            </div>
            <div className={`step-indicator ${step >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Dirección</div>
            </div>
            <div className={`step-indicator ${step >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Pago</div>
            </div>
            <div className={`step-indicator ${step >= 4 ? 'active' : ''}`}>
              <div className="step-number">4</div>
              <div className="step-label">Confirmar</div>
            </div>
          </div>
          
          <div className="step-content">
            {renderCurrentStep()}
          </div>
        </div>
        
        <div className="modal-footer">
          {step > 1 && !successMessage && (
            <button 
              className="btn-secondary"
              onClick={handlePrevStep}
              disabled={loading}
            >
              ← Anterior
            </button>
          )}
          
          {step < 4 && !successMessage && (
            <button 
              className="btn-primary"
              onClick={handleNextStep}
              disabled={loading}
            >
              Siguiente →
            </button>
          )}
          
          {step === 4 && !successMessage && (
            <button 
              className="btn-primary confirm-btn"
              onClick={handleSubmitOrder}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Confirmando Pedido...
                </>
              ) : (
                `Confirmar Compra - ${formatPrice(formData.precio)}`
              )}
            </button>
          )}
          
          {successMessage && (
            <button 
              className="btn-secondary"
              onClick={onClose}
            >
              Cerrar Ahora
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrearPedidoModal;