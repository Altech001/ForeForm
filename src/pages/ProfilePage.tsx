import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    if (!user) return null;

    const initials = user.full_name
        ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : user.email[0].toUpperCase();

    return (
        <div className="min-h-screen bg-white text-slate-900 selection:bg-slate-100 flex flex-col">
            {/* Minimal Navigation */}
            <nav className="p-8 flex items-center justify-between relative z-10">
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate("/")}
                    className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition-colors relative z-20"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-400" />
                </motion.button>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] text-slate-300"
                >
                    Altech Technologies
                </motion.div>
            </nav>

            <main className="flex-1 flex flex-col items-center justify-center p-6 -mt-20">
                {/* Z-Pattern Focal Point */}
                <div className="max-w-md w-full space-y-12">
                    <header className="space-y-6 text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-24 h-24 rounded-full bg-slate-50 border border-slate-100 mx-auto flex items-center justify-center text-2xl font-light text-slate-400"
                        >
                            {initials}
                        </motion.div>
                        <div className="space-y-1">
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-3xl font-light tracking-tight"
                            >
                                {user.full_name || 'User'}
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-slate-400 text-sm font-medium"
                            >
                                {user.email}
                            </motion.p>
                        </div>
                    </header>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-1 border border-slate-100 rounded-xl hover:border-rose-400"
                    >
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button
                                    className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl hover:bg-red-50 text-red-500 transition-all group"
                                >
                                    <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                                    <span className="text-sm font-bold tracking-tight">Sign Out</span>
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-none border-slate-100 translate-y-[-50%]">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-xl font-light">Confirm Sign Out</AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-400">
                                        Are you sure you want to sign out? You'll need to log in again to access your forms.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="mt-6 gap-2">
                                    <AlertDialogCancel className="rounded border-slate-100 font-bold hover:bg-slate-50">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => logout()}
                                        className="rounded bg-red-500 hover:bg-red-600 text-white font-bold border-none"
                                    >
                                        Sign Out
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </motion.div>
                </div>
            </main>

            <footer className="p-12 border-t border-slate-50">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <img src="/letter-m.png" alt="Logo" className="w-6 h-6 object-contain" />
                    <span className="text-[10px] text-primary">
                        System v1.0
                    </span>
                </div>
            </footer>
        </div>
    );
}
