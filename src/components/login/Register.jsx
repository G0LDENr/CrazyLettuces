import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faGlobe, faSun, faMoon, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Logo from "../../img/crazylettuces.png";
import '../../css/register.css';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        gender: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [language, setLanguage] = useState('es');
    const [darkMode, setDarkMode] = useState(false);

    // Efecto para aplicar el modo oscuro al body
    useEffect(() => {
        const body = document.body;
        if (darkMode) {
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
        }
        
        return () => {
            body.classList.remove('dark-mode');
        };
    }, [darkMode]);

    // Verificar estado inicial del modo oscuro
    useEffect(() => {
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode) {
            setDarkMode(JSON.parse(savedDarkMode));
        }
    }, []);

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
    };

    // Textos según el idioma
    const texts = {
        es: {
            title: "Crear Cuenta",
            name: "Nombre completo",
            namePlaceholder: "Tu nombre completo",
            email: "Correo electrónico",
            emailPlaceholder: "correo@example.com",
            password: "Contraseña",
            passwordPlaceholder: "••••••••",
            confirmPassword: "Confirmar contraseña",
            confirmPasswordPlaceholder: "••••••••",
            phone: "Teléfono",
            phonePlaceholder: "1234567890",
            gender: "Género",
            genderOptions: {
                select: "Seleccionar género",
                M: "Masculino",
                F: "Femenino",
            },
            registerButton: "Registrarse",
            loading: "Creando cuenta...",
            haveAccount: "¿Ya tienes cuenta?",
            login: "Inicia sesión aquí",
            brandTagline: "No es antojo... es una experiencia..",
            errorComplete: "Por favor, completa todos los campos obligatorios",
            errorPasswordMatch: "Las contraseñas no coinciden",
            errorConnection: "Error de conexión con el servidor",
            errorEmailExists: "El correo electrónico ya está en uso",
            close: "Cerrar",
            darkMode: "Modo oscuro",
            lightMode: "Modo claro",
            back: "Regresar"
        },
        en: {
            title: "Create Account",
            name: "Full name",
            namePlaceholder: "Your full name",
            email: "Email",
            emailPlaceholder: "email@example.com",
            password: "Password",
            passwordPlaceholder: "••••••••",
            confirmPassword: "Confirm password",
            confirmPasswordPlaceholder: "••••••••",
            phone: "Phone",
            phonePlaceholder: "1234567890",
            gender: "Gender",
            genderOptions: {
                select: "Select gender",
                M: "Male",
                F: "Female",
            },
            registerButton: "Sign Up",
            loading: "Creating account...",
            haveAccount: "Already have an account?",
            login: "Login here",
            brandTagline: "It's not a craving... it's an experience.",
            errorComplete: "Please complete all required fields",
            errorPasswordMatch: "Passwords do not match",
            errorConnection: "Server connection error",
            errorEmailExists: "Email already in use",
            close: "Close",
            darkMode: "Dark mode",
            lightMode: "Light mode",
            back: "Back"
        }
    };

    const t = texts[language];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validaciones
        if (!formData.name || !formData.email || !formData.password) {
            setError(t.errorComplete);
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError(t.errorPasswordMatch);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/user/add_user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    telefono: formData.phone,
                    sexo: formData.gender
                }),
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                // Registro exitoso, redirigir al login
                navigate('/login', { 
                    state: { 
                        message: 'Cuenta creada exitosamente. Por favor inicia sesión.' 
                    } 
                });
            } else {
                setError(data.msg || t.errorConnection);
            }
        } catch (err) {
            console.error('Error en registro:', err);
            setError(t.errorConnection);
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const toggleLanguage = () => {
        setLanguage(prevLang => prevLang === 'es' ? 'en' : 'es');
    };

    const handleBack = () => {
        navigate('/');
    };

    const handleLogin = () => {
        navigate('/login');
    };

    return (
        <div className={`register-wrapper ${darkMode ? 'dark-mode' : ''}`}>
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

            {/* Botones de la derecha: Regresar e Idioma */}
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

            <div className="register-container">
                <div className="register-brand-section">
                    <div className="logo-container">
                        <img src={Logo} alt="Crazy Lettuces Logo" className="logo-image"/>
                    </div>
                    <h1 className="brand-name">
                        <span className="brand-crazy">Crazy</span>
                        <span className="brand-lettuces"> Lettuces</span>
                    </h1>
                    <p className="brand-tagline">{t.brandTagline}</p>
                </div>
                
                <div className="register-form-section">
                    <h2 className="form-title">{t.title}</h2>
                    
                    {error && (
                        <div className="register-error-message">
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
                    
                    <form onSubmit={handleSubmit} className="register-form">
                        <div className="form-group">
                            <label htmlFor="name">{t.name} *</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                className="form-input"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder={t.namePlaceholder}
                                required
                                disabled={loading}
                                autoComplete="name"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="email">{t.email} *</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="form-input"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder={t.emailPlaceholder}
                                required
                                disabled={loading}
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">{t.phone}</label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                className="form-input"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder={t.phonePlaceholder}
                                disabled={loading}
                                autoComplete="tel"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="gender">{t.gender}</label>
                            <select
                                id="gender"
                                name="gender"
                                className="form-input"
                                value={formData.gender}
                                onChange={handleInputChange}
                                disabled={loading}
                            >
                                <option value="">{t.genderOptions.select}</option>
                                <option value="M">{t.genderOptions.M}</option>
                                <option value="F">{t.genderOptions.F}</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="password">{t.password} *</label>
                            <div className="password-input-container">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    className="form-input"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder={t.passwordPlaceholder}
                                    required
                                    disabled={loading}
                                    autoComplete="new-password"
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

                        <div className="form-group">
                            <label htmlFor="confirmPassword">{t.confirmPassword} *</label>
                            <div className="password-input-container">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="form-input"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder={t.confirmPasswordPlaceholder}
                                    required
                                    disabled={loading}
                                    autoComplete="new-password"
                                />
                                <button 
                                    type="button" 
                                    className="password-toggle"
                                    onClick={toggleConfirmPasswordVisibility}
                                    disabled={loading}
                                >
                                    <FontAwesomeIcon 
                                        icon={showConfirmPassword ? faEyeSlash : faEye} 
                                        size="sm" 
                                    />
                                </button>
                            </div>
                        </div>
                        
                        <div className="register-button-container">
                            <button 
                                type="submit" 
                                className={`register-button ${loading ? 'loading' : ''}`}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="button-spinner"></span>
                                        {t.loading}
                                    </>
                                ) : t.registerButton}
                            </button>
                        </div>
                    </form>
                    
                    <div className="form-footer">
                        <p>
                            {t.haveAccount}{' '}
                            <span 
                                className="login-link" 
                                onClick={handleLogin}
                                style={{cursor: 'pointer', color: '#007bff', textDecoration: 'underline'}}
                            >
                                {t.login}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;