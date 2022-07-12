import React from 'react';
import AdminHeader from '../../../../components/AdminHeader';
import AdminSidebar from '../../../../components/AdminSidebar';
import Button from '../../../../components/Button';
import DefaultPage from '../../../../components/DefaultPage';
import Input from '../../../../components/Input';

const Produtos: React.FC = () => {
  function handleCreateProduct() {}
  return (
    <DefaultPage title="Cadastrar produtos">
      <AdminHeader />
      <div className="flex flex-row">
        <AdminSidebar />

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

            <Input type="text" required placeholder="Nome do produto" />
            <Input type="text" required placeholder="Descrição" />
            <Input type="text" required placeholder="Preço" />
            <Input type="text" required placeholder="Quantidade em estoque" />
            <Input type="" />
            <textarea
              placeholder="Observações"
              className="p-2 border border-zinc-200 rounded h-24"
              maxLength={254}
            />

            <Input
              type="file"
              required
              placeholder="Imagem"
              accept="image/*"
              multiple
            />
            <Button type="submit" title="Cadastrar" />
          </form>
        </div>
      </div>
    </DefaultPage>
  );
};

export default Produtos;
