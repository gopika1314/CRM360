const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000";

export async function apiFetch(endpoint, options = {}) {

    const token = localStorage.getItem("token");

    const headers = {
        ...(options.headers || {})
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    if (options.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );

    if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("crm360_user");

        window.location.href = "/login";

        return;
    }

    return response;
}