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

import { useState, useEffect, useCallback } from 'react';
import { IconSearch } from '@tabler/icons-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PenaltyPanel } from '../components/PenaltyPanel';
import { UserProfilePanel } from '../components/UserProfilePanel';
import { UserActionsMenu } from '../components/UserActionsMenu';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { Pagination } from '../components/Pagination';
import styles from './Usuarios.module.css';

// UserAvatar: avatar de linha da tabela.
// Exibe a foto do usuário se usu_foto estiver preenchido e carregar com sucesso.
// Se a foto falhar ou for nula, exibe as iniciais como fallback.
// Definido fora do componente principal para não ser recriado a cada render.
function UserAvatar({ src, name, className }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={className}>
      {src && !failed
        ? <img
            src={src}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
            onError={() => setFailed(true)}
          />
        : getInitials(name)}
    </span>
  );
}

// getInitials: gera as iniciais do nome para usar como avatar.
// Ex: "Carlos Silva" → "CS", "Admin" → "AD"
// split(' ') → divide o nome em palavras
// slice(0, 2) → pega as 2 primeiras palavras
// map(n => n[0]) → pega a primeira letra de cada
// join('') → junta as letras
// toUpperCase() → garante maiúsculas
function getInitials(name) {
  if (!name) return '?';
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

// perTipoLabel: converte per_tipo para texto legível na coluna Tipo.
// 1=Admin de Escola, 2=Desenvolvedor, 0 ou outros=Usuário
function perTipoLabel(per_tipo) {
  if (per_tipo === 1) return 'Admin';
  if (per_tipo === 2) return 'Dev';
  return 'Usuário';
}

const PAGE_SIZE = 10;

export function Usuarios() {
  // isDev: usado para controlar quais ações de status são visíveis.
  // Admin (per_tipo=1) não pode desativar usuários comuns (per_tipo=0).
  const { isDev } = useAuth();

  // Estados de controle da interface:
  const [searchTerm, setSearchTerm] = useState('');       // texto digitado na busca
  const [page, setPage] = useState(1);                     // página atual
  const [users, setUsers] = useState([]);                  // lista de usuários da página atual
  const [total, setTotal] = useState(0);                   // total de usuários
  const [loading, setLoading] = useState(true);            // spinner de carregamento
  const [error, setError] = useState('');                  // mensagem de erro do fetch inicial

  // selectedUser: usuário sobre o qual o PenaltyPanel será aberto
  const [selectedUser, setSelectedUser] = useState(null);
  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);

  // profilePanel: objeto { user, mode } que controla o UserProfilePanel.
  // mode: 'view' = só visualizar | 'edit' = modo de edição
  const [profilePanel, setProfilePanel] = useState(null);

  const loadUsers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.getUsers({ limit: PAGE_SIZE, page });
      setUsers(data.usuarios || []);
      setTotal(data.total ?? 0);
    } catch (err) {
      if (!silent) setError(err.message || 'Não foi possível carregar os usuários.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Poll a cada 60s; pausa quando a aba está em segundo plano
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') loadUsers(true);
    }, 60_000);
    return () => clearInterval(id);
  }, [loadUsers]);

  // totalPages: número total de páginas para paginação
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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

  // handleToggleStatus: alterna o status do usuário (Ativo ↔ Inativo) após confirmação.
  // PATCH /api/admin/usuarios/:id/status  { usu_status: 0|1 }
  // Atualiza localmente após sucesso para não recarregar a lista inteira.
  const handleToggleStatus = async (user) => {
    const novoStatus = user.usu_status === 1 ? 0 : 1;
    const acao = novoStatus === 0 ? 'desativar' : 'reativar';
    const nome = user.usu_nome || user.usu_email || `usuário #${user.usu_id}`;
    if (!window.confirm(`Tem certeza que deseja ${acao} ${nome}?`)) return;
    try {
      await api.updateUserStatus(user.usu_id, novoStatus);
      setUsers((prev) =>
        prev.map((u) =>
          u.usu_id === user.usu_id ? { ...u, usu_status: novoStatus } : u
        )
      );
    } catch (err) {
      const msg = err?.body?.error || err?.body?.message || `Não foi possível ${acao} o usuário.`;
      alert(msg);
    }
  };

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
          <IconSearch size={18} />
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
      {loading && <LoadingSpinner size={28} />}

      {/* Banner de erro: exibe quando o fetch inicial falha */}
      {!loading && error && <ErrorBanner error={error} />}

      {/* Tabela de usuários: só aparece quando o carregamento termina */}
      {!loading && (
        <>
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
                {users.map((user, index) => (
                  // index % 2 === 0 → aplica fundo diferente nas linhas pares
                  // criando o efeito zebrado da tabela
                  <tr
                    key={user.usu_id}
                    className={index % 2 === 0 ? styles.rowEven : ''}
                  >
                    {/* Célula de nome: avatar circular + nome + e-mail */}
                    <td className={styles.cellName}>
                      <div className={styles.userCell}>
                        <UserAvatar
                          src={user.usu_foto}
                          name={user.usu_nome}
                          className={styles.avatar}
                        />
                        <div className={styles.userDetails}>
                          <p className={styles.userName}>{user.usu_nome}</p>
                          <span className={styles.userEmail}>{user.usu_email}</span>
                        </div>
                      </div>
                    </td>
                    {/* per_tipo vem do endpoint /api/admin/usuarios */}
                    <td className={styles.cellType}>
                      <span className={styles.typeLabel}>{perTipoLabel(user.per_tipo)}</span>
                    </td>
                    {/* esc_nome / cur_nome: campos retornados pelo endpoint de lista admin */}
                    <td className={styles.cellSchool}>
                      <span className={styles.schoolLabel}>{user.esc_nome ?? '—'}</span>
                    </td>
                    <td className={styles.cellCourse}>
                      <span className={styles.courseLabel}>{user.cur_nome ?? '—'}</span>
                    </td>
                    {/* StatusBadge: componente reutilizável de badge colorido */}
                    <td className={styles.cellStatus}>
                      <StatusBadge status={statusLabel(user.usu_status)} />
                    </td>
                    {/* UserActionsMenu: menu ⋮ com as opções da linha.
                        onToggleStatus → ativa/desativa via PATCH /api/admin/usuarios/:id/status */}
                    <td className={styles.cellActions}>
                      <UserActionsMenu
                        user={user}
                        onEdit={handleEditUser}
                        onPenalize={handlePenaltyClick}
                        onView={handleViewUser}
                        // Admin só pode alterar status de outros admins (per_tipo=1),
                        // não de usuários comuns. Dev pode alterar qualquer um.
                        onToggleStatus={isDev || user.per_tipo === 1 ? handleToggleStatus : undefined}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            itemLabel="usuário"
            onPrevious={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => Math.min(totalPages, p + 1))}
          />
        </>
      )}

      {/* Mensagem de lista vazia */}
      {!loading && users.length === 0 && (
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
