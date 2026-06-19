# DFDs do Painel Web Tuctuc — Descrições + arquivo pronto

> Acompanha **`DFD_Tuctuc_Web.drawio`** (na raiz de `tuctuc-web`). Abra em [app.diagrams.net](https://app.diagrams.net) → *File ▸ Open From ▸ Device*.
> Mesmo padrão do app: um mini-DFD por ação, notação **Yourdon** (processo = círculo), estilo **minimalista** (sem losango — validação vira dois fluxos rotulados). Tudo em **português do Brasil**.

---

## Contexto: o painel tem dois papéis

| Papel | Quem é | Escopo |
| --- | --- | --- |
| **Administrador** (`per_tipo = 1`) | Gestor de uma instituição | Só os dados da **própria escola** (o backend filtra pelo JWT) |
| **Desenvolvedor** (`per_tipo = 2`) | Operador da plataforma | **Tudo** (global) |

Cada DFD mostra **quem executa** a ação na entidade (retângulo): "Administrador / Desenvolvedor" quando é compartilhada, ou só "Desenvolvedor" quando é exclusiva.

---

## Lista de DFDs no arquivo (15 abas)

| Aba | DFD | Quem faz | Área |
| --- | --- | --- | --- |
| 0 | Legenda | — | — |
| 1 | Login do Painel | Admin / Dev | Acesso & Visão |
| 2 | Ver Dashboard | Admin / Dev | Acesso & Visão |
| 3 | Gerenciar Usuário (ativar/desativar) | Admin / Dev | Moderação |
| 4 | Aplicar Penalidade | Admin / Dev | Moderação |
| 5 | Remover Penalidade | Admin / Dev | Moderação |
| 6 | Moderar Documento | Admin / Dev | Moderação |
| 7 | Responder Denúncia | Admin / Dev | Moderação |
| 8 | Responder Sugestão | Dev | Moderação |
| 9 | Cadastrar Instituição | Dev | Cadastros |
| 10 | Cadastrar Curso | Dev | Cadastros |
| 11 | Cadastrar Administrador | Dev | Cadastros |
| 12 | Gerenciar Contrato | Dev | Cadastros |
| 13 | Consultar Auditoria | Dev | Auditoria & Suporte |
| 14 | Chat de Suporte (Admin × Dev) | Admin / Dev | Auditoria & Suporte |

> As abas 4 (Aplicar Penalidade) e 7 (Responder Denúncia) também existem no arquivo do app — por opção sua, ficam **nos dois** para cada arquivo ser completo por si.

---

## Descrição de cada DFD (o que está desenhado em cada aba)

> **MAIÚSCULAS** = banco de dados (tabela real). "→" = seta/fluxo.

### 1. Login do Painel — *Acesso & Visão*
**História:** o gestor entra com e-mail e senha; o sistema confere a senha **e o papel** — só libera quem é Admin ou Dev.
- Administrador/Desenvolvedor → **(Validar Acesso)**; lê **USUARIOS** (senha e papel ≥ 1)
- saídas: [Acesso negado (sem permissão)] (papel < 1) · [Painel liberado] (Admin ou Dev)

### 2. Ver Dashboard — *Acesso & Visão*
**História:** o gestor abre o painel e o sistema soma os números para os gráficos.
- Administrador/Desenvolvedor → **(Gerar Estatísticas)**; lê **USUARIOS**, **CARONAS** e **SUGESTOES_DENUNCIAS**
- saída: [Painéis e gráficos] (escopo da escola para Admin; global para Dev)

### 3. Gerenciar Usuário — *Moderação*
**História:** o gestor ativa ou desativa a conta de um usuário.
- Administrador/Desenvolvedor → **(Atualizar Status do Usuário)** → grava em **USUARIOS**
- saídas: [Ação não permitida] (sem permissão) · [Status atualizado]

### 4. Aplicar Penalidade — *Moderação*
**História:** o gestor penaliza um usuário; registra e avisa o usuário.
- Administrador/Desenvolvedor → **(Aplicar Penalidade)** → grava em **PENALIDADES** e avisa via **NOTIFICACOES**
- saídas: [Dados inválidos] · [Penalidade aplicada]

### 5. Remover Penalidade — *Moderação*
**História:** o gestor remove uma penalidade ativa; o usuário é avisado.
- Administrador/Desenvolvedor → **(Remover Penalidade)** → desativa em **PENALIDADES** (`pen_ativo=0`) e avisa via **NOTIFICACOES**
- saída: [Penalidade removida]

### 6. Moderar Documento — *Moderação*
**História:** o gestor revisa um comprovante/CNH e aprova ou reprova.
- Administrador/Desenvolvedor → **(Avaliar Documento)** → atualiza status em **DOCUMENTOS** e avisa via **NOTIFICACOES**
- saídas: [Documento reprovado] (reprovar) · [Documento aprovado] (aprovar)

### 7. Responder Denúncia — *Moderação*
**História:** o gestor responde/fecha uma denúncia e avisa o denunciante.
- Administrador/Desenvolvedor → **(Responder Denúncia)** → atualiza **SUGESTOES_DENUNCIAS** e avisa via **NOTIFICACOES**
- saída: [Denúncia respondida]

### 8. Responder Sugestão — *Moderação (Dev)*
**História:** o desenvolvedor responde e fecha uma sugestão de usuário.
- Desenvolvedor → **(Responder Sugestão)** → grava resposta em **SUGESTOES_DENUNCIAS**
- saídas: [Texto inválido] · [Sugestão respondida]

### 9. Cadastrar Instituição — *Cadastros (Dev)*
**História:** o desenvolvedor cadastra uma escola; o sistema geocodifica e gera as keywords de OCR.
- Desenvolvedor → **(Cadastrar Instituição)** → grava em **ESCOLAS** (geocodifica + keywords OCR)
- saídas: [Dados inválidos] · [Instituição criada]

### 10. Cadastrar Curso — *Cadastros (Dev)*
**História:** o desenvolvedor adiciona um curso a uma instituição.
- Desenvolvedor → **(Cadastrar Curso)** → grava em **CURSOS**
- saídas: [Dados inválidos] · [Curso criado]

### 11. Cadastrar Administrador — *Cadastros (Dev)*
**História:** o desenvolvedor cria a conta do admin de uma instituição (sem fluxo de OTP).
- Desenvolvedor → **(Cadastrar Administrador)** → cria conta em **USUARIOS** (`per_tipo=1`)
- saídas: [Dados inválidos] · [Administrador criado]

### 12. Gerenciar Contrato — *Cadastros (Dev)*
**História:** o desenvolvedor define/renova o contrato de uma escola.
- Desenvolvedor → **(Definir Contrato)** → grava em **ESCOLAS** (início + expiração calculada)
- saídas: [Dados inválidos] · [Contrato definido]

### 13. Consultar Auditoria — *Auditoria & Suporte (Dev)*
**História:** o desenvolvedor consulta os logs de ações sensíveis e pode exportar em CSV.
- Desenvolvedor → **(Consultar Logs)**; lê **AUDIT_LOG**
- saídas: [Lista de logs] (exibir) · [Arquivo CSV] (exportar)

### 14. Chat de Suporte (Admin × Dev) — *Auditoria & Suporte*
**História:** o admin manda mensagem de suporte; o desenvolvedor recebe e responde (tempo real via Socket.io).
- Administrador → **(Enviar Mensagem de Suporte)** → grava em **MENSAGENS_SUPORTE** → "mensagem entregue" → Desenvolvedor
- saída de erro: [Falha no envio] (texto inválido)

---

## Como abrir / exportar
- Abrir: app.diagrams.net → *File ▸ Open From ▸ Device* → `DFD_Tuctuc_Web.drawio` (abas na barra inferior).
- Exportar pro TCC: *File ▸ Export as ▸ PNG*, **Zoom 200%**; no Word, legenda **"Figura X – <nome> (DFD)"** + **"Fonte: Autoria própria"**.

> O gerador está em `scripts_gen_dfd_web.py` — para recriar/ajustar tudo: `python scripts_gen_dfd_web.py`.
