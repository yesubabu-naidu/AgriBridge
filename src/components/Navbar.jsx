import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import UserAvatar from './UserAvatar';
import LogoutConfirmModal from './LogoutConfirmModal';

export default function Navbar({ user, onLogout }) {
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [internalLogoutOpen, setInternalLogoutOpen] = useState(false);
  const navRef = useRef(null);
  const profileRef = useRef(null);

  const isActive = (path) => (location.pathname === path ? 'active' : '');
  const homePath = user ? `/${user.role}/dashboard` : '/';

  // Close menus on route change
  useEffect(() => {
    setNavOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Global click-outside & Escape key handlers
  useEffect(() => {
    const handlePointerDown = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setNavOpen(false);
        setProfileOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setNavOpen(false);
        setProfileOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setNavOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const closeAllMenus = () => {
    setNavOpen(false);
    setProfileOpen(false);
  };

  const handleLogoutClick = () => {
    closeAllMenus();
    if (onLogout) {
      onLogout();
    } else {
      setInternalLogoutOpen(true);
    }
  };

  const handleConfirmInternalLogout = () => {
    setInternalLogoutOpen(false);
    localStorage.removeItem('agribridge_user');
    localStorage.removeItem('agribridge_token');
    window.location.href = '/';
  };

  return (
    <>
      <nav className="site-nav navbar navbar-expand-lg" aria-label="Primary navigation" ref={navRef}>
        <div className="container">
          <Link className="brand navbar-brand" to={homePath} onClick={closeAllMenus}>
            🌿 Agri<span>Bridge</span>
          </Link>

          {/* Controlled Hamburger Toggler */}
          <button
            className={`navbar-toggler border-0 ${navOpen ? '' : 'collapsed'}`}
            type="button"
            aria-controls="navContent"
            aria-expanded={navOpen}
            aria-label="Toggle navigation"
            onClick={() => {
              setNavOpen((prev) => !prev);
              setProfileOpen(false);
            }}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Collapsible Nav Content Controlled by React State */}
          <div className={`collapse navbar-collapse ${navOpen ? 'show' : ''}`} id="navContent">
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className={`nav-link ${isActive(homePath)}`} to={homePath} onClick={closeAllMenus}>
                  {user ? 'My Dashboard' : 'Home'}
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/marketplace')}`} to="/marketplace" onClick={closeAllMenus}>
                  Farmland Marketplace
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/buyer/marketplace')}`} to="/buyer/marketplace" onClick={closeAllMenus}>
                  Produce Store
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/features')}`} to="/features" onClick={closeAllMenus}>
                  Features
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/about')}`} to="/about" onClick={closeAllMenus}>
                  About Us
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/contact')}`} to="/contact" onClick={closeAllMenus}>
                  Contact
                </Link>
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
                    <UserAvatar user={user} size={28} fontSize="13px" />
                    <span className="profile-dropdown-label">{user.full_name || user.username || 'User'}</span>
                  </button>

                  {profileOpen && (
                    <ul
                      className="profile-dropdown-menu dropdown-menu dropdown-menu-end shadow-sm border-0 show animate-scale-in"
                      role="menu"
                    >
                      <li>
                        <Link
                          className="dropdown-item fw-bold text-success"
                          to={`/${user.role}/dashboard`}
                          role="menuitem"
                          onClick={closeAllMenus}
                        >
                          <i className="bi bi-speedometer2 me-2"></i>My Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item"
                          to={`/${user.role}/profile`}
                          role="menuitem"
                          onClick={closeAllMenus}
                        >
                          <i className="bi bi-person me-2"></i>View Profile
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item"
                          to={`/${user.role}/profile`}
                          role="menuitem"
                          onClick={closeAllMenus}
                        >
                          <i className="bi bi-person-gear me-2"></i>Profile Settings
                        </Link>
                      </li>
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                      <li>
                        <button
                          className="dropdown-item text-danger"
                          type="button"
                          onClick={handleLogoutClick}
                          role="menuitem"
                        >
                          <i className="bi bi-box-arrow-right me-2"></i>Logout
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/auth?mode=login" className="btn btn-outline-success" onClick={closeAllMenus}>
                    Login
                  </Link>
                  <Link to="/auth?mode=register" className="btn btn-success" onClick={closeAllMenus}>
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Internal Logout Confirmation Modal (if rendered standalone) */}
      <LogoutConfirmModal
        isOpen={internalLogoutOpen}
        onClose={() => setInternalLogoutOpen(false)}
        onConfirm={handleConfirmInternalLogout}
      />
    </>
  );
}

