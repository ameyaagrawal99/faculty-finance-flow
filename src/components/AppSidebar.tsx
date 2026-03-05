import { Calculator, BarChart3, Table2, Settings, IndianRupee, Receipt } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Calculator", url: "/", icon: Calculator },
  { title: "Compare Scenarios", url: "/compare", icon: BarChart3 },
  { title: "Pay Matrix", url: "/pay-matrix", icon: Table2 },
  { title: "Arrears", url: "/arrears", icon: Receipt },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/70">
      <SidebarHeader className="p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-black/20">
            <IndianRupee className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-sidebar-foreground">Faculty Finance Flow</h2>
              <p className="text-xs text-sidebar-foreground/65">Smart compensation toolkit</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-[0.16em]">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="rounded-lg transition-all hover:bg-sidebar-accent/60"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium shadow-sm"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 pt-2">
        {!collapsed && (
          <p className="text-xs leading-relaxed text-sidebar-foreground/45">Modernized UI · UGC 7th CPC Pay Matrix</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
