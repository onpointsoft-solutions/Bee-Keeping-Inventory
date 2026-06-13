// Base API URL
const API_BASE_URL = '/bkinventory/api';

// Map resource types to their API endpoints
const API_ENDPOINTS = {
    'hive': 'hive',
    'beehive': 'hive',
    'health': 'health',
    'production': 'production',
    'equipment': 'equipment',
    'reports': 'reports'
};

// API utility object - renamed to apiUtils to avoid conflicts
const apiUtils = {
    /**
     * Make a GET request to the API
     * @param {string} resource - The resource type (e.g., 'hive', 'equipment')
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} - API response
     */
    async get(resource, params = {}) {
        try {
            const endpoint = API_ENDPOINTS[resource] || resource;
            const queryString = new URLSearchParams(params).toString();
            const url = `${API_BASE_URL}/${endpoint}${queryString ? '?' + queryString : ''}`;
            
            console.log('GET Request URL:', url);
            
            const response = await fetch(url);
            const data = await response.json();
            
            console.log('API Response:', data);
            return data;
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    },
    
    /**
     * Make a POST request to the API
     * @param {string} resource - The resource type (e.g., 'hive', 'equipment')
     * @param {Object|FormData} data - Request data
     * @returns {Promise<Object>} - API response
     */
    async post(resource, data) {
        try {
            const endpoint = API_ENDPOINTS[resource] || resource;
            const url = `${API_BASE_URL}/${endpoint}`;
            
            console.log('POST Request URL:', url);
            
            let options = {
                method: 'POST'
            };
            
            // Handle different data types
            if (data instanceof FormData) {
                options.body = data;
            } else {
                options.headers = {
                    'Content-Type': 'application/json'
                };
                options.body = JSON.stringify(data);
            }
            
            const response = await fetch(url, options);
            const result = await response.json();
            
            console.log('API Response:', result);
            return result;
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    },
    
    /**
     * Make a DELETE request to the API
     * @param {string} resource - The resource type (e.g., 'hive', 'equipment')
     * @param {number|string} id - Resource ID to delete
     * @returns {Promise<Object>} - API response
     */
    async delete(resource, id) {
        try {
            const endpoint = API_ENDPOINTS[resource] || resource;
            const url = `${API_BASE_URL}/${endpoint}/${id}`;
            
            console.log('DELETE Request URL:', url);
            
            const response = await fetch(url, {
                method: 'DELETE'
            });
            const data = await response.json();
            
            console.log('API Response:', data);
            return data;
        } catch (error) {
            console.error('API DELETE Error:', error);
            throw error;
        }
    }
};

// For backward compatibility
window.apiUtils = apiUtils;

/**
 * Get the correct API endpoint path based on the resource type
 * 
 * @param {string} resource - Resource type (hive, health, production, equipment)
 * @returns {string} - Correct API endpoint path
 */
function getEndpointPath(resource) {
    // Return the correct endpoint path
    if (API_ENDPOINTS[resource]) {
        return API_ENDPOINTS[resource];
    }
    
    // Fallback to the resource name
    return resource;
}

/**
 * Format date to YYYY-MM-DD
 * 
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Show a notification to the user
 * 
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, warning, info)
 */
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification alert-${type}`;
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        // Remove from DOM after animation
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}
