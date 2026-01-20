import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Configuracion from '../components/config/config-admin';
import Users from '../components/users/Users';
import Especial from '../components/especiales/Especiales';
import Ordenes from '../components/ordenes/Ordenes';
import Notificaciones from '../components/notificaciones/Notificaciones';

import { FaBars, FaTimes, FaCog, FaUsers } from 'react-icons/fa';
import { FaBowlFood } from 'react-icons/fa6';
import { HiClipboardList } from "react-icons/hi";
import { MdNotificationsActive } from "react-icons/md";

import { ConfigProvider, useConfig } from '../context/config';
import '../css/home-admin.css';

// Componente Main principal envuelto con el contexto
const HomeAdmin = () => {
  return (
    <ConfigProvider>
      <Main />
    </ConfigProvider>
  );
};

// Componente Main actual que usa el contexto
const Main = () => {
  const navigate = useNavigate();
  const { t, darkMode } = useConfig();
  const [userData, setUserData] = useState(null);
  const [activeContent, setActiveContent] = useState(null);
  const [activeContentType, setActiveContentType] = useState(null); // Nuevo estado para rastrear el tipo
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    console.log('User data from localStorage:', user);
    setUserData(user);
  }, [navigate]);

  const loadContent = (contentType) => {
    setActiveContentType(contentType); // Guardar el tipo de contenido
    
    switch(contentType) {

      case 'users':
        setActiveContent(<Users />);
        break;
        
      case 'configuracion':
        setActiveContent(<Configuracion />);
        break;

      case 'especiales':
        setActiveContent(<Especial />);
        break;

      case 'ordenes':
        setActiveContent(<Ordenes />);
        break;

      case 'notificaciones':
        setActiveContent(<Notificaciones />);
        break;

      default:
        setActiveContent(null);
        setActiveContentType(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={`dashboard-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* Botón para abrir/cerrar el menú lateral */}
      <button 
        className={`sidebar-toggle ${sidebarOpen ? 'open' : ''}`}
        onClick={toggleSidebar}
      >
        {sidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Menú lateral */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'} ${darkMode ? 'dark-mode' : ''}`}>
        <div className="sidebar-header">
          <div className="user-info">
            <h1>
              <span className="crazy-cursive">Crazy</span> Lettuces
            </h1>
            <h2 className="user-name">{userData?.nombre || userData?.name || t('user')}</h2>
            <p className="user-email">{userData?.correo || userData?.email || ''}</p>
            <span className="user-role">
              {userData?.rol === 1 ? t('administrator') : t('user')}
            </span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {/* Botón de Users - CORREGIDO */}
          <button 
            className={`nav-btn ${activeContentType === 'users' ? 'active' : ''}`}
            onClick={() => loadContent('users')}
          >
            <FaUsers className="nav-icon" />
            {t('users')} {/* Cambié 'Users' por 'users' para que coincida con las traducciones */}
          </button>

          <button 
            className={`nav-btn ${activeContentType === 'especiales' ? 'active' : ''}`}
            onClick={() => loadContent('especiales')}
          >
            <FaBowlFood className="nav-icon" />
            {t('specials')}
          </button>

          <button 
            className={`nav-btn ${activeContentType === 'ordenes' ? 'active' : ''}`}
            onClick={() => loadContent('ordenes')}
          >
            <HiClipboardList className="nav-icon" />
            {t('orders')}
          </button>

          <button 
            className={`nav-btn ${activeContentType === 'notificaciones' ? 'active' : ''}`}
            onClick={() => loadContent('notificaciones')}
          >
            <MdNotificationsActive className="nav-icon" />
            {t('notifications')}
          </button>

          <button 
            className={`nav-btn ${activeContentType === 'configuracion' ? 'active' : ''}`}
            onClick={() => loadContent('configuracion')}
          >
            <FaCog className="nav-icon" />
            {t('settings')}
          </button>

          <button 
            className="nav-btn"
            onClick={handleLogout}
          >
            {t('logout')}
          </button>
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="content-wrapper">
          <div className="header-section">
            <h2 className="section-title">
              <span className="crazy-cursive">Crazy</span> Lettuces
            </h2>
            
            <button 
              className="logout-btn-header" 
              onClick={handleLogout}
            >
              {t('logout')}
            </button>
          </div>
          
          <div className="dynamic-content">
            {activeContent || (
              <div className="welcome-message">
                <h3>{t('welcomeAdmin')}</h3>
                <p>{t('selectOption')}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomeAdmin;