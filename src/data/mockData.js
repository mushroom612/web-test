// Dados mockados para o painel administrativo CaronaCity
// Baseado no modelo do banco de dados (insert.sql)

export const adminUser = {
  id: 6,
  name: 'Admin Sistema',
  email: 'admin@sistema.inova.br',
  role: 'Desenvolvedor',
  avatar: '👨‍💼'
};

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
    description: 'Análise detalhada de cadastros, atividades e perfis',
    icon: 'Users'
  },
  {
    id: 2,
    title: 'Relatório de Caronas',
    description: 'Estatísticas de viagens realizadas e canceladas',
    icon: 'Car'
  },
  {
    id: 3,
    title: 'Relatório de Denúncias',
    description: 'Acompanhamento de sugestões e denúncias',
    icon: 'AlertCircle'
  },
  {
    id: 4,
    title: 'Relatório Geral',
    description: 'Visão completa da plataforma e desempenho',
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

export const auditLogData = [
  {
    id: 1,
    date: '2024-04-12 10:00',
    admin: 'Admin Sistema',
    action: 'Cadastro de Usuário',
    description: 'Usuário Carlos Silva cadastrado na plataforma',
    ip: '192.168.1.50'
  },
  {
    id: 2,
    date: '2024-04-12 10:15',
    admin: 'Admin Sistema',
    action: 'Envio de Notificação',
    description: 'Notificação enviada para 150 usuários',
    ip: '192.168.1.50'
  },
  {
    id: 3,
    date: '2024-04-07 12:45',
    admin: 'Admin Sistema',
    action: 'Suspensão de Usuário',
    description: 'Usuário com comprovante falsificado foi suspenso',
    ip: '192.168.1.50'
  },
  {
    id: 4,
    date: '2024-04-05 08:30',
    admin: 'Admin Sistema',
    action: 'Aplicação de Penalidade',
    description: 'Penalidade tipo 1 aplicada a usuário por cancelamento recorrente',
    ip: '192.168.1.50'
  }
];

export const chartData = [
  { day: 'Seg', rides: 45 },
  { day: 'Ter', rides: 62 },
  { day: 'Qua', rides: 58 },
  { day: 'Qui', rides: 71 },
  { day: 'Sex', rides: 85 },
  { day: 'Sab', rides: 52 },
  { day: 'Dom', rides: 38 }
];

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

export const notificationData = {
  count: 3,
  items: [
    {
      id: 1,
      message: 'Nova denúncia recebida',
      timestamp: '5 minutos atrás'
    },
    {
      id: 2,
      message: 'Usuário criou conta',
      timestamp: '1 hora atrás'
    },
    {
      id: 3,
      message: 'Carona concluída com sucesso',
      timestamp: '3 horas atrás'
    }
  ]
};
