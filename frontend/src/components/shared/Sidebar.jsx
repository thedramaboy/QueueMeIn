import { NavLink, useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/auth.store.js";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  GitBranch,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Clock,
  Syringe,
} from "lucide-react";

const Sidebar = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menus = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      roles: ["OWNER", "STAFF"],
    },
    {
      label: "ลูกค้า",
      path: "/patients",
      icon: Users,
      roles: ["OWNER", "STAFF"],
    },
    {
      label: "การจอง",
      path: "/bookings",
      icon: CalendarDays,
      roles: ["OWNER", "STAFF"],
    },
    {
      label: "หมอ",
      path: "/doctors",
      icon: Stethoscope,
      roles: ["OWNER"],
    },
    {
      label: "สาขา",
      path: "/branches",
      icon: GitBranch,
      roles: ["OWNER"],
    },
    {
      label: "รายงาน",
      path: "/reports",
      icon: ClipboardList,
      roles: ["OWNER"],
    },
    {
      label: "ตารางเวลา",
      path: "/schedules",
      icon: Clock,
      roles: ["OWNER"],
    },
    {
      label: "หัตถการ",
      path: "services",
      icon: Syringe,
      roles: ["OWNER"],
    },
  ];

  const filteredMenus = menus.filter((menu) => menu.roles.includes(user?.role));

  return (
    <aside
      className={`
        bg-white shadow-md flex flex-col
        transition-all duration-300
        ${collapsed ? "w-16" : "w-56"}
      `}
    >
      <div className="flex items-center justify-between px-4 py-5 border-b">
        {!collapsed && (
          <span className="font-bold text-blue-600 text-lg">Clinic</span>
        )}
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-gray-100 text-gray-500"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 py-3 border-b bg-gray-50">
          <p className="text-sm font-medium text-gray-700">{user?.name}</p>
          <p className="text-xs text-gray-400">{user?.role}</p>
        </div>
      )}

      <nav className="flex-1 py-4 space-y-1 px-2">
        {filteredMenus.map((menu) => (
          <NavLink
            key={menu.path}
            to={menu.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2 rounded-lg text-sm
              transition-colors duration-150
              ${
                isActive
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }
            `}
          >
            <menu.icon size={18} />
            {!collapsed && <span>{menu.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 py-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 w-full"
        >
          <LogOut size={18} />
          {!collapsed && <span>ออกจากระบบ</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
