import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, Settings, LayoutDashboard } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProfileWidget() {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    if (!isAuthenticated || !user) return null;

    // Don't show on the profile page itself or login/signup
    const isExcludedPage = ["/profile", "/login", "/signup"].includes(location.pathname);
    if (isExcludedPage) return null;

    const initials = user.full_name
        ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : user.email[0].toUpperCase();

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center border border-white/20 group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
                        <span className="text-lg font-bold tracking-tighter relative z-10">{initials}</span>
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                    </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top" className="w-56 rounded p-2 mb-2 border-border/60 shadow-xl backdrop-blur-md bg-card/95">
                    <DropdownMenuLabel className="px-3 py-2">
                        <div className="flex flex-col space-y-0.5">
                            <p className="text-sm font-bold truncate">{user.full_name || 'My Account'}</p>
                            <p className="text-xs text-muted-foreground truncate font-medium">{user.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/40 my-1" />
                    <DropdownMenuItem
                        onClick={() => navigate("/profile")}
                        className="rounded px-3 py-2 cursor-pointer focus:bg-primary/10 focus:text-primary transition-all gap-3"
                    >
                        <User className="w-4 h-4" />
                        <span className="font-semibold text-sm">View Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/40 my-1" />
                    <DropdownMenuItem
                        onClick={() => logout()}
                        className="rounded px-3 py-2 cursor-pointer focus:bg-red-500/10 focus:text-red-600 text-red-500 transition-all gap-3"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="font-semibold text-sm">Sign Out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
