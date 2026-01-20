import React, { useState } from 'react';
import { useConfig } from '../../context/config';
import '../../css/verificar-codigo.css';

const VerificarCodigo = ({ onClose }) => {
  const { darkMode } = useConfig();
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [orden, setOrden] = useState(null);
  const [error, setError] = useState('');

  const handleVerificar = async (e) => {
    e.preventDefault();
    
    if (!codigo.trim()) {
      setError('Por favor ingresa un código');
      return;
    }

    setLoading(true);
    setError('');
    setOrden(null);

    try {
      const response = await fetch(`http://127.0.0.1:5000/ordenes/codigo/${codigo.trim().toUpperCase()}`);
      
      if (response.ok) {
        const data = await response.json();
        setOrden(data);
      } else if (response.status === 404) {
        setError('Código no encontrado. Verifica el código e intenta nuevamente.');
      } else {
        setError('Error al verificar el código. Intenta nuevamente.');
      }
    } catch (error) {
      setError('Error de conexión. Verifica tu internet e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async () => {
    if (!orden) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://127.0.0.1:5000/ordenes/${orden.id}/estado`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          estado: 'entregado'
        })
      });

      if (response.ok) {
        // Actualizar el estado local de la orden
        setOrden(prev => ({
          ...prev,
          estado: 'entregado'
        }));
        
        // Cerrar el modal automáticamente sin mostrar mensaje
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch (error) {
      console.error('Error al aprobar pedido:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNuevaBusqueda = () => {
    setCodigo('');
    setOrden(null);
    setError('');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const getStatusBadge = (estado) => {
    const statusConfig = {
      pendiente: { class: 'verify-pending', text: 'Pendiente' },
      preparando: { class: 'verify-preparing', text: 'Preparando' },
      listo: { class: 'verify-ready', text: 'Listo' },
      entregado: { class: 'verify-delivered', text: 'Entregado' },
      cancelado: { class: 'verify-cancelled', text: 'Cancelado' }
    };
    
    const config = statusConfig[estado] || { class: 'verify-pending', text: estado };
    
    return <span className={`verify-status-badge ${config.class}`}>{config.text}</span>;
  };

  return (
    <div className={`verify-container ${darkMode ? 'verify-dark-mode' : ''}`}>
      <div className="verify-content">
        {!orden ? (
          // Formulario de búsqueda
          <div className="verify-search-section">
            <h4>Verificar Código de Pedido</h4>
            <p className="verify-instructions">
              Ingresa el código único del pedido para verificar su información.
            </p>
            
            <form onSubmit={handleVerificar} className="verify-form">
              <div className="verify-input-group">
                <label htmlFor="codigo">Código del Pedido</label>
                <input
                  id="codigo"
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="Ej: A1B2C3"
                  className="verify-input"
                  maxLength={10}
                  disabled={loading}
                />
              </div>
              
              {error && (
                <div className="verify-error-message">
                  {error}
                </div>
              )}
              
              <button 
                type="submit" 
                className="verify-search-btn"
                disabled={loading || !codigo.trim()}
              >
                {loading ? 'Buscando...' : 'Verificar Código'}
              </button>
            </form>
          </div>
        ) : (
          // Información del pedido encontrado
          <div className="verify-order-info">
            <div className="verify-order-header">
              <h4>Información del Pedido</h4>
              <button 
                onClick={handleNuevaBusqueda}
                className="verify-new-search-btn"
                disabled={loading}
              >
                Nueva Búsqueda
              </button>
            </div>
            
            <div className="verify-order-details">
              <div className="verify-detail-row">
                <strong>Código:</strong>
                <span className="verify-code-highlight">{orden.codigo_unico}</span>
              </div>
              
              <div className="verify-detail-row">
                <strong>Cliente:</strong>
                <span>{orden.nombre_usuario}</span>
              </div>
              
              <div className="verify-detail-row">
                <strong>Teléfono:</strong>
                <span>{orden.telefono_usuario}</span>
              </div>
              
              <div className="verify-detail-row">
                <strong>Tipo:</strong>
                <span className={`verify-type-badge ${orden.tipo_pedido}`}>
                  {orden.tipo_pedido === 'especial' ? 'Especial' : 'Personalizado'}
                </span>
              </div>
              
              <div className="verify-detail-row">
                <strong>Pedido:</strong>
                <span>
                  {orden.tipo_pedido === 'especial' 
                    ? (orden.especial ? orden.especial.nombre : 'N/A')
                    : (orden.ingredientes_personalizados || 'N/A')
                  }
                </span>
              </div>
              
              <div className="verify-detail-row">
                <strong>Precio:</strong>
                <span className="verify-price">{formatPrice(orden.precio)}</span>
              </div>
              
              <div className="verify-detail-row">
                <strong>Estado Actual:</strong>
                {getStatusBadge(orden.estado)}
              </div>
              
              {orden.fecha_creacion && (
                <div className="verify-detail-row">
                  <strong>Fecha:</strong>
                  <span>{new Date(orden.fecha_creacion).toLocaleDateString('es-MX')}</span>
                </div>
              )}
            </div>
            
            {/* Solo mostrar botón de aprobar si no está ya entregado */}
            {orden.estado !== 'entregado' ? (
              <div className="verify-actions">
                <button 
                  onClick={handleAprobar}
                  className="verify-approve-btn"
                  disabled={loading}
                >
                  {loading ? 'Procesando...' : ' Marcar como Entregado'}
                </button>
              </div>
            ) : (
              <div className="verify-already-delivered">
                <div className="verify-delivered-icon"></div>
                <p>Este pedido ya ha sido marcado como ENTREGADO.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificarCodigo;