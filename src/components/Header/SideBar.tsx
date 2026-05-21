import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Icon from "@/service/icon";
import { useAuth } from "@/lib/useAuth";
import { CalenderIcon, FCloud } from "@/constants/Icons";

interface SideBarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface NavItem {
    label: string;
    icon: React.ReactNode;
    path: string;
    iconColor?: string;
}

const primaryNavItems: NavItem[] = [
    {
        label: "My Forms",
        icon: <Icon name="form" size={20} />,
        path: "/",
        iconColor: "text-zinc-600",
    },
    {
        label: "Templates",
        icon: <Icon name="template" size={20} />,
        path: "/#templates",
        iconColor: "text-zinc-600",
    },
    {
        label: "Super AI Agent",
        icon: <Icon name="ai" size={20} />,
        path: "/agent",
        iconColor: "text-zinc-600",
    },
    {
        label: "Connectors",
        icon: <Icon name="connectors" size={20} />,
        path: "/connectors",
        iconColor: "text-zinc-500",
    },
        {
        label: "My Schedules",
        icon: <CalenderIcon className="w-5 h-5 invert text-black"/>,
        path: "/schedules",
        iconColor: "text-zinc-500",
    },
];

const secondaryNavItems: NavItem[] = [
    {
        label: "F-Cloud",
        icon: <FCloud className="w-5 h-5" />,
        path: "/bookmark-documents",
        iconColor: "text-sky-500",
    },
];


export default function SideBar({ isOpen, onClose }: SideBarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const handleNavigate = (path: string) => {
        if (path === "/#templates") {
            navigate("/");
            // Trigger templates open via a custom event
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent("open-templates"));
            }, 100);
        } else {
            navigate(path);
        }
        onClose();
    };

    const isActive = (path: string) => {
        if (path === "/") return location.pathname === "/";
        return location.pathname.startsWith(path);
    };

    const renderNavItem = (item: NavItem) => {
        const active = isActive(item.path);
        return (
            <button
                key={item.label}
                onClick={() => handleNavigate(item.path)}
                className={`
          w-full flex items-center gap-4 px-4 py-2.5 rounded text-sm font-medium
          transition-all duration-150 ease-in-out group
          ${active
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground/80 hover:bg-muted/60"
                    }
        `}
            >
                <span className={`shrink-0 ${active ? "text-primary" : item.iconColor || "text-muted-foreground"}`}>
                    {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
            </button>
        );
    };

    return (
        <>
            {/* Backdrop overlay */}
            <div
                className={`
          fixed inset-0 z-40 bg-black/30 backdrop-blur-[5px]
          transition-opacity duration-300 shadow-md
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
                onClick={onClose}
            />

            {/* Sidebar panel */}
            <aside
                className={`
          fixed top-0 left-0 z-50 h-full w-[280px] bg-white
          border-r border-black/40 shadow-2xl
          flex flex-col custom-scrollbar
          transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
            >
                {/* Sidebar header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
                    <div className="flex items-center gap-2">
                        <img
                            src="/letter-m.png"
                            alt="ForeForm Logo"
                            className="w-8 h-8 object-contain"
                        />
                        <span className="text-base font-bold tracking-tight text-foreground/90">
                            ForeForm
                        </span>
                    </div>
                </div>

                {/* Primary nav */}
                <nav className="flex-1 overflow-y-auto py-3 px-2">
                    <div className="space-y-0.5">
                        {primaryNavItems.map(renderNavItem)}
                    </div>
                </nav>

                <nav className="flex-1  py-3 px-2 border-t">
                    <div className="space-y-0.5">
                        {secondaryNavItems.map(renderNavItem)}
                    </div>
                </nav>


                {/* Sidebar footer */}
                <div className="border-t border-border/30 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <a href="#" className="hover:text-primary transition-colors">
                            Privacy Policy
                        </a>
                        <span>•</span>
                        <a href="#" className="hover:text-primary transition-colors">
                            Terms of Service
                        </a>
                    </div>
                </div>
            </aside>
        </>
    );
}
