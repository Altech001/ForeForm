/* eslint-disable @typescript-eslint/no-explicit-any */
import { appParams } from '@/lib/app-params';
import { API_BASE } from './apiBase';

export { API_BASE };

const CURRENT_USER_CACHE_KEY = 'foreform:current-user';
const CURRENT_USER_CACHE_TTL_MS = 1000 * 60 * 15;

export function getToken() {
    try {
        return localStorage.getItem('access_token') || appParams.token;
    } catch {
        return appParams.token;
    }
}

function setToken(token: string) {
    try {
        localStorage.setItem('access_token', token);
    } catch {
        // Without local storage the token cannot persist, but the login request still resolves.
    }
}

function clearToken() {
    try {
        localStorage.removeItem('access_token');
        localStorage.removeItem('token');
        localStorage.removeItem('base44_access_token');
    } catch {
        // Nothing else to clear when storage is unavailable.
    }
}

type CachedCurrentUser = {
    token: string | null;
    user: any;
    cachedAt: number;
};

let currentUserRequest: Promise<any> | null = null;

function readCurrentUserCache(options: { allowExpired?: boolean } = {}) {
    try {
        const raw = localStorage.getItem(CURRENT_USER_CACHE_KEY);
        if (!raw) return null;

        const cached = JSON.parse(raw) as CachedCurrentUser;
        if (!cached?.user || cached.token !== getToken()) return null;

        const isFresh = Date.now() - cached.cachedAt < CURRENT_USER_CACHE_TTL_MS;
        if (!options.allowExpired && !isFresh) return null;

        return cached.user;
    } catch {
        localStorage.removeItem(CURRENT_USER_CACHE_KEY);
        return null;
    }
}

function writeCurrentUserCache(user: any) {
    try {
        const cached: CachedCurrentUser = {
            token: getToken(),
            user,
            cachedAt: Date.now(),
        };
        localStorage.setItem(CURRENT_USER_CACHE_KEY, JSON.stringify(cached));
    } catch {
        // Storage can be unavailable in private contexts; auth still works without the cache.
    }
}

function clearCurrentUserCache() {
    currentUserRequest = null;
    try {
        localStorage.removeItem(CURRENT_USER_CACHE_KEY);
    } catch {
        // Ignore storage failures; clearing the in-memory request is enough for this session.
    }
}

async function getCurrentUser(options: { force?: boolean } = {}) {
    if (!options.force) {
        const cachedUser = readCurrentUserCache();
        if (cachedUser) return cachedUser;
    }

    if (currentUserRequest) return currentUserRequest;

    const requestToken = getToken();

    const request = fetchApi('/auth/me')
        .then((user) => {
            if (getToken() === requestToken) {
                writeCurrentUserCache(user);
            }
            return user;
        })
        .finally(() => {
            if (currentUserRequest === request) {
                currentUserRequest = null;
            }
        });

    currentUserRequest = request;
    return currentUserRequest;
}

async function fetchApi(endpoint: string, options: RequestInit = {}) {
    const token = getToken();
    const headers = new Headers(options.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw { status: res.status, data: errData, message: errData.detail || 'API Error' };
    }

    if (res.status === 204) return null;
    return await res.json();
}

export const base44 = {
    auth: {
        me: (options?: { force?: boolean }) => getCurrentUser(options),
        getCachedUser: (options?: { allowExpired?: boolean }) => readCurrentUserCache(options),
        clearUserCache: clearCurrentUserCache,
        login: async (email: string, password: string) => {
            const data = await fetchApi('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            clearCurrentUserCache();
            setToken(data.access_token);
            return data;
        },
        googleLogin: async (token: string) => {
            const data = await fetchApi('/auth/google', {
                method: 'POST',
                body: JSON.stringify({ token })
            });
            clearCurrentUserCache();
            setToken(data.access_token);
            return data;
        },
        register: (email: string, full_name: string, password: string) => fetchApi('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, full_name, password })
        }),
        logout: (redirectUrl?: string) => {
            clearToken();
            clearCurrentUserCache();
            window.location.href = redirectUrl || '/login';
        },
        redirectToLogin: (currentUrl?: string) => {
            clearToken();
            clearCurrentUserCache();
            window.location.href = '/login'; 
        }
    },
    entities: {
        Form: {
            list: () => fetchApi('/forms/'),
            filter: async (opts: any) => {
                if (opts.id) {
                    return [await fetchApi(`/forms/${opts.id}`)];
                }
                return await fetchApi('/forms/');
            },
            create: (data: any) => fetchApi('/forms/', { method: 'POST', body: JSON.stringify(data) }),
            update: (id: string, data: any) => fetchApi(`/forms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
            delete: (id: string) => fetchApi(`/forms/${id}`, { method: 'DELETE' })
        },
        FormResponse: {
            filter: async (opts: any) => {
                if (opts.form_id) {
                    return await fetchApi(`/forms/${opts.form_id}/responses`);
                }
                if (opts.id) {
                    return [await fetchApi(`/responses/${opts.id}`)];
                }
                return [];
            },
            create: (data: any) => fetchApi(`/forms/${data.form_id}/responses`, { method: 'POST', body: JSON.stringify(data) }),
            releaseGrades: (id: string) => fetchApi(`/responses/${id}/release-grades`, { method: 'PATCH' })
        },
        FormShare: {
            filter: async (opts: any) => {
                if (opts.form_id) {
                    return await fetchApi(`/forms/${opts.form_id}/shares`);
                }
                return [];
            },
            create: (data: any) => fetchApi(`/forms/${data.form_id}/shares`, { method: 'POST', body: JSON.stringify(data) }),
            update: (id: string, data: any) => fetchApi(`/shares/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
            delete: (id: string) => fetchApi(`/shares/${id}`, { method: 'DELETE' })
        },
        Task: {
            list: () => fetchApi('/tasks'),
            filter: async (opts: any) => {
                if (opts.id) {
                    return [await fetchApi(`/tasks/${opts.id}`)];
                }
                return await fetchApi('/tasks');
            },
            create: (data: any) => fetchApi('/tasks/', { method: 'POST', body: JSON.stringify(data) }),
            update: (id: string, data: any) => fetchApi(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
            delete: (id: string) => fetchApi(`/tasks/${id}`, { method: 'DELETE' }),
            comment: (id: string, text: string) => fetchApi(`/tasks/${id}/comments`, { method: 'POST', body: JSON.stringify({ text }) }),
            setAssignees: (id: string, emails: string[]) => fetchApi(`/tasks/${id}/assignees`, { method: 'PUT', body: JSON.stringify({ emails }) }),
            addAssignees: (id: string, emails: string[]) => fetchApi(`/tasks/${id}/assignees/add`, { method: 'POST', body: JSON.stringify({ emails }) }),
            removeAssignees: (id: string, emails: string[]) => fetchApi(`/tasks/${id}/assignees/remove`, { method: 'POST', body: JSON.stringify({ emails }) })
        },
        Document: {
            list: () => fetchApi('/documents/'),
            get: (id: string) => fetchApi(`/documents/${id}`),
            create: (data: any) => fetchApi('/documents/', { method: 'POST', body: JSON.stringify(data) }),
            update: (id: string, data: any) => fetchApi(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
            delete: (id: string) => fetchApi(`/documents/${id}`, { method: 'DELETE' })
        },
        FormSection: {
            list: (formId: string) => fetchApi(`/sections/form/${formId}`),
            create: (formId: string, data: any) => fetchApi(`/sections/form/${formId}`, { method: 'POST', body: JSON.stringify(data) }),
            update: (id: string, data: any) => fetchApi(`/sections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
            delete: (id: string) => fetchApi(`/sections/${id}`, { method: 'DELETE' }),
            reorder: (formId: string, sectionIds: string[]) => fetchApi(`/sections/form/${formId}/reorder`, { method: 'POST', body: JSON.stringify(sectionIds) })
        },
        AgentSession: {
            list: () => fetchApi('/agent/sessions'),
            get: (id: string) => fetchApi(`/agent/sessions/${id}`),
            create: (data: any) => fetchApi('/agent/sessions', { method: 'POST', body: JSON.stringify(data) }),
            update: (id: string, data: any) => fetchApi(`/agent/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
            delete: (id: string) => fetchApi(`/agent/sessions/${id}`, { method: 'DELETE' })
        },
        ApiKey: {
            list: () => fetchApi('/agent/keys'),
            create: (data: any) => fetchApi('/agent/keys', { method: 'POST', body: JSON.stringify(data) }),
            update: (id: string, data: any) => fetchApi(`/agent/keys/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
            delete: (id: string) => fetchApi(`/agent/keys/${id}`, { method: 'DELETE' }),
            resolve: (provider: string) => fetchApi(`/agent/keys/resolve/${provider}`)
        },
        AgenticFill: {
            knowledge: (formId: string) => fetchApi(`/agentic-fill/forms/${formId}/knowledge`),
            turn: (formId: string, data: any) => fetchApi(`/agentic-fill/forms/${formId}/turn`, {
                method: 'POST',
                body: JSON.stringify(data)
            })
        }
    },
    integrations: {
        Core: {
            UploadFile: async (args: { file: File }) => {
                const formData = new FormData();
                formData.append('file', args.file);
                const options = { method: 'POST', body: formData };
                // Using fetch directly because we don't want to set application/json
                const token = getToken();
                const headers = new Headers();
                if (token) headers.set('Authorization', `Bearer ${token}`);
                
                const res = await fetch(`${API_BASE}/upload`, { ...options, headers });
                if (!res.ok) throw new Error("Upload failed");
                const data = await res.json();
                
                // Return the provided file_url directly (Cloudinary URL)
                return { file_url: data.file_url };
            },
            ExtractDataFromUploadedFile: async (args: { file_url: string; json_schema?: any }) => {
                const body: any = { file_url: args.file_url };
                if (args.json_schema) body.json_schema = args.json_schema;
                const res = await fetchApi('/ai/extract-questions', { method: 'POST', body: JSON.stringify(body) });
                return res.questions;
            },
            InvokeLLM: async (args: { prompt: string; response_json_schema?: any }) => {
                const body: any = { prompt: args.prompt };
                if (args.response_json_schema) body.response_json_schema = args.response_json_schema;
                const res = await fetchApi('/ai/chat', { method: 'POST', body: JSON.stringify(body) });
                return res.text || res;
            },
            SendEmail: async (args: any) => fetchApi('/email/send', {
                method: 'POST',
                body: JSON.stringify({
                    to: Array.isArray(args.to) ? args.to : [args.to],
                    subject: args.subject,
                    html: args.html || args.body,
                    body: args.body,
                })
            })
        },
        Google: {
            getAuthUrl: (provider: string) => {
                const redirectUri = encodeURIComponent(`${window.location.origin}/integrations/google/callback`);
                return fetchApi(`/integrations/google/auth-url?provider=${provider}&redirect_uri=${redirectUri}`);
            },
            callback: (code: string, provider: string) => {
                const redirectUri = `${window.location.origin}/integrations/google/callback`;
                return fetchApi('/integrations/google/callback', {
                    method: 'POST',
                    body: JSON.stringify({ code, provider, redirect_uri: redirectUri }),
                });
            },
            status: () => fetchApi('/integrations/google/status'),
            disconnect: (provider: string) => fetchApi(`/integrations/google/disconnect?provider=${provider}`, {
                method: 'DELETE',
            }),
            pushToDrive: (formId: string, fileName?: string, folderName?: string) => fetchApi('/integrations/google/push-drive', {
                method: 'POST',
                body: JSON.stringify({ form_id: formId, file_name: fileName, folder_name: folderName || 'ForeForm Exports' }),
            }),
            pushToSheets: (formId: string, spreadsheetName?: string) => fetchApi('/integrations/google/push-sheets', {
                method: 'POST',
                body: JSON.stringify({ form_id: formId, spreadsheet_name: spreadsheetName }),
            }),
        },
        Twitter: {
            getAuthUrl: () => fetchApi('/integrations/twitter/auth-url'),
            callback: (code: string, codeVerifier: string, redirectUri?: string) => {
                return fetchApi('/integrations/twitter/callback', {
                    method: 'POST',
                    body: JSON.stringify({ code, code_verifier: codeVerifier, redirect_uri: redirectUri }),
                });
            },
            status: () => fetchApi('/integrations/twitter/status'),
            disconnect: () => fetchApi('/integrations/twitter/disconnect', {
                method: 'DELETE',
            }),
        },
        Connections: {
            status: async () => {
                const [google, twitter] = await Promise.all([
                    fetchApi('/integrations/google/status').catch(() => []),
                    fetchApi('/integrations/twitter/status').catch(() => null),
                ]);
                return [
                    ...(Array.isArray(google) ? google : []),
                    ...(twitter ? [twitter] : []),
                ];
            },
        },
        Sheets: {
            push: (formId: string, spreadsheetName?: string, sheetName?: string) => fetchApi('/sheets/push', {
                method: 'POST',
                body: JSON.stringify({ form_id: formId, spreadsheet_name: spreadsheetName, sheet_name: sheetName || 'Responses' }),
            }),
            append: (formId: string, spreadsheetId: string, sheetName?: string) => fetchApi('/sheets/append', {
                method: 'POST',
                body: JSON.stringify({ form_id: formId, spreadsheet_id: spreadsheetId, sheet_name: sheetName || 'Responses' }),
            }),
            preview: (spreadsheetId: string, sheetName?: string, maxRows?: number) =>
                fetchApi(`/sheets/preview?spreadsheet_id=${spreadsheetId}&sheet_name=${sheetName || 'Responses'}&max_rows=${maxRows || 50}`),
            list: (pageSize?: number) => fetchApi(`/sheets/list?page_size=${pageSize || 20}`),
            info: (spreadsheetId: string) => fetchApi(`/sheets/${spreadsheetId}/info`),
            sync: (formId: string, spreadsheetId: string, sheetName?: string) => fetchApi('/sheets/sync', {
                method: 'POST',
                body: JSON.stringify({ form_id: formId, spreadsheet_id: spreadsheetId, sheet_name: sheetName || 'Responses' }),
            }),
        },
        Drive: {
            smartUpload: async (file: File, destination?: string, folderId?: string) => {
                const formData = new FormData();
                formData.append('file', file);
                if (destination) formData.append('destination', destination);
                if (folderId) formData.append('folder_id', folderId);
                const token = getToken();
                const headers = new Headers();
                if (token) headers.set('Authorization', `Bearer ${token}`);
                const res = await fetch(`${API_BASE}/drive/upload`, { method: 'POST', body: formData, headers });
                if (!res.ok) { const err = await res.json().catch(() => ({})); throw { status: res.status, message: err.detail || 'Upload failed' }; }
                return await res.json();
            },
            uploadRaw: async (file: File, folderId?: string) => {
                const formData = new FormData();
                formData.append('file', file);
                if (folderId) formData.append('folder_id', folderId);
                const token = getToken();
                const headers = new Headers();
                if (token) headers.set('Authorization', `Bearer ${token}`);
                const res = await fetch(`${API_BASE}/drive/upload-raw`, { method: 'POST', body: formData, headers });
                if (!res.ok) throw new Error('Drive upload failed');
                return await res.json();
            },
            listFiles: (folderId?: string, pageSize?: number) => {
                let url = `/drive/files?page_size=${pageSize || 20}`;
                if (folderId) url += `&folder_id=${folderId}`;
                return fetchApi(url);
            },
            getFile: (fileId: string) => fetchApi(`/drive/files/${fileId}`),
            createFolder: (name: string, parentId?: string) => fetchApi('/drive/folder', {
                method: 'POST',
                body: JSON.stringify({ name, parent_id: parentId }),
            }),
            listFolders: (parentId?: string) => {
                let url = '/drive/folders';
                if (parentId) url += `?parent_id=${parentId}`;
                return fetchApi(url);
            },
            deleteFile: (fileId: string) => fetchApi(`/drive/files/${fileId}`, { method: 'DELETE' }),
            search: (query: string) => fetchApi(`/drive/search?query=${encodeURIComponent(query)}`),
            downloadLink: (fileId: string) => fetchApi(`/drive/download/${fileId}`),
        },
    },
    admin: {
        dashboard: () => fetchApi('/admin/dashboard'),
        listUsers: (page?: number, search?: string, role?: string) => {
            let url = `/admin/users?page=${page || 1}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            if (role) url += `&role=${role}`;
            return fetchApi(url);
        },
        getUser: (userId: string) => fetchApi(`/admin/users/${userId}`),
        updateUserRole: (userId: string, role: string) => fetchApi(`/admin/users/${userId}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role }),
        }),
        updateUser: (userId: string, data: any) => fetchApi(`/admin/users/${userId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),
        deleteUser: (userId: string) => fetchApi(`/admin/users/${userId}`, { method: 'DELETE' }),
        bulkRoleUpdate: (userIds: string[], role: string) => fetchApi('/admin/users/bulk-role', {
            method: 'POST',
            body: JSON.stringify({ user_ids: userIds, role }),
        }),
        activityLog: (page?: number) => fetchApi(`/admin/activity-log?page=${page || 1}`),
        listForms: (page?: number, search?: string, status?: string) => {
            let url = `/admin/forms?page=${page || 1}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            if (status) url += `&status=${status}`;
            return fetchApi(url);
        },
        recentResponses: (limit?: number) => fetchApi(`/admin/responses/recent?limit=${limit || 20}`),
    },
};
