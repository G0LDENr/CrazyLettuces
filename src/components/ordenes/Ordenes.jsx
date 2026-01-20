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

    // Filtro por término de búsqueda
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(orden => 
        orden.simpleId.toString().includes(searchTerm) || 
        orden.id.toString().includes(searchTerm) ||
        orden.codigo_unico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orden.nombre_usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orden.telefono_usuario?.includes(searchTerm)
      );
    }

    // Filtro por estado
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

  const handleDeleteClick = (ordenId, ordenNombre) => {
    setOrdenToDelete({ id: ordenId, nombre: ordenNombre });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!ordenToDelete) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://127.0.0.1:5000/ordenes/${ordenToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Actualizar la lista local
        const updatedOrdenes = ordenes.filter(orden => orden.id !== ordenToDelete.id);
        
        const ordenesWithSimpleIds = updatedOrdenes.map((orden, index) => ({
          ...orden,
          simpleId: index + 1
        }));
        
        setOrdenes(ordenesWithSimpleIds);
        setFilteredOrdenes(ordenesWithSimpleIds);
        
        // Cerrar el modal sin mostrar mensaje
        setShowDeleteConfirm(false);
        setOrdenToDelete(null);
      } else {
        alert('❌ Error al eliminar la orden');
      }
    } catch (error) {
      console.error('Error al eliminar orden:', error);
      alert('❌ Error de conexión al eliminar orden');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setOrdenToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setOrdenToDelete(null);
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
                        >
                          <img src={editIcon} alt="Editar" className="action-icon" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(orden.id, orden.nombre_usuario)}
                          className="action-btn delete-btn"
                          title="Eliminar orden"
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

        {/* Modal de confirmación de eliminación */}
        {showDeleteConfirm && (
          <div className="modal-overlay-delete">
            <div className="modal-content confirm-modal">
              <div className="confirm-header">
                <h3>¿Eliminar Orden?</h3>
              </div>
              <div className="confirm-body">
                <div className="confirm-icon">🗑️</div>
                <p className="confirm-message">
                  ¿Estás seguro de que quieres eliminar la orden de 
                  <strong> "{ordenToDelete?.nombre}"</strong>?
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
                    // Actualizar la orden en el estado local
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