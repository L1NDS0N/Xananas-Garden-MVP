import Head from 'next/head';
import React from 'react';

import Logo from '../../../assets/Logo';

const Login: React.FC = () => {
  return (
    <>
      <Head>
        <title>Login - autentique-se no sistema</title>
      </Head>
      <div className="flex flex-col h-screen bg-zinc-100 items-center justify-center">
        <div className="flex flex-1 w-96 max-w-2xl bg-white mx-auto max-h-80 rounded-lg">
          <div className="flex flex-1 flex-col items-center justify-center p-6 gap-2">
            <Logo width={100} className="mb-4" />
            <form className="flex flex-col gap-2 w-full">
              <input
                type="text"
                className="p-2 border border-zinc-200 rounded h-10"
                placeholder="Usuário"
              />
              <input
                type="password"
                className="p-2 border border-zinc-200 rounded h-10"
                placeholder="Senha"
              />
              <button
                type="submit"
                className="bg-[#de818dcc] rounded-sm h-10 text-white hover:bg-[#de818d] transition-colors"
              >
                Entrar
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
