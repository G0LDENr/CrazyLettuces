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
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageForm, setMessageForm] = useState({
    destinatario_tipo: 'todos',
    destinatario_id: '',
    titulo: 'Mensaje del Restaurante',
    mensaje: ''
  });
  
  const notificacionesPerPage = 10;
  const API_BASE_URL = 'http://127.0.0.1:5000';

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  useEffect(() => {
    if (showSendModal) {
      fetchUsuarios();
    }
  }, [showSendModal]);

  useEffect(() => {
    if (showAnalyticsModal) {
      fetchAnalytics();
    }
  }, [showAnalyticsModal]);

  const fetchNotificaciones = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/notificaciones/usuario`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Respuesta de notificaciones:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        setNotificaciones(data.notificaciones || []);
        setFilteredNotificaciones(data.notificaciones || []);
      } else if (response.status === 403) {
        setError('No tienes permisos para acceder a las notificaciones. Esta sección es solo para administradores.');
      } else if (response.status === 401) {
        setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else {
        setError(`Error ${response.status} al obtener notificaciones`);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

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

  const handleRefresh = () => {
    fetchNotificaciones();
  };

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

  const indexOfLastNotif = currentPage * notificacionesPerPage;
  const indexOfFirstNotif = indexOfLastNotif - notificacionesPerPage;
  const currentNotificaciones = filteredNotificaciones.slice(indexOfFirstNotif, indexOfLastNotif);
  const totalPages = Math.ceil(filteredNotificaciones.length / notificacionesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDeleteClick = (notifId, notifTitulo) => {
    setNotificationToDelete({ id: notifId, titulo: notifTitulo });
    setShowDeleteConfirm(true);
  };

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

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setNotificationToDelete(null);
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/notificaciones/${notifId}/leer`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const updatedNotificaciones = notificaciones.map(notif => 
          notif.id === notifId ? { ...notif, leida: true } : notif
        );
        setNotificaciones(updatedNotificaciones);
        setFilteredNotificaciones(updatedNotificaciones);
      }
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/notificaciones/leer-todas`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const updatedNotificaciones = notificaciones.map(notif => ({
          ...notif,
          leida: true
        }));
        setNotificaciones(updatedNotificaciones);
        setFilteredNotificaciones(updatedNotificaciones);
      }
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  const handleDeleteAllRead = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar todas las notificaciones leídas?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/notificaciones/leidas`, {
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (tipo) => {
    switch(tipo) {
      case 'nuevo_pedido':
        return '';
      case 'estado_cambiado':
        return '';
      case 'estado_pedido':
        return '';
      case 'mensaje_admin':
        return '';
      case 'pedido_cancelado':
        return '';
      default:
        return '';
    }
  };

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
      default:
        return tipo;
    }
  };

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
      default:
        return '#666';
    }
  };

  if (loading && notificaciones.length === 0) {
    return (
      <div className={`notificaciones-container ${darkMode ? 'dark-mode' : ''}`}>
        <div className="loading-spinner"></div>
        <p style={{textAlign: 'center', color: darkMode ? '#e2e8f0' : '#666'}}>Cargando notificaciones...</p>
      </div>
    );
  }

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
          <h3>Panel de Notificaciones</h3>
          <div className="header-buttons">
            <button 
              className="refresh-btn"
              onClick={handleRefresh}
              title="Actualizar notificaciones"
              disabled={loading}
            >
              <img src={refreshIcon} alt="Actualizar" className="btn-icon-img-actualizar" />
            </button>
            
            <button 
              className="mark-read-btn"
              onClick={handleMarkAllAsRead}
              title="Marcar todas como leídas"
              disabled={notificaciones.every(n => n.leida)}
            >
              <img src={readIcon} alt="Marcar leídas" className="btn-icon-img" />
              Marcar Todas Leídas
            </button>
            
            <button 
              className="delete-read-btn"
              onClick={handleDeleteAllRead}
              title="Eliminar notificaciones leídas"
              disabled={notificaciones.every(n => !n.leida)}
            >
              <img src={deleteIcon} alt="Eliminar leídas" className="btn-icon-img" />
              Eliminar Leídas
            </button>
            
            <button 
              className="send-message-btn"
              onClick={() => setShowSendModal(true)}
              title="Enviar mensaje a usuarios"
            >
              <img src={sendIcon} alt="Enviar" className="btn-icon-img" />
              Enviar Mensaje
            </button>
            
            <button 
              className="analytics-btn"
              onClick={() => setShowAnalyticsModal(true)}
              title="Ver estadísticas"
            >
              <img src={statsIcon} alt="Estadísticas" className="btn-icon-img" />
              Estadísticas
            </button>
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
              >
                <option value="">Todos los tipos</option>
                <option value="nuevo_pedido">Nuevos Pedidos</option>
                <option value="estado_cambiado">Cambios de Estado</option>
                <option value="estado_pedido">Estado de Pedidos</option>
                <option value="mensaje_admin">Mensajes</option>
                <option value="pedido_cancelado">Pedidos Cancelados</option>
              </select>
            </div>

            <div className="filter-group">
              <select 
                value={readFilter} 
                onChange={(e) => setReadFilter(e.target.value)}
                className="filter-select"
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
        </div>

        {/* Lista de notificaciones */}
        <div className="notificaciones-list-container">
          {currentNotificaciones.length > 0 ? (
            currentNotificaciones.map(notif => (
              <div 
                key={notif.id} 
                className={`notificacion-item ${notif.leida ? 'leida' : 'no-leida'}`}
                style={{ borderLeftColor: getNotificationColor(notif.tipo) }}
              >
                <div className="notificacion-header">
                  <div className="notificacion-icon">
                    {getNotificationIcon(notif.tipo)}
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
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="action-btn mark-read-btn"
                        title="Marcar como leída"
                      >
                        ✓
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteClick(notif.id, notif.titulo)}
                      className="action-btn delete-btn"
                      title="Eliminar notificación"
                    >
                      <img src={deleteIcon} alt="Eliminar" className="action-icon" />
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
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-notificaciones">
              {searchTerm || typeFilter || readFilter 
                ? 'No se encontraron notificaciones con esos criterios' 
                : 'No hay notificaciones disponibles'
              }
            </div>
          )}
        </div>

        {/* Paginación */}
        {filteredNotificaciones.length > notificacionesPerPage && (
          <div className="pagination-container">
            <div className="pagination-controls">
              <button 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1}
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
                        >
                          {number}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>
              
              <button 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages}
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
                <div className="confirm-icon"></div>
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
                    </select>
                  </div>

                  {messageForm.destinatario_tipo === 'cliente' && (
                    <div className="form-group">
                      <label htmlFor="destinatario_id">Seleccionar Cliente</label>
                      <select
                        id="destinatario_id"
                        value={messageForm.destinatario_id}
                        onChange={(e) => setMessageForm({
                          ...messageForm,
                          destinatario_id: e.target.value
                        })}
                        className="form-select"
                        required={messageForm.destinatario_tipo === 'cliente'}
                        disabled={sendingMessage}
                      >
                        <option value="">Seleccionar cliente...</option>
                        {usuarios
                          .filter(user => user.role === 2)
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
                            <span className="stat-value">{analyticsData.tasa_lectura.toFixed(1)}%</span>
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
                          <h4>Actividad por Día (Últimos 7 días)</h4>
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

                      <div className="analytics-card">
                        <h4>Información del Análisis</h4>
                        <div className="analytics-info">
                          <p>Período analizado: {analyticsData.periodo_analizado}</p>
                          <p>Última actualización: {new Date().toLocaleDateString('es-MX')}</p>
                        </div>
                      </div>
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