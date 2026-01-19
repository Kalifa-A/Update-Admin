"use client";
import { useState, useEffect } from "react";
import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  IconDashboard,
  IconListDetails,
  IconChartBar,
  IconTicket,
  IconReceiptRefund,
  IconUserShield,
  IconChartLine,
  IconUserCircle,
  IconPackage,
  IconFolder,
  IconSettings,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

/* -----------------------
   Role based access
   ----------------------- */
const accessControl = {
  admin: [
    "Dash Board",
    "Category Management",
    "Product Management",
    "Order Management",
    "Offer & Highlights",
    "Customer Management",
    "Coupan Management",
    "Admin Management",
    "Analytics",
    "Return & Refund Management",
  ],
  manager: [
    "Product Management",
    "Category Management",
    "Order Management",
    "Offer & Highlights",
    "Coupan Management",
    "Return & Refund Management",
  ],
  staff: ["Order Management", "Return & Refund Management"],
};


const fullNavMain = [
  { title: "Dash Board", url: "/dashboard", icon: IconDashboard },
  { title: "Category Management", url: "/categoryManagement", icon: IconListDetails },
  { title: "Product Management", url: "/productManagement", icon: IconChartBar },
  { title: "Order Management", url: "/orderManagement", icon: IconPackage },
  { title: "Return & Refund Management", url: "/return&refund", icon: IconReceiptRefund},
  { title: "Offer & Highlights", url: "/offer&highlights", icon: IconFolder },
  { title: "Analytics", url: "/analytics", icon: IconChartLine },
  { title: "Customer Management", url: "/customerManagement", icon: IconUserCircle },
  { title: "Coupan Management", url: "/coupanManagement", icon: IconTicket },
  { title: "Admin Management", url: "/adminManagement", icon: IconUserShield },
];

const navSecondary = [{ title: "Settings", url: "/settings", icon: IconSettings }];

export function AppSidebar(props) {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);

  // Next.js app-router path (works on client)
  let pathname;
  try {
    pathname = usePathname();
  } catch (err) {
    pathname = undefined;
  }

  // load user & role from localStorage (client-only)
  useEffect(() => {
    const storedUser = localStorage.getItem("adminUser");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setRole(parsed.role);
        setUser(parsed);
      } catch (err) {
        // ignore
      }
    }
  }, []);

  // safe current path (fall back to window on client if hook not available)
  const currentPath =
    typeof window !== "undefined" && !pathname ? window.location.pathname : pathname || "/";

  const allowedMenus = accessControl[role] || [];
  const filteredNav = fullNavMain
    .filter((item) => allowedMenus.includes(item.title))
    .map((item) => {
      // active when exact match or current path startsWith item.url (handles nested routes)
      const itemUrl = item.url || "/";
      const isActive =
        currentPath === itemUrl || (itemUrl !== "/" && currentPath.startsWith(itemUrl));
      return { ...item, active: isActive };
    });

  const defaultUser = {
    name: user?.name,
    email: user?.email,
    avatar: "/avatars/shadcn.jpg",
  };

  return (
    <Sidebar collapsible="offcanvas" {...props} className="h-full">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <span className="text-lg font-semibold tracking-tight">ThajAnwar.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="flex flex-col h-full">
        <NavMain items={filteredNav} />
        <div className="mt-auto">
          <NavSecondary items={navSecondary} className="w-full" />
        </div>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-4">
        <NavUser user={defaultUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
export default AppSidebar;