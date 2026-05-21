// ============================================================
// pages/Usuarios.jsx — Página de listagem e gerenciamento de usuários
//
// Exibe todos os usuários cadastrados em uma tabela,
// com busca por nome/e-mail e ações por linha (ver, editar,
// penalizar, desativar). Dois painéis deslizantes (PenaltyPanel
// e UserProfilePanel) aparecem sobre a tabela quando acionados.
//
// Componentes filhos usados nesta página:
//   - StatusBadge       → badge colorido de status (Ativo/Inativo)
//   - PenaltyPanel      → painel lateral de penalidades do usuário
//   - UserProfilePanel  → painel lateral de perfil/edição do usuário
//   - UserActionsMenu   → menu suspenso de ações por linha (⋮)
//
// Bibliotecas usadas:
//   - react             → useState, useEffect
//   - lucide-react      → ícones Search (busca) e Loader2 (spinner)
//
// Estilo: Usuarios.module.css
//   Classes principais:
//     .container       → área da página
//     .header          → cabeçalho com título
//     .actionBar       → barra com campo de busca
//     .searchBox       → wrapper do campo de busca
//     .searchInput     → input de texto da busca
//     .tableWrapper    → scroll horizontal da tabela
//     .table           → tabela HTML estilizada
//     .colName/colType/colSchool/colCourse/colStatus/colActions → colunas
//     .rowEven         → cor alternada de fundo para linhas pares
//     .cellName/cellType/cellSchool/cellCourse/cellStatus/cellActions → células
//     .userCell        → célula com avatar + nome + email lado a lado
//     .avatar          → círculo com as iniciais do usuário
//     .userName/.userEmail → nome e e-mail dentro da célula
//     .noResults       → mensagem quando nenhum usuário é encontrado
// ============================================================

import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { usersData } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';
import { PenaltyPanel } from '../components/PenaltyPanel';
import { UserProfilePanel } from '../components/UserProfilePanel';
import { UserActionsMenu } from '../components/UserActionsMenu';
import styles from './Usuarios.module.css';

// getInitials: gera as iniciais do nome para usar como avatar.
// Ex: "Carlos Silva" → "CS", "Admin" → "AD"
// split(' ') → divide o nome em palavras
// slice(0, 2) → pega as 2 primeiras palavras
// map(n => n[0]) → pega a primeira letra de cada
// join('') → junta as letras
// toUpperCase() → garante maiúsculas
function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?';
}

// statusLabel: converte o número do status para texto legível.
// usu_status === 1 → 'Ativo', qualquer outro → 'Inativo'
function statusLabel(usu_status) {
  return usu_status === 1 ? 'Ativo' : 'Inativo';
}

// mockAsApi: converte os dados de "usersData" (formato de interface)
// para o formato da API (campos com prefixo usu_).
// Usado como fallback quando a chamada à API falha.
// O campo _mock: true marca que esses dados são fictícios.
const mockAsApi = usersData.map((u) => ({
  usu_id: u.id,
  usu_nome: u.name,
  usu_email: u.email,
  usu_status: u.status === 'Ativo' ? 1 : 0,
  _mock: true
}));

export function Usuarios() {
  // Estados de controle da interface:
  const [searchTerm, setSearchTerm] = useState('');       // texto digitado na busca
  const [users, setUsers] = useState([]);                  // lista de usuários carregada da API
  const [loading, setLoading] = useState(true);            // spinner de carregamento

  // selectedUser: usuário sobre o qual o PenaltyPanel será aberto
  const [selectedUser, setSelectedUser] = useState(null);
  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);

  // profilePanel: objeto { user, mode } que controla o UserProfilePanel.
  // mode: 'view' = só visualizar | 'edit' = modo de edição
  const [profilePanel, setProfilePanel] = useState(null);

  // useEffect: carrega os usuários da API ao montar o componente.
  // .then() → quando a API responde com sucesso
  // .catch() → se der erro, usa os dados mock como fallback
  // .finally() → sempre executa (esconde o spinner)
  useEffect(() => {
    api
      .getUsers({ limit: 100 })
      .then((data) => setUsers(data.usuarios || []))
      .catch(() => setUsers(mockAsApi))
      .finally(() => setLoading(false));
  }, []);

  // filtered: versão filtrada da lista de usuários conforme o searchTerm.
  // A busca é case-insensitive (toLowerCase normaliza maiúsculas).
  const filtered = users.filter((u) => {
    const nome = (u.usu_nome || '').toLowerCase();
    const email = (u.usu_email || '').toLowerCase();
    const q = searchTerm.toLowerCase();
    return nome.includes(q) || email.includes(q);
  });

  // Handlers: funções que respondem a ações do usuário.

  // Abre o PenaltyPanel para o usuário clicado
  const handlePenaltyClick = (user) => {
    setSelectedUser(user);
    setIsPenaltyModalOpen(true);
  };

  // Abre o UserProfilePanel no modo visualização
  const handleViewUser = (user) => setProfilePanel({ user, mode: 'view' });

  // Abre o UserProfilePanel no modo edição
  const handleEditUser = (user) => setProfilePanel({ user, mode: 'edit' });

  // Atualiza localmente o usuário editado sem precisar recarregar a lista.
  // prev.map percorre todos os usuários: quando encontra o editado,
  // substitui pelo novo; os outros ficam iguais (spread: ...u).
  const handleUserUpdated = (updatedUser) => {
    setUsers(prev =>
      prev.map(u => u.usu_id === updatedUser.usu_id ? { ...u, ...updatedUser } : u)
    );
  };

  // Desativa um usuário (muda usu_status para 0) após confirmação.
  // confirm() → caixa de diálogo nativa do navegador (OK / Cancelar)
  // const handleDeleteUser = async (user) => {
  //   if (!confirm(`Tem certeza que deseja desativar ${user.usu_nome}?`)) return;
  //   try {
  //     await api.updateUserStatus(user.usu_id, 0);
  //     // Atualiza o status localmente para evitar recarregar a lista inteira
  //     setUsers((prev) =>
  //       prev.map((u) =>
  //         u.usu_id === user.usu_id ? { ...u, usu_status: 0 } : u
  //       )
  //     );
  //   } catch (err) {
  //     alert(`Erro ao desativar usuário: ${err.message}`);
  //   }
  // };

  return (
    <div className={styles.container}>
      {/* Cabeçalho da página */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Usuários</h1>
          <p className={styles.subtitle}>Lista de Usuários</p>
        </div>
      </div>

      {/* Barra de busca */}
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

      {/* Spinner: aparece apenas enquanto loading for true */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          {/* style={{ animation: ... }} → animação de giro inline */}
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* Tabela de usuários: só aparece quando o carregamento termina */}
      {!loading && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {/* Cada th tem uma classe própria para controlar a largura */}
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
                // index % 2 === 0 → aplica fundo diferente nas linhas pares
                // criando o efeito zebrado da tabela
                <tr
                  key={user.usu_id}
                  className={index % 2 === 0 ? styles.rowEven : ''}
                >
                  {/* Célula de nome: avatar circular + nome + e-mail */}
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
                  {/* StatusBadge: componente reutilizável de badge colorido */}
                  <td className={styles.cellStatus}>
                    <StatusBadge status={statusLabel(user.usu_status)} />
                  </td>
                  {/* UserActionsMenu: menu ⋮ com as opções da linha */}
                  <td className={styles.cellActions}>
                    <UserActionsMenu
                      user={user}
                      onEdit={handleEditUser}
                      onPenalize={handlePenaltyClick}
                      onView={handleViewUser}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mensagem de lista vazia */}
      {!loading && filtered.length === 0 && (
        <div className={styles.noResults}>
          <p>Nenhum usuário encontrado.</p>
        </div>
      )}

      {/* PenaltyPanel: painel lateral de penalidades.
          Só renderiza se isPenaltyModalOpen for true.
          onClose → função que fecha o painel (seta o estado para false) */}
      {isPenaltyModalOpen && (
        <PenaltyPanel
          user={selectedUser}
          onClose={() => setIsPenaltyModalOpen(false)}
        />
      )}

      {/* UserProfilePanel: painel lateral de perfil do usuário.
          profilePanel é null quando fechado, ou { user, mode } quando aberto. */}
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
