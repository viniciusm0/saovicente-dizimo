import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, LayoutDashboard, Users } from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/dizimistas', label: 'Dizimistas', icon: <Users size={20} /> },
  ];

  return (
    <div className="layout-container">
      <header className="layout-header">
        <div className="header-content flex-between">
          <div className="logo">
            <h2>Dízimos São Vicente</h2>
          </div>
          
          <div className="header-actions flex-center">
            <span className="user-greeting">Olá, {user?.nome || 'Admin'}</span>
            <button onClick={handleLogout} className="logout-btn" title="Sair">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="layout-body">
        <aside className="layout-sidebar">
          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <button
                key={item.path}
                className={`nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>
        
        <main className="layout-main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
