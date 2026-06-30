-- =====================================================
-- Arquivo: insert_tupa.sql
-- Descrição: Seed COMPLETO e LIMPO, focado em Tupã/SP (usuários + caronas + interações).
--            Arquivo único — rodar após create.sql.
--
-- Características:
--   1. IDs sequenciais LIMPOS, sem lacunas.
--   2. SEM contas-placeholder: todo usuário tem usu_nome e usu_endereco.
--   3. 2 instituições REAIS de Tupã (UNESP, UNIFADAP) — endereços/CEPs verificados.
--   4. COORDENADAS REAIS geocodificadas via OSM (street-level) — cada rua confirmada em Tupã.
--   5. 1 Dev (dev@tuctuc.com.br) + 1 admin por instituição (UNESP e UNIFADAP).
--   6. 31 usuários, 16 caronas, interações completas.
--
-- Bairros usados (todos reais, com CEP e lat/lon confirmados):
--   Centro, Jardim Apoema, Jardim Paulista, Vila Lahoz, Jardim Santo Antônio, Jardim Itaipu.
--
-- Cursos reais por instituição:
--   UNESP Tupã (FCE): Administração, Engenharia de Biossistemas
--   UNIFADAP: Direito, Biomedicina, Engenharia Civil, Fisioterapia
--
-- CASOS DE BORDA cobertos:
--   - Penalizado tipo 1 (não oferece) e tipo 2 (não solicita)
--   - CONTA SUSPENSA (verif=9 + penalidade tipo 4 — login bloqueado)
--   - EXCLUSÃO AGENDADA LGPD (usu_exclusao_agendada)
--   - Preferências de perfil variadas (per_raio_busca, per_push_notif, per_notif_tipos)
--   - SUPORTE_MENSAGENS (chat Admin↔Dev)
--
-- LEGENDA DE STATUS (referência rápida):
--   USUARIOS.usu_verificacao  0=aguarda OTP, 1=matrícula, 2=matrícula+veículo,
--                             5=temp s/ veículo (+5d), 6=temp c/ veículo (+5d), 9=suspenso
--   PERFIL.per_tipo           0=Usuário, 1=Administrador (escopo escola), 2=Desenvolvedor
--   VEICULOS.vei_tipo         0=Moto (máx 1 vaga), 1=Carro (1-4 vagas)
--   CARONAS.car_status        0=Cancelada, 1=Aberta, 2=Em espera, 3=Finalizada
--   PONTO_ENCONTROS.pon_tipo  0=Partida, 1=Destino   pon_status 1=Ativo, 0=Inativo
--   PENALIDADES.pen_tipo      1=Não oferece, 2=Não solicita, 3=Ambos, 4=Conta suspensa
--   SOLICITACOES.sol_status   0=Cancelado, 1=Enviado, 2=Aceito, 3=Negado
--   CARONA_PESSOAS.car_pes_status 1=Aceito, 2=Negado, 0=Cancelado
--   MENSAGENS.men_status      0=Falha, 1=Enviada, 2=Não lida, 3=Lida
--   DOCUMENTOS.doc_status     0=aprovado_ocr, 1=pendente, 2=reprovado_ocr
--   DENUNCIAS.den_tipo        0=carona (car_id), 1=usuário (den_usu_alvo)
--   DENUNCIAS.den_status      0=Fechado, 1=Aberto, 3=Em análise, 2=Arquivado   AVALIACOES.ava_nota 1..5
--
-- REGRAS DE NEGÓCIO RESPEITADAS:
--   REGRA 1: ninguém solicita a própria carona.
--   REGRA 2: motorista com carona ativa (1/2) não solicita como passageiro.
--            → Marcelo (u16, penalidade tipo 1) NÃO oferece, mas PODE solicitar → é passageiro.
--            → Renata (u17, penalidade tipo 2) e Otávio (u18, suspenso) NÃO solicitam.
--   REGRA 3: cada passageiro tem no máx. 1 aceite (sol=2) em carona ATIVA (passadas não contam).
--   Moto (vei_tipo=0): capacidade 1 vaga. car_vagas_dispo = capacidade − aceitos.
--
-- Senhas (bcrypt custo 12): dev@tuctuc.com.br → Dev@1234 | gestor.* → Admin@123 | demais → Senha@123
-- =====================================================

USE bd_tcc_des_125_caronas;

SET FOREIGN_KEY_CHECKS = 0;


-- =====================================================
-- 1. ESCOLAS (esc_id 1-2) — instituições reais de Tupã/SP (coords OSM)
-- =====================================================
INSERT INTO ESCOLAS (esc_nome, esc_endereco, esc_dominio, esc_max_usuarios, esc_lat, esc_lon, esc_contrato_duracao, esc_contrato_inicio, esc_contrato_expira, esc_contrato_arquivo, esc_ocr_base, esc_ocr_keywords) VALUES
    ('UNESP Tupã - Faculdade de Ciências e Engenharia', 'Av. Domingos da Costa Lopes, 780, Jardim Itaipu, Tupã - SP, CEP 17602-496', 'unesp.br',        500, -21.9281770, -50.4909540, '5anos', '2026-01-01', '2031-01-01', NULL, NULL, '["unesp","faculdade","ciencias","engenharia","tupa","administracao","biossistemas"]'),                 -- esc_id=1
    ('Centro Universitário da Alta Paulista (UNIFADAP)','Rua Mandaguaris, 1010, Centro, Tupã - SP, CEP 17600-050',                   'unifadap.edu.br', 300, -21.9414830, -50.5144170, '2anos', '2026-01-01', '2028-01-01', NULL, NULL, '["unifadap","fadap","fap","alta","paulista","direito","biomedicina","engenharia","civil","fisioterapia"]');  -- esc_id=2


-- =====================================================
-- 2. CURSOS (cur_id 1-6)
-- =====================================================
INSERT INTO CURSOS (cur_semestre, cur_nome, esc_id) VALUES
    (5, 'Administração',               1),   -- cur_id=1  UNESP
    (7, 'Engenharia de Biossistemas',  1),   -- cur_id=2  UNESP
    (6, 'Direito',                     2),   -- cur_id=3  UNIFADAP
    (4, 'Biomedicina',                 2),   -- cur_id=4  UNIFADAP
    (8, 'Engenharia Civil',            2),   -- cur_id=5  UNIFADAP
    (5, 'Fisioterapia',                2);   -- cur_id=6  UNIFADAP


-- =====================================================
-- 3. USUARIOS (usu_id 1-31)
-- Gestão: 1=Dev, 2=Admin UNESP, 3=Admin UNIFADAP.
-- usu_lat/usu_lon e usu_endereco_geom: coordenadas reais (OSM) da rua de cada um.
-- =====================================================
INSERT INTO USUARIOS (usu_nome, usu_telefone, usu_matricula, usu_senha, usu_verificacao, usu_verificacao_expira, usu_status, usu_email, usu_descricao, usu_endereco, usu_endereco_geom, usu_horario_habitual, usu_lat, usu_lon) VALUES
    -- ── Gestão ───────────────────────────────────────────────────────────────
    ('Dev Tuctuc',      '14991230001', 'DEV2026001', '$2b$12$q3F3dPiovQZcP.Ng5Wvlye/2hVN1p8/0luKbNOYlQYg79hgPNaoqC', 2, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'dev@tuctuc.com.br',          'Desenvolvedor Tuctuc — acesso total.',          'Avenida Tamoios, 100, Centro, Tupã - SP',                   '-21.9281990,-50.5118790', NULL,        -21.9281990, -50.5118790),  -- 1  Dev@1234
    ('Administrador UNESP Tupã','14991230002','ADMUNESP01', '$2b$12$IG1G1Al0Qd/ndqaJgrySNOLrLG69gXpaaCdGDsqRrdTf/H3s0UjTO', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'gestor@unesp.br',            'Administrador da UNESP Tupã.',                  'Av. Domingos da Costa Lopes, 780, Jardim Itaipu, Tupã - SP','-21.9281770,-50.4909540', NULL,        -21.9281770, -50.4909540),  -- 2  Admin@123
    ('Administrador UNIFADAP', '14991230003', 'ADMUNI0001', '$2b$12$IG1G1Al0Qd/ndqaJgrySNOLrLG69gXpaaCdGDsqRrdTf/H3s0UjTO', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'gestor@unifadap.edu.br',     'Administrador da UNIFADAP.',                    'Rua Mandaguaris, 1010, Centro, Tupã - SP',                  '-21.9355210,-50.5195600', NULL,        -21.9355210, -50.5195600),  -- 3  Admin@123

    -- ── Motoristas originais (verif=2) ───────────────────────────────────────
    ('Rafael Almeida',   '14991230004', 'UN2024004', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 2, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'rafael.almeida@unesp.br',          'Vou pra UNESP toda manhã, saio do Centro.',     'Avenida Tamoios, 250, Centro, Tupã - SP',                  '-21.9281990,-50.5118790', '06:40:00', -21.9281990, -50.5118790),  -- 4  UNESP/Adm
    ('Beatriz Lima',     '14991230005', 'UN2024005', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 2, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'beatriz.lima@unesp.br',            'Eng. de Biossistemas, carro com ar.',           'Rua Paulo Dessy Juan, 120, Jardim Apoema, Tupã - SP',      '-21.9341740,-50.4897900', '07:10:00', -21.9341740, -50.4897900),  -- 5  UNESP/Bioss
    ('Bruno Carvalho',   '14991230006', 'UN2024006', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 2, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'bruno.carvalho@unesp.br',          'Saio do Jardim Apoema cedo pra UNESP.',         'Rua Carlos Gomes Pato, 150, Jardim Apoema, Tupã - SP',     '-21.9340830,-50.4891620', '06:55:00', -21.9340830, -50.4891620),  -- 6  UNESP/Bioss (2 vagas)
    ('Larissa Costa',    '14991230007', 'UF2024007', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 2, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'larissa.costa@unifadap.edu.br',    'Direito UNIFADAP, carona pela manhã.',          'Rua Irapuru, 200, Jardim Paulista, Tupã - SP',             '-21.9373340,-50.5261200', '07:40:00', -21.9373340, -50.5261200),  -- 7  UNIFADAP/Direito
    ('Thiago Rocha',     '14991230008', 'UF2024008', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 2, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'thiago.rocha@unifadap.edu.br',     'Eng. Civil, volto à noite.',                    'Avenida Tabajaras, 900, Centro, Tupã - SP',                '-21.9313890,-50.5098510', '18:40:00', -21.9313890, -50.5098510),  -- 8  UNIFADAP/EngCivil
    ('Juliana Dias',     '14991230009', 'UF2024009', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 2, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'juliana.dias@unifadap.edu.br',     'Direito UNIFADAP, carona do Centro.',           'Rua Mandaguaris, 500, Centro, Tupã - SP',                  '-21.9355210,-50.5195600', '07:20:00', -21.9355210, -50.5195600),  -- 9  UNIFADAP/Direito

    -- ── Passageiros originais (verif=1) ──────────────────────────────────────
    ('Felipe Araújo',    '14991230010', 'UN2024012', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'felipe.araujo@unesp.br',           'Procuro carona pro Centro→UNESP.',              'Avenida Tapuias, 410, Centro, Tupã - SP',                  '-21.9360090,-50.5111610', '06:50:00', -21.9360090, -50.5111610),  -- 10 UNESP/Adm
    ('Letícia Barbosa',  '14991230011', 'UN2024013', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'leticia.barbosa@unesp.br',         'Eng. Biossistemas, carona de manhã.',           'Rua Adamantina, 45, Jardim Paulista, Tupã - SP',           '-21.9369110,-50.5268830', '07:15:00', -21.9369110, -50.5268830),  -- 11 UNESP/Bioss
    ('Gabriel Moreira',  '14991230012', 'UN2024014', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'gabriel.moreira@unesp.br',         'Adm UNESP, moro na Vila Lahoz.',                'Rua Dona Palma, 60, Vila Lahoz, Tupã - SP',                '-21.9339030,-50.5043900', '07:05:00', -21.9339030, -50.5043900),  -- 12 UNESP/Adm
    ('Vinícius Gomes',   '14991230013', 'UF2024015', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'vinicius.gomes@unifadap.edu.br',   'Moro no Centro, estudo na UNIFADAP.',           'Rua Bororós, 300, Centro, Tupã - SP',                      '-21.9339050,-50.5170110', '07:30:00', -21.9339050, -50.5170110),  -- 13 UNIFADAP/Direito
    ('Carolina Pinto',   '14991230014', 'UF2024016', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'carolina.pinto@unifadap.edu.br',   'Biomedicina, manhã.',                           'Rua Rio Claro, 90, Jardim Santo Antônio, Tupã - SP',       '-21.9353330,-50.4968560', '07:25:00', -21.9353330, -50.4968560),  -- 14 UNIFADAP/Biomed
    ('Rodrigo Teixeira', '14991230015', 'UF2024017', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'rodrigo.teixeira@unifadap.edu.br', 'Fisioterapia, moro no Centro.',                 'Rua Botocudos, 80, Centro, Tupã - SP',                     '-21.9322950,-50.5199380', '07:35:00', -21.9322950, -50.5199380),  -- 15 UNIFADAP/Fisio

    -- ── Casos de borda ───────────────────────────────────────────────────────
    ('Marcelo Pires',    '14991230016', 'UN2024024', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 2, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'marcelo.pires@unesp.br',           'Motorista penalizado (não pode oferecer).',     'Avenida Tapuias, 800, Centro, Tupã - SP',                  '-21.9360090,-50.5111610', '07:00:00', -21.9360090, -50.5111610),  -- 16 penalidade tipo 1
    ('Renata Fonseca',   '14991230017', 'UF2024025', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'renata.fonseca@unifadap.edu.br',   'Passageira penalizada (não pode solicitar).',   'Rua Parapuã, 95, Jardim Paulista, Tupã - SP',              '-21.9364900,-50.5286650', '07:10:00', -21.9364900, -50.5286650),  -- 17 penalidade tipo 2
    ('Otávio Suspenso',  '14991230018', 'UN2024026', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 9, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'otavio.suspenso@unesp.br',         'Conta suspensa pelo administrador.',            'Avenida Tamoios, 600, Centro, Tupã - SP',                  '-21.9281990,-50.5118790', NULL,        -21.9281990, -50.5118790),  -- 18 CONTA SUSPENSA (verif=9, pen tipo 4)

    -- ── Motoristas novos (verif=2) ───────────────────────────────────────────
    ('Eduardo Ramos',    '14991230019', 'UN2024027', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 2, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'eduardo.ramos@unesp.br',           'Adm UNESP, saio do Jardim Apoema.',             'Rua Paulo Dessy Juan, 300, Jardim Apoema, Tupã - SP',      '-21.9341740,-50.4897900', '06:45:00', -21.9341740, -50.4897900),  -- 19 UNESP/Adm
    ('Fernanda Alves',   '14991230020', 'UF2024028', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 2, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'fernanda.alves@unifadap.edu.br',   'Biomedicina, carona pela manhã.',               'Rua Olímpia, 80, Jardim Santo Antônio, Tupã - SP',         '-21.9344310,-50.4972670', '07:40:00', -21.9344310, -50.4972670),  -- 20 UNIFADAP/Biomed
    ('Sabrina Rocha',    '14991230021', 'UN2024030', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 2, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'sabrina.rocha@unesp.br',           'Biossistemas, carro com 3 lugares.',            'Rua Carlos Gomes Pato, 220, Jardim Apoema, Tupã - SP',     '-21.9340830,-50.4891620', '07:00:00', -21.9340830, -50.4891620),  -- 21 UNESP/Bioss
    ('Diego Martins',    '14991230022', 'UF2024031', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 2, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'diego.martins@unifadap.edu.br',    'Direito UNIFADAP, saio do Centro.',             'Rua Bororós, 410, Centro, Tupã - SP',                      '-21.9339050,-50.5170110', '07:25:00', -21.9339050, -50.5170110),  -- 22 UNIFADAP/Direito

    -- ── Passageiros novos (verif=1) ──────────────────────────────────────────
    ('Lucas Antunes',    '14991230023', 'UN2024033', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'lucas.antunes@unesp.br',           'Adm UNESP, Jardim Santo Antônio.',              'Avenida Centenário, 150, Jardim Santo Antônio, Tupã - SP', '-21.9340430,-50.4981050', '06:55:00', -21.9340430, -50.4981050),  -- 23 UNESP/Adm
    ('Bianca Souza',     '14991230024', 'UF2024034', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'bianca.souza@unifadap.edu.br',     'Fisioterapia, busco carona de manhã.',          'Rua Dona Palma, 200, Vila Lahoz, Tupã - SP',               '-21.9339030,-50.5043900', '07:15:00', -21.9339030, -50.5043900),  -- 24 UNIFADAP/Fisio
    ('Tatiane Melo',     '14991230025', 'UN2024036', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'tatiane.melo@unesp.br',            'Biossistemas, Jardim Apoema.',                  'Rua Paulo Dessy Juan, 75, Jardim Apoema, Tupã - SP',       '-21.9341740,-50.4897900', '07:05:00', -21.9341740, -50.4897900),  -- 25 UNESP/Bioss
    ('Caio Ferraz',      '14991230026', 'UF2024037', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'caio.ferraz@unifadap.edu.br',      'Eng. Civil, moro no Centro.',                   'Rua Coroados, 320, Centro, Tupã - SP',                     '-21.9326220,-50.5168850', '18:50:00', -21.9326220, -50.5168850),  -- 26 UNIFADAP/EngCivil
    ('Yuri Nakamura',    '14991230027', 'UN2024039', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'yuri.nakamura@unesp.br',           'Adm UNESP, Jardim Santo Antônio.',              'Rua Rio Claro, 200, Jardim Santo Antônio, Tupã - SP',      '-21.9353330,-50.4968560', '06:50:00', -21.9353330, -50.4968560),  -- 27 UNESP/Adm
    ('Heloísa Pires',    '14991230028', 'UF2024040', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'heloisa.pires@unifadap.edu.br',    'Direito UNIFADAP.',                             'Rua Junqueirópolis, 110, Jardim Paulista, Tupã - SP',      '-21.9370400,-50.5279850', '07:20:00', -21.9370400, -50.5279850),  -- 28 UNIFADAP/Direito
    ('Gustavo Henrique', '14991230029', 'UF2024042', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'gustavo.henrique@unifadap.edu.br', 'Solicitei exclusão da minha conta.',            'Rua Mandaguaris, 700, Centro, Tupã - SP',                  '-21.9355210,-50.5195600', '07:30:00', -21.9355210, -50.5195600),  -- 29 EXCLUSÃO AGENDADA (LGPD)
    ('Bruna Teixeira',   '14991230030', 'UN2024043', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'bruna.teixeira@unesp.br',          'Biossistemas, Jardim Santo Antônio.',           'Rua Olímpia, 130, Jardim Santo Antônio, Tupã - SP',        '-21.9344310,-50.4972670', '07:00:00', -21.9344310, -50.4972670),  -- 30 UNESP/Bioss
    ('Camille Duarte',   '14991230031', 'UF2024045', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'camille.duarte@unifadap.edu.br',   'Biomedicina, moro na Vila Lahoz.',              'Rua Dona Palma, 30, Vila Lahoz, Tupã - SP',                '-21.9339030,-50.5043900', '07:15:00', -21.9339030, -50.5043900);  -- 31 UNIFADAP/Biomed


-- =====================================================
-- 4. USUARIOS_REGISTROS (usu_id 1-31)
-- =====================================================
INSERT INTO USUARIOS_REGISTROS (usu_id, usu_data_login, usu_criado_em, usu_atualizado_em) VALUES
    ( 1, '2026-01-05 09:00:00', '2026-01-02 08:00:00', NOW()),
    ( 2, NOW(), '2026-01-10 08:00:00', NOW()), ( 3, NOW(), '2026-01-10 08:00:00', NOW()),
    ( 4, NOW(), '2026-02-10 08:00:00', NOW()), ( 5, NOW(), '2026-02-10 08:05:00', NOW()),
    ( 6, NOW(), '2026-02-11 08:00:00', NOW()), ( 7, NOW(), '2026-02-11 08:05:00', NOW()),
    ( 8, NOW(), '2026-02-12 08:00:00', NOW()), ( 9, NOW(), '2026-02-12 08:05:00', NOW()),
    (10, NOW(), '2026-02-14 08:00:00', NOW()), (11, NOW(), '2026-02-14 08:05:00', NOW()),
    (12, NOW(), '2026-02-15 08:00:00', NOW()), (13, NOW(), '2026-02-15 08:05:00', NOW()),
    (14, NOW(), '2026-02-16 08:00:00', NOW()), (15, NOW(), '2026-02-16 08:05:00', NOW()),
    (16, NOW(), '2026-02-19 08:00:00', NOW()), (17, NOW(), '2026-02-19 08:05:00', NOW()),
    (18, '2026-05-01 10:00:00', '2026-02-20 08:00:00', '2026-05-15 10:00:00'),
    (19, NOW(), '2026-03-01 08:00:00', NOW()), (20, NOW(), '2026-03-01 08:05:00', NOW()),
    (21, NOW(), '2026-03-02 08:05:00', NOW()), (22, NOW(), '2026-03-03 08:00:00', NOW()),
    (23, NOW(), '2026-03-04 08:00:00', NOW()), (24, NOW(), '2026-03-04 08:05:00', NOW()),
    (25, NOW(), '2026-03-05 08:05:00', NOW()), (26, NOW(), '2026-03-06 08:00:00', NOW()),
    (27, NOW(), '2026-03-07 08:00:00', NOW()), (28, NOW(), '2026-03-07 08:05:00', NOW()),
    (29, NOW(), '2026-03-08 08:05:00', NOW()), (30, NOW(), '2026-03-09 08:00:00', NOW()),
    (31, NOW(), '2026-03-10 08:00:00', NOW());


-- =====================================================
-- 5. PERFIL (usu_id 1-31) — com preferências variadas (per_push_notif, per_raio_busca)
-- per_tipo: 1=Dev(2), 2=Admin UNESP(esc 1), 3=Admin UNIFADAP(esc 2), demais Usuário(0).
-- =====================================================
INSERT INTO PERFIL (usu_id, per_nome, per_data, per_tipo, per_habilitado, per_escola_id, per_push_notif, per_raio_busca) VALUES
    ( 1, 'Dev Tuctuc',        NOW(), 2, 1, NULL, 1,  5),
    ( 2, 'Administrador UNESP Tupã', NOW(), 1, 1, 1,    1, 10),
    ( 3, 'Administrador UNIFADAP',   NOW(), 1, 1, 2,    1, 10),
    ( 4, 'Rafael Almeida',    NOW(), 0, 1, NULL, 1,  5), ( 5, 'Beatriz Lima',     NOW(), 0, 1, NULL, 1,  8),
    ( 6, 'Bruno Carvalho',    NOW(), 0, 1, NULL, 1, 10), ( 7, 'Larissa Costa',    NOW(), 0, 1, NULL, 0,  5),
    ( 8, 'Thiago Rocha',      NOW(), 0, 1, NULL, 1,  3), ( 9, 'Juliana Dias',     NOW(), 0, 1, NULL, 1, 15),
    (10, 'Felipe Araújo',     NOW(), 0, 1, NULL, 1, 10), (11, 'Letícia Barbosa',  NOW(), 0, 1, NULL, 1,  8),
    (12, 'Gabriel Moreira',   NOW(), 0, 1, NULL, 1, 20), (13, 'Vinícius Gomes',   NOW(), 0, 1, NULL, 1,  5),
    (14, 'Carolina Pinto',    NOW(), 0, 1, NULL, 1,  8), (15, 'Rodrigo Teixeira', NOW(), 0, 1, NULL, 0, 25),
    (16, 'Marcelo Pires',     NOW(), 0, 1, NULL, 1,  5), (17, 'Renata Fonseca',   NOW(), 0, 1, NULL, 1,  5),
    (18, 'Otávio Suspenso',   NOW(), 0, 0, NULL, 1,  5),
    (19, 'Eduardo Ramos',     NOW(), 0, 1, NULL, 1,  8), (20, 'Fernanda Alves',   NOW(), 0, 1, NULL, 1, 10),
    (21, 'Sabrina Rocha',     NOW(), 0, 1, NULL, 1,  8), (22, 'Diego Martins',    NOW(), 0, 1, NULL, 1,  5),
    (23, 'Lucas Antunes',     NOW(), 0, 1, NULL, 1, 10), (24, 'Bianca Souza',     NOW(), 0, 1, NULL, 1,  8),
    (25, 'Tatiane Melo',      NOW(), 0, 1, NULL, 1, 15), (26, 'Caio Ferraz',      NOW(), 0, 1, NULL, 1,  5),
    (27, 'Yuri Nakamura',     NOW(), 0, 1, NULL, 1, 10), (28, 'Heloísa Pires',    NOW(), 0, 1, NULL, 1,  5),
    (29, 'Gustavo Henrique',  NOW(), 0, 1, NULL, 1,  7), (30, 'Bruna Teixeira',   NOW(), 0, 1, NULL, 1,  9),
    (31, 'Camille Duarte',    NOW(), 0, 1, NULL, 1,  8);

-- Preferências de tipos de notificação (JSON) — exemplo de usuário que silenciou um toggle.
UPDATE PERFIL SET per_notif_tipos = '{"CARONA_PROXIMA_SAIDA": 0}' WHERE usu_id = 15;  -- Rodrigo mutou alerta de saída


-- =====================================================
-- 6. VEICULOS (vei_id 1-12) — placas Mercosul, únicas
-- Donos: Dev(1) + motoristas + Marcelo penalizado(16).
-- =====================================================
INSERT INTO VEICULOS (usu_id, vei_placa, vei_marca_modelo, vei_tipo, vei_cor, vei_vagas, vei_status, vei_criado_em, vei_atualizado_em, vei_apagado_em) VALUES
    ( 1, 'FTU1A01', 'Toyota Corolla',  1, 'Preto',    4, 1, '2026-01-02', NULL, NULL),  -- vei_id=1  Dev
    ( 4, 'FTU2B02', 'Volkswagen Polo', 1, 'Prata',    4, 1, '2026-02-10', NULL, NULL),  -- vei_id=2  Rafael
    ( 5, 'FTU3C03', 'Hyundai HB20',    1, 'Branco',   4, 1, '2026-02-10', NULL, NULL),  -- vei_id=3  Beatriz
    ( 6, 'FTU4D04', 'Toyota Etios',    1, 'Prata',    2, 1, '2026-02-11', NULL, NULL),  -- vei_id=4  Bruno (2 vagas)
    ( 7, 'FTU5E05', 'Chevrolet Onix',  1, 'Vermelho', 4, 1, '2026-02-11', NULL, NULL),  -- vei_id=5  Larissa
    ( 8, 'FTU6F06', 'Renault Kwid',    1, 'Azul',     3, 1, '2026-02-12', NULL, NULL),  -- vei_id=6  Thiago
    ( 9, 'FTU7G07', 'Fiat Argo',       1, 'Cinza',    4, 1, '2026-02-12', NULL, NULL),  -- vei_id=7  Juliana
    (16, 'FTV2K11', 'Ford Ka',         1, 'Cinza',    4, 1, '2026-02-19', NULL, NULL),  -- vei_id=8  Marcelo (penalizado)
    (19, 'FTV3L12', 'Honda Civic',     1, 'Preto',    4, 1, '2026-03-01', NULL, NULL),  -- vei_id=9  Eduardo
    (20, 'FTV4M13', 'Jeep Renegade',   1, 'Branco',   4, 1, '2026-03-01', NULL, NULL),  -- vei_id=10 Fernanda
    (21, 'FTV6O15', 'Volkswagen Gol',  1, 'Prata',    3, 1, '2026-03-02', NULL, NULL),  -- vei_id=11 Sabrina
    (22, 'FTV7P16', 'Chevrolet Onix',  1, 'Azul',     4, 1, '2026-03-03', NULL, NULL);  -- vei_id=12 Diego


-- =====================================================
-- 7. CURSOS_USUARIOS (cur_usu_id 1-28) — matrículas
-- Gestão (1-3) não tem matrícula de curso.
-- =====================================================
INSERT INTO CURSOS_USUARIOS (usu_id, cur_id, cur_usu_dataFinal) VALUES
    ( 4, 1, '2026-12-31'),  -- cu1  Rafael   → Adm UNESP
    ( 5, 2, '2026-12-31'),  -- cu2  Beatriz  → Biossistemas UNESP
    ( 6, 2, '2026-12-31'),  -- cu3  Bruno    → Biossistemas UNESP
    ( 7, 3, '2026-12-31'),  -- cu4  Larissa  → Direito UNIFADAP
    ( 8, 5, '2026-12-31'),  -- cu5  Thiago   → Eng. Civil UNIFADAP
    ( 9, 3, '2026-12-31'),  -- cu6  Juliana  → Direito UNIFADAP
    (10, 1, '2026-12-31'),  -- cu7  Felipe   → Adm UNESP
    (11, 2, '2026-12-31'),  -- cu8  Letícia  → Biossistemas UNESP
    (12, 1, '2026-12-31'),  -- cu9  Gabriel  → Adm UNESP
    (13, 3, '2026-12-31'),  -- cu10 Vinícius → Direito UNIFADAP
    (14, 4, '2026-12-31'),  -- cu11 Carolina → Biomedicina UNIFADAP
    (15, 6, '2026-12-31'),  -- cu12 Rodrigo  → Fisioterapia UNIFADAP
    (16, 2, '2026-12-31'),  -- cu13 Marcelo  → Biossistemas UNESP
    (17, 3, '2026-12-31'),  -- cu14 Renata   → Direito UNIFADAP
    (18, 1, '2026-12-31'),  -- cu15 Otávio   → Adm UNESP (suspenso)
    (19, 1, '2026-12-31'),  -- cu16 Eduardo  → Adm UNESP
    (20, 4, '2026-12-31'),  -- cu17 Fernanda → Biomedicina UNIFADAP
    (21, 2, '2026-12-31'),  -- cu18 Sabrina  → Biossistemas UNESP
    (22, 3, '2026-12-31'),  -- cu19 Diego    → Direito UNIFADAP
    (23, 1, '2026-12-31'),  -- cu20 Lucas    → Adm UNESP
    (24, 6, '2026-12-31'),  -- cu21 Bianca   → Fisioterapia UNIFADAP
    (25, 2, '2026-12-31'),  -- cu22 Tatiane  → Biossistemas UNESP
    (26, 5, '2026-12-31'),  -- cu23 Caio     → Eng. Civil UNIFADAP
    (27, 1, '2026-12-31'),  -- cu24 Yuri     → Adm UNESP
    (28, 3, '2026-12-31'),  -- cu25 Heloísa  → Direito UNIFADAP
    (29, 3, '2026-12-31'),  -- cu26 G.Henrique → Direito UNIFADAP
    (30, 2, '2026-12-31'),  -- cu27 Bruna    → Biossistemas UNESP
    (31, 4, '2026-12-31');  -- cu28 Camille  → Biomedicina UNIFADAP


-- =====================================================
-- 8. CARONAS (car_id 1-16)
-- 10 ativas (1 por motorista) + 6 passadas (histórico). car_vagas_dispo das ativas
-- é recalculado na seção 13. HOJE têm car_alerta_saida_enviado=1.
-- Marcelo (pen. tipo 1) e Otávio (suspenso) NÃO oferecem caronas.
-- =====================================================
INSERT INTO CARONAS (vei_id, cur_usu_id, car_desc, car_data, car_hor_saida, car_vagas_dispo, car_status, car_capacete, car_alerta_saida_enviado) VALUES
    -- ── Ativas (status=1) ────────────────────────────────────────────────────
    ( 2,  1, 'Centro → UNESP, saída pela Av. Tamoios',         CURDATE(),                           '07:00:00', 4, 1, 0, 1),  -- car1  HOJE Rafael
    ( 3,  2, 'Jardim Apoema → UNESP, manhã',                   DATE_ADD(CURDATE(), INTERVAL 1 DAY), '07:30:00', 4, 1, 0, 0),  -- car2  +1d  Beatriz
    ( 4,  3, 'Jardim Apoema → UNESP (carro pequeno, 2 vagas)', CURDATE(),                           '07:15:00', 2, 1, 0, 1),  -- car3  HOJE Bruno
    ( 5,  4, 'Jardim Paulista → UNIFADAP, manhã',              DATE_ADD(CURDATE(), INTERVAL 2 DAY), '08:00:00', 4, 1, 0, 0),  -- car4  +2d  Larissa
    ( 6,  5, 'Volta UNIFADAP → Centro, fim de tarde',          CURDATE(),                           '19:00:00', 3, 1, 0, 1),  -- car5  HOJE Thiago
    ( 7,  6, 'Centro → UNIFADAP, manhã',                       DATE_ADD(CURDATE(), INTERVAL 4 DAY), '07:45:00', 4, 1, 0, 0),  -- car6  +4d  Juliana
    ( 9, 16, 'Jardim Apoema → UNESP, manhã',                   CURDATE(),                           '06:50:00', 4, 1, 0, 1),  -- car7  HOJE Eduardo
    (10, 17, 'Jardim Santo Antônio → UNIFADAP',               DATE_ADD(CURDATE(), INTERVAL 1 DAY), '07:40:00', 4, 1, 0, 0),  -- car8  +1d  Fernanda
    (11, 18, 'Jardim Apoema → UNESP, manhã',                   DATE_ADD(CURDATE(), INTERVAL 2 DAY), '07:05:00', 3, 1, 0, 0),  -- car9  +2d  Sabrina
    (12, 19, 'Centro → UNIFADAP, manhã',                       CURDATE(),                           '07:25:00', 4, 1, 0, 1),  -- car10 HOJE Diego
    -- ── Passadas (status 3 — histórico) ──────────────────────────────────────
    ( 2,  1, 'Centro → UNESP (carona de ontem)',              DATE_SUB(CURDATE(), INTERVAL 1 DAY), '07:00:00', 3, 3, 0, 0),  -- car11 -1d FIN Rafael
    ( 3,  2, 'Jardim Apoema → UNESP (carona passada)',        DATE_SUB(CURDATE(), INTERVAL 2 DAY), '07:30:00', 3, 3, 0, 0),  -- car12 -2d FIN Beatriz
    ( 5,  4, 'Jardim Paulista → UNIFADAP (passada)',          DATE_SUB(CURDATE(), INTERVAL 3 DAY), '08:00:00', 2, 3, 0, 0),  -- car13 -3d FIN Larissa
    ( 9, 16, 'Jardim Apoema → UNESP (passada)',               DATE_SUB(CURDATE(), INTERVAL 2 DAY), '06:50:00', 2, 3, 0, 0),  -- car14 -2d FIN Eduardo
    ( 6,  5, 'Volta UNIFADAP → Centro (passada)',             DATE_SUB(CURDATE(), INTERVAL 2 DAY), '19:00:00', 1, 3, 0, 0),  -- car15 -2d FIN Thiago
    (12, 19, 'Centro → UNIFADAP (passada)',                   DATE_SUB(CURDATE(), INTERVAL 4 DAY), '07:25:00', 3, 3, 0, 0);  -- car16 -4d FIN Diego


-- =====================================================
-- 9. PONTO_ENCONTROS — partida (0) + destino (1) por carona, coords reais (OSM)
-- =====================================================
INSERT INTO PONTO_ENCONTROS (car_id, pon_endereco, pon_endereco_geom, pon_lat, pon_lon, pon_tipo, pon_nome, pon_ordem, pon_status) VALUES
    ( 1, 'Avenida Tamoios, 250, Centro, Tupã - SP',                   '-21.9281990,-50.5118790', -21.9281990, -50.5118790, 0, 'Avenida Tamoios, Centro',             1, 1),
    ( 1, 'Av. Domingos da Costa Lopes, 780, Jardim Itaipu, Tupã - SP','-21.9281770,-50.4909540', -21.9281770, -50.4909540, 1, 'UNESP Tupã',                          2, 1),
    ( 2, 'Rua Paulo Dessy Juan, 120, Jardim Apoema, Tupã - SP',       '-21.9341740,-50.4897900', -21.9341740, -50.4897900, 0, 'Rua Paulo Dessy Juan, Jardim Apoema', 1, 1),
    ( 2, 'Av. Domingos da Costa Lopes, 780, Jardim Itaipu, Tupã - SP','-21.9281770,-50.4909540', -21.9281770, -50.4909540, 1, 'UNESP Tupã',                          2, 1),
    ( 3, 'Rua Carlos Gomes Pato, 150, Jardim Apoema, Tupã - SP',      '-21.9340830,-50.4891620', -21.9340830, -50.4891620, 0, 'Rua Carlos Gomes Pato, Jardim Apoema',1, 1),
    ( 3, 'Av. Domingos da Costa Lopes, 780, Jardim Itaipu, Tupã - SP','-21.9281770,-50.4909540', -21.9281770, -50.4909540, 1, 'UNESP Tupã',                          2, 1),
    ( 4, 'Rua Irapuru, 200, Jardim Paulista, Tupã - SP',             '-21.9373340,-50.5261200', -21.9373340, -50.5261200, 0, 'Rua Irapuru, Jardim Paulista',        1, 1),
    ( 4, 'Rua Mandaguaris, 1010, Centro, Tupã - SP',                 '-21.9414830,-50.5144170', -21.9414830, -50.5144170, 1, 'UNIFADAP',                            2, 1),
    ( 5, 'Rua Mandaguaris, 1010, Centro, Tupã - SP',                 '-21.9414830,-50.5144170', -21.9414830, -50.5144170, 0, 'UNIFADAP',                            1, 1),
    ( 5, 'Avenida Tamoios, Centro, Tupã - SP',                       '-21.9281990,-50.5118790', -21.9281990, -50.5118790, 1, 'Avenida Tamoios, Centro',             2, 1),
    ( 6, 'Rua Mandaguaris, 500, Centro, Tupã - SP',                  '-21.9355210,-50.5195600', -21.9355210, -50.5195600, 0, 'Rua Mandaguaris, Centro',             1, 1),
    ( 6, 'Rua Mandaguaris, 1010, Centro, Tupã - SP',                 '-21.9414830,-50.5144170', -21.9414830, -50.5144170, 1, 'UNIFADAP',                            2, 1),
    ( 7, 'Rua Paulo Dessy Juan, 300, Jardim Apoema, Tupã - SP',       '-21.9341740,-50.4897900', -21.9341740, -50.4897900, 0, 'Rua Paulo Dessy Juan, Jardim Apoema', 1, 1),
    ( 7, 'Av. Domingos da Costa Lopes, 780, Jardim Itaipu, Tupã - SP','-21.9281770,-50.4909540', -21.9281770, -50.4909540, 1, 'UNESP Tupã',                          2, 1),
    ( 8, 'Rua Olímpia, 80, Jardim Santo Antônio, Tupã - SP',          '-21.9344310,-50.4972670', -21.9344310, -50.4972670, 0, 'Rua Olímpia, Jardim Santo Antônio',   1, 1),
    ( 8, 'Rua Mandaguaris, 1010, Centro, Tupã - SP',                 '-21.9414830,-50.5144170', -21.9414830, -50.5144170, 1, 'UNIFADAP',                            2, 1),
    ( 9, 'Rua Carlos Gomes Pato, 220, Jardim Apoema, Tupã - SP',      '-21.9340830,-50.4891620', -21.9340830, -50.4891620, 0, 'Rua Carlos Gomes Pato, Jardim Apoema',1, 1),
    ( 9, 'Av. Domingos da Costa Lopes, 780, Jardim Itaipu, Tupã - SP','-21.9281770,-50.4909540', -21.9281770, -50.4909540, 1, 'UNESP Tupã',                          2, 1),
    (10, 'Rua Bororós, 410, Centro, Tupã - SP',                       '-21.9339050,-50.5170110', -21.9339050, -50.5170110, 0, 'Rua Bororós, Centro',                 1, 1),
    (10, 'Rua Mandaguaris, 1010, Centro, Tupã - SP',                 '-21.9414830,-50.5144170', -21.9414830, -50.5144170, 1, 'UNIFADAP',                            2, 1),
    (11, 'Avenida Tamoios, 250, Centro, Tupã - SP',                   '-21.9281990,-50.5118790', -21.9281990, -50.5118790, 0, 'Avenida Tamoios, Centro',             1, 1),
    (11, 'Av. Domingos da Costa Lopes, 780, Jardim Itaipu, Tupã - SP','-21.9281770,-50.4909540', -21.9281770, -50.4909540, 1, 'UNESP Tupã',                          2, 1),
    (12, 'Rua Paulo Dessy Juan, 120, Jardim Apoema, Tupã - SP',       '-21.9341740,-50.4897900', -21.9341740, -50.4897900, 0, 'Rua Paulo Dessy Juan, Jardim Apoema', 1, 1),
    (12, 'Av. Domingos da Costa Lopes, 780, Jardim Itaipu, Tupã - SP','-21.9281770,-50.4909540', -21.9281770, -50.4909540, 1, 'UNESP Tupã',                          2, 1),
    (13, 'Rua Irapuru, 200, Jardim Paulista, Tupã - SP',             '-21.9373340,-50.5261200', -21.9373340, -50.5261200, 0, 'Rua Irapuru, Jardim Paulista',        1, 1),
    (13, 'Rua Mandaguaris, 1010, Centro, Tupã - SP',                 '-21.9414830,-50.5144170', -21.9414830, -50.5144170, 1, 'UNIFADAP',                            2, 1),
    (14, 'Rua Paulo Dessy Juan, 300, Jardim Apoema, Tupã - SP',       '-21.9341740,-50.4897900', -21.9341740, -50.4897900, 0, 'Rua Paulo Dessy Juan, Jardim Apoema', 1, 1),
    (14, 'Av. Domingos da Costa Lopes, 780, Jardim Itaipu, Tupã - SP','-21.9281770,-50.4909540', -21.9281770, -50.4909540, 1, 'UNESP Tupã',                          2, 1),
    (15, 'Rua Mandaguaris, 1010, Centro, Tupã - SP',                 '-21.9414830,-50.5144170', -21.9414830, -50.5144170, 0, 'UNIFADAP',                            1, 1),
    (15, 'Avenida Tamoios, Centro, Tupã - SP',                       '-21.9281990,-50.5118790', -21.9281990, -50.5118790, 1, 'Avenida Tamoios, Centro',             2, 1),
    (16, 'Rua Bororós, 410, Centro, Tupã - SP',                       '-21.9339050,-50.5170110', -21.9339050, -50.5170110, 0, 'Rua Bororós, Centro',                 1, 1),
    (16, 'Rua Mandaguaris, 1010, Centro, Tupã - SP',                 '-21.9414830,-50.5144170', -21.9414830, -50.5144170, 1, 'UNIFADAP',                            2, 1);


-- =====================================================
-- 10. PENALIDADES — aplicadas pelo Dev (usu_id=1)
-- =====================================================
INSERT INTO PENALIDADES (usu_id, pen_tipo, pen_motivo, pen_expira_em, pen_aplicado_por, pen_ativo) VALUES
    (16, 1, 'Cancelamentos recorrentes sem aviso prévio.',  DATE_ADD(NOW(), INTERVAL 20 DAY), 1, 1),  -- Marcelo: não OFERECE
    (17, 2, 'Comportamento inadequado com motorista.',      DATE_ADD(NOW(), INTERVAL 15 DAY), 1, 1),  -- Renata: não SOLICITA
    (18, 4, 'Uso de comprovante de matrícula falsificado.', NULL,                            1, 1);  -- Otávio: SUSPENSA (permanente, login bloqueado)


-- =====================================================
-- 11. SOLICITACOES_CARONA
-- =====================================================
INSERT INTO SOLICITACOES_CARONA (usu_id_passageiro, car_id, sol_status, sol_vaga_soli) VALUES
    -- ── Aceitas em caronas ATIVAS (1 aceite ativo por passageiro) ─────────────
    (10,  1, 2, 1), (12,  1, 2, 1), (23,  1, 2, 1),   -- car1: Felipe, Gabriel, Lucas
    (11,  3, 2, 1), (16,  3, 2, 1),                    -- car3: Letícia, Marcelo (lota)
    (15,  4, 2, 1), (28,  4, 2, 1),                    -- car4: Rodrigo, Heloísa
    (13,  5, 2, 1), (14,  5, 2, 1), (26,  5, 2, 1),   -- car5: Vinícius, Carolina, Caio (lota)
    (24,  6, 2, 1), (29,  6, 2, 1),                    -- car6: Bianca, G. Henrique
    (27,  7, 2, 1), (30,  7, 2, 1),                    -- car7: Yuri, Bruna
    (31,  8, 2, 1),                                    -- car8: Camille
    -- ── Pendentes (sol=1) ─────────────────────────────────────────────────────
    (10,  6, 1, 1),  -- Felipe   → car6 pendente
    (23, 10, 1, 1),  -- Lucas    → car10 pendente
    (28, 10, 1, 1),  -- Heloísa  → car10 pendente
    -- ── Aceitas em caronas PASSADAS (histórico) ───────────────────────────────
    (10, 11, 2, 1), (12, 11, 2, 1),  -- car11
    (11, 12, 2, 1),                   -- car12
    (15, 13, 2, 1), (28, 13, 2, 1),  -- car13
    (27, 14, 2, 1), (30, 14, 2, 1),  -- car14
    (13, 15, 2, 1), (14, 15, 2, 1),  -- car15
    (24, 16, 2, 1);                   -- car16


-- =====================================================
-- 12. CARONA_PESSOAS — passageiros confirmados (espelha os sol=2)
-- =====================================================
INSERT INTO CARONA_PESSOAS (car_id, usu_id, car_pes_data, car_pes_status) VALUES
    -- Ativas
    ( 1, 10, NOW(), 1), ( 1, 12, NOW(), 1), ( 1, 23, NOW(), 1),   -- car1: 3
    ( 3, 11, NOW(), 1), ( 3, 16, NOW(), 1),                        -- car3: 2 (lotada)
    ( 4, 15, NOW(), 1), ( 4, 28, NOW(), 1),                        -- car4: 2
    ( 5, 13, NOW(), 1), ( 5, 14, NOW(), 1), ( 5, 26, NOW(), 1),   -- car5: 3 (lotada)
    ( 6, 24, NOW(), 1), ( 6, 29, NOW(), 1),                        -- car6: 2
    ( 7, 27, NOW(), 1), ( 7, 30, NOW(), 1),                        -- car7: 2
    ( 8, 31, NOW(), 1),                                            -- car8: 1
    -- Passadas (histórico)
    (11, 10, DATE_SUB(NOW(), INTERVAL 1 DAY), 1), (11, 12, DATE_SUB(NOW(), INTERVAL 1 DAY), 1),
    (12, 11, DATE_SUB(NOW(), INTERVAL 2 DAY), 1),
    (13, 15, DATE_SUB(NOW(), INTERVAL 3 DAY), 1), (13, 28, DATE_SUB(NOW(), INTERVAL 3 DAY), 1),
    (14, 27, DATE_SUB(NOW(), INTERVAL 2 DAY), 1), (14, 30, DATE_SUB(NOW(), INTERVAL 2 DAY), 1),
    (15, 13, DATE_SUB(NOW(), INTERVAL 2 DAY), 1), (15, 14, DATE_SUB(NOW(), INTERVAL 2 DAY), 1),
    (16, 24, DATE_SUB(NOW(), INTERVAL 4 DAY), 1);


-- =====================================================
-- 13. RECALCULA car_vagas_dispo das caronas ATIVAS (= capacidade − aceitos)
-- =====================================================
UPDATE CARONAS c
JOIN VEICULOS v ON v.vei_id = c.vei_id
SET c.car_vagas_dispo = v.vei_vagas - (
        SELECT COUNT(*) FROM CARONA_PESSOAS cp
        WHERE cp.car_id = c.car_id AND cp.car_pes_status = 1
    )
WHERE c.car_status IN (1, 2);


-- =====================================================
-- 14. EXCLUSÃO AGENDADA (LGPD) — Gustavo Henrique (u29) pediu exclusão da conta
-- Job periódico fará o soft-delete após a data (30 dias de carência).
-- =====================================================
UPDATE USUARIOS SET usu_exclusao_agendada = DATE_ADD(NOW(), INTERVAL 25 DAY) WHERE usu_id = 29;


-- =====================================================
-- 15. MENSAGENS — conversas completas (men_id começa em 1)
-- =====================================================
INSERT INTO MENSAGENS (car_id, usu_id_remetente, usu_id_destinatario, men_texto, men_status, men_id_resposta) VALUES
    -- car1: Felipe (10) ↔ Rafael (4)
    ( 1, 10,  4, 'Oi Rafael! Confirma que passa na Av. Tamoios às 07h?',     3, NULL),  -- 1
    ( 1,  4, 10, 'Confirmo, Felipe! 07h em ponto na Tamoios.',               3, 1),     -- 2
    ( 1, 10,  4, 'Perfeito, muito obrigado!',                                3, 2),     -- 3
    ( 1, 12,  4, 'Rafael, dá pra encostar perto da Vila Lahoz na volta?',    2, NULL),  -- 4 (não lida)
    -- car5: Vinícius (13) / Carolina (14) ↔ Thiago (8)
    ( 5, 13,  8, 'Thiago, a volta hoje sai 19h mesmo?',                      3, NULL),  -- 5
    ( 5,  8, 13, 'Sai sim! 19h na frente da UNIFADAP.',                      3, 5),     -- 6
    ( 5, 14,  8, 'Oi Thiago, pode me pegar também na saída?',               2, NULL),  -- 7 (não lida)
    -- car7: Yuri (27) ↔ Eduardo (19)
    ( 7, 27, 19, 'Eduardo, você sai do Apoema às 06h50?',                    3, NULL),  -- 8
    ( 7, 19, 27, 'Saio sim, Yuri. Te pego na Av. Centenário.',               3, 8),     -- 9
    -- Histórico car11: Felipe (10) ↔ Rafael (4)
    (11, 10,  4, 'Cheguei no ponto, pode vir!',                             3, NULL),  -- 10
    (11,  4, 10, 'Chegando, 2 minutinhos.',                                 3, 10);    -- 11


-- =====================================================
-- 16. NOTIFICACOES — automáticas (sistema) e penalidades (remetente=Dev)
-- =====================================================
INSERT INTO NOTIFICACOES (usu_id, noti_tipo, noti_titulo, noti_mensagem, noti_lida, noti_dados, noti_remetente, noti_criada_em) VALUES
    ( 4, 'SOLICITACAO_NOVA',     'Nova solicitação de carona', 'Felipe Araújo pediu 1 vaga na sua carona.',          1, '{"car_id": 1}',  NULL, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
    ( 4, 'SOLICITACAO_NOVA',     'Nova solicitação de carona', 'Lucas Antunes pediu 1 vaga na sua carona.',          0, '{"car_id": 1}',  NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
    (10, 'SOLICITACAO_ACEITA',   'Solicitação aceita!',        'Sua vaga na carona Centro → UNESP foi confirmada.',  1, '{"car_id": 1}',  NULL, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
    (23, 'SOLICITACAO_ACEITA',   'Solicitação aceita!',        'Sua vaga foi confirmada pelo motorista.',            0, '{"car_id": 1}',  NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
    (16, 'SOLICITACAO_ACEITA',   'Solicitação aceita!',        'Sua vaga na carona de Bruno foi confirmada.',        0, '{"car_id": 3}',  NULL, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
    ( 4, 'CARONA_PROXIMA_SAIDA', 'Sua carona parte em breve',  'Sua carona sai em ~30 minutos. Prepare-se!',         0, '{"car_id": 1}',  NULL, NOW()),
    (10, 'CARONA_PROXIMA_SAIDA', 'Carona parte em breve',      'A carona que você participa sai em ~30 minutos.',    0, '{"car_id": 1}',  NULL, NOW()),
    (10, 'CARONA_FINALIZADA',    'Carona encerrada',           'A carona de ontem foi finalizada. Avalie o motorista!',1, '{"car_id": 11}', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)),
    ( 4, 'AVALIACAO_RECEBIDA',   'Você recebeu uma avaliação', 'Felipe avaliou sua carona com 5 estrelas.',          0, '{"car_id": 11}', NULL, DATE_SUB(NOW(), INTERVAL 20 HOUR)),
    (16, 'PENALIDADE_APLICADA',  'Penalidade aplicada',        'Você está impedido de oferecer caronas. Motivo: cancelamentos recorrentes.', 0, '{"pen_tipo": 1}', 1, DATE_SUB(NOW(), INTERVAL 6 DAY)),
    (17, 'PENALIDADE_APLICADA',  'Penalidade aplicada',        'Você está impedido de solicitar caronas. Motivo: comportamento inadequado.', 0, '{"pen_tipo": 2}', 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
    (18, 'PENALIDADE_APLICADA',  'Conta suspensa',             'Sua conta foi suspensa: comprovante de matrícula falsificado.', 0, '{"pen_tipo": 4}', 1, DATE_SUB(NOW(), INTERVAL 35 DAY)),
    (29, 'SISTEMA',              'Exclusão de conta agendada', 'Sua conta será excluída em 25 dias. Você pode cancelar nas configurações.', 0, NULL, NULL, NOW());


-- =====================================================
-- 17. DENUNCIAS — entre usuários (Admin vê sua escola; Dev vê tudo)
-- den_id_resposta = usu_id de quem respondeu (Dev=1).
-- =====================================================
INSERT INTO DENUNCIAS (usu_id, den_tipo, car_id, den_usu_alvo, den_motivo, den_texto, den_data, den_status, den_id_resposta, den_resposta) VALUES
    (11, 1, NULL, 16, 'Direção perigosa',         'O motorista dirigiu de forma imprudente, acima do limite, durante a carona.', DATE_SUB(NOW(), INTERVAL 2 DAY),  3, NULL, NULL),  -- Letícia→Marcelo (UNESP)
    (14, 1, NULL,  8, 'Comportamento inadequado',  'O motorista foi ríspido com os passageiros durante a viagem.',                DATE_SUB(NOW(), INTERVAL 1 DAY),  3, NULL, NULL),  -- Carolina→Thiago (UNIFADAP)
    (27, 1, NULL, 18, 'Documento falso',           'Suspeito que este usuário usou comprovante falsificado.',                     DATE_SUB(NOW(), INTERVAL 30 DAY), 2, 1,    'Denúncia procedente — conta suspensa.');  -- Yuri→Otávio (resolvida/arquivada pelo Dev)


-- =====================================================
-- 18. AVALIACOES — mútuas nas caronas FINALIZADAS (ava_nota 1..5)
-- =====================================================
INSERT INTO AVALIACOES (car_id, usu_id_avaliador, usu_id_avaliado, ava_nota, ava_comentario, ava_criado_em) VALUES
    (11, 10,  4, 5, 'Motorista pontual e atencioso!',          DATE_SUB(NOW(), INTERVAL 20 HOUR)),
    (11,  4, 10, 5, 'Passageiro tranquilo, recomendo.',         DATE_SUB(NOW(), INTERVAL 20 HOUR)),
    (11, 12,  4, 4, 'Boa viagem, só atrasou uns minutinhos.',   DATE_SUB(NOW(), INTERVAL 19 HOUR)),
    (12, 11,  5, 5, 'Carro confortável e dirige super bem.',    DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (12,  5, 11, 5, 'Combinou tudo certinho, ótima passageira.',DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (13, 15,  7, 4, 'Tudo certo, chegamos no horário.',         DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (13, 28,  7, 5, 'Muito gentil, recomendo demais.',          DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (14, 27, 19, 5, 'Excelente motorista!',                     DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (14, 30, 19, 4, 'Carona tranquila.',                        DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (14, 19, 27, 5, 'Passageiro pontual.',                      DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (15, 13,  8, 5, 'Pontual e simpático.',                     DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (15, 14,  8, 4, 'Boa carona, voltaria a pegar.',            DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (16, 24, 22, 4, 'Tudo certo na viagem.',                    DATE_SUB(NOW(), INTERVAL 4 DAY)),
    (16, 22, 24, 5, 'Ótima passageira.',                        DATE_SUB(NOW(), INTERVAL 4 DAY));


-- =====================================================
-- 19. DOCUMENTOS_VERIFICACAO — sustenta os níveis de verificação
-- doc_tipo: 0=Comprovante, 1=CNH | doc_status: 0=aprovado_ocr, 1=pendente, 2=reprovado_ocr
-- =====================================================
INSERT INTO DOCUMENTOS_VERIFICACAO (usu_id, doc_tipo, doc_arquivo, doc_ocr_confianca, doc_status, doc_enviado_em) VALUES
    -- Motoristas (comprovante + CNH aprovados)
    ( 4, 0, 'comprovante_rafael_4.pdf',  92, 0, DATE_SUB(NOW(), INTERVAL 4 MONTH)), ( 4, 1, 'cnh_rafael_4.pdf',  88, 0, DATE_SUB(NOW(), INTERVAL 4 MONTH)),
    ( 5, 0, 'comprovante_beatriz_5.pdf', 90, 0, DATE_SUB(NOW(), INTERVAL 4 MONTH)), ( 5, 1, 'cnh_beatriz_5.pdf', 85, 0, DATE_SUB(NOW(), INTERVAL 4 MONTH)),
    (19, 0, 'comprovante_eduardo_19.pdf',94, 0, DATE_SUB(NOW(), INTERVAL 2 MONTH)), (19, 1, 'cnh_eduardo_19.pdf',89, 0, DATE_SUB(NOW(), INTERVAL 2 MONTH)),
    -- Passageiros (comprovante aprovado)
    (10, 0, 'comprovante_felipe_10.pdf', 89, 0, DATE_SUB(NOW(), INTERVAL 3 MONTH)),
    (11, 0, 'comprovante_leticia_11.pdf',93, 0, DATE_SUB(NOW(), INTERVAL 3 MONTH)),
    (27, 0, 'comprovante_yuri_27.pdf',   91, 0, DATE_SUB(NOW(), INTERVAL 2 MONTH));


-- =====================================================
-- 20. PUSH_TOKENS — 1 device por conta (Expo Push)
-- =====================================================
INSERT INTO PUSH_TOKENS (usu_id, pst_token, pst_plataforma, pst_app_versao, pst_criado_em, pst_usado_em) VALUES
    ( 1, 'ExponentPushToken[tupa-dev-0001]',     'android', '0.4.0', NOW(), NOW()),
    ( 4, 'ExponentPushToken[tupa-rafael-0004]',  'android', '0.4.0', NOW(), NOW()),
    ( 8, 'ExponentPushToken[tupa-thiago-0008]',  'android', '0.4.0', NOW(), NOW()),
    (10, 'ExponentPushToken[tupa-felipe-0010]',  'ios',     '0.4.0', NOW(), NOW()),
    (19, 'ExponentPushToken[tupa-eduardo-0019]', 'android', '0.4.0', NOW(), NOW()),
    (23, 'ExponentPushToken[tupa-lucas-0023]',   'android', '0.4.0', NOW(), NOW()),
    (27, 'ExponentPushToken[tupa-yuri-0027]',    'ios',     '0.4.0', NOW(), NOW());


-- =====================================================
-- 21. SUGESTOES — criadas no app (geridas pelo Dev no painel)
-- sug_id_resposta = usu_id de quem respondeu (Dev=1).
-- =====================================================
INSERT INTO SUGESTOES (usu_id, sug_texto, sug_data, sug_status, sug_id_resposta, sug_resposta) VALUES
    (10, 'Seria útil ver a placa e o modelo do veículo antes de confirmar a carona.', NOW(),                          1, NULL, NULL),
    (13, 'Poderiam adicionar um filtro de busca por bairro de Tupã.',                 DATE_SUB(NOW(), INTERVAL 1 DAY), 3, NULL, NULL),
    (20, 'Um chat de grupo por carona ajudaria a combinar os detalhes.',              DATE_SUB(NOW(), INTERVAL 2 DAY), 0, 1, 'Ótima ideia! Já está no roadmap.');


-- =====================================================
-- 22. SUPORTE_MENSAGENS — chat Admin (escola) ↔ Dev
-- spm_remetente: 'admin' = quem administra a escola | 'dev' = desenvolvedor
-- =====================================================
INSERT INTO SUPORTE_MENSAGENS (usu_id_admin, usu_id_dev, spm_remetente, spm_texto, spm_lida, spm_criada_em) VALUES
    (2, 1, 'admin', 'Olá! Como faço para renovar o contrato da UNESP no painel?',                 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (2, 1, 'dev',   'Oi! Vá em Escolas → UNESP → Contrato e escolha a duração. Eu valido depois.', 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (2, 1, 'admin', 'Perfeito, obrigado!',                                                        0, DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (3, 1, 'admin', 'Recebemos uma denúncia de comportamento de um aluno. Pode orientar?',         1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (3, 1, 'dev',   'Pode analisar em Denúncias e responder; se for grave, aplique penalidade.',   0, DATE_SUB(NOW(), INTERVAL 1 DAY));


SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- FIM DO SEED Tupã/SP (31 usuários, 16 caronas, interações completas)
-- =====================================================
