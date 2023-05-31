"use client";
import LogoImg from "../../assets/Logo";

import { MagnifyingGlass } from "phosphor-react";
export default function Header() {
  return (
    <div
      className={
        "h-16 gap-6 " +
        "flex flex-1 flex-row items-center justify-around " +
        "border-solid border-b border-zinc-200 bg-zinc-100"
      }
    >
      <div className="mx-4">
        <LogoImg width={50} />
      </div>
      <div className="w-full flex justify-start">
        <div className="flex flex-row w-96 h-12 rounded">
          <MagnifyingGlass color="gray" className="self-center" size={32} />
          <input
            type="text"
            placeholder="Buscar produto"
            className="w-full mx-1 text-center rounded"
          />
        </div>
      </div>
    </div>
  );
}
