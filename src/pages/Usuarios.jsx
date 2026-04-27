import { useState } from 'react';
import { Search, Edit2, MoreVertical } from 'lucide-react';
import { usersData } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';
import styles from './Usuarios.module.css';

export function Usuarios() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = usersData.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <button className={styles.addBtn}>+ Adicionar Usuário</button>
      </div>

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
            {filteredUsers.map((user, index) => (
              <tr key={user.id} className={index % 2 === 0 ? styles.rowEven : ''}>
                <td className={styles.cellName}>
                  <div className={styles.userCell}>
                    <span className={styles.avatar}>{user.avatar}</span>
                    <div className={styles.userDetails}>
                      <p className={styles.userName}>{user.name}</p>
                      <span className={styles.userEmail}>{user.email}</span>
                    </div>
                  </div>
                </td>
                <td className={styles.cellType}>
                  <span className={styles.typeLabel}>{user.type}</span>
                </td>
                <td className={styles.cellSchool}>
                  <span className={styles.schoolLabel}>{user.school}</span>
                </td>
                <td className={styles.cellCourse}>
                  <span className={styles.courseLabel}>{user.course}</span>
                </td>
                <td className={styles.cellStatus}>
                  <StatusBadge status={user.status} />
                </td>
                <td className={styles.cellActions}>
                  <button className={styles.iconBtn} title="Editar">
                    <Edit2 size={16} />
                  </button>
                  <button className={styles.iconBtn} title="Mais opções">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className={styles.noResults}>
          <p>Nenhum usuário encontrado.</p>
        </div>
      )}
    </div>
  );
}
