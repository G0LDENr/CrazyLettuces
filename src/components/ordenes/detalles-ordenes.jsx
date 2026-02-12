import React from 'react';
import '../../css/detalles-ordenes.css';

const ModalDetallePedido = ({ orden, onClose }) => {
  if (!orden) return null;

  let pedidoData = null;
  let items = [];
  
  try {
    if (orden.pedido_json) {
      pedidoData = JSON.parse(orden.pedido_json);
      items = pedidoData?.items || [];
    }
  } catch (error) {
    console.error('Error al parsear pedido_json:', error);
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price || 0);
  };

  return (
    <div className="modal-detalle-overlay">
      <div className="modal-detalle-content">
        <div className="modal-detalle-header">
          <h3>Productos del Pedido #{orden.codigo_unico}</h3>
          <button className="modal-detalle-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-detalle-body">
          {/* SOLO PRODUCTOS DEL CARRITO */}
          <div className="detalle-seccion">
            <div className="productos-lista">
              {items.length > 0 ? (
                items.map((item, index) => (
                  <div key={index} className="producto-detalle-item">
                    <div className="producto-detalle-header">
                      <span className="producto-detalle-nombre">{item.nombre}</span>
                      <span className="producto-detalle-cantidad">x{item.cantidad}</span>
                    </div>
                    <div className="producto-detalle-precios">
                      <span className="producto-detalle-precio-unitario">
                        {formatPrice(item.precio_unitario)} c/u
                      </span>
                      <span className="producto-detalle-subtotal">
                        {formatPrice(item.subtotal)}
                      </span>
                    </div>
                    <div className="producto-detalle-tipo">
                      {item.tipo === 'especial' ? (
                        <span className="tipo-especial">Especial</span>
                      ) : (
                        <span className="tipo-personalizado">Personalizado</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-productos">
                  No hay productos en este pedido
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-detalle-footer">
          <div className="total-container">
            <span className="total-label">Total:</span>
            <span className="total-valor">{formatPrice(orden.precio)}</span>
          </div>
          <button className="btn-cerrar" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDetallePedido;