import { Outlet } from "react-router-dom";
import { Sidebar } from "../../widgets/sidebar/sidebar";
import { Header } from "../../widgets/header/header";
import { ToastViewport } from "../../shared/ui/toast";

export default function MainLayout() {
  return (
    // 1. Container chính: Full màn hình, không scroll ở body
    <div className="flex h-screen w-full bg-[#F8F9FC] overflow-hidden font-sans text-gray-900">
      
      {/* --- FIX SIDEBAR TẠI ĐÂY --- */}
      {/* Tạo một wrapper cố định cho Sidebar */}
      <aside className="w-72 h-full flex-shrink-0 bg-white border-r border-gray-100 flex flex-col z-20 transition-all duration-300">
        <Sidebar />
      </aside>
      {/* --------------------------- */}

      {/* 2. Khu vực nội dung bên phải (Scrollable) */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        
        {/* Wrapper cuộn: Chỉ khu vực này được cuộn */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          
          {/* Header */}
          <div className="sticky top-0 z-10 px-8 pt-8 bg-[#F8F9FC]/90 backdrop-blur-sm">
            <Header />
          </div>

          {/* Main Content */}
          <main className="p-8 pb-20">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
          
        </div>
      </div>
      <ToastViewport />
    </div>
  );
}
