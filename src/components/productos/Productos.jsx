import React, { useEffect, useState } from 'react';
import { useConfig } from '../../context/config';
import '../../css/productos.css';

import logo from '../../img/crazylettuces.png';
import lechugaIcon from '../../img/lechugalogo.png';
import searchIcon from '../../img/search.png';
import userIcon from '../../img/user.png';

const Productos = () => {
  const { t, darkMode } = useConfig();
  const [productos, setProductos] = useState([]);
  const [productosPopulares, setProductosPopulares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const productosPerPage = 8;

  // Verificar autenticación
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userIsAuthenticated = !!token;
    setIsAuthenticated(userIsAuthenticated);
    
    // Si no está autenticado, mostrar mensaje de login inmediatamente
    if (!userIsAuthenticated) {
      setShowLoginMessage(true);
    } else {
      // Si está autenticado, cargar productos
      fetchProductosYPopulares();
    }
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchProductosYPopulares = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Obtener productos (especiales activos) - CORREGIDO: usar endpoint correcto
      const productosResponse = await fetch('http://127.0.0.1:5000/especiales/', {
        headers: getAuthHeaders()
      });
      
      let productosData = [];
      
      if (productosResponse.ok) {
        productosData = await productosResponse.json();
        // Filtrar solo los productos activos
        const productosActivos = productosData.filter(producto => producto.activo);
        setProductos(productosActivos);
        productosData = productosActivos;
      } else {
        console.error('Error al obtener productos:', productosResponse.status);
      }

      // Obtener órdenes para calcular productos populares - CORREGIDO: con autenticación
      const ordenesResponse = await fetch('http://127.0.0.1:5000/ordenes/', {
        headers: getAuthHeaders()
      });
      
      if (ordenesResponse.ok) {
        const ordenesData = await ordenesResponse.json();
        const productosConConteo = calcularProductosPopulares(productosData, ordenesData);
        setProductosPopulares(productosConConteo.slice(0, 4)); // Top 4 productos
      } else {
        console.error('Error al obtener órdenes:', ordenesResponse.status);
        // Si no se pueden obtener órdenes, usar los primeros productos como populares
        setProductosPopulares(productosData.slice(0, 4));
      }
      
    } catch (error) {
      console.error('Error de conexión:', error);
      // En caso de error, usar los primeros productos como populares
      if (productos.length > 0) {
        setProductosPopulares(productos.slice(0, 4));
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para calcular productos populares basado en órdenes
  const calcularProductosPopulares = (productos, ordenes) => {
    // Crear un mapa para contar cuántas veces se ha pedido cada producto
    const conteoProductos = {};
    
    ordenes.forEach(orden => {
      if (orden.tipo_pedido === 'especial' && orden.especial_id) {
        const productoId = orden.especial_id;
        conteoProductos[productoId] = (conteoProductos[productoId] || 0) + 1;
      }
    });

    // Agregar el conteo a cada producto y ordenar por popularidad
    const productosConConteo = productos.map(producto => ({
      ...producto,
      conteo: conteoProductos[producto.id] || 0
    }));

    // Ordenar por conteo (más popular primero) y luego por nombre
    return productosConConteo.sort((a, b) => {
      if (b.conteo !== a.conteo) {
        return b.conteo - a.conteo;
      }
      return a.nombre.localeCompare(b.nombre);
    });
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
    if (!isAuthenticated) {
      setShowLoginMessage(true);
      return;
    }
    setSelectedProduct(producto);
    setShowProductModal(true);
  };

  const handleCreateCustom = () => {
    if (!isAuthenticated) {
      setShowLoginMessage(true);
      return;
    }
    // Aquí puedes redirigir a la página de creación personalizada o abrir otro modal
    alert('Redirigiendo a creación de pedido personalizado...');
  };

  const handleAddToOrder = () => {
    if (!isAuthenticated) {
      setShowLoginMessage(true);
      return;
    }
    // Lógica para agregar al pedido
    alert(`Agregando ${selectedProduct.nombre} al pedido...`);
    closeModal();
  };

  const closeModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const closeLoginMessage = () => {
    setShowLoginMessage(false);
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

  // Si no está autenticado, mostrar solo el mensaje de login
  if (!isAuthenticated) {
    return (
      <div className={`productos-container ${darkMode ? 'dark-mode' : ''}`}>
        {/* Header */}
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

        {/* Mensaje de Login Requerido */}
        <section className="login-required-section">
          <div className="productos-container-main">
            <div className="login-required-content">
              <div className="login-required-icon">🔒</div>
              <h2>Inicio de Sesión Requerido</h2>
              <p>Para ver nuestros productos y realizar pedidos, necesitas iniciar sesión o registrarte.</p>
              <div className="login-required-actions">
                <button 
                  className="login-btn primary"
                  onClick={handleLoginRedirect}
                >
                  Iniciar Sesión
                </button>
                <button 
                  className="login-btn secondary"
                  onClick={handleRegisterRedirect}
                >
                  Registrarse
                </button>
              </div>
              <p className="login-required-note">
                ¿No tienes una cuenta? Regístrate para acceder a todos nuestros productos y ofertas exclusivas.
              </p>
            </div>
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
      </div>
    );
  }

  // Si está autenticado, mostrar los productos normalmente
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
      {/* Header */}
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
            <li>
              <a href="/perfil" className="user-profile">
                <img src={userIcon} alt="Usuario" className="user-icon" />
                Mi Perfil
              </a>
            </li>
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

      {/* Productos Populares - SOLO PARA USUARIOS AUTENTICADOS */}
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

      {/* Buscador y Todos los Productos - SOLO PARA USUARIOS AUTENTICADOS */}
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
              <h3>Crea tu Propio Producto</h3>
              <p>¿No encuentras lo que buscas? Crea tu pedido personalizado con los ingredientes que prefieras.</p>
              <button className="create-custom-btn">
                Personalizar Pedido
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

      {/* Modal de Producto - SOLO PARA USUARIOS AUTENTICADOS */}
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
                      Personalizar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Productos;