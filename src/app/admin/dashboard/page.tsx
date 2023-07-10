import XAdminHeader from "@/components/XAdminHeader";
import XAdminSidebar from "@/components/XAdminSidebar";
import XPage from "@/components/XPage";

export default function AdminDashboard()
{
    return (
        <XPage title="Dashboard">
          <XAdminHeader/>
          <XAdminSidebar/>
        </XPage>
      );
}

