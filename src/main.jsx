import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ConfigProvider from './context/config';

import Home from './pages/Home';
import HomeAdmin from './pages/Home-Admin';
import Login from './components/login/Login';
import Register from './components/login/Register';
import Nosotros from './components/nosotros/Nosotros';
import Configuracion from './components/config/config';
import ConfigAdmin from './components/config/config-admin';
import Users from './components/users/Users';
import Especial from './components/especiales/Especiales';
import Ordenes from './components/ordenes/Ordenes';
import VerificarCodigo from './components/ordenes/verificar-codigo';
import Productos from './components/productos/Productos';
import Perfil from './components/perfil/Mi-Perfil';
import NotificacionesUser from './components/notificaciones/NotificacionesUser';
import Ingredientes from './components/Ingredientes/Ingredientes';
import Carrito from './components/carrito/Carrito';
import Terminos from './components/carrito/docs/politica-seguridad-pagos.md';

function App() {
    return (
        <ConfigProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path='/login' element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/nosotros" element={<Nosotros />} />
                    <Route path="/configuracion" element={<Configuracion />} />
                    <Route path="/config-admin" element={<ConfigAdmin />} />
                    <Route path="/panel-admin" element={<HomeAdmin />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/especiales" element={<Especial />} />
                    <Route path="/ordenes" element={<Ordenes />} />
                    <Route path="/verificar-codigo" element={<VerificarCodigo />} />
                    <Route path="/productos" element={<Productos />} />
                    <Route path="/perfil" element={<Perfil />} />
                    <Route path="/notificacionesUser" element={<NotificacionesUser />} />
                    <Route path="/ingredientes" element={<Ingredientes />} />
                    <Route path="/carrito" element={<Carrito />} />
                    <Route path="/terminos" element={<Terminos />} />
                </Routes>
            </Router>
        </ConfigProvider>
    );
}

export default App;