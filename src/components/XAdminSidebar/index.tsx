import Link from 'next/link';

export default function XAdminSidebar() {
  return (
    <div className="flex flex-col flex-1 h-screen max-w-xs pt-6 lg:ml-60">
      <div className="flex flex-col p-2 items-center justify-center">
        <div>
          <h1 className="leading-relaxed font-bold text-xl">Cadastrar</h1>
          <ul className="flex flex-col gap-1 pl-2">
            <li>
              <Link href="/admin/dashboard/categorias">Categorias</Link>
            </li>
            <li>
              <Link href="/admin/dashboard/produtos">Produtos</Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};