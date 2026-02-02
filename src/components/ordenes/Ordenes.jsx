import React, { useEffect, useState } from 'react';
import CreateOrdenForm from '../../components/ordenes/create-ordenes';
import EditOrdenForm from '../../components/ordenes/edit-ordenes';
import VerificarCodigo from '../../components/ordenes/verificar-codigo';
import { useConfig } from '../../context/config';
import '../../css/ordenes.css';

import editIcon from '../../img/edit.png';
import deleteIcon from '../../img/delete.png';
import verifyIcon from '../../img/verify.png';
import refreshIcon from '../../img/actualizar.png';

const Ordenes = () => {
  const { darkMode } = useConfig();
  const [ordenes, setOrdenes] = useState([]);
  const [filteredOrdenes, setFilteredOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState(null);
  const [ordenToDelete, setOrdenToDelete] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [deleteDetail, setDeleteDetail] = useState('');
  const [deleteType, setDeleteType] = useState('');
  const ordenesPerPage = 7;

  useEffect(() => {
    fetchOrdenes();
  }, []);

  const fetchOrdenes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://127.0.0.1:5000/ordenes/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        const ordenesWithSimpleIds = data.map((orden, index) => ({
          ...orden,
          simpleId: index + 1
        }));
        
        setOrdenes(ordenesWithSimpleIds);
        setFilteredOrdenes(ordenesWithSimpleIds);
      } else {
        console.error('Error al obtener órdenes:', response.status);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchOrdenes();
  };

  useEffect(() => {
    let filtered = ordenes;

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(orden => 
        orden.simpleId.toString().includes(searchTerm) || 
        orden.id.toString().includes(searchTerm) ||
        orden.codigo_unico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orden.nombre_usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orden.telefono_usuario?.includes(searchTerm)
      );
    }

    if (statusFilter !== '') {
      filtered = filtered.filter(orden => orden.estado === statusFilter);
    }
    
    setFilteredOrdenes(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, ordenes]);

  const indexOfLastOrden = currentPage * ordenesPerPage;
  const indexOfFirstOrden = indexOfLastOrden - ordenesPerPage;
  const currentOrdenes = filteredOrdenes.slice(indexOfFirstOrden, indexOfLastOrden);
  const totalPages = Math.ceil(filteredOrdenes.length / ordenesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDeleteClick = (orden) => {
    setOrdenToDelete({ 
      id: orden.id, 
      nombre: orden.nombre_usuario,
      estado: orden.estado,
      codigo: orden.codigo_unico
    });
    setShowDeleteConfirm(true);
    setDeleteMessage('');
    setDeleteDetail('');
    setDeleteType('');
  };

  const handleDeleteConfirm = async () => {
    if (!ordenToDelete) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('Eliminando orden ID:', ordenToDelete.id, 'Estado:', ordenToDelete.estado);
      
      const response = await fetch(`http://127.0.0.1:5000/ordenes/${ordenToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { 
          msg: 'Error inesperado del servidor',
          tipo: 'error'
        };
      }
      
      console.log('Respuesta del servidor:', responseData);
      
      if (response.ok) {
        if (responseData.tipo === 'eliminacion_exitosa') {
          // Eliminación física exitosa - eliminar de la lista
          const updatedOrdenes = ordenes.filter(orden => orden.id !== ordenToDelete.id);
          
          const ordenesWithSimpleIds = updatedOrdenes.map((orden, index) => ({
            ...orden,
            simpleId: index + 1
          }));
          
          setOrdenes(ordenesWithSimpleIds);
          setFilteredOrdenes(ordenesWithSimpleIds);
          
          setDeleteMessage('Orden eliminada permanentemente');
          setDeleteDetail(responseData.detalle || '');
          setDeleteType('success');
        } 
        else if (responseData.tipo === 'marcada_como_eliminada') {
          // Solo se pudo marcar como eliminada (fallback)
          const updatedOrdenes = ordenes.map(orden => 
            orden.id === ordenToDelete.id 
              ? { 
                  ...orden, 
                  estado: 'cancelado',
                  nombre_usuario: `${orden.nombre_usuario} [ELIMINADO]`,
                  telefono_usuario: '0000000000'
                }
              : orden
          );
          
          const ordenesWithSimpleIds = updatedOrdenes.map((orden, index) => ({
            ...orden,
            simpleId: index + 1
          }));
          
          setOrdenes(ordenesWithSimpleIds);
          setFilteredOrdenes(ordenesWithSimpleIds);
          
          setDeleteMessage('⚠️ Orden marcada como eliminada (no se pudo borrar físicamente)');
          setDeleteDetail(responseData.detalle || '');
          setDeleteType('warning');
        }
        else {
          // Respuesta genérica exitosa
          setDeleteMessage(responseData.msg || 'Orden eliminada');
          setDeleteDetail('');
          setDeleteType('success');
          
          // Actualizar lista de todos modos
          fetchOrdenes();
        }
        
      } else {
        // Error del servidor
        setDeleteMessage(responseData.msg || '❌ Error al eliminar la orden');
        setDeleteDetail(responseData.detalle || '');
        setDeleteType('error');
      }
      
      // Cerrar el modal después de 3 segundos si fue exitoso
      if (response.ok) {
        setTimeout(() => {
          setShowDeleteConfirm(false);
          setOrdenToDelete(null);
          setDeleteMessage('');
          setDeleteDetail('');
          setDeleteType('');
        }, 3000);
      }
      
    } catch (error) {
      console.error('Error:', error);
      setDeleteMessage('❌ Error de conexión con el servidor');
      setDeleteDetail('No se pudo comunicar con el servidor');
      setDeleteType('error');
      
      setTimeout(() => {
        setDeleteMessage('');
        setDeleteDetail('');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setOrdenToDelete(null);
    setDeleteMessage('');
    setDeleteDetail('');
    setDeleteType('');
  };

  const handleEdit = (orden) => {
    setSelectedOrden(orden);
    setShowEditModal(true);
  };

  const handleAddOrden = () => {
    setShowCreateModal(true);
  };

  const handleVerifyCode = () => {
    setShowVerifyModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedOrden(null);
  };

  const closeVerifyModal = () => {
    setShowVerifyModal(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const getStatusBadge = (estado) => {
    const statusConfig = {
      pendiente: { class: 'pending', text: 'Pendiente' },
      preparando: { class: 'preparing', text: 'Preparando' },
      listo: { class: 'ready', text: 'Listo' },
      entregado: { class: 'delivered', text: 'Entregado' },
      cancelado: { class: 'cancelled', text: 'Cancelado' }
    };
    
    const config = statusConfig[estado] || { class: 'pending', text: estado };
    
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  if (loading && ordenes.length === 0) {
    return (
      <div className={`ordenes-container ${darkMode ? 'dark-mode' : ''}`}>
        <div className="loading-spinner"></div>
        <p style={{textAlign: 'center', color: darkMode ? '#e2e8f0' : '#666'}}>Cargando órdenes...</p>
      </div>
    );
  }

  return (
    <div className={`ordenes-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="ordenes-content">
        
        {/* Header con título y botones */}
        <div className="section-header">
          <h3>Gestión de Órdenes</h3>
          <div className="header-buttons">
            <button 
              className="verify-code-btn"
              onClick={handleRefresh}
              title="Actualizar lista"
              disabled={loading}
            >
              <img src={refreshIcon} alt="Actualizar" className="btn-icon-img-actualizar" />
            </button>
            <button 
              className="verify-code-btn"
              onClick={handleVerifyCode}
              title="Verificar código de orden"
            >
              <img src={verifyIcon} alt="Verificar" className="btn-icon-img" />
              Verificar Código
            </button>
            <button 
              className="add-orden-btn"
              onClick={handleAddOrden}
              title="Agregar nueva orden"
            >
              <span className="btn-icon">+</span>
              Nueva Orden
            </button>
          </div>
        </div>

        {/* Buscador y Filtros */}
        <div className="search-section">
          <div className="filters-row">
            <div className="search-container main-search">
              <input
                type="text"
                placeholder="Buscar por código, nombre o teléfono..."
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
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="preparando">Preparando</option>
                <option value="listo">Listo</option>
                <option value="entregado">Entregado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de órdenes */}
        <div className="ordenes-table-container">
          <table className="ordenes-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Código</th>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Tipo</th>
                <th>Pedido</th>
                <th>Precio</th>
                <th>Estado</th>
                <th className="actions-header">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentOrdenes.length > 0 ? (
                currentOrdenes.map(orden => (
                  <tr key={orden.id}>
                    <td className="orden-id">{orden.simpleId}</td>
                    <td className="orden-codigo">
                      <strong>{orden.codigo_unico}</strong>
                    </td>
                    <td className="orden-cliente">{orden.nombre_usuario || 'N/A'}</td>
                    <td className="orden-telefono">{orden.telefono_usuario || 'N/A'}</td>
                    <td className="orden-tipo">
                      <span className={`tipo-badge ${orden.tipo_pedido}`}>
                        {orden.tipo_pedido === 'especial' ? 'Especial' : 'Personalizado'}
                      </span>
                    </td>
                    <td className="orden-pedido">
                      {orden.tipo_pedido === 'especial' ? (
                        orden.especial ? orden.especial.nombre : 'N/A'
                      ) : (
                        <span title={orden.ingredientes_personalizados}>
                          {orden.ingredientes_personalizados ? 
                            (orden.ingredientes_personalizados.length > 30 
                              ? `${orden.ingredientes_personalizados.substring(0, 30)}...` 
                              : orden.ingredientes_personalizados
                            ) : 'N/A'
                          }
                        </span>
                      )}
                    </td>
                    <td className="orden-price">{formatPrice(orden.precio)}</td>
                    <td className="orden-status">
                      {getStatusBadge(orden.estado)}
                    </td>
                    <td className="actions-cell">
                      <div className="actions-buttons">
                        <button 
                          onClick={() => handleEdit(orden)}
                          className="action-btn edit-btn"
                          title="Editar orden"
                          disabled={orden.estado === 'entregado' || orden.estado === 'cancelado'}
                        >
                          <img src={editIcon} alt="Editar" className="action-icon" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(orden)}
                          className="action-btn delete-btn"
                          title="Eliminar orden permanentemente"
                        >
                          <img src={deleteIcon} alt="Eliminar" className="action-icon" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="no-results">
                    {searchTerm || statusFilter ? 'No se encontraron órdenes con esos criterios' : 'No hay órdenes registradas'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Paginación */}
          {filteredOrdenes.length > ordenesPerPage && (
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

              <div className="ordenes-count-info">
                Mostrando {currentOrdenes.length} de {filteredOrdenes.length} órdenes
              </div>
            </div>
          )}

          {filteredOrdenes.length <= ordenesPerPage && filteredOrdenes.length > 0 && (
            <div className="ordenes-count-info">
              Mostrando {currentOrdenes.length} de {filteredOrdenes.length} órdenes
            </div>
          )}
        </div>

        {/* Modal de confirmación de eliminación DIRECTA */}
        {showDeleteConfirm && (
          <div className="modal-overlay-delete">
            <div className="modal-content confirm-modal direct-modal">
              <div className="confirm-header">
                <h3>Eliminar Orden Permanentemente</h3>
              </div>
              <div className="confirm-body">
                {deleteMessage ? (
                  <div className={`message-container ${deleteType}`}>
                    <div className="message-icon">
                      {deleteType === 'success' ? '' : 
                       deleteType === 'warning' ? '' : ''}
                    </div>
                    <p className="message-text">{deleteMessage}</p>
                    {deleteDetail && (
                      <p className="message-detail">{deleteDetail}</p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="warning-box">
                      <div className="warning-icon"></div>
                      <div className="warning-content">
                        <p><strong>¿Eliminar esta orden PERMANENTEMENTE?</strong></p>
                        <p>Esta acción <strong>NO</strong> se puede deshacer.</p>
                      </div>
                    </div>
                    
                    <div className="orden-info-box">
                      <p><strong>Orden #:</strong> {ordenToDelete?.codigo}</p>
                      <p><strong>Cliente:</strong> {ordenToDelete?.nombre}</p>
                      <p><strong>Estado actual:</strong> {ordenToDelete?.estado}</p>
                    </div>
                    
                    <div className="delete-consequences">
                      <p><strong>Se eliminará:</strong></p>
                      <ul>
                        <li>La orden completa de la base de datos</li>
                        <li>Todas las notificaciones relacionadas</li>
                        <li>Registro de historial asociado</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
              <div className="confirm-actions">
                {!deleteMessage ? (
                  <>
                    <button 
                      className="confirm-btn cancel-btn"
                      onClick={handleDeleteCancel}
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                    <button 
                      className="confirm-btn delete-permanent-btn"
                      onClick={handleDeleteConfirm}
                      disabled={loading}
                    >
                      {loading ? 'Eliminando...' : 'Sí, Eliminar Permanentemente'}
                    </button>
                  </>
                ) : (
                  <button 
                    className="confirm-btn close-btn"
                    onClick={handleDeleteCancel}
                  >
                    Cerrar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal para crear orden */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content large-modal">
              <div className="modal-header">
                <h3>Crear Nueva Orden</h3>
                <button className="close-modal" onClick={closeCreateModal}>✕</button>
              </div>
              <div className="modal-body">
                <CreateOrdenForm 
                  onClose={closeCreateModal}
                  onOrdenCreated={() => {
                    fetchOrdenes();
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal para editar orden */}
        {showEditModal && selectedOrden && (
          <div className="modal-overlay">
            <div className="modal-content large-modal">
              <div className="modal-header">
                <h3>Editar Orden</h3>
                <button className="close-modal" onClick={closeEditModal}>✕</button>
              </div>
              <div className="modal-body">
                <EditOrdenForm 
                  orden={selectedOrden}
                  onClose={closeEditModal}
                  onOrdenUpdated={() => {
                    fetchOrdenes();
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal para verificar código */}
        {showVerifyModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Verificar Código de Orden</h3>
                <button className="close-modal" onClick={closeVerifyModal}>✕</button>
              </div>
              <div className="modal-body">
                <VerificarCodigo 
                  onClose={closeVerifyModal}
                  onOrdenActualizada={(ordenActualizada) => {
                    setOrdenes(prevOrdenes => 
                      prevOrdenes.map(orden => 
                        orden.id === ordenActualizada.id 
                          ? { ...orden, estado: 'entregado' }
                          : orden
                      )
                    );
                    setFilteredOrdenes(prevFiltered => 
                      prevFiltered.map(orden => 
                        orden.id === ordenActualizada.id 
                          ? { ...orden, estado: 'entregado' }
                          : orden
                      )
                    );
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ordenes;