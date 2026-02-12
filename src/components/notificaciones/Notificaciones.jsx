import React, { useEffect, useState } from 'react';
import { useConfig } from '../../context/config';
import '../../css/notificaciones.css';

import deleteIcon from '../../img/delete.png';
import refreshIcon from '../../img/actualizar.png';
import sendIcon from '../../img/enviar.png';
import statsIcon from '../../img/estadisticas.png';
import readIcon from '../../img/leido.png';

const Notificaciones = () => {
  const { darkMode, t } = useConfig();
  const [notificaciones, setNotificaciones] = useState([]);
  const [filteredNotificaciones, setFilteredNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [messageForm, setMessageForm] = useState({
    destinatario_tipo: 'todos',
    destinatario_id: '',
    titulo: 'Mensaje del Restaurante',
    mensaje: ''
  });
  
  // NUEVOS ESTADOS PARA MODAL DE DETALLES
  const [showPedidoModal, setShowPedidoModal] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [ordenesData, setOrdenesData] = useState({});
  
  const notificacionesPerPage = 10;
  const API_BASE_URL = 'http://127.0.0.1:5000';

  // Efecto para cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('🔵 INICIANDO CARGA DE NOTIFICACIONES');
        
        // 1. Obtener rol del usuario
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user'));
        
        if (userData) {
          setUserRole(userData.rol || userData.role);
          console.log('📋 Rol obtenido de localStorage:', userData.rol || userData.role);
          console.log('👤 ID Usuario:', userData.id);
        } else if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const role = payload.rol || payload.role;
            setUserRole(role);
            console.log('📋 Rol obtenido del token:', role);
          } catch (error) {
            console.error('❌ Error al decodificar token:', error);
          }
        }
        
        // 2. Cargar notificaciones inmediatamente
        await fetchNotificaciones();
        
      } catch (error) {
        console.error('Error en carga inicial:', error);
        setError('Error al cargar las notificaciones');
      }
    };

    loadInitialData();
  }, []);

  // Efecto para cargar usuarios cuando se abre el modal de enviar mensaje
  useEffect(() => {
    if (showSendModal && userRole === 1) {
      fetchUsuarios();
    }
  }, [showSendModal, userRole]);

  // Efecto para cargar analytics cuando se abre el modal de estadísticas
  useEffect(() => {
    if (showAnalyticsModal && userRole === 1) {
      fetchAnalytics();
    }
  }, [showAnalyticsModal, userRole]);

  // Función para determinar el tipo de usuario
  const getUserType = () => {
    return userRole === 1 ? 'admin' : 'cliente';
  };

  // NUEVA FUNCIÓN: Obtener detalles de una orden específica
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

  // NUEVA FUNCIÓN: Formatear fecha y hora
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

  // NUEVA FUNCIÓN: Extraer código del pedido del título
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

  // NUEVA FUNCIÓN: Obtener ingredientes reales
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

  // NUEVA FUNCIÓN: Obtener estado del pedido
  const getEstadoPedido = (notif) => {
    if (notif.metadata?.estado) {
      return notif.metadata.estado;
    }
    
    if (notif.metadata?.estado_nuevo) {
      return notif.metadata.estado_nuevo;
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

  // NUEVA FUNCIÓN: Limpiar código del pedido
  const cleanCodigoPedido = (codigo) => {
    if (!codigo) return '';
    return codigo.replace(/^#/, '');
  };

  // NUEVA FUNCIÓN: Marcar como leída en frontend
  const markAsReadFrontend = (notifId) => {
    const updatedNotificaciones = notificaciones.map(n => 
      n.id === notifId ? { ...n, leida: true } : n
    );
    setNotificaciones(updatedNotificaciones);
    setFilteredNotificaciones(updatedNotificaciones);
  };

  // NUEVA FUNCIÓN: Abrir modal con detalles del pedido - VERSIÓN SIMPLIFICADA
  const handleOpenPedidoModal = async (notif) => {
    try {
      console.log(`🚀 Abriendo modal para notificación ${notif.id}`);
      setModalLoading(true);
      
      // 1. Marcar como leída si no lo está
      if (!notif.leida) {
        markAsReadFrontend(notif.id);
        handleMarkAsRead(notif.id);
      }
      
      // 2. Abrir el modal INMEDIATAMENTE
      setShowPedidoModal(true);
      
      // 3. Preparar datos iniciales
      const codigoPedido = cleanCodigoPedido(notif.metadata?.codigo_pedido || extractCodigoFromTitulo(notif.titulo) || '');
      
      const datosModal = {
        notificacion: notif,
        codigoPedido: codigoPedido,
        orden: null,
        fecha: formatDate(notif.fecha_creacion),
        estado: getEstadoPedido(notif),
        ingredientes: "Cargando detalles...",
        precio: notif.metadata?.precio || 0
      };
      
      setPedidoSeleccionado(datosModal);
      
      // 4. Intentar cargar más detalles en segundo plano
      if (codigoPedido) {
        setTimeout(async () => {
          try {
            const ordenData = await fetchOrdenDetails(codigoPedido);
            if (ordenData) {
              setPedidoSeleccionado(prev => ({
                ...prev,
                orden: ordenData,
                ingredientes: getIngredientesReales({...notif, metadata: {...notif.metadata, codigo_pedido: codigoPedido}})
              }));
            }
          } catch (error) {
            console.error('Error cargando detalles adicionales:', error);
          }
        }, 500);
      }
      
    } catch (error) {
      console.error('Error al abrir modal:', error);
      // Mostrar error en modal
      setPedidoSeleccionado({
        notificacion: notif,
        codigoPedido: '',
        orden: null,
        fecha: formatDate(notif.fecha_creacion),
        estado: 'Error',
        ingredientes: "Error cargando detalles",
        precio: 0
      });
    } finally {
      setModalLoading(false);
    }
  };

  // NUEVA FUNCIÓN: Cerrar modal
  const handleClosePedidoModal = () => {
    setShowPedidoModal(false);
    setPedidoSeleccionado(null);
  };

  // NUEVA FUNCIÓN: Manejar clic en notificación - VERSIÓN SIMPLIFICADA
  const handleNotificationClick = (notif) => {
    console.log(`🖱️ Click en notificación: ${notif.id} - ${notif.tipo}`);
    
    // Solo abrir modal para notificaciones de pedidos
    const tiposConDetalles = ['nuevo_pedido', 'estado_cambiado', 'estado_pedido', 'pedido_cancelado'];
    
    if (tiposConDetalles.includes(notif.tipo)) {
      console.log(`✅ Abriendo modal para pedido`);
      handleOpenPedidoModal(notif);
    } else {
      console.log(`ℹ️ Solo marcando como leída`);
      // Para otros tipos, solo marcar como leída si no lo está
      if (!notif.leida) {
        handleMarkAsRead(notif.id);
      }
    }
  };

  // Función principal para obtener notificaciones
  const fetchNotificaciones = async () => {
    try {
      console.log('\n🔄 ===== INICIANDO CARGA DE NOTIFICACIONES =====');
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));
      
      console.log('📋 Datos del usuario localStorage:', userData);
      console.log('🔑 Token presente:', token ? `Sí (${token.length} caracteres)` : 'No');
      
      if (!token) {
        setError('No hay sesión activa');
        setLoading(false);
        return;
      }
      
      // Obtener user_type
      const userType = userData?.rol === 1 ? 'admin' : 'cliente';
      console.log(`🎭 User Type calculado: ${userType}`);
      
      const url = `${API_BASE_URL}/notificaciones/usuario?user_type=${userType}`;
      console.log(`🌐 URL de petición: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📡 Status response: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Datos recibidos: ${data.notificaciones?.length || 0} notificaciones`);
        
        setNotificaciones(data.notificaciones || []);
        setFilteredNotificaciones(data.notificaciones || []);
        
        // Pre-cargar datos de órdenes para las notificaciones principales
        const notifsPrincipales = data.notificaciones?.slice(0, 5) || [];
        notifsPrincipales.forEach(notif => {
          const codigoPedido = notif.metadata?.codigo_pedido || extractCodigoFromTitulo(notif.titulo);
          if (codigoPedido) {
            fetchOrdenDetails(codigoPedido);
          }
        });
        
      } else if (response.status === 403) {
        setError('No tienes permisos para acceder a las notificaciones.');
      } else if (response.status === 401) {
        setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setError(`Error ${response.status} al obtener notificaciones`);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setError(`Error de conexión: ${error.message}`);
    } finally {
      console.log('✅ Finalizando fetchNotificaciones');
      setLoading(false);
    }
  };

  // Función para obtener usuarios (solo admin)
  const fetchUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/notificaciones/usuarios`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      } else {
        console.error('Error al obtener usuarios:', response.status);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
    }
  };

  // Función para obtener estadísticas (solo admin)
  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/notificaciones/analiticas`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        console.error('Error al obtener analíticas:', response.status);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
    }
  };

  // Función para refrescar notificaciones
  const handleRefresh = async () => {
    console.log('🔄 Refrescando notificaciones...');
    await fetchNotificaciones();
  };

  // FUNCIÓN CORREGIDA: Marcar notificación individual como leída
  const handleMarkAsRead = async (notifId) => {
    try {
      console.log(`\n=== MARCANDO NOTIFICACIÓN ${notifId} COMO LEÍDA ===`);
      
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));
      const currentUserId = userData?.id || userData?.user_id;
      
      console.log('👤 ID Usuario actual:', currentUserId);
      
      // 1. Encontrar la notificación en el array local
      const notificacion = notificaciones.find(n => n.id === notifId);
      if (!notificacion) {
        console.log(`❌ Notificación ${notifId} no encontrada en el array local`);
        return;
      }
      
      console.log('📋 Datos de la notificación:');
      console.log('   - User ID en notificación:', notificacion.user_id);
      console.log('   - User Type:', notificacion.user_type);
      console.log('   - Título:', notificacion.titulo);
      console.log('   - Ya leída?', notificacion.leida);
      
      // 2. PRIMERO: Actualizar SOLO ESA NOTIFICACIÓN en frontend
      console.log('🔄 Actualizando SOLO esta notificación en frontend...');
      const updatedNotificaciones = notificaciones.map(notif => 
        notif.id === notifId ? { ...notif, leida: true } : notif
      );
      setNotificaciones(updatedNotificaciones);
      setFilteredNotificaciones(updatedNotificaciones);
      
      console.log(`✅ Actualizado en frontend: Notificación ${notifId} marcada como leída`);
      
      // 3. SEGUNDO: Intentar sincronizar con backend
      try {
        console.log(`🔄 Intentando sincronizar con backend...`);
        
        const response = await fetch(`${API_BASE_URL}/notificaciones/${notifId}/leer`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          console.log(`✅ Sincronizado con backend`);
        } else {
          console.warn(`⚠️ Error ${response.status} del backend`);
        }
      } catch (backendError) {
        console.warn('⚠️ Error de conexión con backend');
      }
      
      console.log(`=== FIN MARCADO DE NOTIFICACIÓN ${notifId} ===\n`);
      
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      
      // En caso de error, al menos actualizar en frontend
      const updatedNotificaciones = notificaciones.map(notif => 
        notif.id === notifId ? { ...notif, leida: true } : notif
      );
      setNotificaciones(updatedNotificaciones);
      setFilteredNotificaciones(updatedNotificaciones);
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
        notif.metadata?.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
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
      } else {
        alert('Error al eliminar la notificación');
      }
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
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
      console.log('🔄 MARCANDO TODAS LAS NOTIFICACIONES COMO LEÍDAS...');
      
      const token = localStorage.getItem('token');
      const userType = getUserType();
      
      console.log(`👤 User Type para marcar todas: ${userType}`);
      
      // Primero actualizar todas en frontend
      const updatedNotificaciones = notificaciones.map(notif => ({
        ...notif,
        leida: true
      }));
      setNotificaciones(updatedNotificaciones);
      setFilteredNotificaciones(updatedNotificaciones);
      
      console.log('✅ Actualizadas todas en frontend');
      
      // Luego sincronizar con backend
      const response = await fetch(`${API_BASE_URL}/notificaciones/leer-todas?user_type=${userType}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ Todas las notificaciones sincronizadas con backend');
      } else {
        console.warn('⚠️ No se pudo sincronizar todas con el backend');
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
      
      const userType = getUserType();
      
      const response = await fetch(`${API_BASE_URL}/notificaciones/leidas?user_type=${userType}`, {
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
      }
    } catch (error) {
      console.error('Error al eliminar notificaciones leídas:', error);
    }
  };

  // Función para enviar mensaje
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageForm.mensaje.trim()) {
      alert('Por favor escribe un mensaje');
      return;
    }

    try {
      setSendingMessage(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/notificaciones/mensaje`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageForm)
      });

      if (response.ok) {
        const data = await response.json();
        alert(`${data.msg}`);
        
        setMessageForm({
          destinatario_tipo: 'todos',
          destinatario_id: '',
          titulo: 'Mensaje del Restaurante',
          mensaje: ''
        });
        setShowSendModal(false);
        
        fetchNotificaciones();
      } else {
        const errorData = await response.json();
        alert(`${errorData.msg || 'Error al enviar mensaje'}`);
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      alert('Error de conexión al enviar mensaje');
    } finally {
      setSendingMessage(false);
    }
  };

  // Función para formatear fecha (versión alternativa)
  const formatDateAlternative = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para obtener texto del tipo de notificación
  const getNotificationTypeText = (tipo) => {
    switch(tipo) {
      case 'nuevo_pedido':
        return 'Nuevo Pedido';
      case 'estado_cambiado':
        return 'Estado Cambiado';
      case 'estado_pedido':
        return 'Estado Pedido';
      case 'mensaje_admin':
        return 'Mensaje';
      case 'pedido_cancelado':
        return 'Pedido Cancelado';
      case 'ingrediente_inactivo':
        return 'Ingrediente Inactivo';
      case 'ingrediente_no_disponible':
        return 'Ingrediente No Disponible';
      default:
        return tipo;
    }
  };

  // Función para obtener color según tipo
  const getNotificationColor = (tipo) => {
    switch(tipo) {
      case 'nuevo_pedido':
        return '#28a745';
      case 'estado_cambiado':
        return '#007bff';
      case 'estado_pedido':
        return '#17a2b8';
      case 'mensaje_admin':
        return '#6f42c1';
      case 'pedido_cancelado':
        return '#dc3545';
      case 'ingrediente_inactivo':
        return '#ffc107';
      case 'ingrediente_no_disponible':
        return '#fd7e14';
      default:
        return '#666';
    }
  };

  // Función para renderizar notificación
  const renderNotificacion = (notif) => {
    const tiposConDetalles = ['nuevo_pedido', 'estado_cambiado', 'estado_pedido', 'pedido_cancelado'];
    const tieneDetalles = tiposConDetalles.includes(notif.tipo);
    const cursorStyle = tieneDetalles ? 'pointer' : 'default';
    
    return (
      <div 
        key={notif.id} 
        className={`notificacion-item ${notif.leida ? 'leida' : 'no-leida'}`}
        style={{ 
          borderLeftColor: getNotificationColor(notif.tipo),
          cursor: cursorStyle
        }}
        onClick={() => {
          console.log(`📱 Click en notificación: ${notif.id}`);
          handleNotificationClick(notif);
        }}
      >
        <div className="notificacion-header">
          <div className="notificacion-icon">
            <div className="notification-type-indicator" style={{ backgroundColor: getNotificationColor(notif.tipo) }}></div>
          </div>
          <div className="notificacion-info">
            <h4 className="notificacion-titulo">{notif.titulo}</h4>
            <div className="notificacion-meta">
              <span className="notificacion-tipo">
                {getNotificationTypeText(notif.tipo)}
              </span>
              <span className="notificacion-fecha">
                {formatDate(notif.fecha_creacion)}
              </span>
              {notif.hace_cuanto && (
                <span className="notificacion-timeago">
                  ({notif.hace_cuanto})
                </span>
              )}
            </div>
          </div>
          <div className="notificacion-actions">
            {!notif.leida && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(`🎯 Click en marcar como leída - ID: ${notif.id}`);
                  handleMarkAsRead(notif.id);
                }}
                className="action-btn mark-read-btn"
                title="Marcar como leída"
                disabled={loading}
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                ✓
              </button>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(notif.id, notif.titulo);
              }}
              className="action-btn delete-btn"
              title="Eliminar notificación"
              disabled={loading}
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img 
                src={deleteIcon} 
                alt="Eliminar" 
                style={{
                  width: '16px',
                  height: '16px',
                  filter: 'invert(1)'
                }} 
              />
            </button>
          </div>
        </div>
        
        <div className="notificacion-mensaje">
          {notif.mensaje}
        </div>
        
        {notif.metadata && Object.keys(notif.metadata).length > 0 && (
          <div className="notificacion-metadata">
            {notif.metadata.codigo_pedido && (
              <div className="metadata-item">
                <span className="metadata-label">Pedido:</span>
                <span className="metadata-value">{notif.metadata.codigo_pedido}</span>
              </div>
            )}
            {notif.metadata.cliente_nombre && (
              <div className="metadata-item">
                <span className="metadata-label">Cliente:</span>
                <span className="metadata-value">{notif.metadata.cliente_nombre}</span>
              </div>
            )}
            {notif.metadata.precio && (
              <div className="metadata-item">
                <span className="metadata-label">Precio:</span>
                <span className="metadata-value">${parseFloat(notif.metadata.precio).toFixed(2)}</span>
              </div>
            )}
            {notif.metadata.estado_nuevo && (
              <div className="metadata-item">
                <span className="metadata-label">Estado:</span>
                <span className="metadata-value">{notif.metadata.estado_nuevo}</span>
              </div>
            )}
            {notif.metadata.remitente && (
              <div className="metadata-item">
                <span className="metadata-label">De:</span>
                <span className="metadata-value">{notif.metadata.remitente}</span>
              </div>
            )}
            {notif.metadata.ingrediente_no_disponible && (
              <div className="metadata-item">
                <span className="metadata-label">Ingrediente:</span>
                <span className="metadata-value">{notif.metadata.ingrediente_no_disponible}</span>
              </div>
            )}
            {notif.metadata.ingrediente_nombre && (
              <div className="metadata-item">
                <span className="metadata-label">Ingrediente:</span>
                <span className="metadata-value">{notif.metadata.ingrediente_nombre}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Indicador visual para notificaciones clickeables */}
        {tieneDetalles && !notif.leida && (
          <div className="click-indicator">
            <span className="click-hint">Haz clic para ver detalles</span>
          </div>
        )}
      </div>
    );
  };

  // Renderizar estado de carga inicial
  if (loading && notificaciones.length === 0) {
    return (
      <div className={`notificaciones-container ${darkMode ? 'dark-mode' : ''}`}>
        <div className="loading-spinner"></div>
        <p style={{textAlign: 'center', color: darkMode ? '#e2e8f0' : '#666'}}>
          Cargando notificaciones...
        </p>
      </div>
    );
  }

  // Renderizar error
  if (error) {
    return (
      <div className={`notificaciones-container ${darkMode ? 'dark-mode' : ''}`}>
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button 
            className="retry-btn"
            onClick={fetchNotificaciones}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`notificaciones-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="notificaciones-content">
        
        {/* Header con título y botones */}
        <div className="section-header">
          <h3>Notificaciones</h3>
          <div className="header-buttons">
            <button 
              className="refresh-btn"
              onClick={handleRefresh}
              title="Actualizar notificaciones"
              disabled={loading}
            >
              <img 
                src={refreshIcon} 
                alt="Actualizar" 
                className={`btn-icon-img-actualizar ${loading ? 'spinning' : ''}`} 
              />
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
            
            <button 
              className="mark-read-btn"
              onClick={handleMarkAllAsRead}
              title="Marcar todas como leídas"
              disabled={notificaciones.every(n => n.leida) || loading}
            >
              <img src={readIcon} alt="Marcar leídas" className="btn-icon-img" />
              Marcar Todas Leídas
            </button>
            
            {userRole === 1 && (
              <>
                <button 
                  className="delete-read-btn"
                  onClick={handleDeleteAllRead}
                  title="Eliminar notificaciones leídas"
                  disabled={notificaciones.every(n => !n.leida) || loading}
                >
                  <img src={deleteIcon} alt="Eliminar leídas" className="btn-icon-img" />
                  Eliminar Leídas
                </button>
                
                <button 
                  className="send-message-btn"
                  onClick={() => setShowSendModal(true)}
                  title="Enviar mensaje a usuarios"
                  disabled={loading}
                >
                  <img src={sendIcon} alt="Enviar" className="btn-icon-img" />
                  Enviar Mensaje
                </button>
                
                <button 
                  className="analytics-btn"
                  onClick={() => setShowAnalyticsModal(true)}
                  title="Ver estadísticas"
                  disabled={loading}
                >
                  <img src={statsIcon} alt="Estadísticas" className="btn-icon-img" />
                  Estadísticas
                </button>
              </>
            )}
          </div>
        </div>

        {/* Buscador y Filtros */}
        <div className="search-section">
          <div className="filters-row">
            <div className="search-container main-search">
              <input
                type="text"
                placeholder="Buscar en notificaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                disabled={loading}
              />
              {searchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchTerm('')}
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="filter-group">
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="filter-select"
                disabled={loading}
              >
                <option value="">Todos los tipos</option>
                <option value="nuevo_pedido">Nuevos Pedidos</option>
                <option value="estado_cambiado">Cambios de Estado</option>
                <option value="estado_pedido">Estado de Pedidos</option>
                <option value="mensaje_admin">Mensajes</option>
                <option value="pedido_cancelado">Pedidos Cancelados</option>
                <option value="ingrediente_no_disponible">Ingrediente No Disponible</option>
                <option value="ingrediente_inactivo">Ingrediente Inactivo</option>
              </select>
            </div>

            <div className="filter-group">
              <select 
                value={readFilter} 
                onChange={(e) => setReadFilter(e.target.value)}
                className="filter-select"
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
        <div className="notifications-counter">
          <span className="counter-total">
            Total: <strong>{notificaciones.length}</strong>
          </span>
          <span className="counter-unread">
            No leídas: <strong>{notificaciones.filter(n => !n.leida).length}</strong>
          </span>
          <span className="counter-role">
            Rol: <strong>{userRole === 1 ? 'Administrador' : 'Cliente'}</strong>
          </span>
        </div>

        {/* Lista de notificaciones */}
        <div className="notificaciones-list-container">
          {loading && notificaciones.length > 0 && (
            <div className="list-loading-overlay">
              <div className="loading-spinner small"></div>
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
            <div className="no-notificaciones">
              {loading ? 'Cargando notificaciones...' : 
               searchTerm || typeFilter || readFilter ? 
                 'No se encontraron notificaciones con esos criterios' : 
                 'No hay notificaciones disponibles'
              }
              {!loading && notificaciones.length === 0 && (
                <p style={{ fontSize: '14px', color: darkMode ? '#94a3b8' : '#64748b', marginTop: '10px' }}>
                  Las notificaciones aparecerán aquí cuando recibas nuevos pedidos, 
                  haya cambios en tus pedidos o recibas mensajes del restaurante.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Paginación */}
        {filteredNotificaciones.length > notificacionesPerPage && (
          <div className="pagination-container">
            <div className="pagination-controls">
              <button 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1 || loading}
                className="pagination-btn prev-btn"
              >
                Anterior
              </button>
              
              <div className="pagination-numbers">
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
                        {showEllipsis && <span className="pagination-ellipsis">...</span>}
                        <button
                          onClick={() => paginate(number)}
                          className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
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
                className="pagination-btn next-btn"
              >
                Siguiente
              </button>
            </div>

            <div className="notificaciones-count-info">
              Mostrando {currentNotificaciones.length} de {filteredNotificaciones.length} notificaciones
            </div>
          </div>
        )}

        {filteredNotificaciones.length <= notificacionesPerPage && filteredNotificaciones.length > 0 && (
          <div className="notificaciones-count-info">
            Mostrando {currentNotificaciones.length} de {filteredNotificaciones.length} notificaciones
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        {showDeleteConfirm && (
          <div className="modal-overlay-delete">
            <div className="modal-content confirm-modal">
              <div className="confirm-header">
                <h3>¿Eliminar Notificación?</h3>
              </div>
              <div className="confirm-body">
                <p className="confirm-message">
                  ¿Estás seguro de que quieres eliminar la notificación:
                  <strong> "{notificationToDelete?.titulo}"</strong>?
                </p>
                <p className="confirm-warning">
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="confirm-actions">
                <button 
                  className="confirm-btn cancel-btn"
                  onClick={handleDeleteCancel}
                >
                  Cancelar
                </button>
                <button 
                  className="confirm-btn delete-confirm-btn"
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
          <div className="modal-overlay-pedido">
            <div className="modal-content large-modal pedido-modal">
              <div className="modal-header">
                <h3>Detalles del Pedido</h3>
                <button 
                  className="close-modal" 
                  onClick={handleClosePedidoModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: darkMode ? '#e2e8f0' : '#333'
                  }}
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                {modalLoading ? (
                  <div className="pedido-loading">
                    <div className="loading-spinner small"></div>
                    <p>Cargando información del pedido...</p>
                  </div>
                ) : pedidoSeleccionado ? (
                  <>
                    <div className="pedido-codigo-container">
                      <div className="pedido-codigo-label">Código del Pedido:</div>
                      <div className="pedido-codigo-value">
                        {pedidoSeleccionado.codigoPedido || "N/A"}
                      </div>
                    </div>
                    
                    <div className="pedido-info-grid">
                      <div className="pedido-info-item">
                        <span className="pedido-info-label">Fecha:</span>
                        <span className="pedido-info-value">
                          {pedidoSeleccionado.fecha}
                        </span>
                      </div>
                      
                      <div className="pedido-info-item">
                        <span className="pedido-info-label">Estado:</span>
                        <span className="pedido-info-value estado-pedido">
                          {pedidoSeleccionado.estado}
                        </span>
                      </div>
                      
                      {pedidoSeleccionado.precio > 0 && (
                        <div className="pedido-info-item">
                          <span className="pedido-info-label">Total:</span>
                          <span className="pedido-info-value precio">
                            ${parseFloat(pedidoSeleccionado.precio).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pedido-detalles">
                      <h4>Detalles del Pedido:</h4>
                      
                      {pedidoSeleccionado.orden ? (
                        <div className="pedido-detalles-content">
                          <div className="pedido-detalle-item">
                            <strong>Tipo:</strong> 
                            <span>{pedidoSeleccionado.orden.tipo_pedido === 'personalizado' ? 'Personalizado' : 'Especial'}</span>
                          </div>
                          
                          <div className="pedido-detalle-item">
                            <strong>
                              {pedidoSeleccionado.orden.tipo_pedido === 'personalizado' ? 'Ingredientes:' : 'Especial:'}
                            </strong>
                            <span>{pedidoSeleccionado.ingredientes}</span>
                          </div>
                          
                          {pedidoSeleccionado.orden.tipo_pedido === 'personalizado' && pedidoSeleccionado.orden.ingredientes_personalizados && (
                            <div className="pedido-ingredientes">
                              <strong>Ingredientes solicitados:</strong>
                              <p>{pedidoSeleccionado.orden.ingredientes_personalizados}</p>
                            </div>
                          )}
                          
                          {pedidoSeleccionado.orden.tipo_pedido === 'especial' && pedidoSeleccionado.orden.especial_descripcion && (
                            <div className="pedido-especial-desc">
                              <strong>Descripción:</strong>
                              <p>{pedidoSeleccionado.orden.especial_descripcion}</p>
                            </div>
                          )}
                          
                          <div className="pedido-cliente-info">
                            <h5>Información del Cliente:</h5>
                            <div className="pedido-detalle-item">
                              <strong>Nombre:</strong>
                              <span>{pedidoSeleccionado.orden.nombre_usuario || 'No disponible'}</span>
                            </div>
                            {pedidoSeleccionado.orden.telefono_usuario && (
                              <div className="pedido-detalle-item">
                                <strong>Teléfono:</strong>
                                <span>{pedidoSeleccionado.orden.telefono_usuario}</span>
                              </div>
                            )}
                            {pedidoSeleccionado.orden.direccion_usuario && (
                              <div className="pedido-detalle-item">
                                <strong>Dirección:</strong>
                                <span>{pedidoSeleccionado.orden.direccion_usuario}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="pedido-no-detalles">
                          <p>No se encontraron detalles adicionales del pedido.</p>
                          <p className="pedido-mensaje">
                            <strong>Mensaje:</strong> {pedidoSeleccionado.notificacion?.mensaje}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="pedido-mensaje-container">
                      <h4>Mensaje:</h4>
                      <div className="pedido-mensaje-content">
                        {pedidoSeleccionado.notificacion?.mensaje}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="pedido-error">
                    <p>Error al cargar los detalles del pedido.</p>
                    <button 
                      onClick={handleClosePedidoModal}
                      className="pedido-btn-cerrar"
                    >
                      Cerrar
                    </button>
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button 
                  onClick={handleClosePedidoModal}
                  className="btn btn-secondary"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para enviar mensaje */}
        {showSendModal && (
          <div className="modal-overlay">
            <div className="modal-content large-modal">
              <div className="modal-header">
                <h3>Enviar Mensaje a Usuarios</h3>
                <button 
                  className="close-modal" 
                  onClick={() => setShowSendModal(false)}
                  disabled={sendingMessage}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSendMessage}>
                  <div className="form-group">
                    <label htmlFor="destinatario_tipo">Tipo de Destinatario</label>
                    <select
                      id="destinatario_tipo"
                      value={messageForm.destinatario_tipo}
                      onChange={(e) => setMessageForm({
                        ...messageForm,
                        destinatario_tipo: e.target.value,
                        destinatario_id: e.target.value === 'todos' ? '' : messageForm.destinatario_id
                      })}
                      className="form-select"
                      disabled={sendingMessage}
                    >
                      <option value="todos">Todos los Usuarios</option>
                      <option value="cliente">Cliente Específico</option>
                      <option value="admin">Administrador Específico</option>
                      <option value="todos_admins">Todos los Administradores</option>
                    </select>
                  </div>

                  {(messageForm.destinatario_tipo === 'cliente' || messageForm.destinatario_tipo === 'admin') && (
                    <div className="form-group">
                      <label htmlFor="destinatario_id">
                        {messageForm.destinatario_tipo === 'cliente' ? 'Seleccionar Cliente' : 'Seleccionar Administrador'}
                      </label>
                      <select
                        id="destinatario_id"
                        value={messageForm.destinatario_id}
                        onChange={(e) => setMessageForm({
                          ...messageForm,
                          destinatario_id: e.target.value
                        })}
                        className="form-select"
                        required={messageForm.destinatario_tipo === 'cliente' || messageForm.destinatario_tipo === 'admin'}
                        disabled={sendingMessage}
                      >
                        <option value="">Seleccionar...</option>
                        {usuarios
                          .filter(user => 
                            messageForm.destinatario_tipo === 'cliente' ? user.role === 2 : user.role === 1
                          )
                          .map(user => (
                            <option key={user.id} value={user.id}>
                              {user.nombre} ({user.email || user.telefono})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="titulo">Título del Mensaje</label>
                    <input
                      type="text"
                      id="titulo"
                      value={messageForm.titulo}
                      onChange={(e) => setMessageForm({
                        ...messageForm,
                        titulo: e.target.value
                      })}
                      className="form-input"
                      required
                      disabled={sendingMessage}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="mensaje">Mensaje</label>
                    <textarea
                      id="mensaje"
                      value={messageForm.mensaje}
                      onChange={(e) => setMessageForm({
                        ...messageForm,
                        mensaje: e.target.value
                      })}
                      className="form-textarea"
                      rows="5"
                      required
                      disabled={sendingMessage}
                      placeholder="Escribe tu mensaje aquí..."
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowSendModal(false)}
                      disabled={sendingMessage}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={sendingMessage}
                    >
                      {sendingMessage ? 'Enviando...' : 'Enviar Mensaje'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de estadísticas */}
        {showAnalyticsModal && (
          <div className="modal-overlay">
            <div className="modal-content large-modal">
              <div className="modal-header">
                <h3>Estadísticas de Notificaciones</h3>
                <button 
                  className="close-modal" 
                  onClick={() => setShowAnalyticsModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                {analyticsData ? (
                  <div className="analytics-content">
                    <div className="analytics-grid">
                      <div className="analytics-card">
                        <h4>Resumen General</h4>
                        <div className="analytics-stats">
                          <div className="stat-item">
                            <span className="stat-value">{analyticsData.total_notificaciones}</span>
                            <span className="stat-label">Total Notificaciones</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-value">{analyticsData.no_leidas}</span>
                            <span className="stat-label">No Leídas</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-value">{analyticsData.tasa_lectura?.toFixed(1) || '0'}%</span>
                            <span className="stat-label">Tasa de Lectura</span>
                          </div>
                        </div>
                      </div>

                      {analyticsData.distribucion_tipos && (
                        <div className="analytics-card">
                          <h4>Distribución por Tipo</h4>
                          <div className="analytics-list">
                            {Object.entries(analyticsData.distribucion_tipos).map(([tipo, count]) => (
                              <div key={tipo} className="analytics-item">
                                <span className="analytics-item-text">{getNotificationTypeText(tipo)}</span>
                                <span className="analytics-item-count">{count} notificaciones</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {analyticsData.estadisticas_diarias && (
                        <div className="analytics-card">
                          <h4>Actividad por Día</h4>
                          <div className="analytics-list">
                            {analyticsData.estadisticas_diarias.map((estadistica, index) => (
                              <div key={index} className="analytics-item">
                                <span className="analytics-item-text">{estadistica.fecha}</span>
                                <span className="analytics-item-count">{estadistica.count} notificaciones</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="loading-analytics">
                    <div className="loading-spinner small"></div>
                    <p>Cargando estadísticas...</p>
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAnalyticsModal(false)}
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={fetchAnalytics}
                  >
                    Actualizar Estadísticas
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notificaciones;