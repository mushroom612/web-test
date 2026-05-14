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

// car_status: 1=Aberta, 2=Em espera, 3=Concluída, 4=Cancelada
function statusLabel(status) {
  switch (status) {
    case 1: return 'Aberta';
    case 2: return 'Em espera';
    case 3: return 'Concluída';
    case 4: return 'Cancelada';
    default: return 'Desconhecido';
  }
}

function shortAddress(addr) {
  if (!addr) return '—';
  return addr.split(',')[0].trim();
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr.replace(' ', 'T'));
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function apiToRide(r) {
  return {
    id: r.car_id,
    driverName: r.usu_nome_motorista,
    driverInitial: (r.usu_nome_motorista || 'M').charAt(0).toUpperCase(),
    driverId: r.usu_id_motorista,
    status: statusLabel(r.car_status),
    date: formatDate(r.car_data),
    description: r.car_desc,
    origin: r.pon_partida,
    destination: r.pon_destino,
    vagasDisponiveis: r.car_vagas_disponivel,
    totalVagas: r.car_vagas,
    vehicle: r.vei_modelo
      ? `${r.vei_modelo}${r.vei_placa ? ' — ' + r.vei_placa : ''}`
      : null,
    passengers: r.passageiros || []
  };
}

const FILTER_OPTIONS = ['Todos', 'Aberta', 'Em espera', 'Concluída', 'Cancelada'];

export function Caronas() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [selectedId, setSelectedId] = useState(null);
  const [searchParams] = useSearchParams();

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

  // Auto-seleciona carona quando navegado de Sugestoes (?id=N)
  useEffect(() => {
    const rideId = searchParams.get('id');
    if (rideId && rides.length > 0) {
      const id = parseInt(rideId, 10);
      if (rides.find(r => r.id === id)) {
        setSelectedId(id);
        setFilterStatus('Todos');
      }
    }
  }, [searchParams, rides]);

  const filteredRides = rides.filter(r =>
    filterStatus === 'Todos' || r.status === filterStatus
  );
  const selectedRide = rides.find(r => r.id === selectedId) ?? null;

  function handleSelectRide(id) {
    setSelectedId(prev => prev === id ? null : id);
  }

  function handleCloseDetail() {
    setSelectedId(null);
  }

  function handleFilterChange(status) {
    setFilterStatus(status);
    setSelectedId(null);
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrap}>
          <Loader2 size={28} className={styles.spin} />
        </div>
      </div>
    );
  }

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

      <div className={`${styles.layout} ${selectedRide ? styles.layoutWithDetail : ''}`}>

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
                <div className={styles.routeRow}>
                  <span className={styles.routePoint}>{shortAddress(ride.origin)}</span>
                  <span className={styles.routeArrow}>→</span>
                  <span className={styles.routePoint}>{shortAddress(ride.destination)}</span>
                </div>
                <div className={styles.listCardFooter}>
                  <span className={styles.vagasPill}>
                    <Users size={11} />
                    {ride.vagasDisponiveis} vaga{ride.vagasDisponiveis !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

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

            <div className={styles.detailSender}>
              <span className={styles.avatarLg}>{selectedRide.driverInitial}</span>
              <div>
                <p className={styles.detailSenderName}>{selectedRide.driverName}</p>
                <p className={styles.detailSenderSub}>
                  <User size={11} /> Motorista #{selectedRide.driverId}
                </p>
              </div>
            </div>

            <div className={styles.detailSection}>
              <p className={styles.detailSectionLabel}>Rota</p>
              <div className={styles.routeDetail}>
                <div className={styles.routeDetailRow}>
                  <MapPin size={14} className={styles.routeIconOrigin} />
                  <span>{selectedRide.origin}</span>
                </div>
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
