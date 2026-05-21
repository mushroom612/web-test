// ============================================================
// pages/Contratos.jsx — Página de gestão de contratos institucionais
//
// Exibe os contratos das instituições (escolas) cadastradas na plataforma.
// Cada contrato representa um acordo entre a instituição e a plataforma Tuctuc.
//
// Funcionalidades:
//   - Busca por nome, domínio ou endereço da instituição
//   - Filtros por status: Todos / Ativo / Vencido / Pendente de Assinatura
//   - Card por contrato com: datas de início/vencimento, duração, domínio
//   - Botão "Renovar" aparece somente em contratos Vencidos
//   - StatusBadge colorido para indicar se o contrato está ativo, vencido
//     ou aguardando assinatura
//
// De onde vêm os dados:
//   - api.getSchools() → retorna lista de instituições; filtramos apenas
//     as que possuem `esc_contrato_duracao` preenchido (= têm contrato)
//
// Interligação:
//   - Importa: api.js (getSchools), StatusBadge.jsx
//   - Lucide React: Eye, Download, RotateCw, FileText, Search, X, Loader2, Building2
//
// Estilo: Contratos.module.css
//   Classes CSS utilizadas:
//     .container        → área raiz da página
//     .header           → cabeçalho com título e subtítulo
//     .title            → texto principal "Contratos Institucionais"
//     .subtitle         → texto descritivo abaixo do título
//     .searchWrapper    → wrapper do campo de busca (posição relativa para ícone)
//     .searchIcon       → ícone de lupa posicionado dentro do input
//     .searchInput      → campo de texto da busca
//     .clearBtn         → botão ✕ para limpar a busca (aparece quando há texto)
//     .filterTabs       → linha de botões de filtro por status
//     .filterBtn        → botão individual de filtro
//     .active           → estilo do filtro selecionado
//     .noResults        → estado vazio ou de carregamento (ícone + texto)
//     .contractsList    → grade/lista dos cards de contrato
//     .contractCard     → card individual de contrato
//     .cardHeader       → linha superior do card: nome + badge de status
//     .cardTitle        → agrupa nome e tipo do contrato
//     .institutionName  → nome da instituição (título do card)
//     .contractType     → "Contrato de X anos" (subtítulo do card)
//     .description      → endereço da instituição (quando disponível)
//     .cardInfo         → grade de itens de informação (início, vencimento, etc.)
//     .infoItem         → par label + valor de uma informação
//     .infoLabel        → texto da etiqueta (ex: "Data de Início")
//     .infoValue        → valor da informação (ex: "01/01/2024")
//     .cardActions      → linha de botões de ação (Visualizar, Renovar, Download)
//     .actionBtn        → botão "Visualizar contrato"
//     .renewBtn         → botão "Renovar" (aparece apenas para contratos vencidos)
//     .downloadBtn      → botão "Download"
// ============================================================

import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Eye, Download, RotateCw, FileText, Search, X, Loader2, Building2 } from 'lucide-react';
import styles from './Contratos.module.css';

// DURATION_LABEL: traduz o código de duração do banco para texto legível.
// A chave ('1ano', '2anos', '5anos') vem do campo esc_contrato_duracao.
const DURATION_LABEL = {
  '1ano': '1 Ano',
  '2anos': '2 Anos',
  '5anos': '5 Anos'
};

// parseLocalDate: converte uma string no formato 'AAAA-MM-DD' para um objeto Date.
// Usamos isso em vez de `new Date(dateStr)` porque o construtor de Date
// interpreta datas sem hora como UTC (meia-noite UTC), o que pode
// deslocar o dia ao converter para o fuso horário local (ex: Brasil UTC-3).
// Separar os componentes com split e passar para o construtor de Date
// como (ano, mês-1, dia) garante que a data seja local, sem deslocamento.
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  // split('-') → divide '2024-12-31' em ['2024', '12', '31']
  // .map(Number) → converte cada string para número
  const [y, m, d] = dateStr.split('-').map(Number);
  // mês - 1: em JavaScript, meses são de 0 a 11 (janeiro = 0)
  return new Date(y, m - 1, d);
}

// getContractStatus: determina o status atual do contrato de uma escola.
// Compara as datas do contrato com a data de hoje.
// Retorna: 'Pendente de Assinatura', 'Vencido' ou 'Ativo'
function getContractStatus(school) {
  const inicio = parseLocalDate(school.esc_contrato_inicio);
  const expira = parseLocalDate(school.esc_contrato_expira);

  // Se as datas não foram preenchidas, o contrato ainda não foi assinado
  if (!inicio || !expira) return 'Pendente de Assinatura';

  const today = new Date();
  // setHours(0,0,0,0) → zera a hora do dia atual para comparar apenas as datas
  today.setHours(0, 0, 0, 0);

  // Se a data de início é no futuro, o contrato ainda não começou
  if (inicio > today) return 'Pendente de Assinatura';

  // Se a data de vencimento já passou, o contrato está vencido
  if (expira < today) return 'Vencido';

  return 'Ativo';
}

export function Contratos() {
  // filterStatus: qual filtro de aba está selecionado ('Todos', 'Ativo', etc.)
  const [filterStatus, setFilterStatus] = useState('Todos');

  // searchText: texto digitado no campo de busca
  const [searchText, setSearchText] = useState('');

  // schools: lista de todas as instituições carregadas da API
  const [schools, setSchools] = useState([]);

  const [loading, setLoading] = useState(true);

  // Carrega as instituições da API ao montar o componente
  useEffect(() => {
    api.getSchools().then(data => {
      // A API pode retornar um array direto ou { escolas: [...] }
      // O operador ?? é "nullish coalescing": usa [] se data.escolas for null/undefined
      setSchools(Array.isArray(data) ? data : data.escolas ?? []);
      setLoading(false);
    });
  }, []);

  // contractSchools: filtra apenas as escolas que possuem contrato cadastrado.
  // esc_contrato_duracao truthy (preenchido) = tem contrato.
  const contractSchools = schools.filter(s => s.esc_contrato_duracao);

  // filteredContracts: aplica os filtros de status e de busca simultaneamente.
  // Para aparecer na lista, o item precisa satisfazer AMBAS as condições.
  const filteredContracts = contractSchools.filter((school) => {
    const status = getContractStatus(school);

    // matchStatus: true se o filtro for 'Todos' OU se o status bater com o filtro
    const matchStatus = filterStatus === 'Todos' || status === filterStatus;

    // matchSearch: true se a busca estiver vazia OU se o nome/domínio/endereço
    // contiver o texto digitado (comparação case-insensitive via toLowerCase)
    const matchSearch = searchText === '' ||
      school.esc_nome.toLowerCase().includes(searchText.toLowerCase()) ||
      (school.esc_dominio && school.esc_dominio.toLowerCase().includes(searchText.toLowerCase())) ||
      (school.esc_endereco && school.esc_endereco.toLowerCase().includes(searchText.toLowerCase()));

    return matchStatus && matchSearch;
  });

  // Opções disponíveis nas abas de filtro
  const statuses = ['Todos', 'Ativo', 'Vencido', 'Pendente de Assinatura'];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Contratos Institucionais</h1>
        <p className={styles.subtitle}>Contratos de instituições para uso da plataforma CaronaCity</p>
      </div>

      {/* Campo de busca com ícone e botão para limpar */}
      <div className={styles.searchWrapper}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Pesquisar por instituição, domínio ou endereço..."
          className={styles.searchInput}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        {/* Botão de limpar: só aparece se houver texto digitado.
            Renderização condicional: {searchText && (...)} — se searchText
            for uma string vazia (falsy), o botão não é exibido. */}
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

      {/* Abas de filtro por status */}
      <div className={styles.filterTabs}>
        {statuses.map((status) => (
          <button
            key={status}
            // styles.active é adicionado dinamicamente ao botão selecionado
            className={`${styles.filterBtn} ${filterStatus === status ? styles.active : ''}`}
            onClick={() => setFilterStatus(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Renderização condicional com operador ternário encadeado:
          loading    → mostra spinner
          lista vazia → mostra ícone + mensagem
          tem dados  → mostra os cards */}
      {loading ? (
        <div className={styles.noResults}>
          <Loader2 size={32} style={{ animation: 'spin 0.8s linear infinite' }} />
          <p>Carregando contratos...</p>
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className={styles.noResults}>
          <FileText size={48} />
          <p>
            {/* Mensagem diferente dependendo de se há contratos cadastrados ou não */}
            {contractSchools.length === 0
              ? 'Nenhum contrato cadastrado. Cadastre uma instituição com contrato.'
              : 'Nenhum contrato encontrado com este filtro.'}
          </p>
        </div>
      ) : (
        <div className={styles.contractsList}>
          {filteredContracts.map((school) => {
            // Calcula o status atual do contrato para este card específico
            const status = getContractStatus(school);
            return (
              <div key={school.esc_id} className={styles.contractCard}>
                {/* Cabeçalho do card: nome + badge de status */}
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <h3 className={styles.institutionName}>{school.esc_nome}</h3>
                    <p className={styles.contractType}>
                      {/* DURATION_LABEL converte '1ano' → '1 Ano' */}
                      Contrato de {DURATION_LABEL[school.esc_contrato_duracao]}
                    </p>
                  </div>
                  {/* StatusBadge exibe o status com a cor correspondente */}
                  <StatusBadge status={status} />
                </div>

                {/* Endereço: só exibe se estiver preenchido */}
                {school.esc_endereco && (
                  <p className={styles.description}>{school.esc_endereco}</p>
                )}

                {/* Grade de informações: início, vencimento, duração, domínio */}
                <div className={styles.cardInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Data de Início</span>
                    <span className={styles.infoValue}>
                      {/* Formata a data para pt-BR ou mostra '—' se ausente */}
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

                {/* Ações do card */}
                <div className={styles.cardActions}>
                  <button className={styles.actionBtn} title="Visualizar contrato">
                    <Eye size={16} />
                    Visualizar
                  </button>
                  {/* Botão "Renovar" só aparece para contratos Vencidos */}
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
