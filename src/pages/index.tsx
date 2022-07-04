import type { NextPage } from 'next';
import Content from '../components/Content';

import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const Home: NextPage = () => {
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

export default Home;
