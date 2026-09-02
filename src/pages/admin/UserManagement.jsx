import React, { useState, useEffect } from 'react';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { api } from '../../services/api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await api.getUsers();
    setUsers(data);
    setLoading(false);
  };

  const toggleStatus = (userId) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        return { ...u, status: u.status === 'active' ? 'suspended' : 'active' };
      }
      return u;
    }));
  };

  return (
    <div className="admin-users-page">
      <div className="mb-4">
        <span className="eyebrow">USER AUDIT</span>
        <h2 className="fw-black mb-1">User Management</h2>
        <p className="text-muted small">Manage system user profiles, role assignments, and account statuses.</p>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-success"></div></div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr className="text-muted small">
                  <th>User</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="fw-bold">{u.full_name}</div>
                      <small className="text-muted">{u.email}</small>
                    </td>
                    <td><span className="badge bg-light text-dark text-capitalize border fw-bold">{u.role}</span></td>
                    <td>{u.phone}</td>
                    <td className="small text-muted">{u.created_at}</td>
                    <td><StatusBadge status={u.status} /></td>
                    <td>
                      <button 
                        className={`btn btn-sm ${u.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                        onClick={() => toggleStatus(u.id)}
                      >
                        {u.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
