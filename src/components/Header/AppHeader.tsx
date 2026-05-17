import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Plus, Grid3X3 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import SideBar from "./SideBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";
import { TaskIcon } from "@/constants/Icons";

interface AppHeaderProps {
  onCreateForm?: () => void;
}

export default function AppHeader({ onCreateForm }: AppHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.full_name
    ? user.full_name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  return (
    <>
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center justify-between h-14 px-3 sm:px-4">
          {/* Left section: hamburger + logo */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5 text-foreground/70" />
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img
                src="/letter-m.png"
                alt="ForeForm Logo"
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
              />
              <span className="text-base sm:text-lg font-bold tracking-tight hidden sm:inline">
                ForeForm
              </span>
            </button>
          </div>

          {/* Right section: actions + user */}
          <div className="flex items-center gap-1 sm:gap-2">
            {onCreateForm && (
              <Button
                onClick={onCreateForm}
                size="sm"
                className="gap-1.5 h-9 px-3 rounded font-semibold text-xs sm:text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Form</span>
              </Button>
            )}

            <Button
              onClick={() => navigate("/bookmark-tasks")}
              size="sm"
              className="gap-1.5 h-9 px-3 rounded font-semibold text-xs sm:text-sm"
            >
              <TaskIcon className="w-4 h-4" />
              <span className="hidden sm:inline">My Tasks</span>
            </Button>

            {/* Apps grid button */}
            <button
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
              aria-label="Apps"
              title="ForeForm apps"
            >
              <Grid3X3 className="w-5 h-5 text-foreground/60" />
            </button>

            {/* User avatar */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="w-9 h-9 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center
                      text-sm font-bold tracking-tight hover:ring-2 hover:ring-primary/30 transition-all
                      focus:outline-none focus:ring-2 focus:ring-primary/40 shrink-0"
                    aria-label="Account menu"
                  >
                    {initials}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded p-2 border-border/60 shadow-xl backdrop-blur-md bg-card/95"
                >
                  <DropdownMenuLabel className="px-3 py-2">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-bold truncate">
                        {user.full_name || "My Account"}
                      </p>

                      <p className="text-xs text-muted-foreground truncate font-medium">
                        {user.email}
                      </p>
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
            )}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <SideBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
