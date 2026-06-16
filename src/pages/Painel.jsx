// ============================================================
// pages/Painel.jsx — Página inicial do painel
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
// Estilo: Painel.module.css
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconUsers,
  IconCar,
  IconCircleCheck,
  IconAlertCircle,
  IconTrendingUp,
  IconTrendingDown,
  IconLoader2,
  IconAlertTriangle,
} from "@tabler/icons-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "../services/api";
import { chartData } from "../data/mockData";
import { FeedbackCard } from "../components/FeedbackCard";
import styles from "./Painel.module.css";

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
  const nome = s.autor || s.usu_nome || `Usuário #${s.usu_id ?? ""}`;
  const tipo = s.sug_tipo === 0 ? "Denúncia" : "Sugestão";
  const status =
    s.sug_status === 0
      ? "Resolvido"
      : s.sug_status === 3
        ? "Em análise"
        : s.sug_status === 2
          ? "Arquivado"
          : "Pendente";
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
    date: rawData ? new Date(rawData).toLocaleDateString("pt-BR") : "—",
  };
}

// METRIC_CONFIG: define o ícone e as cores de cada card de métrica.
// Usa índice posicional — o card 0 (Total de Usuários) usa a config [0], etc.
const METRIC_CONFIG = [
  { Icon: IconUsers, iconColor: "#3b82f6", iconBg: "#dbeafe" }, // azul
  { Icon: IconCar, iconColor: "#8b5cf6", iconBg: "#ede9fe" }, // roxo
  { Icon: IconCircleCheck, iconColor: "#22c55e", iconBg: "#dcfce7" }, // verde
  { Icon: IconAlertCircle, iconColor: "#f59e0b", iconBg: "#fef3c7" }, // amarelo
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

export function Painel() {
  // useNavigate: usado para redirecionar ao clicar em um feedback
  const navigate = useNavigate();

  // metrics: estatísticas consolidadas vindas da API.
  // null = ainda não carregou (loading) ou erro.
  const [metrics, setMetrics] = useState(null);

  // feedbacks: top 4 sugestões/denúncias mais recentes (escopo
  // automático conforme o papel do usuário).
  const [feedbacks, setFeedbacks] = useState([]);

  const [loading, setLoading] = useState(true);
  // error: mensagem se qualquer chamada falhou. Quando preenchido,
  // a UI mostra um banner de erro + botão "Tentar novamente".
  const [error, setError] = useState(null);

  // load: encapsulada em useCallback para que o botão de retry
  // possa reusar a mesma função sem recriá-la a cada render.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Promise.all dispara as 4 chamadas em paralelo. Se qualquer
      // uma falhar (rede caída, 5xx, sem permissão), o catch
      // assume e exibimos um único banner — sem cair em mock.
      const [statsUsuarios, statsCaronas, statsSugestoes, sugestoes] =
        await Promise.all([
          api.getStats("usuarios"),
          api.getStats("caronas"),
          api.getStats("sugestoes"),
          api.getSugestoes({ limit: 4 }),
        ]);
      setMetrics({
        usuarios: statsUsuarios.stats,
        caronas: statsCaronas.stats,
        sugestoes: statsSugestoes.stats,
      });
      const lista = sugestoes?.sugestoes || [];
      // O backend já devolve ordenado por sug_id DESC; o slice é
      // defensivo caso algum dia o limit não seja respeitado.
      setFeedbacks(lista.slice(0, 4).map(formatSugestao));
    } catch (err) {
      setError(err.message || "Não foi possível carregar o Dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  // useEffect: dispara o carregamento uma única vez na montagem.
  useEffect(() => {
    load();
  }, [load]);

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
          label: "Total de Usuários",
          value: metrics.usuarios.total ?? 0,
          trend: `${metrics.usuarios.ativos ?? 0} ativos`,
          trendUp: true,
        },
        {
          id: 2,
          label: "Total de Caronas",
          value: metrics.caronas.total ?? 0,
          trend: `${metrics.caronas.abertas ?? 0} abertas`,
          trendUp: true,
        },
        {
          id: 3,
          label: "Caronas Finalizadas",
          value: metrics.caronas.finalizadas ?? 0,
          trend: "realizadas com sucesso",
          trendUp: true,
        },
        {
          id: 4,
          label: "Sugestões Pendentes",
          value: metrics.sugestoes.abertas ?? 0,
          trend: `${metrics.sugestoes.total ?? 0} no total`,
          // trendUp=true só quando NÃO há pendências — sinaliza "tudo em dia"
          trendUp: (metrics.sugestoes.abertas ?? 0) === 0,
        },
      ]
    : [];

  // Tela de carregamento: exibida enquanto a API não respondeu
  if (loading) {
    return (
      <div className={styles.dashboard}>
        {/* styles.loadingWrap → centraliza o spinner na tela */}
        <div className={styles.loadingWrap}>
          {/* styles.spin → animação CSS de rotação aplicada ao ícone */}
          <IconLoader2 size={32} className={styles.spin} />
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            padding: "48px 24px",
            background: "var(--surface-primary)",
            border: "1px solid var(--color-neutral-100)",
            borderRadius: "var(--border-radius-lg)",
            color: "var(--text-secondary)",
            textAlign: "center",
          }}
        >
          <IconAlertTriangle size={28} color="var(--color-semantic-error)" />
          <p
            style={{ margin: 0, color: "var(--text-primary)", fontWeight: 600 }}
          >
            Não foi possível carregar o Dashboard.
          </p>
          <p style={{ margin: 0, fontSize: 13 }}>{error}</p>
          <button
            type="button"
            onClick={load}
            style={{
              marginTop: 8,
              padding: "8px 16px",
              border: "none",
              borderRadius: "var(--border-radius-md)",
              background: "var(--btn-primary-bg)",
              color: "var(--btn-primary-text)",
              cursor: "pointer",
              fontWeight: 600,
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
      <div className={styles.userFeedback}>
        {/* ── Grade de cards de métricas ───────────────────────────
          styles.metricsGrid = display: grid com 4 colunas
          Cada card é independente e recebe seu próprio ícone e cor. */}
        <div className={styles.metricsGrid}>
          {metricsDisplay.map((metric, i) => {
            // Busca a configuração de ícone/cor pelo índice.
            // ?? METRIC_CONFIG[0] evita erro se houver mais de 4 métricas.
            const { Icon, iconColor, iconBg } =
              METRIC_CONFIG[i] ?? METRIC_CONFIG[0];
            return (
              <div key={metric.id} className={styles.metricCard}>
                <div className={styles.metricTop}>
                  {/* Ícone com cor e fundo personalizados via style inline */}
                  <div
                    className={styles.metricIcon}
                    style={{ backgroundColor: iconBg }}
                  >
                    <Icon size={20} style={{ color: iconColor }} />
                  </div>
                  <span className={styles.metricValue}>{metric.value}</span>
                </div>
                <p className={styles.metricLabel}>{metric.label}</p>
                <div className={styles.metricFooter}>
                  {/* Renderiza seta para cima ou para baixo conforme trendUp */}
                  {metric.trendUp ? (
                    <IconTrendingUp size={13} className={styles.trendUp} />
                  ) : (
                    <IconTrendingDown size={13} className={styles.trendDown} />
                  )}
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
              Sugestões e Denúncias Recentes
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
                onClick={() => navigate(`/sugestoes?id=${feedback.id}`)}
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
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              {/* defs + linearGradient: cria um degradê do topo (opaco)
                  até a base (transparente) para preencher a área da curva.
                  O id "ridesGradient" é referenciado abaixo em fill="url(#...)". */}
              <defs>
                <linearGradient id="ridesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="30%"
                    stopColor="var(--btn-primary-bg)"
                    stopOpacity={1}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--btn-primary-bg)"
                    stopOpacity={0.4}
                  />
                </linearGradient>
              </defs>
              {/* Grade de linhas de fundo (só horizontal, sem vertical) */}
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />
              {/* Eixo X: usa o campo "day" de chartData como rótulo */}
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              {/* Eixo Y: valores numéricos (quantidade de caronas) */}
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              {/* Tooltip customizado: usa nosso componente ChartTooltip.
                  cursor: linha vertical pontilhada acompanhando o mouse. */}
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "#9ca3af", strokeDasharray: "3 3" }}
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
