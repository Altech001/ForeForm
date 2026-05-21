const LOCAL_API_BASE = 'http://localhost:8000/api';
const PRODUCTION_API_BASE = 'https://api.pitbox.fun/api';

function stripTrailingSlash(value: string) {
    return value.replace(/\/+$/, '');
}

function withApiPath(value: string) {
    const base = stripTrailingSlash(value);
    return base.endsWith('/api') ? base : `${base}/api`;
}

function isLocalHost(hostname: string) {
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function isLocalApiBase(value: string) {
    try {
        return isLocalHost(new URL(value).hostname);
    } catch {
        return false;
    }
}

function resolveApiBase() {
    const configuredBase = import.meta.env.VITE_API_BASE
        ? stripTrailingSlash(import.meta.env.VITE_API_BASE)
        : import.meta.env.VITE_API_URL
            ? withApiPath(import.meta.env.VITE_API_URL)
            : '';

    if (typeof window === 'undefined') {
        return configuredBase || PRODUCTION_API_BASE;
    }

    const isLocalFrontend = isLocalHost(window.location.hostname);

    if (configuredBase) {
        if (!isLocalFrontend && isLocalApiBase(configuredBase)) {
            return PRODUCTION_API_BASE;
        }
        return configuredBase;
    }

    return isLocalFrontend ? LOCAL_API_BASE : PRODUCTION_API_BASE;
}

export const API_BASE = resolveApiBase();
