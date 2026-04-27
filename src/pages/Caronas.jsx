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
            <option value="Aberta">Aberta</option>
            <option value="Em espera">Em espera</option>
            <option value="Concluída">Concluída</option>
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
              <th>Descrição</th>
              <th>Origem</th>
              <th>Destino</th>
              <th>Horário</th>
              <th>Vagas</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRides.map((ride, index) => (
              <tr key={ride.id} className={index % 2 === 0 ? styles.rowEven : ''}>
                <td className={styles.idCell}>{ride.id}</td>
                <td>{ride.driver}</td>
                <td>
                  <span className={styles.description} title={ride.description}>
                    {ride.description.length > 30 ? ride.description.substring(0, 30) + '...' : ride.description}
                  </span>
                </td>
                <td>
                  <span className={styles.location}>{ride.originPoint || ride.origin.split(',')[0]}</span>
                </td>
                <td>
                  <span className={styles.location}>{ride.destinationPoint || ride.destination.split(',')[0]}</span>
                </td>
                <td>{ride.time}</td>
                <td>
                  <span className={styles.vagas}>{ride.vagasDisponiveis}</span>
                </td>
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
