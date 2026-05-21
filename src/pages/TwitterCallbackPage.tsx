import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/foreform";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

const VERIFIER_KEY = "foreform:twitter-oauth-verifier";
const REDIRECT_URI_KEY = "foreform:twitter-oauth-redirect-uri";

export default function TwitterCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Connecting your Twitter account...");

    useEffect(() => {
        const code = searchParams.get("code");
        const error = searchParams.get("error");
        const codeVerifier = localStorage.getItem(VERIFIER_KEY) || "";
        const redirectUri = localStorage.getItem(REDIRECT_URI_KEY) || "";

        if (error) {
            setStatus("error");
            setMessage(`Twitter authorization was denied: ${error}`);
            return;
        }

        if (!code || !codeVerifier) {
            setStatus("error");
            setMessage("The Twitter connection session expired. Please start again.");
            return;
        }

        (async () => {
            try {
                await base44.integrations.Twitter.callback(code, codeVerifier, redirectUri);
                localStorage.removeItem(VERIFIER_KEY);
                localStorage.removeItem(REDIRECT_URI_KEY);
                setStatus("success");
                setMessage("Twitter/X connected successfully!");
                setTimeout(() => navigate("/connectors"), 1600);
            } catch (err: any) {
                setStatus("error");
                setMessage(err?.message || "Failed to connect Twitter/X. Please try again.");
            }
        })();
    }, [navigate, searchParams]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6">
            <div className="text-center space-y-5">
                {status === "loading" && <Loader2 className="w-11 h-11 animate-spin text-muted-foreground mx-auto" />}
                {status === "success" && <CheckCircle2 className="w-11 h-11 text-emerald-500 mx-auto" />}
                {status === "error" && <XCircle className="w-11 h-11 text-rose-500 mx-auto" />}
                <p className="text-base font-medium text-foreground">{message}</p>
                {status === "error" && (
                    <button
                        onClick={() => navigate("/connectors")}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                        Back to Connectors
                    </button>
                )}
            </div>
        </div>
    );
}
