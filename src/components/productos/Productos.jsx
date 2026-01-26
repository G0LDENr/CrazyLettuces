import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../../context/config';
import { HiMiniUserCircle } from "react-icons/hi2";
import { IoNotificationsCircle } from "react-icons/io5";
import '../../css/productos.css';

import logo from '../../img/crazylettuces.png';
import lechugaIcon from '../../img/lechugalogo.png';
import searchIcon from '../../img/search.png';

const Productos = () => {
  const { t, darkMode } = useConfig();
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [productosPopulares, setProductosPopulares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const productosPerPage = 8;

  // Estados para el formulario personalizado
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    telefono_usuario: '',
    tipo_pedido: 'personalizado',
    ingredientes_personalizados: ''
  });
  const [ingredientesSeleccionados, setIngredientesSeleccionados] = useState([]);
  const [precioCalculado, setPrecioCalculado] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Lista de ingredientes disponibles
  const ingredientesDisponibles = [
    'Limon',
    'Chile en Polvo',
    'Sal',
    'Gomita Picante',
    'Gomita Dulce',
    'Gomitas Aciditas',
    'Chamoy',
    'Salsa',
    'Cacahuate',
    'Miguelito',
    'Lechuga Romana',
    'Tomate Cherry',
    'Queso Feta',
    'Pollo a la Parrilla',
    'Aderezo Ranch',
    'Pepino',
    'Zanahoria',
    'Maíz',
    'Aguacate',
    'Croutones'
  ];

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    navigate('/'); // Redirigir a Home
    window.location.reload(); // Recargar para actualizar el estado
  };

  // Cargar datos del usuario desde localStorage si está autenticado
  const loadUserData = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null; // No está autenticado
      
      const userStr = localStorage.getItem('user') || localStorage.getItem('userData');
      if (userStr) {
        const user = JSON.parse(userStr);
        
        // Actualizar formData con los datos del usuario
        setFormData(prev => ({
          ...prev,
          nombre_usuario: user.nombre || '',
          telefono_usuario: user.telefono || ''
        }));
        
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
      return null;
    }
  };

  // Resetear solo los campos del pedido
  const resetPedidoForm = () => {
    setIngredientesSeleccionados([]);
    setPrecioCalculado(0);
    setErrors({});
    setSuccessMessage('');
    setSubmitLoading(false);
    
    // Si está autenticado, mantener nombre y teléfono, sino limpiar todo
    const token = localStorage.getItem('token');
    if (token) {
      // Usuario autenticado: mantener datos del perfil
      setFormData(prev => ({
        ...prev,
        ingredientes_personalizados: ''
      }));
    } else {
      // Usuario NO autenticado: limpiar todo
      setFormData({
        nombre_usuario: '',
        telefono_usuario: '',
        tipo_pedido: 'personalizado',
        ingredientes_personalizados: ''
      });
    }
  };

  // Verificar autenticación
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userIsAuthenticated = !!token;
    setIsAuthenticated(userIsAuthenticated);
    
    // Cargar productos siempre (con o sin autenticación)
    fetchProductosYPopulares();
    
    // Si está autenticado, cargar sus datos
    if (userIsAuthenticated) {
      loadUserData();
    }
  }, []);

  useEffect(() => {
    calcularPrecio();
  }, [ingredientesSeleccionados]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    }
    return {
      'Content-Type': 'application/json'
    };
  };

  const fetchProductosYPopulares = async () => {
    try {
      setLoading(true);
      
      const productosResponse = await fetch('http://127.0.0.1:5000/especiales/', {
        headers: getAuthHeaders()
      });
      
      let productosData = [];
      
      if (productosResponse.ok) {
        productosData = await productosResponse.json();
        const productosActivos = productosData.filter(producto => producto.activo);
        setProductos(productosActivos);
        productosData = productosActivos;
      } else {
        console.error('Error al obtener productos:', productosResponse.status);
      }

      const ordenesResponse = await fetch('http://127.0.0.1:5000/ordenes/', {
        headers: getAuthHeaders()
      });
      
      if (ordenesResponse.ok) {
        const ordenesData = await ordenesResponse.json();
        const productosConConteo = calcularProductosPopulares(productosData, ordenesData);
        setProductosPopulares(productosConConteo.slice(0, 4));
      } else {
        console.error('Error al obtener órdenes:', ordenesResponse.status);
        setProductosPopulares(productosData.slice(0, 4));
      }
      
    } catch (error) {
      console.error('Error de conexión:', error);
      if (productos.length > 0) {
        setProductosPopulares(productos.slice(0, 4));
      }
    } finally {
      setLoading(false);
    }
  };

  const calcularProductosPopulares = (productos, ordenes) => {
    const conteoProductos = {};
    
    ordenes.forEach(orden => {
      if (orden.tipo_pedido === 'especial' && orden.especial_id) {
        const productoId = orden.especial_id;
        conteoProductos[productoId] = (conteoProductos[productoId] || 0) + 1;
      }
    });

    const productosConConteo = productos.map(producto => ({
      ...producto,
      conteo: conteoProductos[producto.id] || 0
    }));

    return productosConConteo.sort((a, b) => {
      if (b.conteo !== a.conteo) {
        return b.conteo - a.conteo;
      }
      return a.nombre.localeCompare(b.nombre);
    });
  };

  const calcularPrecio = () => {
    const numIngredientes = ingredientesSeleccionados.length;
    let precio = 0;
    
    if (numIngredientes <= 3) {
      precio = 30; // Precio base por 1-3 ingredientes
    } else if (numIngredientes <= 5) {
      precio = 35; // 4-5 ingredientes
    } else if (numIngredientes <= 7) {
      precio = 40; // 6-7 ingredientes
    } else {
      precio = 45 + ((numIngredientes - 7) * 2); // +$2 por ingrediente extra
    }
    
    setPrecioCalculado(precio);
  };

  // Filtrar productos basado en búsqueda
  const filteredProductos = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (producto.descripcion && producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (producto.ingredientes && producto.ingredientes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Paginación
  const indexOfLastProduct = currentPage * productosPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productosPerPage;
  const currentProductos = filteredProductos.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProductos.length / productosPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleProductClick = (producto) => {
    // Cualquiera puede ver los detalles del producto
    setSelectedProduct(producto);
    setShowProductModal(true);
  };

  const handleCreateCustom = () => {
    // Cualquiera puede crear pedidos personalizados
    
    // Si está autenticado, cargar sus datos
    if (isAuthenticated) {
      loadUserData();
    }
    
    resetPedidoForm();
    setShowCreateModal(true);
  };

  const handleIngredienteToggle = (ingrediente) => {
    setIngredientesSeleccionados(prev => {
      const nuevosIngredientes = prev.includes(ingrediente)
        ? prev.filter(ing => ing !== ingrediente)
        : [...prev, ingrediente];
      
      // Actualizar el campo de ingredientes personalizados en formData
      setFormData(prevData => ({
        ...prevData,
        ingredientes_personalizados: nuevosIngredientes.join(', ')
      }));
      
      return nuevosIngredientes;
    });

    // Limpiar error si existía
    if (errors.ingredientes_personalizados) {
      setErrors(prev => ({ ...prev, ingredientes_personalizados: '' }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre_usuario.trim()) {
      newErrors.nombre_usuario = 'El nombre es requerido';
    } else if (formData.nombre_usuario.trim().length < 2) {
      newErrors.nombre_usuario = 'El nombre debe tener al menos 2 caracteres';
    }
    
    if (!formData.telefono_usuario.trim()) {
      newErrors.telefono_usuario = 'El teléfono es requerido';
    } else if (!/^\d{10}$/.test(formData.telefono_usuario.trim())) {
      newErrors.telefono_usuario = 'El teléfono debe tener 10 dígitos';
    }
    
    if (ingredientesSeleccionados.length === 0) {
      newErrors.ingredientes_personalizados = 'Selecciona al menos un ingrediente';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitCustomOrder = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitLoading(true);
      
      const orderData = {
        nombre_usuario: formData.nombre_usuario.trim(),
        telefono_usuario: formData.telefono_usuario.trim(),
        tipo_pedido: 'personalizado',
        ingredientes_personalizados: formData.ingredientes_personalizados.trim()
      };
      
      const response = await fetch('http://127.0.0.1:5000/ordenes/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(orderData)
      });
      
      if (response.ok) {
        const result = await response.json();
        setSuccessMessage(`¡Pedido creado exitosamente! Código: ${result.orden.codigo}`);
        
        // Resetear formulario después de 3 segundos
        setTimeout(() => {
          resetPedidoForm();
          setShowCreateModal(false);
        }, 3000);
        
      } else {
        const errorData = await response.json();
        alert(`❌ Error al crear el pedido: ${errorData.msg || 'Error desconocido'}`);
        setSubmitLoading(false);
      }
      
    } catch (error) {
      console.error('Error al crear pedido personalizado:', error);
      alert('❌ Error de conexión. Por favor, intenta nuevamente.');
      setSubmitLoading(false);
    }
  };

  const handleAddToOrder = () => {
    // Cualquiera puede agregar al pedido
    alert(`Agregando ${selectedProduct.nombre} al pedido...`);
    closeModal();
  };

  const closeModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetPedidoForm();
  };

  const handleLoginRedirect = () => {
    window.location.href = '/login';
  };

  const handleRegisterRedirect = () => {
    window.location.href = '/registro';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price || 0);
  };

  // Si está cargando
  if (loading) {
    return (
      <div className={`productos-container ${darkMode ? 'dark-mode' : ''}`}>
        <div className="loading-spinner"></div>
        <p style={{textAlign: 'center', color: darkMode ? '#e2e8f0' : '#666'}}>
          Cargando productos...
        </p>
      </div>
    );
  }

  return (
    <div className={`productos-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* Header - CON TODAS LAS OPCIONES */}
      <header className="productos-header">
        <nav className="productos-nav">
          <div className="productos-nav-brand">
            <div className="productos-logo-container">
              <img src={logo} alt="Crazy Lettuces" className="productos-logo" />
              <h2>
                <span className="productos-crazy-swash">Crazy</span> Lettuces
              </h2>
            </div>
          </div>
          <ul className="productos-nav-menu">
            <li><a href="/">{t('inicio')}</a></li>
            <li><a href="#productos" className="active">{t('productos')}</a></li>
            <li><a href="/nosotros">{t('nosotros')}</a></li>
            <li><a href="/configuracion">{t('configuracion')}</a></li>
            <li><a href="/login">{t('login')}</a></li>
            <li className="nav-profile-icon">
              <a href="/perfil" title="Mi Perfil">
                <HiMiniUserCircle className="profile-icon" />
              </a>
            </li>
            <li className="nav-profile-icon">
              <a href="/notificacionesUser" title="Notifycation">
                <IoNotificationsCircle className="profile-icon" />
              </a>
            </li>
            {isAuthenticated && (
              <li>
                <button 
                  onClick={handleLogout} 
                  className="productos-logout-btn"
                  title="Cerrar Sesión"
                >
                  Cerrar Sesión
                </button>
              </li>
            )}
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="productos-hero">
        <div className="productos-container-main">
          <h1 className="productos-title">
            Nuestros <span className="productos-crazy-swash-hero">Productos</span>
          </h1>
          <p className="productos-subtitle">
            Descubre nuestras deliciosas lechugas y crea tu propio pedido
          </p>
        </div>
      </section>

      {/* Productos Populares - PARA TODOS */}
      {productosPopulares.length > 0 && (
        <section className="productos-populares-section">
          <div className="productos-container-main">
            <h2 className="section-title">🔥 Productos Más Solicitados</h2>
            <div className="productos-populares-grid">
              {productosPopulares.map((producto) => (
                <div 
                  key={producto.id} 
                  className="producto-popular-card"
                  onClick={() => handleProductClick(producto)}
                >
                  <div className="producto-popular-image">
                    <img src={lechugaIcon} alt={producto.nombre} />
                    <div className="popular-badge">
                      {producto.conteo > 0 ? `${producto.conteo} pedidos` : 'Nuevo'}
                    </div>
                  </div>
                  <div className="producto-popular-content">
                    <h3>{producto.nombre}</h3>
                    <p className="producto-popular-desc">
                      {producto.descripcion && producto.descripcion.length > 80 
                        ? `${producto.descripcion.substring(0, 80)}...` 
                        : producto.descripcion || 'Descripción no disponible'
                      }
                    </p>
                    <div className="producto-popular-price">
                      {formatPrice(producto.precio)}
                    </div>
                    <button className="ver-producto-btn">
                      Ver Producto
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Buscador y Todos los Productos - PARA TODOS */}
      <section className="todos-productos-section">
        <div className="productos-container-main">
          <div className="productos-header-actions">
            <h2 className="section-title">Todos los Productos</h2>
            
            {/* Buscador */}
            <div className="productos-search-container">
              <div className="search-input-wrapper">
                <img src={searchIcon} alt="Buscar" className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar productos por nombre, ingredientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="productos-search-input"
                />
                {searchTerm && (
                  <button 
                    className="clear-search"
                    onClick={() => setSearchTerm('')}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card de Creación Personalizada */}
          <div className="custom-product-card" onClick={handleCreateCustom}>
            <div className="custom-card-content">
              <div className="custom-card-icon">✨</div>
              <h3>Crea tu Propio Combo</h3>
              <p>¿No encuentras lo que buscas? Crea tu pedido personalizado con los ingredientes que prefieras.</p>
              <button className="create-custom-btn">
                Crear Pedido Personalizado
              </button>
            </div>
          </div>

          {/* Grid de Productos */}
          <div className="productos-grid">
            {currentProductos.length > 0 ? (
              currentProductos.map((producto) => (
                <div 
                  key={producto.id} 
                  className="producto-card"
                  onClick={() => handleProductClick(producto)}
                >
                  <div className="producto-image">
                    <img src={lechugaIcon} alt={producto.nombre} />
                  </div>
                  <div className="producto-content">
                    <h3>{producto.nombre}</h3>
                    <p className="producto-desc">
                      {producto.descripcion && producto.descripcion.length > 100 
                        ? `${producto.descripcion.substring(0, 100)}...` 
                        : producto.descripcion || 'Descripción no disponible'
                      }
                    </p>
                    <div className="producto-ingredients">
                      <strong>Ingredientes:</strong> 
                      {producto.ingredientes && producto.ingredientes.length > 60 
                        ? `${producto.ingredientes.substring(0, 60)}...` 
                        : producto.ingredientes || 'Ingredientes no disponibles'
                      }
                    </div>
                    <div className="producto-footer">
                      <div className="producto-price">
                        {formatPrice(producto.precio)}
                      </div>
                      <button className="producto-btn">
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-products">
                <p>No se encontraron productos con esos criterios de búsqueda.</p>
              </div>
            )}
          </div>

          {/* Paginación */}
          {filteredProductos.length > productosPerPage && (
            <div className="pagination-container">
              <div className="pagination-controls">
                <button 
                  onClick={() => paginate(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className="pagination-btn prev-btn"
                >
                  Anterior
                </button>
                
                <div className="pagination-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(number => 
                      number === 1 || 
                      number === totalPages || 
                      (number >= currentPage - 1 && number <= currentPage + 1)
                    )
                    .map((number, index, array) => {
                      const showEllipsis = index > 0 && number - array[index - 1] > 1;
                      return (
                        <React.Fragment key={number}>
                          {showEllipsis && <span className="pagination-ellipsis">...</span>}
                          <button
                            onClick={() => paginate(number)}
                            className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
                          >
                            {number}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>
                
                <button 
                  onClick={() => paginate(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                  className="pagination-btn next-btn"
                >
                  Siguiente
                </button>
              </div>

              <div className="productos-count-info">
                Mostrando {currentProductos.length} de {filteredProductos.length} productos
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="productos-footer">
        <div className="productos-container-main">
          <div className="productos-footer-content">
            <div className="productos-footer-section">
              <div className="productos-footer-logo-container">
                <img src={logo} alt="Crazy Lettuces" className="productos-footer-logo" />
                <h3>
                  <span className="productos-crazy-swash">Crazy</span> Lettuces
                </h3>
              </div>
              <p>Fresh & Crazy lechugas para todos los gustos</p>
            </div>
            <div className="productos-footer-section">
              <h4>Productos</h4>
              <ul>
                <li><a href="#productos">Lechugas Chile</a></li>
                <li><a href="#productos">Lechugas Gomitas</a></li>
                <li><a href="#productos">Combos Locos</a></li>
              </ul>
            </div>
            <div className="productos-footer-section">
              <h4>Contacto</h4>
              <ul>
                <li>📍 Dirección: Tu dirección aquí</li>
                <li>📞 Teléfono: +52 123 456 7890</li>
                <li>✉️ Email: info@crazylettuces.com</li>
              </ul>
            </div>
          </div>
          <div className="productos-footer-bottom">
            <p>&copy; 2024 Crazy Lettuces. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Modal de Producto - PARA TODOS */}
      {showProductModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content product-modal">
            <div className="modal-header">
              <h3>{selectedProduct.nombre}</h3>
              <button className="close-modal" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="product-modal-content">
                <div className="product-modal-image">
                  <img src={lechugaIcon} alt={selectedProduct.nombre} />
                </div>
                <div className="product-modal-details">
                  <div className="product-modal-price">
                    {formatPrice(selectedProduct.precio)}
                  </div>
                  <div className="product-modal-description">
                    <h4>Descripción</h4>
                    <p>{selectedProduct.descripcion || 'Descripción no disponible'}</p>
                  </div>
                  <div className="product-modal-ingredients">
                    <h4>Ingredientes</h4>
                    <p>{selectedProduct.ingredientes || 'Ingredientes no disponibles'}</p>
                  </div>
                  <div className="product-modal-actions">
                    <button 
                      className="add-to-cart-btn"
                      onClick={handleAddToOrder}
                    >
                      Agregar al Pedido
                    </button>
                    <button 
                      className="customize-btn" 
                      onClick={handleCreateCustom}
                    >
                      Crear Personalizado
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear Pedido Personalizado */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content custom-order-modal">
            <div className="modal-header">
              <h3>Crear Pedido Personalizado</h3>
              <button className="close-modal" onClick={closeCreateModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="custom-order-form-container">
                <form onSubmit={handleSubmitCustomOrder} className="custom-order-form">
                  {/* Mensaje de éxito */}
                  {successMessage && (
                    <div className="custom-success-message">
                      <div className="success-icon">✓</div>
                      <div className="success-text">
                        {successMessage}
                        <div className="success-subtext">Cerrando en 3 segundos...</div>
                      </div>
                    </div>
                  )}

                  {/* Información Personal - COMPORTAMIENTO DIFERENTE SEGÚN AUTENTICACIÓN */}
                  <div className="form-section">
                    <h4>Información Personal</h4>
                    
                    {/* Nombre */}
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
                              <small>✓ Obtenido de tu perfil</small>
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
                            disabled={submitLoading || successMessage}
                          />
                        )}
                        {errors.nombre_usuario && (
                          <span className="error-message">{errors.nombre_usuario}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Teléfono */}
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
                              <small>✓ Obtenido de tu perfil</small>
                            </div>
                          </>
                        ) : (
                          <input
                            type="tel"
                            id="telefono_usuario"
                            name="telefono_usuario"
                            value={formData.telefono_usuario}
                            onChange={handleInputChange}
                            placeholder="10 dígitos, ej: 5512345678"
                            className={errors.telefono_usuario ? 'input-error' : ''}
                            disabled={submitLoading || successMessage}
                          />
                        )}
                        {errors.telefono_usuario && (
                          <span className="error-message">{errors.telefono_usuario}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Mensaje para usuarios no autenticados */}
                    {!isAuthenticated && (
                      <div className="auth-suggestion">
                        <span className="auth-icon">🔐</span>
                        <span>
                          ¿Quieres guardar tus datos para futuros pedidos? 
                          <a href="/login" className="auth-link"> Inicia sesión</a>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Selección de Ingredientes */}
                  <div className="form-section">
                    <h4>Selecciona tus Ingredientes</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <div className="ingredientes-grid-container">
                          <div className="ingredientes-grid">
                            {ingredientesDisponibles.map((ingrediente, index) => (
                              <label 
                                key={index} 
                                className={`ingrediente-checkbox ${ingredientesSeleccionados.includes(ingrediente) ? 'selected' : ''}`}
                                htmlFor={`ingrediente-${index}`}
                              >
                                <input
                                  type="checkbox"
                                  id={`ingrediente-${index}`}
                                  checked={ingredientesSeleccionados.includes(ingrediente)}
                                  onChange={() => handleIngredienteToggle(ingrediente)}
                                  disabled={submitLoading || successMessage}
                                />
                                <span className="checkbox-custom"></span>
                                <span className="ingrediente-text">{ingrediente}</span>
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

                  {/* Resumen del Pedido */}
                  <div className="form-section">
                    <h4>Resumen del Pedido</h4>
                    <div className="resumen-pedido">
                      <div className="resumen-item">
                        <strong>Cliente:</strong>
                        <span>{formData.nombre_usuario || 'No disponible'}</span>
                      </div>
                      <div className="resumen-item">
                        <strong>Contacto:</strong>
                        <span>{formData.telefono_usuario || 'No disponible'}</span>
                      </div>
                      <div className="resumen-item">
                        <strong>Tipo de pedido:</strong>
                        <span>Personalizado</span>
                      </div>
                      <div className="resumen-item">
                        <strong>Total ingredientes:</strong>
                        <span>{ingredientesSeleccionados.length} seleccionados</span>
                      </div>
                      <div className="resumen-precio">
                        <strong>Precio total:</strong>
                        <span className="precio-final">{formatPrice(precioCalculado)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="cancel-btn"
                      onClick={closeCreateModal}
                      disabled={submitLoading || successMessage}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="submit-btn"
                      disabled={submitLoading || successMessage || ingredientesSeleccionados.length === 0}
                    >
                      {submitLoading ? (
                        <>
                          <span className="spinner"></span>
                          Creando Pedido...
                        </>
                      ) : successMessage ? (
                        '✓ Pedido Creado'
                      ) : (
                        'Crear Pedido Personalizado'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Productos;