# 3.3. Análise do Sistema (Painel de Gestão Web)

Nesta seção, explicamos como o **Painel de Gestão Web** funciona na prática e quais decisões técnicas foram tomadas para construí-lo. Diferente do aplicativo móvel — voltado aos alunos — o painel é a ferramenta administrativa da plataforma de caronas da Escola Prof. Massuyuki Kawano, usada por administradores e desenvolvedores. Mostraremos o problema que o painel resolve, suas funções, a estrutura do sistema (arquitetura) e o motivo da escolha de cada ferramenta de programação.

## 3.3.1. Identificação do Problema ou Necessidade

O aplicativo móvel de caronas gera, no dia a dia, um grande volume de informações que precisam ser acompanhadas e moderadas: novos cadastros de alunos, caronas publicadas, denúncias de comportamento inadequado, sugestões de melhoria e dados de cada instituição parceira. Sem uma ferramenta própria de administração, a única forma de acompanhar e corrigir esses dados seria o acesso direto ao banco de dados — algo tecnicamente arriscado, sujeito a erros e inviável para um administrador que não programa.

Além disso, a plataforma atende **mais de uma instituição de ensino** ao mesmo tempo. Era preciso garantir que o administrador de uma escola só enxergasse os dados da própria instituição, enquanto a equipe de desenvolvimento mantivesse uma visão geral de toda a plataforma.

O **Painel de Gestão Web** resolve esse problema oferecendo uma interface segura, organizada e separada por níveis de acesso. Por meio dele, o administrador acompanha métricas, gerencia usuários, aplica penalidades a infratores, responde a denúncias e sugestões, acompanha as caronas e emite relatórios — tudo sem precisar de conhecimento técnico de banco de dados e sempre dentro do escopo permitido ao seu perfil.

## 3.3.2. Descrição das Funcionalidades Esperadas

O painel foi pensado para ser seguro e fácil de operar. O acesso é restrito a dois perfis — **Administrador** (de uma instituição) e **Desenvolvedor** (visão global da plataforma) — e o que cada um pode ver e fazer é controlado automaticamente pelo sistema. A Tabela 1 lista e explica as principais funções:

**Tabela 1 – Lista de Funções do Painel Web e Como Funcionam**

| Funcionalidade                       | Como funciona na prática                                                                                                                                                                                                                                         |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login Seguro com JWT                 | O administrador entra com e-mail e senha; o sistema mantém a sessão ativa de forma segura e renova o acesso automaticamente, sem exigir login a cada ação. Usuários comuns (alunos) são bloqueados — só perfis Administrador e Desenvolvedor entram no painel.   |
| Recuperação de Senha                 | Permite redefinir a senha de acesso por meio de um código numérico temporário (OTP) enviado ao e-mail, em quatro etapas (e-mail → código → nova senha → confirmação).                                                                                            |
| Controle de Acesso por Perfil (RBAC) | O sistema reconhece o perfil do usuário e libera apenas as telas e os dados permitidos: o Administrador vê só a própria instituição; o Desenvolvedor vê tudo e tem telas exclusivas (Instituições, Auditoria, Suporte).                                          |
| Painel de Métricas (Dashboard)       | Tela inicial com os números da plataforma (total de usuários, caronas, pendências), um gráfico de caronas por dia da semana e os feedbacks (sugestões/denúncias) mais recentes.                                                                                  |
| Gestão de Usuários                   | Lista os usuários cadastrados com busca por nome ou e-mail; permite visualizar e editar os dados de cada um e consultar o status da conta.                                                                                                                       |
| Sistema de Penalidades               | Permite aplicar restrições a usuários que descumprem as regras: impedir de oferecer caronas, de solicitar, ambos, ou suspender a conta (bloqueando o login). As restrições podem ser temporárias ou permanentes e refletem imediatamente no aplicativo do aluno. |
| Acompanhamento de Caronas            | Exibe todas as caronas em formato lista-detalhe, com filtros por situação (Aberta, Em espera, Finalizada, Cancelada) e os dados completos de cada viagem (origem, destino, motorista, passageiros e veículo).                                                    |
| Moderação de Sugestões e Denúncias   | Centraliza os feedbacks enviados pelo app. O administrador pode responder ao usuário, mudar o andamento (Pendente → Em análise → Resolvido), arquivar e, no caso do Desenvolvedor, excluir definitivamente.                                                      |
| Geração de Relatórios                | Exporta dados da plataforma (caronas, usuários, penalidades e atividade) nos formatos CSV e PDF, com filtros por período e instituição.                                                                                                                          |
| Gestão de Instituições e Cursos      | Exclusivo do Desenvolvedor: cadastra novas instituições parceiras, registra seus cursos e administra os dados de cada escola.                                                                                                                                    |
| Gestão de Contratos                  | Acompanha a vigência dos contratos das instituições (datas, duração, dias restantes), permite renová-los e gerenciar os administradores de cada escola.                                                                                                          |
| Auditoria                            | Exclusivo do Desenvolvedor: registra e exibe o histórico de ações realizadas, separando o que veio do painel administrativo do que veio do aplicativo, com exportação em CSV e PDF.                                                                              |
| Chat de Suporte em Tempo Real        | Canal de comunicação direto entre o administrador da escola e a equipe de desenvolvimento, com mensagens entregues instantaneamente.                                                                                                                             |

## 3.3.3. Arquitetura do Sistema

O painel segue o modelo **Cliente-Servidor**: ele é uma aplicação que roda no navegador e conversa com o mesmo servidor (backend) e o mesmo banco de dados usados pelo aplicativo móvel. As partes que conversam entre si são:

- **Frontend (Painel Web):** é a parte visual que o administrador acessa pelo navegador, sem instalar nada. Construído como uma _Single Page Application_ (SPA), ele exibe as telas, tabelas, gráficos e formulários e organiza tudo conforme o perfil do usuário. Comunica-se com o servidor por requisições REST e, no caso do suporte, por uma conexão em tempo real (WebSocket).
- **Backend (Servidor):** é o "cérebro" do sistema (o mesmo do aplicativo). Confere a segurança e o perfil de quem acessa, aplica as regras de negócio, filtra os dados por instituição e devolve apenas o que aquele usuário pode ver.
- **Banco de Dados:** é onde ficam guardadas todas as informações da plataforma de forma organizada e protegida — usuários, caronas, penalidades, denúncias, instituições, contratos e os registros de auditoria.

Por ser apenas a camada de apresentação, o painel **não armazena dados próprios**: tudo que ele exibe vem do servidor, e toda alteração que ele faz é validada novamente pelo backend antes de ser salva. Isso garante que a regra de "cada administrador só enxerga a própria escola" seja cumprida no servidor, e não apenas escondida na tela.

## 3.3.4. Justificativa Técnica das Tecnologias Utilizadas

Para o painel foram escolhidas ferramentas modernas, gratuitas (código aberto) e amplamente utilizadas no mercado, mantendo coerência com o aplicativo (ambos usam a linguagem JavaScript e o mesmo servidor). A Tabela 2 justifica a escolha de cada uma:

**Tabela 2 – Ferramentas Utilizadas no Painel Web e os Motivos da Escolha**

| Tecnologia / Biblioteca         | Por que foi escolhida?                                                                                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React                           | Biblioteca para construir interfaces web em "componentes" reaproveitáveis (botões, tabelas, cartões), o que organiza o código e acelera o desenvolvimento das telas. |
| Vite                            | Ferramenta que monta e executa o projeto com altíssima velocidade durante o desenvolvimento e gera uma versão otimizada para publicação.                             |
| React Router                    | Controla a navegação entre as telas do painel (Painel, Usuários, Caronas, etc.) sem recarregar a página, e protege as rotas conforme o perfil do usuário.            |
| Socket.io (cliente)             | Permite o chat de suporte em tempo real: as mensagens entre administrador e desenvolvedor chegam instantaneamente, sem precisar atualizar a página.                  |
| JWT (JSON Web Tokens)           | Sistema de segurança que mantém o administrador logado de forma segura por vários dias e identifica seu perfil (Administrador ou Desenvolvedor) a cada requisição.   |
| Recharts                        | Biblioteca de gráficos usada para exibir, de forma visual, as métricas do painel (como o gráfico de caronas por dia da semana).                                      |
| jsPDF + AutoTable               | Geram os relatórios e os logs de auditoria em PDF diretamente no navegador, já formatados em tabelas, prontos para impressão ou arquivamento.                        |
| Nominatim (OpenStreetMap)       | Serviço de mapas gratuito usado no cadastro de instituições para transformar o endereço digitado em sugestões e coordenadas geográficas.                             |
| Tabler Icons                    | Conjunto de ícones gratuitos e padronizados que dão identidade visual consistente a todos os botões e menus.                                                         |
| CSS Modules                     | Técnica de estilização que isola o visual de cada tela, evitando que o estilo de uma página interfira em outra.                                                      |
| VSCode, GitHub, Figma e Draw.io | Programas de apoio usados pela equipe para escrever o código, versioná-lo em conjunto, desenhar o protótipo das telas e criar os diagramas (DFD e MER) do projeto.   |

## 3.3.5. Fluxo de Funcionamento do Sistema

Para entender como os dados correm dentro do painel (o que ajuda a desenhar os fluxogramas no _draw.io_), destacam-se quatro caminhos principais:

**A. Fluxo de Acesso (Login e Perfil):**
O administrador digita e-mail e senha → o servidor confere as credenciais e devolve a chave de acesso (JWT) → o painel verifica o perfil do usuário: se for aluno comum, o acesso é negado; se for Administrador ou Desenvolvedor, libera as telas correspondentes → o Administrador passa a ver apenas os dados da própria instituição.

**B. Fluxo de Moderação (Denúncia e Penalidade):**
Um aluno envia uma denúncia pelo app → ela aparece no painel para o administrador → o administrador analisa, responde ao usuário e, se necessário, abre o painel de penalidades → escolhe o tipo de restrição e a duração → o servidor registra a penalidade e avisa o aplicativo do aluno em tempo real, bloqueando a ação correspondente.

**C. Fluxo de Relatórios:**
O administrador escolhe o tipo de relatório e aplica filtros de período e instituição → o painel solicita os dados ao servidor → os dados são montados em uma tabela e exportados como arquivo CSV ou PDF, baixado diretamente no computador do administrador.

**D. Fluxo do Suporte em Tempo Real:**
O administrador abre o chat de suporte e envia uma mensagem → o servidor salva a mensagem e a entrega instantaneamente, por uma conexão direta (WebSocket), ao desenvolvedor → o desenvolvedor responde pela tela de Suporte → a resposta aparece na hora para o administrador, sem recarregar a página.
