# Informações sobre a API Mockada

## 📋 Status do Projeto

O projeto foi convertido para usar **dados mockados** em vez de chamadas HTTP reais à API. Isso permite que o desenvolvimento continue normalmente enquanto a API backend ainda está em desenvolvimento.

## 🔄 O que foi mudado?

### 1. **Arquivo: `src/services/api.js`**
- ✅ Substituído todas as chamadas `fetch()` por funções mock
- ✅ Removido código de HTTP requests
- ✅ Mantida a mesma interface pública (nomes e assinatura dos métodos)
- ✅ Adicionado `delay()` para simular latência de rede (300ms por padrão)

### 2. **Arquivo: `src/data/mockData.js`**
- ✅ Expandidos os dados existentes
- ✅ Adicionados novos datasets baseados no schema do banco de dados:
  - `apiUsersData` - Lista de usuários
  - `apiSchoolsData` - Lista de escolas
  - `apiRidesData` - Lista de caronas
  - `apiSuggestionsData` - Lista de sugestões/denúncias
  - `apiStatsData` - Estatísticas do dashboard

## 📦 Dados Mockados Disponíveis

### Usuários (11 usuários de teste)
```javascript
apiUsersData = [
  { usu_id: 1, usu_nome: 'Carlos Silva', usu_email: '...', usu_status: 1, ... },
  // ... mais usuários
]
```

### Escolas (4 escolas de teste)
```javascript
apiSchoolsData = [
  { esc_id: 1, esc_nome: 'Faculdade Tecnológica Inova', ... },
  // ... mais escolas
]
```

### Caronas (3 caronas de teste)
```javascript
apiRidesData = [
  { car_id: 1, usu_id_motorista: 1, car_status: 1, ... },
  // ... mais caronas
]
```

### Sugestões (4 sugestões/denúncias)
```javascript
apiSuggestionsData = [
  { sug_id: 1, usu_id: 2, sug_texto: '...', sug_tipo: 0, ... },
  // ... mais sugestões
]
```

### Estatísticas
```javascript
apiStatsData = {
  usuarios: { stats: { total: 11, ativos: 9, ... } },
  caronas: { stats: { total: 15, abertas: 3, ... } },
  sugestoes: { stats: { total: 4, pendentes: 1, ... } }
}
```

## ✅ Funções Mockadas

### Autenticação
- `login(email, senha)` - ✅ Mockado
- `getMe()` - ✅ Mockado
- `logout()` - ✅ Mockado

### Estatísticas
- `getStats(type)` - ✅ Mockado (usuarios, caronas, sugestoes)

### Escolas
- `getSchools()` - ✅ Mockado
- `createSchool(data)` - ✅ Mockado
- `updateSchool(id, data)` - ✅ Mockado
- `deleteSchool(id)` - ✅ Mockado

### Usuários
- `getUsers({page, limit, q})` - ✅ Mockado
- `getUser(userId)` - ✅ Mockado
- `updateUserStatus(userId, status)` - ✅ Mockado
- `updateUserProfile(userId, profileData)` - ✅ Mockado
- `searchUsers(query)` - ✅ Mockado

### Caronas
- `getCaronas()` - ✅ Mockado

### Sugestões
- `getSugestoes()` - ✅ Mockado
- `analisarSugestao(sugId)` - ✅ Mockado
- `responderSugestao(sugId, resposta)` - ✅ Mockado

### Notificações
- `enviarNotificacao({titulo, mensagem, tipo, usu_id})` - ✅ Mockado

### Audit Logs
- `getLogs({page, limit, acao, tabela, usu_id})` - ✅ Mockado

### Penalidades
- `getPenalidades(userId, {ativas, page, limit})` - ✅ Mockado
- `applyPenalidade(userId, {pen_tipo, pen_duracao, pen_motivo})` - ✅ Mockado
- `removePenalidade(penId)` - ✅ Mockado

## 🔀 Como Transicionar para a API Real

Quando a API backend estiver pronta, siga estes passos:

### 1. **Reverter `src/services/api.js`** 
Substitua as funções mock pelas chamadas HTTP originais:
```javascript
async getUsers({ page = 1, limit = 50, q = '' } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (q) params.set('q', q);
  const res = await fetch(`${BASE_URL}/api/admin/usuarios?${params}`, {
    headers: authHeaders()
  });
  return handleResponse(res);
}
```

### 2. **Restaurar configurações de autenticação**
- Adicionar `getToken()` e `authHeaders()` de volta
- Restaurar `handleResponse()` para processar respostas HTTP
- Adicionar `BASE_URL` do environment

### 3. **Testar Compatibilidade**
Os dados mock foram estruturados para corresponder exatamente ao schema esperado da API real:
- Nome dos campos seguem o padrão do banco de dados (ex: `usu_id`, `esc_id`, `car_id`)
- Tipos de dados correspondem (ex: `usu_status: 1` para ativo)
- Estrutura de resposta mantém compatibilidade

## 📊 Páginas que Usam a API

- ✅ **Dashboard** - usa `getStats()` e `getSugestoes()`
- ✅ **Usuários** - usa `getUsers()`, `updateUserStatus()`
- ✅ **Penalidades** - usa `getPenalidades()`, `applyPenalidade()`, `removePenalidade()`
- ✅ **Sugestões** - usa `getSugestoes()`, `analisarSugestao()`, `responderSugestao()`
- ✅ **Cadastrar** - usa `getSchools()`, `createSchool()`, `updateSchool()`, `deleteSchool()`
- ✅ **Notificações** - usa `enviarNotificacao()`
- ✅ **Login** - usa `login()`, `getMe()`, `logout()`

## 🚀 Benefícios da Abordagem

1. **Sem dependência de API** - Desenvolvimento pode prosseguir normalmente
2. **Interface consistente** - Código frontend não precisa de mudanças
3. **Transição suave** - Substituição de funções é direta
4. **Dados realistas** - Mock data baseada no schema real do banco
5. **Performance** - Não há latência de rede até que a API esteja pronta
6. **Testes facilitados** - Fácil adicionar/remover dados para testes

## 💾 Dados Persistentes

⚠️ **IMPORTANTE**: Os dados mock são armazenados em **memória** durante a sessão.
- Mudanças aos dados (criar, editar, deletar) são perdidas ao recarregar a página
- Ao transicionar para a API real, estas operações persistirão no banco de dados

## 📝 Próximos Passos

1. **Continuar desenvolvimento** das páginas com os dados mock
2. **Implementar a API backend** com os endpoints listados em `src/services/api.js`
3. **Testar compatibilidade** de dados entre mock e API real
4. **Substituir funções mock** conforme a API fica pronta
5. **Remover `mockData.js`** após migração completa

---

**Última atualização**: 06/05/2026
**Status**: ✅ Projeto funcionando com dados mock - Pronto para desenvolvimento contínuo
