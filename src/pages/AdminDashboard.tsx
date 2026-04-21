import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/foreform";
import { useAuth } from "@/lib/AuthContext";
import SEO from "@/components/SEO";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    ArrowLeft,
    Users,
    FileText,
    BarChart3,
    Shield,
    ShieldCheck,
    Search,
    MoreVertical,
    UserCog,
    Trash2,
    ArrowUpCircle,
    ArrowDownCircle,
    Activity,
    TrendingUp,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Plug,
    Eye,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

type AdminTab = "overview" | "users" | "forms" | "activity";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<AdminTab>("overview");

    // If not admin, redirect
    if (user && user.role !== "admin") {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto" />
                    <h1 className="text-2xl font-bold">Access Denied</h1>
                    <p className="text-muted-foreground">You need admin privileges to access this page.</p>
                    <Button onClick={() => navigate("/")} variant="outline">← Back to Dashboard</Button>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: "overview" as AdminTab, label: "Overview", icon: BarChart3 },
        { id: "users" as AdminTab, label: "Users", icon: Users },
        { id: "forms" as AdminTab, label: "Forms", icon: FileText },
        { id: "activity" as AdminTab, label: "Activity", icon: Activity },
    ];

    return (
        <div className="min-h-screen bg-background">
            <SEO title="Admin Dashboard" path="/admin" />

            {/* Header */}
            <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="mr-1 -ml-2 rounded-full hover:bg-muted">
                            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                            </div>
                            <h1 className="text-lg sm:text-xl font-black tracking-tight">Admin Panel</h1>
                        </div>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 font-bold text-xs">
                        {user?.email}
                    </Badge>
                </div>
            </header>

            {/* Tab Nav */}
            <div className="border-b border-border/40 bg-card/40">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center gap-1 overflow-x-auto py-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {activeTab === "overview" && <OverviewTab />}
                {activeTab === "users" && <UsersTab />}
                {activeTab === "forms" && <FormsTab />}
                {activeTab === "activity" && <ActivityTab />}
            </main>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════

function OverviewTab() {
    const { data: dashboard, isLoading } = useQuery({
        queryKey: ["admin-dashboard"],
        queryFn: base44.admin.dashboard,
    });

    const { data: recentResponses } = useQuery({
        queryKey: ["admin-recent-responses"],
        queryFn: () => base44.admin.recentResponses(10),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const stats = dashboard?.stats;
    const statCards = [
        { label: "Total Users", value: stats?.total_users || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-600/10" },
        { label: "Total Forms", value: stats?.total_forms || 0, icon: FileText, color: "text-violet-600", bg: "bg-violet-600/10" },
        { label: "Total Responses", value: stats?.total_responses || 0, icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-600/10" },
        { label: "Active Integrations", value: stats?.active_integrations || 0, icon: Plug, color: "text-amber-600", bg: "bg-amber-600/10" },
    ];

    const todayCards = [
        { label: "Users Today", value: stats?.users_today || 0 },
        { label: "Forms Today", value: stats?.forms_today || 0 },
        { label: "Responses Today", value: stats?.responses_today || 0 },
    ];

    return (
        <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-card border border-border/60 rounded-xl p-5"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                                <s.icon className={`w-5 h-5 ${s.color}`} />
                            </div>
                        </div>
                        <p className="text-3xl font-black">{s.value}</p>
                        <p className="text-xs text-muted-foreground font-medium mt-1">{s.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Today */}
            <div>
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" /> Today's Activity
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    {todayCards.map((t) => (
                        <div key={t.label} className="bg-card border border-border/60 rounded-lg p-4 text-center">
                            <p className="text-2xl font-black">{t.value}</p>
                            <p className="text-[11px] text-muted-foreground font-medium">{t.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Users */}
            {dashboard?.recent_users?.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold mb-3">Recent Users</h3>
                    <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
                        {dashboard.recent_users.slice(0, 5).map((u: any) => (
                            <div key={u.id} className="flex items-center justify-between px-4 py-3 border-b border-border/30 last:border-b-0 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                        {u.full_name?.[0]?.toUpperCase() || "?"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{u.full_name}</p>
                                        <p className="text-xs text-muted-foreground">{u.email}</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className={`text-[10px] ${u.role === "admin" ? "border-primary text-primary" : ""}`}>
                                    {u.role || "user"}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Responses */}
            {recentResponses?.responses?.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold mb-3">Latest Responses</h3>
                    <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
                        {recentResponses.responses.slice(0, 5).map((r: any) => (
                            <div key={r.id} className="flex items-center justify-between px-4 py-3 border-b border-border/30 last:border-b-0 hover:bg-muted/30 transition-colors">
                                <div>
                                    <p className="text-sm font-semibold">{r.form_title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        by {r.respondent_email || r.respondent_name || "Anonymous"} · {r.answer_count} answers
                                    </p>
                                </div>
                                <p className="text-[10px] text-muted-foreground">{r.created_date ? new Date(r.created_date).toLocaleDateString() : ""}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// USERS TAB
// ═══════════════════════════════════════════════════════════════

function UsersTab() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("");
    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const { data: usersData, isLoading } = useQuery({
        queryKey: ["admin-users", page, searchQuery, roleFilter],
        queryFn: () => base44.admin.listUsers(page, searchQuery || undefined, roleFilter || undefined),
    });

    const roleUpdateMut = useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: string }) => base44.admin.updateUserRole(userId, role),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
            toast.success(data.message || "Role updated");
        },
        onError: (err: any) => toast.error(err?.message || "Failed to update role"),
    });

    const deleteUserMut = useMutation({
        mutationFn: (userId: string) => base44.admin.deleteUser(userId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
            toast.success(data.message || "User deleted");
        },
        onError: (err: any) => toast.error(err?.message || "Failed to delete user"),
    });

    const users = usersData?.users || [];
    const total = usersData?.total || 0;
    const totalPages = usersData?.pages || 1;

    const handleViewDetail = async (userId: string) => {
        try {
            const detail = await base44.admin.getUser(userId);
            setSelectedUser(detail);
            setDetailOpen(true);
        } catch {
            toast.error("Failed to load user details");
        }
    };

    return (
        <div className="space-y-6">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        className="pl-10 h-10"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Badge
                        variant={!roleFilter ? "default" : "outline"}
                        className="cursor-pointer px-3 py-1.5"
                        onClick={() => { setRoleFilter(""); setPage(1); }}
                    >All</Badge>
                    <Badge
                        variant={roleFilter === "admin" ? "default" : "outline"}
                        className={`cursor-pointer px-3 py-1.5 ${roleFilter !== "admin" ? "hover:bg-primary/5 text-primary border-primary/20" : ""}`}
                        onClick={() => { setRoleFilter("admin"); setPage(1); }}
                    >
                        <ShieldCheck className="w-3 h-3 mr-1" /> Admins
                    </Badge>
                    <Badge
                        variant={roleFilter === "user" ? "default" : "outline"}
                        className={`cursor-pointer px-3 py-1.5 ${roleFilter !== "user" ? "hover:bg-muted/50 text-muted-foreground" : ""}`}
                        onClick={() => { setRoleFilter("user"); setPage(1); }}
                    >
                        <Users className="w-3 h-3 mr-1" /> Users
                    </Badge>
                    <Badge variant="outline" className="text-muted-foreground px-3 py-1.5">{total} total</Badge>
                </div>
            </div>

            {/* Users List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-xl" />)}
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-16">
                    <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No users found</p>
                </div>
            ) : (
                <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
                    {users.map((u: any) => (
                        <div key={u.id} className="flex items-center justify-between px-4 py-3 border-b border-border/30 last:border-b-0 hover:bg-muted/30 transition-colors group">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                                    {u.full_name?.[0]?.toUpperCase() || "?"}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold truncate">{u.full_name}</p>
                                        <Badge variant="outline" className={`text-[9px] h-5 ${u.role === "admin" ? "border-primary text-primary bg-primary/5" : ""}`}>
                                            {u.role}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                </div>
                            </div>

                            <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0 mr-4">
                                <span>{u.form_count} forms</span>
                                <span>{u.response_count} responses</span>
                                <span>{u.integration_count} integrations</span>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => handleViewDetail(u.id)} className="gap-2 cursor-pointer">
                                        <Eye className="w-4 h-4" /> View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {u.role === "user" ? (
                                        <DropdownMenuItem
                                            onClick={() => roleUpdateMut.mutate({ userId: u.id, role: "admin" })}
                                            className="gap-2 cursor-pointer text-primary"
                                        >
                                            <ArrowUpCircle className="w-4 h-4" /> Promote to Admin
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem
                                            onClick={() => roleUpdateMut.mutate({ userId: u.id, role: "user" })}
                                            className="gap-2 cursor-pointer text-amber-600"
                                        >
                                            <ArrowDownCircle className="w-4 h-4" /> Demote to User
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                                                <Trash2 className="w-4 h-4" /> Delete User
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete {u.full_name}?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete the user, all their forms, responses, and integrations. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => deleteUserMut.mutate(u.id)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Delete Permanently
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* User Detail Dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{selectedUser?.user?.full_name || "User Details"}</DialogTitle>
                        <DialogDescription>{selectedUser?.user?.email}</DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <p className="text-xl font-black">{selectedUser.total_forms}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium">Forms</p>
                                </div>
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <p className="text-xl font-black">{selectedUser.total_responses}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium">Responses</p>
                                </div>
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <p className="text-xl font-black">{selectedUser.integrations?.length || 0}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium">Integrations</p>
                                </div>
                            </div>

                            {selectedUser.forms?.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Forms</p>
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {selectedUser.forms.map((f: any) => (
                                            <div key={f.id} className="flex items-center justify-between text-sm px-2 py-1.5 hover:bg-muted/30 rounded">
                                                <span className="truncate">{f.title}</span>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[9px] h-5">{f.status}</Badge>
                                                    <span className="text-xs text-muted-foreground">{f.response_count} resp.</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedUser.integrations?.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Integrations</p>
                                    <div className="space-y-1">
                                        {selectedUser.integrations.map((i: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between text-sm px-2 py-1.5">
                                                <span>{i.provider}</span>
                                                <span className="text-xs text-muted-foreground">{i.connected_email}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// FORMS TAB
// ═══════════════════════════════════════════════════════════════

function FormsTab() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [page, setPage] = useState(1);

    const { data: formsData, isLoading } = useQuery({
        queryKey: ["admin-forms", page, searchQuery, statusFilter],
        queryFn: () => base44.admin.listForms(page, searchQuery || undefined, statusFilter || undefined),
    });

    const forms = formsData?.forms || [];
    const total = formsData?.total || 0;
    const totalPages = Math.ceil(total / 20) || 1;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search forms..."
                        className="pl-10 h-10"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    />
                </div>
                <div className="flex items-center gap-2">
                    {["", "draft", "published", "closed"].map((s) => (
                        <Badge
                            key={s}
                            variant={statusFilter === s ? "default" : "outline"}
                            className="cursor-pointer px-3 py-1.5"
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                        >
                            {s || "All"}
                        </Badge>
                    ))}
                    <Badge variant="outline" className="text-muted-foreground px-3 py-1.5">{total} total</Badge>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-xl" />)}
                </div>
            ) : forms.length === 0 ? (
                <div className="text-center py-16">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No forms found</p>
                </div>
            ) : (
                <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
                    {forms.map((f: any) => (
                        <div key={f.id} className="flex items-center justify-between px-4 py-3 border-b border-border/30 last:border-b-0 hover:bg-muted/30 transition-colors">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold truncate">{f.title}</p>
                                    <Badge variant="outline" className={`text-[9px] h-5 ${f.status === "published" ? "border-emerald-500 text-emerald-600" :
                                        f.status === "closed" ? "border-red-500 text-red-600" : ""
                                        }`}>{f.status}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{f.created_by} · {f.response_count} responses</p>
                            </div>
                            <p className="text-xs text-muted-foreground shrink-0">
                                {f.created_date ? new Date(f.created_date).toLocaleDateString() : ""}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// ACTIVITY TAB
// ═══════════════════════════════════════════════════════════════

function ActivityTab() {
    const [page, setPage] = useState(1);

    const { data: logData, isLoading } = useQuery({
        queryKey: ["admin-activity-log", page],
        queryFn: () => base44.admin.activityLog(page),
    });

    const logs = logData?.logs || [];
    const total = logData?.total || 0;
    const totalPages = Math.ceil(total / 30) || 1;

    const getActionColor = (action: string) => {
        if (action.includes("delete")) return "text-red-600 bg-red-600/10";
        if (action.includes("promote") || action.includes("admin")) return "text-primary bg-primary/10";
        if (action.includes("demote") || action.includes("user")) return "text-amber-600 bg-amber-600/10";
        return "text-muted-foreground bg-muted";
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" /> Admin Activity Log
                </h3>
                <Badge variant="outline" className="text-muted-foreground px-3 py-1.5">{total} entries</Badge>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted/50 animate-pulse rounded-xl" />)}
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-16">
                    <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No activity recorded yet</p>
                </div>
            ) : (
                <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
                    {logs.map((log: any) => (
                        <div key={log.id} className="flex items-start gap-3 px-4 py-3 border-b border-border/30 last:border-b-0 hover:bg-muted/30 transition-colors">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${getActionColor(log.action)}`}>
                                <Activity className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold">{log.action}</p>
                                <p className="text-xs text-muted-foreground">
                                    by <span className="font-medium">{log.admin_email}</span>
                                    {log.target_user_email && <> → <span className="font-medium">{log.target_user_email}</span></>}
                                </p>
                                {log.details && <p className="text-xs text-muted-foreground/70 mt-0.5">{log.details}</p>}
                            </div>
                            <p className="text-[10px] text-muted-foreground shrink-0">
                                {log.timestamp ? new Date(log.timestamp).toLocaleString() : ""}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
