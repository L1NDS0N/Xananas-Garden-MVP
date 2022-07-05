import React from 'react';
import Content from '../../components/Content';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';

// import { Container } from './styles';

const Catalogo: React.FC = () => {
  return (
    <div>
      <Header />
      <div className="flex">
        <Sidebar />
        <Content />
      </div>
    </div>
  );
};

export default Catalogo;
