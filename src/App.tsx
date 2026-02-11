import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import POSView from './views/POSView';
import InventoryView from './views/InventoryView';
import SalesView from './views/SalesView';
import CustomersView from './views/CustomersView';
import './App.css';

function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>🏪 Thushara POS</h1>
      </div>
      <nav className="sidebar-nav">
        <Link 
          to="/" 
          className={`nav-item ${isActive('/') ? 'active' : ''}`}
        >
          <span className="nav-icon">💰</span>
          <span>Point of Sale</span>
        </Link>
        <Link 
          to="/inventory" 
          className={`nav-item ${isActive('/inventory') ? 'active' : ''}`}
        >
          <span className="nav-icon">📦</span>
          <span>Inventory</span>
        </Link>
        <Link 
          to="/sales" 
          className={`nav-item ${isActive('/sales') ? 'active' : ''}`}
        >
          <span className="nav-icon">📊</span>
          <span>Sales History</span>
        </Link>
        <Link 
          to="/customers" 
          className={`nav-item ${isActive('/customers') ? 'active' : ''}`}
        >
          <span className="nav-icon">👥</span>
          <span>Customers</span>
        </Link>
      </nav>
    </div>
  );
}

function AppContent() {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<POSView />} />
          <Route path="/inventory" element={<InventoryView />} />
          <Route path="/sales" element={<SalesView />} />
          <Route path="/customers" element={<CustomersView />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
