'use client'
import XButton from "@/components/XButton";
import XInput from "@/components/XInput";
import XPage from "@/components/XPage";

export default function Produtos(){
    function handleCreateProduct() {}
  return (
    <XPage title="Cadastrar produtos">
      <div className="flex flex-row">

        <div className="flex flex-col flex-1 m-8 max-w-md w-full">
          <h1 className="my-4 font-semibold text-lg">Cadastrar produtos</h1>

          <form onSubmit={handleCreateProduct} className="flex flex-col gap-2">
            <select
              title="Categoria"
              className="p-2 border border-zinc-200 rounded h-10"
              placeholder="Categorias"
            >
              <option disabled defaultChecked>
                Categoria
              </option>
              <option>Rosa do deserto</option>
            </select>

            <XInput type="text" required placeholder="Nome do produto" />
            <XInput type="text" required placeholder="Descrição" />
            <XInput type="text" required placeholder="Preço" />
            <XInput type="text" required placeholder="Quantidade em estoque" />
            <XInput type="" />
            <textarea
              placeholder="Observações"
              className="p-2 border border-zinc-200 rounded h-24"
              maxLength={254}
            />

            <XInput
              type="file"
              required
              placeholder="Imagem"
              accept="image/*"
              multiple
            />
            <XButton xType="Primary" type="submit" xTitle="Cadastrar" />
          </form>
        </div>
      </div>
    </XPage>
  );
};
