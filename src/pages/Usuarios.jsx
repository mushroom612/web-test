import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { usersData } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';
import { PenaltyPanel } from '../components/PenaltyPanel';
import { UserProfilePanel } from '../components/UserProfilePanel';
import { UserActionsMenu } from '../components/UserActionsMenu';
import styles from './Usuarios.module.css';

function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?';
}

function statusLabel(usu_status) {
  return usu_status === 1 ? 'Ativo' : 'Inativo';
}

// Converte dados mock para o mesmo formato da API
const mockAsApi = usersData.map((u) => ({
  usu_id: u.id,
  usu_nome: u.name,
  usu_email: u.email,
  usu_status: u.status === 'Ativo' ? 1 : 0,
  _mock: true
}));

export function Usuarios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);
  const [profilePanel, setProfilePanel] = useState(null); // { user, mode: 'view'|'edit' }

  useEffect(() => {
    api
      .getUsers({ limit: 100 })
      .then((data) => setUsers(data.usuarios || []))
      .catch(() => setUsers(mockAsApi))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const nome = (u.usu_nome || '').toLowerCase();
    const email = (u.usu_email || '').toLowerCase();
    const q = searchTerm.toLowerCase();
    return nome.includes(q) || email.includes(q);
  });

  const handlePenaltyClick = (user) => {
    setSelectedUser(user);
    setIsPenaltyModalOpen(true);
  };

  const handleViewUser = (user) => setProfilePanel({ user, mode: 'view' });
  const handleEditUser = (user) => setProfilePanel({ user, mode: 'edit' });

  const handleUserUpdated = (updatedUser) => {
    setUsers(prev =>
      prev.map(u => u.usu_id === updatedUser.usu_id ? { ...u, ...updatedUser } : u)
    );
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Tem certeza que deseja desativar ${user.usu_nome}?`)) return;
    try {
      await api.updateUserStatus(user.usu_id, 0);
      setUsers((prev) =>
        prev.map((u) =>
          u.usu_id === user.usu_id ? { ...u, usu_status: 0 } : u
        )
      );
    } catch (err) {
      alert(`Erro ao desativar usuário: ${err.message}`);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Usuários</h1>
          <p className={styles.subtitle}>Lista de Usuários</p>
        </div>
      </div>

      <div className={styles.actionBar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {!loading && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.colName}>Nome</th>
                <th className={styles.colType}>Tipo</th>
                <th className={styles.colSchool}>Escola</th>
                <th className={styles.colCourse}>Curso</th>
                <th className={styles.colStatus}>Status</th>
                <th className={styles.colActions}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, index) => (
                <tr
                  key={user.usu_id}
                  className={index % 2 === 0 ? styles.rowEven : ''}
                >
                  <td className={styles.cellName}>
                    <div className={styles.userCell}>
                      <span className={styles.avatar}>
                        {getInitials(user.usu_nome)}
                      </span>
                      <div className={styles.userDetails}>
                        <p className={styles.userName}>{user.usu_nome}</p>
                        <span className={styles.userEmail}>{user.usu_email}</span>
                      </div>
                    </div>
                  </td>
                  <td className={styles.cellType}>
                    <span className={styles.typeLabel}>Usuário</span>
                  </td>
                  <td className={styles.cellSchool}>
                    <span className={styles.schoolLabel}>—</span>
                  </td>
                  <td className={styles.cellCourse}>
                    <span className={styles.courseLabel}>—</span>
                  </td>
                  <td className={styles.cellStatus}>
                    <StatusBadge status={statusLabel(user.usu_status)} />
                  </td>
                  <td className={styles.cellActions}>
                    <UserActionsMenu
                      user={user}
                      onEdit={handleEditUser}
                      onPenalize={handlePenaltyClick}
                      onDelete={handleDeleteUser}
                      onView={handleViewUser}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className={styles.noResults}>
          <p>Nenhum usuário encontrado.</p>
        </div>
      )}

      {isPenaltyModalOpen && (
        <PenaltyPanel
          user={selectedUser}
          onClose={() => setIsPenaltyModalOpen(false)}
        />
      )}

      {profilePanel && (
        <UserProfilePanel
          user={profilePanel.user}
          initialMode={profilePanel.mode}
          onClose={() => setProfilePanel(null)}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
}
