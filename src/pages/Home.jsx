import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/config';
import { HiMiniUserCircle } from "react-icons/hi2";
import { IoNotificationsCircle } from "react-icons/io5";
import '../css/home.css';

import logo from '../img/crazylettuces.png';
import lechuga from '../img/lechugas.png';
import LogoLechuga from '../img/lechugalogo.png';
import facebookLogo from '../img/facebook.png';
import instagramLogo from '../img/instagram.png';
import tik_tokLogo from '../img/tik-tok.png';

const Home = () => {
  const { t } = useConfig();
  const navigate = useNavigate();
  
  // Estados para productos populares
  const [productosPopulares, setProductosPopulares] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Verificar si el usuario está autenticado
  const isAuthenticated = localStorage.getItem('token') !== null;

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    navigate('/');
    window.location.reload();
  };

  // ========== CARGAR PRODUCTOS POPULARES ==========
  useEffect(() => {
    fetchProductosPopulares();
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

  const fetchProductosPopulares = async () => {
    try {
      setLoading(true);
      
      // Obtener todos los especiales
      const productosResponse = await fetch('http://127.0.0.1:5000/especiales/', {
        headers: getAuthHeaders()
      });
      
      let productosData = [];
      
      if (productosResponse.ok) {
        productosData = await productosResponse.json();
        productosData = productosData.filter(producto => producto.activo);
      } else {
        console.error('Error al obtener productos:', productosResponse.status);
        setLoading(false);
        return;
      }

      // Obtener órdenes para contar los más vendidos
      const ordenesResponse = await fetch('http://127.0.0.1:5000/ordenes/', {
        headers: getAuthHeaders()
      });
      
      if (ordenesResponse.ok) {
        const ordenesData = await ordenesResponse.json();
        const productosConConteo = calcularProductosPopulares(productosData, ordenesData);
        setProductosPopulares(productosConConteo.slice(0, 3));
      } else {
        console.error('Error al obtener órdenes:', ordenesResponse.status);
        setProductosPopulares(productosData.slice(0, 3));
      }
      
    } catch (error) {
      console.error('Error de conexión:', error);
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

  // ========== FUNCIONES DE NAVEGACIÓN ==========
  const handleVerProducto = (productoId) => {
    navigate('/productos', { 
      state: { 
        productoDestacado: productoId,
        desdeHome: true 
      } 
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price || 0);
  };

  return (
    <div className="home">
      {/* Header */}
      <header className="home-header">
        <nav className="home-nav">
          <div className="home-nav-brand">
            <div className="home-logo-container">
              <img src={logo} alt="Crazy Lettuces" className="home-logo" />
              <h2>
                <span className="home-crazy-swash">Crazy</span> Lettuces
              </h2>
            </div>
          </div>
          <ul className="home-nav-menu">
            <li><a href="#inicio">{t('inicio')}</a></li>
            <li><a href="/productos">{t('productos')}</a></li>
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
                  className="home-logout-btn"
                  title="Cerrar Sesión"
                >
                  Cerrar Sesión
                </button>
              </li>
            )}
          </ul>
        </nav>
      </header>

      {/* Hero Section - SIN CUADROS BLANCOS */}
      <section className="home-hero" id="inicio">
        <div className="home-hero-overlay"></div>
        <div className="home-hero-content">
          <div className="home-hero-text">
            <h1 className="home-hero-title">
              <span className="home-crazy-large-swash">Crazy</span>
              <span className="home-highlight"> Lettuces</span>
            </h1>
            <p className="home-hero-description">
              {t('heroDescription')}
            </p>
          </div>
        </div>
      </section>

      {/* Products Section - Los Más Populares */}
      <section className="home-products" id="productos">
        <div className="home-container">
          <h2 className="home-section-title">Los Más Populares</h2>
          <p className="home-section-subtitle">
            Descubre los productos favoritos de nuestros clientes
          </p>
          
          {loading ? (
            <div className="home-loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando productos populares...</p>
            </div>
          ) : (
            <div className="home-products-grid">
              {productosPopulares.length > 0 ? (
                productosPopulares.map((producto, index) => (
                  <div 
                    key={producto.id} 
                    className="home-product-card popular-card"
                    onClick={() => handleVerProducto(producto.id)}
                  >
                    <div className="home-product-image-container">
                      <img 
                        src={LogoLechuga} 
                        alt={producto.nombre} 
                        className="home-product-icon-image" 
                      />
                      {producto.conteo > 0 && (
                        <div className="product-count-badge">
                          {producto.conteo} {producto.conteo === 1 ? 'pedido' : 'pedidos'}
                        </div>
                      )}
                    </div>
                    <h3>{producto.nombre}</h3>
                    <p className="product-description">
                      {producto.descripcion && producto.descripcion.length > 60
                        ? `${producto.descripcion.substring(0, 60)}...`
                        : producto.descripcion || 'Producto delicioso'
                      }
                    </p>
                    <div className="product-price">
                      {formatPrice(producto.precio)}
                    </div>
                    <button className="ver-producto-btn">
                      Ver Producto
                    </button>
                  </div>
                ))
              ) : (
                <>
                  <div className="home-product-card" onClick={() => navigate('/productos')}>
                    <div className="home-product-image-container">
                      <img src={LogoLechuga} alt="Lechugas con Gomitas" className="home-product-icon-image" />
                    </div>
                    <h3>{t('comboFreshName')}</h3>
                    <p>{t('comboFreshDescription')}</p>
                    <button className="ver-producto-btn">Ver Producto</button>
                  </div>
                  
                  <div className="home-product-card" onClick={() => navigate('/productos')}>
                    <div className="home-product-image-container">
                      <img src={LogoLechuga} alt="Combo Loco" className="home-product-icon-image" />
                    </div>
                    <h3>{t('crazySpicyName')}</h3>
                    <p>{t('crazySpicyDescription')}</p>
                    <button className="ver-producto-btn">Ver Producto</button>
                  </div>

                  <div className="home-product-card" onClick={() => navigate('/productos')}>
                    <div className="home-product-image-container">
                      <img src={LogoLechuga} alt="Especial Crazy" className="home-product-icon-image" />
                    </div>
                    <h3>{t('comboLocoName')}</h3>
                    <p>{t('comboLocoDescription')}</p>
                    <button className="ver-producto-btn">Ver Producto</button>
                  </div>
                </>
              )}
            </div>
          )}
          
          <div className="home-ver-todos-container">
            <button 
              className="home-ver-todos-btn"
              onClick={() => navigate('/productos')}
            >
              Ver Todos los Productos →
            </button>
          </div>
        </div>
      </section>

      {/* Find Us Section */}
      <section className="home-find-us">
        <div className="home-container">
          <div className="home-find-us-content">
            <h2>{t('encuentranosTitle')}</h2>
            <p>{t('encuentranosDescription')}</p>
            <div className="home-social-icons">
              <a 
                href="https://www.facebook.com/share/1BUz4PdFw8/" 
                className="home-social-link"
                target="_blank" 
                rel="noopener noreferrer"
              >
                <img src={facebookLogo} alt="Facebook" className="home-social-logo" />
              </a>
              <a 
                href="https://www.instagram.com/crazy_lettuces?igsh=MW1oZDloZ3I0cDg2MQ==" 
                className="home-social-link"
                target="_blank" 
                rel="noopener noreferrer"
              >
                <img src={instagramLogo} alt="Instagram" className="home-social-logo" />
              </a>
              <a 
                href="https://www.tiktok.com/@crazy.lettuce8?_r=1&_t=ZS-91InvRY4cKt" 
                className="home-social-link"
                target="_blank" 
                rel="noopener noreferrer"
              >
                <img src={tik_tokLogo} alt="TikTok" className="home-social-logo" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-container">
          <div className="home-footer-content">
            <div className="home-footer-section">
              <div className="home-footer-logo-container">
                <img src={logo} alt="Crazy Lettuces" className="home-footer-logo" />
                <h3>
                  <span className="home-crazy-swash">Crazy</span> Lettuces
                </h3>
              </div>
              <p>{t('footerDescription')}</p>
            </div>
            <div className="home-footer-section">
              <h4>{t('productosFooter')}</h4>
              <ul>
                <li><a href="/productos">Lechugas Chile</a></li>
                <li><a href="/productos">Lechugas Gomitas</a></li>
                <li><a href="/productos">Combos Locos</a></li>
              </ul>
            </div>
            <div className="home-footer-section">
              <h4>{t('contacto')}</h4>
              <ul>
                <li><i className="fas fa-map-marker-alt"></i> {t('direccion')}</li>
                <li><i className="fas fa-phone"></i> {t('telefono1')}</li>
                <li><i className="fas fa-phone"></i> {t('telefono2')}</li>
                <li><i className="fas fa-phone"></i> {t('telefono3')}</li>
                <li><i className="fas fa-phone"></i> {t('telefono4')}</li>
                <li><i className="fas fa-envelope"></i> {t('email')}</li>
              </ul>
            </div>
          </div>
          <div className="home-footer-bottom">
            <p>{t('derechos')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;