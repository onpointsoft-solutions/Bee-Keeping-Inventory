// API endpoint helper
// Utility functions for API calls
const API_BASE = '/bkinventory/api';

const api = {
    async get(endpoint, params = {}) {
        try {
            const query = new URLSearchParams(params).toString();
            const url = `${API_BASE}/${endpoint}${query ? '?' + query : ''}`;
            console.log('GET Request URL:', url); // Debug log
            const response = await fetch(url);
            
            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                let errorMessage;
                
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
                } else {
                    errorMessage = await response.text();
                }
                
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            console.log('API Response:', data); // Debug log
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async post(endpoint, data = {}) {
        try {
            const url = `${API_BASE}/${endpoint}`;
            console.log('POST Request URL:', url, 'Data:', data); // Debug log
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                let errorMessage;
                
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
                } else {
                    errorMessage = await response.text();
                }
                
                throw new Error(errorMessage);
            }
            
            const responseData = await response.json();
            console.log('API Response:', responseData); // Debug log
            return responseData;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};

// Date formatting
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Form data collection
function getFormData(formId) {
    const form = document.getElementById(formId);
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    return data;
}

// Toast notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }, 100);
}

// Table generation
function generateTable(data, columns) {
    console.log('Generating table with data:', data); // Log input data
    console.log('Columns:', columns); // Log columns

    if (!data || !Array.isArray(data) || data.length === 0 || !columns || !Array.isArray(columns)) {
        console.error('Invalid data or columns provided to generateTable');
        return null; // Return null if input is invalid
    }

    const table = document.createElement('table');
    table.className = 'table table-striped';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.label;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    data.forEach(row => {
        const tr = document.createElement('tr');
        columns.forEach(col => {
            const td = document.createElement('td');
            if (col.format) {
                td.innerHTML = col.format(row[col.key], row);
            } else {
                td.textContent = row[col.key];
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    console.log('Generated table element:', table); // Log the final table element
    return table;
}

// Chart generation using Chart.js
function createChart(ctx, type, data, options = {}) {
    return new Chart(ctx, {
        type: type,
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            ...options
        }
    });
}

// Export utilities
window.api = api;
window.formatDate = formatDate;
window.getFormData = getFormData;
window.showToast = showToast;
window.generateTable = generateTable;
window.createChart = createChart;
