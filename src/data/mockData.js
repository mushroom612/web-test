// ============================================================
// data/mockData.js — Dados fictícios (mock) para desenvolvimento
//
// "Mock" significa dados simulados que imitam o que viria do
// banco de dados real. Permitem desenvolver e testar a interface
// sem precisar de um backend funcionando.
//
// Quando o backend estiver pronto, o services/api.js substituirá
// esses dados por chamadas HTTP reais — os componentes não
// precisarão mudar, pois consomem o api.js, não este arquivo.
//
// Organização:
//   - Dados de interface (formato livre) → usados diretamente em componentes
//   - Dados de API (prefixo "api*")      → imitam o formato real do banco
//     Os campos seguem a nomenclatura do banco: usu_ (usuário),
//     car_ (carona), sug_ (sugestão), pen_ (penalidade), etc.
// ============================================================

// Usuário administrador logado no sistema.
// Usado pelo Aside.jsx e Topbar.jsx para exibir nome e avatar.
export const adminUser = {
  id: 6,
  name: 'Admin Sistema',
  email: 'admin@sistema.inova.br',
  role: 'Desenvolvedor',
  avatar: '👨‍💼'
};

// Cards de métricas exibidos no Dashboard.
// Cada item tem: label (título), value (valor), icon (nome do ícone),
// trend (variação) e trendUp (se a variação é positiva ou negativa).
export const metricsData = [
  {
    id: 1,
    label: 'Total de Usuários',
    value: '10',
    icon: 'Users',
    trend: '+2',
    trendUp: true
  },
  {
    id: 2,
    label: 'Caronas Realizadas',
    value: '6',
    icon: 'Car',
    trend: '+1',
    trendUp: true
  },
  {
    id: 3,
    label: 'Denúncias Pendentes',
    value: '1',
    icon: 'AlertCircle',
    trend: '+0',
    trendUp: false
  },
  {
    id: 4,
    label: 'Novos Usuários (Semana)',
    value: '4',
    icon: 'TrendingUp',
    trend: '+2',
    trendUp: true
  }
];

// Feedbacks recentes (sugestões e denúncias) exibidos no Dashboard.
// type: 'Sugestão' ou 'Denúncia' — define o visual do badge.
export const feedbacksData = [
  {
    id: 1,
    userName: 'Mariana Souza',
    userEmail: 'mariana.souza@aluno.inova.br',
    avatar: '👩‍🎓',
    text: 'Seria ótimo ter um filtro de caronas por horário de saída mais específico.',
    type: 'Sugestão',
    date: '2024-04-12'
  },
  {
    id: 2,
    userName: 'Lucas Pereira',
    userEmail: 'lucas.pereira@aluno.inova.br',
    avatar: '👨‍🎓',
    text: 'O usuário Carlos Silva cancelou a carona em cima da hora sem nenhum aviso.',
    type: 'Denúncia',
    date: '2024-04-12'
  },
  {
    id: 3,
    userName: 'Carlos Silva',
    userEmail: 'carlos.silva@aluno.inova.br',
    avatar: '👨‍🎓',
    text: 'Poderia ter uma opção de carona recorrente para quem vai ao mesmo lugar todo dia.',
    type: 'Sugestão',
    date: '2024-04-12'
  },
  {
    id: 4,
    userName: 'Pedro Santos',
    userEmail: 'pedro.santos@uni.saber.br',
    avatar: '👨‍🎓',
    text: 'Encontrei um usuário com comprovante de matrícula claramente falsificado.',
    type: 'Denúncia',
    date: '2024-04-07'
  }
];

// Lista de usuários no formato de interface (usado por componentes antigos).
// Para novos componentes, prefira apiUsersData (formato de API mais fiel ao banco).
export const usersData = [
  {
    id: 1,
    name: 'Carlos Silva',
    email: 'carlos.silva@aluno.inova.br',
    avatar: '👨‍🎓',
    type: 'Motorista',
    status: 'Ativo',
    lastAccess: '2024-04-12 10:00',
    ipLogin: '192.168.1.101',
    school: 'Faculdade Tecnológica Inova',
    course: 'Análise e Desenvolvimento de Sistemas'
  },
  {
    id: 2,
    name: 'Mariana Souza',
    email: 'mariana.souza@aluno.inova.br',
    avatar: '👩‍🎓',
    type: 'Passageiro',
    status: 'Ativo',
    lastAccess: '2024-04-12 10:00',
    ipLogin: '192.168.1.102',
    school: 'Faculdade Tecnológica Inova',
    course: 'Análise e Desenvolvimento de Sistemas'
  },
  {
    id: 3,
    name: 'Pedro Santos',
    email: 'pedro.santos@uni.saber.br',
    avatar: '👨‍🎓',
    type: 'Motorista',
    status: 'Ativo',
    lastAccess: '2023-10-01 08:00',
    ipLogin: '192.168.1.103',
    school: 'Universidade Estadual do Saber',
    course: 'Direito'
  },
  {
    id: 4,
    name: 'Ana Oliveira',
    email: 'ana.oliveira@aluno.inova.br',
    avatar: '👩‍🎓',
    type: 'Ambos',
    status: 'Inativo',
    lastAccess: null,
    ipLogin: '192.168.1.104',
    school: 'Faculdade Tecnológica Inova',
    course: 'Análise e Desenvolvimento de Sistemas'
  },
  {
    id: 5,
    name: 'Lucas Pereira',
    email: 'lucas.pereira@aluno.inova.br',
    avatar: '👨‍🎓',
    type: 'Motorista',
    status: 'Ativo',
    lastAccess: '2024-04-12 10:00',
    ipLogin: '192.168.1.105',
    school: 'Faculdade Tecnológica Inova',
    course: 'Análise e Desenvolvimento de Sistemas'
  },
  {
    id: 6,
    name: 'Admin Sistema',
    email: 'admin@sistema.inova.br',
    avatar: '👨‍💼',
    type: 'Administrador',
    status: 'Ativo',
    lastAccess: '2024-12-01 09:00',
    ipLogin: '192.168.1.106',
    school: 'Faculdade Tecnológica Inova',
    course: 'Sistema'
  },
  {
    id: 7,
    name: 'Novo Aluno',
    email: 'novo.aluno@aluno.inova.br',
    avatar: '👨‍🎓',
    type: 'Temporário',
    status: 'Pendente',
    lastAccess: null,
    ipLogin: null,
    school: 'Faculdade Tecnológica Inova',
    course: 'Não definido'
  },
  {
    id: 8,
    name: 'Pendente OTP',
    email: 'pendente.otp@aluno.inova.br',
    avatar: '👨‍🎓',
    type: 'Pendente',
    status: 'Aguardando verificação',
    lastAccess: null,
    ipLogin: null,
    school: 'Faculdade Tecnológica Inova',
    course: 'Não definido'
  },
  {
    id: 9,
    name: 'Fábio Suspenso',
    email: 'fabio.suspenso@aluno.inova.br',
    avatar: '👨‍🎓',
    type: 'Motorista',
    status: 'Suspenso',
    lastAccess: null,
    ipLogin: null,
    school: 'Faculdade Tecnológica Inova',
    course: 'Não definido'
  },
  {
    id: 10,
    name: 'Temp Veículo',
    email: 'temp.veiculo@aluno.inova.br',
    avatar: '👨‍🎓',
    type: 'Motorista',
    status: 'Temporário',
    lastAccess: null,
    ipLogin: null,
    school: 'Faculdade Tecnológica Inova',
    course: 'Não definido'
  }
];

// Sugestões e denúncias no formato de interface.
// status: 'Resolvido' | 'Em análise' | 'Pendente'
// response: resposta do admin (null se ainda sem resposta)
export const suggestionsData = [
  {
    id: 1,
    userName: 'Mariana Souza',
    avatar: '👩‍🎓',
    text: 'Seria ótimo ter um filtro de caronas por horário de saída mais específico.',
    type: 'Sugestão',
    date: '2024-04-12',
    status: 'Resolvido',
    response: 'Obrigado pela sugestão! Já está no nosso backlog para a próxima sprint.'
  },
  {
    id: 2,
    userName: 'Lucas Pereira',
    avatar: '👨‍🎓',
    text: 'O usuário Carlos Silva cancelou a carona em cima da hora sem nenhum aviso.',
    type: 'Denúncia',
    date: '2024-04-12',
    status: 'Em análise',
    response: null
  },
  {
    id: 3,
    userName: 'Carlos Silva',
    avatar: '👨‍🎓',
    text: 'Poderia ter uma opção de carona recorrente para quem vai ao mesmo lugar todo dia.',
    type: 'Sugestão',
    date: '2024-04-12',
    status: 'Pendente',
    response: null
  },
  {
    id: 4,
    userName: 'Pedro Santos',
    avatar: '👨‍🎓',
    text: 'Encontrei um usuário com comprovante de matrícula claramente falsificado.',
    type: 'Denúncia',
    date: '2024-04-07',
    status: 'Resolvido',
    response: 'Denúncia verificada e confirmada. O usuário foi suspenso. Obrigado pelo aviso.'
  }
];

// Caronas no formato de interface (usado por componentes antigos).
// status: 'Aberta' | 'Em espera' | 'Concluída' | 'Cancelada'
export const ridesData = [
  {
    id: 'R001',
    driver: 'Carlos Silva',
    passengers: ['Mariana Souza', 'Lucas Pereira'],
    origin: 'Rua das Flores, 123, Centro, São Paulo',
    destination: 'Estação Metrô Consolação, São Paulo',
    originPoint: 'Saída - Casa do Carlos',
    destinationPoint: 'Metrô Consolação',
    time: '2024-04-13 07:30',
    status: 'Aberta',
    vagasDisponiveis: 3,
    description: 'Ida p/ faculdade - Saio do centro, passo na Consolação'
  },
  {
    id: 'R002',
    driver: 'Carlos Silva',
    passengers: [],
    origin: 'Rua das Flores, 123, Centro, São Paulo',
    destination: 'Faculdade Tecnológica Inova',
    time: '2024-04-13 07:30',
    status: 'Em espera',
    vagasDisponiveis: 0,
    description: 'Ida p/ faculdade - Saio do centro'
  },
  {
    id: 'R003',
    driver: 'Pedro Santos',
    passengers: [],
    origin: 'Rua da Paz, 88, Vila Nova, Campinas',
    destination: 'Faculdade',
    originPoint: 'Saída - Casa do Pedro',
    time: '2024-04-13 18:00',
    status: 'Aberta',
    vagasDisponiveis: 1,
    description: 'Volta p/ Vila Nova - só 1 passageiro na moto',
    vehicle: 'Honda CG 160 - Azul'
  },
  {
    id: 'R004',
    driver: 'Lucas Pereira',
    passengers: ['Carlos Silva'],
    origin: 'Rua Nova, 200, Pinheiros, São Paulo',
    destination: 'Av. Faria Lima, 1000, São Paulo',
    time: '2024-04-13 07:45',
    status: 'Aberta',
    vagasDisponiveis: 2,
    description: 'Ida p/ faculdade - Saio de Pinheiros'
  },
  {
    id: 'R005',
    driver: 'Carlos Silva',
    passengers: ['Lucas Pereira'],
    origin: 'Rua das Flores, 123, Centro, São Paulo',
    destination: 'Faculdade Tecnológica Inova',
    time: '2024-04-05 07:30',
    status: 'Concluída',
    vagasDisponiveis: 0,
    description: 'Ida p/ faculdade - Carona da semana passada'
  },
  {
    id: 'R006',
    driver: 'Carlos Silva',
    passengers: [],
    origin: 'Rua das Flores, 123, Centro, São Paulo',
    destination: 'Faculdade Tecnológica Inova',
    time: '2024-04-14 07:30',
    status: 'Cancelada',
    vagasDisponiveis: 3,
    description: 'Ida p/ faculdade - Cancelei por imprevisto'
  }
];

export const reportsData = [
  {
    id: 1,
    title: 'Relatório de Usuários',
    description: 'Análise detalhada de cadastros, atividades e perfis de estudantes.',
    icon: 'Users'
  },
  {
    id: 2,
    title: 'Relatório de Caronas',
    description: 'Estatísticas de viagens realizadas, canceladas e em andamento.',
    icon: 'Car'
  },
  {
    id: 3,
    title: 'Relatório de Denúncias',
    description: 'Acompanhamento de sugestões e denúncias enviadas pelos usuários.',
    icon: 'AlertCircle'
  },
  {
    id: 4,
    title: 'Relatório Geral',
    description: 'Visão completa da plataforma com desempenho consolidado.',
    icon: 'BarChart2'
  }
];

export const recentReports = [
  {
    id: 1,
    title: 'Relatório Geral - Abril',
    date: '2024-04-10',
    size: '2.4 MB'
  },
  {
    id: 2,
    title: 'Relatório de Caronas',
    date: '2024-04-08',
    size: '1.8 MB'
  },
  {
    id: 3,
    title: 'Relatório de Usuários',
    date: '2024-04-05',
    size: '3.1 MB'
  }
];

export const contractsData = [
  {
    id: 1,
    institutionName: 'Faculdade Tecnológica Inova',
    contractType: 'Termos de Serviço',
    signDate: '2024-01-10',
    expiryDate: '2025-01-10',
    version: 'v2.0',
    status: 'Ativo',
    description: 'Contrato de uso da plataforma CaronaCity para estudantes e funcionários',
    contactPerson: 'Prof. João da Silva'
  },
  {
    id: 2,
    institutionName: 'IFSP - Campus São Paulo',
    contractType: 'Acordo de Responsabilidade Civil',
    signDate: '2023-06-15',
    expiryDate: '2024-06-15',
    version: 'v1.8',
    status: 'Vencido',
    description: 'Termo de responsabilidade e segurança para uso da plataforma de caronas',
    contactPerson: 'Dra. Maria Santos'
  },
  {
    id: 3,
    institutionName: 'Universidade Federal de São Paulo',
    contractType: 'Política de Privacidade',
    signDate: '2024-02-20',
    expiryDate: '2025-02-20',
    version: 'v2.1',
    status: 'Ativo',
    description: 'Conformidade com LGPD e políticas de proteção de dados dos usuários',
    contactPerson: 'Eng. Carlos Rodrigues'
  },
  {
    id: 4,
    institutionName: 'Senac São Paulo',
    contractType: 'Termos de Serviço',
    signDate: '2024-03-05',
    expiryDate: '2026-03-05',
    version: 'v2.0',
    status: 'Pendente de Assinatura',
    description: 'Contrato em revisão para assinatura dos representantes da instituição',
    contactPerson: 'Coordenadoria Administrativo'
  },
  {
    id: 5,
    institutionName: 'Escola Técnica Estadual Professor Camargo',
    contractType: 'Acordo de Responsabilidade Civil',
    signDate: '2023-11-22',
    expiryDate: '2024-11-22',
    version: 'v1.5',
    status: 'Vencido',
    description: 'Responsabilidades e obrigações institucionais na plataforma',
    contactPerson: 'Secretário de Educação'
  }
];

export const apiRecentReportsData = [
  {
    rel_id: 1,
    rel_titulo: 'Relatório Geral - Abril',
    rel_tipo: 'geral',
    rel_gerado_em: '2024-04-10T10:00:00.000Z',
    rel_tamanho: '2.4 MB',
    rel_gerado_por: 6
  },
  {
    rel_id: 2,
    rel_titulo: 'Relatório de Caronas',
    rel_tipo: 'caronas',
    rel_gerado_em: '2024-04-08T14:30:00.000Z',
    rel_tamanho: '1.8 MB',
    rel_gerado_por: 6
  },
  {
    rel_id: 3,
    rel_titulo: 'Relatório de Usuários',
    rel_tipo: 'usuarios',
    rel_gerado_em: '2024-04-05T09:15:00.000Z',
    rel_tamanho: '3.1 MB',
    rel_gerado_por: 6
  }
];

export const auditLogData = [
  {
    audit_id: 1,
    tabela: 'USUARIOS',
    registro_id: 42,
    acao: 'CADASTRO_USU',
    dados_anteriores: null,
    dados_novos: { usu_nome: 'Carlos Silva' },
    usu_id: 6,
    ip: '192.168.1.50',
    criado_em: '2024-04-12T10:00:00.000Z',
  },
  {
    audit_id: 2,
    tabela: 'CARONAS',
    registro_id: 15,
    acao: 'CRIAR_CARONA',
    dados_anteriores: null,
    dados_novos: { origem: 'UFMS', destino: 'Centro' },
    usu_id: 6,
    ip: '192.168.1.50',
    criado_em: '2024-04-12T10:15:00.000Z',
  },
  {
    audit_id: 3,
    tabela: 'USUARIOS',
    registro_id: 9,
    acao: 'PENALIDADE_SUSPENSAO',
    dados_anteriores: { usu_status: 1 },
    dados_novos: { usu_status: 0 },
    usu_id: 6,
    ip: '192.168.1.50',
    criado_em: '2024-04-07T12:45:00.000Z',
  },
  {
    audit_id: 4,
    tabela: 'PENALIDADES',
    registro_id: 7,
    acao: 'PENALIDADE_APLICAR',
    dados_anteriores: null,
    dados_novos: { pen_tipo: 1, pen_motivo: 'Cancelamento recorrente' },
    usu_id: 6,
    ip: '192.168.1.50',
    criado_em: '2024-04-05T08:30:00.000Z',
  },
  {
    audit_id: 5,
    tabela: 'USUARIOS',
    registro_id: 13,
    acao: 'DELETAR_USU',
    dados_anteriores: { usu_nome: 'João Inativo' },
    dados_novos: null,
    usu_id: 6,
    ip: '10.0.0.1',
    criado_em: '2024-04-04T16:20:00.000Z',
  },
  {
    audit_id: 6,
    tabela: 'USUARIOS',
    registro_id: 21,
    acao: 'STATUS_USU',
    dados_anteriores: { usu_status: 0 },
    dados_novos: { usu_status: 1 },
    usu_id: 6,
    ip: '192.168.1.50',
    criado_em: '2024-04-03T09:10:00.000Z',
  },
  {
    audit_id: 7,
    tabela: 'PENALIDADES',
    registro_id: 3,
    acao: 'REMOVER_PENALIDADE',
    dados_anteriores: { pen_ativo: 1 },
    dados_novos: { pen_ativo: 0 },
    usu_id: 6,
    ip: '192.168.1.50',
    criado_em: '2024-04-02T14:05:00.000Z',
  },
  {
    audit_id: 8,
    tabela: 'CARONAS',
    registro_id: 8,
    acao: 'RESTAURAR_CARONA',
    dados_anteriores: { car_status: 0 },
    dados_novos: { car_status: 1 },
    usu_id: 6,
    ip: '10.0.0.2',
    criado_em: '2024-04-01T11:00:00.000Z',
  },
];

// Dados do gráfico de caronas por dia da semana (Dashboard).
// day: abreviação do dia, rides: número de caronas naquele dia.
export const chartData = [
  { day: 'Seg', rides: 45 },
  { day: 'Ter', rides: 62 },
  { day: 'Qua', rides: 58 },
  { day: 'Qui', rides: 71 },
  { day: 'Sex', rides: 85 },
  { day: 'Sab', rides: 52 },
  { day: 'Dom', rides: 38 }
];

// Penalidades de usuários no formato de interface.
// A chave do objeto é o ID do usuário (ex: 5, 9).
// pen_tipo: 1 = advertência, 2 = suspensão temporária, 3 = banimento
// pen_ativo: 1 = ativa, 0 = expirada/removida
export const penaltiesData = {
  5: [
    {
      pen_id: 1,
      pen_tipo: 2,
      pen_motivo: 'Comportamento inadequado com motorista.',
      pen_aplicado_em: '2026-03-31T10:00:00.000Z',
      pen_expira_em: '2026-04-29T10:00:00.000Z',
      pen_aplicado_por: 6,
      pen_ativo: 1
    }
  ],
  9: [
    {
      pen_id: 2,
      pen_tipo: 1,
      pen_motivo: 'Cancelamento de última hora recorrente.',
      pen_aplicado_em: '2026-04-01T12:00:00.000Z',
      pen_expira_em: '2026-04-28T12:00:00.000Z',
      pen_aplicado_por: 6,
      pen_ativo: 1
    },
    {
      pen_id: 3,
      pen_tipo: 3,
      pen_motivo: 'Reincidência após penalidade anterior.',
      pen_aplicado_em: '2026-01-10T09:00:00.000Z',
      pen_expira_em: '2026-02-10T09:00:00.000Z',
      pen_aplicado_por: 6,
      pen_ativo: 0
    }
  ]
};

// ============================================================
// Dados no formato de API — imitam a resposta real do backend
//
// Os campos seguem a nomenclatura do banco de dados:
//   usu_  → tabela de usuários
//   car_  → tabela de caronas
//   sug_  → tabela de sugestões
//   pen_  → tabela de penalidades
//   esc_  → tabela de escolas
//   cur_  → tabela de cursos
//   rel_  → tabela de relatórios
//
// usu_status:      1 = ativo, 0 = inativo
// usu_verificacao: 0 = sem verificação, 1 = admin escola,
//                  2 = verificado, 5 = pendente docs,
//                  6 = temp veículo, 9 = suspenso
// ============================================================

// Usuários com formato de API
export const apiUsersData = [
  {
    usu_id: 1,
    usu_nome: 'Carlos Silva',
    usu_email: 'carlos.silva@aluno.inova.br',
    usu_status: 1,
    usu_verificacao: 2,
    usu_telefone: '11999990001',
    usu_foto: null
  },
  {
    usu_id: 2,
    usu_nome: 'Mariana Souza',
    usu_email: 'mariana.souza@aluno.inova.br',
    usu_status: 1,
    usu_verificacao: 2,
    usu_telefone: '11999990002',
    usu_foto: null
  },
  {
    usu_id: 3,
    usu_nome: 'Pedro Santos',
    usu_email: 'pedro.santos@uni.saber.br',
    usu_status: 1,
    usu_verificacao: 2,
    usu_telefone: '11999990003',
    usu_foto: null
  },
  {
    usu_id: 4,
    usu_nome: 'Ana Oliveira',
    usu_email: 'ana.oliveira@aluno.inova.br',
    usu_status: 0,
    usu_verificacao: 0,
    usu_telefone: '11999990004',
    usu_foto: null
  },
  {
    usu_id: 5,
    usu_nome: 'Lucas Pereira',
    usu_email: 'lucas.pereira@aluno.inova.br',
    usu_status: 1,
    usu_verificacao: 2,
    usu_telefone: '11999990005',
    usu_foto: null
  },
  {
    usu_id: 6,
    usu_nome: 'Admin Sistema',
    usu_email: 'admin@sistema.inova.br',
    usu_status: 1,
    usu_verificacao: 2,
    usu_telefone: '11999990006',
    usu_foto: null
  },
  {
    usu_id: 7,
    usu_nome: 'Novo Aluno',
    usu_email: 'novo.aluno@aluno.inova.br',
    usu_status: 1,
    usu_verificacao: 5,
    usu_telefone: '11999990007',
    usu_foto: null
  },
  {
    usu_id: 8,
    usu_nome: 'Pendente OTP',
    usu_email: 'pendente.otp@aluno.inova.br',
    usu_status: 1,
    usu_verificacao: 0,
    usu_telefone: '11999990008',
    usu_foto: null
  },
  {
    usu_id: 9,
    usu_nome: 'Fábio Suspenso',
    usu_email: 'fabio.suspenso@aluno.inova.br',
    usu_status: 1,
    usu_verificacao: 9,
    usu_telefone: '11999990009',
    usu_foto: null
  },
  {
    usu_id: 10,
    usu_nome: 'Temp Veículo',
    usu_email: 'temp.veiculo@aluno.inova.br',
    usu_status: 1,
    usu_verificacao: 6,
    usu_telefone: '11999990010',
    usu_foto: null
  },
  {
    usu_id: 11,
    usu_nome: 'Admin Escola',
    usu_email: 'admin.escola@inova.edu.br',
    usu_status: 1,
    usu_verificacao: 1,
    usu_telefone: '11999990011',
    usu_foto: null
  }
];

// Escolas parceiras cadastradas na plataforma.
// esc_dominio: domínio de e-mail aceito (ex: aluno.inova.br).
// esc_lat / esc_lon: coordenadas geográficas da escola.
export const apiSchoolsData = [
  {
    esc_id: 1,
    esc_nome: 'Faculdade Tecnológica Inova',
    esc_endereco: 'Av. Paulista, 1000, São Paulo - SP',
    esc_dominio: 'inova.edu.br',
    esc_max_usuarios: 100,
    esc_lat: -23.5614,
    esc_lon: -46.6560,
    esc_contrato_duracao: '2anos',
    esc_contrato_inicio: '2026-01-01',
    esc_contrato_expira: '2028-01-01'
  },
  {
    esc_id: 2,
    esc_nome: 'Universidade Estadual do Saber',
    esc_endereco: 'Rua dos Estudos, 500, Campinas - SP',
    esc_dominio: 'saber.edu.br',
    esc_max_usuarios: 50,
    esc_lat: -22.9056,
    esc_lon: -47.0608,
    esc_contrato_duracao: '1ano',
    esc_contrato_inicio: '2026-01-01',
    esc_contrato_expira: '2027-01-01'
  },
  {
    esc_id: 3,
    esc_nome: 'Instituto Federal do Oeste',
    esc_endereco: 'Rua da Ciência, 300, Araçatuba - SP',
    esc_dominio: null,
    esc_max_usuarios: null,
    esc_lat: -21.2091,
    esc_lon: -50.4294,
    esc_contrato_duracao: null,
    esc_contrato_inicio: null,
    esc_contrato_expira: null
  },
  {
    esc_id: 4,
    esc_nome: 'ETEC Centro Paula Souza',
    esc_endereco: 'Rua dos Andradas, 140, Santa Efigênia, São Paulo - SP',
    esc_dominio: 'aluno.cps.sp.gov.br',
    esc_max_usuarios: 500,
    esc_lat: -23.5417,
    esc_lon: -46.6395,
    esc_contrato_duracao: '5anos',
    esc_contrato_inicio: '2025-01-01',
    esc_contrato_expira: '2030-01-01'
  }
];

// Caronas com formato de API.
// car_status: 1 = aberta, 2 = em espera, 3 = concluída, 4 = cancelada
// car_vagas: total de vagas. car_vagas_disponivel: vagas ainda livres.
// passageiros: array de usuários que entraram na carona.
export const apiRidesData = [
  {
    car_id: 1,
    usu_id_motorista: 1,
    usu_nome_motorista: 'Carlos Silva',
    car_status: 1,
    car_data: '2024-04-13 07:30',
    car_desc: 'Ida p/ faculdade - Saio do centro, passo na Consolação',
    pon_partida: 'Rua das Flores, 123, Centro, São Paulo',
    pon_destino: 'Estação Metrô Consolação, São Paulo',
    car_vagas: 4,
    car_vagas_disponivel: 1,
    vei_placa: 'ABC-1234',
    vei_modelo: 'Toyota Corolla',
    passageiros: [
      { usu_id: 2, usu_nome: 'Mariana Souza' },
      { usu_id: 5, usu_nome: 'Lucas Pereira' }
    ]
  },
  {
    car_id: 2,
    usu_id_motorista: 3,
    usu_nome_motorista: 'Pedro Santos',
    car_status: 1,
    car_data: '2024-04-13 18:00',
    car_desc: 'Volta p/ Vila Nova - só 1 passageiro na moto',
    pon_partida: 'Rua da Paz, 88, Vila Nova, Campinas',
    pon_destino: 'Faculdade Estadual do Saber',
    car_vagas: 1,
    car_vagas_disponivel: 1,
    vei_placa: 'XYZ-5678',
    vei_modelo: 'Honda CG 160',
    passageiros: []
  },
  {
    car_id: 3,
    usu_id_motorista: 5,
    usu_nome_motorista: 'Lucas Pereira',
    car_status: 1,
    car_data: '2024-04-13 07:45',
    car_desc: 'Ida p/ faculdade - Saio de Pinheiros',
    pon_partida: 'Rua Nova, 200, Pinheiros, São Paulo',
    pon_destino: 'Av. Faria Lima, 1000, São Paulo',
    car_vagas: 4,
    car_vagas_disponivel: 2,
    vei_placa: 'DEF-9012',
    vei_modelo: 'Honda Civic',
    passageiros: [
      { usu_id: 1, usu_nome: 'Carlos Silva' }
    ]
  },
  {
    car_id: 4,
    usu_id_motorista: 1,
    usu_nome_motorista: 'Carlos Silva',
    car_status: 4,
    car_data: '2024-04-10 07:30',
    car_desc: 'Ida p/ faculdade - Cancelei por imprevisto de última hora.',
    pon_partida: 'Rua das Flores, 123, Centro, São Paulo',
    pon_destino: 'Faculdade Tecnológica Inova',
    car_vagas: 3,
    car_vagas_disponivel: 3,
    vei_placa: 'ABC-1234',
    vei_modelo: 'Toyota Corolla',
    passageiros: [
      { usu_id: 5, usu_nome: 'Lucas Pereira' }
    ]
  },
  {
    car_id: 5,
    usu_id_motorista: 1,
    usu_nome_motorista: 'Carlos Silva',
    car_status: 3,
    car_data: '2024-04-05 07:30',
    car_desc: 'Ida p/ faculdade - Carona da semana passada.',
    pon_partida: 'Rua das Flores, 123, Centro, São Paulo',
    pon_destino: 'Faculdade Tecnológica Inova',
    car_vagas: 4,
    car_vagas_disponivel: 0,
    vei_placa: 'ABC-1234',
    vei_modelo: 'Toyota Corolla',
    passageiros: [
      { usu_id: 2, usu_nome: 'Mariana Souza' },
      { usu_id: 5, usu_nome: 'Lucas Pereira' }
    ]
  },
  {
    car_id: 6,
    usu_id_motorista: 3,
    usu_nome_motorista: 'Pedro Santos',
    car_status: 2,
    car_data: '2024-04-14 08:00',
    car_desc: 'Aguardando confirmação de passageiros para a carona.',
    pon_partida: 'Rua da Paz, 88, Vila Nova, Campinas',
    pon_destino: 'Faculdade Estadual do Saber',
    car_vagas: 2,
    car_vagas_disponivel: 2,
    vei_placa: 'XYZ-5678',
    vei_modelo: 'Honda CG 160',
    passageiros: []
  }
];

// Sugestões e denúncias com formato de API.
// sug_tipo: 0 = sugestão, 1 = denúncia
// sug_status: 0 = pendente, 1 = resolvido, 2 = em análise
// sug_resposta: texto da resposta do admin (null se não respondido)
export const apiSuggestionsData = [
  {
    sug_id: 1,
    usu_id: 2,
    usu_nome: 'Mariana Souza',
    sug_texto: 'Seria ótimo ter um filtro de caronas por horário de saída mais específico.',
    sug_tipo: 0,
    sug_status: 1,
    sug_resposta: 'Obrigado pela sugestão! Já está no nosso backlog para a próxima sprint.',
    criado_em: '2024-04-12T10:00:00.000Z'
  },
  {
    sug_id: 2,
    usu_id: 5,
    usu_nome: 'Lucas Pereira',
    sug_texto: 'O usuário Carlos Silva cancelou a carona em cima da hora sem nenhum aviso.',
    sug_tipo: 1,
    sug_status: 2,
    sug_resposta: null,
    sug_carona_id: 4,
    criado_em: '2024-04-12T11:00:00.000Z'
  },
  {
    sug_id: 3,
    usu_id: 1,
    usu_nome: 'Carlos Silva',
    sug_texto: 'Poderia ter uma opção de carona recorrente para quem vai ao mesmo lugar todo dia.',
    sug_tipo: 0,
    sug_status: 0,
    sug_resposta: null,
    criado_em: '2024-04-12T12:00:00.000Z'
  },
  {
    sug_id: 4,
    usu_id: 3,
    usu_nome: 'Pedro Santos',
    sug_texto: 'Encontrei um usuário com comprovante de matrícula claramente falsificado.',
    sug_tipo: 1,
    sug_status: 1,
    sug_resposta: 'Denúncia verificada e confirmada. O usuário foi suspenso. Obrigado pelo aviso.',
    criado_em: '2024-04-07T15:00:00.000Z'
  }
];

// Estatísticas consolidadas para os cards do Dashboard.
// Organizado por categoria: 'usuarios', 'caronas', 'sugestoes'.
// Consumido por api.getStats(type) em services/api.js.
export const apiStatsData = {
  usuarios: {
    stats: {
      total: 11,
      ativos: 9,
      inativos: 2,
      verificados: 7,
      pendentes: 2,
      suspensos: 1
    }
  },
  caronas: {
    stats: {
      total: 15,
      abertas: 3,
      em_espera: 1,
      finalizadas: 8,
      canceladas: 3
    }
  },
  sugestoes: {
    stats: {
      total: 4,
      pendentes: 1,
      em_analise: 1,
      resolvidas: 2,
      denuncias: 2,
      sugestoes: 2
    }
  }
};

// Cursos oferecidos pelas escolas parceiras.
// esc_id: chave estrangeira que liga o curso à sua escola.
// cur_semestres: duração do curso em semestres.
// cur_ativo: 1 = ativo, 0 = desativado.
export const apiCoursesData = [
  {
    cur_id: 1,
    esc_id: 1,
    cur_nome: 'Análise e Desenvolvimento de Sistemas',
    cur_descricao: 'Formação em desenvolvimento de sistemas computacionais',
    cur_semestres: 5,
    cur_ativo: 1
  },
  {
    cur_id: 2,
    esc_id: 1,
    cur_nome: 'Redes de Computadores',
    cur_descricao: 'Especialização em infraestrutura de rede',
    cur_semestres: 4,
    cur_ativo: 1
  },
  {
    cur_id: 3,
    esc_id: 2,
    cur_nome: 'Engenharia Civil',
    cur_descricao: 'Formação em engenharia civil e projetos',
    cur_semestres: 10,
    cur_ativo: 1
  }
];
