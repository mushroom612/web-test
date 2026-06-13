// ============================================================
// data/supportMock.js — Mock do chat de suporte (Admin ↔ Dev)
//
// Simula o backend de suporte enquanto os endpoints reais
// (/api/suporte/*) não existem. O services/api.js delega para
// estas funções; quando o backend de vocês estiver pronto, basta
// trocar o corpo dos métodos do api.js por chamadas http.* — os
// componentes (SupportChatPanel, Suporte) não mudam.
//
// Modelo (espelha a tabela proposta `suporte_mensagens`):
//   conversa = {
//     usu_id,        // admin "dono" da thread (1 thread por admin)
//     admin_nome,    // nome do admin (para a caixa de entrada do Dev)
//     esc_nome,      // escola do admin
//     mensagens: [{ msg_id, remetente: 'admin'|'dev', texto,
//                   criado_em (ISO), lida }]
//   }
//
// Persistência: localStorage (sobrevive a reload). Para resetar o
// estado durante os testes, chame resetSuporteMock() no console ou
// limpe a chave abaixo no DevTools.
// ============================================================

const STORAGE_KEY = 'tuctuc_suporte_mock_v1';

// Latência artificial para imitar a rede e exercitar os estados
// de loading dos componentes. Ajuste/zere à vontade nos testes.
const FAKE_DELAY_MS = 250;
const delay = (ms = FAKE_DELAY_MS) => new Promise((r) => setTimeout(r, ms));

// minutosAtras: helper para gerar timestamps de seed legíveis.
function minutosAtras(min) {
  return new Date(Date.now() - min * 60_000).toISOString();
}

// seed: estado inicial com 2 conversas para a caixa de entrada do Dev
// já ter conteúdo na primeira execução. Uma delas tem mensagem do
// admin não lida (alimenta o badge do Dev).
function seed() {
  return {
    seq: 100, // próximo msg_id
    conversas: [
      {
        usu_id: 11,
        admin_nome: 'Admin Escola',
        esc_nome: 'Faculdade Tecnológica Inova',
        mensagens: [
          {
            msg_id: 1,
            remetente: 'admin',
            texto:
              'Olá! A exportação de CSV nos relatórios de caronas não está baixando o arquivo. Conseguem verificar?',
            criado_em: minutosAtras(180),
            lida: true,
          },
          {
            msg_id: 2,
            remetente: 'dev',
            texto:
              'Oi! Obrigado pelo aviso. Estamos verificando o endpoint de exportação e já te retornamos.',
            criado_em: minutosAtras(172),
            lida: true,
          },
        ],
      },
      {
        usu_id: 12,
        admin_nome: 'Coordenação Saber',
        esc_nome: 'Universidade Estadual do Saber',
        mensagens: [
          {
            msg_id: 3,
            remetente: 'admin',
            texto:
              'Como faço para emitir uma notificação apenas para os alunos de um curso específico?',
            criado_em: minutosAtras(40),
            lida: false, // não lida pelo Dev → aparece no badge
          },
        ],
      },
    ],
  };
}

// load/save: leem e gravam o store no localStorage. load() sempre
// devolve um clone (JSON round-trip) para evitar mutações acidentais
// no estado persistido fora das funções abaixo.
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // localStorage indisponível ou JSON corrompido → recria do seed
  }
  const fresh = seed();
  save(fresh);
  return fresh;
}

function save(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignora: em modo de teste sem localStorage o estado fica só em memória
  }
}

// findOrCreate: localiza a thread do admin pelo usu_id; cria uma
// vazia se ainda não existir (primeiro contato daquele admin).
function findOrCreate(store, admin) {
  let conv = store.conversas.find((c) => c.usu_id === admin.usu_id);
  if (!conv) {
    conv = {
      usu_id: admin.usu_id,
      admin_nome: admin.admin_nome || `Admin #${admin.usu_id}`,
      esc_nome: admin.esc_nome || '—',
      mensagens: [],
    };
    store.conversas.push(conv);
  }
  return conv;
}

// ── API do mock (consumida pelo services/api.js) ────────────────

// Thread do próprio admin. `admin` = { usu_id, admin_nome, esc_nome }.
export async function mockGetMinhaThread(admin) {
  await delay();
  const store = load();
  const conv = findOrCreate(store, admin);
  save(store); // persiste a thread recém-criada, se for o caso
  return { mensagens: conv.mensagens };
}

// Admin envia mensagem para o Dev.
export async function mockEnviarMensagemAdmin(texto, admin) {
  await delay();
  const store = load();
  const conv = findOrCreate(store, admin);
  const msg = {
    msg_id: ++store.seq,
    remetente: 'admin',
    texto,
    criado_em: new Date().toISOString(),
    lida: false, // ainda não lida pelo Dev
  };
  conv.mensagens.push(msg);
  // Mantém o nome/escola atualizados caso tenham mudado
  conv.admin_nome = admin.admin_nome || conv.admin_nome;
  conv.esc_nome = admin.esc_nome || conv.esc_nome;
  save(store);
  return msg;
}

// Dev: lista de conversas para a caixa de entrada, ordenada pela
// última mensagem (mais recente primeiro) e com contador de não lidas.
export async function mockGetConversas() {
  await delay();
  const store = load();
  return store.conversas
    .map((c) => {
      const ultima = c.mensagens[c.mensagens.length - 1] || null;
      const naoLidas = c.mensagens.filter(
        (m) => m.remetente === 'admin' && !m.lida
      ).length;
      return {
        usu_id: c.usu_id,
        admin_nome: c.admin_nome,
        esc_nome: c.esc_nome,
        ultima_mensagem: ultima?.texto || '',
        ultima_em: ultima?.criado_em || null,
        nao_lidas: naoLidas,
      };
    })
    .sort((a, b) => (b.ultima_em || '').localeCompare(a.ultima_em || ''));
}

// Dev: thread de um admin específico.
export async function mockGetThreadDeAdmin(usuId) {
  await delay();
  const store = load();
  const conv = store.conversas.find((c) => c.usu_id === usuId);
  return { mensagens: conv ? conv.mensagens : [] };
}

// Dev responde a um admin.
export async function mockResponderAdmin(usuId, texto) {
  await delay();
  const store = load();
  const conv = store.conversas.find((c) => c.usu_id === usuId);
  if (!conv) throw new Error('Conversa não encontrada.');
  const msg = {
    msg_id: ++store.seq,
    remetente: 'dev',
    texto,
    criado_em: new Date().toISOString(),
    lida: false, // ainda não lida pelo admin
  };
  conv.mensagens.push(msg);
  save(store);
  return msg;
}

// Contador de não lidas para o badge.
//   role 'admin' → mensagens do Dev na própria thread ainda não lidas
//   role 'dev'   → total de mensagens de admins ainda não lidas
export async function mockGetNaoLidas({ role, usuId }) {
  const store = load();
  if (role === 'dev') {
    const total = store.conversas.reduce(
      (acc, c) =>
        acc + c.mensagens.filter((m) => m.remetente === 'admin' && !m.lida).length,
      0
    );
    return { nao_lidas: total };
  }
  const conv = store.conversas.find((c) => c.usu_id === usuId);
  const total = conv
    ? conv.mensagens.filter((m) => m.remetente === 'dev' && !m.lida).length
    : 0;
  return { nao_lidas: total };
}

// Marca como lidas as mensagens da contraparte numa thread.
//   leitor 'admin' → marca mensagens do Dev como lidas
//   leitor 'dev'   → marca mensagens do admin como lidas
export async function mockMarcarLidas({ usuId, leitor }) {
  const store = load();
  const conv = store.conversas.find((c) => c.usu_id === usuId);
  if (!conv) return { ok: true };
  const alvo = leitor === 'admin' ? 'dev' : 'admin';
  conv.mensagens.forEach((m) => {
    if (m.remetente === alvo) m.lida = true;
  });
  save(store);
  return { ok: true };
}

// Util para resetar o estado durante os testes (chamar no console).
export function resetSuporteMock() {
  localStorage.removeItem(STORAGE_KEY);
}
