import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Eye, Download, RotateCw, FileText, Search, X, Loader2, Building2 } from 'lucide-react';
import styles from './Contratos.module.css';

const DURATION_LABEL = {
  '1ano': '1 Ano',
  '2anos': '2 Anos',
  '5anos': '5 Anos'
};

function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function getContractStatus(school) {
  const inicio = parseLocalDate(school.esc_contrato_inicio);
  const expira = parseLocalDate(school.esc_contrato_expira);
  if (!inicio || !expira) return 'Pendente de Assinatura';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (inicio > today) return 'Pendente de Assinatura';
  if (expira < today) return 'Vencido';
  return 'Ativo';
}

export function Contratos() {
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [searchText, setSearchText] = useState('');
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSchools().then(data => {
      setSchools(Array.isArray(data) ? data : data.escolas ?? []);
      setLoading(false);
    });
  }, []);

  const contractSchools = schools.filter(s => s.esc_contrato_duracao);

  const filteredContracts = contractSchools.filter((school) => {
    const status = getContractStatus(school);
    const matchStatus = filterStatus === 'Todos' || status === filterStatus;
    const matchSearch = searchText === '' ||
      school.esc_nome.toLowerCase().includes(searchText.toLowerCase()) ||
      (school.esc_dominio && school.esc_dominio.toLowerCase().includes(searchText.toLowerCase())) ||
      (school.esc_endereco && school.esc_endereco.toLowerCase().includes(searchText.toLowerCase()));
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
          placeholder="Pesquisar por instituição, domínio ou endereço..."
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

      {loading ? (
        <div className={styles.noResults}>
          <Loader2 size={32} style={{ animation: 'spin 0.8s linear infinite' }} />
          <p>Carregando contratos...</p>
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className={styles.noResults}>
          <FileText size={48} />
          <p>
            {contractSchools.length === 0
              ? 'Nenhum contrato cadastrado. Cadastre uma instituição com contrato.'
              : 'Nenhum contrato encontrado com este filtro.'}
          </p>
        </div>
      ) : (
        <div className={styles.contractsList}>
          {filteredContracts.map((school) => {
            const status = getContractStatus(school);
            return (
              <div key={school.esc_id} className={styles.contractCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <h3 className={styles.institutionName}>{school.esc_nome}</h3>
                    <p className={styles.contractType}>
                      Contrato de {DURATION_LABEL[school.esc_contrato_duracao]}
                    </p>
                  </div>
                  <StatusBadge status={status} />
                </div>

                {school.esc_endereco && (
                  <p className={styles.description}>{school.esc_endereco}</p>
                )}

                <div className={styles.cardInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Data de Início</span>
                    <span className={styles.infoValue}>
                      {school.esc_contrato_inicio
                        ? parseLocalDate(school.esc_contrato_inicio).toLocaleDateString('pt-BR')
                        : '—'}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Data de Vencimento</span>
                    <span className={styles.infoValue}>
                      {school.esc_contrato_expira
                        ? parseLocalDate(school.esc_contrato_expira).toLocaleDateString('pt-BR')
                        : '—'}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Duração</span>
                    <span className={styles.infoValue}>{DURATION_LABEL[school.esc_contrato_duracao]}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Domínio</span>
                    <span className={styles.infoValue}>{school.esc_dominio || 'Sem restrição'}</span>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button className={styles.actionBtn} title="Visualizar contrato">
                    <Eye size={16} />
                    Visualizar
                  </button>
                  {status === 'Vencido' && (
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
            );
          })}
        </div>
      )}
    </div>
  );
}
