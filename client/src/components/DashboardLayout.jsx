import { useState } from "react";
import DashboardSidebar from "../components/DashboardSidebar";

export default function AdminLayout({ title = "Dashboard", children }) {
  const [sideOpen, setSideOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar ร่วม */}
      <DashboardSidebar sideOpen={sideOpen} setSideOpen={setSideOpen} />

      {/* Main ที่ถูกดันเมื่อจอกว้าง */}
      <div className="md:ml-72 flex min-h-screen flex-col">
        {/* Topbar รวม (ใส่ไอคอนเปิดเมนูบนมือถือ) */}
        <header>
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden h-9 w-9 grid place-items-center rounded-lg border hover:bg-gray-50"
                onClick={() => setSideOpen(true)}
                aria-label="Open sidebar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 6h16M4 12h16M4 18h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <h1 className="text-lg font-semibold">{title}</h1>
            </div>
          </div>
        </header>

        {/* เนื้อหาเพจ */}
        <main className="mx-auto w-full max-w-[1440px] px-4 py-6">
          {children}
        </main>
      </div>

      {/* ฉากทึบหลัง sidebar บนมือถือ */}
      {sideOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSideOpen(false)}
        />
      )}
    </div>
  );
}
