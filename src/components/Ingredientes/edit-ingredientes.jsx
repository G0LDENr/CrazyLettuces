import React, { useState, useEffect } from 'react';
import { useConfig } from '../../context/config';
import '../../css/edit-ingredientes.css';

const EditIngredienteForm = ({ ingrediente, onClose, onIngredienteUpdated }) => {
  const { darkMode } = useConfig();
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categoriasSugeridas = [
    'vegetales', 'proteínas', 'lacteos', 'condimentos', 
    'aderezos', 'toppings', 'gomitas', 'frutas', 'cereales'
  ];

  useEffect(() => {
    if (ingrediente) {
      setFormData({
        nombre: ingrediente.nombre || '',
        categoria: ingrediente.categoria || ''
      });
    }
  }, [ingrediente]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoriaClick = (categoria) => {
    setFormData(prev => ({
      ...prev,
      categoria
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      setError('El nombre del ingrediente es requerido');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://127.0.0.1:5000/ingredientes/${ingrediente.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          categoria: formData.categoria.trim() || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.msg || '✅ Ingrediente actualizado exitosamente');
        
        setTimeout(() => {
          onIngredienteUpdated();
          onClose();
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.msg || 'Error al actualizar ingrediente');
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!ingrediente) return null;

  return (
    <div className={`edit-ingrediente-form ${darkMode ? 'edit-ingrediente-form-dark-mode' : ''}`}>
      <form onSubmit={handleSubmit} className="edit-ingrediente-form-form">
        
        <div className="edit-ingrediente-header">
          <h4>Editar Ingrediente #{ingrediente.id}</h4>
          <div className="edit-ingrediente-current-info">
            <span className="edit-ingrediente-current-name">
              Actual: <strong>{ingrediente.nombre}</strong>
            </span>
            <span className={`edit-ingrediente-status-badge ${ingrediente.activo ? 'active' : 'inactive'}`}>
              {ingrediente.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        {success && (
          <div className="edit-ingrediente-success-message">
            {success}
          </div>
        )}

        <div className="edit-ingrediente-form-group">
          <label htmlFor="nombre">Nuevo Nombre *</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej: Lechuga Romana, Pollo a la Parrilla, etc."
            required
            disabled={loading || success}
            className={`edit-ingrediente-input ${error && !formData.nombre.trim() ? 'edit-ingrediente-input-error' : ''}`}
          />
          {error && !formData.nombre.trim() && (
            <span className="edit-ingrediente-error-message">{error}</span>
          )}
        </div>

        <div className="edit-ingrediente-form-group">
          <label htmlFor="categoria">Nueva Categoría</label>
          <input
            type="text"
            id="categoria"
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            placeholder="Ej: vegetales, condimentos, etc."
            disabled={loading || success}
            className="edit-ingrediente-input"
          />
          <div className="edit-ingrediente-categorias-container">
            <small className="edit-ingrediente-form-text">
              Categorías sugeridas (opcional):
            </small>
            <div className="edit-ingrediente-categorias-sugeridas">
              {categoriasSugeridas.map((categoria, index) => (
                <span
                  key={index}
                  className={`edit-ingrediente-categoria-chip ${formData.categoria === categoria ? 'active' : ''}`}
                  onClick={() => handleCategoriaClick(categoria)}
                >
                  {categoria}
                </span>
              ))}
            </div>
          </div>
        </div>

        {error && !error.includes('nombre') && (
          <div className="edit-ingrediente-error-message">
            {error}
          </div>
        )}

        <div className="edit-ingrediente-form-actions">
          <button 
            type="button" 
            className="edit-ingrediente-btn-cancel" 
            onClick={onClose} 
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="edit-ingrediente-btn-submit" 
            disabled={loading || success || !formData.nombre.trim()}
          >
            {loading ? (
              <>
                <span className="edit-ingrediente-spinner"></span>
                Actualizando...
              </>
            ) : success ? '✅ Actualizado' : 'Actualizar Ingrediente'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditIngredienteForm;