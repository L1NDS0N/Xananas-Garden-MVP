import XAdminHeader from "@/components/XAdminHeader";
import XPage from "@/components/XPage";
import XSidebar from "@/components/XSidebar";

export default function AdminDashboardLayout(
  {
    children,
  }: {
    children: React.ReactNode;
  }
)
{
  const items = [
    {href:"/admin/dashboard/cadastrar/categorias", name: "Categorias"},
    {href:"/admin/dashboard/cadastrar/produtos", name: "Produtos"},
  ]
    return (
      <XPage title="Dashboard">

          <XAdminHeader/>
          <div className="flex h-full w-full">
          <XSidebar title="Cadastrar" items={items} />
          {children}
          </div>
        </XPage>
      );
}

