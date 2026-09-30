import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function MobileNav({ role }) {
  const location = useLocation();

  const getLinks = () => {
    switch (role) {
      case 'farmer':
        return [
          ['/farmer/dashboard', 'Home', 'bi-house-door'],
          ['/farmer/leases', 'Leases', 'bi-journal-check'],
          ['/farmer/applications', 'Apps', 'bi-file-text'],
          ['/farmer/transactions', 'Txns', 'bi-receipt']
        ];
      case 'landowner':
        return [
          ['/landowner/dashboard', 'Home', 'bi-house-door'],
          ['/landowner/my-lands', 'Lands', 'bi-map'],
          ['/landowner/applications', 'Apps', 'bi-file-text'],
          ['/landowner/earnings', 'Earn', 'bi-wallet2']
        ];
      case 'buyer':
        return [
          ['/buyer/dashboard', 'Home', 'bi-house-door'],
          ['/buyer/marketplace', 'Store', 'bi-shop'],
          ['/buyer/cart', 'Cart', 'bi-cart'],
          ['/buyer/orders', 'Orders', 'bi-bag-check']
        ];
      case 'admin':
        return [
          ['/admin/dashboard', 'Home', 'bi-house-door'],
          ['/admin/users', 'Users', 'bi-people'],
          ['/admin/lands', 'Lands', 'bi-map'],
          ['/admin/transactions', 'Txns', 'bi-receipt']
        ];
      default:
        return [
          ['/', 'Home', 'bi-house-door'],
          ['/marketplace', 'Lands', 'bi-map'],
          ['/buyer/marketplace', 'Store', 'bi-shop'],
          ['/auth', 'Auth', 'bi-person']
        ];
    }
  };

  return (
    <nav className="mobile-bottom-nav">
      {getLinks().map(([path, label, icon]) => {
        const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(`${path}/`));
        return (
          <Link key={path} to={path} className={isActive ? 'active' : ''}
            aria-current={isActive ? 'page' : undefined}>
            <i className={`bi ${icon}`}></i>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
