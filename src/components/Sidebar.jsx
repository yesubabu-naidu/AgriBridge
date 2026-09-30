import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ role, items, isOpen, onClose, onLogout }) {
  const location = useLocation();
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    const handlePointerDown = (event) => {
      if (window.innerWidth >= 992) return;
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen, onClose]);

  const handleLogout = () => {
    onClose?.();
    onLogout?.();
  };

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-overlay d-lg-none"
          aria-hidden="true"
          onPointerDown={(event) => {
            event.preventDefault();
            onClose?.();
          }}
        />
      )}

      <aside
        ref={sidebarRef}
        className={`sidebar ${isOpen ? 'open' : ''}`}
        aria-label={`${role || 'user'} navigation`}
        aria-hidden={!isOpen && typeof window !== 'undefined' && window.innerWidth < 992 ? 'true' : 'false'}
      >
        <div className="sidebar-header d-flex justify-content-between align-items-center">
          <Link to="/" className="brand text-decoration-none" onClick={onClose}>
            🌿 Agri<span>Bridge</span>
          </Link>
          <button
            type="button"
            className="btn-close d-lg-none"
            aria-label="Close navigation menu"
            onClick={onClose}
          />
        </div>

        <div className="px-3 pt-3">
          <span className="eyebrow text-uppercase w-100 justify-content-center">
            {role} Workspace
          </span>
        </div>

        <nav className="sidebar-menu" aria-label="Workspace navigation">
          {items.map(([path, label, icon]) => {
            const isActive = location.pathname === path || (path !== `/${role}` && location.pathname.startsWith(path));
            return (
              <Link
                key={path}
                to={path}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={onClose}
              >
                <i className={`bi ${icon} fs-5`} aria-hidden="true"></i>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer p-3 border-top border-light">
          <button className="sidebar-item text-danger" type="button" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right fs-5" aria-hidden="true"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
