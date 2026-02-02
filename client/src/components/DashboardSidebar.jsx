import { NavLink, useNavigate } from "react-router-dom";
import { logoutAdmin } from "../utils/auth";

const SidebarLink = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
        isActive
          ? "bg-indigo-600 text-white shadow"
          : "text-gray-700 hover:bg-gray-100"
      }`
    }
  >
    <span>{label}</span>
  </NavLink>
);

export default function AdminSidebar({ sideOpen, setSideOpen }) {
  const navigate = useNavigate();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 bg-white/95 backdrop-blur-md border-r shadow-lg
                  transform transition-transform duration-200
                  ${
                    sideOpen ? "translate-x-0" : "-translate-x-full"
                  } md:translate-x-0
                  flex flex-col`}
      aria-label="Sidebar"
    >
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white shadow">
          A
        </div>
        <div>
          <p className="text-sm font-semibold">Admin Panel</p>
          <p className="text-xs text-gray-500">จัดการระบบคอร์ส</p>
        </div>
        <button
          className="ml-auto md:hidden h-9 w-9 grid place-items-center rounded-lg border hover:bg-gray-50"
          onClick={() => setSideOpen(false)}
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>

      <nav className="px-3 space-y-1">
        <SidebarLink to="/admin/dashboard" label="Dashboard" />
        <SidebarLink to="/admin/members" label="Member" />
        <SidebarLink to="/admin/courses" label="Manage Courses" />
      </nav>

      {/* ปุ่มออกจากระบบชิดล่าง */}
      <div className="mt-auto p-4">
        <button
          onClick={() => {
            logoutAdmin();
            navigate("/admin/login");
          }}
          className="w-full rounded-xl border px-3 py-2 text-sm hover:bg-gray-100"
        >
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
