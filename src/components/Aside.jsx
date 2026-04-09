export default function Aside() {
  const navegacao = [
    {
      title: "Exemplo 1",
      categoria: [{ id: 1, Image: "", title: "função 1" }],
      categoria: [{ id: 1, Image: "", title: "função 2" }],
      categoria: [{ id: 1, Image: "", title: "função 3" }],
    },
  ];
  return (
    <>
      <section className="ferramentas">
        {navegacao.map((item) => (
          <div>
            <h1>{item.title}</h1>
            <div>
              {item.categoria.map((conteudo) => (
                <a href="#">{conteudo.title}</a>
              ))}
            </div>
          </div>
        ))}
      </section>
      <section className="perfil">
        <div></div>
        <div></div>
      </section>
    </>
  );
}
