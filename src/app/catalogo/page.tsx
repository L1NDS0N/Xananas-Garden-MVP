"use client";

import Content from "@/components/XContent";
import XSidebar from "@/components/XSidebar";
import { useState } from "react";

export default function Catalogo() {
  const [category, setCategory] = useState("");

  const items = [
    { name: "Todos" },
    { name: "Rosas do deserto" },
    { name: "Vasos plásticos" },
    { name: "Vasos de cimento" },
    { name: "Fertilizantes" },
  ];

  return (
    <>
      <XSidebar
        title="Categorias"
        onSelect={({ name }) => setCategory(name)}
        items={items}
      />
      <Content category={category} />;
    </>
  );
}
