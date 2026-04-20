import React from "react";
import { useAuth } from "@/lib/AuthContext";
import SEO from "@/components/SEO";
import { ArrowRight } from "lucide-react";
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
import { Input } from "@/components/ui/input";

const SheetsIcon = () => (
    <svg className="w-10 h-10 flex-shrink-0" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#21A366" d="M28 2H10c-2.2 0-4 1.8-4 4v36c0 2.2 1.8 4 4 4h28c2.2 0 4-1.8 4-4V14L28 2z" />
        <path fill="#185C37" d="M42 14H32c-2.2 0-4-1.8-4-4V2l14 12z" />
        <path fill="#FFF" d="M12 22h24v2H12zm0 6h24v2H12zm0 6h24v2H12zm0-18h11v2H12z" />
    </svg>
);

const DriveIcon = () => (
    <svg className="w-10 h-10 flex-shrink-0" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#FFC107" d="M30.3 32.5l-6-10.4l8.2-14.1h12l-6 10.4z" />
        <path fill="#1976D2" d="M17.5 32.5l-6.2-10.7l6.2-10.7l12.4 21.4z" />
        <path fill="#4CAF50" d="M30.3 32.5H4.7l6-10.4l25.6 0z" />
    </svg>
);

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    if (!user) return null;

    const initials = user.full_name
        ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : user.email[0].toUpperCase();

    return (
        <div className="min-h-screen bg-[#fafafa] text-slate-900 selection:bg-slate-200">
            <SEO title="Settings & Profile" path="/profile" />

            {/* Top Navigation (Z-Pattern Start) */}
            <nav className="flex items-center justify-between p-8 md:p-12 max-w-7xl mx-auto w-full">
                <button
                    onClick={() => navigate("/")}
                    className="text-[11px] font-semibold  text-red-400 hover:text-slate-900 transition-colors"
                >
                    ← Back to Dashboard
                </button>
                <div className="text-[11px] font-semibold  text-primary">
                    Settings / Integrations
                </div>
            </nav>

            {/* Main Z-Pattern Flow */}
            <main className="max-w-6xl mx-auto px-8 md:px-12 mt-12 mb-32 grid grid-cols-1 lg:grid-cols-[1fr_2.5fr] gap-20 items-start">

                {/* Left Column: Core Identity */}
                <motion.aside
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-12 sticky top-20"
                >
                    <div className="space-y-6">
                        <div className="w-20 h-20 bg-slate-200 flex items-center justify-center  text-xl font-light text-slate-500 rounded-full">
                            {initials}
                        </div>
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-light  mb-2 text-slate-800">
                                {user.full_name || 'User'}
                            </h1>
                            <p className="text-slate-400 tracking-wide font-medium text-sm">
                                {user.email}
                            </p>
                        </div>
                    </div>

                    <div className="pt-8">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button className="group p-4 border border-rose-400 rounded-xl flex items-center gap-4 text-[11px] font-bold uppercase  text-rose-400 hover:text-rose-500 transition-colors">
                                    Sign Out
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-none border-slate-200">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-xl font-light">Sign Out</AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-500">
                                        Are you sure you want to end your session?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="mt-8 gap-4">
                                    <AlertDialogCancel className="rounded-none border-slate-200 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50 hover:text-slate-900">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => logout()}
                                        className="rounded-none bg-rose-500 hover:bg-rose-600 text-white font-bold uppercase tracking-widest text-[10px] border-none"
                                    >
                                        Proceed
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </motion.aside>

                {/* Right Column: Configurations (Z-Pattern End) */}
                <div className="space-y-24">

                    {/* section: custom api keys */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <h2 className="text-[11px] font-bold uppercase  text-slate-300 mb-8 border-b border-slate-200 pb-4">
                            AI Configuration
                        </h2>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 group">
                            <div className="space-y-2 max-w-sm">
                                <h3 className="text-xl font-light text-slate-800 ">Gemini AI Key</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Link your personal Gemini API key to override the system defaults and unlock advanced generation models.
                                </p>
                            </div>
                            <div className="flex w-full md:w-auto items-center gap-6">
                                <Input
                                    type="password"
                                    placeholder="Enter isolated API key"
                                    className="bg-transparent border-b border-slate-300 py-2 focus:border-slate-800 transition-colors text-sm text-slate-700 placeholder:text-slate-300"
                                />
                                <button className="text-[11px] font-bold uppercase  text-slate-400 hover:text-indigo-500 transition-colors pb-2 border-b border-transparent hover:text-primary">
                                    Save
                                </button>
                            </div>
                        </div>
                    </motion.section>

                    {/* section: integrations */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <h2 className="text-[11px] font-bold uppercase  text-slate-600 mb-8 border-b border-slate-200 pb-4">
                            Integrations & Storage
                        </h2>

                        <div className="space-y-16">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="flex items-start gap-6">
                                    <SheetsIcon />
                                    <div className="space-y-2 max-w-sm">
                                        <h3 className="text-xl font-light text-green-600 ">Google Sheets</h3>
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            Establish a connection to sync all respondent submissions to a live external spreadsheet automatically.
                                        </p>
                                    </div>
                                </div>
                                <button className="text-[11px] font-bold uppercase  text-slate-400 hover:text-emerald-500 transition-colors">
                                    Connect
                                </button>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="flex items-start gap-6">
                                    <DriveIcon />
                                    <div className="space-y-2 max-w-sm">
                                        <h3 className="text-xl font-light text-blue-600 ">Google Drive</h3>
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            Map a drive directory for automatic cold backup of heavy user-uploaded file attachments.
                                        </p>
                                    </div>
                                </div>
                                <button className="text-[11px] font-bold uppercase  text-slate-400 hover:text-blue-500 transition-colors">
                                    Connect
                                </button>
                            </div>
                        </div>
                    </motion.section>
                </div>
            </main>
        </div>
    );
}
