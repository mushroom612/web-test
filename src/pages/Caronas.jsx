// ============================================================
// pages/Caronas.jsx — Página de registros de carona
//
// Exibe todas as caronas em um layout mestre-detalhe:
//   - Painel esquerdo (lista): cards clicáveis de todas as caronas
//   - Painel direito (detalhe): detalhes completos da carona selecionada
//
// Funcionalidades:
//   - Filtros por status (Todos / Aberta / Em espera / Concluída / Cancelada)
//   - Cards de resumo (total, abertas, concluídas, canceladas)
//   - Auto-seleção de carona quando navegado via URL (?id=N)
//     Isso permite o Dashboard redirecionar para uma carona específica.
//   - Clique no mesmo card fecha o detalhe (toggle)
//
// Componente filho: StatusBadge (badge colorido de status)
//
// Bibliotecas usadas:
//   - react              → useState, useEffect
//   - react-router-dom   → useSearchParams (lê parâmetros da URL como ?id=1)
//   - lucide-react       → ícones variados
//
// Estilo: Caronas.module.css
//   Classes principais:
//     .container          → área da página
//     .header             → cabeçalho com título
//     .statsRow           → linha de cards de resumo
//     .statCard           → cada card de estatística
//     .statIconBlue/Green/Red → cor do ícone no card
//     .filterTabs         → linha de botões de filtro
//     .filterBtn          → botão de filtro individual
//     .active             → estilo do filtro selecionado
//     .layout             → container do layout mestre-detalhe
//     .layoutWithDetail   → ajusta larguras quando detalhe está visível
//     .listPanel          → painel esquerdo (lista de caronas)
//     .listCard           → card de cada carona na lista
//     .listCardSelected   → destaque do card selecionado
//     .detailPanel        → painel direito (detalhes da carona)
//     .detailSection      → seção dentro do painel de detalhes
//     .routeDetail        → exibição de origem → destino
//     .passengerList      → lista de passageiros no detalhe
//     .loadingWrap/.spin  → spinner de carregamento
//     .emptyState         → estado vazio (nenhuma carona)
// ============================================================

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Car, Users, MapPin, Clock, CheckCircle, XCircle,
  Loader2, ChevronRight, X, User
} from 'lucide-react';
import { api } from '../services/api';
import { apiRidesData } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';
import styles from './Caronas.module.css';

// statusLabel: traduz o número car_status para texto exibível.
// Os números seguem o padrão do banco de dados definido em mockData.js.
function statusLabel(status) {
  switch (status) {
    case 1: return 'Aberta';
    case 2: return 'Em espera';
    case 3: return 'Concluída';
    case 4: return 'Cancelada';
    default: return 'Desconhecido';
  }
}

// shortAddress: encurta um endereço longo para exibir só a primeira parte.
// Ex: "Rua das Flores, 123, Centro, SP" → "Rua das Flores"
// split(',')[0] → divide pela vírgula e pega só o primeiro trecho
function shortAddress(addr) {
  if (!addr) return '—';
  return addr.split(',')[0].trim();
}

// formatDate: formata uma string de data/hora para o padrão brasileiro.
// .replace(' ', 'T') → corrige o formato "2024-04-13 07:30" para ISO 8601
// isNaN(date.getTime()) → verifica se a data é válida
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr.replace(' ', 'T'));
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// apiToRide: converte o formato da API (car_*, pon_*, etc.) para o
// formato interno usado pelos componentes visuais desta página.
// Desacopla a camada de dados da camada de apresentação.
function apiToRide(r) {
  return {
    id: r.car_id,
    driverName: r.usu_nome_motorista,
    // charAt(0).toUpperCase() → primeira letra do nome como avatar
    driverInitial: (r.usu_nome_motorista || 'M').charAt(0).toUpperCase(),
    driverId: r.usu_id_motorista,
    status: statusLabel(r.car_status),
    date: formatDate(r.car_data),
    description: r.car_desc,
    origin: r.pon_partida,
    destination: r.pon_destino,
    vagasDisponiveis: r.car_vagas_disponivel,
    totalVagas: r.car_vagas,
    // Template literal: monta "Honda Civic — DEF-9012" (ou só o modelo)
    vehicle: r.vei_modelo
      ? `${r.vei_modelo}${r.vei_placa ? ' — ' + r.vei_placa : ''}`
      : null,
    passengers: r.passageiros || []
  };
}

// Opções de filtro disponíveis na barra de abas
const FILTER_OPTIONS = ['Todos', 'Aberta', 'Em espera', 'Concluída', 'Cancelada'];

export function Caronas() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Todos'); // filtro ativo
  const [selectedId, setSelectedId] = useState(null);        // ID da carona selecionada

  // useSearchParams: hook que lê os parâmetros da URL.
  // Ex: "/caronas?id=3" → searchParams.get('id') === '3'
  const [searchParams] = useSearchParams();

  // Carrega as caronas da API ao montar o componente
  useEffect(() => {
    api
      .getCaronas()
      .then((data) => {
        const lista = Array.isArray(data) ? data : (data.caronas || []);
        setRides(lista.length > 0 ? lista.map(apiToRide) : apiRidesData.map(apiToRide));
      })
      .catch(() => setRides(apiRidesData.map(apiToRide)))
      .finally(() => setLoading(false));
  }, []);

  // Ao carregar as caronas, verifica se a URL tem ?id=N
  // e seleciona automaticamente essa carona (ex: quando vem do Dashboard).
  // Depende de [searchParams, rides] → roda novamente se algum mudar.
  useEffect(() => {
    const rideId = searchParams.get('id');
    if (rideId && rides.length > 0) {
      const id = parseInt(rideId, 10); // converte string para número
      if (rides.find(r => r.id === id)) {
        setSelectedId(id);
        setFilterStatus('Todos'); // garante que a carona apareça na lista
      }
    }
  }, [searchParams, rides]);

  // Filtra as caronas conforme o status selecionado na barra de abas
  const filteredRides = rides.filter(r =>
    filterStatus === 'Todos' || r.status === filterStatus
  );

  // Encontra o objeto completo da carona selecionada
  const selectedRide = rides.find(r => r.id === selectedId) ?? null;

  // Toggle: clicar na mesma carona fecha o detalhe; clicar em outra abre
  function handleSelectRide(id) {
    setSelectedId(prev => prev === id ? null : id);
  }

  function handleCloseDetail() { setSelectedId(null); }

  // Ao mudar o filtro, fecha qualquer detalhe aberto
  function handleFilterChange(status) {
    setFilterStatus(status);
    setSelectedId(null);
  }

  // Tela de carregamento
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrap}>
          <Loader2 size={28} className={styles.spin} />
        </div>
      </div>
    );
  }

  // Contadores para os cards de resumo
  const totalAbertas = rides.filter(r => r.status === 'Aberta').length;
  const totalConcluidas = rides.filter(r => r.status === 'Concluída').length;
  const totalCanceladas = rides.filter(r => r.status === 'Cancelada').length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Registros de Carona</h1>
          <p className={styles.subtitle}>Gerencie todas as caronas da plataforma</p>
        </div>
      </div>

      {/* Cards de resumo com totais por status */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <Car size={16} className={styles.statIconBlue} />
          <div>
            <p className={styles.statValue}>{rides.length}</p>
            <p className={styles.statLabel}>Total</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <CheckCircle size={16} className={styles.statIconGreen} />
          <div>
            <p className={styles.statValue}>{totalAbertas}</p>
            <p className={styles.statLabel}>Abertas</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <CheckCircle size={16} className={styles.statIconBlue} />
          <div>
            <p className={styles.statValue}>{totalConcluidas}</p>
            <p className={styles.statLabel}>Concluídas</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <XCircle size={16} className={styles.statIconRed} />
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
            // Combina sempre styles.filterBtn + styles.active apenas quando selecionado
            className={`${styles.filterBtn} ${filterStatus === opt ? styles.active : ''}`}
            onClick={() => handleFilterChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Layout mestre-detalhe.
          styles.layoutWithDetail é adicionado dinamicamente quando há carona
          selecionada, ajustando as larguras dos painéis via CSS. */}
      <div className={`${styles.layout} ${selectedRide ? styles.layoutWithDetail : ''}`}>

        {/* Painel esquerdo: lista de cards de caronas */}
        <div className={styles.listPanel}>
          {filteredRides.length === 0 && (
            <div className={styles.emptyState}>
              <Car size={32} />
              <p>Nenhuma carona encontrada.</p>
            </div>
          )}

          {filteredRides.map(ride => {
            const isSelected = selectedId === ride.id;
            return (
              <div
                key={ride.id}
                // Adiciona styles.listCardSelected quando este card está ativo
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
                    <ChevronRight size={14} className={styles.chevron} />
                  </div>
                </div>
                {/* Rota resumida: origem → destino (endereços encurtados) */}
                <div className={styles.routeRow}>
                  <span className={styles.routePoint}>{shortAddress(ride.origin)}</span>
                  <span className={styles.routeArrow}>→</span>
                  <span className={styles.routePoint}>{shortAddress(ride.destination)}</span>
                </div>
                <div className={styles.listCardFooter}>
                  <span className={styles.vagasPill}>
                    <Users size={11} />
                    {/* Pluralização: "1 vaga" ou "2 vagas" */}
                    {ride.vagasDisponiveis} vaga{ride.vagasDisponiveis !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Painel direito: detalhe da carona selecionada.
            Só renderiza se selectedRide não for null. */}
        {selectedRide && (
          <div className={styles.detailPanel}>
            <div className={styles.detailHeader}>
              <div className={styles.detailHeaderLeft}>
                <StatusBadge status={selectedRide.status} />
                <span className={styles.detailDate}>{selectedRide.date}</span>
              </div>
              <button className={styles.closeDetailBtn} onClick={handleCloseDetail} title="Fechar">
                <X size={16} />
              </button>
            </div>

            {/* Informações do motorista */}
            <div className={styles.detailSender}>
              <span className={styles.avatarLg}>{selectedRide.driverInitial}</span>
              <div>
                <p className={styles.detailSenderName}>{selectedRide.driverName}</p>
                <p className={styles.detailSenderSub}>
                  <User size={11} /> Motorista #{selectedRide.driverId}
                </p>
              </div>
            </div>

            {/* Seções de informação: cada uma com label + conteúdo */}
            <div className={styles.detailSection}>
              <p className={styles.detailSectionLabel}>Rota</p>
              <div className={styles.routeDetail}>
                <div className={styles.routeDetailRow}>
                  <MapPin size={14} className={styles.routeIconOrigin} />
                  <span>{selectedRide.origin}</span>
                </div>
                {/* Conector visual entre origem e destino */}
                <div className={styles.routeDetailConnector} />
                <div className={styles.routeDetailRow}>
                  <MapPin size={14} className={styles.routeIconDest} />
                  <span>{selectedRide.destination}</span>
                </div>
              </div>
            </div>

            <div className={styles.detailSection}>
              <p className={styles.detailSectionLabel}>Descrição</p>
              <p className={styles.detailText}>{selectedRide.description}</p>
            </div>

            {/* Veículo: só exibe se existir */}
            {selectedRide.vehicle && (
              <div className={styles.detailSection}>
                <p className={styles.detailSectionLabel}>Veículo</p>
                <p className={styles.detailText}>{selectedRide.vehicle}</p>
              </div>
            )}

            <div className={styles.detailSection}>
              <p className={styles.detailSectionLabel}>Vagas</p>
              <p className={styles.detailText}>
                {selectedRide.vagasDisponiveis} disponível de {selectedRide.totalVagas} total
              </p>
            </div>

            {/* Lista de passageiros: só exibe se houver passageiros */}
            {selectedRide.passengers.length > 0 && (
              <div className={styles.detailSection}>
                <p className={styles.detailSectionLabel}>
                  Passageiros ({selectedRide.passengers.length})
                </p>
                <div className={styles.passengerList}>
                  {selectedRide.passengers.map(p => (
                    <div key={p.usu_id} className={styles.passengerRow}>
                      <span className={styles.passengerAvatar}>
                        {p.usu_nome.charAt(0).toUpperCase()}
                      </span>
                      <span className={styles.passengerName}>{p.usu_nome}</span>
                    </div>
                  ))}
                </div>
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
