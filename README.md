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
site para icones: https://tabler.io/icons
utilizar para semelhança com o Mobile
```
web-test/
├── src/                          ← Pasta principal (onde todo seu código fica)
│   ├── global.css                ← As "cores e estilos padrão" de todo o app
│   ├── main.jsx                  ← Arquivo que INICIA tudo
│   ├── App.jsx                   ← Arquivo que CONTROLA as rotas/páginas
│   │
│   ├── data/
│   │   └── mockData.js           ← "Banco de dados falso" (dados que aparecem nas telas)
│   │
│   ├── components/               ← "Blocos de construção" reutilizáveis
│   │   ├── Aside.jsx             ← A barra lateral (menu esquerdo)
│   │   ├── Aside.module.css      ← Estilos da barra lateral
│   │   ├── Topbar.jsx            ← A barra superior (header)
│   │   ├── Topbar.module.css     ← Estilos do header
│   │   ├── StatusBadge.jsx       ← Rótulos coloridos (Ativo, Inativo)
│   │   ├── StatusBadge.module.css
│   │   ├── FeedbackCard.jsx      ← Card de sugestão/denúncia
│   │   ├── FeedbackCard.module.css
│   │   ├── PenaltyModal.jsx      ← Modal para aplicar penalidades
│   │   ├── PenaltyModal.module.css
│   │   ├── UserActionsMenu.jsx   ← Menu dropdown de ações do usuário
│   │   └── UserActionsMenu.module.css
│   │
│   ├── layouts/                  ← "Modelos de página" (estrutura base)
│   │   ├── AdminLayout.jsx       ← Layout com sidebar + heade
│   │   ├── AdminLayout.module.css
│   │   ├── DesenLayout.jsx       ← Layout alternativo de desenvolvimento
│   │   ├── DesenLayout.module.css
│   │   ├── PublicLayout.jsx      ← Layout sem sidebar (só para login)
│   │   └── PublicLayout.module.css
│   │
│   ├── pages/                    ← As páginas reais que o usuário vê
│   │   ├── Login.jsx             ← Página de login
│   │   ├── Dashboard.jsx         ← Página inicial
│   │   ├── Usuarios.jsx          ← Lista de usuários
│   │   ├── Caronas.jsx           ← Registros de carona
│   │   ├── Sugestoes.jsx         ← Sugestões/denúncias
│   │   ├── Relatorios.jsx        ← Relatórios
│   │   ├── Cadastrar.jsx         ← Cadastro de usuário
│   │   ├── Contratos.jsx         ← Contratos
│   │   ├── Notificacoes.jsx      ← Emissão de notificações
│   │   ├── Auditoria.jsx         ← Log de ações
│   │   └── Penalidades.jsx       ← Aplicação de penalidades
│   │
│   └── router/
│       └── routes.jsx             ← "Mapa de rotas" (URLs)
│
├── public/                       ← Pasta para imagens, logos, etc
├── package.json                  ← Dependências do projeto
├── vite.config.js                ← Configuração do servidor
└── index.html                    ← Arquivo HTML principal
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
1. Login.jsx redireciona para "/dashboard"
   ↓
2. App.jsx vê que a URL é "/dashboard"
   ↓
3. Mostra AdminLayout.jsx (que tem Aside + Topbar)
   ↓
4. AdminLayout coloca Dashboard.jsx no meio
   ↓
5. Dashboard.jsx pega dados de mockData.js e mostra na tela
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
- **Reutilizado em:** Dashboard.jsx e Sugestoes.jsx

#### ✅ **PenaltyModal.jsx** - Modal de penalidades
- **O que é:** Modal para aplicar penalidades a usuários
- **Funcionalidades:**
  - Tipos de penalidade:
    - Impedimento de oferecer caronas
    - Impedimento de solicitar caronas
    - Impedimento de oferecer e solicitar caronas
    - Suspensão de conta
  - Duração configurável (1 semana a 6 meses)
  - Campo de motivo para documentação
- **Reutilizado em:** Usuarios.jsx, Penalidades.jsx

#### ✅ **UserActionsMenu.jsx** - Menu de ações do usuário
- **O que é:** Menu dropdown com ações disponíveis para um usuário
- **Ações incluídas:**
  - Visualizar detalhes
  - Editar
  - Aplicar penalidade
  - Deletar
- **Reutilizado em:** Usuarios.jsx, Caronas.jsx

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

| Página | URL | Descrição |
|--------|-----|-----------|
| **Login.jsx** | `/` | Tela de login |
| **Dashboard.jsx** | `/dashboard` | Tela inicial com métricas |
| **Usuarios.jsx** | `/usuarios` | Lista de usuários |
| **Cadastrar.jsx** | `/cadastrar` | Cadastro de usuário |
| **Caronas.jsx** | `/caronas` | Registros de carona |
| **Sugestoes.jsx** | `/sugestoes` | Sugestões e denúncias |
| **Relatorios.jsx** | `/relatorios` | Página de relatórios |
| **Contratos.jsx** | `/contratos` | Contratos/termos |
| **Notificacoes.jsx** | `/notificacoes` | Envio de notificações |
| **Auditoria.jsx** | `/auditoria` | Log de ações |
| **Penalidades.jsx** | `/penalidades` | Aplicação de penalidades a usuários |

---

## 🎨 CORES E ESTILOS (src/global.css)

Este arquivo tem as **cores padrão** de todo o app.

```css
--color-green-700: #4e8726   ← Verde principal (botões)
--color-green-100: #e9f5df  ← Verde claro (fundos)
--surface-page: #ececec     ← Cor de fundo
--text-primary: #171717     ← Cor do texto
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
{ path: '/dashboard', element: <Dashboard /> }  // URL "/dashboard" mostra Dashboard
{ path: '/usuarios', element: <Usuarios /> }    // URL "/usuarios" mostra Usuarios
```

**Como adicionar uma página nova?**

1. Crie o arquivo da página: `src/pages/MinhaPage.jsx`
2. Importe em `routes.jsx`:
   ```javascript
   import { MinhaPage } from '../pages/MinhaPage';
   ```
3. Adicione a rota:
   ```javascript
   { path: '/minha-pagina', element: <MinhaPage /> }
   ```

---

## 📋 CSS MODULES - Os estilos

Cada página `.jsx` tem um arquivo `.module.css` correspondente.

**Exemplo:**
- `Dashboard.jsx` ← componente React
- `Dashboard.module.css` ← estilos

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
     telefone: ''  // ← novo
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
    font-size: 18px;  /* menor em celular */
  }
}
```

Se algo ficar ruim em celular, ajuste essas linhas.

---

## ❓ DÚVIDAS FREQUENTES

**P: Onde mudo o texto "Tuctuc"?**
R: Em `src/components/Aside.jsx`, procure por `<span>Tuctuc</span>`.

**P: Como adiciono mais um feedback no dashboard?**
R: Vá em `src/data/mockData.js`, procure `feedbacksData` e adicione um novo objeto.

**P: Onde vejo os erros se algo quebrar?**
R: No console do navegador (F12 → Aba Console) ou no terminal onde rodou `npm run dev`.

---

## 🚀 Começando

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Acessar
# http://localhost:5173/
```

---

**Desenvolvido com React + Vite + React Router DOM + Lucide React**
