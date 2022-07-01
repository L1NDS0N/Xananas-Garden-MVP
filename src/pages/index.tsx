import type { NextPage } from 'next';
import Image from 'next/image';

import homepage from '../assets/homepage.jpg';

const Home: NextPage = () => {
  return (
    <div>
      <Image src={homepage} alt={'Initial page'} />
    </div>
  );
};

export default Home;
