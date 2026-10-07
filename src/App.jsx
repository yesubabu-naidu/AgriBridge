import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { getUserInitial, hasValidAvatar } from './utils/user';

// Layout & Core Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Footer from './components/Footer';
import UserAvatar from './components/UserAvatar';
import LogoutConfirmModal from './components/LogoutConfirmModal';


// Public Pages
import Home from './pages/Home';
import Features from './pages/Features';
import Marketplace from './pages/Marketplace';
import LandDetails from './pages/LandDetails';
import About from './pages/About';
import Contact from './pages/Contact';
import Auth from './pages/Auth';
import PaymentSuccess from './pages/PaymentSuccess';
import ProfileSettings from './pages/ProfileSettings';

// Landowner Pages
import LandownerDashboard from './pages/landowner/LandownerDashboard';
import MyLands from './pages/landowner/MyLands';
import AddLand from './pages/landowner/AddLand';
import EditLand from './pages/landowner/EditLand';
import LandownerApplications from './pages/landowner/LandownerApplications';
import Earnings from './pages/landowner/Earnings';

// Farmer Pages
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import MyCrops from './pages/farmer/MyCrops';
import AddCrop from './pages/farmer/AddCrop';
import EditCrop from './pages/farmer/EditCrop';
import Leases from './pages/farmer/Leases';
import FarmerPayment from './pages/farmer/FarmerPayment';
import FarmerTransactions from './pages/farmer/FarmerTransactions';
import FarmerApplications from './pages/farmer/FarmerApplications';
import SmartIrrigation from './pages/farmer/SmartIrrigation';
import AgriAIChatbot from './components/AgriAIChatbot';

// Buyer Pages
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import BuyerMarketplace from './pages/buyer/BuyerMarketplace';
import Cart from './pages/buyer/Cart';
import Checkout from './pages/buyer/Checkout';
import BuyerPayment from './pages/buyer/BuyerPayment';
import Orders from './pages/buyer/Orders';
import BuyerTransactions from './pages/buyer/BuyerTransactions';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import LandModeration from './pages/admin/LandModeration';
import AdminTransactions from './pages/admin/AdminTransactions';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // User State (null by default when website is opened)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('agribridge_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && parsed.avatar && !hasValidAvatar(parsed.avatar)) {
        parsed.avatar = null;
      }
      if (parsed && parsed.avatar_url && !hasValidAvatar(parsed.avatar_url)) {
        parsed.avatar_url = null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const profileDropdownRef = useRef(null);

  // Any route change closes the mobile drawer and profile dropdown so it can never sit above a new page.
  useEffect(() => {
    setMobileSidebarOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  // Click outside and Escape key handlers for top-right profile dropdown
  useEffect(() => {
    const handlePointerDown = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!mobileSidebarOpen) {
      document.body.classList.remove('mobile-sidebar-open');
      return undefined;
    }

    document.body.classList.add('mobile-sidebar-open');
    const handleEscape = (event) => {
      if (event.key === 'Escape') setMobileSidebarOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.classList.remove('mobile-sidebar-open');
      window.removeEventListener('keydown', handleEscape);
    };
  }, [mobileSidebarOpen]);

  const handleLogin = (userData) => {
    const cleanUser = { ...userData };
    if (cleanUser.avatar && !hasValidAvatar(cleanUser.avatar)) {
      cleanUser.avatar = null;
    }
    if (cleanUser.avatar_url && !hasValidAvatar(cleanUser.avatar_url)) {
      cleanUser.avatar_url = null;
    }
    setUser(cleanUser);
    localStorage.setItem('agribridge_user', JSON.stringify(cleanUser));
  };

  const handleRequestLogout = () => {
    setProfileDropdownOpen(false);
    setMobileSidebarOpen(false);
    setShowLogoutModal(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    setUser(null);
    localStorage.removeItem('agribridge_user');
    localStorage.removeItem('agribridge_token');
    navigate('/');
  };


  // Check if current route is inside a Dashboard role path or logged-in workspace
  const isDashboardRoute = user && (
    location.pathname.startsWith('/landowner') ||
    location.pathname.startsWith('/farmer') ||
    location.pathname.startsWith('/buyer') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/marketplace') ||
    location.pathname.startsWith('/land/')
  );

  const currentRole = user ? user.role : null;

  const getSidebarMenuItems = () => {
    if (!user) return [];
    switch (user.role) {
      case 'landowner':
        return [
          ['/landowner/dashboard', 'Dashboard', 'bi-speedometer2'],
          ['/landowner/my-lands', 'My Lands', 'bi-map'],
          ['/landowner/add-land', 'Add Land', 'bi-plus-circle'],
          ['/landowner/applications', 'Applications', 'bi-file-text'],
          ['/landowner/earnings', 'Earnings & Payouts', 'bi-wallet2'],
          ['/landowner/profile', 'Profile Settings', 'bi-person-gear']
        ];
      case 'farmer':
        return [
          ['/farmer/dashboard', 'Dashboard', 'bi-speedometer2'],
          ['/farmer/irrigation', 'Smart Irrigation', 'bi-droplet-half'],
          ['/farmer/my-crops', 'My Crop Produce', 'bi-shop'],
          ['/farmer/add-crop', 'Add Crop Produce', 'bi-plus-square'],
          ['/farmer/leases', 'My Leases', 'bi-journal-check'],
          ['/farmer/applications', 'Applications', 'bi-file-earmark-text'],
          ['/farmer/transactions', 'Transactions', 'bi-receipt'],
          ['/marketplace', 'Browse Farmlands', 'bi-search'],
          ['/farmer/profile', 'Profile Settings', 'bi-person-gear']
        ];
      case 'buyer':
        return [
          ['/buyer/dashboard', 'Dashboard', 'bi-speedometer2'],
          ['/buyer/marketplace', 'Produce Store', 'bi-shop'],
          ['/buyer/cart', 'My Cart', 'bi-cart'],
          ['/buyer/orders', 'My Orders', 'bi-bag-check'],
          ['/buyer/transactions', 'Transactions', 'bi-receipt'],
          ['/buyer/profile', 'Profile Settings', 'bi-person-gear']
        ];
      case 'admin':
        return [
          ['/admin/dashboard', 'Dashboard', 'bi-speedometer2'],
          ['/admin/users', 'User Management', 'bi-people'],
          ['/admin/lands', 'Land Moderation', 'bi-patch-check'],
          ['/admin/transactions', 'Global Audit Log', 'bi-receipt'],
          ['/admin/profile', 'Profile Settings', 'bi-person-gear']
        ];
      default:
        return [];
    }
  };

  return (
    <div className="app-root d-flex flex-column min-vh-100">
      {isDashboardRoute ? (
        /* Dashboard Layout with Sidebar & Header */
        <div className="dashboard-container">
          <Sidebar
            role={currentRole}
            items={getSidebarMenuItems()}
            isOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
            onLogout={handleRequestLogout}
          />

          <div className="dash-main d-flex flex-column min-vh-100">
            <header className="dash-header">
              <div className="d-flex align-items-center gap-3">
                <button 
                  className="btn btn-light d-lg-none"
                  onClick={() => setMobileSidebarOpen(true)}
                >
                  <i className="bi bi-list fs-4"></i>
                </button>
                <h5 className="fw-black mb-0 text-capitalize text-success d-none d-sm-block">
                  🌿 AgriBridge {currentRole} Workspace
                </h5>
              </div>

              <div className="d-flex align-items-center gap-3">
                <div className="position-relative" ref={profileDropdownRef}>
                  <button
                    type="button"
                    className="btn p-1 border-0 bg-transparent d-flex align-items-center gap-2 text-decoration-none shadow-none text-dark"
                    onClick={() => setProfileDropdownOpen((prev) => !prev)}
                    aria-expanded={profileDropdownOpen}
                    aria-haspopup="true"
                    title="User Profile Menu"
                  >
                    <UserAvatar user={user} size={38} className="shadow-sm" />
                    <div className="d-none d-md-block text-start">
                      <div className="fw-bold small lh-1 text-dark">{user ? user.full_name : 'User'}</div>
                      <small className="text-muted extra-small text-capitalize">{user ? user.role : ''}</small>
                    </div>
                    <i className={`bi bi-chevron-${profileDropdownOpen ? 'up' : 'down'} text-muted extra-small ms-1 d-none d-sm-inline`}></i>
                  </button>

                  {profileDropdownOpen && (
                    <div
                      className="dropdown-menu dropdown-menu-end show shadow-lg border-0 rounded-4 p-2 animate-scale-in"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '8px',
                        minWidth: '230px',
                        zIndex: 1050
                      }}
                      role="menu"
                    >
                      <div className="px-3 py-2 border-bottom mb-1 bg-light rounded-3">
                        <div className="fw-bold text-dark text-truncate d-flex align-items-center gap-2">
                          <i className="bi bi-person-circle text-success"></i>
                          <span className="text-truncate">{user ? user.full_name : 'User'}</span>
                        </div>
                        <small className="text-muted text-capitalize ps-4 d-block">{user ? user.role : 'User'}</small>
                      </div>

                      <Link
                        to={`/${user ? user.role : 'farmer'}/profile`}
                        className="dropdown-item py-2 px-3 rounded-3 d-flex align-items-center gap-2"
                        role="menuitem"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <i className="bi bi-person text-success"></i>
                        <span>View Profile</span>
                      </Link>

                      <Link
                        to={`/${user ? user.role : 'farmer'}/profile`}
                        className="dropdown-item py-2 px-3 rounded-3 d-flex align-items-center gap-2"
                        role="menuitem"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <i className="bi bi-gear text-secondary"></i>
                        <span>Profile Settings</span>
                      </Link>

                      <hr className="dropdown-divider my-1" />

                      <button
                        type="button"
                        className="dropdown-item py-2 px-3 rounded-3 d-flex align-items-center gap-2 text-danger"
                        role="menuitem"
                        onClick={handleRequestLogout}
                      >
                        <i className="bi bi-box-arrow-right"></i>
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            <main className="dash-content flex-grow-1">
              <Routes>
                {/* Landowner Routes */}
                <Route path="/landowner/dashboard" element={<LandownerDashboard user={user} />} />
                <Route path="/landowner/my-lands" element={<MyLands />} />
                <Route path="/landowner/add-land" element={<AddLand />} />
                <Route path="/landowner/my-lands/:id/edit" element={<EditLand />} />
                <Route path="/landowner/applications" element={<LandownerApplications />} />
                <Route path="/landowner/earnings" element={<Earnings />} />
                <Route path="/landowner/profile" element={<ProfileSettings user={user} onUpdateProfile={handleLogin} />} />

                {/* Farmer Routes */}
                <Route path="/farmer/dashboard" element={<FarmerDashboard user={user} />} />
                <Route path="/farmer/irrigation" element={<SmartIrrigation />} />
                <Route path="/farmer/my-crops" element={<MyCrops />} />
                <Route path="/farmer/add-crop" element={<AddCrop />} />
                <Route path="/farmer/my-crops/:id/edit" element={<EditCrop />} />
                <Route path="/farmer/leases" element={<Leases />} />
                <Route path="/farmer/payment/:leaseId" element={<FarmerPayment />} />
                <Route path="/farmer/transactions" element={<FarmerTransactions />} />
                <Route path="/farmer/applications" element={<FarmerApplications />} />
                <Route path="/farmer/profile" element={<ProfileSettings user={user} onUpdateProfile={handleLogin} />} />

                {/* Shared Dashboard Routes (Inside Sidebar layout when logged in) */}
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/land/:id" element={<LandDetails user={user} />} />

                {/* Buyer Routes */}
                <Route path="/buyer/dashboard" element={<BuyerDashboard user={user} />} />
                <Route path="/buyer/marketplace" element={<BuyerMarketplace />} />
                <Route path="/buyer/cart" element={<Cart />} />
                <Route path="/buyer/checkout" element={<Checkout />} />
                <Route path="/buyer/payment" element={<BuyerPayment />} />
                <Route path="/buyer/orders" element={<Orders />} />
                <Route path="/buyer/transactions" element={<BuyerTransactions />} />
                <Route path="/buyer/profile" element={<ProfileSettings user={user} onUpdateProfile={handleLogin} />} />

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={user?.role === 'admin' ? <AdminDashboard user={user} /> : <Navigate to={`/${user?.role || ''}/dashboard`} replace />} />
                <Route path="/admin/users" element={user?.role === 'admin' ? <UserManagement /> : <Navigate to={`/${user?.role || ''}/dashboard`} replace />} />
                <Route path="/admin/lands" element={user?.role === 'admin' ? <LandModeration /> : <Navigate to={`/${user?.role || ''}/dashboard`} replace />} />
                <Route path="/admin/transactions" element={user?.role === 'admin' ? <AdminTransactions /> : <Navigate to={`/${user?.role || ''}/dashboard`} replace />} />
                <Route path="/admin/profile" element={user?.role === 'admin' ? <ProfileSettings user={user} onUpdateProfile={handleLogin} /> : <Navigate to={`/${user?.role || ''}/dashboard`} replace />} />

                {/* Fallback inside Dashboard */}
                <Route path="*" element={<Navigate to={`/${user?.role || 'farmer'}/dashboard`} replace />} />
              </Routes>
            </main>

            <MobileNav role={currentRole} />
            {currentRole === 'farmer' && <AgriAIChatbot user={user} />}
          </div>
        </div>
      ) : (
        /* Public Layout with Top Navbar & Footer */
        <>
          <Navbar user={user} onLogout={handleRequestLogout} />
          <main className="flex-grow-1">
            <Routes>
              <Route path="/" element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Home />} />
              <Route path="/features" element={<Features />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/land/:id" element={<LandDetails user={user} />} />
              <Route path="/buyer/marketplace" element={<BuyerMarketplace />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/auth" element={<Auth onLogin={handleLogin} />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="*" element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Home />} />
            </Routes>
          </main>
          <Footer />
        </>
      )}

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={handleCancelLogout}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}