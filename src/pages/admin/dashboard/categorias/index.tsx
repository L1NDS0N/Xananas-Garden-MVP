import React from 'react';
import AdminHeader from '../../../../components/AdminHeader';
import AdminSidebar from '../../../../components/AdminSidebar';
import Button from '../../../../components/Button';
import DefaultPage from '../../../../components/DefaultPage';
import Input from '../../../../components/Input';

const Categorias: React.FC = () => {
  function handleCreateCategory() {}
  return (
    <DefaultPage title="Cadastrar categorias">
      <AdminHeader />
      <div className="flex flex-1 flex-row">
        <AdminSidebar />

        <div className="m-8 flex-1">
          <h1 className="my-4 font-semibold text-lg">Cadastrar categorias</h1>

          <form
            onSubmit={handleCreateCategory}
            className="flex flex-col flex-1 w-full max-w-md gap-2"
          >
            <Input type="text" placeholder="Nome da categoria" />
            <Button type="submit" title="Cadastrar" />
          </form>
        </div>
      </div>
    </DefaultPage>
  );
};

export default Categorias;
