import { appParams } from '@/lib/app-params';

const API_BASE = 'https://foreform.vercel.app/api';

function getToken() {
    return localStorage.getItem('base44_access_token') || appParams.token;
}

function setToken(token: string) {
    localStorage.setItem('base44_access_token', token);
}

function clearToken() {
    localStorage.removeItem('base44_access_token');
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
        me: () => fetchApi('/auth/me'),
        login: async (email: string, password: string) => {
            const data = await fetchApi('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            setToken(data.access_token);
            return data;
        },
        googleLogin: async (token: string) => {
            const data = await fetchApi('/auth/google', {
                method: 'POST',
                body: JSON.stringify({ token })
            });
            setToken(data.access_token);
            return data;
        },
        register: (email: string, full_name: string, password: string) => fetchApi('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, full_name, password })
        }),
        logout: (redirectUrl?: string) => {
            clearToken();
            if (redirectUrl) window.location.href = redirectUrl;
        },
        redirectToLogin: (currentUrl?: string) => {
            clearToken();
            window.location.href = '/login'; 
        }
    },
    entities: {
        Form: {
            list: () => fetchApi('/forms'),
            filter: async (opts: any) => {
                if (opts.id) {
                    return [await fetchApi(`/forms/${opts.id}`)];
                }
                return await fetchApi('/forms');
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
            create: (data: any) => fetchApi(`/forms/${data.form_id}/responses`, { method: 'POST', body: JSON.stringify(data) })
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
            comment: (id: string, text: string) => fetchApi(`/tasks/${id}/comments`, { method: 'POST', body: JSON.stringify({ text }) })
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
                const body: any = { text: args.prompt };
                if (args.response_json_schema) body.response_json_schema = args.response_json_schema;
                const res = await fetchApi('/ai/extract-questions', { method: 'POST', body: JSON.stringify(body) });
                return JSON.stringify({ questions: res.questions });
            },
            SendEmail: async (args: any) => { return true; }
        }
    }
};
