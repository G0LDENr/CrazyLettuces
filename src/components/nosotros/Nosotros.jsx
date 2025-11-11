import React from 'react';
import '../../css/nosotros.css';

import logo from '../../img/crazylettuces.png';
import LechugasLogo from '../../img/lechugas.png';
import logolechuga from '../../img/lechugalogo.png';

const Nosotros = () => {
  return (
    <div className="nosotros">
      {/* Header (mismo que el home) */}
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
            <li><a href="/">Inicio</a></li>
            <li><a href="/#productos">Productos</a></li>
            <li><a href="#nosotros">Nosotros</a></li>
          </ul>
        </nav>
      </header>

      {/* Hero Nosotros */}
      <section className="nosotros-hero">
        <div className="container">
          <h1 className="nosotros-title">Sobre <span className="crazy-swash-hero">Crazy</span> Lettuces</h1>
          <p className="nosotros-subtitle">
            Conoce más sobre <span className="crazy-swash-text">Crazy</span> Lettuces y nuestra pasión por crear experiencias únicas
          </p>
        </div>
      </section>

      {/* Misión, Visión y Valores */}
      <section className="mvv-section">
        <div className="container">
          <div className="mvv-grid">
            {/* Misión */}
            <div className="mvv-card mision-card">
              <div className="card-background"></div>
              <div className="card-content">
                <div className="mvv-icon-container">
                  <div className="mvv-icon">
                    <i className="fas fa-bullseye"></i>
                    <img src={logolechuga} alt="Logo Crazy Lettuces" className="icon-logo" />
                  </div>
                </div>
                <h3>Misión</h3>
                <p>
                  Somos una empresa dedicada a la elaboración de <span className="crazy-swash-text">Crazy</span> Lettuces, Lechugas 
                  sembradas, tratadas y cosechadas por los estudiantes de la UTVT, siendo este 
                  un producto natural, saludable y ecologico sin quimicos ni conservadores, 
                  asegurando el consumo saludable de nuestros clientes
                </p>
              </div>
            </div>

            {/* Visión */}
            <div className="mvv-card vision-card">
              <div className="card-background"></div>
              <div className="card-content">
                <div className="mvv-icon-container">
                  <div className="mvv-icon">
                    <i className="fas fa-eye"></i>
                    <img src={logolechuga} alt="Logo Crazy Lettuces" className="icon-logo" />
                  </div>
                </div>
                <h3>Visión</h3>
                <p>
                  Esperamos ser una empresa de Lechugas preparadas para nuestra comunidad 
                  estudiantil, esperando ofrecer sabor y frescura, logrando satisfacer a 
                  nuestros clientes y aumentar nuestras ventas.
                </p>
              </div>
            </div>

            {/* Valores */}
            <div className="mvv-card valores-card">
              <div className="card-background"></div>
              <div className="card-content">
                <div className="mvv-icon-container">
                  <div className="mvv-icon">
                    <i className="fas fa-heart"></i>
                    <img src={logolechuga} alt="Logo Crazy Lettuces" className="icon-logo" />
                  </div>
                </div>
                <h3>Valores</h3>
                <div className="valores-list">
                  <div className="valor-item">
                    <i className="fas fa-star"></i>
                    <span>Calidad</span>
                  </div>
                  <div className="valor-item">
                    <i className="fas fa-lightbulb"></i>
                    <span>Responsabilidad Ambiental</span>
                  </div>
                  <div className="valor-item">
                    <i className="fas fa-laugh"></i>
                    <span>Honestidad</span>
                  </div>
                  <div className="valor-item">
                    <i className="fas fa-users"></i>
                    <span>Compromiso con la salud</span>
                  </div>
                  <div className="valor-item">
                    <i className="fas fa-thumbs-up"></i>
                    <span>Responsabilidad Social</span>
                  </div>
                  <div className="valor-item">
                    <i className="fas fa-handshake"></i>
                    <span>Cuidado con el Cliente</span>
                  </div>
                  <div className="valor-item">
                    <i className="fas fa-seedling"></i>
                    <span>Atencion al Cliente</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resto del código se mantiene igual */}
      {/* Historia */}
      <section className="historia-section">
        <div className="container">
          <div className="historia-content">
            <div className="historia-text">
              <h2>Nuestra Historia</h2>
              <p>
                <span className="crazy-swash-text">Crazy</span> Lettuces nació de la idea de revolucionar el concepto de snacks 
                saludables. Comenzamos con una simple pregunta: ¿por qué no combinar 
                lo fresco de las lechugas con lo divertido de los toppings?
              </p>
              <p>
                Hoy, somos mucho más que una marca de lechugas. Somos creadores de 
                experiencias, artistas del sabor y apasionados por hacer que cada 
                comida sea una aventura memorable.
              </p>
            </div>
            <div className="historia-image">
              <img src={LechugasLogo} alt="Nuestra Historia" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer (mismo que el home) */}
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
                <li><a href="/#productos">Lechugas con Chile</a></li>
                <li><a href="/#productos">Lechugas con Gomitas</a></li>
                <li><a href="/#productos">Combos Locos</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Contacto</h4>
              <ul>
                <li><i className="fas fa-map-marker-alt"></i> Ciudad, Estado</li>
                <li><i className="fas fa-phone"></i> +1 234 567 890</li>
                <li><i className="fas fa-envelope"></i> hola@crazylettuces.com</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 <span className="crazy-swash-text">Crazy</span> Lettuces. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Nosotros;