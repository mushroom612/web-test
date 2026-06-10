// ============================================================
// pages/Dashboard.jsx — Página inicial do painel
//
// É a primeira tela vista após o login. Mostra um resumo
// visual da plataforma: métricas, gráfico e feedbacks recentes.
//
// Estrutura visual:
//   ┌─────────────────────────────────────────┐
//   │  [Card] [Card] [Card] [Card]  ← métricas│
//   ├────────────────────┬────────────────────┤
//   │   Gráfico de barras│ Feedbacks recentes │
//   └────────────────────┴────────────────────┘
//
// Bibliotecas usadas:
//   - react              → useState, useEffect
//   - react-router-dom   → useNavigate (para redirecionar ao clicar em feedback)
//   - lucide-react       → ícones dos cards de métricas
//   - recharts           → biblioteca de gráficos para React
//       AreaChart, Area  → gráfico de área (curva preenchida)
//       XAxis, YAxis     → eixos do gráfico
//       CartesianGrid    → grade de fundo
//       Tooltip          → caixa de detalhes ao passar o mouse
//       ResponsiveContainer → faz o gráfico se adaptar ao tamanho do contêiner
//
// Dados consumidos (API real):
//   - api.getStats('usuarios' | 'caronas' | 'sugestoes')
//       → GET /api/admin/stats/{tipo}, escopo automático por papel
//   - api.getSugestoes({ limit }) → GET /api/sugestoes (top recentes)
//
// Ainda mockado: chartData (gráfico "Caronas por dia da semana").
// Não há endpoint correspondente — o gráfico é decorativo por enquanto.
//
// Estilo: Dashboard.module.css
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Car, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Loader2, AlertTriangle } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import { FeedbackCard } from '../components/FeedbackCard';
import styles from './Painel.module.css';

// formatSugestao: converte o registro vindo de /api/sugestoes
// para o formato que os componentes visuais esperam.
//
// Mapeamento de campos (API → UI):
//   autor       → userName       (mock antigo usava usu_nome)
//   sug_data    → date (BR)      (mock antigo usava criado_em)
//   sug_texto   → text
//   sug_tipo    → type           (0 = Denúncia, 1 = Sugestão)  [v17 — API real]
//   sug_status  → status         (0 = Resolvido, 1 = Pendente,
//                                 2 = Arquivado, 3 = Em análise)
//
// Os fallbacks para usu_nome/criado_em existem para tolerar respostas
// do mock antigo durante a transição — podem ser removidos depois.
function formatSugestao(s) {
  const nome = s.autor || s.usu_nome || `Usuário #${s.usu_id ?? ''}`;
  const tipo = s.sug_tipo === 0 ? 'Denúncia' : 'Sugestão';
  const status =
    s.sug_status === 0 ? 'Resolvido'
    : s.sug_status === 3 ? 'Em análise'
    : s.sug_status === 2 ? 'Arquivado'
    : 'Pendente';
  const rawData = s.sug_data || s.criado_em;
  return {
    id: s.sug_id,
    userName: nome,
    // charAt(0).toUpperCase() → primeira letra do nome como avatar
    avatar: nome.charAt(0).toUpperCase(),
    text: s.sug_texto,
    type: tipo,
    status,
    // toLocaleDateString formata a data no padrão brasileiro (dd/mm/aaaa)
    date: rawData ? new Date(rawData).toLocaleDateString('pt-BR') : '—'
  };
}

// formatDenuncia: converte o registro vindo de GET /api/denuncias
// para o mesmo shape que formatSugestao produz, permitindo que o
// FeedbackCard renderize ambos os tipos sem alteração.
//
// Mapeamento de campos (API → UI):
//   denunciante  → userName
//   den_data     → date (BR)
//   den_motivo   → text  (resumo obrigatório da denúncia)
//   den_status   → status (0=Resolvido, 1=Pendente, 2=Arquivado, 3=Em análise)
//
// Usado pelo Admin, que não tem acesso a /api/sugestoes (Dev only).
function formatDenuncia(d) {
  const nome = d.denunciante || `Usuário #${d.usu_id ?? ''}`;
  const status =
    d.den_status === 0 ? 'Resolvido'
    : d.den_status === 3 ? 'Em análise'
    : d.den_status === 2 ? 'Arquivado'
    : 'Pendente';
  return {
    id:       d.den_id,
    userName: nome,
    avatar:   nome.charAt(0).toUpperCase(),
    // Exibe o motivo resumido; den_texto é opcional e pode não existir
    text:     d.den_motivo || d.den_texto || '—',
    type:     'Denúncia',
    status,
    date:     d.den_data ? new Date(d.den_data).toLocaleDateString('pt-BR') : '—'
  };
}

// METRIC_CONFIG: define o ícone e as cores de cada card de métrica.
// Usa índice posicional — o card 0 (Total de Usuários) usa a config [0], etc.
const METRIC_CONFIG = [
  { Icon: Users,        iconColor: '#3b82f6', iconBg: '#dbeafe' }, // azul
  { Icon: Car,          iconColor: '#8b5cf6', iconBg: '#ede9fe' }, // roxo
  { Icon: CheckCircle,  iconColor: '#22c55e', iconBg: '#dcfce7' }, // verde
  { Icon: AlertCircle,  iconColor: '#f59e0b', iconBg: '#fef3c7' }  // amarelo
];

// ChartTooltip: componente customizado para o tooltip do gráfico.
// Substituímos o tooltip padrão do recharts por este para controlar o visual.
// active: true quando o mouse está sobre uma barra
// payload: array com os dados da barra em foco
// label: rótulo do eixo X (ex: 'Seg')
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    // styles.chartTooltip → caixa flutuante que aparece ao passar o mouse
    <div className={styles.chartTooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipValue}>{payload[0].value} caronas</p>
    </div>
  );
}

// fmtDate: formata um objeto Date para 'YYYY-MM-DD' (formato aceito pela API).
function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

// buildChartData: agrupa um array de caronas por dia nos últimos 7 dias.
// Retorna array de { day, rides } para o AreaChart.
function buildChartData(caronas) {
  const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const hoje = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - (6 - i));
    const key = fmtDate(d);
    return {
      day: DIAS[d.getDay()],
      rides: caronas.filter(c => c.car_data?.slice(0, 10) === key).length
    };
  });
}

export function Dashboard() {
  // isAdmin: lido do AuthContext para bifurcar o fetch de feedbacks.
  // Admin (per_tipo=1) não acessa /api/sugestoes — usa /api/denuncias.
  const { isAdmin } = useAuth();

  // useNavigate: usado para redirecionar ao clicar em um feedback
  const navigate = useNavigate();

  // metrics: estatísticas consolidadas vindas da API.
  // null = ainda não carregou (loading) ou erro.
  const [metrics, setMetrics] = useState(null);

  // feedbacks: top 4 sugestões/denúncias mais recentes (escopo
  // automático conforme o papel do usuário).
  const [feedbacks, setFeedbacks] = useState([]);

  // chartData: caronas agrupadas por dia da semana (últimos 7 dias).
  // Populado pela Fase 3 de load(); array vazio enquanto carrega.
  const [chartData, setChartData] = useState([]);

  const [loading, setLoading] = useState(true);
  // error: mensagem se qualquer chamada falhou. Quando preenchido,
  // a UI mostra um banner de erro + botão "Tentar novamente".
  const [error, setError] = useState(null);

  // load: encapsulada em useCallback para que o botão de retry
  // possa reusar a mesma função sem recriá-la a cada render.
  //
  // Duas fases independentes:
  //   Fase 1 → stats em Promise.all (falha crítica — exibe banner de erro)
  //   Fase 2 → feedbacks recentes com try/catch próprio (falha tolerável —
  //             seção fica vazia mas o Dashboard continua funcional)
  //
  // A separação resolve o problema do Admin: getSugestoes retorna 403
  // para per_tipo=1, pois /api/sugestoes é exclusivo do Desenvolvedor.
  // Na Fase 2, Admin usa getDenuncias e Dev usa getSugestoes.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fase 1: as 3 stats são críticas — se qualquer uma cair o
      // Dashboard não tem conteúdo útil para exibir.
      const [statsUsuarios, statsCaronas, statsSugestoes] = await Promise.all([
        api.getStats('usuarios'),
        api.getStats('caronas'),
        api.getStats('sugestoes')
      ]);
      setMetrics({
        usuarios: statsUsuarios.stats,
        caronas:  statsCaronas.stats,
        sugestoes: statsSugestoes.stats
      });

      // Fase 2: feedbacks recentes — falha não derruba as métricas.
      //   Admin → só getDenuncias (/api/sugestoes retorna 403 para per_tipo=1)
      //   Dev   → getSugestoes + getDenuncias em paralelo, mesclados e
      //           ordenados por data decrescente para exibir os 4 mais recentes
      try {
        let lista;
        if (isAdmin) {
          const data = await api.getDenuncias({ limit: 4 });
          lista = (data?.denuncias || []).slice(0, 4).map(formatDenuncia);
        } else {
          // Busca ambos em paralelo e mescla por data
          const [sugestoesData, denunciasData] = await Promise.all([
            api.getSugestoes({ limit: 4 }),
            api.getDenuncias({ limit: 4 })
          ]);
          // Anota o timestamp antes de formatar para poder ordenar,
          // já que formatSugestao/formatDenuncia convertem a data para string.
          lista = [
            ...(sugestoesData?.sugestoes || []).map(s => ({
              _raw: s,
              _ts:  new Date(s.sug_data || 0).getTime(),
              _tipo: 'sug'
            })),
            ...(denunciasData?.denuncias || []).map(d => ({
              _raw: d,
              _ts:  new Date(d.den_data || 0).getTime(),
              _tipo: 'den'
            }))
          ]
            .sort((a, b) => b._ts - a._ts) // mais recentes primeiro
            .slice(0, 4)
            .map(({ _raw, _tipo }) =>
              _tipo === 'sug' ? formatSugestao(_raw) : formatDenuncia(_raw)
            );
        }
        setFeedbacks(lista);
      } catch {
        // Feedbacks não carregaram — seção fica vazia sem banner de erro
        setFeedbacks([]);
      }

      // Fase 3: gráfico de caronas por dia (últimos 7 dias).
      // Admin: escopo automático à própria escola via JWT no backend.
      // Dev:   retorna caronas de todas as escolas.
      // Falha aqui não derruba o dashboard — gráfico fica vazio.
      try {
        const hoje = new Date();
        const seteDiasAtras = new Date();
        seteDiasAtras.setDate(hoje.getDate() - 6);
        const data = await api.getCaronas({
          data_inicio: fmtDate(seteDiasAtras),
          data_fim:    fmtDate(hoje),
          limit:       200
        });
        setChartData(buildChartData(data?.caronas || []));
      } catch {
        setChartData([]);
      }
    } catch (err) {
      setError(err.message || 'Não foi possível carregar o Dashboard.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // useEffect: dispara o carregamento uma única vez na montagem.
  useEffect(() => { load(); }, [load]);

  // metricsDisplay: monta os 4 cards a partir das stats reais.
  // Quando metrics é null (loading ou erro), devolve um array vazio —
  // a UI nesses estados é controlada pelos blocos abaixo (spinner/erro).
  //
  // Mapeamentos relevantes da API:
  //   stats.usuarios.{total, ativos}
  //   stats.caronas.{total, abertas, finalizadas}
  //   stats.sugestoes.{total, abertas}  ← "abertas" = pendentes/em aberto
  const metricsDisplay = metrics
    ? [
        {
          id: 1,
          label: 'Total de Usuários',
          value: metrics.usuarios.total ?? 0,
          trend: `${metrics.usuarios.ativos ?? 0} ativos`,
          trendUp: true
        },
        {
          id: 2,
          label: 'Total de Caronas',
          value: metrics.caronas.total ?? 0,
          trend: `${metrics.caronas.abertas ?? 0} abertas`,
          trendUp: true
        },
        {
          id: 3,
          label: 'Caronas Finalizadas',
          value: metrics.caronas.finalizadas ?? 0,
          trend: 'realizadas com sucesso',
          trendUp: true
        },
        {
          id: 4,
          // Admin só vê denúncias; Dev vê sugestões e denúncias
          label: isAdmin ? 'Denúncias Pendentes' : 'Sugestões Pendentes',
          value: metrics.sugestoes.abertas ?? 0,
          trend: `${metrics.sugestoes.total ?? 0} no total`,
          // trendUp=true só quando NÃO há pendências — sinaliza "tudo em dia"
          trendUp: (metrics.sugestoes.abertas ?? 0) === 0
        }
      ]
    : [];

  // Tela de carregamento: exibida enquanto a API não respondeu
  if (loading) {
    return (
      <div className={styles.dashboard}>
        {/* styles.loadingWrap → centraliza o spinner na tela */}
        <div className={styles.loadingWrap}>
          {/* styles.spin → animação CSS de rotação aplicada ao ícone */}
          <Loader2 size={32} className={styles.spin} />
        </div>
      </div>
    );
  }

  // Tela de erro: aparece quando qualquer chamada falhou. Substitui
  // o antigo fallback silencioso para mock — agora o usuário sabe
  // que algo deu errado e tem um botão explícito para retentar.
  if (error) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>Visão geral da plataforma Tuctuc</p>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            padding: '48px 24px',
            background: 'var(--surface-primary)',
            border: '1px solid var(--color-neutral-100)',
            borderRadius: 'var(--border-radius-lg)',
            color: 'var(--text-secondary)',
            textAlign: 'center'
          }}
        >
          <AlertTriangle size={28} color="var(--color-semantic-error)" />
          <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>
            Não foi possível carregar o Dashboard.
          </p>
          <p style={{ margin: 0, fontSize: 13 }}>{error}</p>
          <button
            type="button"
            onClick={load}
            style={{
              marginTop: 8,
              padding: '8px 16px',
              border: 'none',
              borderRadius: 'var(--border-radius-md)',
              background: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Cabeçalho da página */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Painel</h1>
        <p className={styles.pageSubtitle}>Visão geral da plataforma Tuctuc</p>
      </div>
      <div className={styles.userFeedback}>
{/* ── Grade de cards de métricas ───────────────────────────
          styles.metricsGrid = display: grid com 4 colunas
          Cada card é independente e recebe seu próprio ícone e cor. */}
      <div className={styles.metricsGrid}>
        {metricsDisplay.map((metric, i) => {
          // Busca a configuração de ícone/cor pelo índice.
          // ?? METRIC_CONFIG[0] evita erro se houver mais de 4 métricas.
          const { Icon, iconColor, iconBg } = METRIC_CONFIG[i] ?? METRIC_CONFIG[0];
          return (
            <div key={metric.id} className={styles.metricCard}>
              <div className={styles.metricTop}>
                {/* Ícone com cor e fundo personalizados via style inline */}
                <div className={styles.metricIcon} style={{ backgroundColor: iconBg }}>
                  <Icon size={20} style={{ color: iconColor }} />
                </div>
                <span className={styles.metricValue}>{metric.value}</span>
              </div>
              <p className={styles.metricLabel}>{metric.label}</p>
              <div className={styles.metricFooter}>
                {/* Renderiza seta para cima ou para baixo conforme trendUp */}
                {metric.trendUp
                  ? <TrendingUp size={13} className={styles.trendUp} />
                  : <TrendingDown size={13} className={styles.trendDown} />
                }
                <span className={styles.trend}>{metric.trend}</span>
              </div>
            </div>
          );
        })}
      </div>
      {/* Lista de feedbacks recentes */}
        <div className={styles.feedbackSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              {isAdmin ? 'Denúncias Recentes' : 'Sugestões e Denúncias Recentes'}
            </h2>
          </div>
          <div className={styles.feedbackList}>
            {feedbacks.map((feedback) => (
              // FeedbackCard: componente reutilizável que exibe um feedback.
              // onClick navega para /sugestoes com o ID como query param,
              // permitindo que a página de Sugestões abra o item diretamente.
              <FeedbackCard
                key={feedback.id}
                feedback={feedback}
                onClick={() => {
                  const prefix = feedback.type === 'Denúncia' ? 'den' : 'sug';
                  navigate(`/sugestoes?id=${prefix}-${feedback.id}`);
                }}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* ── Grade de conteúdo: gráfico + feedbacks ───────────────
          styles.contentGrid → layout side-by-side (ex: 60% / 40%) */}
      <div className={styles.contentGrid}>

        {/* Gráfico de barras (recharts) */}
        <div className={styles.chartCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Caronas por Dia da Semana</h2>
            <span className={styles.badge}>Últimos 7 dias</span>
          </div>
          {/* ResponsiveContainer: faz o gráfico ocupar 100% da largura
              disponível, adaptando-se ao tamanho da tela. */}
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              {/* defs + linearGradient: cria um degradê do topo (opaco)
                  até a base (transparente) para preencher a área da curva.
                  O id "ridesGradient" é referenciado abaixo em fill="url(#...)". */}
              <defs>
                <linearGradient id="ridesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="30%" stopColor="var(--btn-primary-bg)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--btn-primary-bg)" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              {/* Grade de linhas de fundo (só horizontal, sem vertical) */}
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              {/* Eixo X: usa o campo "day" de chartData como rótulo */}
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              {/* Eixo Y: valores numéricos (quantidade de caronas) */}
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              {/* Tooltip customizado: usa nosso componente ChartTooltip.
                  cursor: linha vertical pontilhada acompanhando o mouse. */}
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: '#9ca3af', strokeDasharray: '3 3' }}
              />
              {/* Área: usa o campo "rides" de chartData como altura da curva.
                  type="monotone" → curva suave passando pelos pontos
                  stroke → cor da linha superior da área
                  fill="url(#ridesGradient)" → aplica o degradê definido em <defs>
                  activeDot → ponto destacado ao passar o mouse */}
              <Area
                type="monotone"
                dataKey="rides"
                stroke="transparent"
                strokeWidth={2}
                fill="url(#ridesGradient)"
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        

      </div>
    </div>
  );
}
