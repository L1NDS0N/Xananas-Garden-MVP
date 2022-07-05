import { MagnifyingGlass } from 'phosphor-react';
import React from 'react';

import Logo from '../../assets/Logo';

const Header: React.FC = () => {
  return (
    <div
      className="flex flex-1 flex-row border-solid items-center justify-around
     border-b border-zinc-300 bg-zinc-100 h-20 gap-6"
    >
      <div className="w-full flex justify-end mx-2">
        <div className="flex flex-row w-96 h-12 rounded">
          <MagnifyingGlass color="gray" className="self-center" size={32} />
          <input
            type="text"
            className="w-full text-center rounded"
            placeholder="Buscar produto"
          />
        </div>
      </div>

      <div className="flex flex-row w-full overflow-hidden">
          <Logo width={50} />
      </div>
    </div>
  );
};

export default Header;
