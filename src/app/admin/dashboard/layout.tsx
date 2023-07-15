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
    return (
      <XPage title="Dashboard">

          <XAdminHeader/>
          <div className="flex h-full">
          <XSidebar title="Cadastrar" items={[{name: 'teste', href: '#'}]} />
          {children}
          </div>
        </XPage>
      );
}

