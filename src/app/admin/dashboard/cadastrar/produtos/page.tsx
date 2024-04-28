"use client";
import XButton from "@/components/XButton";
import XInput from "@/components/XInput";
import XPage from "@/components/XPage";
import { ProductCategoriesRoutes } from "@/routes/categories.routes";
import { TProductCategory } from "@/schemas/product-category.schema";
import { Select, TextArea } from "@radix-ui/themes";
import { useEffect, useState } from "react";

export default function Produtos() {
  const [categories, setCategories] = useState<TProductCategory[]>([]);

  const productService = new ProductCategoriesRoutes();

  function fetchCategories() {
    productService.get({
      then: ({ data }) => {
        setCategories(data);
      },
    });
  }
  useEffect(fetchCategories, []);

  function handleCreateProduct() {}
  return (
    <XPage title="Cadastrar produtos">
      <div className="flex flex-row">
        <div className="flex flex-col flex-1 m-8 max-w-md w-full">
          <h1 className="my-4 font-semibold text-lg">Cadastrar produtos</h1>

          <form onSubmit={handleCreateProduct} className="flex flex-col gap-2">
            <Select.Root
              defaultValue="apple"
            >
              <Select.Trigger />
              <Select.Content>
                <Select.Group>
                  <Select.Label>Categorias</Select.Label>
                  {categories.map(({ name, id }) => (
                    <Select.Item value={id!}>{name}</Select.Item>
                  ))}
                </Select.Group>
                <Select.Separator />
              </Select.Content>
            </Select.Root>
            <select
              title="Categoria"
              className="p-2 border border-zinc-200 rounded h-10"
              placeholder="Categorias"
            >
              <option disabled defaultChecked>
                Categoria
              </option>
              {categories.map((cat) => (
                <option>{cat.name}</option>
              ))}
            </select>

            <XInput
              icon={{ name: "package" }}
              type="text"
              required
              placeholder="Nome do produto"
            />
            <XInput
              icon={{ name: "notebook-pen" }}
              type="text"
              required
              placeholder="Descrição"
            />
            <XInput
              icon={{ name: "receipt" }}
              type="text"
              required
              placeholder="Preço"
            />
            <XInput
              icon={{ name: "package-open" }}
              type="text"
              required
              placeholder="Quantidade em estoque"
            />
            <TextArea
              placeholder="Observações"
              // className="p-2 border border-zinc-200 rounded h-24"
              maxLength={254}
            />
            <XInput
              type="file"
              required
              placeholder="Imagem"
              accept="image/*"
              multiple
            />
            <XButton xType="Primary" type="submit" xTitle="Cadastrar" />
          </form>
        </div>
      </div>
    </XPage>
  );
}
