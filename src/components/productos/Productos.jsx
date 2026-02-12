// pages/Productos.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../../context/config';
import { HiMiniUserCircle } from "react-icons/hi2";
import { IoNotificationsCircle } from "react-icons/io5";
import { FaShoppingCart } from "react-icons/fa";
import '../../css/productos.css';
import '../../css/carrito.css';

import logo from '../../img/crazylettuces.png';
import lechugaIcon from '../../img/lechugalogo.png';
import searchIcon from '../../img/search.png';

import CrearPedidoModal from './create-producto';
import ComprarProductoModal from './comprar-producto';

const Productos = () => {
  const navigate = useNavigate();
  const { t, darkMode } = useConfig();
  
  // ========== ESTADOS PARA PRODUCTOS ==========
  const [productos, setProductos] = useState([]);
  const [productosPopulares, setProductosPopulares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCrearPedidoModal, setShowCrearPedidoModal] = useState(false);
  const [showComprarModal, setShowComprarModal] = useState(false);
  const [productoParaComprar, setProductoParaComprar] = useState(null);
  const productosPerPage = 8;
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [loadingIngredientes, setLoadingIngredientes] = useState(true);

  // ========== ESTADOS PARA CARRITO ==========
  const [carritoCount, setCarritoCount] = useState(0);
  const [animarCarrito, setAnimarCarrito] = useState(false);

  // ========== FUNCIONES DEL CARRITO ==========
  const carritoKey = 'carrito_crazylettuces';

  // Obtener carrito desde localStorage
  const getCarritoFromStorage = () => {
    try {
      const carritoStr = localStorage.getItem(carritoKey);
      return carritoStr ? JSON.parse(carritoStr) : [];
    } catch (error) {
      console.error('Error al cargar carrito:', error);
      return [];
    }
  };

  // Guardar carrito en localStorage
  const saveCarritoToStorage = (carrito) => {
    try {
      localStorage.setItem(carritoKey, JSON.stringify(carrito));
    } catch (error) {
      console.error('Error al guardar carrito:', error);
    }
  };

  // Actualizar contador del carrito
  const updateCarritoCount = () => {
    const carrito = getCarritoFromStorage();
    const total = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);
    setCarritoCount(total);
  };

  // Agregar producto al carrito
  const agregarAlCarrito = (producto, cantidad = 1) => {
    const carrito = getCarritoFromStorage();
    const productoExistente = carrito.find(item => item.id === producto.id);
    
    if (productoExistente) {
      productoExistente.cantidad += cantidad;
    } else {
      carrito.push({
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        precio: producto.precio || 0,
        ingredientes: producto.ingredientes || '',
        imagen: lechugaIcon,
        cantidad: cantidad,
        fechaAgregado: new Date().toISOString()
      });
    }
    
    saveCarritoToStorage(carrito);
    updateCarritoCount();
    
    // Animación del ícono
    setAnimarCarrito(true);
    setTimeout(() => setAnimarCarrito(false), 500);
    
    return carrito;
  };

  // Ir a la página del carrito
  const handleGoToCarrito = () => {
    navigate('/carrito');
  };

  // ========== FUNCIONES PRODUCTOS ==========
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
      }
    } catch (error) {
      console.error('Error de conexión al obtener ingredientes:', error);
    } finally {
      setLoadingIngredientes(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    navigate('/');
    window.location.reload();
  };

  // Verificar autenticación y cargar datos
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userIsAuthenticated = !!token;
    setIsAuthenticated(userIsAuthenticated);
    
    fetchProductosYPopulares();
    fetchIngredientesDisponibles();
    updateCarritoCount();
  }, []);

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
      }

      const ordenesResponse = await fetch('http://127.0.0.1:5000/ordenes/', {
        headers: getAuthHeaders()
      });
      
      if (ordenesResponse.ok) {
        const ordenesData = await ordenesResponse.json();
        const productosConConteo = calcularProductosPopulares(productosData, ordenesData);
        setProductosPopulares(productosConConteo.slice(0, 4));
      } else {
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
    setSelectedProduct(producto);
    setShowProductModal(true);
  };

  const handleCreateCustom = () => {
    setShowCrearPedidoModal(true);
  };

  const handleAddToCart = (producto) => {
    agregarAlCarrito(producto, 1);
    alert(`✅ Producto agregado al carrito: ${producto.nombre}`);
    
    if (showProductModal) {
      closeModal();
    }
  };

  const handleComprarProducto = (producto) => {
    setProductoParaComprar(producto);
    setShowComprarModal(true);
    setShowProductModal(false);
  };

  const closeModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
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
            
            <li className="nav-carrito-icon">
              <a 
                href="/carrito" 
                onClick={(e) => {
                  e.preventDefault();
                  handleGoToCarrito();
                }}
                title="Carrito de Compras"
                className="carrito-link"
              >
                <FaShoppingCart className={`carrito-icon ${animarCarrito ? 'animar-carrito' : ''}`} />
                {carritoCount > 0 && (
                  <span className="carrito-badge">
                    {carritoCount > 99 ? '99+' : carritoCount}
                  </span>
                )}
              </a>
            </li>
            
            <li className="nav-profile-icon">
              <a href="/perfil" title="Mi Perfil">
                <HiMiniUserCircle className="profile-icon" />
              </a>
            </li>
            <li className="nav-profile-icon">
              <a href="/notificacionesUser" title="Notificaciones">
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

      {/* Productos Populares - SIN TEXTO DE "SIN DESCRIPCIÓN" */}
      {productosPopulares.length > 0 && (
        <section className="productos-populares-section">
          <div className="productos-container-main">
            <h2 className="section-title">Productos Más Solicitados</h2>
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
                    {/* SOLO mostrar descripción si existe, SIN texto alternativo */}
                    {producto.descripcion && producto.descripcion.trim() !== '' && (
                      <p className="producto-popular-desc">
                        {producto.descripcion.length > 80 
                          ? `${producto.descripcion.substring(0, 80)}...` 
                          : producto.descripcion
                        }
                      </p>
                    )}
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

      {/* Buscador y Todos los Productos */}
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
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card de Creación Personalizada */}
          <div className="custom-product-card" onClick={handleCreateCustom}>
            <div className="custom-card-content">
              <div className="custom-card-icon">+</div>
              <h3>⭐Crea tu Propio Combo</h3>
              <p>¿No encuentras lo que buscas? Crea tu pedido personalizado con los ingredientes que prefieras.</p>
              <button className="create-custom-btn">
                Crear Pedido Personalizado
              </button>
            </div>
          </div>

          {/* Grid de Productos - SIN TEXTO DE "SIN DESCRIPCIÓN" */}
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
                    {/* SOLO mostrar descripción si existe, SIN texto alternativo */}
                    {producto.descripcion && producto.descripcion.trim() !== '' && (
                      <p className="producto-desc">
                        {producto.descripcion.length > 100 
                          ? `${producto.descripcion.substring(0, 100)}...` 
                          : producto.descripcion
                        }
                      </p>
                    )}
                    <div className="producto-ingredients">
                      <strong>Ingredientes:</strong> 
                      {producto.ingredientes && producto.ingredientes.length > 60 
                        ? `${producto.ingredientes.substring(0, 60)}...` 
                        : producto.ingredientes || ''
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
                <li>Dirección: Tu dirección aquí</li>
                <li>Teléfono: +52 123 456 7890</li>
                <li>Email: info@crazylettuces.com</li>
              </ul>
            </div>
          </div>
          <div className="productos-footer-bottom">
            <p>&copy; 2024 Crazy Lettuces. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Modal de Producto - SIN SECCIÓN DE DESCRIPCIÓN SI NO EXISTE */}
      {showProductModal && selectedProduct && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content product-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedProduct.nombre}</h3>
              <button className="close-modal" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="product-modal-content">
                <div className="product-modal-image">
                  <img src={lechugaIcon} alt={selectedProduct.nombre} />
                  <div className="product-price-badge">
                    {formatPrice(selectedProduct.precio)}
                  </div>
                </div>
                <div className="product-modal-details">
                  
                  {/* DESCRIPCIÓN - SOLO si existe y NO está vacía, SIN texto alternativo */}
                  {selectedProduct.descripcion && selectedProduct.descripcion.trim() !== '' && (
                    <div className="detail-section">
                      <h4>Descripción</h4>
                      <p className="description-text">
                        {selectedProduct.descripcion}
                      </p>
                    </div>
                  )}
                  
                  <div className="detail-section">
                    <h4>Ingredientes</h4>
                    <div className="ingredients-container">
                      {selectedProduct.ingredientes ? (
                        <div className="ingredients-list">
                          {selectedProduct.ingredientes.split(',').map((ing, index) => (
                            <span key={index} className="ingredient-tag">
                              {ing.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="no-ingredients">Este producto no tiene ingredientes especificados</p>
                      )}
                    </div>
                  </div>
                  
                  {selectedProduct.info_nutricional && (
                    <div className="detail-section">
                      <h4>Información Nutricional</h4>
                      <p className="nutrition-info">{selectedProduct.info_nutricional}</p>
                    </div>
                  )}
                  
                  <div className="product-modal-actions">
                    <button 
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(selectedProduct)}
                    >
                      Agregar al Carrito
                    </button>
                    <button 
                      className="buy-now-btn" 
                      onClick={() => handleComprarProducto(selectedProduct)}
                    >
                      Comprar Ahora
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Comprar Producto */}
      {showComprarModal && productoParaComprar && (
        <ComprarProductoModal 
          producto={productoParaComprar}
          onClose={() => setShowComprarModal(false)}
          onOrderCreated={(orden) => {
            console.log('Pedido creado:', orden);
            fetchProductosYPopulares();
          }}
        />
      )}

      {/* Modal para Crear Pedido Personalizado */}
      {showCrearPedidoModal && (
        <CrearPedidoModal 
          onClose={() => setShowCrearPedidoModal(false)}
          onOrderCreated={(orden) => {
            console.log('Pedido creado:', orden);
            fetchProductosYPopulares();
          }}
        />
      )}
    </div>
  );
};

export default Productos;