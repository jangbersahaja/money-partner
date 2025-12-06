"use client";

import { cn } from "@/lib/utils";
import { Calendar, Home, Percent, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/plan", label: "Plan", icon: Calendar },
  { href: "/debt", label: "Debt", icon: Percent },
];

export const BottomNav = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200">
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <div
            className="flex justify-around items-center h-16"
            style={{
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                    isActive
                      ? "text-slate-900"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
                  <span
                    className={cn(
                      "text-xs",
                      isActive ? "font-semibold" : "font-medium"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
