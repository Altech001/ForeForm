const BASE_URL = "https://merite-bill.vercel.app";

async function request(path, options = {}) {
    const url = `${BASE_URL}${path}`;
    const config = {
        headers: { "Content-Type": "application/json" },
        ...options,
    };
    const res = await fetch(url, config);
    if (res.status === 204) return null;
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail?.[0]?.msg || `Request failed: ${res.status}`);
    }
    return res.json();
}

// Plans
export const api = {
    plans: {
        list: () => request("/api/plans"),
        get: (id) => request(`/api/plans/${id}`),
        create: (data) => request("/api/plans", { method: "POST", body: JSON.stringify(data) }),
        update: (id, data) => request(`/api/plans/${id}`, { method: "PUT", body: JSON.stringify(data) }),
        delete: (id) => request(`/api/plans/${id}`, { method: "DELETE" }),
    },
    codes: {
        list: (planId) => request(`/api/plans/${planId}/codes`),
        create: (planId, data) => request(`/api/plans/${planId}/codes`, { method: "POST", body: JSON.stringify(data) }),
        generate: (planId, data) => request(`/api/plans/${planId}/codes/generate`, { method: "POST", body: JSON.stringify(data) }),
        import: (planId, data) => request(`/api/plans/${planId}/codes/import`, { method: "POST", body: JSON.stringify(data) }),
        update: (id, data) => request(`/api/codes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
        delete: (id) => request(`/api/codes/${id}`, { method: "DELETE" }),
        bulkDelete: (ids) => request("/api/codes/bulk-delete", { method: "POST", body: JSON.stringify({ ids }) }),
    },
    transactions: {
        list: () => request("/api/transactions"),
    },
    activeUsers: {
        list: () => request("/api/active-users"),
    },
    cleanup: {
        expireCodes: () => request("/api/cleanup/expire-codes", { method: "POST" }),
    },
    health: () => request("/health"),
};