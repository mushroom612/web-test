// ============================================================
// pages/Caronas.jsx — Página de registros de carona
//
// Exibe todas as caronas em um layout mestre-detalhe:
//   - Painel esquerdo (lista): cards clicáveis de todas as caronas
//   - Painel direito (detalhe): detalhes completos da carona selecionada
//
// Endpoints reais consumidos:
//   - GET /api/admin/stats/caronas    → totais (Total/Abertas/Finalizadas/Canceladas)
//   - GET /api/admin/caronas          → lista (campos mínimos por carona)
//   - GET /api/caronas/:id/resumo     → detalhe (origem, destino, passageiros, veículo)
//
// O endpoint de lista é minimalista — não traz pontos nem passageiros.
// Por isso o painel de detalhe dispara um fetch on-click do /resumo,
// cacheado por car_id para evitar refetch ao reabrir a mesma carona.
//
// Para Admin (per_tipo=1) o backend já filtra a lista pela escola via JWT.
// Dev (per_tipo=2) vê tudo. Não precisamos passar esc_id daqui.
//
// Status no banco (CARONAS.car_status):
//   0 = Cancelada, 1 = Aberta, 2 = Em espera, 3 = Finalizada
//
// Funcionalidades:
//   - Filtros por status (Todos / Aberta / Em espera / Finalizada / Cancelada)
//   - Cards de resumo (total, abertas, finalizadas, canceladas) vindos da API
//   - Auto-seleção de carona quando navegado via URL (?id=N)
//   - Clique no mesmo card fecha o detalhe (toggle)
//
// Componente filho: StatusBadge
// Estilo: Caronas.module.css
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  IconCar, IconUsers, IconMapPin, IconCircleCheck, IconCircleX,
  IconLoader2, IconChevronRight, IconX, IconUser
} from '@tabler/icons-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import styles from './Caronas.module.css';

// statusLabel: traduz car_status (número) → rótulo do StatusBadge.
// Aceita string vinda da API (alguns endpoints retornam o nome direto).
function statusLabel(status) {
  if (typeof status === 'string') return status;
  switch (Number(status)) {
    case 0: return 'Cancelada';
    case 1: return 'Aberta';
    case 2: return 'Em espera';
    case 3: return 'Finalizada';
    default: return 'Desconhecido';
  }
}

// formatDateTime: combina car_data (YYYY-MM-DD) + car_hor_saida (HH:MM:SS)
// no padrão brasileiro dd/mm/aaaa HH:MM. Diferente do mock antigo que
// recebia uma string única "YYYY-MM-DD HH:MM", a API real retorna os
// dois campos separados.
function formatDateTime(carData, carHorSaida) {
  if (!carData) return '—';
  // car_data pode vir como "YYYY-MM-DD" puro ou ISO completo — pegamos só os 10 primeiros chars.
  const dateOnly = String(carData).slice(0, 10);
  // car_hor_saida pode vir "HH:MM" ou "HH:MM:SS" — pegamos só HH:MM.
  const timeStr = carHorSaida ? String(carHorSaida).slice(0, 5) : '00:00';
  const dt = new Date(`${dateOnly}T${timeStr}`);
  if (isNaN(dt.getTime())) return dateOnly;
  return dt.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// listItemToRide: converte um item de /api/admin/caronas (campos
// mínimos) para o formato visual. Origem/destino/passageiros e
// modelo do veículo ficam vazios — serão preenchidos via /resumo
// quando o usuário selecionar a carona.
function listItemToRide(r) {
  const nome = r.motorista || 'Motorista';
  return {
    id: r.car_id,
    driverName: nome,
    driverInitial: nome.charAt(0).toUpperCase(),
    driverId: r.motorista_id,
    driverEmail: r.motorista_email,
    status: statusLabel(r.car_status),
    statusCode: r.car_status,
    date: formatDateTime(r.car_data, r.car_hor_saida),
    // Data e hora separadas para os chips DATA/HORA do detalhe (estilo app)
    dataLabel: r.car_data ? String(r.car_data).slice(0, 10).split('-').reverse().join('/') : '—',
    horaLabel: r.car_hor_saida ? String(r.car_hor_saida).slice(0, 5) : '—',
    description: r.car_desc,
    // Lista não traz origem/destino; ficam null até o /resumo chegar.
    origin: null,
    destination: null,
    vagasDisponiveis: r.car_vagas_dispo,
    totalVagas: null,
    // Lista só tem placa e tipo (carro/moto); modelo vem no detalhe.
    vehicle: r.vei_placa || null,
    passengers: []
  };
}

// mergeResumo: combina a resposta de /api/caronas/:id/resumo dentro
// do objeto ride existente, preenchendo origem/destino/passageiros
// e completando o veículo com marca/modelo.
//
// pontos vêm como array de PONTO_ENCONTROS com pon_tipo:
//   0 = Partida (origem) | 1 = Destino
function mergeResumo(baseRide, resumo) {
  const { carona, pontos = [], passageiros = [] } = resumo || {};
  const origemPonto = pontos.find(p => p.pon_tipo === 0);
  const destinoPonto = pontos.find(p => p.pon_tipo === 1);
  // Preferimos o endereço descritivo; se faltar, caímos no nome do ponto.
  const originAddr = origemPonto ? (origemPonto.pon_endereco || origemPonto.pon_nome) : null;
  const destAddr   = destinoPonto ? (destinoPonto.pon_endereco || destinoPonto.pon_nome) : null;
  // Veículo formatado: "Honda Civic — ABC-1234"
  const vehicleParts = [];
  if (carona?.vei_marca_modelo) vehicleParts.push(carona.vei_marca_modelo);
  if (carona?.vei_placa) vehicleParts.push(carona.vei_placa);
  const vehicle = vehicleParts.length > 0 ? vehicleParts.join(' — ') : baseRide.vehicle;
  return {
    ...baseRide,
    origin: originAddr,
    destination: destAddr,
    vehicle,
    // Total de vagas do veículo (vei_vagas) — só temos isso no detalhe.
    totalVagas: carona?.vei_vagas ?? baseRide.totalVagas,
    // Mantemos a descrição mais recente caso o /resumo traga algo diferente
    description: carona?.car_desc ?? baseRide.description,
    passengers: passageiros
  };
}

// Opções de filtro disponíveis na barra de abas (rótulos da API)
const FILTER_OPTIONS = ['Todos', 'Aberta', 'Em espera', 'Finalizada', 'Cancelada'];
// STATUS_TO_CODE: converte o rótulo do filtro para o código numérico da API
const STATUS_TO_CODE = { 'Aberta': 1, 'Em espera': 2, 'Finalizada': 3, 'Cancelada': 0 };
const PAGE_SIZE = 15;

export function Caronas() {
  const navigate = useNavigate();

  const [rides, setRides] = useState([]);
  const [stats, setStats] = useState(null);     // { total, abertas, em_espera, finalizadas, canceladas }
  const [total, setTotal] = useState(0);        // total de caronas
  const [page, setPage] = useState(1);          // página atual
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('Todos'); // filtro ativo
  const [selectedId, setSelectedId] = useState(null);        // ID da carona selecionada

  // Cache de detalhes por car_id. Evita refetch do /resumo quando o
  // usuário reabre uma carona já visualizada.
  const [detailCache, setDetailCache] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // useSearchParams: lê ?id=N da URL (vindo do Dashboard, por exemplo).
  const [searchParams] = useSearchParams();

  // load: dispara as 2 chamadas em paralelo — stats (cards do topo) e
  // lista de caronas. Encapsulada em useCallback para reusar no retry.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusCode = filterStatus !== 'Todos' ? STATUS_TO_CODE[filterStatus] : undefined;
      const [statsResp, caronasResp] = await Promise.all([
        api.getStats('caronas'),
        api.getCaronas({ limit: PAGE_SIZE, page, status: statusCode })
      ]);
      setStats(statsResp?.stats || null);
      const lista = caronasResp?.caronas || [];
      setTotal(caronasResp?.total ?? 0);
      // Ordena do mais recente ao mais antigo antes de mapear.
      // Compara data + hora como string ISO — funciona porque o formato
      // YYYY-MM-DD garante ordenação lexicográfica correta.
      lista.sort((a, b) => {
        const aKey = `${a.car_data?.slice(0, 10) ?? ''}T${a.car_hor_saida ?? '00:00'}`;
        const bKey = `${b.car_data?.slice(0, 10) ?? ''}T${b.car_hor_saida ?? '00:00'}`;
        return bKey.localeCompare(aKey);
      });
      setRides(lista.map(listItemToRide));
    } catch (err) {
      setError(err.message || 'Não foi possível carregar as caronas.');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => { load(); }, [load]);

  // Auto-seleção via URL: se ?id=N existe e a carona está na lista,
  // abre o painel de detalhe automaticamente (ex: clique em um
  // feedback no Dashboard que aponta para uma carona).
  useEffect(() => {
    const rideId = searchParams.get('id');
    if (rideId && rides.length > 0) {
      const id = parseInt(rideId, 10);
      if (rides.find(r => r.id === id)) {
        setSelectedId(id);
        setFilterStatus('Todos'); // garante que a carona apareça na lista
      }
    }
  }, [searchParams, rides]);

  // Quando o usuário seleciona uma carona, busca o detalhe (/resumo)
  // se ainda não estiver no cache. cancelled previne setState quando
  // o usuário troca de carona rapidamente antes da resposta chegar.
  useEffect(() => {
    if (selectedId == null) return;
    if (detailCache[selectedId]) return; // já temos o detalhe em cache
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    api.getCaronaResumo(selectedId)
      .then(resumo => {
        if (!cancelled) {
          setDetailCache(prev => ({ ...prev, [selectedId]: resumo }));
        }
      })
      .catch(err => {
        if (!cancelled) setDetailError(err.message || 'Não foi possível carregar o detalhe.');
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedId, detailCache]);

  // selectedRide combina dados da lista + cache de detalhe.
  // Enquanto o /resumo não chega, usamos só o que veio da lista —
  // a UI mostra um indicador de carregamento nos campos faltantes.
  const selectedRide = useMemo(() => {
    if (selectedId == null) return null;
    const base = rides.find(r => r.id === selectedId);
    if (!base) return null;
    const resumo = detailCache[selectedId];
    return resumo ? mergeResumo(base, resumo) : base;
  }, [selectedId, rides, detailCache]);

  // Toggle: clicar na mesma carona fecha o detalhe; clicar em outra abre.
  function handleSelectRide(id) {
    setSelectedId(prev => prev === id ? null : id);
  }
  function handleCloseDetail() { setSelectedId(null); }
  function handleFilterChange(status) {
    setFilterStatus(status);
    setSelectedId(null);
    setPage(1); // volta para página 1 ao mudar filtro
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Tela de carregamento (boot inicial — stats + lista)
  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner size={28} />
      </div>
    );
  }

  // Tela de erro: o usuário sabe que algo deu errado e pode retentar com 1 clique.
  if (error) {
    return (
      <div className={styles.container}>
        <ErrorBanner
          error={error}
          title="Não foi possível carregar as caronas."
          onRetry={load}
        />
      </div>
    );
  }

  // Stats agora vêm da API — refletem o escopo todo, não apenas a página
  // atual. "Ativas" combina status=1 (Aberta) + status=2 (Em espera) para que
  // a aritmética feche: Total = Ativas + Finalizadas + Canceladas.
  const totalGeral       = stats?.total ?? 0;
  const totalAtivas      = (stats?.abertas ?? 0) + (stats?.em_espera ?? 0);
  const totalFinalizadas = stats?.finalizadas ?? 0;
  const totalCanceladas  = stats?.canceladas ?? 0;

  return (
    <div className={styles.container}>
      {/* Cards de resumo com totais por status (vindos de /api/admin/stats/caronas) */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <IconCar size={16} className={styles.statIconBlue} />
          <div>
            <p className={styles.statValue}>{totalGeral}</p>
            <p className={styles.statLabel}>Total</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <IconUsers size={16} className={styles.statIconGreen} />
          <div>
            <p className={styles.statValue}>{totalAtivas}</p>
            <p className={styles.statLabel}>Ativas</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <IconCircleCheck size={16} className={styles.statIconBlue} />
          <div>
            <p className={styles.statValue}>{totalFinalizadas}</p>
            <p className={styles.statLabel}>Finalizadas</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <IconCircleX size={16} className={styles.statIconRed} />
          <div>
            <p className={styles.statValue}>{totalCanceladas}</p>
            <p className={styles.statLabel}>Canceladas</p>
          </div>
        </div>
      </div>

      {/* Abas de filtro por status */}
      <div className={styles.filterTabs}>
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt}
            className={`${styles.filterBtn} ${filterStatus === opt ? styles.active : ''}`}
            onClick={() => handleFilterChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Layout mestre-detalhe.
          styles.layoutWithDetail é adicionado dinamicamente quando há
          carona selecionada, ajustando as larguras dos painéis via CSS. */}
      <div className={`${styles.layout} ${selectedRide ? styles.layoutWithDetail : ''}`}>

        {/* Painel esquerdo: lista de cards de caronas */}
        <div className={styles.listPanel}>
          {rides.length === 0 && (
            <EmptyState icon={IconCar} title="Nenhuma carona encontrada." />
          )}

          {rides.map(ride => {
            const isSelected = selectedId === ride.id;
            return (
              <div
                key={ride.id}
                className={`${styles.listCard} ${isSelected ? styles.listCardSelected : ''}`}
                onClick={() => handleSelectRide(ride.id)}
              >
                <div className={styles.listCardTop}>
                  <span className={styles.avatar}>{ride.driverInitial}</span>
                  <div className={styles.listCardInfo}>
                    <p className={styles.listCardName}>{ride.driverName}</p>
                    <span className={styles.listCardDate}>{ride.date}</span>
                  </div>
                  <div className={styles.listCardRight}>
                    <StatusBadge status={ride.status} />
                    <IconChevronRight size={14} className={styles.chevron} />
                  </div>
                </div>
                {/* A lista da API não traz origem/destino — só aparece no
                    detalhe ao clicar. Mostramos um hint discreto pra
                    indicar que existe informação adicional ali. */}
                <div className={styles.listCardFooter}>
                  <span className={styles.vagasPill}>
                    <IconUsers size={11} />
                    {ride.vagasDisponiveis} vaga{ride.vagasDisponiveis !== 1 ? 's' : ''}
                  </span>
                  {ride.vehicle && (
                    <span className={styles.listCardDate} style={{ marginLeft: 'auto' }}>
                      {ride.vehicle}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Paginação */}
          {rides.length > 0 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              itemLabel="carona"
              onPrevious={() => setPage(p => Math.max(1, p - 1))}
              onNext={() => setPage(p => Math.min(totalPages, p + 1))}
              compact
            />
          )}
        </div>

        {/* Painel direito: detalhe da carona selecionada. Só renderiza
            se selectedRide não for null. Mostra estados de loading e
            erro de detalhe enquanto o /resumo não chega. */}
        {selectedRide && (
          <div className={styles.detailPanel}>
            <div className={styles.detailHeader}>
              <div className={styles.detailHeaderLeft}>
                <StatusBadge status={selectedRide.status} />
              </div>
              <button className={styles.closeDetailBtn} onClick={handleCloseDetail} title="Fechar">
                <IconX size={16} />
              </button>
            </div>

            {/* Informações do motorista (já disponíveis na lista) */}
            <div
              className={`${styles.detailSender} ${selectedRide.driverId ? styles.clickableUser : ''}`}
              onClick={() => selectedRide.driverId && navigate(`/usuarios?id=${selectedRide.driverId}`)}
              title={selectedRide.driverId ? 'Ver perfil do motorista' : undefined}
            >
              <span className={styles.avatarLg}>{selectedRide.driverInitial}</span>
              <div>
                <p className={styles.detailSenderName}>{selectedRide.driverName}</p>
                <p className={styles.detailSenderSub}>
                  <IconUser size={11} /> Motorista #{selectedRide.driverId}
                </p>
              </div>
            </div>

            {/* Chips DATA / HORA — mesmo padrão do card do app */}
            <div className={styles.detailSection}>
              <div className={styles.metaRow}>
                <div className={styles.metaChip}>
                  <span className={styles.metaChipLabel}>Data</span>
                  <span className={styles.metaChipValue}>{selectedRide.dataLabel}</span>
                </div>
                <div className={styles.metaChip}>
                  <span className={styles.metaChipLabel}>Hora</span>
                  <span className={styles.metaChipValue}>{selectedRide.horaLabel}</span>
                </div>
              </div>
            </div>

            {/* Banner de erro do detalhe (não impede ver os campos da lista) */}
            {detailError && (
              <div className={styles.detailSection} style={{ background: 'var(--status-error-bg)' }}>
                <p className={styles.detailText} style={{ color: 'var(--status-error-text)' }}>
                  {detailError}
                </p>
              </div>
            )}

            {/* Rota: origem/destino vêm do /resumo. Mostra spinner
                enquanto aguarda. Rótulos Origem/Destino no estilo do card do app. */}
            <div className={styles.detailSection}>
              {detailLoading && !selectedRide.origin ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                  <IconLoader2 size={14} className={styles.spin} />
                  <span style={{ fontSize: 13 }}>Carregando rota...</span>
                </div>
              ) : (
                <div className={styles.routeDetail}>
                  <div className={styles.routeDetailRow}>
                    <IconMapPin size={14} className={styles.routeIconOrigin} />
                    <div>
                      <span className={styles.routeLabel}>Origem</span>
                      <span>{selectedRide.origin || '—'}</span>
                    </div>
                  </div>
                  <div className={styles.routeDetailConnector} />
                  <div className={styles.routeDetailRow}>
                    <IconMapPin size={14} className={styles.routeIconDest} />
                    <div>
                      <span className={styles.routeLabel}>Destino</span>
                      <span>{selectedRide.destination || '—'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedRide.description && (
              <div className={styles.detailSection}>
                <p className={styles.detailSectionLabel}>Descrição</p>
                <p className={styles.detailText}>{selectedRide.description}</p>
              </div>
            )}

            {/* Veículo: a lista só traz a placa; marca/modelo completa
                aparece após o /resumo chegar. */}
            {selectedRide.vehicle && (
              <div className={styles.detailSection}>
                <p className={styles.detailSectionLabel}>Veículo</p>
                <p className={styles.detailText}>{selectedRide.vehicle}</p>
              </div>
            )}

            <div className={styles.detailSection}>
              <p className={styles.detailSectionLabel}>Vagas</p>
              <p className={styles.detailText}>
                {selectedRide.vagasDisponiveis} disponível
                {selectedRide.totalVagas != null ? ` de ${selectedRide.totalVagas} total` : ''}
              </p>
            </div>

            {/* Lista de passageiros — só aparece após o /resumo carregar.
                Se está carregando ainda, mostramos um placeholder discreto. */}
            {detailLoading && selectedRide.passengers.length === 0 ? (
              <div className={styles.detailSection}>
                <p className={styles.detailSectionLabel}>Passageiros</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                  <IconLoader2 size={14} className={styles.spin} />
                  <span style={{ fontSize: 13 }}>Carregando passageiros...</span>
                </div>
              </div>
            ) : (
              <div className={styles.detailSection}>
                <p className={styles.detailSectionLabel}>
                  {selectedRide.passengers.length > 0
                    ? `Passageiros (${selectedRide.passengers.length})`
                    : 'Passageiros'}
                </p>
                {selectedRide.passengers.length > 0 ? (
                  <div className={styles.passengerList}>
                    {selectedRide.passengers.map(p => (
                      <div
                        key={p.usu_id}
                        className={`${styles.passengerRow} ${p.usu_id ? styles.clickableUser : ''}`}
                        onClick={() => p.usu_id && navigate(`/usuarios?id=${p.usu_id}`)}
                        title={p.usu_id ? 'Ver perfil do passageiro' : undefined}
                      >
                        <span className={styles.passengerAvatar}>
                          {(p.usu_nome || 'U').charAt(0).toUpperCase()}
                        </span>
                        <span className={styles.passengerName}>{p.usu_nome}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.helperBox}>
                    <p className={styles.helperText}>Nenhum passageiro confirmado ainda.</p>
                  </div>
                )}
              </div>
            )}

            <div className={styles.detailSection}>
              <p className={styles.detailSectionLabel}>ID da Carona</p>
              <p className={styles.detailId}>#{selectedRide.id}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
