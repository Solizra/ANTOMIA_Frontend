import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, ChevronLeft, ChevronRight, Settings } from "lucide-react"; // si usás este ícono
import "./Layout.css";

function Layout() {
  const location = useLocation(); // para saber en qué ruta estás
  const navigate = useNavigate(); // para redirigir al logout
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const handleLogout = () => {
    // Acá borrás tokens, limpias sesión, etc.
    console.log("Sesión cerrada");
    navigate("/"); // redirige al login
  };

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  return (
    <div className={`layout ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      <aside className={`sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="sidebar-header">
          <h2 className="logo">AntomIA</h2>
          <button className="toggle-sidebar-btn" onClick={toggleSidebar}>
            {sidebarExpanded ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        
        <nav className={sidebarExpanded ? 'visible' : 'hidden'}>
          <ul>
            <li className={location.pathname === "/Home" ? "active" : ""}>
              <Link to="/Home">Trends</Link>
            </li>
            
            
            <li className={location.pathname === "/fuentes" ? "active" : ""}>
              <Link to="/fuentes">Fuentes</Link>
            </li>
            <li className={location.pathname === "/newsletters" ? "active" : ""}>
              <Link to="/newsletters">Newsletters</Link>
            </li>
            
            <li className={location.pathname === "/archivados" ? "active" : ""}>
              <Link to="/archivados">Archivados</Link>
            </li>
          </ul>
        </nav>

        <div className={`settings-section ${sidebarExpanded ? 'visible' : 'hidden'}`}>
          <Link 
            to="/configuracion" 
            className={`settings-btn ${location.pathname === "/configuracion" ? "active" : ""}`}
            title="Configuración"
          >
            <Settings size={18} />
            {sidebarExpanded && <span>Configuración</span>}
          </Link>
        </div>

        <button className={`logout-btn ${sidebarExpanded ? 'visible' : 'hidden'}`} onClick={handleLogout}>
          <LogOut size={18} style={{ marginRight: "8px" }} />
          Cerrar sesión
        </button>
      </aside>

      <main className="content">
        <Outlet /> 
      </main>
    </div>
  );
}

export default Layout;
