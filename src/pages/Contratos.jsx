import { useState } from 'react';
import { contractsData } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';
import { Eye, Download, RotateCw, FileText, Search, X } from 'lucide-react';
import styles from './Contratos.module.css';

export function Contratos() {
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [searchText, setSearchText] = useState('');

  const filteredContracts = contractsData.filter((contract) => {
    const matchStatus = filterStatus === 'Todos' || contract.status === filterStatus;
    const matchSearch = searchText === '' || 
      contract.institutionName.toLowerCase().includes(searchText.toLowerCase()) ||
      contract.contractType.toLowerCase().includes(searchText.toLowerCase()) ||
      contract.contactPerson.toLowerCase().includes(searchText.toLowerCase());
    
    return matchStatus && matchSearch;
  });

  const statuses = ['Todos', 'Ativo', 'Vencido', 'Pendente de Assinatura'];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Contratos Institucionais</h1>
        <p className={styles.subtitle}>Contratos de instituições para uso da plataforma CaronaCity</p>
      </div>

      <div className={styles.searchWrapper}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Pesquisar por instituição, tipo de contrato ou contato..."
          className={styles.searchInput}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        {searchText && (
          <button
            className={styles.clearBtn}
            onClick={() => setSearchText('')}
            title="Limpar pesquisa"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className={styles.filterTabs}>
        {statuses.map((status) => (
          <button
            key={status}
            className={`${styles.filterBtn} ${filterStatus === status ? styles.active : ''}`}
            onClick={() => setFilterStatus(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {filteredContracts.length === 0 ? (
        <div className={styles.noResults}>
          <FileText size={48} />
          <p>Nenhum contrato encontrado com este filtro.</p>
        </div>
      ) : (
        <div className={styles.contractsList}>
          {filteredContracts.map((contract) => (
            <div key={contract.id} className={styles.contractCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <h3 className={styles.institutionName}>{contract.institutionName}</h3>
                  <p className={styles.contractType}>{contract.contractType}</p>
                </div>
                <StatusBadge status={contract.status} />
              </div>

              <p className={styles.description}>{contract.description}</p>

              <div className={styles.cardInfo}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Data de Assinatura</span>
                  <span className={styles.infoValue}>{new Date(contract.signDate).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Data de Vencimento</span>
                  <span className={styles.infoValue}>{new Date(contract.expiryDate).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Versão</span>
                  <span className={styles.infoValue}>{contract.version}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Contato</span>
                  <span className={styles.infoValue}>{contract.contactPerson}</span>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button className={styles.actionBtn} title="Visualizar contrato">
                  <Eye size={16} />
                  Visualizar
                </button>
                {contract.status === 'Vencido' && (
                  <button className={styles.renewBtn} title="Renovar contrato">
                    <RotateCw size={16} />
                    Renovar
                  </button>
                )}
                <button className={styles.downloadBtn} title="Download do contrato">
                  <Download size={16} />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
