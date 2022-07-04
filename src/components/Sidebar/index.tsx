import React from 'react';

// import { Container } from './styles';

const Sidebar: React.FC = () => {
  return (
    <div className="flex flex-col flex-1 h-screen max-w-xs pt-6 lg:ml-60">
      <div className="flex flex-col p-2 items-center justify-center">
        <div>
          <h1 className="leading-relaxed font-bold text-xl">Categorias</h1>
          <ul className="flex flex-col gap-1 pl-2">
            <li>
              <a href="#">Tudo</a>
            </li>
            <li>
              <a href="#">Rosas do deserto</a>
            </li>
            <li>
              <a href="#">Vasos plásticos</a>
            </li>
            <li>
              <a href="#">Vasos de cimento</a>
            </li>
            <li>
              <a href="#">Fertilizantes</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col p-2 items-center justify-center ">
        <div>
          <h1 className="leading-relaxed font-bold text-xl">Ordernar por</h1>
          <ul className="flex flex-col gap-1 pl-2">
            <li>
              <a href="#">Maior preço</a>
            </li>
            <li>
              <a href="#">Menor preço</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
