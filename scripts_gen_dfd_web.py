# -*- coding: utf-8 -*-
"""Gera DFD_Tuctuc_Web.drawio — mini-DFD por acao do PAINEL WEB (Admin/Dev).
Mesmo padrao do app: Yourdon (processo=circulo), minimalista (sem losango)."""
import html

ENTITY = "rounded=0;whiteSpace=wrap;html=1;fontSize=12;"
PROCESS = "ellipse;whiteSpace=wrap;html=1;fontSize=12;"
STORE   = "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fontSize=12;"
OUTPUT  = "shape=document;whiteSpace=wrap;html=1;boundedLbl=1;fontSize=12;"
TEXTST  = "text;html=1;align=center;verticalAlign=middle;fontSize=13;fontStyle=1;"
EDGE    = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;html=1;endArrow=classic;fontSize=11;"

SIZES = {"ent": (160, 60), "proc": (150, 100), "store": (150, 80), "out": (175, 70), "txt": (190, 30)}
STYLES = {"ent": ENTITY, "proc": PROCESS, "store": STORE, "out": OUTPUT, "txt": TEXTST}


def esc(s):
    return html.escape(str(s), quote=True)


class Page:
    def __init__(self, name):
        self.name = name
        self.cells = []
        self.n = 0

    def node(self, key, kind, label, x, y, w=None, h=None):
        dw, dh = SIZES[kind]
        w = w or dw
        h = h or dh
        self.cells.append(
            f'<mxCell id="{key}" value="{esc(label)}" style="{STYLES[kind]}" vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
        )

    def edge(self, src, tgt, label=""):
        self.n += 1
        eid = f"{self.name_id}_e{self.n}"
        self.cells.append(
            f'<mxCell id="{eid}" value="{esc(label)}" style="{EDGE}" edge="1" parent="1" '
            f'source="{src}" target="{tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>'
        )

    @property
    def name_id(self):
        return self.name.replace(" ", "_").replace("(", "").replace(")", "").replace("/", "_")

    def xml(self):
        body = "".join(self.cells)
        return (
            f'<diagram id="{self.name_id}" name="{esc(self.name)}">'
            f'<mxGraphModel dx="1100" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" '
            f'connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1100" pageHeight="850" '
            f'math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>'
            f'{body}</root></mxGraphModel></diagram>'
        )


pages = []


def P(name):
    p = Page(name)
    pages.append(p)
    return p


def basic(name, entity, inp, proc, stores, ok_label, err_label,
          ok_in="dados validos", err_in="dados invalidos"):
    p = P(name)
    pid = p.name_id
    p.node(f"{pid}_ent", "ent", entity, 40, 230)
    p.node(f"{pid}_proc", "proc", proc, 280, 210)
    p.node(f"{pid}_err", "out", err_label, 280, 40)
    y = 200
    for i, (snm, slbl) in enumerate(stores):
        p.node(f"{pid}_s{i}", "store", snm, 540, y)
        y += 130
    p.node(f"{pid}_ok", "out", ok_label, 800, 230)
    p.edge(f"{pid}_ent", f"{pid}_proc", inp)
    p.edge(f"{pid}_proc", f"{pid}_err", err_in)
    for i, (snm, slbl) in enumerate(stores):
        p.edge(f"{pid}_proc", f"{pid}_s{i}", slbl)
    p.edge(f"{pid}_proc", f"{pid}_ok", ok_in)
    return p


# ---------------------------------------------------------------- LEGENDA
p = P("0. Legenda")
pid = p.name_id
p.node(f"{pid}_ent", "ent", "Entidade", 60, 80)
p.node(f"{pid}_entT", "txt", "Entidade externa\n(quem usa o sistema)", 45, 150)
p.node(f"{pid}_proc", "proc", "Processo", 330, 70)
p.node(f"{pid}_procT", "txt", "Processo\n(acao do sistema)", 330, 180)
p.node(f"{pid}_store", "store", "BANCO", 610, 75)
p.node(f"{pid}_storeT", "txt", "Banco de dados\n(armazenamento)", 600, 180)
p.node(f"{pid}_out", "out", "Saida", 880, 80)
p.node(f"{pid}_outT", "txt", "Saida / Output\n(mensagem ao usuario)", 870, 180)
p.node(f"{pid}_a1", "txt", "Entidade", 130, 300, 120, 30)
p.node(f"{pid}_a2", "txt", "Processo", 480, 300, 120, 30)
p.edge(f"{pid}_a1", f"{pid}_a2", "Fluxo de dados (seta)")

# ---------------------------------------------------------------- 1. LOGIN DO PAINEL
p = P("1. Login do Painel")
pid = p.name_id
p.node(f"{pid}_ent", "ent", "Administrador / Desenvolvedor", 40, 230)
p.node(f"{pid}_proc", "proc", "Validar Acesso", 320, 210)
p.node(f"{pid}_s", "store", "USUARIOS", 320, 410)
p.node(f"{pid}_err", "out", "Acesso negado (sem permissao)", 600, 60)
p.node(f"{pid}_ok", "out", "Painel liberado", 600, 240)
p.edge(f"{pid}_ent", f"{pid}_proc", "e-mail + senha")
p.edge(f"{pid}_s", f"{pid}_proc", "confere senha e papel (>=1)")
p.edge(f"{pid}_proc", f"{pid}_err", "papel < 1 ou invalido")
p.edge(f"{pid}_proc", f"{pid}_ok", "Admin ou Dev")

# ---------------------------------------------------------------- 2. VER DASHBOARD
p = P("2. Ver Dashboard")
pid = p.name_id
p.node(f"{pid}_ent", "ent", "Administrador / Desenvolvedor", 40, 250)
p.node(f"{pid}_proc", "proc", "Gerar Estatisticas", 320, 230)
p.node(f"{pid}_s1", "store", "USUARIOS", 600, 120)
p.node(f"{pid}_s2", "store", "CARONAS", 600, 250)
p.node(f"{pid}_s3", "store", "SUGESTOES_DENUNCIAS", 600, 380)
p.node(f"{pid}_ok", "out", "Paineis e graficos", 860, 250)
p.edge(f"{pid}_ent", f"{pid}_proc", "abrir dashboard")
p.edge(f"{pid}_s1", f"{pid}_proc", "totais de usuarios")
p.edge(f"{pid}_s2", f"{pid}_proc", "totais de caronas")
p.edge(f"{pid}_s3", f"{pid}_proc", "totais de sugestoes/denuncias")
p.edge(f"{pid}_proc", f"{pid}_ok", "estatisticas (escopo da escola / global)")

# ---------------------------------------------------------------- 3. GERENCIAR USUARIO
basic("3. Gerenciar Usuario", "Administrador / Desenvolvedor",
      "usuario + ativar/desativar", "Atualizar Status do Usuario",
      [("USUARIOS", "atualiza status")],
      "Status atualizado", "Acao nao permitida",
      ok_in="permitido", err_in="sem permissao")

# ---------------------------------------------------------------- 4. APLICAR PENALIDADE
p = P("4. Aplicar Penalidade")
pid = p.name_id
p.node(f"{pid}_ent", "ent", "Administrador / Desenvolvedor", 40, 240)
p.node(f"{pid}_proc", "proc", "Aplicar Penalidade", 320, 220)
p.node(f"{pid}_err", "out", "Dados invalidos", 320, 50)
p.node(f"{pid}_s1", "store", "PENALIDADES", 600, 180)
p.node(f"{pid}_s2", "store", "NOTIFICACOES", 600, 320)
p.node(f"{pid}_ok", "out", "Penalidade aplicada", 860, 250)
p.edge(f"{pid}_ent", f"{pid}_proc", "usuario + tipo + duracao")
p.edge(f"{pid}_proc", f"{pid}_err", "invalidos")
p.edge(f"{pid}_proc", f"{pid}_s1", "grava penalidade")
p.edge(f"{pid}_proc", f"{pid}_s2", "avisa usuario")
p.edge(f"{pid}_proc", f"{pid}_ok", "aplicada")

# ---------------------------------------------------------------- 5. REMOVER PENALIDADE
p = P("5. Remover Penalidade")
pid = p.name_id
p.node(f"{pid}_ent", "ent", "Administrador / Desenvolvedor", 40, 240)
p.node(f"{pid}_proc", "proc", "Remover Penalidade", 320, 220)
p.node(f"{pid}_s1", "store", "PENALIDADES", 600, 180)
p.node(f"{pid}_s2", "store", "NOTIFICACOES", 600, 320)
p.node(f"{pid}_ok", "out", "Penalidade removida", 860, 250)
p.edge(f"{pid}_ent", f"{pid}_proc", "penalidade selecionada")
p.edge(f"{pid}_proc", f"{pid}_s1", "desativa (pen_ativo=0)")
p.edge(f"{pid}_proc", f"{pid}_s2", "avisa usuario")
p.edge(f"{pid}_proc", f"{pid}_ok", "removida")

# ---------------------------------------------------------------- 6. MODERAR DOCUMENTO
p = P("6. Moderar Documento")
pid = p.name_id
p.node(f"{pid}_ent", "ent", "Administrador / Desenvolvedor", 40, 240)
p.node(f"{pid}_proc", "proc", "Avaliar Documento", 320, 220)
p.node(f"{pid}_err", "out", "Documento reprovado", 320, 50)
p.node(f"{pid}_s1", "store", "DOCUMENTOS", 600, 180)
p.node(f"{pid}_s2", "store", "NOTIFICACOES", 600, 320)
p.node(f"{pid}_ok", "out", "Documento aprovado", 860, 250)
p.edge(f"{pid}_ent", f"{pid}_proc", "decisao (aprovar/reprovar)")
p.edge(f"{pid}_proc", f"{pid}_err", "reprovar")
p.edge(f"{pid}_proc", f"{pid}_s1", "atualiza status")
p.edge(f"{pid}_proc", f"{pid}_s2", "avisa usuario")
p.edge(f"{pid}_proc", f"{pid}_ok", "aprovar")

# ---------------------------------------------------------------- 7. RESPONDER DENUNCIA
p = P("7. Responder Denuncia")
pid = p.name_id
p.node(f"{pid}_ent", "ent", "Administrador / Desenvolvedor", 40, 240)
p.node(f"{pid}_proc", "proc", "Responder Denuncia", 320, 220)
p.node(f"{pid}_s1", "store", "SUGESTOES_DENUNCIAS", 600, 180)
p.node(f"{pid}_s2", "store", "NOTIFICACOES", 600, 320)
p.node(f"{pid}_ok", "out", "Denuncia respondida", 860, 250)
p.edge(f"{pid}_ent", f"{pid}_proc", "resposta")
p.edge(f"{pid}_proc", f"{pid}_s1", "atualiza/fecha")
p.edge(f"{pid}_proc", f"{pid}_s2", "avisa denunciante")
p.edge(f"{pid}_proc", f"{pid}_ok", "respondida")

# ---------------------------------------------------------------- 8. RESPONDER SUGESTAO
basic("8. Responder Sugestao", "Desenvolvedor", "resposta",
      "Responder Sugestao", [("SUGESTOES_DENUNCIAS", "grava resposta / fecha")],
      "Sugestao respondida", "Texto invalido",
      ok_in="valida", err_in="invalida")

# ---------------------------------------------------------------- 9. CADASTRAR INSTITUICAO
basic("9. Cadastrar Instituicao", "Desenvolvedor", "nome, endereco, dominio",
      "Cadastrar Instituicao", [("ESCOLAS", "grava (geocodifica + keywords OCR)")],
      "Instituicao criada", "Dados invalidos")

# ---------------------------------------------------------------- 10. CADASTRAR CURSO
basic("10. Cadastrar Curso", "Desenvolvedor", "nome, semestre",
      "Cadastrar Curso", [("CURSOS", "grava curso")],
      "Curso criado", "Dados invalidos")

# ---------------------------------------------------------------- 11. CADASTRAR ADMINISTRADOR
basic("11. Cadastrar Administrador", "Desenvolvedor", "nome, e-mail, senha, escola",
      "Cadastrar Administrador", [("USUARIOS", "cria conta (per_tipo=1)")],
      "Administrador criado", "Dados invalidos")

# ---------------------------------------------------------------- 12. GERENCIAR CONTRATO
basic("12. Gerenciar Contrato", "Desenvolvedor", "duracao, data de inicio",
      "Definir Contrato", [("ESCOLAS", "grava contrato (inicio + expira)")],
      "Contrato definido", "Dados invalidos")

# ---------------------------------------------------------------- 13. CONSULTAR / EXPORTAR AUDITORIA
p = P("13. Consultar Auditoria")
pid = p.name_id
p.node(f"{pid}_ent", "ent", "Desenvolvedor", 40, 240)
p.node(f"{pid}_proc", "proc", "Consultar Logs", 320, 220)
p.node(f"{pid}_s", "store", "AUDIT_LOG", 320, 420)
p.node(f"{pid}_ok1", "out", "Lista de logs", 600, 150)
p.node(f"{pid}_ok2", "out", "Arquivo CSV (exportar)", 600, 300)
p.edge(f"{pid}_ent", f"{pid}_proc", "filtros (acao, periodo)")
p.edge(f"{pid}_s", f"{pid}_proc", "registros de auditoria")
p.edge(f"{pid}_proc", f"{pid}_ok1", "exibir")
p.edge(f"{pid}_proc", f"{pid}_ok2", "exportar")

# ---------------------------------------------------------------- 14. CHAT DE SUPORTE
p = P("14. Chat de Suporte (Admin x Dev)")
pid = p.name_id
p.node(f"{pid}_ent", "ent", "Administrador", 40, 240)
p.node(f"{pid}_proc", "proc", "Enviar Mensagem de Suporte", 320, 220)
p.node(f"{pid}_err", "out", "Falha no envio", 320, 50)
p.node(f"{pid}_s", "store", "MENSAGENS_SUPORTE", 600, 230)
p.node(f"{pid}_ent2", "ent", "Desenvolvedor", 860, 240)
p.edge(f"{pid}_ent", f"{pid}_proc", "texto da mensagem")
p.edge(f"{pid}_proc", f"{pid}_err", "texto invalido")
p.edge(f"{pid}_proc", f"{pid}_s", "grava mensagem")
p.edge(f"{pid}_proc", f"{pid}_ent2", "mensagem entregue")

# ---------------------------------------------------------------- WRITE FILE
out = '<mxfile host="app.diagrams.net" type="device">' + "".join(pg.xml() for pg in pages) + "</mxfile>"
with open("DFD_Tuctuc_Web.drawio", "w", encoding="utf-8") as f:
    f.write(out)
print(f"OK: {len(pages)} paginas geradas -> DFD_Tuctuc_Web.drawio")
