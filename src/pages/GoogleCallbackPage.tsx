import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/foreform";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

/**
 * /integrations/google/callback
 * Google redirects here after the user grants permission.
 * We extract the `code` and `state` (provider) from the URL, 
 * exchange them for tokens via the backend, then redirect to /profile.
 */
export default function GoogleCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const code = searchParams.get("code");
        const provider = searchParams.get("state") || "google_drive";
        const error = searchParams.get("error");

        if (error) {
            setStatus("error");
            setMessage(`Google authorization was denied: ${error}`);
            return;
        }

        if (!code) {
            setStatus("error");
            setMessage("No authorization code received from Google.");
            return;
        }

        (async () => {
            try {
                await base44.integrations.Google.callback(code, provider);
                setStatus("success");
                setMessage(
                    provider === "google_sheets"
                        ? "Google Sheets connected successfully!"
                        : "Google Drive connected successfully!"
                );
                setTimeout(() => navigate("/profile"), 2000);
            } catch (err: any) {
                setStatus("error");
                setMessage(err?.message || "Failed to connect. Please try again.");
            }
        })();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-center space-y-6 p-12"
            >
                {status === "loading" && (
                    <>
                        <Loader2 className="w-12 h-12 animate-spin text-slate-400 mx-auto" />
                        <p className="text-lg font-light text-slate-600">Connecting your Google account...</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                        <p className="text-lg font-light text-slate-800">{message}</p>
                        <p className="text-sm text-slate-400">Redirecting to settings...</p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
                        <p className="text-lg font-light text-slate-800">{message}</p>
                        <button
                            onClick={() => navigate("/profile")}
                            className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors mt-4"
                        >
                            Back to Settings
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
}
