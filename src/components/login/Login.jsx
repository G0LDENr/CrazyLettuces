import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faGlobe, faSun, faMoon, faArrowLeft, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { IoNotificationsCircle } from "react-icons/io5";
import Logo from "../../img/crazylettuces.png";
import '../../css/login.css';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [language, setLanguage] = useState('es');
    const [darkMode, setDarkMode] = useState(false);

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

    // Efecto para aplicar el modo oscuro al body de manera consistente
    useEffect(() => {
        const body = document.body;
        if (darkMode) {
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
        }
        
        // Cleanup function para evitar memory leaks
        return () => {
            body.classList.remove('dark-mode');
        };
    }, [darkMode]);

    // También verificar el estado inicial del modo oscuro
    useEffect(() => {
        // Verificar si hay una preferencia guardada en localStorage
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode) {
            setDarkMode(JSON.parse(savedDarkMode));
        }
    }, []);

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        // Guardar preferencia en localStorage
        localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
    };

    // Textos según el idioma
    const texts = {
        es: {
            title: "Iniciar Sesión",
            email: "Correo electrónico",
            emailPlaceholder: "correo@example.com",
            password: "Contraseña",
            passwordPlaceholder: "••••••••",
            forgotPassword: "¿Olvidaste tu contraseña?",
            loginButton: "Ingresar",
            loading: "Procesando...",
            noAccount: "¿No tienes cuenta?",
            register: "Regístrate aquí",
            brandTagline: "No es antojo... es una experiencia..",
            errorComplete: "Por favor, completa todos los campos",
            errorCredentials: "Credenciales incorrectas",
            errorConnection: "Error de conexión con el servidor",
            errorUserData: "Error: Datos de usuario incompletos",
            close: "Cerrar",
            darkMode: "Modo oscuro",
            lightMode: "Modo claro",
            back: "Regresar",
            logout: "Cerrar Sesión",
            myProfile: "Mi Perfil"
        },
        en: {
            title: "Login",
            email: "Email",
            emailPlaceholder: "email@example.com",
            password: "Password",
            passwordPlaceholder: "••••••••",
            forgotPassword: "Forgot your password?",
            loginButton: "Sign In",
            loading: "Processing...",
            noAccount: "Don't have an account?",
            register: "Register here",
            brandTagline: "It's not a craving... it's an experience.",
            errorComplete: "Please complete all fields",
            errorCredentials: "Incorrect credentials",
            errorConnection: "Server connection error",
            errorUserData: "Error: Incomplete user data",
            close: "Close",
            darkMode: "Dark mode",
            lightMode: "Light mode",
            back: "Back",
            logout: "Logout",
            myProfile: "My Profile"
        }
    };

    const t = texts[language];

    const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email || !password) {
        setError(t.errorComplete);
        setLoading(false);
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:5000/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        console.log('🔍 RESPONSE DATA:', data); // VER ESTO
        console.log('🔍 USER DATA:', data.user); // VER ESTO
        console.log('🔍 USER HAS NOMBRE?', data.user?.nombre); // VER ESTO
        console.log('🔍 USER HAS TELEFONO?', data.user?.telefono); // VER ESTO

        if (response.ok) {
            localStorage.setItem('token', data.access_token);
            
            // Debug: Ver qué se está guardando
            console.log('💾 Guardando en localStorage:');
            console.log('Token:', data.access_token);
            console.log('User completo:', data.user);
            
            // Guardar en localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('userData', JSON.stringify(data.user));
            
            // Verificar que se guardó correctamente
            console.log('✅ Verificando localStorage:');
            console.log('Token guardado:', localStorage.getItem('token'));
            console.log('User guardado:', localStorage.getItem('user'));
            console.log('UserData guardado:', localStorage.getItem('userData'));
            
            // Redirigir según rol
            if (data.user && data.user.rol !== undefined) {
                redirectByRole(data.user.rol);
            } else {
                navigate('/home');
            }
        } else {
            setError(data.msg || t.errorCredentials);
        }
    } catch (err) {
        console.error('Error en login:', err);
        setError(t.errorConnection);
    } finally {
        setLoading(false);
    }
};

    const redirectByRole = (role) => {
        console.log('Redirecting by role:', role); // Debug
        switch(role) {
            case 1:
                navigate('/panel-admin');
                break;
            case 2:
                navigate('/home');
                break;
            default:
                navigate('/login');
        }
    };

    const handleRegister = () => {
        navigate('/register');
    };

    const handleForgotPassword = () => {
        console.log("Funcionalidad de recuperación de contraseña");
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleLanguage = () => {
        setLanguage(prevLang => prevLang === 'es' ? 'en' : 'es');
    };

    const handleBack = () => {
        navigate('/');
    };

    return (
        <div className={`login-wrapper ${darkMode ? 'dark-mode' : ''}`}>
            {/* Botones de la derecha: Icono de perfil y Cerrar sesión */}
            <div className="right-buttons-container">
                {/* Botón de regresar - DERECHA */}
                <div className="back-button-container">
                    <button 
                        type="button" 
                        className="back-button"
                        onClick={handleBack}
                        title={t.back}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        <span>{t.back}</span>
                    </button>
                </div>

                {/* Icono de perfil SIEMPRE visible - DERECHA */}
                <div className="profile-icon-container">
                    <button 
                        type="button" 
                        className="profile-icon-button"
                        onClick={() => navigate('/perfil')}
                        title={t.myProfile}
                    >
                        <FontAwesomeIcon icon={faUserCircle} size="2x" />
                    </button>
                </div>

                <div className="profile-icon-container">
                    <button 
                        type="button" 
                        className="profile-icon-button"
                        onClick={() => navigate('/notificacionesUser')}
                        title={t.myProfile}
                    >
                        <IoNotificationsCircle className="profile-icon" />
                    </button>
                </div>

                {/* Botón de cerrar sesión - Solo visible si está autenticado - DERECHA */}
                {isAuthenticated && (
                    <div className="logout-button-container">
                        <button 
                            type="button" 
                            className="logout-button"
                            onClick={handleLogout}
                            title={t.logout}
                        >
                            <span>{t.logout}</span>
                        </button>
                    </div>
                )}

                {/* Botón de cambio de idioma - DERECHA */}
                <div className="language-switcher">
                    <button 
                        type="button" 
                        className="language-button"
                        onClick={toggleLanguage}
                        title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
                    >
                        <FontAwesomeIcon icon={faGlobe} />
                        <span className="language-code">
                            {language === 'es' ? 'ES' : 'EN'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Botón de modo oscuro/claro - IZQUIERDA */}
            <div className="theme-switcher">
                <button 
                    type="button" 
                    className="theme-button"
                    onClick={toggleDarkMode}
                    title={darkMode ? t.lightMode : t.darkMode}
                >
                    <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
                </button>
            </div>

            <div className="login-container">
                <div className="login-brand-section">
                    <div className="logo-container">
                        <img src={Logo} alt="Crazy Lettuces Logo" className="logo-image"/>
                    </div>
                    <h1 className="brand-name">
                        <span className="brand-crazy">Crazy</span>
                        <span className="brand-lettuces"> Lettuces</span>
                    </h1>
                    <p className="brand-tagline">{t.brandTagline}</p>
                </div>
                
                <div className="login-form-section">
                    <h2 className="form-title">{t.title}</h2>
                    
                    {error && (
                        <div className="login-error-message">
                            {error}
                            <button 
                                type="button" 
                                className="retry-button"
                                onClick={() => setError('')}
                                style={{
                                    marginLeft: '10px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'inherit',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                {t.close}
                            </button>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">{t.email}</label>
                            <input
                                id="email"
                                type="email"
                                className="form-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t.emailPlaceholder}
                                required
                                disabled={loading}
                                autoComplete="email"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="password">{t.password}</label>
                            <div className="password-input-container">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className="form-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t.passwordPlaceholder}
                                    required
                                    disabled={loading}
                                    autoComplete="current-password"
                                />
                                <button 
                                    type="button" 
                                    className="password-toggle"
                                    onClick={togglePasswordVisibility}
                                    disabled={loading}
                                >
                                    <FontAwesomeIcon 
                                        icon={showPassword ? faEyeSlash : faEye} 
                                        size="sm" 
                                    />
                                </button>
                            </div>
                        </div>

                        <div className="forgot-password-link">
                            <span 
                                onClick={handleForgotPassword}
                                style={{cursor: 'pointer', color: '#007bff'}}
                            >
                                {t.forgotPassword}
                            </span>
                        </div>
                        
                        <div className="login-button-container">
                            <button 
                                type="submit" 
                                className={`login-button ${loading ? 'loading' : ''}`}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="button-spinner"></span>
                                        {t.loading}
                                    </>
                                ) : t.loginButton}
                            </button>
                        </div>
                    </form>
                    
                    <div className="form-footer">
                        <p>
                            {t.noAccount}{' '}
                            <span 
                                className="register-link" 
                                onClick={handleRegister}
                                style={{cursor: 'pointer', color: '#007bff', textDecoration: 'underline'}}
                            >
                                {t.register}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;