import Head from 'next/head';
import Image from 'next/image';
import React from 'react';

// import { Container } from './styles';

const Content: React.FC = () => {
  return (
    <div id="content">
      <Head>
        <title>Produtos xananas&apos; garden</title>
      </Head>

      <h1 className="m-8 font-bold text-xl">Rosas do deserto</h1>

      <div className="flex flex-col lg:max-w-[80%] gap-6 mx-8">
        <div className="flex flex-col border border-zinc-200 rounded overflow-hidden">
          <div className="flex max-h-56">
            <img
              width={200}
              src="https://imagens-revista.vivadecora.com.br/uploads/2019/08/A-beleza-majestosa-da-Rosa-do-Deserto.-Fonte-Pinterest.jpg"
              alt="rosa do desrto"
            />
            <div className="m-4 overflow-auto">
              <h1 className="font-bold text-xl">Rosa negra</h1>
              <h2 className="font-thin">Rosas do deserto</h2>
              <div className="p-2">
                <h2 className="font-semibold text-lg">R$ 50,00</h2>
                <h2 className="text-sm text-green-600 ">em 12x sem juros</h2>
              </div>
              <p>
                Adenium é um gênero de planta com flor na família Apocynum,
                Apocynaceae, descrita pela primeira vez como gênero em 1819. É
                nativa da África e Península Arábica.
              </p>
            </div>
          </div>
        </div>

        <div className="flex border border-zinc-200 rounded overflow-hidden">
          <div className="flex max-h-56">
            <img
              width={200}
              src="https://imagens-revista.vivadecora.com.br/uploads/2019/08/A-beleza-majestosa-da-Rosa-do-Deserto.-Fonte-Pinterest.jpg"
              alt="rosa do desrto"
            />
            <div className="m-4 overflow-auto">
              <h1 className="font-bold text-xl">Rosa negra</h1>
              <h2 className="font-thin">Rosas do deserto</h2>
              <div className="p-2">
                <h2 className="font-semibold text-lg">R$ 50,00</h2>
                <h2 className="text-sm text-green-600 ">em 12x sem juros</h2>
              </div>
              <p>
                Adenium é um gênero de planta com flor na família Apocynum,
                Apocynaceae, descrita pela primeira vez como gênero em 1819. É
                nativa da África e Península Arábica.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Content;
