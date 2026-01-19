"use client";

import React from "react";
import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain({ items }) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url} className="mb-2">   
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                className={`transition-all ${
                  item.active
                    ? "bg-black text-white font-semibold"
                    : ""
                } py-3`}                                      
              >
                <Link
                  href={item.url}
                  aria-current={item.active ? "page" : undefined}
                  className="flex items-center gap-3"
                >
                  {item.icon && (
                    <item.icon
                      className={`${item.active ? "text-white" : ""}`}
                    />
                  )}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
