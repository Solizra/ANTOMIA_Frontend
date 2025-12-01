import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "./InfoTrend.css";
import { apiURL } from "../constants";

function InfoTrend() {
  const { id } = useParams();
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const loadTrendData = async () => {
      try {
        setLoading(true);
        
        // Obtener siempre desde el backend para depender de la BDD
        const response = await fetch(`${apiURL}/api/Trends/${id}`);
        if (response.ok) {
          const trendData = await response.json();
          const mappedTrend = {
            titulo: trendData.Título_del_Trend || `Trend ${id}`,
            razonamientoIA: trendData.Analisis_relacion || '—',
            fecha: trendData.Fecha_Relación ? new Date(trendData.Fecha_Relación).toLocaleString() : '—',
            fuente: trendData.Link_del_Trend || '—',
            personas: trendData.Autor || '',
            newsletterLink: trendData.Newsletter_Link || '',
            newsletterTitulo: trendData.Nombre_Newsletter_Relacionado || '',
          };
          setTrend(mappedTrend);
        } else {
          throw new Error('Trend no encontrado');
        }
      } catch (err) {
        console.error('Error cargando trend:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadTrendData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="infotrend-container">
        <div className="infotrend-inner">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>Cargando información del trend...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="infotrend-container">
        <div className="infotrend-inner">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>Error: {error}</p>
            <Link to="/Home" className="back-btn">
              ⬅ Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!trend) {
    return (
      <div className="infotrend-container">
        <div className="infotrend-inner">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>Trend no encontrado</p>
            <Link to="/Home" className="back-btn">
              ⬅ Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="infotrend-container">
      <div className="infotrend-inner">
        <header className="infotrend-header">
          <Link to="/Home" className="back-btn">
            ⬅ Volver
          </Link>
          <h1 className="infotrend-title">{trend.titulo}</h1>

        </header>

        <section className="infotrend-section">
          <p className="infotrend-descripcion">{trend.descripcion}</p>

          <div className="infotrend-razonamiento">
            <h2>Razonamiento de la IA</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{trend.razonamientoIA}</p>
          </div>

          <div className="infotrend-cards">
            <div className="infotrend-card">
              <h3>📅 Fecha</h3>
              <p>{trend.fecha}</p>
            </div>
            <div className="infotrend-card">
              <h3>🔗 Fuente</h3>
              <a href={trend.fuente} target="_blank" rel="noreferrer">
                {trend.fuente}
              </a>
            </div>
            {trend.newsletterLink && (
              <div className="infotrend-card">
                <h3>📧 Newsletter</h3>
                <a href={trend.newsletterLink} target="_blank" rel="noreferrer">
                  {trend.newsletterTitulo || trend.newsletterLink}
                </a>
              </div>
            )}
            
          </div>
        </section>
      </div>
    </div>
  );
}

export default InfoTrend;
