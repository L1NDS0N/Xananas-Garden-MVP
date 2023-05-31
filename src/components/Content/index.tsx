import { MessageCircle } from "lucide-react";
import Head from "next/head";
import { DADOS } from "../../faker/catalogo-fake";

interface ICategory {
  category: string;
}

export default function Content({ category }: ICategory) {
  const content = DADOS;

  return (
    <>
      <Head>
        <title>Produtos xananas&apos; garden</title>
      </Head>
      <section data-id="content overflow-auto">
        <div className="m-8">
          <h1 className="text-xl font-bold">{category}</h1>
        </div>

        <div className="overflow-y m-4 grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {content.map((data) => (
            <div
              key={data.nome}
              title="Atualmente, o nosso sistema suporta apenas solicitações via Whatsapp."
              className="flex flex-col"
            >
              <a
                href="#"
                className="group rounded border border-zinc-200 hover:shadow-lg"
              >
                <div className="flex xs:flex-col xs:items-center md:flex-row md:items-start">
                  <img
                    className="group-hover:shadow-xl xs:w-52 md:aspect-[3/4] md:w-40"
                    src={data.image.url}
                    alt={data.image.alt}
                  />
                  <div className="m-4">
                    <h1 className="text-xl font-bold">{data.nome}</h1>
                    <h2 className="font-thin">{data.descricao}</h2>
                    <div className="flex justify-between p-2">
                      <div className="flex flex-col">
                        <h2 className="text-lg font-semibold">{data.preço}</h2>
                        <h2 className="text-sm text-green-500">
                          {data.parcelas}
                        </h2>
                      </div>
                      <a
                        href="#"
                        title="Solicitar via whatsapp"
                        className="invisible flex h-8 w-8 items-center justify-center rounded-full hover:bg-green-400/50 group-hover:visible"
                      >
                        <div className="text-green-600">
                          <MessageCircle size={30} />
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
