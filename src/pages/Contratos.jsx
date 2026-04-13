import { contractsData } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';
import styles from './Contratos.module.css';

export function Contratos() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Contratos</h1>
        <p className={styles.subtitle}>Termos e Acordos Aceitos</p>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Tipo de Contrato</th>
              <th>Data de Aceite</th>
              <th>Versão</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {contractsData.map((contract, index) => (
              <tr key={contract.id} className={index % 2 === 0 ? styles.rowEven : ''}>
                <td className={styles.cellName}>{contract.userName}</td>
                <td>{contract.contractType}</td>
                <td>{contract.acceptDate}</td>
                <td className={styles.cellVersion}>{contract.version}</td>
                <td>
                  <StatusBadge status={contract.status} />
                </td>
                <td className={styles.cellActions}>
                  <button className={styles.actionBtn}>Visualizar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
