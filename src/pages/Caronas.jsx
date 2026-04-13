import { useState } from 'react';
import { ridesData } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';
import styles from './Caronas.module.css';

export function Caronas() {
  const [filterStatus, setFilterStatus] = useState('Todos');

  const filteredRides = ridesData.filter(
    (ride) => filterStatus === 'Todos' || ride.status === filterStatus
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Registros de Carona</h1>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Filtrar por Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="Todos">Todos</option>
            <option value="Concluída">Concluída</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Motorista</th>
              <th>Passageiros</th>
              <th>Origem</th>
              <th>Destino</th>
              <th>Horário</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRides.map((ride, index) => (
              <tr key={ride.id} className={index % 2 === 0 ? styles.rowEven : ''}>
                <td className={styles.idCell}>{ride.id}</td>
                <td>{ride.driver}</td>
                <td>{ride.passengers.join(', ')}</td>
                <td>{ride.origin}</td>
                <td>{ride.destination}</td>
                <td>{ride.time}</td>
                <td>
                  <StatusBadge status={ride.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRides.length === 0 && (
        <div className={styles.noResults}>
          <p>Nenhum registro de carona encontrado.</p>
        </div>
      )}
    </div>
  );
}
