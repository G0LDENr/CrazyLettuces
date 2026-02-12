import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, faEyeSlash, faGlobe, faSun, faMoon, 
  faArrowLeft, faUserCircle, faPlus, faTrash,
  faChevronLeft, faChevronRight, faHome, faBriefcase, faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';
import { IoNotificationsCircle } from "react-icons/io5";
import Logo from "../../img/crazylettuces.png";
import '../../css/register.css';

const Register = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1); // 1: Información personal, 2: Direcciones
    const [formData, setFormData] = useState({
        // Paso 1: Información personal
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        gender: '',
        // Paso 2: Direcciones
        direcciones: [
            {
                calle: '',
                numero_exterior: '',
                numero_interior: '',
                colonia: '',
                ciudad: '',
                estado: '',
                codigo_postal: '',
                referencias: '',
                tipo: 'casa',
                predeterminada: true
            }
        ]
    });
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [language, setLanguage] = useState('es');
    const [darkMode, setDarkMode] = useState(false);

    // Verificar si el usuario está autenticado
    const isAuthenticated = localStorage.getItem('token') !== null;

    // Función para cerrar sesión
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userData');
        navigate('/');
        window.location.reload();
    };

    // Efecto para aplicar el modo oscuro
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
            // Títulos de pasos
            step1: "Información Personal",
            step2: "Direcciones de Entrega",
            
            // Información personal
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
            gender: "Sexo",
            genderOptions: {
                select: "Seleccionar Sexo",
                M: "Masculino",
                F: "Femenino",
            },
            
            // Direcciones
            direccionTitle: "Dirección de Entrega",
            calle: "Calle",
            callePlaceholder: "Nombre de la calle",
            numeroExterior: "Número Exterior",
            numeroExteriorPlaceholder: "123",
            numeroInterior: "Número Interior",
            numeroInteriorPlaceholder: "A",
            colonia: "Colonia",
            coloniaPlaceholder: "Nombre de la colonia",
            ciudad: "Ciudad",
            ciudadPlaceholder: "Nombre de la ciudad",
            estado: "Estado",
            estadoPlaceholder: "Nombre del estado",
            codigoPostal: "Código Postal",
            codigoPostalPlaceholder: "12345",
            referencias: "Referencias adicionales",
            referenciasPlaceholder: "Entre calles, puntos de referencia, etc.",
            tipoDireccion: "Tipo de dirección",
            tipoOptions: {
                casa: "Casa",
                trabajo: "Trabajo",
                otro: "Otro"
            },
            predeterminada: "Dirección predeterminada",
            agregarDireccion: "Agregar otra dirección",
            eliminarDireccion: "Eliminar dirección",
            seleccionarPredeterminada: "Marcar como predeterminada",
            
            // Botones de navegación
            siguiente: "Siguiente",
            anterior: "Anterior",
            registrar: "Registrarse",
            loading: "Creando cuenta...",
            
            // Otros textos
            haveAccount: "¿Ya tienes cuenta?",
            login: "Inicia sesión aquí",
            brandTagline: "No es antojo... es una experiencia..",
            errorComplete: "Por favor, completa todos los campos obligatorios",
            errorPasswordMatch: "Las contraseñas no coinciden",
            errorConnection: "Error de conexión con el servidor",
            errorEmailExists: "El correo electrónico ya está en uso",
            errorDireccionComplete: "Completa al menos una dirección completa",
            errorCP: "El código postal debe tener 5 dígitos",
            close: "Cerrar",
            darkMode: "Modo oscuro",
            lightMode: "Modo claro",
            back: "Regresar",
            logout: "Cerrar Sesión",
            myProfile: "Mi Perfil",
            pasoDe: "Paso"
        },
        en: {
            // Step titles
            step1: "Personal Information",
            step2: "Delivery Addresses",
            
            // Personal information
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
            gender: "Sex",
            genderOptions: {
                select: "Select sex",
                M: "Male",
                F: "Female",
            },
            
            // Addresses
            direccionTitle: "Delivery Address",
            calle: "Street",
            callePlaceholder: "Street name",
            numeroExterior: "Exterior Number",
            numeroExteriorPlaceholder: "123",
            numeroInterior: "Interior Number (optional)",
            numeroInteriorPlaceholder: "A",
            colonia: "Neighborhood",
            coloniaPlaceholder: "Neighborhood name",
            ciudad: "City",
            ciudadPlaceholder: "City name",
            estado: "State",
            estadoPlaceholder: "State name",
            codigoPostal: "Postal Code",
            codigoPostalPlaceholder: "12345",
            referencias: "Additional references",
            referenciasPlaceholder: "Between streets, landmarks, etc.",
            tipoDireccion: "Address type",
            tipoOptions: {
                casa: "Home",
                trabajo: "Work",
                otro: "Other"
            },
            predeterminada: "Default address",
            agregarDireccion: "Add another address",
            eliminarDireccion: "Remove address",
            seleccionarPredeterminada: "Set as default",
            
            // Navigation buttons
            siguiente: "Next",
            anterior: "Previous",
            registrar: "Sign Up",
            loading: "Creating account...",
            
            // Other texts
            haveAccount: "Already have an account?",
            login: "Login here",
            brandTagline: "It's not a craving... it's an experience.",
            errorComplete: "Please complete all required fields",
            errorPasswordMatch: "Passwords do not match",
            errorConnection: "Server connection error",
            errorEmailExists: "Email already in use",
            errorDireccionComplete: "Complete at least one full address",
            errorCP: "Postal code must have 5 digits",
            close: "Close",
            darkMode: "Dark mode",
            lightMode: "Light mode",
            back: "Back",
            logout: "Logout",
            myProfile: "My Profile",
            pasoDe: "Step"
        }
    };

    const t = texts[language];

    // Manejar cambios en los campos del formulario
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Manejar cambios en las direcciones
    const handleDireccionChange = (index, field, value) => {
        const updatedDirecciones = [...formData.direcciones];
        updatedDirecciones[index][field] = value;
        
        // Si se marca como predeterminada, desmarcar las otras
        if (field === 'predeterminada' && value === true) {
            updatedDirecciones.forEach((dir, i) => {
                if (i !== index) dir.predeterminada = false;
            });
        }
        
        setFormData(prev => ({
            ...prev,
            direcciones: updatedDirecciones
        }));
    };

    // Agregar nueva dirección
    const handleAddDireccion = () => {
        setFormData(prev => ({
            ...prev,
            direcciones: [
                ...prev.direcciones,
                {
                    calle: '',
                    numero_exterior: '',
                    numero_interior: '',
                    colonia: '',
                    ciudad: '',
                    estado: '',
                    codigo_postal: '',
                    referencias: '',
                    tipo: 'casa',
                    predeterminada: false
                }
            ]
        }));
    };

    // Eliminar dirección
    const handleRemoveDireccion = (index) => {
        if (formData.direcciones.length > 1) {
            const updatedDirecciones = formData.direcciones.filter((_, i) => i !== index);
            
            // Si se eliminó la dirección predeterminada, marcar la primera como predeterminada
            const removedWasPredeterminada = formData.direcciones[index].predeterminada;
            if (removedWasPredeterminada && updatedDirecciones.length > 0) {
                updatedDirecciones[0].predeterminada = true;
            }
            
            setFormData(prev => ({
                ...prev,
                direcciones: updatedDirecciones
            }));
        }
    };

    // Validar paso 1
    const validateStep1 = () => {
        if (!formData.name || !formData.email || !formData.password) {
            setError(t.errorComplete);
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError(t.errorPasswordMatch);
            return false;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError("Por favor ingresa un correo electrónico válido");
            return false;
        }

        return true;
    };

    // Validar paso 2
    const validateStep2 = () => {
        // Verificar que al menos una dirección tenga los campos obligatorios completos
        const direccionCompleta = formData.direcciones.some(dir => 
            dir.calle && 
            dir.numero_exterior && 
            dir.colonia && 
            dir.ciudad && 
            dir.estado && 
            dir.codigo_postal
        );

        if (!direccionCompleta) {
            setError(t.errorDireccionComplete);
            return false;
        }

        // Validar que todos los códigos postales tengan 5 dígitos
        for (const dir of formData.direcciones) {
            if (dir.codigo_postal && !/^\d{5}$/.test(dir.codigo_postal)) {
                setError(t.errorCP);
                return false;
            }
        }

        return true;
    };

    // Navegar al siguiente paso
    const handleNextStep = () => {
        if (currentStep === 1) {
            if (validateStep1()) {
                setError('');
                setCurrentStep(2);
            }
        }
    };

    // Navegar al paso anterior
    const handlePrevStep = () => {
        if (currentStep === 2) {
            setCurrentStep(1);
            setError('');
        }
    };

    // Enviar formulario completo
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validar paso actual
        if (currentStep === 1) {
            if (!validateStep1()) {
                setLoading(false);
                return;
            }
            handleNextStep();
            setLoading(false);
            return;
        }

        // Validar paso 2
        if (!validateStep2()) {
            setLoading(false);
            return;
        }

        try {
            // Preparar datos para enviar
            const userData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                telefono: formData.phone,
                sexo: formData.gender,
                direccion: formData.direcciones.length > 0 ? formData.direcciones[0] : null
            };

            console.log('Enviando datos del usuario:', userData);

            const response = await fetch('http://127.0.0.1:5000/user/add_user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(userData),
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                // Registro exitoso, redirigir al login
                navigate('/login', { 
                    state: { 
                        message: language === 'es' 
                            ? 'Cuenta creada exitosamente. Por favor inicia sesión.' 
                            : 'Account created successfully. Please login.' 
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

    // Renderizar paso 1: Información personal
    const renderStep1 = () => (
        <>
            <h2 className="form-title">{t.step1}</h2>
            
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
            
            <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="register-form">
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
                
                <div className="step-navigation">
                    <button 
                        type="submit" 
                        className={`step-button next-button ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {t.siguiente} <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                </div>
            </form>
        </>
    );

    // Renderizar paso 2: Direcciones
    const renderStep2 = () => (
        <>
            <h2 className="form-title">{t.step2}</h2>
            
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
                {formData.direcciones.map((direccion, index) => (
                    <div key={index} className="direccion-form">
                        <div className="direccion-header">
                            <h3>
                                {t.direccionTitle} {index + 1}
                                {direccion.predeterminada && (
                                    <span className="predeterminada-badge">
                                        <FontAwesomeIcon icon={faMapMarkerAlt} /> {t.predeterminada}
                                    </span>
                                )}
                            </h3>
                            {formData.direcciones.length > 1 && (
                                <button
                                    type="button"
                                    className="remove-direccion-button"
                                    onClick={() => handleRemoveDireccion(index)}
                                    disabled={loading || (direccion.predeterminada && formData.direcciones.length > 1)}
                                    title={t.eliminarDireccion}
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            )}
                        </div>
                        
                        <div className="direccion-grid">
                            <div className="form-group">
                                <label htmlFor={`calle-${index}`}>{t.calle} *</label>
                                <input
                                    id={`calle-${index}`}
                                    type="text"
                                    className="form-input"
                                    value={direccion.calle}
                                    onChange={(e) => handleDireccionChange(index, 'calle', e.target.value)}
                                    placeholder={t.callePlaceholder}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor={`numero_exterior-${index}`}>{t.numeroExterior} *</label>
                                <input
                                    id={`numero_exterior-${index}`}
                                    type="text"
                                    className="form-input"
                                    value={direccion.numero_exterior}
                                    onChange={(e) => handleDireccionChange(index, 'numero_exterior', e.target.value)}
                                    placeholder={t.numeroExteriorPlaceholder}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor={`numero_interior-${index}`}>{t.numeroInterior}</label>
                                <input
                                    id={`numero_interior-${index}`}
                                    type="text"
                                    className="form-input"
                                    value={direccion.numero_interior}
                                    onChange={(e) => handleDireccionChange(index, 'numero_interior', e.target.value)}
                                    placeholder={t.numeroInteriorPlaceholder}
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor={`colonia-${index}`}>{t.colonia} *</label>
                                <input
                                    id={`colonia-${index}`}
                                    type="text"
                                    className="form-input"
                                    value={direccion.colonia}
                                    onChange={(e) => handleDireccionChange(index, 'colonia', e.target.value)}
                                    placeholder={t.coloniaPlaceholder}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor={`ciudad-${index}`}>{t.ciudad} *</label>
                                <input
                                    id={`ciudad-${index}`}
                                    type="text"
                                    className="form-input"
                                    value={direccion.ciudad}
                                    onChange={(e) => handleDireccionChange(index, 'ciudad', e.target.value)}
                                    placeholder={t.ciudadPlaceholder}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor={`estado-${index}`}>{t.estado} *</label>
                                <input
                                    id={`estado-${index}`}
                                    type="text"
                                    className="form-input"
                                    value={direccion.estado}
                                    onChange={(e) => handleDireccionChange(index, 'estado', e.target.value)}
                                    placeholder={t.estadoPlaceholder}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor={`codigo_postal-${index}`}>{t.codigoPostal} *</label>
                                <input
                                    id={`codigo_postal-${index}`}
                                    type="text"
                                    className="form-input"
                                    value={direccion.codigo_postal}
                                    onChange={(e) => handleDireccionChange(index, 'codigo_postal', e.target.value)}
                                    placeholder={t.codigoPostalPlaceholder}
                                    required
                                    disabled={loading}
                                    maxLength="5"
                                    pattern="\d{5}"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor={`tipo-${index}`}>{t.tipoDireccion}</label>
                                <select
                                    id={`tipo-${index}`}
                                    className="form-input"
                                    value={direccion.tipo}
                                    onChange={(e) => handleDireccionChange(index, 'tipo', e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="casa">
                                        <FontAwesomeIcon icon={faHome} /> {t.tipoOptions.casa}
                                    </option>
                                    <option value="trabajo">
                                        <FontAwesomeIcon icon={faBriefcase} /> {t.tipoOptions.trabajo}
                                    </option>
                                    <option value="otro">
                                        <FontAwesomeIcon icon={faMapMarkerAlt} /> {t.tipoOptions.otro}
                                    </option>
                                </select>
                            </div>
                            
                            <div className="form-group full-width">
                                <label htmlFor={`referencias-${index}`}>{t.referencias}</label>
                                <textarea
                                    id={`referencias-${index}`}
                                    className="form-input"
                                    value={direccion.referencias}
                                    onChange={(e) => handleDireccionChange(index, 'referencias', e.target.value)}
                                    placeholder={t.referenciasPlaceholder}
                                    disabled={loading}
                                    rows="3"
                                />
                            </div>
                            
                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={direccion.predeterminada}
                                        onChange={(e) => handleDireccionChange(index, 'predeterminada', e.target.checked)}
                                        disabled={loading}
                                    />
                                    <span className="checkbox-custom"></span>
                                    {t.seleccionarPredeterminada}
                                </label>
                            </div>
                        </div>
                    </div>
                ))}
                
                <div className="add-direccion-container">
                    <button
                        type="button"
                        className="add-direccion-button"
                        onClick={handleAddDireccion}
                        disabled={loading}
                    >
                        <FontAwesomeIcon icon={faPlus} /> {t.agregarDireccion}
                    </button>
                </div>
                
                <div className="step-navigation">
                    <button 
                        type="button" 
                        className="step-button prev-button"
                        onClick={handlePrevStep}
                        disabled={loading}
                    >
                        <FontAwesomeIcon icon={faChevronLeft} /> {t.anterior}
                    </button>
                    
                    <button 
                        type="submit" 
                        className={`step-button register-button ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="button-spinner"></span>
                                {t.loading}
                            </>
                        ) : t.registrar}
                    </button>
                </div>
            </form>
        </>
    );

    return (
        <div className={`register-wrapper ${darkMode ? 'dark-mode' : ''}`}>
            {/* Botones de la derecha */}
            <div className="right-buttons-container">
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

                <div className="profile-icon-container">
                    <button 
                        type="button" 
                        className="profile-icon-button"
                        onClick={() => navigate('/perfil')}j
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

            {/* Botón de modo oscuro/claro */}
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
                    {/* Indicador de pasos */}
                    <div className="step-indicator">
                        <div className={`step ${currentStep === 1 ? 'active' : ''}`}>
                            <div className="step-number">1</div>
                            <div className="step-label">{t.step1}</div>
                        </div>
                        <div className="step-connector"></div>
                        <div className={`step ${currentStep === 2 ? 'active' : ''}`}>
                            <div className="step-number">2</div>
                            <div className="step-label">{t.step2}</div>
                        </div>
                    </div>
                    
                    {currentStep === 1 ? renderStep1() : renderStep2()}
                    
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