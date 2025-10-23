import { useEffect, useState } from 'react';
import './Fuentes.css';
import { apiURL } from '../constants';

function Fuentes() {
  const [fuentes, setFuentes] = useState([]);
  const [fuente, setFuente] = useState('');
  const [categoria, setCategoria] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cargarFuentes = async () => {
    try {
      const res = await fetch(`${apiURL}/api/Fuentes`);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error('No se pudieron cargar las fuentes');
      // Orden: activas primero, luego alfabético por fuente
      const ordered = [...data].sort((a, b) => {
        if (a.activo === b.activo) return a.fuente.localeCompare(b.fuente);
        return a.activo ? -1 : 1;
      });
      setFuentes(ordered);
    } catch (e) {
      setError(e.message || 'Error cargando fuentes');
    }
  };

  useEffect(() => { cargarFuentes(); }, []);

  const agregarFuente = async () => {
    setError(''); setSuccess('');
    const d = fuente.trim().toLowerCase();
    const c = categoria.trim();
    if (!d) { setError('Debes ingresar una fuente'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${apiURL}/api/Fuentes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fuente: d, categoria: c })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && data.error) || 'No se pudo agregar la fuente');
      setFuente(''); setCategoria('');
      setSuccess(data?.message || 'Fuente agregada');
      await cargarFuentes();
    } catch (e) {
      setError(e.message || 'No se pudo agregar la fuente');
    } finally {
      setLoading(false);
    }
  };

  const eliminarFuente = async (d) => {
    setError(''); setSuccess('');
    try {
      const res = await fetch(`${apiURL}/api/Fuentes?fuente=${encodeURIComponent(d)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && data.error) || 'No se pudo eliminar');
      setSuccess('Fuente desactivada');
      await cargarFuentes();
    } catch (e) {
      setError(e.message || 'Error eliminando fuente');
    }
  };

  return (
    <div className="infotrend-container">
      <div className="infotrend-inner">
        <div className="infotrend-header">
          <h1 className="infotrend-title" style={{ fontSize: '2rem', fontWeight: 700 }}>Fuentes utilizadas por la IA</h1>
        </div>

        <div className="fuentes-actions">
          <input
            type="text"
            placeholder="fuente (ej: bbc.com)"
            value={fuente}
            onChange={(e) => { setFuente(e.target.value); setError(''); setSuccess(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') agregarFuente(); }}
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Categoría (opcional)"
            value={categoria}
            onChange={(e) => { setCategoria(e.target.value); setError(''); setSuccess(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') agregarFuente(); }}
            disabled={loading}
          />
          <button onClick={agregarFuente} disabled={loading} className="primary-btn btn-lg" style={{ minWidth: 140 }}>
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
              <th>Fuente</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {fuentes.map((f) => (
              <tr key={f.fuente}>
                <td>{f.fuente}</td>
                <td>{f.categoria || '—'}</td>
                <td>
                  <span className={`badge ${f.activo ? 'activo' : 'inactivo'}`}>
                    {f.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <button className="delete-btn danger-btn" onClick={() => eliminarFuente(f.fuente)} title="Desactivar" aria-label="Desactivar fuente">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M6 6l12 12" stroke="#ff4c4c" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Fuentes;


