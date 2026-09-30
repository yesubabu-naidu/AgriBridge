import React from 'react';

export default function StatCard({ title, value, icon, color = 'primary', subtitle }) {
  return (
    <div className="stat-pill h-100">
      <div className={`stat-icon-wrap rounded-3 bg-${color}-subtle text-${color}`}>
        <i className={`bi ${icon} fs-4`}></i>
      </div>
      <div className="min-w-0 flex-grow-1 overflow-hidden">
        <h3 className="text-truncate">{value}</h3>
        <small className="text-muted fw-semibold text-truncate d-block" title={title}>{title}</small>
        {subtitle && <div className="text-muted extra-small text-truncate">{subtitle}</div>}
      </div>
    </div>
  );
}
