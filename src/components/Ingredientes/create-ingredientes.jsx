import React, { useState } from 'react';
import { useConfig } from '../../context/config';
import '../../css/create-ingredientes.css';

const CreateIngredienteForm = ({ onClose, onIngredienteCreated }) => {
  const { darkMode } = useConfig();
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    activo: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categoriasSugeridas = [
    'vegetales', 'proteínas', 'lacteos', 'condimentos', 
    'aderezos', 'toppings', 'gomitas', 'frutas', 'cereales'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
      
      const response = await fetch('http://127.0.0.1:5000/ingredientes/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          categoria: formData.categoria.trim() || null,
          activo: formData.activo
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.msg || '✅ Ingrediente creado exitosamente');
        
        setTimeout(() => {
          setFormData({
            nombre: '',
            categoria: '',
            activo: true
          });
          setSuccess('');
          onIngredienteCreated();
          onClose();
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.msg || 'Error al crear ingrediente');
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`create-ingrediente-form ${darkMode ? 'create-ingrediente-form-dark-mode' : ''}`}>
      <form onSubmit={handleSubmit} className="create-ingrediente-form-form">
        
        {success && (
          <div className="create-ingrediente-success-message">
            {success}
          </div>
        )}

        <div className="create-ingrediente-form-group">
          <label htmlFor="nombre">Nombre del Ingrediente *</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej: Lechuga Romana, Pollo a la Parrilla, etc."
            required
            disabled={loading || success}
            className={`create-ingrediente-input ${error && !formData.nombre.trim() ? 'create-ingrediente-input-error' : ''}`}
          />
          {error && !formData.nombre.trim() && (
            <span className="create-ingrediente-error-message">{error}</span>
          )}
        </div>

        <div className="create-ingrediente-form-group">
          <label htmlFor="categoria">Categoría</label>
          <input
            type="text"
            id="categoria"
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            placeholder="Ej: vegetales, condimentos, etc."
            disabled={loading || success}
            className="create-ingrediente-input"
          />
          <div className="create-ingrediente-categorias-container">
            <small className="create-ingrediente-form-text">
              Categorías sugeridas (opcional):
            </small>
            <div className="create-ingrediente-categorias-sugeridas">
              {categoriasSugeridas.map((categoria, index) => (
                <span
                  key={index}
                  className={`create-ingrediente-categoria-chip ${formData.categoria === categoria ? 'active' : ''}`}
                  onClick={() => handleCategoriaClick(categoria)}
                >
                  {categoria}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="create-ingrediente-form-group">
          <div className="create-ingrediente-checkbox-group">
            <label>
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
                disabled={loading || success}
              />
              <span>Disponible para pedidos</span>
            </label>
          </div>
          <small className="create-ingrediente-form-text">
            Si está desactivado, no aparecerá en los pedidos personalizados.
          </small>
        </div>

        {error && !error.includes('nombre') && (
          <div className="create-ingrediente-error-message">
            {error}
          </div>
        )}

        <div className="create-ingrediente-form-actions">
          <button 
            type="button" 
            className="create-ingrediente-btn-cancel" 
            onClick={onClose} 
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="create-ingrediente-btn-submit" 
            disabled={loading || success || !formData.nombre.trim()}
          >
            {loading ? (
              <>
                <span className="create-ingrediente-spinner"></span>
                Creando...
              </>
            ) : success ? '✅ Creado' : 'Crear Ingrediente'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateIngredienteForm;