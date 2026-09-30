import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const isActive = (path) => (location.pathname === path ? 'active' : '');
  const homePath = user ? `/${user.role}/dashboard` : '/';

  // Close the controlled menu whenever the route changes or the user clicks elsewhere.
  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!profileOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!profileRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setProfileOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileOpen]);

  const handleLogout = () => {
    setProfileOpen(false);
    onLogout?.();
  };

  return (
    <nav className="site-nav navbar navbar-expand-lg" aria-label="Primary navigation">
      <div className="container">
        <Link className="brand navbar-brand" to={homePath} onClick={() => setProfileOpen(false)}>
          🌿 Agri<span>Bridge</span>
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navContent"
          aria-controls="navContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navContent">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className={`nav-link ${isActive(homePath)}`} to={homePath}> 
                {user ? 'My Dashboard' : 'Home'}
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/marketplace')}`} to="/marketplace">Farmland Marketplace</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/buyer/marketplace')}`} to="/buyer/marketplace">Produce Store</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/features')}`} to="/features">Features</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/about')}`} to="/about">About Us</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/contact')}`} to="/contact">Contact</Link>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-2">
            {user ? (
              <div className={`profile-dropdown dropdown ${profileOpen ? 'show' : ''}`} ref={profileRef}>
                <button
                  className="btn btn-light-green dropdown-toggle d-flex align-items-center gap-2"
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                  onClick={() => setProfileOpen((open) => !open)}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="rounded-circle" style={{ width: '28px', height: '28px', objectFit: 'cover' }} />
                  ) : (
                    <i className="bi bi-person-circle fs-5"></i>
                  )}
                  <span className="profile-dropdown-label">{user.full_name || user.role}</span>
                </button>

                {profileOpen && (
                  <ul className="profile-dropdown-menu dropdown-menu dropdown-menu-end shadow-sm border-0 show" role="menu">
                    <li>
                      <Link className="dropdown-item fw-bold text-success" to={`/${user.role}/dashboard`} role="menuitem">
                        <i className="bi bi-speedometer2 me-2"></i>My Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to={`/${user.role}/profile`} role="menuitem">
                        <i className="bi bi-person-gear me-2"></i>Profile Settings
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item text-danger" type="button" onClick={handleLogout} role="menuitem">
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            ) : (
              <>
                <Link to="/auth?mode=login" className="btn btn-outline-success">Login</Link>
                <Link to="/auth?mode=register" className="btn btn-success">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
