import React from 'react';
import '../css/home.css';

import logo from '../img/crazylettuces.png';
import lechuga from '../img/lechugas.png';
import LogoLechuga from '../img/lechugalogo.png';
import facebookLogo from '../img/facebook.png';
import instagramLogo from '../img/instagram.png';
import tik_tokLogo from '../img/tik-tok.png';

const Home = () => {
  return (
    <div className="home">
      {/* Header */}
      <header className="header">
        <nav className="navbar">
          <div className="nav-brand">
            <div className="logo-container">
              <img src={logo} alt="Crazy Lettuces" className="logo" />
              <h2>
                <span className="crazy-swash">Crazy</span> Lettuces
              </h2>
            </div>
          </div>
          <ul className="nav-menu">
            <li><a href="#inicio">Inicio</a></li>
            <li><a href="#productos">Productos</a></li>
            <li><a href="/nosotros">Nosotros</a></li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero" id="inicio">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="crazy-large-swash">Crazy</span>
              <span className="highlight"> Lettuces</span>
            </h1>
            <p className="hero-description">
              Las lechugas más locas y deliciosas con chile, gomitas y mucho sabor. 
              ¡Una experiencia única para tu paladar!
            </p>
          </div>
          <div className="hero-image">
            <div className="image-container">
              <img src={lechuga} alt="Producto Crazy Lettuces" className="product-image" />
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="products" id="productos">
        <div className="container">
          <h2 className="section-title">Nuestros Productos Locos</h2>
          <div className="products-grid">
            
            <div className="product-card">
              <div className="product-image-container">
                <img src={LogoLechuga} alt="Lechugas con Gomitas" className="product-icon-image" />
              </div>
              <h3>🥗Combo Fresh</h3>
              <p>Lechuga crujiente con limón y sal. Simple, ligera y deliciosa.🥬✨</p>
            </div>
            
            <div className="product-card">
              <div className="product-image-container">
                <img src={LogoLechuga} alt="Combo Loco" className="product-icon-image" />
              </div>
              <h3>🌶️Crazy Spicy</h3>
              <p>Chamoy, chile Miguelito y limón sobre lechugas frescas.¡Un toque loco y picante!🔥😋</p>
            </div>

            <div className="product-card">
              <div className="product-image-container">
                <img src={LogoLechuga} alt="Especial Crazy" className="product-icon-image" />
              </div>
              <h3>😵‍💫Combo Loco</h3>
              <p>Lechuga con gomitas, cacahuates y topping al gusto.!El sabor mas divertido!🍬🥜</p>
            </div>
          </div>
        </div>
      </section>

      {/* Find Us Section */}
      <section className="find-us">
        <div className="container">
          <div className="find-us-content">
            <h2>Encuéntranos</h2>
            <p>Síguenos en nuestras redes sociales para conocer promociones y nuevos productos</p>
            <div className="social-icons">
              <a 
                href="https://www.facebook.com/share/1BUz4PdFw8/" 
                className="social-link"
                target="_blank" 
                rel="noopener noreferrer"
              >
                <img src={facebookLogo} alt="Facebook" className="social-logo" />
              </a>
              <a 
                href="https://www.instagram.com/crazy_lettuces?igsh=MW1oZDloZ3I0cDg2MQ==" 
                className="social-link"
                target="_blank" 
                rel="noopener noreferrer"
              >
                <img src={instagramLogo} alt="Instagram" className="social-logo" />
              </a>
              <a 
                href="https://www.tiktok.com/@crazy.lettuce8?_r=1&_t=ZS-91InvRY4cKt" 
                className="social-link"
                target="_blank" 
                rel="noopener noreferrer"
              >
                <img src={tik_tokLogo} alt="TikTok" className="social-logo" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="logo-container">
                <img src={logo} alt="Crazy Lettuces" className="logo" />
                <h3>
                  <span className="crazy-swash">Crazy</span> Lettuces
                </h3>
              </div>
              <p>Las lechugas más locas y deliciosas de la ciudad.</p>
            </div>
            <div className="footer-section">
              <h4>Productos</h4>
              <ul>
                <li><a href="#productos">Lechugas con Chile</a></li>
                <li><a href="#productos">Lechugas con Gomitas</a></li>
                <li><a href="#productos">Combos Locos</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Contacto</h4>
              <ul>
                <li><i className="fas fa-map-marker-alt"></i> Mexico, Ciudad de Mexico</li>
                <li><i className="fas fa-phone"></i> +52 5538986602</li>
                <li><i className="fas fa-envelope"></i> crazylettuces@gmail.com</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Crazy Lettuces. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;