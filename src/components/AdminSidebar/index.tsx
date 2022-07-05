import React from 'react';

const AdminSidebar: React.FC = () => {
  return (
    <div className="flex flex-col flex-1 h-screen max-w-xs pt-6 lg:ml-60">
      <div className="flex flex-col p-2 items-center justify-center">
        <div>
          <h1 className="leading-relaxed font-bold text-xl">Cadastrar</h1>
          <ul className="flex flex-col gap-1 pl-2">
            <li>
              <a href="/admin/dashboard/categorias">Categorias</a>
            </li>
            <li>
              <a href="/admin/dashboard/produtos">Produtos</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
