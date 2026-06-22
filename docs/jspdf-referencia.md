# jsPDF + jspdf-autotable — Referência do Projeto TucTuc

## O que são

| Biblioteca          | Versão | Função                                                  |
| ------------------- | ------ | ------------------------------------------------------- |
| **jsPDF**           | 4.x    | Cria arquivos PDF diretamente no navegador, sem backend |
| **jspdf-autotable** | 5.x    | Plugin que adiciona tabelas formatadas ao jsPDF         |

Usadas no projeto para gerar os PDFs de exportação na página **Auditoria** e nos **Relatórios**.

---

## Instalação

```bash
npm install jspdf jspdf-autotable
```

---

## Como são importadas no projeto

As bibliotecas são carregadas de forma **lazy** (somente quando o usuário clica em "Exportar PDF"), para não aumentar o tamanho do bundle inicial do site:

```javascript
// Importação lazy — só carrega quando a função é chamada
const { jsPDF } = await import("jspdf");
const { autoTable } = await import("jspdf-autotable");
```

> **Por que lazy?** jsPDF tem ~300 KB. Importar no topo do arquivo carregaria isso para todos os usuários, mesmo quem nunca exporta PDF. Com `await import(...)` dentro de uma função, o arquivo só é baixado quando necessário.

---

## Estrutura básica de um PDF

```javascript
async function exportarPdf() {
  const { jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");

  // 1. Cria o documento
  const doc = new jsPDF({
    orientation: "landscape", // 'portrait' (vertical) ou 'landscape' (horizontal)
    unit: "mm", // unidade de medida: mm, pt, cm, px
    format: "a4", // tamanho do papel
  });

  // 2. Largura da página (útil para alinhar elementos)
  const pageW = doc.internal.pageSize.getWidth();

  // 3. Escreve texto
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30); // RGB
  doc.text("Título do documento", 12, 20); // (texto, x, y) em mm

  // 4. Salva / baixa o arquivo
  doc.save("nome-do-arquivo.pdf");
}
```

---

## Desenhando formas

```javascript
// Retângulo preenchido (usado no cabeçalho verde do TucTuc)
doc.setFillColor(22, 163, 74); // verde (R, G, B)
doc.rect(0, 0, pageW, 22, "F"); // (x, y, largura, altura, 'F'=fill)

// Linha
doc.setDrawColor(200, 200, 200);
doc.line(12, 25, pageW - 12, 25); // (x1, y1, x2, y2)
```

---

## Cores e texto

```javascript
doc.setTextColor(255, 255, 255); // branco
doc.setTextColor(30, 30, 30); // quase preto

doc.setFont("helvetica", "bold"); // fonte + estilo (normal/bold/italic)
doc.setFontSize(12);

// Alinhar à direita
doc.text("Texto alinhado", pageW - 12, 13, { align: "right" });

// Alinhar ao centro
doc.text("Centralizado", pageW / 2, 50, { align: "center" });
```

---

## Tabelas com jspdf-autotable

O `autoTable` é chamado como **função independente** (não como método do doc):

```javascript
autoTable(doc, {
  // Cabeçalho da tabela
  head: [["Coluna 1", "Coluna 2", "Coluna 3"]],

  // Linhas de dados
  body: [
    ["Dado A", "Dado B", "Dado C"],
    ["Dado D", "Dado E", "Dado F"],
  ],

  // Onde a tabela começa verticalmente (em mm)
  startY: 36,

  // Estilo de todas as células
  styles: {
    fontSize: 8,
    cellPadding: 3,
  },

  // Estilo do cabeçalho
  headStyles: {
    fillColor: [22, 163, 74], // verde TucTuc
    textColor: 255, // branco
    fontStyle: "bold",
  },

  // Linhas alternadas (efeito zebra)
  alternateRowStyles: {
    fillColor: [245, 250, 246],
  },

  // Hook executado ao iniciar cada nova página do PDF
  didDrawPage: (hookData) => {
    const pageCount = doc.internal.getNumberOfPages();
    const pageH = doc.internal.pageSize.getHeight();

    doc.setFontSize(7);
    doc.setTextColor(130);
    doc.text(
      `Página ${hookData.pageNumber} de ${pageCount}`,
      pageW - 12,
      pageH - 6,
      { align: "right" },
    );
  },
});
```

### Propriedades úteis do autoTable

| Propriedade          | O que faz                                               |
| -------------------- | ------------------------------------------------------- |
| `head`               | Array de arrays com os títulos das colunas              |
| `body`               | Array de arrays com os dados de cada linha              |
| `startY`             | Posição Y (mm) onde a tabela começa                     |
| `styles`             | Estilo aplicado a todas as células                      |
| `headStyles`         | Estilo apenas do cabeçalho                              |
| `bodyStyles`         | Estilo apenas do corpo                                  |
| `alternateRowStyles` | Estilo das linhas pares (zebra)                         |
| `columnStyles`       | Estilo por coluna: `{ 0: { cellWidth: 40 } }`           |
| `didDrawPage`        | Callback chamado a cada nova página — usado para rodapé |
| `margin`             | Margens: `{ top: 10, right: 10, bottom: 10, left: 10 }` |

---

## Paginação automática

O autoTable **cria novas páginas automaticamente** quando os dados não cabem na página atual. O hook `didDrawPage` é chamado para cada página gerada, permitindo adicionar rodapé, número de página, etc.

---

## Exemplo completo — Padrão usado no TucTuc

```javascript
async function exportarPdfAuditoria(logs, page) {
  const { jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const agora = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // ── Cabeçalho verde ──────────────────────────────────────────
  doc.setFillColor(22, 163, 74);
  doc.rect(0, 0, pageW, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("TucTuc", 12, 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Gerado em ${agora}`, pageW - 12, 13, { align: "right" });

  // ── Título ───────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Auditoria — Logs do Painel", 12, 31);

  // ── Tabela ───────────────────────────────────────────────────
  autoTable(doc, {
    head: [["Data/Hora", "Administrador", "Escola", "Ação", "Registro"]],
    body: logs.map((log) => [
      new Date(log.criado_em).toLocaleString("pt-BR"),
      log.admin_nome ?? "—",
      log.admin_escola ?? "—",
      log.acao,
      log.alvo_nome ?? log.registro_nome ?? "—",
    ]),
    startY: 36,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 250, 246] },
    didDrawPage: (hookData) => {
      const count = doc.internal.getNumberOfPages();
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFontSize(7);
      doc.setTextColor(130);
      doc.setFont("helvetica", "normal");
      doc.text(`Total: ${logs.length} registros`, 12, pageH - 6);
      doc.text(
        `Página ${hookData.pageNumber} de ${count}`,
        pageW - 12,
        pageH - 6,
        { align: "right" },
      );
    },
  });

  doc.save(`auditoria-p${page}.pdf`);
}
```

---

## Onde é usado no projeto

| Arquivo                                                 | Função exportada                                |
| ------------------------------------------------------- | ----------------------------------------------- |
| [src/pages/Auditoria.jsx](../src/pages/Auditoria.jsx)   | `handleExportPdf()` — exporta logs da aba ativa |
| [src/pages/Relatorios.jsx](../src/pages/Relatorios.jsx) | Geração de relatórios em PDF                    |

---

## Referências oficiais

- Documentação jsPDF: https://artskydj.github.io/jsPDF/docs/
- Documentação jspdf-autotable: https://github.com/simonbengtsson/jsPDF-AutoTable
