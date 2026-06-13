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
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const Sidebar = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menus = [
    { label: "Dashboard",   path: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "STAFF"] },
    { label: "ลูกค้า",      path: "/patients",  icon: Users,            roles: ["ADMIN", "STAFF"] },
    { label: "การจอง",      path: "/bookings",  icon: CalendarDays,     roles: ["ADMIN", "STAFF"] },
    { label: "หมอ",         path: "/doctors",   icon: Stethoscope,      roles: ["ADMIN"] },
    { label: "สาขา",        path: "/branches",  icon: GitBranch,        roles: ["ADMIN"] },
    { label: "รายงาน",      path: "/reports",   icon: ClipboardList,    roles: ["ADMIN"] },
    { label: "ตารางเวลา",   path: "/schedules", icon: Clock,            roles: ["ADMIN"] },
    { label: "หัตถการ",     path: "services",   icon: Syringe,          roles: ["ADMIN"] },
    { label: "ผู้ใช้งาน",   path: "/users",     icon: UserCog,          roles: ["ADMIN"] },
  ];

  const filteredMenus = menus.filter((menu) => menu.roles.includes(user?.role));

  return (
    <aside
      className={cn(
        "bg-primary flex flex-col transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-56",
      )}
    >
      {/* Logo + toggle */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-primary-foreground/10">
        {!collapsed && (
          <span className="font-bold text-primary-foreground text-lg tracking-tight">
            Clinic
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          aria-label={collapsed ? "ขยายเมนู" : "ย่อเมนู"}
          className="min-h-[44px] min-w-[44px] text-primary-foreground/60 hover:bg-white/10 hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {filteredMenus.map((menu) => (
          <NavLink
            key={menu.path}
            to={menu.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 min-h-[44px] rounded-lg text-sm transition-colors duration-150",
                "focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
                isActive
                  ? "bg-white/15 text-primary-foreground font-semibold"
                  : "text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground",
              )
            }
          >
            <menu.icon size={18} className="shrink-0" />
            {!collapsed && <span>{menu.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info + Logout */}
      <div className="px-2 py-4 border-t border-primary-foreground/10">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 mb-3 pb-3 border-b border-primary-foreground/10">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium text-primary-foreground truncate">
                {user?.name}
              </p>
              <p className="text-xs text-primary-foreground/60">{user?.role}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 min-h-[44px] rounded-lg text-sm w-full justify-start",
            "text-red-300 hover:bg-white/10 hover:text-red-200",
            "focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
          )}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>ออกจากระบบ</span>}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
