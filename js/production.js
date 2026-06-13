// Production Management
document.addEventListener('DOMContentLoaded', function() {
    // Show production section when nav link is clicked
    document.querySelector('a[href="#production"]')?.addEventListener('click', function() {
        loadProduction();
        loadProductionReport();
    });

    // Add production form submission
    document.getElementById('addProductionForm')?.addEventListener('submit', handleAddProduction);

    // Update production form submission
    document.getElementById('updateProductionForm')?.addEventListener('submit', handleUpdateProduction);
});

// Load production data
async function loadProduction() {
    try {
        // Use direct PHP file instead of API
        const response = await fetch('/bkinventory/get_production_data.php');
        const data = await response.json();
        
        if (data.success) {
            displayProduction(data.data);
            updateHiveFilter(data.data);
        } else {
            showToast('Failed to load production data: ' + (data.error || 'Unknown error'), 'error');
            console.error('Failed to load production data:', data);
        }
    } catch (error) {
        showToast(error.message, 'error');
        console.error('Error in loadProduction:', error);
    }
}

// Load production report
async function loadProductionReport() {
    try {
        // Use direct PHP file instead of API
        const response = await fetch('/bkinventory/get_production_report.php');
        const data = await response.json();
        
        if (data.success) {
            displayProductionReport(data.data);
            updateProductionChart(data.data);
        } else {
            showToast('Failed to load production report: ' + (data.error || 'Unknown error'), 'error');
            console.error('Failed to load production report:', data);
        }
    } catch (error) {
        showToast(error.message, 'error');
        console.error('Error in loadProductionReport:', error);
    }
}

// Display production in table
function displayProduction(data) {
    const container = document.getElementById('productionContainer');
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = '<p>No production records available.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'table table-hover';
    
    table.innerHTML = `
        <thead>
            <tr>
                <th>Hive</th>
                <th>Type</th>
                <th>Date</th>
                <th>Quantity (kg)</th>
                <th>Quality</th>
               
            </tr>
        </thead>
        <tbody>
            ${data.map(item => `
                <tr data-id="${item.productionID}" 
                    data-hive-id="${item.hiveID}"
                    data-type="${item.type}"
                    data-quantity="${item.quantity}"
                    data-quality="${item.quality}"
                    data-notes="${item.notes || ''}">
                    <td>Hive #${item.hiveNumber}</td>
                    <td>${item.type}</td>
                    <td>${formatDate(item.harvestDate)}</td>
                    <td>${item.quantity}</td>
                    <td>
                        <span class="badge bg-${getQualityClass(item.quality)}">
                            ${item.quality}
                        </span>
                    </td>
                   
                </tr>
            `).join('')}
        </tbody>
    `;

    container.innerHTML = '';
    container.appendChild(table);
}

// Display production report
function displayProductionReport(data) {
    const container = document.getElementById('productionReportContainer');
    if (!container) return;

    if (!data || !data.byHive || !data.byType) {
        container.innerHTML = '<p>No production data available for report.</p>';
        return;
    }

    container.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Production by Hive</h6>
                    </div>
                    <div class="card-body">
                        <div class="list-group">
                            ${data.byHive.map(item => `
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="mb-0">Hive #${item.hiveNumber}</h6>
                                        <small class="text-muted">Average Quality: ${item.averageQuality}</small>
                                    </div>
                                    <span class="badge bg-primary rounded-pill">${item.totalQuantity} kg</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Production by Type</h6>
                    </div>
                    <div class="card-body">
                        <div class="list-group">
                            ${data.byType.map(item => `
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="mb-0">${item.type}</h6>
                                        <small class="text-muted">Average Quality: ${item.averageQuality}</small>
                                    </div>
                                    <span class="badge bg-primary rounded-pill">${item.totalQuantity} kg</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Update production chart
function updateProductionChart(data) {
    const ctx = document.getElementById('productionTrendChart')?.getContext('2d');
    if (!ctx || !data.byHive) return;

    // Destroy existing chart if it exists
    if (window.productionTrendChart instanceof Chart) {
        window.productionTrendChart.destroy();
    }

    // Create a gradient for the bar chart
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(78, 115, 223, 0.8)');
    gradient.addColorStop(1, 'rgba(78, 115, 223, 0.2)');

    const chartData = {
        labels: data.byHive.map(item => `Hive #${item.hiveNumber}`),
        datasets: [{
            label: 'Total Production (kg)',
            data: data.byHive.map(item => item.totalQuantity),
            backgroundColor: gradient,
            borderColor: 'rgba(78, 115, 223, 1)',
            borderWidth: 1,
            borderRadius: 5,
            barPercentage: 0.7
        }]
    };

    window.productionTrendChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Kilograms',
                        font: {
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return `Production: ${context.raw} kg`;
                        }
                    }
                }
            }
        }
    });
    
    // Also create the honey type distribution chart
    const typeCtx = document.getElementById('honeyTypeChart')?.getContext('2d');
    if (typeCtx && data.byType) {
        // Destroy existing chart if it exists
        if (window.honeyTypeChart instanceof Chart) {
            window.honeyTypeChart.destroy();
        }
        
        // Enhanced colors for pie chart
        const backgroundColors = [
            'rgba(78, 115, 223, 0.8)',
            'rgba(28, 200, 138, 0.8)',
            'rgba(246, 194, 62, 0.8)',
            'rgba(231, 74, 59, 0.8)',
            'rgba(54, 185, 204, 0.8)',
            'rgba(133, 135, 150, 0.8)'
        ];
        
        const borderColors = [
            'rgba(78, 115, 223, 1)',
            'rgba(28, 200, 138, 1)',
            'rgba(246, 194, 62, 1)',
            'rgba(231, 74, 59, 1)',
            'rgba(54, 185, 204, 1)',
            'rgba(133, 135, 150, 1)'
        ];
        
        const typeChartData = {
            labels: data.byType.map(item => item.type),
            datasets: [{
                label: 'Production by Type (kg)',
                data: data.byType.map(item => item.totalQuantity),
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        };
        
        window.honeyTypeChart = new Chart(typeCtx, {
            type: 'pie',
            data: typeChartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                size: 12
                            },
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${value} kg (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Add monthly trend chart if data is available
    const monthlyCtx = document.getElementById('monthlyProductionChart')?.getContext('2d');
    if (monthlyCtx && data.byMonth) {
        // Destroy existing chart if it exists
        if (window.monthlyProductionChart instanceof Chart) {
            window.monthlyProductionChart.destroy();
        }
        
        const months = data.byMonth.map(item => item.month);
        const quantities = data.byMonth.map(item => item.totalQuantity);
        
        // Create gradient for line
        const lineGradient = monthlyCtx.createLinearGradient(0, 0, 0, 400);
        lineGradient.addColorStop(0, 'rgba(28, 200, 138, 1)');
        lineGradient.addColorStop(1, 'rgba(28, 200, 138, 0.1)');
        
        window.monthlyProductionChart = new Chart(monthlyCtx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Monthly Production',
                    data: quantities,
                    backgroundColor: lineGradient,
                    borderColor: 'rgba(28, 200, 138, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(28, 200, 138, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Production (kg)',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        callbacks: {
                            label: function(context) {
                                return `Production: ${context.raw} kg`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Handle add production form submission
async function handleAddProduction(e) {
    e.preventDefault();
    
    try {
        // Create a data object with the action parameter
        const data = {
            action: 'add'
        };
        
        // Get form data and add to the data object
        const form = e.target;
        data.hiveID = form.querySelector('[name="hiveID"]').value;
        data.harvestDate = form.querySelector('[name="harvestDate"]').value;
        data.quantity = form.querySelector('[name="quantity"]').value;
        data.type = form.querySelector('[name="type"]').value;
        data.quality = form.querySelector('[name="quality"]').value;
        data.notes = form.querySelector('[name="notes"]').value || '';
        
        console.log('Submitting production data:', data);
        
        // Use our direct endpoint for adding production
        const response = await fetch('/bkinventory/add_production.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            // Handle non-JSON response
            const text = await response.text();
            console.error('Server returned non-JSON response:', text);
            showToast('Server error. Check console for details.', 'error');
            return;
        }
        
        const result = await response.json();
        console.log('API response:', result);
        
        if (result.success) {
            showToast('Production record added successfully');
            loadProduction();
            loadProductionReport();
            form.reset();
            $('#addProductionModal').modal('hide');
        } else {
            showToast('Failed to add production record: ' + (result.error || 'Unknown error'), 'error');
            console.error('Failed to add production:', result);
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
        console.error('Error in handleAddProduction:', error);
    }
}

// Handle update production form submission
async function handleUpdateProduction(e) {
    e.preventDefault();
    
    try {
        // Create a simple object with the action parameter
        const data = {
            action: 'update'
        };
        
        // Get form data and add to the data object
        const form = e.target;
        data.productionID = form.querySelector('[name="productionID"]').value;
        data.hiveID = form.querySelector('[name="hiveID"]').value;
        data.harvestDate = form.querySelector('[name="harvestDate"]').value;
        data.quantity = form.querySelector('[name="quantity"]').value;
        data.type = form.querySelector('[name="type"]').value;
        data.quality = form.querySelector('[name="quality"]').value;
        data.notes = form.querySelector('[name="notes"]').value || '';
        
        console.log('Updating production data:', data);
        
        // Use fetch directly to ensure proper data format
        const response = await fetch('/bkinventory/api/production', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        console.log('API update response:', result);
        
        if (result.success) {
            showToast('Production record updated successfully');
            loadProduction();
            loadProductionReport();
            $('#editProductionModal').modal('hide');
        } else {
            showToast('Failed to update production record: ' + (result.error || result.message || 'Unknown error'), 'error');
            console.error('Failed to update production:', result);
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
        console.error('Error in handleUpdateProduction:', error);
    }
}

// Delete production
async function deleteProduction(productionID) {
    if (!confirm('Are you sure you want to delete this production record?')) {
        return;
    }
    
    try {
        const result = await api.post('production', {
            action: 'delete',
            productionID: productionID
        });
        
        if (result.success) {
            showToast('Production record deleted successfully');
            loadProduction();
            loadProductionReport();
        } else {
            showToast('Failed to delete production record: ' + (result.error || 'Unknown error'), 'error');
            console.error('Failed to delete production:', result);
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
        console.error('Error in deleteProduction:', error);
    }
}

// Edit production (show modal with data)
function editProduction(productionID) {
    const row = document.querySelector(`tr[data-id="${productionID}"]`);
    if (!row) return;
    
    const form = document.getElementById('editProductionForm');
    if (!form) return;
    
    // Set form values from data attributes
    form.querySelector('[name="productionID"]').value = productionID;
    form.querySelector('[name="hiveID"]').value = row.getAttribute('data-hive-id');
    form.querySelector('[name="type"]').value = row.getAttribute('data-type');
    form.querySelector('[name="quantity"]').value = row.getAttribute('data-quantity');
    form.querySelector('[name="quality"]').value = row.getAttribute('data-quality');
    form.querySelector('[name="notes"]').value = row.getAttribute('data-notes');
    
    // Show the modal
    $('#editProductionModal').modal('show');
}

// Helper function to get quality class for badges
function getQualityClass(quality) {
    switch (quality) {
        case 'Premium':
            return 'success';
        case 'Standard':
            return 'primary';
        case 'Economy':
            return 'warning';
        default:
            return 'secondary';
    }
}

// Format date helper
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Update hive filter
function updateHiveFilter(data) {
    const filter = document.getElementById('hiveFilter');
    if (!filter) return;
    
    // Get unique hives
    const hives = [];
    data.forEach(item => {
        if (!hives.some(h => h.id === item.hiveID)) {
            hives.push({
                id: item.hiveID,
                number: item.hiveNumber
            });
        }
    });
    
    // Add options
    filter.innerHTML = '<option value="all">All Hives</option>';
    hives.forEach(hive => {
        filter.innerHTML += `<option value="${hive.id}">Hive #${hive.number}</option>`;
    });
}

// Function to show toast notifications
function showToast(message, type = 'success') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `notification alert-${type}`;
    toast.innerHTML = message;
    
    // Add to document
    document.body.appendChild(toast);
    
    // Show the toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}
