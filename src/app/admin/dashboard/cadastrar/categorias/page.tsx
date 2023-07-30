"use client";

import XButton from "@/components/XButton";
import XInput from "@/components/XInput";
import XPage from "@/components/XPage";
import { TProductCategory, productCategorySchema } from "@/schemas/product-category.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

export default function Categorias() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TProductCategory>({
    resolver: zodResolver(productCategorySchema),
  });
  
  function handleCreateCategory(obj: TProductCategory) {
    console.log(obj)
    // new ProductCategoriesRoutes().post({ then: (value) => {
    //   console.log(value)
    // } });
  }

  return (
    <XPage title="Cadastrar categorias">
      <div className="m-8 flex-1">
        <h1 className="my-4 text-lg font-semibold">Cadastrar categorias</h1>

        <form
          onSubmit={handleSubmit(handleCreateCategory)}
          className="flex w-full max-w-md flex-1 flex-col gap-2"
        >
          <XInput type="text" placeholder="Nome da categoria" {...register('name')} />
          <XButton xType="Primary" type="submit" xTitle="Cadastrar" />
        </form>
      </div>
    </XPage>
  );
}
