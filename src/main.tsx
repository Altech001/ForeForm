import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { HelmetProvider } from 'react-helmet-async';
import App from "./App.tsx";
import "./index.css";

const GOOGLE_CLIENT_ID = "607016949081-pu5rdrdaobgtvgiq8q6omf05thl3avpa.apps.googleusercontent.com";

createRoot(document.getElementById("root")!).render(
    <HelmetProvider>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <App />
        </GoogleOAuthProvider>
    </HelmetProvider>
);
