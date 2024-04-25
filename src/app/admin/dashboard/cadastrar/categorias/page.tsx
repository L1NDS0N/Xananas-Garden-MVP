"use client";

import XButton from "@/components/XButton";
import XInput from "@/components/XInput";
import XPage from "@/components/XPage";

import { ProductCategoriesRoutes } from "@/routes/categories.routes";
import {
  TProductCategory,
  productCategorySchema,
} from "@/schemas/product-category.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Table } from "@radix-ui/themes";
import { ArrowLeft, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export default function Categorias() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TProductCategory>({
    resolver: zodResolver(productCategorySchema),
  });
  const productService = new ProductCategoriesRoutes();
  const [isCreating, setIsCreating] = useState(false);
  const [categories, setCategories] = useState<TProductCategory[]>([]);

  function fetchCategories() {
    productService.get({
      then: ({ data }) => {
        setCategories(data);
      },
    });
  }

  useEffect(fetchCategories, []);

  function handleCreateCategory(data: TProductCategory) {
    productService.post({
      data,
      then: () => {
        setIsCreating(false);
        fetchCategories();
      },
    });
  }

  function handleDeleteCategory({ id, name }: TProductCategory) {
    if (confirm(`Tem certeza que deseja excluir ${name}?`)) {
      productService.delete({
        id,
        then: fetchCategories,
      });
    }
  }

  const CategoriesTable = () => (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Nome</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {categories.map(({ name, id }) => (
          <Table.Row key={id}>
            <Table.Cell>{name}</Table.Cell>
            <Table.Cell>
              <div
                onClick={() => handleDeleteCategory({ id, name })}
                className="flex justify-end  cursor-pointer"
              >
                <Trash2Icon
                  className="text-red-500 rounded hover:bg-zinc-100"
                  size={20}
                />
              </div>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );

  const CategoriesCreating = () => (
    <div>
      <ArrowLeft
        className="cursor-pointer hover:bg-zinc-200 rounded-sm"
        onClick={() => setIsCreating(false)}
      />
      <h1 className="my-4 text-lg font-semibold">Cadastrar categorias</h1>
      <form
        onSubmit={handleSubmit(handleCreateCategory)}
        className="flex w-full max-w-md flex-1 flex-col gap-2"
      >
        <XInput
          type="text"
          placeholder="Nome da categoria"
          {...register("name")}
        />
        <XButton xType="Primary" type="submit" xTitle="Cadastrar" />
      </form>
    </div>
  );

  return (
    <XPage title="Cadastrar categorias">
      <div className="m-8 flex-1">
        {!isCreating && (
          <>
            <div className="flex justify-items-center">
              <XButton
                xType="Secondary"
                onClick={() => setIsCreating(true)}
                xTitle="Novo"
              ></XButton>
            </div>
            <CategoriesTable />
          </>
        )}

        {isCreating && <CategoriesCreating />}
      </div>
    </XPage>
  );
}
