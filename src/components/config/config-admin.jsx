import React from 'react';
import { useConfig } from '../../context/config';
import '../../css/config-admin.css';

const Configuracion = () => {
  const { language, darkMode, toggleLanguage, toggleDarkMode, t } = useConfig();

  return (
    <div className={`config-admin-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* Contenido de Configuración */}
      <div className="config-admin-content">
        {/* Título */}
        <div className="config-admin-title">
          <h1>{t('configuracion')}</h1>
        </div>

        <div className="config-admin-options">
          {/* Opción de Tema */}
          <div className="config-admin-option">
            <h3>{t('cambiarTema')}</h3>
            <label className="config-admin-toggle">
              <input
                type="checkbox" 
                className="config-admin-toggle-input"
                checked={darkMode}
                onChange={toggleDarkMode}
              />
              <span className="config-admin-toggle-slider"></span>
              <span className="config-admin-toggle-text">
                {darkMode ? t('modoOscuro') : t('modoClaro')}
              </span>
            </label>
          </div>

          {/* Opción de Idioma */}
          <div className="config-admin-option">
            <h3>{t('cambiarIdioma')}</h3>
            <label className="config-admin-toggle">
              <input 
                type="checkbox" 
                className="config-admin-toggle-input"
                checked={language === 'en'}
                onChange={toggleLanguage}
              />
              <span className="config-admin-toggle-slider"></span>
              <span className="config-admin-toggle-text">
                {language === 'es' ? t('espanol') : t('ingles')}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;