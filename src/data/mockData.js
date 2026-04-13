// Dados mockados para o painel administrativo CaronaCity

export const adminUser = {
  id: 1,
  name: 'João Silva',
  email: 'joao.silva@universidad.edu.br',
  role: 'Desenvolvedor',
  avatar: '👨‍💼'
};

export const metricsData = [
  {
    id: 1,
    label: 'Total de Usuários',
    value: '1.243',
    icon: 'Users',
    trend: '+12%',
    trendUp: true
  },
  {
    id: 2,
    label: 'Caronas Realizadas',
    value: '847',
    icon: 'Car',
    trend: '+8%',
    trendUp: true
  },
  {
    id: 3,
    label: 'Denúncias Pendentes',
    value: '12',
    icon: 'AlertCircle',
    trend: '+3',
    trendUp: false
  },
  {
    id: 4,
    label: 'Novos Usuários (Semana)',
    value: '78',
    icon: 'TrendingUp',
    trend: '+5%',
    trendUp: true
  }
];

export const feedbacksData = [
  {
    id: 1,
    userName: 'Maria Costa',
    userEmail: 'maria.costa@universidad.edu.br',
    avatar: '👩‍🎓',
    text: 'Excelente aplicativo! Consegui encontrar carona facilmente e o motorista foi muito educado. Recomendo!',
    type: 'Sugestão',
    date: '2024-04-10'
  },
  {
    id: 2,
    userName: 'Pedro Santos',
    userEmail: 'pedro.santos@universidad.edu.br',
    avatar: '👨‍🎓',
    text: 'Tive um problema com um motorista que não apareceu no ponto de encontro. Gostaria de reportar este incidente.',
    type: 'Denúncia',
    date: '2024-04-09'
  },
  {
    id: 3,
    userName: 'Ana Silva',
    userEmail: 'ana.silva@universidad.edu.br',
    avatar: '👩‍🎓',
    text: 'Seria interessante adicionar um sistema de recompensas para usuários que fazem viagens regularmente.',
    type: 'Sugestão',
    date: '2024-04-08'
  }
];

export const usersData = [
  {
    id: 1,
    name: 'Marina Oliveira',
    email: 'marina.oliveira@universidad.edu.br',
    avatar: '👩‍🎓',
    type: 'Motorista',
    status: 'Ativo',
    lastAccess: '2024-04-12 14:30',
    ipLogin: '192.168.1.101'
  },
  {
    id: 2,
    name: 'Carlos Mendes',
    email: 'carlos.mendes@universidad.edu.br',
    avatar: '👨‍🎓',
    type: 'Passageiro',
    status: 'Ativo',
    lastAccess: '2024-04-12 13:15',
    ipLogin: '192.168.1.102'
  },
  {
    id: 3,
    name: 'Juliana Ferreira',
    email: 'juliana.ferreira@universidad.edu.br',
    avatar: '👩‍🎓',
    type: 'Ambos',
    status: 'Ativo',
    lastAccess: '2024-04-11 18:45',
    ipLogin: '192.168.1.103'
  },
  {
    id: 4,
    name: 'Roberto Gomes',
    email: 'roberto.gomes@universidad.edu.br',
    avatar: '👨‍🎓',
    type: 'Motorista',
    status: 'Inativo',
    lastAccess: '2024-03-30 10:20',
    ipLogin: '192.168.1.104'
  },
  {
    id: 5,
    name: 'Beatriz Lima',
    email: 'beatriz.lima@universidad.edu.br',
    avatar: '👩‍🎓',
    type: 'Passageiro',
    status: 'Pendente',
    lastAccess: '2024-04-12 09:00',
    ipLogin: '192.168.1.105'
  },
  {
    id: 6,
    name: 'Daniel Costa',
    email: 'daniel.costa@universidad.edu.br',
    avatar: '👨‍🎓',
    type: 'Ambos',
    status: 'Ativo',
    lastAccess: '2024-04-12 16:30',
    ipLogin: '192.168.1.106'
  },
  {
    id: 7,
    name: 'Sophia Alves',
    email: 'sophia.alves@universidad.edu.br',
    avatar: '👩‍🎓',
    type: 'Motorista',
    status: 'Ativo',
    lastAccess: '2024-04-12 11:45',
    ipLogin: '192.168.1.107'
  },
  {
    id: 8,
    name: 'Lucas Ribeiro',
    email: 'lucas.ribeiro@universidad.edu.br',
    avatar: '👨‍🎓',
    type: 'Passageiro',
    status: 'Ativo',
    lastAccess: '2024-04-12 15:00',
    ipLogin: '192.168.1.108'
  },
  {
    id: 9,
    name: 'Fernanda Martins',
    email: 'fernanda.martins@universidad.edu.br',
    avatar: '👩‍🎓',
    type: 'Ambos',
    status: 'Ativo',
    lastAccess: '2024-04-12 14:20',
    ipLogin: '192.168.1.109'
  },
  {
    id: 10,
    name: 'Ricardo Souza',
    email: 'ricardo.souza@universidad.edu.br',
    avatar: '👨‍🎓',
    type: 'Motorista',
    status: 'Ativo',
    lastAccess: '2024-04-10 12:30',
    ipLogin: '192.168.1.110'
  }
];

export const suggestionsData = [
  {
    id: 1,
    userName: 'Maria Costa',
    avatar: '👩‍🎓',
    text: 'Excelente aplicativo! Consegui encontrar carona facilmente.',
    type: 'Sugestão',
    date: '2024-04-10',
    status: 'Pendente'
  },
  {
    id: 2,
    userName: 'Pedro Santos',
    avatar: '👨‍🎓',
    text: 'Tive um problema com um motorista que não apareceu.',
    type: 'Denúncia',
    date: '2024-04-09',
    status: 'Resolvido'
  },
  {
    id: 3,
    userName: 'Ana Silva',
    avatar: '👩‍🎓',
    text: 'Sistema de recompensas seria interessante.',
    type: 'Sugestão',
    date: '2024-04-08',
    status: 'Pendente'
  },
  {
    id: 4,
    userName: 'Lucas Ferreira',
    avatar: '👨‍🎓',
    text: 'App está muito lento às vezes.',
    type: 'Denúncia',
    date: '2024-04-07',
    status: 'Arquivado'
  }
];

export const ridesData = [
  {
    id: 'R001',
    driver: 'Marina Oliveira',
    passengers: ['Carlos Mendes', 'Beatriz Lima'],
    origin: 'Campus Centro',
    destination: 'Campus Tecnológico',
    time: '2024-04-12 14:30',
    status: 'Concluída'
  },
  {
    id: 'R002',
    driver: 'Roberto Gomes',
    passengers: ['Daniel Costa'],
    origin: 'Estação Metrô',
    destination: 'Campus Centro',
    time: '2024-04-12 15:45',
    status: 'Em andamento'
  },
  {
    id: 'R003',
    driver: 'Sophia Alves',
    passengers: ['Lucas Ribeiro', 'Fernanda Martins'],
    origin: 'Campus Tecnológico',
    destination: 'Shopping Center',
    time: '2024-04-12 16:15',
    status: 'Concluída'
  },
  {
    id: 'R004',
    driver: 'Ricardo Souza',
    passengers: ['Maria Costa'],
    origin: 'Campus Centro',
    destination: 'Casa Estudante',
    time: '2024-04-11 13:20',
    status: 'Cancelada'
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
    userName: 'Marina Oliveira',
    contractType: 'Termos de Serviço',
    acceptDate: '2024-02-15',
    version: 'v2.0',
    status: 'Ativo'
  },
  {
    id: 2,
    userName: 'Carlos Mendes',
    contractType: 'Política de Privacidade',
    acceptDate: '2024-03-10',
    version: 'v2.1',
    status: 'Ativo'
  },
  {
    id: 3,
    userName: 'Juliana Ferreira',
    contractType: 'Acordo de Responsabilidade',
    acceptDate: '2024-01-20',
    version: 'v1.5',
    status: 'Expirado'
  },
  {
    id: 4,
    userName: 'Roberto Gomes',
    contractType: 'Termos de Serviço',
    acceptDate: '2024-04-01',
    version: 'v2.0',
    status: 'Ativo'
  }
];

export const auditLogData = [
  {
    id: 1,
    date: '2024-04-12 14:30',
    admin: 'João Silva',
    action: 'Remoção de Usuário',
    description: 'Usuário Roberto Gomes removido da plataforma',
    ip: '192.168.1.50'
  },
  {
    id: 2,
    date: '2024-04-12 13:15',
    admin: 'João Silva',
    action: 'Envio de Notificação',
    description: 'Notificação enviada para 150 usuários',
    ip: '192.168.1.50'
  },
  {
    id: 3,
    date: '2024-04-11 18:45',
    admin: 'Ana Martins',
    action: 'Geração de Relatório',
    description: 'Relatório Geral exportado em PDF',
    ip: '192.168.1.51'
  },
  {
    id: 4,
    date: '2024-04-11 17:20',
    admin: 'João Silva',
    action: 'Resolução de Denúncia',
    description: 'Denúncia de usuário resolvida',
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
