import React, { useEffect, useState } from 'react';
import { useConfig } from '../../context/config';
import '../../css/backup.css';

import downloadIcon from '../../img/download.png';
import deleteIcon from '../../img/delete.png';
import refreshIcon from '../../img/actualizar.png';
import restoreIcon from '../../img/restore.png';
import calendarIcon from '../../img/calendar.png';
import databaseIcon from '../../img/database.png';
import uploadIcon from '../../img/upload.png';

const Backup = () => {
  const { darkMode } = useConfig();
  const [backups, setBackups] = useState([]);
  const [filteredBackups, setFilteredBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showFullBackupModal, setShowFullBackupModal] = useState(false);
  const [showPartialBackupModal, setShowPartialBackupModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTables, setSelectedTables] = useState([]);
  const [availableTables, setAvailableTables] = useState([]);
  const [customName, setCustomName] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Estados para el autocomplete
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  
  // Estado modificado para programación por días
  const [scheduleData, setScheduleData] = useState({
    // Configuración por día: día index (0=domingo, 6=sábado)
    dias: {
      0: { seleccionado: false, hora: 2, tipo: 'full', tablas: [] }, // Domingo
      1: { seleccionado: false, hora: 2, tipo: 'full', tablas: [] }, // Lunes
      2: { seleccionado: false, hora: 2, tipo: 'full', tablas: [] }, // Martes
      3: { seleccionado: false, hora: 2, tipo: 'full', tablas: [] }, // Miércoles
      4: { seleccionado: false, hora: 2, tipo: 'full', tablas: [] }, // Jueves
      5: { seleccionado: false, hora: 2, tipo: 'full', tablas: [] }, // Viernes
      6: { seleccionado: false, hora: 2, tipo: 'full', tablas: [] }, // Sábado
    }
  });
  
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [backupToDelete, setBackupToDelete] = useState(null);
  const [backupToRestore, setBackupToRestore] = useState(null);
  const backupsPerPage = 7;

  // Generar horas de 00 a 23
  const horasDisponibles = Array.from({ length: 24 }, (_, i) => {
    const hora = i.toString().padStart(2, '0');
    return { valor: i, label: `${hora}:00` };
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchBackups(),
          fetchScheduledJobs()
        ]);
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://127.0.0.1:5000/backups/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
        setFilteredBackups(data.backups || []);
      } else {
        console.error('Error al obtener respaldos:', response.status);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTables = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:5000/backups/tables', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableTables(data.tables || []);
      }
    } catch (error) {
      console.error('Error al obtener tablas:', error);
    }
  };

  const fetchScheduledJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:5000/backups/scheduled', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setScheduledJobs(data.scheduled_jobs || []);
      }
    } catch (error) {
      console.error('Error al obtener trabajos programados:', error);
    }
  };

  const handleRefresh = () => {
    fetchBackups();
    fetchScheduledJobs();
  };

  // Función para buscar sugerencias de respaldos - IGUAL QUE EN CREAR ORDENES
  const buscarSugerencias = (texto) => {
    // Si no hay texto o está vacío, mostrar TODOS los respaldos
    if (!texto || texto.trim() === '') {
      setSugerencias(backups.slice(0, 10));
      setMostrarSugerencias(backups.length > 0);
      return;
    }

    // Si el texto es muy corto, no mostrar sugerencias
    if (texto.length < 1) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    // Filtrar respaldos que coincidan con el texto
    const textoLower = texto.toLowerCase().trim();
    const sugerenciasFiltradas = backups.filter(backup =>
      backup.filename?.toLowerCase().includes(textoLower) ||
      backup.tables_included?.some(table => 
        table.toLowerCase().includes(textoLower)
      )
    );

    setSugerencias(sugerenciasFiltradas.slice(0, 8));
    setMostrarSugerencias(sugerenciasFiltradas.length > 0);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Buscar sugerencias inmediatamente con el nuevo texto
    buscarSugerencias(value);
    
    // Actualizar filtros
    let filtered = backups;

    if (value.trim() !== '') {
      filtered = filtered.filter(backup => 
        backup.filename?.toLowerCase().includes(value.toLowerCase()) ||
        backup.tables_included?.some(table => 
          table.toLowerCase().includes(value.toLowerCase())
        )
      );
    }

    if (typeFilter !== '') {
      filtered = filtered.filter(backup => backup.backup_type === typeFilter);
    }
    
    setFilteredBackups(filtered);
    setCurrentPage(1);
  };

  const handleFocusSearch = () => {
    // Cuando se hace clic en el campo, mostrar TODOS los respaldos inmediatamente
    setSugerencias(backups.slice(0, 10));
    setMostrarSugerencias(backups.length > 0);
  };

  const handleBlurSearch = () => {
    // Ocultar sugerencias después de un pequeño delay para permitir hacer clic
    setTimeout(() => {
      setMostrarSugerencias(false);
    }, 200);
  };

  const seleccionarBackupSugerencia = (backup) => {
    setSearchTerm(backup.filename);
    setMostrarSugerencias(false);
    setSugerencias([]);
    
    // Filtrar por el backup seleccionado
    let filtered = backups.filter(b => b.filename === backup.filename);
    
    if (typeFilter !== '') {
      filtered = filtered.filter(backup => backup.backup_type === typeFilter);
    }
    
    setFilteredBackups(filtered);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (e) => {
    const value = e.target.value;
    setTypeFilter(value);
    
    let filtered = backups;

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(backup => 
        backup.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        backup.tables_included?.some(table => 
          table.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (value !== '') {
      filtered = filtered.filter(backup => backup.backup_type === value);
    }
    
    setFilteredBackups(filtered);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSugerencias([]);
    setMostrarSugerencias(false);
    
    let filtered = backups;
    
    if (typeFilter !== '') {
      filtered = filtered.filter(backup => backup.backup_type === typeFilter);
    }
    
    setFilteredBackups(filtered);
    setCurrentPage(1);
  };

  const indexOfLastBackup = currentPage * backupsPerPage;
  const indexOfFirstBackup = indexOfLastBackup - backupsPerPage;
  const currentBackups = filteredBackups.slice(indexOfFirstBackup, indexOfLastBackup);
  const totalPages = Math.ceil(filteredBackups.length / backupsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDeleteClick = (backupId, backupName) => {
    setBackupToDelete({ id: backupId, name: backupName });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!backupToDelete) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://127.0.0.1:5000/backups/${backupToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Actualizar la lista local
        const updatedBackups = backups.filter(backup => backup.id !== backupToDelete.id);
        setBackups(updatedBackups);
        setFilteredBackups(updatedBackups);
        setSugerencias(updatedBackups.slice(0, 10));
        
        setShowDeleteConfirm(false);
        setBackupToDelete(null);
      } else {
        alert('Error al eliminar el respaldo');
      }
    } catch (error) {
      console.error('Error al eliminar respaldo:', error);
      alert('Error de conexión al eliminar respaldo');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setBackupToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setBackupToDelete(null);
  };

  const handleRestoreClick = (backupId, backupName) => {
    setBackupToRestore({ id: backupId, name: backupName });
    setShowRestoreConfirm(true);
  };

  const handleRestoreConfirm = async () => {
    if (!backupToRestore) return;

    if (!window.confirm('⚠️ ADVERTENCIA: Esto sobrescribirá la base de datos actual. ¿Estás seguro?')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://127.0.0.1:5000/backups/${backupToRestore.id}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirm: true })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Base de datos restaurada exitosamente');
      } else {
        alert(`${data.message || 'Error al restaurar el respaldo'}`);
      }
    } catch (error) {
      console.error('Error al restaurar respaldo:', error);
      alert('Error de conexión al restaurar respaldo');
    } finally {
      setLoading(false);
      setShowRestoreConfirm(false);
      setBackupToRestore(null);
    }
  };

  const handleRestoreCancel = () => {
    setShowRestoreConfirm(false);
    setBackupToRestore(null);
  };

  const handleCreateFullBackup = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://127.0.0.1:5000/backups/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          backup_type: 'full',
          custom_name: customName || undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Respaldo completo creado exitosamente');
        fetchBackups();
        setShowFullBackupModal(false);
        setCustomName('');
      } else {
        alert(`${data.message || 'Error al crear respaldo'}`);
      }
    } catch (error) {
      console.error('Error al crear respaldo:', error);
      alert('Error de conexión al crear respaldo');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartialBackup = async () => {
    if (selectedTables.length === 0) {
      alert('⚠️ Selecciona al menos una tabla');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://127.0.0.1:5000/backups/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          backup_type: 'partial',
          tables: selectedTables,
          custom_name: customName || undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Respaldo parcial creado exitosamente');
        fetchBackups();
        setShowPartialBackupModal(false);
        setSelectedTables([]);
        setCustomName('');
      } else {
        alert(`${data.message || 'Error al crear respaldo'}`);
      }
    } catch (error) {
      console.error('Error al crear respaldo:', error);
      alert('Error de conexión al crear respaldo');
    } finally {
      setLoading(false);
    }
  };

  // Modificada para manejar programación por días
  const handleScheduleBackup = async () => {
    try {
      // Preparar los trabajos por día
      const trabajosPorDia = [];
      
      // Recorrer todos los días
      for (const [diaIndex, config] of Object.entries(scheduleData.dias)) {
        if (config.seleccionado) {
          // Preparar datos para este día
          const trabajo = {
            hour: config.hora,
            minute: 0, // Siempre a la hora en punto
            days_of_week: [parseInt(diaIndex)],
            backup_type: config.tipo,
          };
          
          // Si es parcial, agregar tablas
          if (config.tipo === 'partial' && config.tablas.length > 0) {
            trabajo.tables = config.tablas;
          }
          
          trabajosPorDia.push(trabajo);
        }
      }
      
      if (trabajosPorDia.length === 0) {
        alert('⚠️ Debes seleccionar al menos un día para programar');
        return;
      }
      
      // Enviar cada trabajo individualmente
      const token = localStorage.getItem('token');
      const resultados = [];
      
      for (const trabajo of trabajosPorDia) {
        const response = await fetch('http://127.0.0.1:5000/backups/schedule', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(trabajo)
        });

        const data = await response.json();
        resultados.push({ ...trabajo, success: response.ok, message: data.message });
      }
      
      // Verificar resultados
      const exitosos = resultados.filter(r => r.success);
      const fallidos = resultados.filter(r => !r.success);
      
      if (exitosos.length > 0) {
        alert(`✅ ${exitosos.length} respaldo(s) programado(s) exitosamente`);
      }
      
      if (fallidos.length > 0) {
        console.error('Trabajos fallidos:', fallidos);
        alert(`⚠️ ${fallidos.length} respaldo(s) no pudieron programarse`);
      }
      
      // Actualizar y cerrar modal
      fetchScheduledJobs();
      setShowScheduleModal(false);
      
      // Resetear datos
      setScheduleData({
        dias: {
          0: { seleccionado: false, hora: 2, tipo: 'full', tablas: [] },
          1: { seleccionado: false, hora: 2, tipo: 'full', tablas: [] },
          2: { seleccionado: false, hora: 2, tipo: 'full', tablas: [] },
          3: { seleccionado: false, hora: 2, tipo: 'full', tablas: [] },
          4: { seleccionado: false, hora: 2, tipo: 'full', tablas: [] },
          5: { seleccionado: false, hora: 2, tipo: 'full', tablas: [] },
          6: { seleccionado: false, hora: 2, tipo: 'full', tablas: [] },
        }
      });
      
    } catch (error) {
      console.error('Error al programar respaldo:', error);
      alert('Error de conexión al programar respaldo');
    }
  };

  const handleDownload = async (backupId, filename) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://127.0.0.1:5000/backups/${backupId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Error al descargar el respaldo');
      }
    } catch (error) {
      console.error('Error al descargar:', error);
      alert('Error de conexión al descargar');
    }
  };

  const handleCancelSchedule = async (jobId) => {
    if (!window.confirm('¿Cancelar este respaldo programado?')) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://127.0.0.1:5000/backups/scheduled/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Respaldo programado cancelado');
        fetchScheduledJobs();
      } else {
        alert('Error al cancelar el respaldo programado');
      }
    } catch (error) {
      console.error('Error al cancelar:', error);
      alert('Error de conexión al cancelar');
    }
  };

  const handleUploadBackup = async () => {
    if (!uploadFile) {
      alert('⚠️ Selecciona un archivo para importar');
      return;
    }

    // Validar extensión
    const allowedExtensions = ['.sql', '.sql.gz', '.gz'];
    const fileName = uploadFile.name.toLowerCase();
    const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidExtension) {
      alert('⚠️ Formato de archivo no válido. Solo se permiten archivos .sql o .sql.gz');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);
      
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('backup_file', uploadFile);

      const response = await fetch('http://127.0.0.1:5000/backups/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      setUploadProgress(70);
      
      const data = await response.json();
      
      if (response.ok) {
        setUploadProgress(100);
        alert('Respaldo importado exitosamente');
        setShowUploadModal(false);
        setUploadFile(null);
        fetchBackups();
      } else {
        alert(`Error: ${data.message || 'No se pudo importar el respaldo'}`);
      }
    } catch (error) {
      console.error('Error al importar respaldo:', error);
      alert('Error de conexión al importar respaldo');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleTableToggle = (tableName) => {
    setSelectedTables(prev => 
      prev.includes(tableName) 
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const handleSelectAllTables = () => {
    if (selectedTables.length === availableTables.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables([...availableTables]);
    }
  };

  // Función para manejar cambio en la configuración de un día
  const handleDiaChange = (diaIndex, campo, valor) => {
    setScheduleData(prev => ({
      ...prev,
      dias: {
        ...prev.dias,
        [diaIndex]: {
          ...prev.dias[diaIndex],
          [campo]: valor
        }
      }
    }));
  };

  // Función para manejar selección/deselección de un día
  const toggleDiaSeleccionado = (diaIndex) => {
    const diaActual = scheduleData.dias[diaIndex];
    handleDiaChange(diaIndex, 'seleccionado', !diaActual.seleccionado);
  };

  // Función para manejar selección de tablas para un día específico (en modal de programación)
  const handleTablaToggleParaDia = (diaIndex, tabla) => {
    const diaActual = scheduleData.dias[diaIndex];
    const nuevasTablas = diaActual.tablas.includes(tabla)
      ? diaActual.tablas.filter(t => t !== tabla)
      : [...diaActual.tablas, tabla];
    
    handleDiaChange(diaIndex, 'tablas', nuevasTablas);
  };

  // Función para seleccionar todas las tablas para un día específico
  const handleSelectAllTablasParaDia = (diaIndex) => {
    const diaActual = scheduleData.dias[diaIndex];
    if (diaActual.tablas.length === availableTables.length) {
      handleDiaChange(diaIndex, 'tablas', []);
    } else {
      handleDiaChange(diaIndex, 'tablas', [...availableTables]);
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

  const getTypeBadge = (type) => {
    const typeConfig = {
      full: { class: 'full', text: 'Completo'},
      partial: { class: 'partial', text: 'Parcial' }
    };
    
    const config = typeConfig[type] || { class: 'full', text: type };
    
    return (
      <span className={`type-badge ${config.class}`}>
        {config.text}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { class: 'completed', text: 'Completado' },
      failed: { class: 'failed', text: 'Fallido' },
      in_progress: { class: 'in-progress', text: 'En Progreso' }
    };
    
    const config = statusConfig[status] || { class: 'completed', text: status };
    
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  if (loading && backups.length === 0 && filteredBackups.length === 0) {
    return (
      <div className={`backup-container ${darkMode ? 'dark-mode' : ''}`}>
        <div className="loading-spinner"></div>
        <p style={{textAlign: 'center', color: darkMode ? '#e2e8f0' : '#666'}}>Cargando respaldos...</p>
      </div>
    );
  }

  return (
    <div className={`backup-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="backup-content">
        
        {/* Header con título y botones */}
        <div className="section-header">
          <h3>Gestión de Respaldos</h3>
          <div className="header-buttons">
            <button 
              className="refresh-btn"
              onClick={handleRefresh}
              title="Actualizar lista"
              disabled={loading}
            >
              <img src={refreshIcon} alt="Actualizar" className="btn-icon-img-actualizar" />
            </button>
            
            <button 
              className="upload-backup-btn"
              onClick={() => setShowUploadModal(true)}
              title="Importar respaldo existente"
            >
              <img src={uploadIcon} alt="Importar" className="btn-icon-img" />
              Importar
            </button>
            
            <button 
              className="schedule-btn"
              onClick={() => setShowScheduleModal(true)}
              title="Programar respaldo automático"
            >
              <img src={calendarIcon} alt="Programar" className="btn-icon-img" />
              Programar
            </button>
            <button 
              className="partial-backup-btn"
              onClick={() => {
                fetchAvailableTables();
                setShowPartialBackupModal(true);
              }}
              title="Crear respaldo parcial"
            >
              <img src={databaseIcon} alt="Parcial" className="btn-icon-img" />
              Respaldo Parcial
            </button>
            <button 
              className="full-backup-btn"
              onClick={() => setShowFullBackupModal(true)}
              title="Crear respaldo completo"
            >
              <span className="btn-icon"></span>
              Respaldo Completo
            </button>
          </div>
        </div>

        {/* Trabajos programados */}
        {scheduledJobs.length > 0 && (
          <div className="scheduled-jobs-section">
            <h4>
              <img src={calendarIcon} alt="Programados" className="section-icon" />
              Respaldos Programados
            </h4>
            <div className="jobs-grid">
              {scheduledJobs.map(job => (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <span className="job-type">
                      {job.backup_type === 'full' ? 'Completo' : 'Parcial'}
                    </span>
                    <button 
                      className="cancel-job-btn"
                      onClick={() => handleCancelSchedule(job.id)}
                      title="Cancelar programación"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="job-details">
                    <div className="job-time">
                      <strong>{job.hour?.toString().padStart(2, '0')}:00</strong>
                    </div>
                    <div className="job-days">
                      {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
                        .filter((_, index) => job.days_of_week?.includes(index))
                        .join(', ')}
                    </div>
                    {job.tables && job.tables.length > 0 && (
                      <div className="job-tables">
                        <small>Tablas: {job.tables.length}</small>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buscador y Filtros - CON AUTOCOMPLETADO IGUAL QUE CREAR ORDENES */}
        <div className="search-section">
          <div className="filters-row">
            <div className="search-container main-search">
              <div className="autocomplete-container">
                <input
                  type="text"
                  placeholder="Escribe para buscar o haz clic para ver todos los respaldos"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={handleFocusSearch}
                  onBlur={handleBlurSearch}
                  className="search-input"
                  maxLength="100"
                  autoComplete="off"
                />
                {searchTerm && (
                  <button 
                    className="clear-search"
                    onClick={clearSearch}
                    title="Limpiar búsqueda"
                  >
                    ✕
                  </button>
                )}
                
                {/* Sugerencias cuando hay coincidencias */}
                {mostrarSugerencias && sugerencias.length > 0 && (
                  <div className="autocomplete-suggestions">
                    <div className="suggestions-header">
                      {searchTerm.trim() === '' 
                        ? `Todos los respaldos (${sugerencias.length})`
                        : `Coincidencias encontradas (${sugerencias.length})`
                      }
                    </div>
                    {sugerencias.map((backup, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onClick={() => seleccionarBackupSugerencia(backup)}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <div className="suggestion-name">
                          <strong>{backup.filename}</strong>
                        </div>
                        <div className="suggestion-details">
                          <span>Fecha: {formatDate(backup.created_at)}</span>
                          <span className={`type-badge-small ${backup.backup_type}`}>
                            {backup.backup_type === 'full' ? 'Completo' : 'Parcial'}
                          </span>
                          <span>Tamaño: {backup.size_mb} MB</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Mensaje cuando no hay coincidencias pero sí hay texto de búsqueda */}
                {mostrarSugerencias && sugerencias.length === 0 && searchTerm.length >= 1 && (
                  <div className="autocomplete-suggestions">
                    <div className="suggestion-item no-results">
                      No se encontraron respaldos que coincidan con "{searchTerm}"
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="filter-group">
              <select 
                value={typeFilter} 
                onChange={handleTypeFilterChange}
                className="filter-select"
              >
                <option value="">Todos los tipos</option>
                <option value="full">Completos</option>
                <option value="partial">Parciales</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de respaldos */}
        <div className="backup-table-container">
          <table className="backup-table">
            <thead>
              <tr>
                <th>Nombre del Archivo</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Tablas</th>
                <th>Tamaño</th>
                <th>Estado</th>
                <th className="actions-header">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentBackups.length > 0 ? (
                currentBackups.map(backup => (
                  <tr key={backup.id}>
                    <td className="backup-filename">
                      <strong>{backup.filename}</strong>
                    </td>
                    <td className="backup-date">
                      {formatDate(backup.created_at)}
                    </td>
                    <td className="backup-type">
                      {getTypeBadge(backup.backup_type)}
                    </td>
                    <td className="backup-tables">
                      {backup.tables_included && backup.tables_included.length > 0 ? (
                        <span 
                          className="tables-count"
                          title={backup.tables_included.join(', ')}
                        >
                          {backup.tables_included.length} tabla{backup.tables_included.length !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-muted">Todas</span>
                      )}
                    </td>
                    <td className="backup-size">
                      <strong>{backup.size_mb} MB</strong>
                    </td>
                    <td className="backup-status">
                      {getStatusBadge(backup.status)}
                    </td>
                    <td className="actions-cell">
                      <div className="actions-buttons">
                        <button 
                          onClick={() => handleDownload(backup.id, backup.filename)}
                          className="action-btn download-btn"
                          title="Descargar respaldo"
                        >
                          <img src={downloadIcon} alt="Descargar" className="action-icon" />
                        </button>
                        <button 
                          onClick={() => handleRestoreClick(backup.id, backup.filename)}
                          className="action-btn restore-btn"
                          title="Restaurar desde este respaldo"
                        >
                          <img src={restoreIcon} alt="Restaurar" className="action-icon" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(backup.id, backup.filename)}
                          className="action-btn delete-btn"
                          title="Eliminar respaldo"
                        >
                          <img src={deleteIcon} alt="Eliminar" className="action-icon" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-results">
                    {searchTerm || typeFilter ? 'No se encontraron respaldos con esos criterios' : 'No hay respaldos disponibles'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Paginación */}
          {filteredBackups.length > backupsPerPage && (
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

              <div className="backup-count-info">
                Mostrando {currentBackups.length} de {filteredBackups.length} respaldos
              </div>
            </div>
          )}

          {filteredBackups.length <= backupsPerPage && filteredBackups.length > 0 && (
            <div className="backup-count-info">
              Mostrando {currentBackups.length} de {filteredBackups.length} respaldos
            </div>
          )}
        </div>

        {/* Modal de confirmación de eliminación */}
        {showDeleteConfirm && (
          <div className="modal-overlay-delete">
            <div className="modal-content confirm-modal">
              <div className="confirm-header">
                <h3>¿Eliminar Respaldo?</h3>
              </div>
              <div className="confirm-body">
                <div className="confirm-icon"></div>
                <p className="confirm-message">
                  ¿Estás seguro de que quieres eliminar el respaldo
                  <strong> "{backupToDelete?.name}"</strong>?
                </p>
                <p className="confirm-warning">
                  Esta acción eliminará tanto el registro como el archivo físico.
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

        {/* Modal de confirmación de restauración */}
        {showRestoreConfirm && (
          <div className="modal-overlay-delete">
            <div className="modal-content confirm-modal">
              <div className="confirm-header">
                <h3>⚠️ Restaurar Base de Datos</h3>
              </div>
              <div className="confirm-body">
                <div className="confirm-icon"></div>
                <p className="confirm-message">
                  ¿Estás seguro de que quieres restaurar la base de datos desde
                  <strong> "{backupToRestore?.name}"</strong>?
                </p>
                <p className="confirm-warning">
                  <strong>ADVERTENCIA:</strong> Esto sobrescribirá la base de datos actual. 
                  Asegúrate de tener un respaldo reciente.
                </p>
              </div>
              <div className="confirm-actions">
                <button 
                  className="confirm-btn cancel-btn"
                  onClick={handleRestoreCancel}
                >
                  Cancelar
                </button>
                <button 
                  className="confirm-btn restore-confirm-btn"
                  onClick={handleRestoreConfirm}
                >
                  Sí, Restaurar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para respaldo completo */}
        {showFullBackupModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Crear Respaldo Completo</h3>
                <button className="close-modal" onClick={() => setShowFullBackupModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre personalizado (opcional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: respaldo_2026"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                  <small className="form-text">
                    Si se deja vacío, se generará un nombre automático
                  </small>
                </div>
                <div className="backup-info">
                  <p>Se creará un respaldo completo de toda la base de datos.</p>
                  <p>Este proceso puede tomar varios minutos dependiendo del tamaño.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="modal-btn cancel-btn"
                  onClick={() => setShowFullBackupModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  className="modal-btn primary-btn"
                  onClick={handleCreateFullBackup}
                  disabled={loading}
                >
                  {loading ? 'Creando...' : 'Crear Respaldo Completo'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para respaldo parcial */}
        {showPartialBackupModal && (
          <div className="modal-overlay">
            <div className="modal-content large-modal">
              <div className="modal-header">
                <h3>Crear Respaldo Parcial</h3>
                <button className="close-modal" onClick={() => setShowPartialBackupModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre personalizado (opcional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: respaldo_usuarios_pedidos"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                </div>
                
                <div className="tables-section">
                  <div className="tables-header">
                    <h4>Seleccionar Tablas</h4>
                    <button 
                      className="select-all-btn"
                      onClick={handleSelectAllTables}
                    >
                      {selectedTables.length === availableTables.length ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
                    </button>
                  </div>
                  
                  <div className="tables-grid">
                    {availableTables.map(table => (
                      <div key={table} className="table-checkbox-item">
                        <label>
                          <input
                            type="checkbox"
                            checked={selectedTables.includes(table)}
                            onChange={() => handleTableToggle(table)}
                          />
                          <span className="table-name">{table}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  
                  <div className="selected-count">
                    {selectedTables.length} tabla{selectedTables.length !== 1 ? 's' : ''} seleccionada{selectedTables.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="modal-btn cancel-btn"
                  onClick={() => setShowPartialBackupModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  className="modal-btn primary-btn"
                  onClick={handleCreatePartialBackup}
                  disabled={loading || selectedTables.length === 0}
                >
                  {loading ? 'Creando...' : 'Crear Respaldo Parcial'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para programar respaldo */}
        {showScheduleModal && (
          <div className="modal-overlay">
            <div className="modal-content schedule-modal">
              <div className="modal-header">
                <h3>Programar Respaldos Automáticos</h3>
                <button className="close-modal" onClick={() => setShowScheduleModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="schedule-instructions">
                  <p>Selecciona los días de la semana y configura la hora para cada día.</p>
                </div>
                
                {/* Días de la semana */}
                <div className="dias-programacion">
                  {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((nombreDia, index) => {
                    const diaConfig = scheduleData.dias[index];
                    const esSeleccionado = diaConfig.seleccionado;
                    
                    return (
                      <div key={index} className={`dia-item ${esSeleccionado ? 'seleccionado' : ''}`}>
                        {/* Checkbox del día */}
                        <div className="dia-header">
                          <label className="dia-checkbox-label">
                            <input
                              type="checkbox"
                              checked={esSeleccionado}
                              onChange={() => toggleDiaSeleccionado(index)}
                            />
                            <span className="dia-nombre">{nombreDia}</span>
                          </label>
                        </div>
                        
                        {/* Configuración del día (solo si está seleccionado) */}
                        {esSeleccionado && (
                          <div className="dia-config">
                            <div className="config-row">
                              <div className="config-group">
                                <label>Hora</label>
                                <select
                                  value={diaConfig.hora}
                                  onChange={(e) => handleDiaChange(index, 'hora', parseInt(e.target.value))}
                                  className="hora-select"
                                >
                                  {horasDisponibles.map(hora => (
                                    <option key={hora.valor} value={hora.valor}>
                                      {hora.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              
                              <div className="config-group">
                                <label>Tipo</label>
                                <select
                                  value={diaConfig.tipo}
                                  onChange={(e) => handleDiaChange(index, 'tipo', e.target.value)}
                                  className="tipo-select"
                                >
                                  <option value="full">Completo</option>
                                  <option value="partial">Parcial</option>
                                </select>
                              </div>
                            </div>
                            
                            {/* Tablas (solo si es parcial) */}
                            {diaConfig.tipo === 'partial' && (
                              <div className="config-tablas">
                                <div className="tablas-header">
                                  <label>Seleccionar Tablas</label>
                                  <button 
                                    type="button"
                                    className="select-all-tablas-btn"
                                    onClick={() => handleSelectAllTablasParaDia(index)}
                                  >
                                    {diaConfig.tablas.length === availableTables.length ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
                                  </button>
                                </div>
                                
                                <div className="tablas-grid-mini">
                                  {availableTables.map((tabla, idx) => (
                                    <label key={idx} className="tabla-checkbox-mini">
                                      <input
                                        type="checkbox"
                                        checked={diaConfig.tablas.includes(tabla)}
                                        onChange={() => handleTablaToggleParaDia(index, tabla)}
                                      />
                                      <span>{tabla}</span>
                                    </label>
                                  ))}
                                </div>
                                
                                <div className="tablas-count">
                                  {diaConfig.tablas.length} tabla{diaConfig.tablas.length !== 1 ? 's' : ''} seleccionada{diaConfig.tablas.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Resumen */}
                <div className="schedule-summary">
                  <h4>Resumen de Programación</h4>
                  <div className="summary-content">
                    {Object.entries(scheduleData.dias)
                      .filter(([_, config]) => config.seleccionado)
                      .map(([diaIndex, config]) => {
                        const diaNombre = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][diaIndex];
                        return (
                          <div key={diaIndex} className="summary-item">
                            <strong>{diaNombre}:</strong>
                            <span>{config.hora.toString().padStart(2, '0')}:00 - {config.tipo === 'full' ? 'Completo' : 'Parcial'}</span>
                            {config.tipo === 'partial' && config.tablas.length > 0 && (
                              <span className="summary-tablas">({config.tablas.length} tablas)</span>
                            )}
                          </div>
                        );
                      })}
                    
                    {Object.values(scheduleData.dias).filter(d => d.seleccionado).length === 0 && (
                      <div className="summary-empty">
                        No hay días seleccionados
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="modal-btn cancel-btn"
                  onClick={() => setShowScheduleModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  className="modal-btn primary-btn"
                  onClick={handleScheduleBackup}
                  disabled={Object.values(scheduleData.dias).filter(d => d.seleccionado).length === 0}
                >
                  Programar Respaldos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para importar respaldo */}
        {showUploadModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Importar Respaldo Existente</h3>
                <button className="close-modal" onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                }}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Seleccionar archivo de respaldo (.sql o .sql.gz)</label>
                  <input
                    type="file"
                    className="form-control-file"
                    accept=".sql,.sql.gz,.gz"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    disabled={uploading}
                  />
                  <small className="form-text">
                    Formatos aceptados: .sql, .sql.gz, .gz
                  </small>
                </div>
                
                {uploadFile && (
                  <div className="file-info">
                    <p><strong>Archivo seleccionado:</strong> {uploadFile.name}</p>
                    <p><strong>Tamaño:</strong> {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    <p><strong>Tipo:</strong> {uploadFile.type || 'Desconocido'}</p>
                  </div>
                )}
                
                {uploading && (
                  <div className="upload-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="progress-text">
                      Importando... {uploadProgress}%
                    </p>
                  </div>
                )}
                
                <div className="upload-info">
                  <p>Este respaldo se agregará a la lista y podrás restaurarlo cuando sea necesario.</p>
                  <p className="text-warning">
                    <strong>Nota:</strong> Asegúrate de que el respaldo sea compatible con tu versión de base de datos.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="modal-btn cancel-btn"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                  }}
                  disabled={uploading}
                >
                  Cancelar
                </button>
                <button 
                  className="modal-btn primary-btn"
                  onClick={handleUploadBackup}
                  disabled={!uploadFile || uploading}
                >
                  {uploading ? 'Importando...' : 'Importar Respaldo'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Backup;