# 6. MATERIAIS E MÉTODOS (Painel de Gestão Web)

Neste capítulo, são apresentados os materiais, as ferramentas e o caminho prático (metodologia) utilizados para transformar a ideia do **Painel de Gestão Web** em realidade. Enquanto o aplicativo móvel atende os alunos, o painel é a ferramenta de administração da plataforma de caronas — usada por administradores das instituições e pela equipe de desenvolvimento. A jornada é descrita desde a identificação da necessidade até os testes finais, destacando como o aprendizado construído nas disciplinas do curso técnico deu suporte a cada etapa.

## 6.1. Descrição das Etapas de Desenvolvimento

O painel foi conduzido por meio de uma abordagem de pesquisa aplicada e desenvolvimento tecnológico, dividida em cinco etapas principais.

### 6.1.1. Identificação da Necessidade (Pesquisa Inicial)

A necessidade do painel nasceu da própria construção do aplicativo de caronas. Percebeu-se que, à medida que os alunos se cadastrassem e publicassem caronas, surgiria um volume de informações (usuários, denúncias, sugestões, contratos das escolas) que precisaria ser acompanhado e moderado por alguém — e que fazer isso direto no banco de dados seria inviável e inseguro para um administrador sem formação técnica.

Para definir o que o painel deveria oferecer, a equipe levantou, junto às regras do aplicativo, todas as situações que exigiriam intervenção administrativa: aprovar/bloquear usuários, responder denúncias, aplicar penalidades a infratores, acompanhar as caronas e gerar relatórios. Confirmou-se também a necessidade de **separar os acessos por instituição**, já que a plataforma atende mais de uma escola ao mesmo tempo.

### 6.1.2. Análise de Painéis Administrativos Semelhantes (Benchmarking)

Antes de desenhar o painel, a equipe analisou painéis administrativos e ferramentas de gestão já consolidados no mercado, observando boas práticas de organização de **métricas em cartões**, **tabelas com busca e filtros**, **layouts do tipo lista-detalhe** e **níveis de permissão de acesso (perfis)**. O objetivo foi aproveitar padrões já conhecidos pelos usuários (que tornam a navegação intuitiva) e adaptá-los à realidade escolar — em especial a necessidade de cada administrador enxergar apenas a própria instituição e de a equipe de desenvolvimento ter uma visão global.

### 6.1.3. Desenvolvimento da Documentação Técnica

Com os requisitos definidos, iniciou-se a fase de planejamento estrutural, resultando nos seguintes artefatos (compartilhados com o aplicativo, por usarem o mesmo servidor e banco de dados):

- **Análise do Sistema:** mapeamento das regras de negócio e das restrições de acesso por perfil (Administrador e Desenvolvedor).
- **Modelo Entidade-Relacionamento (MER):** desenho da estrutura do banco de dados, mostrando como as tabelas de Usuários, Caronas, Penalidades, Instituições e Contratos se conectam.
- **Diagrama de Fluxo de Dados (DFD):** desenho técnico que mostra por onde as informações passam, desde o clique do administrador no painel até a resposta do servidor.
- **Dicionário de Dados (DD):** documento que especifica o tipo e o tamanho de cada campo salvo no banco (por exemplo, o formato da placa de um veículo).
- **Termos de Uso e Política de Privacidade do Painel:** texto jurídico e administrativo próprio do painel, alinhado à Lei Geral de Proteção de Dados (LGPD), que define as responsabilidades de quem acessa dados de terceiros (os usuários do aplicativo) por meio da ferramenta.

### 6.1.4. Desenvolvimento do Painel Web

A fase de construção prática concentrou-se no **Frontend Web**: o desenho e a programação das telas do painel com a biblioteca **React**, usando a ferramenta **Vite** para montar e executar o projeto. O painel foi programado para consumir o mesmo **Backend** (servidor em Node.js) e o mesmo **Banco de Dados** (MySQL) já utilizados pelo aplicativo móvel — ou seja, ele não tem servidor próprio, e sim conversa com a API existente.

Para que o painel pudesse ser avaliado antes do lançamento, a equipe utilizou registros fictícios já cadastrados no banco (usuários, caronas, denúncias e instituições) para simular o dia a dia de administração e validar cada tela na prática.

### 6.1.5. Testes e Validação

Na fase final, foram realizados **testes de funcionamento** (se os menus e botões abriam as telas corretas e exibiam os dados certos), **testes de integração** (se o chat de suporte entregava a mensagem em tempo real e se os relatórios eram gerados corretamente em CSV e PDF) e **testes de segurança e permissão** (se o sistema bloqueava o login de um aluno comum, se o administrador via apenas a própria instituição e se a sessão expirava corretamente quando o acesso perdia a validade).

## 6.2. Especificações Técnicas das Ferramentas Utilizadas

Abaixo são descritas as principais ferramentas de software que serviram de suporte ao desenvolvimento do painel, acompanhadas de suas respectivas fundamentações teóricas.

### 6.2.1. Visual Studio Code (VSCode)

O VSCode foi utilizado no desenvolvimento do código das telas com a linguagem JavaScript e a biblioteca React, bem como na integração com o servidor em Node.js.

> "A Microsoft lançou em 2015 um editor de código destinado ao desenvolvimento de aplicações web chamado Visual Studio Code [...]. Trata-se de uma ferramenta leve e multiplataforma que está disponível para Windows, Mac OS e Linux, sendo executada nativamente em cada plataforma." (MACORATTI, 2016)

### 6.2.2. React e Vite

Para a construção da interface do painel (aplicação web), utilizou-se a biblioteca **React** em conjunto com a ferramenta de build **Vite**. Essa combinação permitiu construir uma aplicação de página única (SPA) rápida e organizada em componentes reaproveitáveis, executada diretamente no navegador, sem instalação.

> Segundo a documentação oficial do React (2024), "O React permite criar interfaces de usuário a partir de peças individuais chamadas componentes", facilitando o reaproveitamento de código e a manutenção das telas.

> A documentação do Vite (2024) descreve a ferramenta como "uma ferramenta de build que visa proporcionar uma experiência de desenvolvimento mais rápida e enxuta para projetos web modernos".

### 6.2.3. Node.js e Express

O painel consome o mesmo Backend do aplicativo, construído com **Node.js** e **Express**. Essa plataforma foi escolhida por sua alta velocidade e eficiência no gerenciamento de múltiplas conexões simultâneas — incluindo as do chat de suporte em tempo real.

> "O Node.js pode ser definido como um ambiente de execução para JavaScript do lado do servidor (server-side), construído sobre o motor de processamento JavaScript V8 do Google Chrome." (SILVA, 2018)

### 6.2.4. MySQL e MySQL Workbench

As informações exibidas e administradas pelo painel ficam armazenadas no banco de dados relacional **MySQL** (o mesmo do aplicativo). O **MySQL Workbench** funcionou como ferramenta visual para criar e monitorar as tabelas.

> "O MySQL é um sistema de gerenciamento de banco de dados relacional (SGBDR) que utiliza a linguagem SQL como interface. É um dos bancos de dados mais populares do mundo devido ao seu alto desempenho, confiabilidade e facilidade de uso." (ORACLE, 2023)

### 6.2.5. Figma e Draw.io

O **Figma** foi utilizado para desenhar o protótipo visual das telas do painel antes da programação, enquanto o **Draw.io** foi a ferramenta escolhida para a criação dos diagramas de fluxo de dados (DFD) e modelagem de dados (MER).

> "O Figma é uma ferramenta de design baseada em nuvem e colaborativa, ideal para a criação de interfaces de usuário (UI) e protótipos rápidos." (FIGMA, 2024)

## 6.3. Relação do Projeto com as Disciplinas do Curso Técnico

O desenvolvimento do painel de gestão só foi possível graças à integração dos conhecimentos adquiridos nas disciplinas ministradas ao longo dos módulos do curso técnico. A Tabela 3 correlaciona as etapas de trabalho com as matérias do curso:

**Tabela 3 – Correlação entre as Etapas do Projeto e as Disciplinas do Curso**

| Fase do Projeto        | Atividade Prática                                                                                             | Disciplinas Relacionadas (Suporte Teórico)                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Planejamento e Ideia   | Levantamento das necessidades de administração e definição das regras de acesso por perfil.                   | Lógica de Programação (1º Ano) e _Ética e Cidadania Organizacional_ (2º Ano).     |
| Documentação Técnica   | Criação de diagramas de fluxo (DFD), regras de negócio e dicionário de dados.                                 | Análise e Projeto de Sistemas / _Engenharia de Software_ (1º e 2º Ano).           |
| Modelagem de Dados     | Desenho do MER e planejamento de como as tabelas de dados conversam entre si.                                 | Banco de Dados I (1º Ano) e _Banco de Dados II_ (2º Ano).                         |
| Consumo do Banco       | Leitura e atualização dos dados via API e criação de registros de teste.                                      | Banco de Dados II (2º Ano).                                                       |
| Criação das Telas      | Design das interfaces no Figma e programação visual do painel com React/Vite no VSCode.                       | Design Digital / _Programação Web I_ (1º Ano) e _Programação Web II_ (2º/3º Ano). |
| Integração e Segurança | Consumo da API com autenticação (JWT), controle de acesso por perfil (RBAC) e chat em tempo real (Socket.io). | _Programação de Computadores_ (2º Ano) e _Segurança de Sistemas_ (3º Ano).        |
| Testes Finais          | Simulação de bugs, validação das permissões, geração de relatórios e teste do fluxo completo.                 | Qualidade e Teste de Software (3º Ano).                                           |

A união dessas disciplinas permitiu que a equipe não apenas escrevesse códigos, mas compreendesse o ciclo completo de vida de um software profissional: desde a identificação de uma necessidade administrativa, passando pela organização dos dados, pela segurança e pelo controle de acesso, até a entrega de uma ferramenta funcional e segura para a gestão da plataforma escolar.
