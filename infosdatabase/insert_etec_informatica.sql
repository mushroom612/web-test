-- =====================================================
-- Arquivo: insert_etec_informatica.sql
-- Descrição: Seed FOCADO — uma única instituição (ETEC Prof. Massuyuki Kawano,
--            cursos de Informática) + Desenvolvedor + Administrador da escola
--            + 4 alunos nomeados, com caronas, histórico de suporte e auditoria.
--            Arquivo único e autocontido — rodar após create.sql.
--            (Alternativa ENXUTA ao insert_tupa.sql — rode UM ou OUTRO, não os dois.)
--
-- Conteúdo:
--   1 escola (ETEC) · 3 cursos de Informática · 6 usuários
--   (1 Dev + 1 Admin + 4 alunos) · 2 veículos · 3 caronas (2 ativas + 1 finalizada)
--   + solicitações, passageiros, mensagens de chat, sugestões,
--     HISTÓRICO DE SUPORTE (Admin↔Dev) e HISTÓRICO DE AUDITORIA (painel + app).
--
-- Alunos nomeados: Clara Gabriele, Derick Rufino, Ana Julia, Guilherme Matchin.
--
-- LEGENDA DE STATUS (referência rápida):
--   USUARIOS.usu_verificacao  1=matrícula, 2=matrícula+veículo
--   PERFIL.per_tipo           0=Usuário, 1=Administrador (escopo escola), 2=Desenvolvedor
--   VEICULOS.vei_tipo         0=Moto (máx 1 vaga), 1=Carro (1-4 vagas)
--   CARONAS.car_status        0=Cancelada, 1=Aberta, 2=Em espera, 3=Finalizada
--   SOLICITACOES.sol_status   0=Cancelado, 1=Enviado, 2=Aceito, 3=Negado
--   AUDIT_LOG.acao            LOGIN, USUARIO_CRIAR, CARONA_CRIAR, SOLICITACAO_ACEITAR, ...
--                             (ações CARONA_*/SOLICITACAO_* = aba "App"; demais = aba "Painel")
--   SUPORTE_MENSAGENS.spm_remetente 'admin' | 'dev'
--
-- Senhas (bcrypt custo 12): dev@tuctuc.com.br → Dev@1234 | gestor.* → Admin@123 | demais → Senha@123
-- =====================================================

USE bd_tcc_des_125_caronas;

SET FOREIGN_KEY_CHECKS = 0;


-- =====================================================
-- 1. ESCOLAS (esc_id=1) — ETEC Prof. Massuyuki Kawano (Tupã/SP)
-- =====================================================
INSERT INTO ESCOLAS (esc_nome, esc_endereco, esc_dominio, esc_max_usuarios, esc_lat, esc_lon, esc_contrato_duracao, esc_contrato_inicio, esc_contrato_expira, esc_contrato_arquivo, esc_ocr_base, esc_ocr_keywords) VALUES
    ('ETEC Prof. Massuyuki Kawano', 'Rua Bezerra de Menezes, 215, Vila Independência, Tupã - SP, CEP 17605-440', 'aluno.cps.sp.gov.br', 400, -21.9386200, -50.5269930, '5anos', '2025-01-01', '2030-01-01', 'contratos/contrato-etec-massuyuki-kawano.pdf', NULL, '["etec","massuyuki","kawano","centro","paula","souza","tecnico","informatica","desenvolvimento","sistemas","internet"]');  -- esc_id=1


-- =====================================================
-- 2. CURSOS (cur_id 1-3) — área de Informática
-- =====================================================
INSERT INTO CURSOS (cur_semestre, cur_nome, esc_id) VALUES
    (3, 'Técnico em Desenvolvimento de Sistemas', 1),   -- cur_id=1
    (3, 'Técnico em Informática',                 1),   -- cur_id=2
    (2, 'Técnico em Informática para Internet',   1);   -- cur_id=3


-- =====================================================
-- 3. USUARIOS (usu_id 1-6)
-- Gestão: 1=Dev, 2=Administrador ETEC. Alunos: 3-6.
-- =====================================================
INSERT INTO USUARIOS (usu_nome, usu_telefone, usu_matricula, usu_senha, usu_verificacao, usu_verificacao_expira, usu_status, usu_email, usu_descricao, usu_endereco, usu_endereco_geom, usu_horario_habitual, usu_lat, usu_lon) VALUES
    -- ── Gestão ───────────────────────────────────────────────────────────────
    ('Dev Tuctuc',            '14991230001', 'DEV2026001', '$2b$12$q3F3dPiovQZcP.Ng5Wvlye/2hVN1p8/0luKbNOYlQYg79hgPNaoqC', 2, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'dev@tuctuc.com.br',           'Desenvolvedor Tuctuc — acesso total.',     'Avenida Tamoios, 100, Centro, Tupã - SP',                   '-21.9281990,-50.5118790', NULL,        -21.9281990, -50.5118790),  -- 1  Dev@1234
    ('Administrador ETEC Tupã','14991230002','ADMETEC001', '$2b$12$IG1G1Al0Qd/ndqaJgrySNOLrLG69gXpaaCdGDsqRrdTf/H3s0UjTO', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'gestor.tupa@etec.sp.gov.br',  'Administrador da ETEC Massuyuki Kawano.',  'Rua Bezerra de Menezes, 215, Vila Independência, Tupã - SP','-21.9375590,-50.5280040', NULL,        -21.9375590, -50.5280040),  -- 2  Admin@123

    -- ── Alunos ───────────────────────────────────────────────────────────────
    ('Clara Gabriele',    '14991230003', 'ET2026003', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 2, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'clara.gabriele@aluno.cps.sp.gov.br',   'Desenv. de Sistemas, ofereço carona pela manhã.', 'Rua Coroados, 140, Centro, Tupã - SP',           '-21.9326220,-50.5168850', '07:00:00', -21.9326220, -50.5168850),  -- 3  motorista (carro)
    ('Derick Rufino',     '14991230004', 'ET2026004', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 2, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'derick.rufino@aluno.cps.sp.gov.br',    'Informática, tenho moto e volto à noite.',        'Rua Tapajós, 200, Centro, Tupã - SP',            '-21.9304920,-50.5232480', '18:10:00', -21.9304920, -50.5232480),  -- 4  motorista (moto)
    ('Ana Julia',         '14991230005', 'ET2026005', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'ana.julia@aluno.cps.sp.gov.br',        'Informática para Internet, busco carona de manhã.','Rua Antônio Lahoz, 150, Vila Lahoz, Tupã - SP',  '-21.9327550,-50.5064470', '07:10:00', -21.9327550, -50.5064470),  -- 5  passageira
    ('Guilherme Matchin', '14991230006', 'ET2026006', '$2b$12$Piwxr050DVwdiJv/0.IRZOtoxsLcraeGCp0jN50PMyh0zNa8iptO2', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'guilherme.matchin@aluno.cps.sp.gov.br','Desenv. de Sistemas, procuro carona pro Centro.', 'Avenida Lélio Pizza, 110, Vila Lahoz, Tupã - SP','-21.9323200,-50.5070060', '07:05:00', -21.9323200, -50.5070060);  -- 6  passageiro


-- =====================================================
-- 4. USUARIOS_REGISTROS (usu_id 1-6)
-- =====================================================
INSERT INTO USUARIOS_REGISTROS (usu_id, usu_data_login, usu_criado_em, usu_atualizado_em) VALUES
    ( 1, NOW(), '2026-01-02 08:00:00', NOW()),
    ( 2, NOW(), '2026-01-10 08:00:00', NOW()),
    ( 3, NOW(), '2026-02-10 08:00:00', NOW()),
    ( 4, NOW(), '2026-02-11 08:00:00', NOW()),
    ( 5, NOW(), '2026-02-12 08:00:00', NOW()),
    ( 6, NOW(), '2026-02-13 08:00:00', NOW());


-- =====================================================
-- 5. PERFIL (usu_id 1-6)
-- per_tipo: 1=Dev(2), 2=Admin ETEC(esc 1), demais Usuário(0).
-- =====================================================
INSERT INTO PERFIL (usu_id, per_nome, per_data, per_tipo, per_habilitado, per_escola_id, per_push_notif, per_raio_busca) VALUES
    ( 1, 'Dev Tuctuc',             NOW(), 2, 1, NULL, 1,  5),
    ( 2, 'Administrador ETEC Tupã',NOW(), 1, 1, 1,    1, 10),
    ( 3, 'Clara Gabriele',         NOW(), 0, 1, NULL, 1,  8),
    ( 4, 'Derick Rufino',          NOW(), 0, 1, NULL, 1,  5),
    ( 5, 'Ana Julia',              NOW(), 0, 1, NULL, 1, 10),
    ( 6, 'Guilherme Matchin',      NOW(), 0, 1, NULL, 1,  8);


-- =====================================================
-- 6. VEICULOS (vei_id 1-2)
-- =====================================================
INSERT INTO VEICULOS (usu_id, vei_placa, vei_marca_modelo, vei_tipo, vei_cor, vei_vagas, vei_status, vei_criado_em, vei_atualizado_em, vei_apagado_em) VALUES
    ( 3, 'FTU1A01', 'Chevrolet Onix', 1, 'Branco',   4, 1, '2026-02-10', NULL, NULL),  -- vei_id=1  Clara (carro 4 vagas)
    ( 4, 'FTU2B02', 'Honda CG 160',   0, 'Vermelho', 1, 1, '2026-02-11', NULL, NULL);  -- vei_id=2  Derick (moto)


-- =====================================================
-- 7. CURSOS_USUARIOS (cur_usu_id 1-4) — matrículas dos alunos
-- =====================================================
INSERT INTO CURSOS_USUARIOS (usu_id, cur_id, cur_usu_dataFinal) VALUES
    ( 3, 1, '2026-12-31'),  -- cu1  Clara     → Desenv. de Sistemas
    ( 4, 2, '2026-12-31'),  -- cu2  Derick    → Informática
    ( 5, 3, '2026-12-31'),  -- cu3  Ana Julia → Informática para Internet
    ( 6, 1, '2026-12-31');  -- cu4  Guilherme → Desenv. de Sistemas


-- =====================================================
-- 8. CARONAS (car_id 1-3)
-- car_vagas_dispo das ativas é recalculado na seção 12.
-- =====================================================
INSERT INTO CARONAS (vei_id, cur_usu_id, car_desc, car_data, car_hor_saida, car_vagas_dispo, car_status, car_capacete, car_alerta_saida_enviado) VALUES
    ( 1, 1, 'Centro → ETEC, saída pela manhã',           CURDATE(),                           '07:00:00', 4, 1, 0, 1),  -- car1 HOJE   Clara (ativa)
    ( 2, 2, 'Volta ETEC → Centro (moto, 1 vaga)',        DATE_ADD(CURDATE(), INTERVAL 1 DAY), '18:30:00', 1, 1, 1, 0),  -- car2 +1d    Derick (ativa, moto)
    ( 1, 1, 'Centro → ETEC (carona finalizada)',         DATE_SUB(CURDATE(), INTERVAL 2 DAY), '07:00:00', 2, 3, 0, 0);  -- car3 -2d    Clara (finalizada)


-- =====================================================
-- 9. PONTO_ENCONTROS — partida (0) + destino (1) por carona
-- =====================================================
INSERT INTO PONTO_ENCONTROS (car_id, pon_endereco, pon_endereco_geom, pon_lat, pon_lon, pon_tipo, pon_nome, pon_ordem, pon_status) VALUES
    ( 1, 'Rua Coroados, 140, Centro, Tupã - SP',                          '-21.9326220,-50.5168850', -21.9326220, -50.5168850, 0, 'Rua Coroados, Centro',        1, 1),
    ( 1, 'Rua Bezerra de Menezes, 215, Vila Independência, Tupã - SP',    '-21.9386200,-50.5269930', -21.9386200, -50.5269930, 1, 'ETEC Prof. Massuyuki Kawano', 2, 1),
    ( 2, 'Rua Bezerra de Menezes, 215, Vila Independência, Tupã - SP',    '-21.9386200,-50.5269930', -21.9386200, -50.5269930, 0, 'ETEC Prof. Massuyuki Kawano', 1, 1),
    ( 2, 'Avenida Tamoios, Centro, Tupã - SP',                            '-21.9281990,-50.5118790', -21.9281990, -50.5118790, 1, 'Avenida Tamoios, Centro',     2, 1),
    ( 3, 'Rua Coroados, 140, Centro, Tupã - SP',                          '-21.9326220,-50.5168850', -21.9326220, -50.5168850, 0, 'Rua Coroados, Centro',        1, 1),
    ( 3, 'Rua Bezerra de Menezes, 215, Vila Independência, Tupã - SP',    '-21.9386200,-50.5269930', -21.9386200, -50.5269930, 1, 'ETEC Prof. Massuyuki Kawano', 2, 1);


-- =====================================================
-- 10. SOLICITACOES_CARONA (sol_id 1-5)
-- =====================================================
INSERT INTO SOLICITACOES_CARONA (usu_id_passageiro, car_id, sol_status, sol_vaga_soli) VALUES
    ( 5, 1, 2, 1),  -- sol1  Ana       → car1 (aceita)
    ( 6, 1, 2, 1),  -- sol2  Guilherme → car1 (aceita)
    ( 5, 2, 1, 1),  -- sol3  Ana       → car2 (pendente, moto)
    ( 5, 3, 2, 1),  -- sol4  Ana       → car3 (aceita, passada)
    ( 6, 3, 2, 1);  -- sol5  Guilherme → car3 (aceita, passada)


-- =====================================================
-- 11. CARONA_PESSOAS — passageiros confirmados (espelha os sol=2)
-- =====================================================
INSERT INTO CARONA_PESSOAS (car_id, usu_id, car_pes_data, car_pes_status) VALUES
    ( 1, 5, NOW(), 1), ( 1, 6, NOW(), 1),                                                            -- car1: Ana, Guilherme
    ( 3, 5, DATE_SUB(NOW(), INTERVAL 2 DAY), 1), ( 3, 6, DATE_SUB(NOW(), INTERVAL 2 DAY), 1);        -- car3: Ana, Guilherme (passada)


-- =====================================================
-- 12. RECALCULA car_vagas_dispo das caronas ATIVAS (= capacidade − aceitos)
-- =====================================================
UPDATE CARONAS c
JOIN VEICULOS v ON v.vei_id = c.vei_id
SET c.car_vagas_dispo = v.vei_vagas - (
        SELECT COUNT(*) FROM CARONA_PESSOAS cp
        WHERE cp.car_id = c.car_id AND cp.car_pes_status = 1
    )
WHERE c.car_status IN (1, 2);


-- =====================================================
-- 13. MENSAGENS — chat da carona ativa (men_id começa em 1)
-- =====================================================
INSERT INTO MENSAGENS (car_id, usu_id_remetente, usu_id_destinatario, men_texto, men_status, men_id_resposta) VALUES
    ( 1, 5, 3, 'Oi Clara! Confirma que passa na Rua Coroados às 07h?',      3, NULL),  -- 1 Ana → Clara
    ( 1, 3, 5, 'Confirmo, Ana! 07h em ponto.',                              3, 1),     -- 2 Clara → Ana
    ( 1, 6, 3, 'Clara, dá pra me pegar na Lélio Pizza no caminho?',         2, NULL),  -- 3 Guilherme → Clara (não lida)
    ( 3, 5, 3, 'Obrigada pela carona de ontem!',                           3, NULL),  -- 4 Ana → Clara (histórico)
    ( 3, 3, 5, 'Imagina! Quando precisar.',                                3, 4);     -- 5 Clara → Ana


-- =====================================================
-- 14. AVALIACOES — mútuas na carona FINALIZADA (car3)
-- =====================================================
INSERT INTO AVALIACOES (car_id, usu_id_avaliador, usu_id_avaliado, ava_nota, ava_comentario, ava_criado_em) VALUES
    ( 3, 5, 3, 5, 'Motorista pontual e super gente boa!',     DATE_SUB(NOW(), INTERVAL 2 DAY)),
    ( 3, 3, 5, 5, 'Passageira tranquila, recomendo.',         DATE_SUB(NOW(), INTERVAL 2 DAY)),
    ( 3, 6, 3, 4, 'Boa viagem, chegamos no horário.',         DATE_SUB(NOW(), INTERVAL 2 DAY));


-- =====================================================
-- 15. DOCUMENTOS_VERIFICACAO — sustenta os níveis de verificação
-- doc_tipo: 0=Comprovante, 1=CNH | doc_status: 0=aprovado_ocr
-- =====================================================
INSERT INTO DOCUMENTOS_VERIFICACAO (usu_id, doc_tipo, doc_arquivo, doc_ocr_confianca, doc_status, doc_enviado_em) VALUES
    ( 3, 0, 'comprovante_clara_3.pdf',     92, 0, DATE_SUB(NOW(), INTERVAL 3 MONTH)), ( 3, 1, 'cnh_clara_3.pdf',     88, 0, DATE_SUB(NOW(), INTERVAL 3 MONTH)),
    ( 4, 0, 'comprovante_derick_4.pdf',    90, 0, DATE_SUB(NOW(), INTERVAL 3 MONTH)), ( 4, 1, 'cnh_derick_4.pdf',    86, 0, DATE_SUB(NOW(), INTERVAL 3 MONTH)),
    ( 5, 0, 'comprovante_anajulia_5.pdf',  91, 0, DATE_SUB(NOW(), INTERVAL 2 MONTH)),
    ( 6, 0, 'comprovante_guilherme_6.pdf', 89, 0, DATE_SUB(NOW(), INTERVAL 2 MONTH));


-- =====================================================
-- 16. NOTIFICACOES — coerentes com as caronas
-- =====================================================
INSERT INTO NOTIFICACOES (usu_id, noti_tipo, noti_titulo, noti_mensagem, noti_lida, noti_dados, noti_remetente, noti_criada_em) VALUES
    ( 3, 'SOLICITACAO_NOVA',    'Nova solicitação de carona', 'Ana Julia pediu 1 vaga na sua carona.',             1, '{"car_id": 1}', NULL, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
    ( 5, 'SOLICITACAO_ACEITA',  'Solicitação aceita!',        'Sua vaga na carona Centro → ETEC foi confirmada.',  1, '{"car_id": 1}', NULL, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
    ( 6, 'SOLICITACAO_ACEITA',  'Solicitação aceita!',        'Sua vaga foi confirmada pela motorista.',           0, '{"car_id": 1}', NULL, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
    ( 3, 'CARONA_PROXIMA_SAIDA','Sua carona parte em breve',  'Sua carona sai em ~30 minutos. Prepare-se!',        0, '{"car_id": 1}', NULL, NOW());


-- =====================================================
-- 16-B. DENUNCIAS — relatadas no app (moderadas pelo Admin/Dev no painel)
-- den_tipo: 0=carona (car_id), 1=usuário (den_usu_alvo)
-- den_status: 0=Fechado(Resolvido), 1=Aberto, 3=Em análise, 2=Arquivado
-- den_id_resposta = usu_id de quem respondeu (Admin=2).
-- =====================================================
INSERT INTO DENUNCIAS (usu_id, den_tipo, car_id, den_usu_alvo, den_motivo, den_texto, den_data, den_status, den_id_resposta, den_resposta) VALUES
    ( 5, 1, NULL, 4, 'Atraso recorrente',         'O motorista costuma atrasar bastante e avisa em cima da hora.',        DATE_SUB(NOW(), INTERVAL 2 DAY), 3, NULL, NULL),                                  -- Ana → Derick (usuário, EM ANÁLISE)
    ( 6, 0, 3,    NULL,'Comportamento inadequado', 'O motorista foi ríspido com os passageiros durante a viagem.',         DATE_SUB(NOW(), INTERVAL 4 DAY), 0, 2,   'Conversamos com o motorista e a situação foi resolvida. Obrigado pelo aviso.');  -- Guilherme → car3 (carona, RESOLVIDA pelo Admin)


-- =====================================================
-- 17. SUGESTOES — criadas no app (geridas pelo Dev no painel)
-- sug_id_resposta = usu_id de quem respondeu (Dev=1).
-- =====================================================
INSERT INTO SUGESTOES (usu_id, sug_texto, sug_data, sug_status, sug_id_resposta, sug_resposta) VALUES
    ( 5, 'Seria útil ver a placa e o modelo do veículo antes de confirmar a carona.', DATE_SUB(NOW(), INTERVAL 2 DAY), 0, 1, 'Ótima ideia! Já está no nosso roadmap. Obrigado, Ana!'),  -- sug1 (respondida)
    ( 6, 'Poderiam adicionar um filtro de busca por bairro de Tupã.',                 DATE_SUB(NOW(), INTERVAL 1 DAY), 1, NULL, NULL);                                             -- sug2 (pendente)


-- =====================================================
-- 18. SUPORTE_MENSAGENS — HISTÓRICO do chat Admin (ETEC) ↔ Dev
-- spm_remetente: 'admin' = administrador da escola | 'dev' = desenvolvedor
-- (Aparece em Suporte.jsx — Dev vê a conversa; Admin vê pelo painel flutuante.)
-- =====================================================
INSERT INTO SUPORTE_MENSAGENS (usu_id_admin, usu_id_dev, spm_remetente, spm_texto, spm_lida, spm_criada_em) VALUES
    (2, 1, 'admin', 'Recebemos uma denúncia de um aluno sobre atraso recorrente de um motorista. Como devo proceder?', 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (2, 1, 'dev',   'Analise em Denúncias, responda ao aluno e, se for reincidente, aplique uma penalidade.',  1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (2, 1, 'admin', 'Entendi, vou acompanhar.',                                                               1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (2, 1, 'admin', 'Mais uma: como exporto o relatório de usuários da escola?',                              0, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
    (2, 1, 'dev',   'Em Relatórios → Relatório de Usuários → botão PDF. Ele já vem filtrado pela sua escola.', 0, DATE_SUB(NOW(), INTERVAL 5 HOUR));


-- =====================================================
-- 19. AUDIT_LOG — HISTÓRICO de ações (Auditoria.jsx)
-- Aba "Painel Admin/Dev": ações administrativas/autenticação (usu_id = Dev/Admin).
-- Aba "App — Usuários":    ações CARONA_*/SOLICITACAO_* (usu_id = aluno).
-- =====================================================
INSERT INTO AUDIT_LOG (tabela, registro_id, acao, dados_anteriores, dados_novos, usu_id, ip, criado_em) VALUES
    -- ── Painel (Admin/Dev) ────────────────────────────────────────────────────
    ('USUARIOS',  2, 'USUARIO_CRIAR',     NULL, '{"per_tipo": 1, "escola": "ETEC"}',          1, '189.45.10.2',   DATE_SUB(NOW(), INTERVAL 20 DAY)),  -- Dev criou o Admin
    ('ESCOLAS',   1, 'ESCOLA_ATUALIZAR',  '{"esc_max_usuarios": 300}', '{"esc_max_usuarios": 400}', 1, '189.45.10.2', DATE_SUB(NOW(), INTERVAL 18 DAY)),  -- Dev ajustou a escola
    ('ESCOLAS',   1, 'CONTRATO_RENOVAR',  NULL, '{"duracao": "5anos"}',                       1, '189.45.10.2',   DATE_SUB(NOW(), INTERVAL 15 DAY)),  -- Dev renovou contrato
    ('USUARIOS',  2, 'LOGIN',             NULL, NULL,                                         2, '177.32.8.51',   DATE_SUB(NOW(), INTERVAL 5 HOUR)),  -- Admin logou
    ('USUARIOS',  6, 'USUARIO_ATUALIZAR', NULL, '{"usu_telefone": "atualizado"}',             2, '177.32.8.51',   DATE_SUB(NOW(), INTERVAL 3 DAY)),   -- Admin editou aluno
    ('SUGESTOES', 1, 'SUGESTAO_RESPONDER',NULL, NULL,                                         1, '189.45.10.2',   DATE_SUB(NOW(), INTERVAL 2 DAY)),   -- Dev respondeu sugestão
    ('DENUNCIAS', 2, 'DENUNCIA_RESPONDER',NULL, NULL,                                         2, '177.32.8.51',   DATE_SUB(NOW(), INTERVAL 4 DAY)),   -- Admin respondeu/resolveu denúncia
    ('USUARIOS',  1, 'LOGIN',             NULL, NULL,                                         1, '189.45.10.2',   DATE_SUB(NOW(), INTERVAL 2 HOUR)),  -- Dev logou
    ('USUARIOS',  6, 'SENHA_REDEFINIR',   NULL, NULL,                                         6, '191.5.7.9',     DATE_SUB(NOW(), INTERVAL 1 DAY)),   -- Guilherme redefiniu senha
    -- ── App (alunos) ──────────────────────────────────────────────────────────
    ('CARONAS',             3, 'CARONA_CRIAR',        NULL, NULL, 3, '186.222.1.10', DATE_SUB(NOW(), INTERVAL 2 DAY)),    -- Clara criou a carona (depois finalizada)
    ('SOLICITACOES_CARONA', 4, 'SOLICITACAO_CRIAR',   NULL, NULL, 5, '189.55.2.3',   DATE_SUB(NOW(), INTERVAL 2 DAY)),    -- Ana solicitou (car3)
    ('SOLICITACOES_CARONA', 4, 'SOLICITACAO_ACEITAR', NULL, NULL, 3, '186.222.1.10', DATE_SUB(NOW(), INTERVAL 2 DAY)),    -- Clara aceitou Ana
    ('CARONAS',             3, 'CARONA_FINALIZAR',    NULL, NULL, 3, '186.222.1.10', DATE_SUB(NOW(), INTERVAL 2 DAY)),    -- Clara finalizou a carona
    ('CARONAS',             1, 'CARONA_CRIAR',        NULL, NULL, 3, '186.222.1.10', DATE_SUB(NOW(), INTERVAL 6 HOUR)),   -- Clara criou a carona de hoje
    ('CARONAS',             2, 'CARONA_CRIAR',        NULL, NULL, 4, '187.1.2.3',    DATE_SUB(NOW(), INTERVAL 5 HOUR)),   -- Derick criou a carona (moto)
    ('SOLICITACOES_CARONA', 1, 'SOLICITACAO_CRIAR',   NULL, NULL, 5, '189.55.2.3',   DATE_SUB(NOW(), INTERVAL 4 HOUR)),   -- Ana solicitou (car1)
    ('SOLICITACOES_CARONA', 2, 'SOLICITACAO_CRIAR',   NULL, NULL, 6, '191.5.7.9',    DATE_SUB(NOW(), INTERVAL 4 HOUR)),   -- Guilherme solicitou (car1)
    ('SOLICITACOES_CARONA', 1, 'SOLICITACAO_ACEITAR', NULL, NULL, 3, '186.222.1.10', DATE_SUB(NOW(), INTERVAL 3 HOUR)),   -- Clara aceitou Ana
    ('SOLICITACOES_CARONA', 2, 'SOLICITACAO_ACEITAR', NULL, NULL, 3, '186.222.1.10', DATE_SUB(NOW(), INTERVAL 3 HOUR));   -- Clara aceitou Guilherme


SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- FIM DO SEED ETEC (1 escola, 6 usuários, 3 caronas, histórico de suporte e auditoria)
-- =====================================================
