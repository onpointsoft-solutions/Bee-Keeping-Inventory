// api.js

const apiClient = {
    async post(endpoint, data) {
        try {
            const response = await fetch(`/bkinventory/api/${endpoint}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API POST Error:', error);
            throw new Error('Failed to make POST request');
        }
    },

    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `/bkinventory/api/${endpoint}/?${queryString}`;
        try {
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('API GET Error:', error);
            throw new Error('Failed to make GET request');
        }
    }
};

// Attach to the global window object
window.apiClient = apiClient;