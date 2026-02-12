import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../../context/config';
import '../../css/notificacionesUser.css';

import deleteIcon from '../../img/delete.png';
import refreshIcon from '../../img/actualizar.png';
import readIcon from '../../img/leido.png';
import logoutIcon from '../../img/salida.png';
import backIcon from '../../img/atras.png';

const NotificacionesUser = () => {
  const navigate = useNavigate();
  const { darkMode, t } = useConfig();
  const [notificaciones, setNotificaciones] = useState([]);
  const [filteredNotificaciones, setFilteredNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [ordenesData, setOrdenesData] = useState({});
  const [showPedidoModal, setShowPedidoModal] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [telefonoRestaurante] = useState('+1234567890');
  
  const notificacionesPerPage = 10;
  const API_BASE_URL = 'http://127.0.0.1:5000';

  // Verificar autenticación
  const isAuthenticated = localStorage.getItem('token') !== null;

  // Efecto para cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user'));
        
        if (token && userData) {
          await fetchNotificaciones();
        } else {
          setLoading(false);
          setError('Debes iniciar sesión para ver tus notificaciones');
        }
      } catch (error) {
        setError('Error al cargar las notificaciones');
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Función para obtener detalles de una orden específica
  const fetchOrdenDetails = async (codigoPedido) => {
    if (!codigoPedido) return null;
    
    const codigoLimpio = codigoPedido.replace(/^#/, '');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/ordenes/codigo/${codigoLimpio}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const ordenData = await response.json();
        setOrdenesData(prev => ({
          ...prev,
          [codigoLimpio]: ordenData
        }));
        return ordenData;
      }
    } catch (error) {
      console.error('Error al obtener detalles de la orden:', error);
    }
    return null;
  };

  // Función para marcar notificación como leída SOLO EN FRONTEND
  const markAsReadFrontend = (notifId) => {
    const updatedNotificaciones = notificaciones.map(n => 
      n.id === notifId ? { ...n, leida: true } : n
    );
    setNotificaciones(updatedNotificaciones);
    setFilteredNotificaciones(updatedNotificaciones);
  };

  // Función para marcar TODAS las notificaciones como leídas en frontend
  const markAllAsReadFrontend = () => {
    const updatedNotificaciones = notificaciones.map(notif => ({
      ...notif,
      leida: true
    }));
    setNotificaciones(updatedNotificaciones);
    setFilteredNotificaciones(updatedNotificaciones);
  };

  // Función para marcar una notificación como leída usando el mismo método que "Marcar todas"
  const markSingleAsReadUsingMassiveEndpoint = async (notifId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No hay token disponible');
        return false;
      }
      
      const response = await fetch(`${API_BASE_URL}/notificaciones/leer-todas?user_type=cliente`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setTimeout(() => {
          fetchNotificaciones();
        }, 500);
        return true;
      } else {
        console.warn(`Error al usar endpoint masivo para notificación ${notifId}:`, response.status);
        return false;
      }
    } catch (error) {
      console.error('Error de conexión al usar endpoint masivo:', error);
      return false;
    }
  };

  // Función para abrir el modal con los detalles del pedido
  const handleOpenPedidoModal = async (notif) => {
    try {
      setModalLoading(true);
      
      // 1. Si no está leída, marcarla como leída
      if (!notif.leida) {
        markAsReadFrontend(notif.id);
        await markSingleAsReadUsingMassiveEndpoint(notif.id);
      }
      
      // 2. Abrir el modal
      setShowPedidoModal(true);
      
      // 3. Cargar detalles del pedido
      const codigoPedido = notif.metadata?.codigo_pedido || extractCodigoFromTitulo(notif.titulo);
      const codigoLimpio = codigoPedido ? codigoPedido.replace(/^#/, '') : '';
      
      let ordenData = null;
      
      if (codigoLimpio && ordenesData[codigoLimpio]) {
        ordenData = ordenesData[codigoLimpio];
      } else if (codigoLimpio) {
        ordenData = await fetchOrdenDetails(codigoLimpio);
      }
      
      const datosModal = {
        notificacion: { ...notif, leida: true },
        codigoPedido: codigoLimpio,
        orden: ordenData,
        fecha: formatDate(notif.fecha_creacion),
        estado: getEstadoPedido(notif),
        ingredientes: getIngredientesReales(notif),
        precio: notif.metadata?.precio || (ordenData?.precio || 0)
      };
      
      setPedidoSeleccionado(datosModal);
      
    } catch (error) {
      console.error('Error al abrir modal:', error);
    } finally {
      setModalLoading(false);
    }
  };

  // Función para cerrar el modal
  const handleClosePedidoModal = () => {
    setShowPedidoModal(false);
    setPedidoSeleccionado(null);
  };

  // Función para marcar/desmarcar notificación como leída (botón manual)
  const handleToggleReadStatus = async (notif, e) => {
    e.stopPropagation();
    
    const nuevaLeida = !notif.leida;
    
    if (nuevaLeida) {
      markAsReadFrontend(notif.id);
      await markSingleAsReadUsingMassiveEndpoint(notif.id);
    } else {
      const updatedNotificaciones = notificaciones.map(n => 
        n.id === notif.id ? { ...n, leida: false } : n
      );
      setNotificaciones(updatedNotificaciones);
      setFilteredNotificaciones(updatedNotificaciones);
    }
  };

  // Función para obtener notificaciones
  const fetchNotificaciones = async () => {
    try {
      console.log('Iniciando fetchNotificaciones para cliente...');
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No hay sesión activa. Por favor, inicia sesión.');
        setLoading(false);
        return;
      }

      // No pasar user_type, el backend lo determina por rol
      const url = `${API_BASE_URL}/notificaciones/usuario`;
      console.log(`URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Datos recibidos: ${data.notificaciones?.length || 0} notificaciones`);
        
        const notifs = data.notificaciones || [];
        setNotificaciones(notifs);
        setFilteredNotificaciones(notifs);
        
        // Pre-cargar datos de órdenes para las notificaciones principales
        const notifsPrincipales = notifs.slice(0, 5);
        notifsPrincipales.forEach(notif => {
          const codigoPedido = notif.metadata?.codigo_pedido || extractCodigoFromTitulo(notif.titulo);
          if (codigoPedido) {
            fetchOrdenDetails(codigoPedido);
          }
        });
      } else if (response.status === 401) {
        setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else if (response.status === 403) {
        setError('No tienes permisos para acceder a las notificaciones.');
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setError(`Error ${response.status} al obtener notificaciones`);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setError(`Error de conexión: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para filtrar notificaciones
  useEffect(() => {
    let filtered = notificaciones;

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(notif => 
        notif.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.mensaje?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.metadata?.codigo_pedido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.metadata?.ingrediente_no_disponible?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.metadata?.ingrediente_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== '') {
      filtered = filtered.filter(notif => notif.tipo === typeFilter);
    }

    if (readFilter !== '') {
      const isRead = readFilter === 'leidas';
      filtered = filtered.filter(notif => notif.leida === isRead);
    }
    
    setFilteredNotificaciones(filtered);
    setCurrentPage(1);
  }, [searchTerm, typeFilter, readFilter, notificaciones]);

  // Función para refrescar notificaciones
  const handleRefresh = async () => {
    console.log('Refrescando notificaciones...');
    await fetchNotificaciones();
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  // Función para ir atrás
  const handleGoBack = () => {
    navigate(-1);
  };

  // Función para redirigir a login
  const handleLoginRedirect = () => {
    navigate('/login');
  };

  // Cálculos para paginación
  const indexOfLastNotif = currentPage * notificacionesPerPage;
  const indexOfFirstNotif = indexOfLastNotif - notificacionesPerPage;
  const currentNotificaciones = filteredNotificaciones.slice(indexOfFirstNotif, indexOfLastNotif);
  const totalPages = Math.ceil(filteredNotificaciones.length / notificacionesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Función para manejar clic en eliminar
  const handleDeleteClick = (notifId, notifTitulo) => {
    setNotificationToDelete({ id: notifId, titulo: notifTitulo });
    setShowDeleteConfirm(true);
  };

  // Función para confirmar eliminación
  const handleDeleteConfirm = async () => {
    if (!notificationToDelete) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/notificaciones/${notificationToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const updatedNotificaciones = notificaciones.filter(notif => notif.id !== notificationToDelete.id);
        setNotificaciones(updatedNotificaciones);
        setFilteredNotificaciones(updatedNotificaciones);
        
        setShowDeleteConfirm(false);
        setNotificationToDelete(null);
      } else if (response.status === 403) {
        alert('No tienes permiso para eliminar esta notificación');
      } else {
        alert('Error al eliminar la notificación');
      }
    } catch (error) {
      alert('Error de conexión al eliminar notificación');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setNotificationToDelete(null);
    }
  };

  // Función para cancelar eliminación
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setNotificationToDelete(null);
  };

  // Función para marcar TODAS como leídas
  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      
      markAllAsReadFrontend();
      
      const response = await fetch(`${API_BASE_URL}/notificaciones/leer-todas?user_type=cliente`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('Todas las notificaciones marcadas como leídas');
      } else {
        console.warn('No se pudieron marcar todas como leídas en backend');
      }
      
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  // Función para eliminar todas las leídas
  const handleDeleteAllRead = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar todas las notificaciones leídas?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/notificaciones/leidas?user_type=cliente`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const updatedNotificaciones = notificaciones.filter(notif => !notif.leida);
        setNotificaciones(updatedNotificaciones);
        setFilteredNotificaciones(updatedNotificaciones);
      } else {
        const updatedNotificaciones = notificaciones.filter(notif => !notif.leida);
        setNotificaciones(updatedNotificaciones);
        setFilteredNotificaciones(updatedNotificaciones);
      }
    } catch (error) {
      const updatedNotificaciones = notificaciones.filter(notif => !notif.leida);
      setNotificaciones(updatedNotificaciones);
      setFilteredNotificaciones(updatedNotificaciones);
    }
  };

  // Función para formatear fecha y hora correctamente
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Función para extraer el código del pedido del título
  const extractCodigoFromTitulo = (titulo) => {
    if (!titulo) return '';
    
    const patrones = [
      /#\s*([A-Z0-9]{4,})/i,
      /pedido\s*#?\s*([A-Z0-9]{4,})/i,
      /\b([A-Z0-9]{4,})\b/
    ];
    
    for (const patron of patrones) {
      const match = titulo.match(patron);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return '';
  };

  // Función para obtener los ingredientes REALES
  const getIngredientesReales = (notif) => {
    const codigoPedido = notif.metadata?.codigo_pedido || extractCodigoFromTitulo(notif.titulo);
    
    if (!codigoPedido) {
      return "Consulta los detalles del pedido";
    }
    
    const codigoLimpio = codigoPedido.replace(/^#/, '');
    const ordenData = ordenesData[codigoLimpio];
    
    if (ordenData) {
      if (ordenData.tipo_pedido === 'personalizado' && ordenData.ingredientes_personalizados) {
        return ordenData.ingredientes_personalizados;
      } else if (ordenData.tipo_pedido === 'especial' && ordenData.especial_nombre) {
        return ordenData.especial_nombre;
      } else if (ordenData.tipo_pedido === 'especial' && ordenData.especial_id) {
        return "Especial del día";
      }
    }
    
    return "Ver detalles del pedido";
  };

  // Función para extraer el estado del pedido
  const getEstadoPedido = (notif) => {
    if (notif.metadata?.estado) {
      return notif.metadata.estado;
    }
    
    const textoBusqueda = (notif.titulo || "") + " " + (notif.mensaje || "");
    
    const estados = [
      'Recibido', 'Recibida', 
      'En preparación', 'En preparacion', 'Preparando',
      'En proceso', 'Procesando',
      'En camino', 
      'En entrega', 'Saliendo para entrega',
      'Entregado', 'Entregada',
      'Cancelado', 'Cancelada'
    ];
    
    for (const estado of estados) {
      if (textoBusqueda.toLowerCase().includes(estado.toLowerCase())) {
        return estado;
      }
    }
    
    return "En proceso";
  };

  // Función para limpiar el código del pedido (remover #)
  const cleanCodigoPedido = (codigo) => {
    if (!codigo) return '';
    return codigo.replace(/^#/, '');
  };

  // Función para abrir WhatsApp para contactar al restaurante
  const handleContactarRestaurante = (notif) => {
    const codigoPedido = notif.metadata?.codigo_pedido || '';
    const ingrediente = notif.metadata?.ingrediente_no_disponible || notif.metadata?.ingrediente_nombre || '';
    
    const mensaje = `Hola, tengo una consulta sobre mi pedido ${codigoPedido} porque ${ingrediente} no está disponible.`;
    
    const urlWhatsapp = `https://wa.me/${telefonoRestaurante}?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWhatsapp, '_blank');
  };

  // Función para renderizar notificación de ingrediente inactivo (CLIENTE)
  const renderNotificacionIngredienteInactivoCliente = (notif) => {
    const ingrediente = notif.metadata?.ingrediente_nombre || 'un ingrediente';
    const especialesCount = notif.metadata?.especiales_afectados_count || 0;
    
    // Limpiar título de emojis y texto innecesario
    const tituloLimpio = notif.titulo
      .replace('INGREDIENTE INACTIVO:', '')
      .replace('INGREDIENTE DESACTIVADO:', '')
      .trim() || `Actualización de Menú - ${ingrediente}`;
    
    return (
      <div 
        className={`notificacionesUser-item ${notif.leida ? 'leida' : 'no-leida'} ingrediente-inactivo-item`}
      >
        <div className="notificacionesUser-header">
          <div className="notificacionesUser-info">
            <h4 className="notificacionesUser-titulo ingrediente-inactivo-titulo">
              {tituloLimpio}
            </h4>
            <div className="notificacionesUser-meta">
              <span className="notificacionesUser-fecha">
                {formatDate(notif.fecha_creacion)}
              </span>
            </div>
          </div>
          <div className="notificacionesUser-actions">
            {!notif.leida && (
              <span className="notificacionesUser-badge-no-leida">
                Nuevo
              </span>
            )}
            
            <button 
              onClick={(e) => handleToggleReadStatus(notif, e)}
              className="notificacionesUser-action-btn notificacionesUser-read-btn"
              title={notif.leida ? "Marcar como no leída" : "Marcar como leída"}
              disabled={loading}
            >
              <img 
                src={readIcon} 
                alt={notif.leida ? "Marcar no leída" : "Marcar leída"} 
                className="notificacionesUser-action-icon" 
              />
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(notif.id, notif.titulo);
              }}
              className="notificacionesUser-action-btn notificacionesUser-delete-btn"
              title="Eliminar notificación"
              disabled={loading}
            >
              <img src={deleteIcon} alt="Eliminar" className="notificacionesUser-action-icon" />
            </button>
          </div>
        </div>
        
        <div className="notificacionesUser-mensaje ingrediente-inactivo-mensaje">
          <p>El ingrediente <strong>{ingrediente}</strong> ya no está disponible.</p>
          <p>Esto podría afectar algunos de nuestros especiales.</p>
          <p>Gracias por tu comprensión.</p>
        </div>
        
        {especialesCount > 0 && (
          <div className="notificacionesUser-metadata ingrediente-inactivo-metadata">
            <div className="notificacionesUser-metadata-item">
              <span className="notificacionesUser-metadata-label">Especiales afectados:</span>
              <span className="notificacionesUser-metadata-value especiales-count">
                {especialesCount} {especialesCount === 1 ? 'especial' : 'especiales'}
              </span>
            </div>
          </div>
        )}
        
        <div className="notificacion-info-extra">
          <p>Estos especiales no estarán disponibles hasta nuevo aviso.</p>
          <p>Gracias por tu comprensión.</p>
        </div>
      </div>
    );
  };

  // Función para renderizar notificación de ingrediente no disponible
  const renderNotificacionIngredienteNoDisponible = (notif) => {
    const ingrediente = notif.metadata?.ingrediente_no_disponible || 'un ingrediente';
    const fecha = notif.metadata?.fecha_afectada || 'hoy';
    const codigoPedido = cleanCodigoPedido(notif.metadata?.codigo_pedido || '');
    const motivo = notif.metadata?.motivo || '';
    
    // Limpiar título
    const tituloLimpio = notif.titulo
      .replace(/[⚠️🚨]/g, '')
      .replace('INGREDIENTE NO DISPONIBLE:', '')
      .trim() || `Ingrediente no disponible - ${ingrediente}`;
    
    return (
      <div 
        className={`notificacionesUser-item ${notif.leida ? 'leida' : 'no-leida'}`}
        onClick={() => {
          if (notif.metadata?.accion_sugerida === 'contactar_para_cambios') {
            handleContactarRestaurante(notif);
          }
        }}
        style={{ cursor: notif.metadata?.accion_sugerida === 'contactar_para_cambios' ? 'pointer' : 'default' }}
      >
        <div className="notificacionesUser-header">
          <div className="notificacionesUser-info">
            <h4 className="notificacionesUser-titulo ingrediente-no-disponible-titulo">
              {tituloLimpio}
            </h4>
            <div className="notificacionesUser-meta">
              <span className="notificacionesUser-fecha">
                {formatDate(notif.fecha_creacion)}
              </span>
            </div>
          </div>
          <div className="notificacionesUser-actions">
            {!notif.leida && (
              <span className="notificacionesUser-badge-no-leida">
                Nuevo
              </span>
            )}
            
            <button 
              onClick={(e) => handleToggleReadStatus(notif, e)}
              className="notificacionesUser-action-btn notificacionesUser-read-btn"
              title={notif.leida ? "Marcar como no leída" : "Marcar como leída"}
              disabled={loading}
            >
              <img 
                src={readIcon} 
                alt={notif.leida ? "Marcar no leída" : "Marcar leída"} 
                className="notificacionesUser-action-icon" 
              />
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(notif.id, notif.titulo);
              }}
              className="notificacionesUser-action-btn notificacionesUser-delete-btn"
              title="Eliminar notificación"
              disabled={loading}
            >
              <img src={deleteIcon} alt="Eliminar" className="notificacionesUser-action-icon" />
            </button>
          </div>
        </div>
        
        <div className="notificacionesUser-mensaje ingrediente-no-disponible-mensaje">
          {notif.mensaje.replace(/[🔔📢⚠️🚨]/g, '').trim()}
        </div>
        
        <div className="notificacionesUser-metadata ingrediente-no-disponible-metadata">
          <div className="notificacionesUser-metadata-item">
            <span className="notificacionesUser-metadata-label">Ingrediente:</span>
            <span className="notificacionesUser-metadata-value ingrediente-afectado">
              {ingrediente}
            </span>
          </div>
          
          {codigoPedido && (
            <div className="notificacionesUser-metadata-item">
              <span className="notificacionesUser-metadata-label">Pedido:</span>
              <span className="notificacionesUser-metadata-value">
                #{codigoPedido}
              </span>
            </div>
          )}
          
          <div className="notificacionesUser-metadata-item">
            <span className="notificacionesUser-metadata-label">Fecha:</span>
            <span className="notificacionesUser-metadata-value">
              {fecha}
            </span>
          </div>
        </div>
        
        {notif.metadata?.accion_sugerida === 'contactar_para_cambios' && (
          <div className="notificacion-accion-container">
            <button 
              className="notificacion-accion-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleContactarRestaurante(notif);
              }}
            >
              Contactar para cambios
            </button>
          </div>
        )}
      </div>
    );
  };

  // Función para renderizar notificación normal de pedido
  const renderNotificacionPedido = (notif) => {
    const codigoPedido = cleanCodigoPedido(
      notif.metadata?.codigo_pedido || 
      extractCodigoFromTitulo(notif.titulo) || 
      ''
    );
    
    const ingredientesReales = getIngredientesReales(notif);
    const estadoPedido = getEstadoPedido(notif);
    
    return (
      <div 
        className={`notificacionesUser-item ${notif.leida ? 'leida' : 'no-leida'}`}
        onClick={() => handleOpenPedidoModal(notif)}
        style={{ cursor: 'pointer' }}
      >
        <div className="notificacionesUser-header">
          <div className="notificacionesUser-info">
            <h4 className="notificacionesUser-titulo">
              Pedido: {ingredientesReales}
            </h4>
            <div className="notificacionesUser-meta">
              <span className="notificacionesUser-fecha">
                {formatDate(notif.fecha_creacion)}
              </span>
            </div>
          </div>
          <div className="notificacionesUser-actions">
            {!notif.leida && (
              <span className="notificacionesUser-badge-no-leida">
                Nuevo
              </span>
            )}
            
            <button 
              onClick={(e) => handleToggleReadStatus(notif, e)}
              className="notificacionesUser-action-btn notificacionesUser-read-btn"
              title={notif.leida ? "Marcar como no leída" : "Marcar como leída"}
              disabled={loading}
            >
              <img 
                src={readIcon} 
                alt={notif.leida ? "Marcar no leída" : "Marcar leída"} 
                className="notificacionesUser-action-icon" 
              />
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(notif.id, notif.titulo);
              }}
              className="notificacionesUser-action-btn notificacionesUser-delete-btn"
              title="Eliminar notificación"
              disabled={loading}
            >
              <img src={deleteIcon} alt="Eliminar" className="notificacionesUser-action-icon" />
            </button>
          </div>
        </div>
        
        <div className="notificacionesUser-mensaje">
          {notif.mensaje}
        </div>
        
        <div className="notificacionesUser-metadata">
          <div className="notificacionesUser-metadata-item">
            <span className="notificacionesUser-metadata-label">Código:</span>
            <span className="notificacionesUser-metadata-value">
              {codigoPedido || "N/A"}
            </span>
          </div>
          
          <div className="notificacionesUser-metadata-item">
            <span className="notificacionesUser-metadata-label">Estado:</span>
            <span className="notificacionesUser-metadata-value estado-pedido">
              {estadoPedido}
            </span>
          </div>
          
          {notif.metadata?.precio && (
            <div className="notificacionesUser-metadata-item">
              <span className="notificacionesUser-metadata-label">Total:</span>
              <span className="notificacionesUser-metadata-value">${parseFloat(notif.metadata.precio).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Función para renderizar cualquier notificación según su tipo
  const renderNotificacion = (notif) => {
    // Ingrediente inactivo para cliente
    if (notif.tipo === 'ingrediente_inactivo') {
      return renderNotificacionIngredienteInactivoCliente(notif);
    }
    
    // Ingrediente no disponible temporalmente
    if (notif.tipo === 'ingrediente_no_disponible') {
      return renderNotificacionIngredienteNoDisponible(notif);
    }
    
    // Notificación normal de pedido
    return renderNotificacionPedido(notif);
  };

  // Función para contar notificaciones por tipo
  const contarNotificacionesPorTipo = (tipo) => {
    return notificaciones.filter(n => n.tipo === tipo).length;
  };

  // Renderizar estado de carga inicial
  if (loading && notificaciones.length === 0) {
    return (
      <div className={`notificacionesUser-container ${darkMode ? 'dark-mode' : ''}`}>
        <div className="notificacionesUser-loading-spinner"></div>
        <p style={{textAlign: 'center', color: darkMode ? '#e2e8f0' : '#666'}}>
          Cargando notificaciones...
        </p>
      </div>
    );
  }

  // Renderizar error
  if (error) {
    return (
      <div className={`notificacionesUser-container ${darkMode ? 'dark-mode' : ''}`}>
        <div className="notificacionesUser-error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button 
            className="notificacionesUser-retry-btn"
            onClick={fetchNotificaciones}
          >
            Reintentar
          </button>
          {error.includes('sesión') && (
            <button 
              className="notificacionesUser-login-btn"
              onClick={handleLoginRedirect}
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`notificacionesUser-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="notificacionesUser-content">
        
        {/* Header con botón de regresar, título y botones */}
        <div className="notificacionesUser-section-header">
          <div className="notificacionesUser-header-left">
            <button 
              onClick={handleGoBack} 
              className="notificacionesUser-back-button"
              title="Regresar"
            >
              <img src={backIcon} alt="Regresar" className="notificacionesUser-back-icon" />
            </button>
            <h3>Mis Notificaciones</h3>
          </div>
          <div className="notificacionesUser-header-buttons">
            <button 
              className="notificacionesUser-refresh-btn"
              onClick={handleRefresh}
              title="Actualizar notificaciones"
              disabled={loading}
            >
              <img 
                src={refreshIcon} 
                alt="Actualizar" 
                className={`notificacionesUser-btn-icon-img ${loading ? 'spinning' : ''}`} 
              />
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
            
            <button 
              className="notificacionesUser-mark-read-btn"
              onClick={handleMarkAllAsRead}
              title="Marcar todas como leídas"
              disabled={notificaciones.every(n => n.leida) || loading}
            >
              <img src={readIcon} alt="Marcar leídas" className="notificacionesUser-btn-icon-img" />
              Marcar Todas Leídas
            </button>
            
            <button 
              className="notificacionesUser-delete-read-btn"
              onClick={handleDeleteAllRead}
              title="Eliminar notificaciones leídas"
              disabled={notificaciones.every(n => !n.leida) || loading}
            >
              <img src={deleteIcon} alt="Eliminar leídas" className="notificacionesUser-btn-icon-img" />
              Eliminar Leídas
            </button>
            
            {isAuthenticated ? (
              <button 
                onClick={handleLogout} 
                className="notificacionesUser-logout-btn"
              >
                <img src={logoutIcon} alt="Salir" className="notificacionesUser-btn-icon-img" />
                Cerrar Sesión
              </button>
            ) : (
              <button 
                onClick={handleLoginRedirect} 
                className="notificacionesUser-login-btn"
              >
                Iniciar Sesión
              </button>
            )}
          </div>
        </div>

        {/* Buscador y Filtros */}
        <div className="notificacionesUser-search-section">
          <div className="notificacionesUser-filters-row">
            <div className="notificacionesUser-search-container notificacionesUser-main-search">
              <input
                type="text"
                placeholder="Buscar por código, ingrediente o mensaje..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="notificacionesUser-search-input"
                disabled={loading}
              />
              {searchTerm && (
                <button 
                  className="notificacionesUser-clear-search"
                  onClick={() => setSearchTerm('')}
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="notificacionesUser-filter-group">
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="notificacionesUser-filter-select"
                disabled={loading}
              >
                <option value="">Todos los tipos</option>
                <option value="estado_pedido">Actualizaciones de Pedidos</option>
                <option value="nuevo_pedido">Nuevos Pedidos</option>
                <option value="estado_cambiado">Cambios de Estado</option>
                <option value="mensaje_admin">Mensajes</option>
                <option value="pedido_cancelado">Cancelaciones</option>
                <option value="ingrediente_no_disponible">Ingrediente No Disponible</option>
                <option value="ingrediente_inactivo">Ingrediente Inactivo</option>
              </select>
            </div>

            <div className="notificacionesUser-filter-group">
              <select 
                value={readFilter} 
                onChange={(e) => setReadFilter(e.target.value)}
                className="notificacionesUser-filter-select"
                disabled={loading}
              >
                <option value="">Todas</option>
                <option value="no-leidas">No leídas</option>
                <option value="leidas">Leídas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contador de notificaciones */}
        <div className="notificacionesUser-notifications-counter">
          <span className="notificacionesUser-counter-total">
            Total: <strong>{notificaciones.length}</strong>
          </span>
          <span className="notificacionesUser-counter-unread">
            No leídas: <strong>{notificaciones.filter(n => !n.leida).length}</strong>
          </span>
        </div>

        {/* Lista de notificaciones */}
        <div className="notificacionesUser-list-container">
          {loading && notificaciones.length > 0 && (
            <div className="notificacionesUser-list-loading-overlay">
              <div className="notificacionesUser-loading-spinner small"></div>
              <span>Actualizando notificaciones...</span>
            </div>
          )}
          
          {currentNotificaciones.length > 0 ? (
            currentNotificaciones.map(notif => (
              <React.Fragment key={notif.id}>
                {renderNotificacion(notif)}
              </React.Fragment>
            ))
          ) : (
            <div className="notificacionesUser-no-notificaciones">
              {loading ? 'Cargando notificaciones...' : 
               searchTerm || typeFilter || readFilter ? 
                 'No se encontraron notificaciones con esos criterios' : 
                 'No hay notificaciones disponibles'
              }
              {!loading && notificaciones.length === 0 && (
                <p style={{ fontSize: '14px', color: darkMode ? '#94a3b8' : '#64748b', marginTop: '10px' }}>
                  Las notificaciones aparecerán aquí cuando recibas nuevos pedidos, 
                  haya cambios en tus pedidos, ingredientes no disponibles o recibas mensajes del restaurante.
                </p>
              )}
              {!isAuthenticated && (
                <button 
                  className="notificacionesUser-primary-btn"
                  onClick={handleLoginRedirect}
                >
                  Iniciar Sesión para ver notificaciones
                </button>
              )}
            </div>
          )}
        </div>

        {/* Paginación */}
        {filteredNotificaciones.length > notificacionesPerPage && (
          <div className="notificacionesUser-pagination-container">
            <div className="notificacionesUser-pagination-controls">
              <button 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1 || loading}
                className="notificacionesUser-pagination-btn notificacionesUser-prev-btn"
              >
                Anterior
              </button>
              
              <div className="notificacionesUser-pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(number => 
                    number === 1 || 
                    number === totalPages || 
                    (number >= currentPage - 1 && number <= currentPage + 1)
                  )
                  .map((number, index, array) => {
                    const showEllipsis = index > 0 && number - array[index - 1] > 1;
                    return (
                      <React.Fragment key={number}>
                        {showEllipsis && <span className="notificacionesUser-pagination-ellipsis">...</span>}
                        <button
                          onClick={() => paginate(number)}
                          className={`notificacionesUser-pagination-btn ${currentPage === number ? 'active' : ''}`}
                          disabled={loading}
                        >
                          {number}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>
              
              <button 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages || loading}
                className="notificacionesUser-pagination-btn notificacionesUser-next-btn"
              >
                Siguiente
              </button>
            </div>

            <div className="notificacionesUser-count-info">
              Mostrando {currentNotificaciones.length} de {filteredNotificaciones.length} notificaciones
            </div>
          </div>
        )}

        {filteredNotificaciones.length <= notificacionesPerPage && filteredNotificaciones.length > 0 && (
          <div className="notificacionesUser-count-info">
            Mostrando {currentNotificaciones.length} de {filteredNotificaciones.length} notificaciones
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        {showDeleteConfirm && (
          <div className="notificacionesUser-modal-overlay-delete">
            <div className="notificacionesUser-modal-content notificacionesUser-confirm-modal">
              <div className="notificacionesUser-confirm-header">
                <h3>¿Eliminar Notificación?</h3>
              </div>
              <div className="notificacionesUser-confirm-body">
                <p className="notificacionesUser-confirm-message">
                  ¿Estás seguro de que quieres eliminar la notificación:
                  <strong> "{notificationToDelete?.titulo}"</strong>?
                </p>
                <p className="notificacionesUser-confirm-warning">
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="notificacionesUser-confirm-actions">
                <button 
                  className="notificacionesUser-confirm-btn notificacionesUser-cancel-btn"
                  onClick={handleDeleteCancel}
                >
                  Cancelar
                </button>
                <button 
                  className="notificacionesUser-confirm-btn notificacionesUser-delete-confirm-btn"
                  onClick={handleDeleteConfirm}
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de detalles del pedido */}
        {showPedidoModal && (
          <div className="notificacionesUser-modal-overlay-pedido">
            <div className="notificacionesUser-modal-content notificacionesUser-pedido-modal">
              <div className="notificacionesUser-pedido-header">
                <h3>Detalles del Pedido</h3>
                <button 
                  onClick={handleClosePedidoModal}
                  className="notificacionesUser-pedido-close"
                >
                  ✕
                </button>
              </div>
              
              <div className="notificacionesUser-pedido-body">
                {modalLoading ? (
                  <div className="notificacionesUser-pedido-loading">
                    <div className="notificacionesUser-loading-spinner small"></div>
                    <p>Cargando información del pedido...</p>
                  </div>
                ) : pedidoSeleccionado ? (
                  <>
                    <div className="notificacionesUser-pedido-codigo-container">
                      <div className="notificacionesUser-pedido-codigo-label">Código del Pedido:</div>
                      <div className="notificacionesUser-pedido-codigo-value">
                        {pedidoSeleccionado.codigoPedido || "N/A"}
                      </div>
                    </div>
                    
                    <div className="notificacionesUser-pedido-info-grid">
                      <div className="notificacionesUser-pedido-info-item">
                        <span className="notificacionesUser-pedido-info-label">Fecha:</span>
                        <span className="notificacionesUser-pedido-info-value">
                          {pedidoSeleccionado.fecha}
                        </span>
                      </div>
                      
                      <div className="notificacionesUser-pedido-info-item">
                        <span className="notificacionesUser-pedido-info-label">Estado:</span>
                        <span className="notificacionesUser-pedido-info-value estado-pedido">
                          {pedidoSeleccionado.estado}
                        </span>
                      </div>
                      
                      {pedidoSeleccionado.precio > 0 && (
                        <div className="notificacionesUser-pedido-info-item">
                          <span className="notificacionesUser-pedido-info-label">Total:</span>
                          <span className="notificacionesUser-pedido-info-value precio">
                            ${parseFloat(pedidoSeleccionado.precio).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="notificacionesUser-pedido-detalles">
                      <h4>Detalles del Pedido:</h4>
                      
                      {pedidoSeleccionado.orden ? (
                        <div className="notificacionesUser-pedido-detalles-content">
                          <div className="notificacionesUser-pedido-detalle-item">
                            <strong>Tipo:</strong> 
                            <span>{pedidoSeleccionado.orden.tipo_pedido === 'personalizado' ? 'Personalizado' : 'Especial'}</span>
                          </div>
                          
                          <div className="notificacionesUser-pedido-detalle-item">
                            <strong>
                              {pedidoSeleccionado.orden.tipo_pedido === 'personalizado' ? 'Ingredientes:' : 'Especial:'}
                            </strong>
                            <span>{pedidoSeleccionado.ingredientes}</span>
                          </div>
                          
                          {pedidoSeleccionado.orden.tipo_pedido === 'personalizado' && pedidoSeleccionado.orden.ingredientes_personalizados && (
                            <div className="notificacionesUser-pedido-ingredientes">
                              <strong>Ingredientes solicitados:</strong>
                              <p>{pedidoSeleccionado.orden.ingredientes_personalizados}</p>
                            </div>
                          )}
                          
                          {pedidoSeleccionado.orden.tipo_pedido === 'especial' && pedidoSeleccionado.orden.especial_descripcion && (
                            <div className="notificacionesUser-pedido-especial-desc">
                              <strong>Descripción:</strong>
                              <p>{pedidoSeleccionado.orden.especial_descripcion}</p>
                            </div>
                          )}
                          
                          <div className="notificacionesUser-pedido-cliente-info">
                            <h5>Información del Cliente:</h5>
                            <div className="notificacionesUser-pedido-detalle-item">
                              <strong>Nombre:</strong>
                              <span>{pedidoSeleccionado.orden.nombre_usuario || 'No disponible'}</span>
                            </div>
                            {pedidoSeleccionado.orden.telefono_usuario && (
                              <div className="notificacionesUser-pedido-detalle-item">
                                <strong>Teléfono:</strong>
                                <span>{pedidoSeleccionado.orden.telefono_usuario}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="notificacionesUser-pedido-no-detalles">
                          <p>No se encontraron detalles adicionales del pedido.</p>
                          <p className="notificacionesUser-pedido-mensaje">
                            <strong>Mensaje:</strong> {pedidoSeleccionado.notificacion?.mensaje}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="notificacionesUser-pedido-mensaje-container">
                      <h4>Mensaje:</h4>
                      <div className="notificacionesUser-pedido-mensaje-content">
                        {pedidoSeleccionado.notificacion?.mensaje}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="notificacionesUser-pedido-error">
                    <p>Error al cargar los detalles del pedido.</p>
                    <button 
                      onClick={handleClosePedidoModal}
                      className="notificacionesUser-pedido-btn-cerrar"
                    >
                      Cerrar
                    </button>
                  </div>
                )}
              </div>
              
              <div className="notificacionesUser-pedido-footer">
                <button 
                  onClick={handleClosePedidoModal}
                  className="notificacionesUser-pedido-btn-cerrar"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificacionesUser;