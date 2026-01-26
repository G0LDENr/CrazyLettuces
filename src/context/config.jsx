import React, { createContext, useContext, useState, useEffect } from 'react';
import '../css/config.css';

// Crear el contexto de configuración
const ConfigContext = createContext();

// Hook personalizado para usar el contexto
export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig debe ser usado dentro de un ConfigProvider');
    }
    return context;
};

// Proveedor del contexto
export const ConfigProvider = ({ children }) => {
    const [language, setLanguage] = useState('es');
    const [darkMode, setDarkMode] = useState(false);

    // Cargar configuración desde localStorage al iniciar
    useEffect(() => {
        const savedLanguage = localStorage.getItem('app-language');
        const savedDarkMode = localStorage.getItem('app-darkMode');
        
        if (savedLanguage) setLanguage(savedLanguage);
        if (savedDarkMode) setDarkMode(JSON.parse(savedDarkMode));
    }, []);

    // Textos para diferentes idiomas
    const texts = {
        es: {
            // --- Navegación ---
            inicio: "Inicio",
            productos: "Productos", 
            nosotros: "Nosotros",

            // --- Hero Section ---
            heroTitle: "Crazy Lettuces",
            heroDescription: "Las lechugas más locas y deliciosas con chile, gomitas y mucho sabor. ¡Una experiencia única para tu paladar!",

            // --- Productos ---
            productosTitle: "Nuestros Productos Locos",
            comboFreshName: "🥗 Combo Fresh",
            comboFreshDescription: "Lechuga crujiente con limón y sal. Simple, ligera y deliciosa. 🥬✨",
            crazySpicyName: "🌶️ Crazy Spicy", 
            crazySpicyDescription: "Chamoy, chile Miguelito y limón sobre lechugas frescas. ¡Un toque loco y picante! 🔥😋",
            comboLocoName: "😵‍💫 Combo Loco",
            comboLocoDescription: "Lechuga con gomitas, cacahuates y topping al gusto. ¡El sabor más divertido! 🍬🥜",

            // --- Encuéntranos ---
            encuentranosTitle: "Encuéntranos",
            encuentranosDescription: "Síguenos en nuestras redes sociales para conocer promociones y nuevos productos",

            // --- Footer ---
            footerDescription: "Las lechugas más locas y deliciosas de la ciudad.",
            productosFooter: "Productos",
            lechugasChile: "Lechugas con Chile",
            lechugasGomitas: "Lechugas con Gomitas", 
            combosLocos: "Combos Locos",
            contacto: "Contacto",
            direccion: "México, Ciudad de México",
            telefono: "+52 5538986602",
            email: "crazylettuces@gmail.com",
            derechos: "© 2024 Crazy Lettuces. Todos los derechos reservados.",

            // --- Configuración ---
            configuracion: 'Configuración',
            idioma: 'Idioma',
            tema: 'Tema',
            modoOscuro: 'Modo Oscuro',
            modoClaro: 'Modo Claro',
            espanol: 'Español',
            ingles: 'Inglés',
            minutos: 'Minutos',

            // --- Nosotros ---
            sobreNosotros: "",
            conoceMas: "",
            yNuestraPasion: "nuestra pasión por crear sabores y experiencias únicas, explorando nuevos sabores sin olvidar la frescura y saludable elección de nuestros productos.",
            mision: "Misión",
            misionTexto: "Somos una empresa dedicada a la elaboración de lechugas preparadas, sembradas tratadas y cosechadas para nuestro mercado de consumo, siendo este un producto natural, saludable y ecologico sin quimicos ni conservadores, asegurando el consumo saludable de nuestros clientes.",
            vision: "Visión",
            visionTexto: "Ser la numero uno en el mercado en la venta de lechugas preparadas para nuestra comunidad, ofreciendo sabor y frescura inigualables, satisfaciendo a nuestros clientes, con el fin de aumentar nuestras ventas en cada producto.",
            valores: "Valores",
            calidad: "Calidad",
            responsabilidadAmbiental: "Responsabilidad ambiental",
            honestidad: "Honestidad",
            compromisoSalud: "Compromiso con la salud",
            responsabilidadSocial: "Responsabilidad social",
            cuidadoCliente: "Cuidado con el cliente",
            atencionCliente: "Atencion al cliente",
            nuestraHistoria: "Objetivo",
            historiaTexto1: "Convertirnos en la empresa líder del mercado local de lechugas preparadas naturales en los próximos tres años aumentando nuestras ventas en un 25 por ciento y expandiendo nuestra red de distribución manteniendo nuestra certificación ecológica reduciendo el impacto ambiental e implementando un programa sólido de fidelización de clientes y responsabilidad social comunitaria",
            historiaTexto2: "Hoy, somos mucho más que una marca de lechugas. Somos creadores de experiencias, artistas del sabor y apasionados por hacer que cada comida sea una aventura memorable.",
            metas: "Meta",
            metasTexto: "Incentivar que la empresa logre entrar en el mercado, por medio de alianzas estrategicas en el suministro de materia prima, asi mismo se espera que esta medida logre 15 puntos de venta el primer año.",


            // --- Panel de Administración ---
            settings: "Configuración",
            logout: "Cerrar sesión", 
            welcomeAdmin: "Bienvenido al Panel de Administración",
            selectOption: "Selecciona una opción del menú",
            administrator: "Administrador",
            user: "Usuario",
            unknown: "Desconocido",
            
            // --- Configuración Admin ---
            cambiarTema: "Cambiar tema",
            cambiarIdioma: "Cambiar idioma",
            personalizaExperiencia: "Personaliza tu experiencia",
            generalSettings: "Configuración General",
            preferences: "Preferencias", 
            security: "Seguridad",
            Users: "Usuarios",

            // -- Usuarios --
            users: "Usuarios",

            // -- Especiales --
            specials: "Especiales",
        },
        
        en: {
            // --- Navigation ---
            inicio: "Home",
            productos: "Products",
            nosotros: "About Us",

            // --- Hero Section ---
            heroTitle: "Crazy Lettuces", 
            heroDescription: "The craziest and most delicious lettuces with chili, gummies, and lots of flavor. A unique experience for your palate!",

            // --- Products ---
            productosTitle: "Our Crazy Products",
            comboFreshName: "🥗 Fresh Combo",
            comboFreshDescription: "Crispy lettuce with lemon and salt. Simple, light, and delicious. 🥬✨",
            crazySpicyName: "🌶️ Crazy Spicy",
            crazySpicyDescription: "Chamoy, Miguelito chili, and lemon on fresh lettuce. A crazy and spicy touch! 🔥😋",
            comboLocoName: "😵‍💫 Crazy Combo",
            comboLocoDescription: "Lettuce with gummies, peanuts, and topping of your choice. The most fun flavor! 🍬🥜",

            // --- Find Us ---
            encuentranosTitle: "Find Us",
            encuentranosDescription: "Follow us on our social media to learn about promotions and new products",

            // --- Footer ---
            footerDescription: "The craziest and most delicious lettuces in the city.",
            productosFooter: "Products",
            lechugasChile: "Lettuce with Chili",
            lechugasGomitas: "Lettuce with Gummies", 
            combosLocos: "Crazy Combos",
            contacto: "Contact",
            direccion: "Mexico, Mexico City",
            telefono: "+52 5538986602", 
            email: "crazylettuces@gmail.com",
            derechos: "© 2024 Crazy Lettuces. All rights reserved.",

            // --- Configuration ---
            configuracion: 'Settings',
            idioma: 'Language',
            tema: 'Theme',
            modoOscuro: 'Dark Mode',
            modoClaro: 'Light Mode',
            espanol: 'Spanish',
            ingles: 'English',
            minutos: 'Minutes',

            // --- Nosotros ---
            sobreNosotros: "About",
            conoceMas: "Learn more about",
            yNuestraPasion: "and our passion for creating unique experiences",
            mision: "Mission",
            misionTexto: "We are a company dedicated to the production of Crazy Lettuces, lettuce planted, treated and harvested by UTVT students, being a natural, healthy and ecological product without chemicals or preservatives, ensuring healthy consumption for our customers.",
            vision: "Vision",
            visionTexto: "We hope to be a prepared lettuce company for our student community, hoping to offer flavor and freshness, managing to satisfy our customers and increase our sales.",
            valores: "Values",
            calidad: "Quality",
            responsabilidadAmbiental: "Environment Responsibility",
            honestidad: "Honesty",
            compromisoSalud: "Commitment to Health",
            responsabilidadSocial: "Social Responsibility",
            cuidadoCliente: "Customer Care",
            atencionCliente: "Customer Service",
            nuestraHistoria: "Our History",
            historiaTexto1: "was born from the idea of revolutionizing the concept of healthy snacks. We started with a simple question: why not combine the freshness of lettuce with the fun of toppings?",
            historiaTexto2: "Today, we are much more than a lettuce brand. We are creators of experiences, flavor artists and passionate about making every meal a memorable adventure.",

            // --- Admin Panel ---
            settings: "Settings", 
            logout: "Logout",
            welcomeAdmin: "Welcome to Admin Panel",
            selectOption: "Select an option from the menu",
            administrator: "Administrator",
            user: "User",
            unknown: "Unknown",
            
            // --- Admin Configuration ---
            cambiarTema: "Change theme",
            cambiarIdioma: "Change language", 
            personalizaExperiencia: "Personalize your experience",
            generalSettings: "General Settings",
            preferences: "Preferences",
            security: "Security",
            Users: "Users",

            // -- Usuarios --
            users: "Usuarios",

            // -- Especiales --
            specials: "Specials",
        }
    };

    // Cambiar idioma
    const toggleLanguage = () => {
        const newLanguage = language === 'es' ? 'en' : 'es';
        setLanguage(newLanguage);
        localStorage.setItem('app-language', newLanguage);
    };

    // Cambiar modo oscuro
    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('app-darkMode', JSON.stringify(newDarkMode));
        
        // Aplicar clase al body para modo oscuro
        if (newDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    };

    // Aplicar modo oscuro al cargar
    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [darkMode]);

    // Obtener texto traducido
    const t = (key) => {
        return texts[language]?.[key] || key;
    };

    const value = {
        language,
        darkMode,
        toggleLanguage,
        toggleDarkMode,
        t
    };

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
};

// Componente Config para mostrar los botones de configuración
export const Config = () => {
    const { language, darkMode, toggleLanguage, toggleDarkMode, t } = useConfig();

    return (
        <div className="config-container">
            <div className="config-buttons">
                {/* Botón de cambio de idioma */}
                <button 
                    onClick={toggleLanguage}
                    className="config-button language-button"
                    title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
                >
                    <span className="config-button-icon">🌐</span>
                    <span className="config-button-text">
                        {language === 'es' ? 'ES' : 'EN'}
                    </span>
                </button>

                {/* Botón de modo oscuro/claro */}
                <button 
                    onClick={toggleDarkMode}
                    className="config-button theme-button"
                    title={darkMode ? t('modoClaro') : t('modoOscuro')}
                >
                    <span className="config-button-icon">
                        {darkMode ? '☀️' : '🌙'}
                    </span>
                    <span className="config-button-text">
                        {darkMode ? t('modoClaro') : t('modoOscuro')}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default ConfigProvider;