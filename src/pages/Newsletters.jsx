import { useEffect, useState } from 'react';
import './Fuentes.css';

function Newsletters() {
  const [items, setItems] = useState([]);
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [panelMsg, setPanelMsg] = useState('');
  const [panelErr, setPanelErr] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [draftResumen, setDraftResumen] = useState('');

  const cargar = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/Newsletter?limit=100');
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error('No se pudieron cargar los newsletters');
      const ordered = [...data].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
      setItems(ordered);
    } catch (e) {
      setError(e.message || 'Error cargando newsletters');
    }
  };

  useEffect(() => { cargar(); }, []);

  const normalizarUrl = (u) => (u || '').trim();

  const agregar = async () => {
    setError(''); setSuccess('');
    const u = normalizarUrl(link);
    if (!u) { setError('Debes ingresar una URL'); return; }
    if (!/^https?:\/\//i.test(u)) { setError('La URL debe iniciar con http(s)://'); return; }
    if (!u.startsWith('https://pulsobyantom.substack.com/p')) { setError('Solo se aceptan newsletters de Pulso by Antom (Substack)'); return; }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/Newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: u })
      });
      const data = await res.json().catch(() => null);
      if (res.status === 409) {
        setError('El newsletter ya existe');
        setLink('');
        await cargar();
        // mantener error visible más tiempo
        return;
      }
      if (!res.ok) throw new Error((data && (data.error || data.message)) || 'No se pudo agregar');
      setLink('');
      setSuccess('Newsletter agregado correctamente');
      await cargar();
      // auto-dismiss éxito
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError(e.message || 'No se pudo agregar el newsletter');
      // mantener error visible por más tiempo
      setTimeout(() => setError(''), 10000);
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (id) => {
    setError(''); setSuccess('');
    try {
      const item = items.find(x => x.id === id);
      const qs = new URLSearchParams();
      if (id != null) qs.set('id', String(id));
      if (item?.link) qs.set('link', item.link);
      const res = await fetch(`http://localhost:3000/api/Newsletter?${qs.toString()}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && (data.error || data.message)) || 'No se pudo eliminar');
      setSuccess('Newsletter eliminado');
      await cargar();
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError(e.message || 'Error eliminando newsletter');
      setTimeout(() => setError(''), 10000);
    }
  };

  return (
    <div className="infotrend-container">
      <div className="infotrend-inner">
        <div className="infotrend-header">
          <h1 className="infotrend-title" style={{ fontSize: '2rem', fontWeight: 700 }}>Newsletters</h1>
        </div>

        <div className="fuentes-actions">
          <input
            type="text"
            placeholder="https://ejemplo.com/mi-newsletter"
            value={link}
            onChange={(e) => { setLink(e.target.value); setError(''); setSuccess(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') agregar(); }}
            disabled={loading}
          />
          <button onClick={agregar} disabled={loading} className="primary-btn btn-lg" style={{ minWidth: 140 }}>
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" className="spinner">
                  <circle cx="25" cy="25" r="20" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray="31.4 31.4" />
                </svg>
                Cargando
              </span>
            ) : 'Agregar'}
          </button>
        </div>

        {error && <p style={{ color: 'salmon', textAlign: 'center', marginBottom: 12 }}>{error}</p>}
        {success && <p style={{ color: 'lightgreen', textAlign: 'center', marginBottom: 12 }}>{success}</p>}

        <table className="fuentes-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Link</th>
              <th>Título</th>
              <th>Resumen</th>
              <th>Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {items.map(n => (
              <tr key={n.id}>
                <td>{n.id}</td>
                <td>{n.link ? <a href={n.link} target="_blank" rel="noreferrer">{n.link}</a> : '—'}</td>
                <td>{n.titulo || '—'}</td>
                <td>
                  <button
                    className="primary-btn"
                    style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    onClick={() => {
                      setActiveItem(n);
                      setDraftResumen(n.Resumen || '');
                      setEditMode(false);
                      setPanelOpen(true);
                    }}
                    title="Ver resumen"
                  >Ver resumen</button>
                </td>
                <td>
                  <button className="delete-btn danger-btn" onClick={() => eliminar(n.id)} title="Eliminar" aria-label="Eliminar newsletter">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M6 6l12 12" stroke="#ff4c4c" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {panelOpen && activeItem && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ width: 'min(800px, 92vw)', maxHeight: '80vh', overflow: 'auto', background: '#2a2a2e', color: '#fff', borderRadius: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.6)', padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong>Resumen del Newsletter #{activeItem.id}</strong>
                <span style={{ color: '#aaa', fontSize: 12 }}>{activeItem.titulo || 'Sin título'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="info-btn-outline"
                  style={{
                    width: 36,
                    height: 36,
                    display: 'grid',
                    placeItems: 'center',
                    padding: 0,
                    background: editMode ? '#3a3a3f' : 'transparent',
                    borderColor: editMode ? '#5a5a60' : undefined
                  }}
                  onClick={() => {
                    if (editMode) {
                      // cancelar edición: descartar cambios
                      setDraftResumen(activeItem?.Resumen || '');
                      setEditMode(false);
                      setPanelMsg('');
                      setPanelErr('');
                    } else {
                      setDraftResumen(activeItem?.Resumen || '');
                      setEditMode(true);
                      setPanelMsg('');
                      setPanelErr('');
                    }
                  }}
                  title={editMode ? 'Cancelar edición' : 'Editar'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="#ddd"/>
                    <path d="M20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="#bbb"/>
                  </svg>
                </button>
                <button
                  className="delete-btn"
                  style={{ width: 36, height: 36, display: 'grid', placeItems: 'center', padding: 0 }}
                  onClick={() => { setPanelOpen(false); setActiveItem(null); setEditMode(false); setPanelMsg(''); setPanelErr(''); }}
                  title="Cerrar"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M6 6l12 12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {(panelMsg || panelErr) && (
              <div style={{
                background: panelErr ? '#863a3a' : '#2e5a3a',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: 8,
                marginBottom: 10,
                border: panelErr ? '1px solid #a44' : '1px solid #3a7a4a'
              }}>
                {panelErr || panelMsg}
              </div>
            )}

            {!editMode ? (
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{draftResumen || '—'}</div>
            ) : (
              <div>
                <textarea
                  value={draftResumen}
                  onChange={(e) => setDraftResumen(e.target.value)}
                  rows={10}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    color: '#fff',
                    border: 'none',
                    outline: 'none',
                    borderRadius: 8,
                    padding: 0,
                    fontSize: '14px',
                    lineHeight: 1.6,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    maxHeight: '50vh',
                    overflow: 'auto'
                  }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                  <button
                    className="primary-btn"
                    onClick={async () => {
                      try {
                        const res = await fetch(`http://localhost:3000/api/Newsletter/${activeItem.id}/resumen`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ Resumen: draftResumen || '' })
                        });
                        const data = await res.json().catch(() => null);
                        if (!res.ok) throw new Error((data && (data.error || data.message)) || 'No se pudo actualizar');
                        // reflejar en la tabla
                        setItems(prev => prev.map(x => x.id === activeItem.id ? { ...x, Resumen: draftResumen || '' } : x));
                        setActiveItem(prev => prev ? { ...prev, Resumen: draftResumen || '' } : prev);
                        // recargar desde backend para asegurar persistencia
                        await cargar();
                        setPanelErr('');
                        setPanelMsg('✅ Resumen actualizado');
                        setTimeout(() => setPanelMsg(''), 4000);
                        setEditMode(false);
                      } catch (e) {
                        setPanelMsg('');
                        setPanelErr(e.message || 'Error actualizando resumen');
                        setTimeout(() => setPanelErr(''), 10000);
                      }
                    }}
                  >Guardar</button>
                </div>
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Newsletters;


