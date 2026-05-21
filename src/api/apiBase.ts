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

function isPrivateNetworkHost(hostname: string) {
    return (
        isLocalHost(hostname) ||
        /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
    );
}

function isLocalApiBase(value: string) {
    try {
        return isLocalHost(new URL(value).hostname);
    } catch {
        return false;
    }
}

function localApiForCurrentHost() {
    return `${window.location.protocol}//${window.location.hostname}:8000/api`;
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

    const isLocalFrontend = isPrivateNetworkHost(window.location.hostname);

    if (configuredBase) {
        if (!isLocalFrontend && isLocalApiBase(configuredBase)) {
            return PRODUCTION_API_BASE;
        }
        if (isLocalFrontend && isLocalApiBase(configuredBase) && !isLocalHost(window.location.hostname)) {
            return localApiForCurrentHost();
        }
        return configuredBase;
    }

    if (isLocalFrontend) {
        return isLocalHost(window.location.hostname) ? LOCAL_API_BASE : localApiForCurrentHost();
    }

    return PRODUCTION_API_BASE;
}

export const API_BASE = resolveApiBase();
