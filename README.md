# 📚 Tuctuc - Painel Administrativo Web

> Plataforma de administração para o aplicativo Tuctuc de caronas solidárias entre estudantes

## 🎯 O que é este projeto?

Este é um **painel administrativo completo** para o aplicativo Tuctuc. Pense nele como um "dashboard" onde administradores podem:

- 👥 Gerenciar usuários
- 🚗 Acompanhar caronas
- 💬 Ver sugestões e denúncias
- 📊 Gerar relatórios
- 🔔 Enviar notificações
- 📋 Gerenciar contratos
- 🔍 Acessar logs de auditoria

---

## 📁 ESTRUTURA DE PASTAS - Onde tudo fica

```
web-test/
├── src/                          ← Pasta principal (onde todo seu código fica)
│   ├── global.css                ← As "cores e estilos padrão" de todo o app
│   ├── main.jsx                  ← Arquivo que INICIA tudo
│   ├── App.jsx                   ← Arquivo que CONTROLA as rotas/páginas
│   │
│   ├── context/                  ← Contextos React (compartilhamento de estado)
│   │   └── AuthContext.jsx       ← Contexto de autenticação do usuário
│   │
│   ├── data/
│   │   └── mockData.js           ← "Banco de dados falso" (dados que aparecem nas telas)
│   │
│   ├── services/                 ← Serviços e chamadas de API
│   │   ├── api.js                ← Funções mockadas de API
│   │   └── http.js               ← Configuração de requisições HTTP
│   │
│   ├── components/               ← "Blocos de construção" reutilizáveis
│   │   ├── Aside.jsx
│   │   ├── Aside.module.css
│   │   ├── Topbar.jsx
│   │   ├── Topbar.module.css
│   │   ├── StatusBadge.jsx
│   │   ├── StatusBadge.module.css
│   │   ├── FeedbackCard.jsx
│   │   ├── FeedbackCard.module.css
│   │   ├── PenaltyModal.jsx      ← Modal para aplicar penalidades
│   │   ├── PenaltyModal.module.css
│   │   ├── PenaltyPanel.jsx
│   │   ├── PenaltyPanel.module.css
│   │   ├── UserActionsMenu.jsx
│   │   ├── UserActionsMenu.module.css
│   │   ├── UserProfilePanel.jsx
│   │   └── UserProfilePanel.module.css
│   │
│   ├── layouts/                  ← "Modelos de página" (estrutura base)
│   │   ├── AdminLayout.jsx
│   │   ├── AdminLayout.module.css
│   │   ├── DesenLayout.jsx
│   │   ├── DesenLayout.module.css
│   │   ├── PublicLayout.jsx
│   │   └── PublicLayout.module.css
│   │
│   ├── pages/                    ← As páginas reais que o usuário vê
│   │   ├── Login.jsx
│   │   ├── Painel.jsx
│   │   ├── Usuarios.jsx
│   │   ├── Caronas.jsx
│   │   ├── Sugestoes.jsx
│   │   ├── Relatorios.jsx
│   │   ├── Cadastrar.jsx
│   │   ├── Contratos.jsx
│   │   ├── Notificacoes.jsx
│   │   ├── Auditoria.jsx
│   │   ├── Penalidades.jsx
│   │   └── [page].module.css
│   │
│   └── router/
│       └── routes.jsx
│
├── data/                         ← Arquivos SQL (schema do banco)
│   ├── create.sql
│   ├── insert.sql
│   └── select.sql
│
├── public/
├── package.json
├── vite.config.js
├── eslint.config.js
├── index.html
├── README.md
└── MOCK_API_INFO.md
```

---

## 🎮 COMO FUNCIONA - O Fluxo do Aplicativo

### Quando você abre http://localhost:5173/

```
1. Browser abre index.html
   ↓
2. index.html chama main.jsx
   ↓
3. main.jsx chama App.jsx
   ↓
4. App.jsx usa routes.jsx para saber qual página mostrar
   ↓
5. Como a URL é "/", mostra Login.jsx
```

### Quando você clica em "Entrar"

```
1. Login.jsx redireciona para "/painel"
   ↓
2. App.jsx vê que a URL é "/painel"
   ↓
3. Mostra AdminLayout.jsx (que tem Aside + Topbar)
   ↓
4. AdminLayout coloca Painel.jsx no meio
   ↓
5. Painel.jsx pega dados de mockData.js e mostra na tela
```

---

## 🔄 DADOS MOCKADOS - Como os dados funcionam

> Este projeto usa **dados mockados** (simulados) em vez de chamadas HTTP reais. Isso permite que você desenvolva a interface enquanto a API backend está sendo construída.

### Arquivos principais de dados:

- **`src/services/api.js`** - Contém as funções que simulam chamadas de API
- **`src/data/mockData.js`** - Contém todos os dados que aparecem nas telas

### Como funciona?

```javascript
// Quando uma página precisa de dados:
1. Chama uma função em api.js
   Exemplo: api.getUsers()
   ↓
2. A função em api.js retorna dados de mockData.js
   ↓
3. A página exibe os dados na tela
```

---

## 📁 O QUE CADA PASTA FAZ

### **src/data/mockData.js** - O "Banco de Dados Falso"

Este arquivo tem **TODOS os dados** que aparecem nas telas. É como um Excel com informações.

**Dados disponíveis:**

- `adminUser` - Dados do admin logado
- `metricsData` - Números do dashboard (1.243 usuários, 847 caronas, etc)
- `feedbacksData` - Lista de feedbacks
- `usersData` - Lista de usuários
- `suggestionsData` - Sugestões e denúncias
- `ridesData` - Registros de caronas
- `reportsData` - Tipos de relatórios
- `contractsData` - Contratos
- `auditLogData` - Log de ações administrativas
- `chartData` - Dados para gráficos

**Como alterar?**

1. Abra `src/data/mockData.js`
2. Mude os dados que quiser
3. Salve (Ctrl+S)
4. A página atualiza automaticamente

---

## 📌 CONTEXTOS REACT (src/context/)

Os contextos são usados para compartilhar estado em toda a aplicação sem precisar passar props manualmente em todos os componentes.

### **AuthContext.jsx** - Contexto de Autenticação

- **O que é:** Armazena dados do usuário logado e controla autenticação
- **Dados armazenados:**
  - Dados do usuário (nome, email, permissões)
  - Token de autenticação
  - Status de login
- **Como usar em um componente:**

  ```javascript
  import { useAuth } from "../context/AuthContext";

  function MeuComponente() {
    const { user, isAuthenticated } = useAuth();
    return <div>{user?.name}</div>;
  }
  ```

---

### **src/components/** - Os "Blocos de Construção"

São pequenos componentes reutilizáveis em várias páginas.

#### ✅ **Aside.jsx** - A barra lateral

- **O que é:** Menu esquerdo com todas as opções
- **Onde fica:** Lado esquerdo da tela
- **Como alterar menu:**
  - Procure por `menuSections` no arquivo
  - Adicione um novo item assim:
    ```javascript
    { icon: Car, label: 'Novo Item', path: '/novo-item' }
    ```

#### ✅ **Topbar.jsx** - A barra superior

- **O que é:** Header com título, sino de notificações e botão sair
- **Onde fica:** Topo da tela
- **Como alterar:**
  - Procure por `pageNames` para mudar nomes de páginas

#### ✅ **StatusBadge.jsx** - Rótulos coloridos

- **O que é:** Retângulos com "Ativo", "Inativo", "Pendente"
- **Como alterar cores:**
  ```javascript
  // Procure por statusStyles
  'Ativo': { bg: '#e9f5df', text: '#2d5016' }  // Mude as cores aqui
  ```

#### ✅ **FeedbackCard.jsx** - Card de feedback

- **O que é:** Um card que mostra feedback/sugestão/denúncia
- **Reutilizado em:** Painel.jsx e Sugestoes.jsx

#### ✅ **UserActionsMenu.jsx** - Menu de ações do usuário

- **O que é:** Menu dropdown com ações disponíveis para um usuário
- **Ações incluídas:**
  - Visualizar detalhes
  - Editar
  - Aplicar penalidade
- **Reutilizado em:** Usuarios.jsx, Caronas.jsx

#### ✅ **PenaltyModal.jsx** - Modal de penalidades 🔐

- **O que é:** Modal interativo para aplicar penalidades a usuários
- **Onde abre:** Ao clicar em "Penalizar" no menu de ações do usuário
- **Funcionalidades principais:**
  - 4 tipos de penalidade com ícones:
    1. 🚫 Impedimento de oferecer caronas
    2. 🛑 Impedimento de solicitar caronas
    3. ⚠️ Impedimento de ambos
    4. 🔒 Suspensão de conta
  - Duração configurável: 1 semana até 6 meses
  - Campo de motivo (textarea) para documentação
  - Animação suave (slideUp) ao abrir
  - Responsivo para celular/tablet/desktop
- **Como funciona:**
  ```javascript
  // Ao clicar em "Penalizar", Usuarios.jsx abre o modal
  <PenaltyModal
    isOpen={isPenaltyModalOpen}
    user={selectedUser}
    onClose={handleClosePenaltyModal}
    onSubmit={handleApplyPenalty}
  />
  ```
- **Reutilizado em:** Usuarios.jsx, Penalidades.jsx

---

### **src/layouts/** - Os "Modelos de Página"

Definem como as páginas são **estruturadas**.

#### **AdminLayout.jsx** - Layout COM barra lateral + header

```
┌─────────────────────────────────┐
│      TOPBAR (header)            │
├──────────┬──────────────────────┤
│          │                      │
│  ASIDE   │    CONTEÚDO DA       │
│ (menu)   │      PÁGINA          │
│          │                      │
└──────────┴──────────────────────┘
```

#### **DesenLayout.jsx** - Layout alternativo de desenvolvimento

- **O que é:** Layout muito similar ao AdminLayout (com Aside + Topbar)
- **Uso:** Layout alternativo para desenvolvimento e testes
- **Estrutura:** Mesma estrutura do AdminLayout com sidebar + conteúdo + header

#### **PublicLayout.jsx** - Layout SEM barra lateral (só para login)

```
┌──────────────────────────────┐
│                              │
│  CONTEÚDO CENTRALIZADO       │
│     (LOGIN)                  │
│                              │
└──────────────────────────────┘
```

---

### **src/pages/** - As "Páginas Reais"

Cada arquivo aqui é uma tela que o usuário vê.

| Página               | URL             | Descrição                           |
| -------------------- | --------------- | ----------------------------------- |
| **Login.jsx**        | `/`             | Tela de login                       |
| **Dashboard.jsx**    | `/dashboard`    | Tela inicial com métricas           |
| **Usuarios.jsx**     | `/usuarios`     | Lista de usuários                   |
| **Cadastrar.jsx**    | `/cadastrar`    | Cadastro de usuário (Dev only)      |
| **Caronas.jsx**      | `/caronas`      | Registros de carona                 |
| **Sugestoes.jsx**    | `/sugestoes`    | Sugestões (Dev) e denúncias (Admin) |
| **Relatorios.jsx**   | `/relatorios`   | Página de relatórios                |
| **Contratos.jsx**    | `/contratos`    | Contratos/termos                    |
| **Suporte.jsx**      | `/suporte`      | Chat de suporte Admin ↔ Dev (v30)   |
| **Auditoria.jsx**    | `/auditoria`    | Log de ações (Dev only)             |

---

## 🎨 CORES E ESTILOS (src/global.css)

Este arquivo tem as **cores padrão** de todo o app.

```css
--color-green-700: #4e8726 ← Verde principal (botões) --color-green-100: #e9f5df
  ← Verde claro (fundos) --surface-page: #ececec ← Cor de fundo
  --text-primary: #171717 ← Cor do texto;
```

**Como alterar uma cor?**

1. Abra `src/global.css`
2. Procure por `--color-green-700: #4e8726`
3. Mude o código hex `#4e8726` para outra cor
4. Salve - todas as páginas mudam automaticamente

---

## 🔀 ROTEAMENTO (src/router/routes.jsx)

Este arquivo diz: "Qual página mostrar em qual URL"

```javascript
{ path: '/painel', element: <Painel /> }       // URL "/painel" mostra Painel
{ path: '/usuarios', element: <Usuarios /> }    // URL "/usuarios" mostra Usuarios
```

**Como adicionar uma página nova?**

1. Crie o arquivo da página: `src/pages/MinhaPage.jsx`
2. Importe em `routes.jsx`:
   ```javascript
   import { MinhaPage } from "../pages/MinhaPage";
   ```
3. Adicione a rota:
   ```javascript
   { path: '/minha-pagina', element: <MinhaPage /> }
   ```

---

## 📋 CSS MODULES - Os estilos

Cada página `.jsx` tem um arquivo `.module.css` correspondente.

**Exemplo:**

- `Painel.jsx` ← componente React
- `Painel.module.css` ← estilos

**Como alterar estilos?**

1. Abra o arquivo `.module.css` da página
2. Procure a classe que quer mudar
3. Mude as propriedades CSS:

```css
.title {
  font-size: 24px;        ← tamanho
  font-weight: 700;       ← peso (negrito)
  color: #4e8726;         ← cor
  padding: 20px;          ← espaço interno
}
```

---

## 🛠️ MUDANÇAS PRÁTICAS

### ✏️ Exemplo 1: Mudar nome de um usuário

1. Abra `src/data/mockData.js`
2. Procure por `usersData`
3. Mude:
   ```javascript
   { id: 1, name: 'Marina Oliveira', ... }  // ← Mude aqui
   ```
4. Salve - página atualiza automaticamente

### ✏️ Exemplo 2: Mudar cor do botão

1. Abra `src/global.css`
2. Procure por `--btn-primary-bg: #4e8726;`
3. Mude para outra cor: `--btn-primary-bg: #0369a1;`
4. Salve - todos os botões primários mudam

### ✏️ Exemplo 3: Adicionar campo no cadastro

1. Abra `src/pages/Cadastrar.jsx`
2. No `formData`, adicione:
   ```javascript
   const [formData, setFormData] = useState({
     // ... campos antigas
     telefone: "", // ← novo
   });
   ```
3. No formulário, adicione:
   ```jsx
   <input
     type="tel"
     id="telefone"
     name="telefone"
     value={formData.telefone}
     onChange={handleChange}
   />
   ```

---

## 📱 RESPONSIVIDADE

Os arquivos `.module.css` têm código para telas pequenas (celular):

```css
@media (max-width: 768px) {
  .title {
    font-size: 18px; /* menor em celular */
  }
}
```

Se algo ficar ruim em celular, ajuste essas linhas.

---

## 🛡️ SISTEMA DE PENALIDADES

Este painel possui um sistema completo para aplicar penalidades a usuários infratores.

### Como usar:

1. **Vá para a página "Usuários"** (`/usuarios`)
2. **Clique no ícone ⋮ (três pontos)** em qualquer linha de usuário
3. **Selecione "Penalizar"** do menu
4. **Na modal que abriu:**
   - Escolha o **tipo de penalidade**
   - Escolha a **duração**
   - **Digite o motivo** (obrigatório)
   - Clique em **"Aplicar Penalidade"**

### Tipos de penalidade disponíveis:

| Tipo                         | Ícone | Descrição                                       |
| ---------------------------- | ----- | ----------------------------------------------- |
| **Impedimento de oferecer**  | 🚫    | Usuário não pode oferecer caronas               |
| **Impedimento de solicitar** | 🛑    | Usuário não pode solicitar caronas              |
| **Impedimento duplo**        | ⚠️    | Usuário não pode oferecer NEM solicitar caronas |
| **Suspensão de conta**       | 🔒    | Usuário tem acesso suspenso completamente       |

### Durações disponíveis:

- 1 semana
- 2 semanas
- 1 mês
- 3 meses
- 6 meses

### Exemplo prático:

```
Usuário: Marina Oliveira
Tipo: Impedimento de oferecer caronas
Duração: 2 semanas
Motivo: Cancelamento de caronas sem aviso prévio
```

---

## ❓ DÚVIDAS FREQUENTES

**P: Onde mudo o texto "Tuctuc"?**
R: Em `src/components/Aside.jsx`, procure por `<span>Tuctuc</span>`.

**P: Como adiciono mais um feedback no dashboard?**
R: Vá em `src/data/mockData.js`, procure `feedbacksData` e adicione um novo objeto.

**P: Onde vejo os erros se algo quebrar?**
R: No console do navegador (F12 → Aba Console) ou no terminal onde rodou `npm run dev`.

**P: Os dados que mudo desaparecem quando recarrego a página? Por que?**
R: Porque o projeto usa **dados mockados** carregados de `src/data/mockData.js`. Quando a página recarrega, os dados originais são recarregados. Modificações diretas pela interface não são persistentes.

**P: Como faço para que as alterações nos dados sejam permanentes?**
R: Edite o arquivo `src/data/mockData.js` diretamente. Salve o arquivo e o servidor de desenvolvimento recarregará automaticamente com os novos dados.

**P: Como adiciono um novo tipo de penalidade?**
R:

1. Abra `src/components/PenaltyModal.jsx`
2. Procure por `const penaltyTypes = [`
3. Adicione um novo objeto com `icon`, `title` e `description`
4. Salve - o novo tipo aparecerá no modal

**P: Será possível integrar com uma API real no futuro?**
R: Sim! Os dados mockados estão isolados em `src/services/api.js`. Quando a API real estiver pronta, basta substituir as funções mock por chamadas HTTP reais usando `fetch()`. A interface dos componentes não precisa mudar.

**P: Qual é a senha do login?**
R: Qualquer email e senha funcionam no login mockado. Exemplo: `admin@test.com` / `senha123`. Os dados são carregados de `mockData.js`.

---

## ⚙️ CONFIGURAÇÃO - Variáveis de Ambiente

Para futuro uso com API real, você pode configurar variáveis de ambiente.

### Crie um arquivo `.env` na raiz do projeto:

```
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Tuctuc Admin
```

### Use em qualquer arquivo:

```javascript
const API_URL = import.meta.env.VITE_API_URL;
console.log(API_URL); // http://localhost:3000/api
```

---

## 🐛 DEBUG E SOLUÇÃO DE PROBLEMAS

### Como verificar erros?

1. **Console do navegador (F12)**
   - Pressione `F12` → Aba "Console"
   - Todos os erros aparecerão em vermelho
   - Use `console.log()` para debugar

2. **Terminal do desenvolvimento**
   - Erros de build aparecem no terminal onde rodou `npm run dev`
   - Mensagens de Vite e warnings aparecem lá

3. **Network tab (F12)**
   - Vá em "Network" para ver requisições (quando integrar com API real)
   - Mostra status, tempo de resposta, etc

### Dicas de Debug:

```javascript
// Adicione ao seu código temporariamente:
console.log("Dados recebidos:", data);
console.log("Usuário atual:", user);
console.log("URL atual:", window.location.pathname);

// Remova após debugar!
```

---

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Acessar
# http://localhost:5173/
```

---

## 🎯 BOAS PRÁTICAS DE DESENVOLVIMENTO

### ✅ Recomendações

1. **Use nomes descritivos**
   - ✅ `handleUserDelete()`
   - ❌ `delete()`

2. **Isole os estilos com CSS Modules**

   ```javascript
   import styles from "./MyComponent.module.css";
   return <div className={styles.title}>...</div>;
   ```

3. **Use componentes reutilizáveis**
   - Se uma coisa se repete em 2+ lugares, crie um componente

4. **Mantenha componentes pequenos**
   - Se um arquivo ultrapassar 300 linhas, divida em componentes menores

5. **Documente funções importantes**
   ```javascript
   // Aplica penalidade ao usuário com validação
   function applyPenalty(userId, penalty) {
     // ...
   }
   ```

---

## 🔗 INTEGRAÇÃO COM API REAL - Próximos Passos

Quando o backend estiver pronto, siga estes passos para integrar:

### 1. Atualize `src/services/api.js`

Substitua as funções mock por chamadas HTTP reais:

```javascript
// Antes (mock):
export async function getUsers() {
  await delay(300);
  return apiUsersData;
}

// Depois (API real):
export async function getUsers() {
  const response = await fetch("http://seu-backend.com/api/users");
  return response.json();
}
```

### 2. Atualize URLs de backend

Em `src/services/api.js`, há uma constante `API_BASE_URL` que pode ser configurada:

```javascript
// Mude para sua URL de backend
const API_BASE_URL = "http://localhost:3000/api";
```

### 3. A interface não precisa mudar!

Como todos os componentes usam `api.js`, eles continuarão funcionando com a API real sem modificações.

---

## 📦 DEPENDÊNCIAS DO PROJETO

Este projeto usa:

- **React 18** - Framework UI
- **React Router DOM** - Roteamento de páginas
- **Vite** - Build tool e dev server
- **Lucide React** - Ícones SVG
- **CSS Modules** - Estilos isolados
- **Socket.io-client** - WebSocket para chat de suporte em tempo real

---

## 📚 REFERÊNCIAS E LINKS ÚTEIS

- [Documentação React](https://react.dev)
- [React Router](https://reactrouter.com)
- [Vite](https://vitejs.dev)
- [Lucide Icons](https://lucide.dev) - Ícones usados no projeto
- [MDN Web Docs](https://developer.mozilla.org) - Referência de JavaScript/CSS

---

## ✨ Estado do Projeto

- ✅ Sistema de login (integrado com API real — JWT + refresh token)
- ✅ Dashboard com métricas
- ✅ CRUD de usuários
- ✅ Sistema de penalidades
- ✅ Gestão de caronas
- ✅ Sugestões (Dev) e Denúncias (Admin)
- ✅ Notificações em tempo real (Socket.io `/notificacoes`)
- ✅ Auditoria
- ✅ Chat de suporte Admin ↔ Dev em tempo real (Socket.io `/suporte`) — v30
- ✅ Responsividade (mobile/tablet/desktop)
- ✅ Integração com API real (concluída)

---

**Desenvolvido com React + Vite + React Router DOM + Lucide React + Socket.io-client**

Versão: 1.1 | Último update: Junho 2026
