import React from 'react';
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
  
  // Verificar si el usuario está autenticado
  const isAuthenticated = localStorage.getItem('token') !== null;

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    navigate('/'); // Redirigir a Home, no a Login
    window.location.reload(); // Recargar para actualizar el estado
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

      {/* Hero Section */}
      <section className="home-hero" id="inicio">
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
          <div className="home-hero-image">
            {/* <div className="home-image-container">
              <img src={lechuga} alt="Producto Crazy Lettuces" className="home-product-image" />
            </div> */}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="home-products" id="productos">
        <div className="home-container">
          <h2 className="home-section-title">{t('productosTitle')}</h2>
          <div className="home-products-grid">
            
            <div className="home-product-card">
              <div className="home-product-image-container">
                <img src={LogoLechuga} alt="Lechugas con Gomitas" className="home-product-icon-image" />
              </div>
              <h3>{t('comboFreshName')}</h3>
              <p>{t('comboFreshDescription')}</p>
            </div>
            
            <div className="home-product-card">
              <div className="home-product-image-container">
                <img src={LogoLechuga} alt="Combo Loco" className="home-product-icon-image" />
              </div>
              <h3>{t('crazySpicyName')}</h3>
              <p>{t('crazySpicyDescription')}</p>
            </div>

            <div className="home-product-card">
              <div className="home-product-image-container">
                <img src={LogoLechuga} alt="Especial Crazy" className="home-product-icon-image" />
              </div>
              <h3>{t('comboLocoName')}</h3>
              <p>{t('comboLocoDescription')}</p>
            </div>
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
                <li><a href="#productos">{t('lechugasChile')}</a></li>
                <li><a href="#productos">{t('lechugasGomitas')}</a></li>
                <li><a href="#productos">{t('combosLocos')}</a></li>
              </ul>
            </div>
            <div className="home-footer-section">
              <h4>{t('contacto')}</h4>
              <ul>
                <li><i className="fas fa-map-marker-alt"></i> {t('direccion')}</li>
                <li><i className="fas fa-phone"></i> {t('telefono')}</li>
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