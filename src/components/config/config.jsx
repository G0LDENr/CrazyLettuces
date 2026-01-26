import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../../context/config';
import { HiMiniUserCircle } from "react-icons/hi2";
import { IoNotificationsCircle } from "react-icons/io5";
import '../../css/config.css';

import logo from '../../img/crazylettuces.png';

const Configuracion = () => {
  const { language, darkMode, toggleLanguage, toggleDarkMode, t } = useConfig();
  const navigate = useNavigate();
  
  // Verificar si el usuario está autenticado
  const isAuthenticated = localStorage.getItem('token') !== null;

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    navigate('/'); // Redirigir a Home
    window.location.reload(); // Recargar para actualizar el estado
  };

  return (
    <div className="config">
      {/* Header */}
      <header className="config-header">
        <nav className="config-nav">
          <div className="config-nav-brand">
            <div className="config-logo-container">
              <img src={logo} alt="Crazy Lettuces" className="config-logo" />
              <h2>
                <span className="crazy-swash">Crazy</span> Lettuces
              </h2>
            </div>
          </div>
          <ul className="config-nav-menu">
            <li><a href="/">{t('inicio')}</a></li>
            <li><a href="/#productos">{t('productos')}</a></li>
            <li><a href="/nosotros">{t('nosotros')}</a></li>
            <li><a href="#configuracion">{t('configuracion')}</a></li>
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
                  className="config-logout-btn"
                  title="Cerrar Sesión"
                >
                  Cerrar Sesión
                </button>
              </li>
            )}
          </ul>
        </nav>
      </header>

      {/* Contenido de Configuración */}
      <div className="config-container">
        {/* Título */}
        <div className="config-title">
          <h1>{t('configuracion')}</h1>
          <p>Personaliza tu experiencia</p>
        </div>

        <div className="config-options">
          {/* Opción de Tema */}
          <div className="config-option">
            <h3>Cambiar tema</h3>
            <label className="config-toggle">
              <input
                type="checkbox" 
                className="config-toggle-input"
                checked={darkMode}
                onChange={toggleDarkMode}
              />
              <span className="config-toggle-slider"></span>
              <span className="config-toggle-text">
                {darkMode ? t('modoOscuro') : t('modoClaro')}
              </span>
            </label>
          </div>

          {/* Opción de Idioma */}
          <div className="config-option">
            <h3>Cambiar idioma</h3>
            <label className="config-toggle">
              <input 
                type="checkbox" 
                className="config-toggle-input"
                checked={language === 'en'}
                onChange={toggleLanguage}
              />
              <span className="config-toggle-slider"></span>
              <span className="config-toggle-text">
                {language === 'es' ? t('espanol') : t('ingles')}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="config-footer">
        <div className="config-footer-container">
          <div className="config-footer-content">
            <div className="config-footer-section">
              <div className="config-footer-logo-container">
                <img src={logo} alt="Crazy Lettuces" className="config-footer-logo" />
                <h3>
                  <span className="crazy-swash">Crazy</span> Lettuces
                </h3>
              </div>
              <p>{t('footerDescription')}</p>
            </div>
            <div className="config-footer-section">
              <h4>{t('productosFooter')}</h4>
              <ul>
                <li><a href="/#productos">{t('lechugasChile')}</a></li>
                <li><a href="/#productos">{t('lechugasGomitas')}</a></li>
                <li><a href="/#productos">{t('combosLocos')}</a></li>
              </ul>
            </div>
            <div className="config-footer-section">
              <h4>{t('contacto')}</h4>
              <ul>
                <li><i className="fas fa-map-marker-alt"></i> {t('direccion')}</li>
                <li><i className="fas fa-phone"></i> {t('telefono')}</li>
                <li><i className="fas fa-envelope"></i> {t('email')}</li>
              </ul>
            </div>
          </div>
          <div className="config-footer-bottom">
            <p>{t('derechos')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Configuracion;