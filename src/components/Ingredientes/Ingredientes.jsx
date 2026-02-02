import React, { useEffect, useState } from 'react';
import CreateIngredienteForm from './create-ingredientes';
import EditIngredienteForm from './edit-ingredientes';
import { useConfig } from '../../context/config';
import '../../css/ingredientes.css';

import editIcon from '../../img/edit.png';
import deleteIcon from '../../img/delete.png';
import activateIcon from '../../img/activate.png';
import deactivateIcon from '../../img/deactivate.png';

const Ingredientes = () => {
  const { darkMode } = useConfig();
  const [ingredientes, setIngredientes] = useState([]);
  const [filteredIngredientes, setFilteredIngredientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedIngrediente, setSelectedIngrediente] = useState(null);
  const ingredientesPerPage = 10;
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    fetchIngredientes();
    fetchCategorias();
  }, []);

  const fetchIngredientes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://127.0.0.1:5000/ingredientes/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        const ingredientesWithSimpleIds = data.map((ingrediente, index) => ({
          ...ingrediente,
          simpleId: index + 1
        }));
        
        setIngredientes(ingredientesWithSimpleIds);
        setFilteredIngredientes(ingredientesWithSimpleIds);
      } else {
        console.error('Error al obtener ingredientes:', response.status);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://127.0.0.1:5000/ingredientes/categorias', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategorias(['todas', ...data.categorias]);
      }
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      setCategorias(['todas']);
    }
  };

  useEffect(() => {
    let filtered = ingredientes;

    // Filtro por término de búsqueda
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(ingrediente => 
        ingrediente.simpleId.toString().includes(searchTerm) || 
        ingrediente.id.toString().includes(searchTerm) ||
        ingrediente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ingrediente.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (statusFilter !== '') {
      filtered = filtered.filter(ingrediente => 
        statusFilter === 'activo' ? ingrediente.activo : !ingrediente.activo
      );
    }

    // Filtro por categoría
    if (categoriaFilter !== '' && categoriaFilter !== 'todas') {
      filtered = filtered.filter(ingrediente => 
        ingrediente.categoria === categoriaFilter
      );
    }
    
    setFilteredIngredientes(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoriaFilter, ingredientes]);

  const indexOfLastIngrediente = currentPage * ingredientesPerPage;
  const indexOfFirstIngrediente = indexOfLastIngrediente - ingredientesPerPage;
  const currentIngredientes = filteredIngredientes.slice(indexOfFirstIngrediente, indexOfLastIngrediente);
  const totalPages = Math.ceil(filteredIngredientes.length / ingredientesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDelete = async (ingredienteId, ingredienteNombre) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el ingrediente "${ingredienteNombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('🔍 FRONTEND - Iniciando eliminación de ingrediente:');
      console.log('Ingrediente ID:', ingredienteId);
      console.log('Ingrediente Nombre:', ingredienteNombre);
      
      if (!token) {
        alert('Error: No hay token de autenticación. Por favor, inicia sesión nuevamente.');
        setLoading(false);
        return;
      }

      const response = await fetch(`http://127.0.0.1:5000/ingredientes/${ingredienteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const responseText = await response.text();

      if (response.ok) {
        console.log('✅ FRONTEND - Ingrediente eliminado exitosamente');
        
        // Actualizar la lista local
        const updatedIngredientes = ingredientes.filter(ingrediente => ingrediente.id !== ingredienteId);
        
        const ingredientesWithSimpleIds = updatedIngredientes.map((ingrediente, index) => ({
          ...ingrediente,
          simpleId: index + 1
        }));
        
        setIngredientes(ingredientesWithSimpleIds);
        setFilteredIngredientes(ingredientesWithSimpleIds);
        
        // Ajustar paginación si es necesario
        if (currentIngredientes.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
        
        alert('✅ Ingrediente eliminado exitosamente');
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
          errorMsg = 'No tienes permispos para eliminar ingredientes.';
        } else if (response.status === 404) {
          errorMsg = 'Ingrediente no encontrado.';
        }
        
        alert(`❌ Error al eliminar ingrediente: ${errorMsg}`);
      }
    } catch (error) {
      console.error('❌ FRONTEND - Error de conexión:', error);
      alert('❌ Error de conexión al eliminar ingrediente. Verifica tu conexión a internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (ingredienteId, ingredienteNombre, currentStatus) => {
    const newStatus = !currentStatus;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://127.0.0.1:5000/ingredientes/${ingredienteId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const responseText = await response.text();

      if (response.ok) {
        console.log(`✅ FRONTEND - Estado del ingrediente actualizado exitosamente`);
        
        // Actualizar la lista local
        const updatedIngredientes = ingredientes.map(ingrediente => 
          ingrediente.id === ingredienteId 
            ? { ...ingrediente, activo: newStatus }
            : ingrediente
        );
        
        setIngredientes(updatedIngredientes);
        setFilteredIngredientes(updatedIngredientes);
        
        // Mostrar mensaje de éxito
        const statusMessage = newStatus ? 'activado' : 'desactivado';
        alert(`✅ Ingrediente ${statusMessage} exitosamente`);
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
        
        alert(`❌ Error al cambiar estado del ingrediente: ${errorMsg}`);
      }
    } catch (error) {
      console.error(`❌ FRONTEND - Error al cambiar estado del ingrediente:`, error);
      alert(`❌ Error de conexión al cambiar estado del ingrediente. Verifica tu conexión a internet.`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ingrediente) => {
    setSelectedIngrediente(ingrediente);
    setShowEditModal(true);
  };

  const handleAddIngrediente = () => {
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedIngrediente(null);
  };

  const getStatusBadge = (activo) => {
    return activo ? (
      <span className="status-badge active">Activo</span>
    ) : (
      <span className="status-badge inactive">Inactivo</span>
    );
  };

  const getCategoriaBadge = (categoria) => {
    if (!categoria) return <span className="categoria-badge sin-categoria">Sin categoría</span>;
    
    const colores = {
      'vegetales': 'success',
      'proteínas': 'danger',
      'lacteos': 'info',
      'condimentos': 'warning',
      'aderezos': 'primary',
      'toppings': 'secondary',
      'gomitas': 'purple',
      'frutas': 'fruit',
      'cereales': 'cereal'
    };
    
    return (
      <span className={`categoria-badge ${colores[categoria] || 'default'}`}>
        {categoria}
      </span>
    );
  };

  if (loading && ingredientes.length === 0) {
    return (
      <div className={`ingredientes-container ${darkMode ? 'dark-mode' : ''}`}>
        <div className="loading-spinner"></div>
        <p style={{textAlign: 'center', color: darkMode ? '#e2e8f0' : '#666'}}>Cargando ingredientes...</p>
      </div>
    );
  }

  return (
    <div className={`ingredientes-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="ingredientes-content">
        
        {/* Header con título y botón */}
        <div className="section-header">
          <h3>Gestión de Ingredientes</h3>
          <button 
            className="add-ingrediente-btn"
            onClick={handleAddIngrediente}
            title="Agregar nuevo ingrediente"
          >
            <span className="btn-icon">+</span>
            Agregar Ingrediente
          </button>
        </div>

        {/* Buscador y Filtros */}
        <div className="search-section">
          <div className="filters-row">
            <div className="search-container main-search">
              <input
                type="text"
                placeholder="Buscar por ID, nombre o categoría..."
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
                value={categoriaFilter} 
                onChange={(e) => setCategoriaFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'todas' ? 'Todas las categorías' : cat}
                  </option>
                ))}
              </select>
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

        {/* Tabla de ingredientes */}
        <div className="ingredientes-table-container">
          <table className="ingredientes-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th className="actions-header">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentIngredientes.length > 0 ? (
                currentIngredientes.map(ingrediente => (
                  <tr key={ingrediente.id}>
                    <td className="ingrediente-id">{ingrediente.simpleId}</td>
                    <td className="ingrediente-name">
                      <strong>{ingrediente.nombre || 'N/A'}</strong>
                    </td>
                    <td className="ingrediente-categoria">
                      {getCategoriaBadge(ingrediente.categoria)}
                    </td>
                    <td className="ingrediente-status">
                      {getStatusBadge(ingrediente.activo)}
                    </td>
                    <td className="actions-cell">
                      <div className="actions-buttons">
                        <button 
                          onClick={() => handleEdit(ingrediente)}
                          className="action-btn edit-btn"
                          title="Editar ingrediente"
                        >
                          <img src={editIcon} alt="Editar" className="action-icon" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(
                            ingrediente.id, 
                            ingrediente.nombre, 
                            ingrediente.activo
                          )}
                          className="action-btn status-btn"
                          title={ingrediente.activo ? "Desactivar ingrediente" : "Activar ingrediente"}
                        >
                          <img 
                            src={ingrediente.activo ? deactivateIcon : activateIcon} 
                            alt={ingrediente.activo ? "Desactivar" : "Activar"} 
                            className="action-icon" 
                          />
                        </button>
                        <button 
                          onClick={() => {
                            console.log('🖱️ Botón eliminar clickeado para ingrediente:', ingrediente.id, ingrediente.nombre);
                            handleDelete(ingrediente.id, ingrediente.nombre);
                          }}
                          className="action-btn delete-btn"
                          title="Eliminar ingrediente"
                        >
                          <img src={deleteIcon} alt="Eliminar" className="action-icon" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-results">
                    {searchTerm || statusFilter || categoriaFilter ? 'No se encontraron ingredientes con esos criterios' : 'No hay ingredientes registrados'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Paginación */}
          {filteredIngredientes.length > ingredientesPerPage && (
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

              <div className="ingredientes-count-info">
                Mostrando {currentIngredientes.length} de {filteredIngredientes.length} ingredientes
              </div>
            </div>
          )}

          {filteredIngredientes.length <= ingredientesPerPage && filteredIngredientes.length > 0 && (
            <div className="ingredientes-count-info">
              Mostrando {currentIngredientes.length} de {filteredIngredientes.length} ingredientes
            </div>
          )}
        </div>

        {/* Modal para crear ingrediente */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Agregar Nuevo Ingrediente</h3>
                <button className="close-modal" onClick={closeCreateModal}>✕</button>
              </div>
              <div className="modal-body">
                <CreateIngredienteForm 
                  onClose={closeCreateModal}
                  onIngredienteCreated={() => {
                    fetchIngredientes();
                    fetchCategorias();
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal para editar ingrediente */}
        {showEditModal && selectedIngrediente && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Editar Ingrediente</h3>
                <button className="close-modal" onClick={closeEditModal}>✕</button>
              </div>
              <div className="modal-body">
                <EditIngredienteForm 
                  ingrediente={selectedIngrediente}
                  onClose={closeEditModal}
                  onIngredienteUpdated={() => {
                    fetchIngredientes();
                    fetchCategorias();
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

export default Ingredientes;