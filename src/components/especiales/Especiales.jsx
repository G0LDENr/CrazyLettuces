import React, { useEffect, useState } from 'react';
import CreateEspecialForm from '../../components/especiales/create-especial';
import EditEspecialForm from '../../components/especiales/edit-especial';
import { useConfig } from '../../context/config';
import '../../css/especiales.css';

import editIcon from '../../img/edit.png';
import deleteIcon from '../../img/delete.png';
import activateIcon from '../../img/activate.png';
import deactivateIcon from '../../img/deactivate.png';

const Especiales = () => {
  const { darkMode } = useConfig();
  const [especiales, setEspeciales] = useState([]);
  const [filteredEspeciales, setFilteredEspeciales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEspecial, setSelectedEspecial] = useState(null);
  const especialesPerPage = 7;

  useEffect(() => {
    fetchEspeciales();
  }, []);

  const fetchEspeciales = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://127.0.0.1:5000/especiales/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        const especialesWithSimpleIds = data.map((especial, index) => ({
          ...especial,
          simpleId: index + 1
        }));
        
        setEspeciales(especialesWithSimpleIds);
        setFilteredEspeciales(especialesWithSimpleIds);
      } else {
        console.error('Error al obtener especiales:', response.status);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = especiales;

    // Filtro por término de búsqueda
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(especial => 
        especial.simpleId.toString().includes(searchTerm) || 
        especial.id.toString().includes(searchTerm) ||
        especial.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        especial.ingredientes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        especial.precio?.toString().includes(searchTerm)
      );
    }

    // Filtro por estado
    if (statusFilter !== '') {
      filtered = filtered.filter(especial => 
        statusFilter === 'activo' ? especial.activo : !especial.activo
      );
    }
    
    setFilteredEspeciales(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, especiales]);

  const indexOfLastEspecial = currentPage * especialesPerPage;
  const indexOfFirstEspecial = indexOfLastEspecial - especialesPerPage;
  const currentEspeciales = filteredEspeciales.slice(indexOfFirstEspecial, indexOfLastEspecial);
  const totalPages = Math.ceil(filteredEspeciales.length / especialesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDelete = async (especialId, especialNombre) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el especial "${especialNombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('🔍 DEBUG FRONTEND - Iniciando proceso de eliminación:');
      console.log('Especial ID:', especialId);
      console.log('Especial Nombre:', especialNombre);
      
      if (!token) {
        alert('Error: No hay token de autenticación. Por favor, inicia sesión nuevamente.');
        setLoading(false);
        return;
      }

      const response = await fetch(`http://127.0.0.1:5000/especiales/${especialId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const responseText = await response.text();

      if (response.ok) {
        console.log('✅ FRONTEND - Especial eliminado exitosamente del backend');
        
        // Actualizar la lista local
        const updatedEspeciales = especiales.filter(especial => especial.id !== especialId);
        
        const especialesWithSimpleIds = updatedEspeciales.map((especial, index) => ({
          ...especial,
          simpleId: index + 1
        }));
        
        setEspeciales(especialesWithSimpleIds);
        setFilteredEspeciales(especialesWithSimpleIds);
        
        // Ajustar paginación si es necesario
        if (currentEspeciales.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
        
        alert('✅ Especial eliminado exitosamente');
      } else {
        console.error('❌ FRONTEND - Error del servidor:', response.status);
        
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        try {
          if (responseText.trim()) {
            const errorData = JSON.parse(responseText);
            errorMsg = errorData.msg || errorData.message || errorData.error || errorMsg;
          }
        } catch (e) {
          errorMsg = responseText || errorMsg;
        }
        
        if (response.status === 401) {
          errorMsg = 'No autorizado. Token inválido o expirado.';
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } else if (response.status === 403) {
          errorMsg = 'No tienes permisos para eliminar especiales.';
        } else if (response.status === 404) {
          errorMsg = 'Especial no encontrado.';
        }
        
        alert(`❌ Error al eliminar especial: ${errorMsg}`);
      }
    } catch (error) {
      console.error('❌ FRONTEND - Error de conexión completo:', error);
      alert('❌ Error de conexión al eliminar especial. Verifica tu conexión a internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (especialId, especialNombre, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'activar' : 'desactivar';
    
    if (!window.confirm(`¿Estás seguro de que quieres ${action} el especial "${especialNombre}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://127.0.0.1:5000/especiales/${especialId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const responseText = await response.text();

      if (response.ok) {
        console.log(`✅ FRONTEND - Especial ${action}do exitosamente`);
        
        // Actualizar la lista local
        const updatedEspeciales = especiales.map(especial => 
          especial.id === especialId 
            ? { ...especial, activo: newStatus }
            : especial
        );
        
        setEspeciales(updatedEspeciales);
        setFilteredEspeciales(updatedEspeciales);
        
        alert(`✅ Especial ${action}do exitosamente`);
      } else {
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        try {
          if (responseText.trim()) {
            const errorData = JSON.parse(responseText);
            errorMsg = errorData.msg || errorData.message || errorData.error || errorMsg;
          }
        } catch (e) {
          errorMsg = responseText || errorMsg;
        }
        
        alert(`❌ Error al ${action} especial: ${errorMsg}`);
      }
    } catch (error) {
      console.error(`❌ FRONTEND - Error al ${action} especial:`, error);
      alert(`❌ Error de conexión al ${action} especial. Verifica tu conexión a internet.`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (especial) => {
    setSelectedEspecial(especial);
    setShowEditModal(true);
  };

  const handleAddEspecial = () => {
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedEspecial(null);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const getStatusBadge = (activo) => {
    return activo ? (
      <span className="status-badge active">Activo</span>
    ) : (
      <span className="status-badge inactive">Inactivo</span>
    );
  };

  if (loading && especiales.length === 0) {
    return (
      <div className={`especiales-container ${darkMode ? 'dark-mode' : ''}`}>
        <div className="loading-spinner"></div>
        <p style={{textAlign: 'center', color: darkMode ? '#e2e8f0' : '#666'}}>Cargando especiales...</p>
      </div>
    );
  }

  return (
    <div className={`especiales-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="especiales-content">
        
        {/* Header con título y botón */}
        <div className="section-header">
          <h3>Gestión de Especiales</h3>
          <button 
            className="add-especial-btn"
            onClick={handleAddEspecial}
            title="Agregar nuevo especial"
          >
            <span className="btn-icon">+</span>
            Agregar Especial
          </button>
        </div>

        {/* Buscador y Filtros */}
        <div className="search-section">
          <div className="filters-row">
            <div className="search-container main-search">
              <input
                type="text"
                placeholder="Buscar por ID, nombre, ingredientes o precio..."
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
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de especiales */}
        <div className="especiales-table-container">
          <table className="especiales-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Ingredientes</th>
                <th>Precio</th>
                <th>Estado</th>
                <th className="actions-header">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentEspeciales.length > 0 ? (
                currentEspeciales.map(especial => (
                  <tr key={especial.id}>
                    <td className="especial-id">{especial.simpleId}</td>
                    <td className="especial-name">{especial.nombre || 'N/A'}</td>
                    <td className="especial-ingredientes">
                      {especial.ingredientes ? (
                        <span title={especial.ingredientes}>
                          {especial.ingredientes.length > 50 
                            ? `${especial.ingredientes.substring(0, 50)}...` 
                            : especial.ingredientes
                          }
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td className="especial-price">{formatPrice(especial.precio)}</td>
                    <td className="especial-status">
                      {getStatusBadge(especial.activo)}
                    </td>
                    <td className="actions-cell">
                      <div className="actions-buttons">
                        <button 
                          onClick={() => handleEdit(especial)}
                          className="action-btn edit-btn"
                          title="Editar especial"
                        >
                          <img src={editIcon} alt="Editar" className="action-icon" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(
                            especial.id, 
                            especial.nombre, 
                            especial.activo
                          )}
                          className="action-btn status-btn"
                          title={especial.activo ? "Desactivar especial" : "Activar especial"}
                        >
                          <img 
                            src={especial.activo ? deactivateIcon : activateIcon} 
                            alt={especial.activo ? "Desactivar" : "Activar"} 
                            className="action-icon" 
                          />
                        </button>
                        <button 
                          onClick={() => {
                            console.log('🖱️ Botón eliminar clickeado para especial:', especial.id, especial.nombre);
                            handleDelete(especial.id, especial.nombre);
                          }}
                          className="action-btn delete-btn"
                          title="Eliminar especial"
                        >
                          <img src={deleteIcon} alt="Eliminar" className="action-icon" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-results">
                    {searchTerm || statusFilter ? 'No se encontraron especiales con esos criterios' : 'No hay especiales registrados'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Paginación */}
          {filteredEspeciales.length > especialesPerPage && (
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

              <div className="especiales-count-info">
                Mostrando {currentEspeciales.length} de {filteredEspeciales.length} especiales
              </div>
            </div>
          )}

          {filteredEspeciales.length <= especialesPerPage && filteredEspeciales.length > 0 && (
            <div className="especiales-count-info">
              Mostrando {currentEspeciales.length} de {filteredEspeciales.length} especiales
            </div>
          )}
        </div>

        {/* Modal para crear especial */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Agregar Nuevo Especial</h3>
                <button className="close-modal" onClick={closeCreateModal}>✕</button>
              </div>
              <div className="modal-body">
                <CreateEspecialForm 
                  onClose={closeCreateModal}
                  onEspecialCreated={() => {
                    fetchEspeciales();
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal para editar especial */}
        {showEditModal && selectedEspecial && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Editar Especial</h3>
                <button className="close-modal" onClick={closeEditModal}>✕</button>
              </div>
              <div className="modal-body">
                <EditEspecialForm 
                  especial={selectedEspecial}
                  onClose={closeEditModal}
                  onEspecialUpdated={() => {
                    fetchEspeciales();
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

export default Especiales;