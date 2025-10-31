import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Home.css";
import { supabase } from "../supabaseClient";
import ojitoImage from "../assets/ojito.png";
import { apiURL } from "../constants";
import { ChevronDown, ChevronRight } from "lucide-react";

function Home() {
 
  const navigate = useNavigate();

  const [trends, setTrends] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [nonClimate, setNonClimate] = useState(false);
  const [nonClimateReason, setNonClimateReason] = useState('');
  const [showNonClimatePanel, setShowNonClimatePanel] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [procesandoNoticias, setProcesandoNoticias] = useState(false);
  const [trendsCreados, setTrendsCreados] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedReason, setSelectedReason] = useState('bad_relation');
  const [expandedTrends, setExpandedTrends] = useState(new Set());
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState('');
  

  const deleteReasons = [
    { value: 'bad_relation', label: 'Baja calidad de relación' },
    { value: 'api_bad_news', label: 'Mala noticia traída de la API' },
    { value: 'off_topic', label: 'Fuera de tema / No es climatech' },
    { value: 'duplicate', label: 'Duplicado' },
    { value: 'broken_link', label: 'Link roto o inaccesible' },
    { value: 'other', label: 'Otra razón' }
  ];

  const sortByDateDesc = (items) => {
    const parse = (v) => {
      const d = v ? new Date(v) : null;
      return isNaN(d?.getTime?.()) ? 0 : d.getTime();
    };
    return [...items].sort((a, b) => parse(b.fechaRelacion) - parse(a.fechaRelacion));
  };

  // Función para agrupar trends por trendLink
  const groupTrendsByLink = (trends) => {
    if (!trends || !Array.isArray(trends)) {
      return {};
    }
    const grouped = {};
    trends.forEach(trend => {
      const key = trend.trendLink || trend.trendTitulo || 'unique';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(trend);
    });
    return grouped;
  };

  // Función para alternar el estado de expansión de un trend
  const toggleTrendExpansion = (trendKey) => {
    setExpandedTrends(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trendKey)) {
        newSet.delete(trendKey);
      } else {
        newSet.add(trendKey);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      navigate("/"); // si no hay sesión, redirige a login
    }
    // Cargar siempre desde la BDD al iniciar
    (async () => {
      try {
        console.log('🔄 Cargando trends desde la base de datos...');
        const res = await fetch(`${apiURL}/api/Trends?limit=1000`);
        console.log('📡 Respuesta del servidor:', res.status, res.statusText);
        
        if (!res.ok) {
          console.error('❌ Error en la respuesta del servidor:', res.status, res.statusText);
          return;
        }
        
        const data = await res.json();
        console.log('📊 Datos recibidos:', data.length, 'trends');
        console.log('📋 Primer trend:', data[0]);
        
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((t, idx) => ({
            id: t.id ?? idx,
            newsletterTitulo: t.Nombre_Newsletter_Relacionado || '',
            newsletterId: t.id_newsletter ?? '',
            fechaRelacion: t.Fecha_Relación || '',
            trendTitulo: t.Título_del_Trend || '',
            trendLink: t.Link_del_Trend || '',
            relacionado: !!t.Relacionado,
            newsletterLink: '',
            analisisRelacion: t.Analisis_relacion || '',
            resumenFama: '',
            autor: '',
          }));
          console.log('🗂️ Trends mapeados:', mapped.length);
          console.log('📝 Primer trend mapeado:', mapped[0]);
          setTrends(sortByDateDesc(mapped));
        } else {
          console.log('ℹ️ No hay trends en la base de datos');
        }
      } catch (error) {
        console.error('❌ Error cargando trends:', error);
      }
    })();
  }, []);

  

  // Eliminado: auto-análisis que poblaba tabla sin depender de la BDD

  // Conexión a Server-Sent Events para actualizaciones en tiempo real
  useEffect(() => {
    let eventSource = null;
    let isMounted = true;
    let reconnectAttempts = 0;
    let reconnectTimeout = null;
    const maxReconnectAttempts = 5;

    const connectToSSE = () => {
      try {
        console.log('🔌 Intentando conectar a SSE...');
        eventSource = new EventSource(`${apiURL}/api/events`);
        
        eventSource.onopen = () => {
          console.log('🔌 ✅ Conectado al servidor de eventos SSE');
          setSseConnected(true);
          reconnectAttempts = 0; // Resetear intentos de reconexión
        };

        eventSource.onmessage = (event) => {
          if (!isMounted) return;
          
          console.log('📡 Mensaje SSE recibido (raw):', event.data);
          
          try {
            const data = JSON.parse(event.data);
            console.log('📡 Evento parseado:', data);
            
            switch (data.type) {
              case 'newTrend':
                console.log('🎯 Evento newTrend recibido. Recargando desde BDD.');
                cargarTrendsDesdeBDD();
                break;
                
              case 'newsUpdate':
                console.log('📰 Evento newsUpdate recibido:', data.data);
                console.log('📰 Tipo de notificación:', data.data.tipo);
                console.log('📰 Cantidad de trends:', data.data.count);
                
                // Mostrar notificación visual de que se procesaron nuevas noticias
                if (data.data.count > 0) {
                  setProcesandoNoticias(true);
                  
                  if (data.data.tipo === 'trendsCreados') {
                    // ¡NUEVOS TRENDS CREADOS! Recargar inmediatamente
                    console.log(`🎉 ¡Se crearon ${data.data.count} nuevos trends! Recargando tabla...`);
                    setTrendsCreados(data.data.count);
                    
                    // Recargar la tabla inmediatamente
                    setTimeout(() => {
                      console.log('🔄 Ejecutando cargarTrendsDesdeBDD...');
                      cargarTrendsDesdeBDD();
                      setProcesandoNoticias(false);
                      setTrendsCreados(0);
                    }, 500); // Solo 500ms para trends nuevos
                    
                  } else if (data.data.tipo === 'noticiasProcesadas') {
                    // Solo noticias procesadas, no hay trends nuevos
                    console.log('📰 Noticias procesadas (sin trends nuevos)');
                    setProcesandoNoticias(false);
                    
                  } else {
                    // Tipo no especificado, recargar por si acaso
                    console.log('📰 Tipo de notificación no especificado, recargando tabla...');
                    setTimeout(() => {
                      cargarTrendsDesdeBDD();
                      setProcesandoNoticias(false);
                    }, 2000);
                  }
                }
                break;
                
              case 'connected':
                console.log('✅ Conexión establecida con el servidor');
                break;
                
              case 'heartbeat':
                // Mantener conexión activa
                break;
                
              case 'history':
                // Cargar historial de eventos recientes
                if (data.events && data.events.length > 0) {
                  const recentTrends = data.events
                    .filter(e => e.type === 'newTrend')
                    .map(e => e.data);
                  if (recentTrends.length > 0) {
                    setTrends(prev => {
                      const seen = new Set(prev.map(p => `${p.trendLink}|${p.newsletterId ?? 'null'}`));
                      const uniqueRecent = recentTrends.filter(t => {
                        const k = `${t.trendLink}|${t.newsletterId ?? 'null'}`;
                        if (seen.has(k)) return false;
                        seen.add(k);
                        return true;
                      });
                      const combined = [...uniqueRecent, ...prev];
                      return sortByDateDesc(combined);
                    });
                  }
                }
                break;
                
              default:
                console.log('📡 Evento desconocido:', data.type);
            }
          } catch (parseError) {
            console.error('Error parseando evento:', parseError);
          }
        };

        eventSource.onerror = (error) => {
          console.error('❌ Error en conexión SSE:', error);
          console.error('❌ Detalles del error:', {
            readyState: eventSource?.readyState,
            url: eventSource?.url,
            withCredentials: eventSource?.withCredentials
          });
          setSseConnected(false);
          
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          
          // Solo reintentar si no hemos excedido el máximo de intentos
          if (reconnectAttempts < maxReconnectAttempts && isMounted) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff, max 30s
            console.log(`🔄 Reintentando conexión SSE (intento ${reconnectAttempts}/${maxReconnectAttempts}) en ${delay}ms...`);
            
            reconnectTimeout = setTimeout(() => {
              if (isMounted) {
                connectToSSE();
              }
            }, delay);
          } else if (reconnectAttempts >= maxReconnectAttempts) {
            console.error('❌ Máximo de intentos de reconexión alcanzado. Usando fallback de polling.');
            // Aquí podríamos activar un fallback de polling
          }
        };

      } catch (error) {
        console.error('❌ Error conectando a SSE:', error);
      }
    };

    // Conectar al servidor de eventos
    console.log('🚀 Iniciando conexión SSE...');
    connectToSSE();

    // Cleanup al desmontar
    return () => {
      isMounted = false;
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    };
  }, []);

  // Función para cargar trends desde la base de datos
  const cargarTrendsDesdeBDD = async () => {
    try {
      console.log('🔄 Recargando trends desde la base de datos...');
      const res = await fetch(`${apiURL}/api/Trends?limit=1000`);
      console.log('📡 Respuesta cargarTrendsDesdeBDD:', res.status, res.statusText);
      
      if (!res.ok) {
        console.log('⚠️ Backend no disponible para cargar trends');
        return;
      }
      const data = await res.json();
      console.log('📊 Datos cargarTrendsDesdeBDD:', data.length, 'trends');
      
      if (!Array.isArray(data)) {
        console.log('❌ Los datos no son un array:', typeof data, data);
        return;
      }
      
      const mapped = data.map((t, idx) => ({
        id: t.id ?? idx,
        newsletterTitulo: t.Nombre_Newsletter_Relacionado || '',
        newsletterId: t.id_newsletter ?? '',
        fechaRelacion: t.Fecha_Relación || '',
        trendTitulo: t.Título_del_Trend || '',
        trendLink: t.Link_del_Trend || '',
        relacionado: !!t.Relacionado,
        newsletterLink: '',
        analisisRelacion: t.Analisis_relacion || '',
        resumenFama: '',
        autor: '',
      }));
      
      console.log('🗂️ Trends mapeados en cargarTrendsDesdeBDD:', mapped.length);
      
      if (mapped.length) {
        const trendsAnteriores = trends.length;
        setTrends(sortByDateDesc(mapped));
        
        // Solo mostrar mensaje de "nuevos trends" si realmente hay más que antes
        if (trendsAnteriores > 0 && mapped.length > trendsAnteriores) {
          const nuevos = mapped.length - trendsAnteriores;
          console.log(`🎉 ¡Se agregaron ${nuevos} nuevos trends a la tabla!`);
          console.log(`📊 Total anterior: ${trendsAnteriores} → Total actual: ${mapped.length}`);
        } else if (trendsAnteriores === 0) {
          console.log(`✅ Carga inicial: Se cargaron ${mapped.length} trends desde la BDD`);
        } else {
          console.log(`✅ Se recargaron ${mapped.length} trends desde la BDD (sin cambios)`);
        }
      } else {
        console.log('ℹ️ No hay trends en la base de datos');
      }
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.log('⚠️ Backend no disponible - Error de conexión');
      } else {
        console.error('❌ Error cargando trends desde BDD:', error);
      }
    }
  };

  

  const triggerBackendWorkflow = async () => {
    try {
      setTriggerMsg('');
      setTriggerLoading(true);
      const res = await fetch(`${apiURL}/api/github/trigger-backend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Backend respondió ${res.status}. ${txt || 'Endpoint no disponible'}`);
      }
      setTriggerMsg('✅ Acción solicitada al backend');
    } catch (e) {
      console.error('❌ Error al disparar workflow:', e);
      setTriggerMsg('❌ No se pudo activar el backend');
    } finally {
      setTriggerLoading(false);
      setTimeout(() => setTriggerMsg(''), 4000);
    }
  };

  // Fallback: refresco automático cada 60s desde la BDD (solo si no hay SSE)
  useEffect(() => {
    let isMounted = true;
    const cargarTrends = async () => {
      try {
        const res = await fetch(`${apiURL}/api/Trends?limit=1000`);
        if (!res.ok) {
          console.log('⚠️ Fallback: Backend no disponible');
          return;
        }
        const data = await res.json();
        if (!Array.isArray(data)) return;
        const mapped = data.map((t, idx) => ({
          id: t.id ?? idx,
          newsletterTitulo: t.Nombre_Newsletter_Relacionado || '',
          newsletterId: t.id_newsletter ?? '',
          fechaRelacion: t.Fecha_Relación || '',
          trendTitulo: t.Título_del_Trend || '',
          trendLink: t.Link_del_Trend || '',
          relacionado: !!t.Relacionado,
          newsletterLink: '',
          analisisRelacion: t.Analisis_relacion || '',
          resumenFama: '',
          autor: '',
        }));
        if (isMounted && mapped.length) {
          setTrends(mapped);
        }
      } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          console.log('⚠️ Fallback: Backend no disponible - Error de conexión');
        }
      }
    };

    const intervalId = setInterval(cargarTrends, 60 * 1000);
    return () => { isMounted = false; clearInterval(intervalId); };
  }, []);

  const handleArchive = async (trend) => {
    console.log('📁 Archivando trend:', trend);
    
    // Obtener archivados existentes
    const archivados = JSON.parse(localStorage.getItem('archivados') || '[]');
    
    // Agregar el nuevo trend archivado
    const trendArchivado = {
      ...trend,
      tipo: 'trend',
      fechaArchivado: new Date().toISOString(),
      estado: 'archivado'
    };
    
    archivados.push(trendArchivado);
    localStorage.setItem('archivados', JSON.stringify(archivados));
    
    // Remover de la tabla de trends
    setTrends(prev => prev.filter(t => t.id !== trend.id));
    
    // Enviar feedback positivo al backend
    try {
      await fetch(`${apiURL}/api/Feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trendId: trend.id,
          action: 'archive',
          reason: 'confirmed_correct',
          feedback: 'positive',
          trendData: trend,
          timestamp: new Date().toISOString()
        })
      });
    } catch (e) {
      console.warn('⚠️ No se pudo enviar feedback de archivo:', e);
    }
    
    // Mostrar mensaje de éxito
    setSuccess('✅ Trend archivado correctamente');
    setTimeout(() => setSuccess(''), 3000);
  };

  const confirmDeleteWithReason = async () => {
    if (!deleteTarget) { setShowDeleteModal(false); return; }
    const id = deleteTarget.id;
    const trendToRemove = deleteTarget;

    // Optimista: quitar de UI
    setTrends((prev) => prev.filter((trend) => trend.id !== id));

    // Enviar feedback negativo al backend
    try {
      await fetch(`${apiURL}/api/Feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trendId: id,
          action: 'delete',
          reason: selectedReason,
          feedback: 'negative',
          trendData: trendToRemove,
          timestamp: new Date().toISOString()
        })
      });
    } catch (e) {
      console.warn('⚠️ No se pudo enviar feedback de borrado:', e);
    }

    // Borrar en backend
    if (id !== undefined && id !== null && !isNaN(Number(id))) {
      try {
        const res = await fetch(`${apiURL}/api/Trends/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error('❌ Error al borrar trend en backend', res.status, errorData);
        }
      } catch (e) {
        console.error('❌ Error de conexión al eliminar trend:', e);
      }
    }

    setShowDeleteModal(false);
    setDeleteTarget(null);
    setSelectedReason('bad_relation');
  };

  const openDeleteModal = (trend) => {
    setDeleteTarget(trend);
    setSelectedReason('bad_relation');
    setShowDeleteModal(true);
  };

  const analizar = async () => {
    setError('');
    setNonClimate(false);
    setNonClimateReason('');
    setShowNonClimatePanel(false);
    if (!input.trim()) return;
    try {
      setLoading(true);
      const res = await fetch(`${apiURL}/api/Newsletter/analizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && (data.error || data.message)) || 'Error en el análisis');

      console.log('🔍 Resultado del análisis manual:', data);

      // Mostrar mensaje si la noticia no es clasificada como Climatech
      if (data && data.esClimatech === false) {
        const motivo = (data.razonClimatech || data.motivoSinRelacion || '').trim();
        setNonClimate(true);
        setNonClimateReason(motivo);
        setError('');
        setLoading(false);
        return;
      }

      // Mostrar solo filas realmente insertadas en la BDD
      const inserts = Array.isArray(data.inserts) ? data.inserts : [];
      if (inserts.length > 0) {
        await cargarTrendsDesdeBDD();
      }
      
      // Mostrar mensaje de éxito
      if (data.inserts && data.inserts.length > 0) {
        const trendsCreados = data.inserts.length;
        console.log(`Se crearon ${trendsCreados} nuevos trends en la base de datos`);
        
        // Limpiar el input después de agregar exitosamente
        setInput('');
        
        // Mostrar mensaje de éxito (formal)
        setError('');
        setSuccess(`Se agregaron ${trendsCreados} nuevos trends a la tabla.`);
        
        // Limpiar mensaje de éxito después de 4 segundos
        setTimeout(() => {
          setSuccess('');
        }, 4000);
      } else {
        // No mostrar nada si no hubo insert; evitar filas sintéticas
        setError('');
        setSuccess('');
        setNonClimate(false);
        setNonClimateReason('');
      }
      
    } catch (e) {
      console.error('❌ Error en análisis manual:', e);
      setError(e.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error al cerrar sesión:", error.message);
    } else {
      localStorage.removeItem("user"); // limpia el storage
      navigate("/");
    }
  };

  return (
    <div className="home-container">

      <main className="main-content">
        <div className="header-section">
          <h1 className="main-title">Últimos trends reconocidos</h1>
                     <div className="connection-status">
             <span className={`status-indicator ${sseConnected ? 'connected' : 'disconnected'}`}>
               {sseConnected ? '🟢' : '🔴'}
             </span>
             <span className="status-text">
               {sseConnected ? 'Actualización en tiempo real' : 'Modo offline'}
             </span>
            {!sseConnected && (
               <span className="backend-status" style={{ 
                 marginLeft: '10px', 
                 padding: '2px 8px', 
                 background: '#ff6b6b', 
                 color: 'white', 
                 borderRadius: '12px', 
                 fontSize: '12px',
                 fontWeight: 'bold'
               }}>
                 ⚠️ Backend Offline
               </span>
             )}
            <button
              onClick={triggerBackendWorkflow}
              disabled={triggerLoading}
              className="primary-btn"
              style={{ marginLeft: '10px' }}
              title="Despertar backend ejecutando workflow"
            >
              {triggerLoading ? 'Activando…' : 'Activar backend'}
            </button>
            {triggerMsg && (
              <span style={{ marginLeft: 8, fontSize: 12, color: '#aaa' }}>{triggerMsg}</span>
            )}
           <button 
              onClick={async () => {
                try {
                  console.log('🧪 Ejecutando búsqueda manual de noticias...');
                  const response = await fetch(`${apiURL}/api/news/search-now`, {
                    method: 'POST'
                  });
                  const data = await response.json();
                  console.log('✅ Búsqueda manual ejecutada:', data);
                  alert(`Búsqueda ejecutada: ${data.message}`);
                } catch (error) {
                  console.error('❌ Error en búsqueda manual:', error);
                  alert('Error ejecutando búsqueda manual');
                }
              }}
              className="primary-btn"
              style={{ marginLeft: '10px' }}
            >
              Buscar noticias
            </button>
                         {procesandoNoticias && (
               <div className="processing-indicator">
                 <span className="spinner">⏳</span>
                 <span>
                   {trendsCreados > 0 
                     ? `¡Se crearon ${trendsCreados} nuevos trends! Actualizando tabla...`
                     : 'Procesando nuevas noticias...'
                   }
                 </span>
               </div>
             )}
          </div>
        </div>

        <table className="trends-table">
          <thead>
            <tr>
              <th>Info</th>
              <th>Título del Trend</th>
              <th>Link del Trend</th>
              <th>Nombre Newsletter Relacionado</th>
              <th>Fecha Relación</th>
              <th>Archivar</th>
              <th>Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupTrendsByLink(trends)).map(([trendKey, trendGroup]) => {
              if (!trendGroup || !Array.isArray(trendGroup) || trendGroup.length === 0) {
                return null;
              }
              const isExpanded = expandedTrends.has(trendKey);
              const hasMultipleNewsletters = trendGroup.length > 1;
              const firstTrend = trendGroup[0];
              
              return (
                <React.Fragment key={trendKey}>
                  {/* Fila principal del trend */}
                  <tr className="trend-main-row">
                    <td>
                      {hasMultipleNewsletters ? (
                        <button 
                          className="dropdown-btn"
                          onClick={() => toggleTrendExpansion(trendKey)}
                          title={isExpanded ? "Contraer" : "Expandir"}
                        >
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                      ) : (
                        <Link to={`/trends/${firstTrend.id || ''}`}>
                          <button 
                            className="info-btn-outline"
                            onClick={() => console.log('InfoTrend: Navegando a trend ID:', firstTrend.id, 'Trend completo:', firstTrend)}
                          >
                            <img src={ojitoImage} alt="Ojo" />
                          </button>
                        </Link>
                      )}
                    </td>
                    <td>{firstTrend.trendTitulo || '—'}</td>
                    <td>
                      {firstTrend.trendLink ? (
                        <a href={firstTrend.trendLink} target="_blank" rel="noreferrer">{firstTrend.trendLink}</a>
                      ) : '—'}
                    </td>
                    <td>
                      {hasMultipleNewsletters ? (
                        <span className="multiple-newsletters">
                          {trendGroup.length} newsletter{trendGroup.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        firstTrend.newsletterTitulo || '—'
                      )}
                    </td>
                    <td>{firstTrend.fechaRelacion ? new Date(firstTrend.fechaRelacion).toLocaleString() : '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="archive-btn"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleArchive(firstTrend); }}
                        title="Archivar trend"
                        aria-label="Archivar trend"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="#28a745" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDeleteModal(firstTrend); }}
                        title="Eliminar trend"
                        aria-label="Eliminar trend"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18M6 6l12 12" stroke="#ff4c4c" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                  
                  {/* Filas expandidas para newsletters individuales */}
                  {hasMultipleNewsletters && isExpanded && trendGroup && trendGroup.map((trend, index) => (
                    <tr key={`${trend.id ?? 'noid'}|${trend.newsletterId ?? 'none'}|${index}`} className="trend-expanded-row">
                      <td>
                        <Link to={`/trends/${trend.id || ''}`}>
                          <button 
                            className="info-btn-outline"
                            onClick={() => console.log('InfoTrend: Navegando a trend ID:', trend.id, 'Trend completo:', trend)}
                          >
                            <img src={ojitoImage} alt="Ojo" />
                          </button>
                        </Link>
                      </td>
                      <td className="indented-cell">↳ {trend.trendTitulo || '—'}</td>
                      <td>
                        {trend.trendLink ? (
                          <a href={trend.trendLink} target="_blank" rel="noreferrer">{trend.trendLink}</a>
                        ) : '—'}
                      </td>
                      <td>{trend.newsletterTitulo || '—'}</td>
                      <td>{trend.fechaRelacion ? new Date(trend.fechaRelacion).toLocaleString() : '—'}</td>
                      <td>
                        <button
                          type="button"
                          className="archive-btn"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleArchive(trend); }}
                          title="Archivar trend"
                          aria-label="Archivar trend"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17L4 12" stroke="#28a745" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDeleteModal(trend); }}
                          title="Eliminar trend"
                          aria-label="Eliminar trend"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6l12 12" stroke="#ff4c4c" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        <div className="footer">
          <p style={{ fontWeight: '600' }}>Pega el link de una noticia climatech</p>
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="https://ejemplo.com/noticia-climatech..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError('');
                setSuccess('');
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') analizar(); }}
              disabled={loading}
            />
            <button onClick={analizar} disabled={loading} className="primary-btn" style={{ minWidth: 120 }}>
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" className="spinner">
                    <circle cx="25" cy="25" r="20" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray="31.4 31.4" />
                  </svg>
                  Analizando...
                </span>
              ) : 'Analizar'}
            </button>
          </div>
      {/* Loading solo dentro del botón; se eliminó el indicador adicional */}
          {error && (
            <p style={{ color: 'red', marginTop: 8, fontWeight: 'normal' }}>
              {error}
            </p>
          )}
          {success && (
            <p style={{ color: 'green', marginTop: 8, fontWeight: 'bold' }}>
              {success}
            </p>
          )}
          {nonClimate && (
            <div style={{
              marginTop: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12
            }}>
              <span style={{ color: '#EB3636', fontSize: '14px' }}>
                La noticia no fue clasificada como Climatech.
              </span>
              {nonClimateReason && (
                <button
                  onClick={() => setShowNonClimatePanel(true)}
                  className="primary-btn"
                  style={{ padding: '6px 10px' }}
                >
                  Ver motivo
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#2a2a2e', padding: 20, borderRadius: 8, width: 'min(480px, 90vw)', color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Eliminar trend</h3>
            <p style={{ marginTop: 0, marginBottom: 12 }}>Selecciona la razón para eliminar este trend. Esto ayuda a mejorar la IA:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <select value={selectedReason} onChange={(e) => setSelectedReason(e.target.value)} style={{ padding: '8px 10px', background: '#1f1f23', color: '#fff', border: '1px solid #3a3a3f', borderRadius: 6 }}>
                {deleteReasons.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }} className="btn-secondary">Cancelar</button>
              <button onClick={confirmDeleteWithReason} className="btn-danger">Eliminar</button>
            </div>
          </div>
        </div>
      )}
      

      {showNonClimatePanel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ width: 'min(800px, 92vw)', maxHeight: '80vh', overflow: 'auto', background: '#2a2a2e', color: '#fff', borderRadius: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.6)', padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong>Motivo de no clasificación</strong>
                <span style={{ color: '#aaa', fontSize: 12 }}>La noticia no fue clasificada como Climatech</span>
              </div>
              <button
                className="delete-btn"
                style={{ width: 36, height: 36, display: 'grid', placeItems: 'center', padding: 0 }}
                onClick={() => setShowNonClimatePanel(false)}
                title="Cerrar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M6 6l12 12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              {nonClimateReason || 'No se proporcionó un motivo específico.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;


