-- =====================================================
-- Arquivo: insert_etec_minimo.sql
-- Descrição: Seed mínimo — uma única instituição (ETEC Prof. Massuyuki Kawano,
--            cursos de Informática) + Desenvolvedor + Administrador da escola.
--            Sem alunos, veículos ou caronas.
--            Arquivo único e autocontido — rodar após create.sql.
--
-- Conteúdo:
--   1 escola (ETEC) · 3 cursos de Informática · 2 usuários (1 Dev + 1 Admin)
--
-- Senhas (bcrypt custo 12): dev@tuctuc.com.br → Dev@1234 | gestor.* → Admin@123
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
-- 3. USUARIOS (usu_id 1-2) — Gestão: Dev e Administrador ETEC
-- =====================================================
INSERT INTO USUARIOS (usu_nome, usu_telefone, usu_matricula, usu_senha, usu_verificacao, usu_verificacao_expira, usu_status, usu_email, usu_descricao, usu_endereco, usu_endereco_geom, usu_horario_habitual, usu_lat, usu_lon) VALUES
    ('Dev Tuctuc',             '14991230001', 'DEV2026001', '$2b$12$q3F3dPiovQZcP.Ng5Wvlye/2hVN1p8/0luKbNOYlQYg79hgPNaoqC', 2, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'dev@tuctuc.com.br',          'Desenvolvedor Tuctuc — acesso total.',    'Avenida Tamoios, 100, Centro, Tupã - SP',                    '-21.9281990,-50.5118790', NULL, -21.9281990, -50.5118790),  -- 1  Dev@1234
    ('Administrador ETEC Tupã','14991230002', 'ADMETEC001', '$2b$12$IG1G1Al0Qd/ndqaJgrySNOLrLG69gXpaaCdGDsqRrdTf/H3s0UjTO', 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1, 'gestor.tupa@etec.sp.gov.br', 'Administrador da ETEC Massuyuki Kawano.', 'Rua Bezerra de Menezes, 215, Vila Independência, Tupã - SP', '-21.9375590,-50.5280040', NULL, -21.9375590, -50.5280040);  -- 2  Admin@123


-- =====================================================
-- 4. USUARIOS_REGISTROS (usu_id 1-2)
-- =====================================================
INSERT INTO USUARIOS_REGISTROS (usu_id, usu_data_login, usu_criado_em, usu_atualizado_em) VALUES
    (1, NOW(), '2026-01-02 08:00:00', NOW()),
    (2, NOW(), '2026-01-10 08:00:00', NOW());


-- =====================================================
-- 5. PERFIL (usu_id 1-2)
-- per_tipo: 2=Desenvolvedor, 1=Administrador (escopo escola)
-- =====================================================
INSERT INTO PERFIL (usu_id, per_nome, per_data, per_tipo, per_habilitado, per_escola_id, per_push_notif, per_raio_busca) VALUES
    (1, 'Dev Tuctuc',             NOW(), 2, 1, NULL, 1,  5),
    (2, 'Administrador ETEC Tupã',NOW(), 1, 1, 1,    1, 10);


SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- FIM DO SEED — 1 escola · 3 cursos · 2 usuários de gestão
-- =====================================================
