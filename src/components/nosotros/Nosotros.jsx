import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../../context/config';
import { HiMiniUserCircle } from "react-icons/hi2";
import { IoNotificationsCircle } from "react-icons/io5";
import '../../css/nosotros.css';

import logo from '../../img/crazylettuces.png';
import LechugasLogo from '../../img/lechugas.png';
import logolechuga from '../../img/lechugalogo.png';

const Nosotros = () => {
  const { t } = useConfig();
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
    <div className="nosotros">
      {/* Header */}
      <header className="nosotros-header">
        <nav className="nosotros-nav">
          <div className="nosotros-nav-brand">
            <div className="nosotros-logo-container">
              <img src={logo} alt="Crazy Lettuces" className="nosotros-logo" />
              <h2>
                <span className="nosotros-crazy-swash">Crazy</span> Lettuces
              </h2>
            </div>
          </div>
          <ul className="nosotros-nav-menu">
            <li><a href="/">{t('inicio')}</a></li>
            <li><a href="/productos">{t('productos')}</a></li>
            <li><a href="#nosotros">{t('nosotros')}</a></li>
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
                  className="nosotros-logout-btn"
                  title="Cerrar Sesión"
                >
                  Cerrar Sesión
                </button>
              </li>
            )}
          </ul>
        </nav>
      </header>

      {/* Hero Nosotros */}
      <section className="nosotros-hero">
        <div className="nosotros-container">
          <h1 className="nosotros-title"> <span className="nosotros-crazy-swash-hero">Crazy</span> Lettuces</h1>
          <p className="nosotros-subtitle">
           <span className="nosotros-crazy-swash-text">Crazy</span> Lettuces {t('yNuestraPasion')}
          </p>
        </div>
      </section>

      {/* Misión, Visión y Valores */}
      <section className="nosotros-mvv-section">
        <div className="nosotros-container">
          <div className="nosotros-mvv-grid">

            {/* Misión */}
            <div className="nosotros-mvv-card nosotros-mision-card">
              <div className="nosotros-card-background"></div>
              <div className="nosotros-card-content">
                <div className="nosotros-mvv-icon-container">
                  <div className="nosotros-mvv-icon">
                    <i className="fas fa-bullseye"></i>
                    <img src={logolechuga} alt="Logo Crazy Lettuces" className="nosotros-icon-logo" />
                  </div>
                </div>
                <h3>{t('mision')}</h3>
                <p>
                  {t('misionTexto')}
                </p>
              </div>
            </div>

            {/* Visión */}
            <div className="nosotros-mvv-card nosotros-vision-card">
              <div className="nosotros-card-background"></div>
              <div className="nosotros-card-content">
                <div className="nosotros-mvv-icon-container">
                  <div className="nosotros-mvv-icon">
                    <i className="fas fa-eye"></i>
                    <img src={logolechuga} alt="Logo Crazy Lettuces" className="nosotros-icon-logo" />
                  </div>
                </div>
                <h3>{t('vision')}</h3>
                <p>
                  {t('visionTexto')}
                </p>
              </div>
            </div>

            {/* Valores */}
            <div className="nosotros-mvv-card nosotros-valores-card">
              <div className="nosotros-card-background"></div>
              <div className="nosotros-card-content">
                <div className="nosotros-mvv-icon-container">
                  <div className="nosotros-mvv-icon">
                    <i className="fas fa-heart"></i>
                    <img src={logolechuga} alt="Logo Crazy Lettuces" className="nosotros-icon-logo" />
                  </div>
                </div>
                <h3>{t('valores')}</h3>
                <div className="nosotros-valores-list">
                  <div className="nosotros-valor-item">
                    <i className="fas fa-star"></i>
                    <span>{t('calidad')}</span>
                  </div>
                  <div className="nosotros-valor-item">
                    <i className="fas fa-lightbulb"></i>
                    <span>{t('responsabilidadAmbiental')}</span>
                  </div>
                  <div className="nosotros-valor-item">
                    <i className="fas fa-laugh"></i>
                    <span>{t('honestidad')}</span>
                  </div>
                  <div className="nosotros-valor-item">
                    <i className="fas fa-users"></i>
                    <span>{t('compromisoSalud')}</span>
                  </div>
                  <div className="nosotros-valor-item">
                    <i className="fas fa-thumbs-up"></i>
                    <span>{t('responsabilidadSocial')}</span>
                  </div>
                  <div className="nosotros-valor-item">
                    <i className="fas fa-handshake"></i>
                    <span>{t('cuidadoCliente')}</span>
                  </div>
                  <div className="nosotros-valor-item">
                    <i className="fas fa-seedling"></i>
                    <span>{t('atencionCliente')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metas */}
            <div className="nosotros-mvv-card nosotros-metas-card">
              <div className="nosotros-card-background"></div>
              <div className="nosotros-card-content">
                <div className="nosotros-mvv-icon-container">
                  <div className="nosotros-mvv-icon">
                    <i className="fas fa-eye"></i>
                    <img src={logolechuga} alt="Logo Crazy Lettuces" className="nosotros-icon-logo" />
                  </div>
                </div>
                <h3>{t('metas')}</h3>
                <p>
                  {t('metasTexto')}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Historia */}
      <section className="nosotros-historia-section">
        <div className="nosotros-container">
          <div className="nosotros-historia-content">
            <div className="nosotros-historia-text">
              <h2>{t('nuestraHistoria')}</h2>
              <p>
                <span className="nosotros-crazy-swash-text"></span>{t('historiaTexto1')}
              </p>
              <p>
                {t('historiaTexto2')}
              </p>
            </div>
            <div className="nosotros-historia-image">
              <img src={LechugasLogo} alt="Nuestra Historia" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="nosotros-footer">
        <div className="nosotros-container">
          <div className="nosotros-footer-content">
            <div className="nosotros-footer-section">
              <div className="nosotros-footer-logo-container">
                <img src={logo} alt="Crazy Lettuces" className="nosotros-footer-logo" />
                <h3>
                  <span className="nosotros-crazy-swash">Crazy</span> Lettuces
                </h3>
              </div>
              <p>{t('footerDescription')}</p>
            </div>
            <div className="nosotros-footer-section">
              <h4>{t('productosFooter')}</h4>
              <ul>
                <li><a href="/#productos">{t('lechugasChile')}</a></li>
                <li><a href="/#productos">{t('lechugasGomitas')}</a></li>
                <li><a href="/#productos">{t('combosLocos')}</a></li>
              </ul>
            </div>
            <div className="nosotros-footer-section">
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
          <div className="nosotros-footer-bottom">
            <p>{t('derechos')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Nosotros;