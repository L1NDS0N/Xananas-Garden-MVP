'use client'

import XButton from "@/components/XButton";
import XInput from "@/components/XInput";
import XPage from "@/components/XPage";


export default function Categorias(){
  function handleCreateCategory() {}
  return (
    <XPage title="Cadastrar categorias">
              <div className="m-8 flex-1">
          <h1 className="my-4 font-semibold text-lg">Cadastrar categorias</h1>

          <form
            onSubmit={handleCreateCategory}
            className="flex flex-col flex-1 w-full max-w-md gap-2"
          >
            <XInput type="text" placeholder="Nome da categoria" />
            <XButton xType="Primary" type="submit" xTitle="Cadastrar" />
          </form>
        </div>
    </XPage>
  );
};
