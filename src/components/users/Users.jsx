import React, { useEffect, useState } from 'react';
import CreateUserForm from '../../components/users/create-user';
import EditUserForm from '../../components/users/edit-user';
import { useConfig } from '../../context/config';
import '../../css/users.css';

// Importa tus imágenes - ajusta las rutas según tu estructura de archivos
import editIcon from '../../img/edit.png';
import deleteIcon from '../../img/delete.png';

const Users = () => {
  const { darkMode } = useConfig();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sexFilter, setSexFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const usersPerPage = 7;

  useEffect(() => {
    fetchUsers();
    // Obtener el ID del usuario actual del localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUserId(user.id);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://127.0.0.1:5000/user/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        const usersWithSimpleIds = data.map((user, index) => ({
          ...user,
          simpleId: index + 1
        }));
        
        setUsers(usersWithSimpleIds);
        setFilteredUsers(usersWithSimpleIds);
      } else {
        console.error('Error al obtener usuarios:', response.status);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = users;

    // Filtro por término de búsqueda
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(user => 
        user.simpleId.toString().includes(searchTerm) || 
        user.id.toString().includes(searchTerm) ||
        user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.correo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.telefono && user.telefono.toString().includes(searchTerm))
      );
    }

    // Filtro por rol
    if (roleFilter !== '') {
      filtered = filtered.filter(user => user.rol.toString() === roleFilter);
    }

    // Filtro por sexo
    if (sexFilter !== '') {
      filtered = filtered.filter(user => user.sexo === sexFilter);
    }
    
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, roleFilter, sexFilter, users]);

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDelete = async (userId, userNombre) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar al usuario "${userNombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('🔍 DEBUG FRONTEND - Iniciando proceso de eliminación:');
      console.log('User ID:', userId);
      console.log('User Nombre:', userNombre);
      console.log('Token disponible:', token ? 'SI (longitud: ' + token.length + ')' : 'NO');
      
      if (!token) {
        alert('Error: No hay token de autenticación. Por favor, inicia sesión nuevamente.');
        setLoading(false);
        return;
      }

      console.log('🔍 DEBUG FRONTEND - Enviando petición DELETE...');
      const response = await fetch(`http://127.0.0.1:5000/user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 DEBUG FRONTEND - Respuesta recibida:');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('OK:', response.ok);

      // Obtener el contenido de la respuesta primero
      const responseText = await response.text();
      console.log('🔍 DEBUG FRONTEND - Contenido de la respuesta:', responseText);

      if (response.ok) {
        console.log('✅ FRONTEND - Usuario eliminado exitosamente del backend');
        
        // Actualizar la lista local
        const updatedUsers = users.filter(user => user.id !== userId);
        
        const usersWithSimpleIds = updatedUsers.map((user, index) => ({
          ...user,
          simpleId: index + 1
        }));
        
        setUsers(usersWithSimpleIds);
        setFilteredUsers(usersWithSimpleIds);
        
        // Ajustar paginación si es necesario
        if (currentUsers.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
        
        alert('✅ Usuario eliminado exitosamente');
      } else {
        console.error('❌ FRONTEND - Error del servidor:', response.status);
        
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        try {
          // Intentar parsear como JSON solo si hay contenido
          if (responseText.trim()) {
            const errorData = JSON.parse(responseText);
            errorMsg = errorData.msg || errorData.message || errorData.error || errorMsg;
            console.log('Error parseado como JSON:', errorData);
          }
        } catch (e) {
          console.log('La respuesta no es JSON, usando texto directo');
          errorMsg = responseText || errorMsg;
        }
        
        // Manejar errores específicos
        if (response.status === 401) {
          errorMsg = 'No autorizado. Token inválido o expirado.';
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } else if (response.status === 403) {
          errorMsg = 'No tienes permisos para eliminar usuarios.';
        } else if (response.status === 404) {
          errorMsg = 'Usuario no encontrado.';
        }
        
        alert(`❌ Error al eliminar usuario: ${errorMsg}`);
      }
    } catch (error) {
      console.error('❌ FRONTEND - Error de conexión completo:', error);
      alert('❌ Error de conexión al eliminar usuario. Verifica tu conexión a internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleAddUser = () => {
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const getRoleText = (role) => {
    switch(role) {
      case 1: return 'Administrador';
      case 2: return 'Usuario';
      default: return 'Usuario';
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className={`users-container ${darkMode ? 'dark-mode' : ''}`}>
        <div className="loading-spinner"></div>
        <p style={{textAlign: 'center', color: darkMode ? '#e2e8f0' : '#666'}}>Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className={`users-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="users-content">
        
        {/* Header con título y botón */}
        <div className="section-header">
          <h3>Gestión de Usuarios</h3>
          <button 
            className="add-user-btn"
            onClick={handleAddUser}
            title="Agregar nuevo usuario"
          >
            <span className="btn-icon">+</span>
            Agregar Usuario
          </button>
        </div>

        {/* Buscador y Filtros */}
        <div className="search-section">
          <div className="filters-row">
            <div className="search-container main-search">
              <input
                type="text"
                placeholder="Buscar por ID, nombre, email o teléfono..."
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
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">Todos los roles</option>
                <option value="1">Administrador</option>
                <option value="2">Usuario</option>
              </select>
            </div>

            <div className="filter-group">
              <select 
                value={sexFilter} 
                onChange={(e) => setSexFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">Todos los sexos</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Sexo</th>
                <th className="actions-header">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map(user => {
                  const isCurrentUser = user.id === currentUserId;
                  
                  return (
                    <tr key={user.id}>
                      <td className="user-id">{user.simpleId}</td>
                      <td className="user-name">{user.nombre || 'N/A'}</td>
                      <td className="user-email">{user.correo || 'N/A'}</td>
                      <td className="user-phone">{user.telefono || 'N/A'}</td>
                      <td className="userRole">{getRoleText(user.rol)}</td>
                      <td className="user-sex">{user.sexo || 'N/A'}</td>
                      <td className="actions-cell">
                        <div className="actions-buttons">
                          <button 
                            onClick={() => handleEdit(user)}
                            className="action-btn edit-btn"
                            title="Editar usuario"
                          >
                            <img src={editIcon} alt="Editar" className="action-icon" />
                          </button>
                          <button 
                            onClick={() => {
                              console.log('🖱️ Botón eliminar clickeado para usuario:', user.id, user.nombre);
                              console.log('🔍 Es usuario actual:', isCurrentUser);
                              if (!isCurrentUser) {
                                handleDelete(user.id, user.nombre);
                              } else {
                                alert('No puedes eliminarte a ti mismo');
                              }
                            }}
                            className="action-btn delete-btn"
                            title={isCurrentUser ? "No puedes eliminarte a ti mismo" : "Eliminar usuario"}
                            disabled={isCurrentUser}
                            style={{
                              opacity: isCurrentUser ? 0.5 : 1,
                              cursor: isCurrentUser ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <img src={deleteIcon} alt="Eliminar" className="action-icon" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="no-results">
                    {searchTerm || roleFilter || sexFilter ? 'No se encontraron usuarios con esos criterios' : 'No hay usuarios registrados'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Paginación */}
          {filteredUsers.length > usersPerPage && (
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

              <div className="users-count-info">
                Mostrando {currentUsers.length} de {filteredUsers.length} usuarios
              </div>
            </div>
          )}

          {filteredUsers.length <= usersPerPage && filteredUsers.length > 0 && (
            <div className="users-count-info">
              Mostrando {currentUsers.length} de {filteredUsers.length} usuarios
            </div>
          )}
        </div>

        {/* Modal para crear usuario */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Agregar Nuevo Usuario</h3>
                <button className="close-modal" onClick={closeCreateModal}>✕</button>
              </div>
              <div className="modal-body">
                <CreateUserForm 
                  onClose={closeCreateModal}
                  onUserCreated={() => {
                    fetchUsers();
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal para editar usuario */}
        {showEditModal && selectedUser && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Editar Usuario</h3>
                <button className="close-modal" onClick={closeEditModal}>✕</button>
              </div>
              <div className="modal-body">
                <EditUserForm 
                  user={selectedUser}
                  onClose={closeEditModal}
                  onUserUpdated={() => {
                    fetchUsers();
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

export default Users;