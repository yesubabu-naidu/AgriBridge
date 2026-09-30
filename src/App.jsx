import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';

// Layout & Core Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Footer from './components/Footer';

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
    const saved = localStorage.getItem('agribridge_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Any route change closes the mobile drawer so it can never sit above a new page.
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

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
    setUser(userData);
    localStorage.setItem('agribridge_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
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
            onLogout={handleLogout}
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
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold overflow-hidden" style={{ width: '36px', height: '36px' }}>
                    {user && user.avatar ? (
                      <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      user && user.full_name ? user.full_name.charAt(0) : 'U'
                    )}
                  </div>
                  <div className="d-none d-md-block text-start">
                    <div className="fw-bold small lh-1">{user ? user.full_name : ''}</div>
                    <small className="text-muted extra-small text-capitalize">{user ? user.role : ''}</small>
                  </div>
                </div>
              </div>
            </header>

            <main className="dash-content flex-grow-1">
              <Routes>
                {/* Landowner Routes */}
                <Route path="/landowner/dashboard" element={<LandownerDashboard />} />
                <Route path="/landowner/my-lands" element={<MyLands />} />
                <Route path="/landowner/add-land" element={<AddLand />} />
                <Route path="/landowner/my-lands/:id/edit" element={<EditLand />} />
                <Route path="/landowner/applications" element={<LandownerApplications />} />
                <Route path="/landowner/earnings" element={<Earnings />} />
                <Route path="/landowner/profile" element={<ProfileSettings user={user} onUpdateProfile={handleLogin} />} />

                {/* Farmer Routes */}
                <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
                <Route path="/farmer/irrigation" element={<SmartIrrigation />} />
                <Route path="/farmer/my-crops" element={<MyCrops />} />
                <Route path="/farmer/add-crop" element={<AddCrop />} />
                <Route path="/farmer/leases" element={<Leases />} />
                <Route path="/farmer/payment/:leaseId" element={<FarmerPayment />} />
                <Route path="/farmer/transactions" element={<FarmerTransactions />} />
                <Route path="/farmer/applications" element={<FarmerApplications />} />
                <Route path="/farmer/profile" element={<ProfileSettings user={user} onUpdateProfile={handleLogin} />} />

                {/* Shared Dashboard Routes (Inside Sidebar layout when logged in) */}
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/land/:id" element={<LandDetails user={user} />} />

                {/* Buyer Routes */}
                <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
                <Route path="/buyer/marketplace" element={<BuyerMarketplace />} />
                <Route path="/buyer/cart" element={<Cart />} />
                <Route path="/buyer/checkout" element={<Checkout />} />
                <Route path="/buyer/payment" element={<BuyerPayment />} />
                <Route path="/buyer/orders" element={<Orders />} />
                <Route path="/buyer/transactions" element={<BuyerTransactions />} />
                <Route path="/buyer/profile" element={<ProfileSettings user={user} onUpdateProfile={handleLogin} />} />

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/lands" element={<LandModeration />} />
                <Route path="/admin/transactions" element={<AdminTransactions />} />
                <Route path="/admin/profile" element={<ProfileSettings user={user} onUpdateProfile={handleLogin} />} />

                {/* Fallback inside Dashboard */}
                <Route path="*" element={<FarmerDashboard />} />
              </Routes>
            </main>

            <MobileNav role={currentRole} />
            {currentRole === 'farmer' && <AgriAIChatbot user={user} />}
          </div>
        </div>
      ) : (
        /* Public Layout with Top Navbar & Footer */
        <>
          <Navbar user={user} onLogout={handleLogout} />
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
    </div>
  );
}