// Dashboard Charts
document.addEventListener('DOMContentLoaded', function() {
    // Load dashboard data and initialize charts
    loadDashboardData();
});

// Load dashboard data from server
async function loadDashboardData() {
    try {
        console.log('Loading dashboard data...');
        const response = await fetch('/bkinventory/get_dashboard_data.php');
        const data = await response.json();
        
        if (data.success) {
            console.log('Dashboard data loaded successfully');
            // Store data globally for charts to use
            window.dashboardData = data.data;
            // Initialize charts
            initializeDashboardCharts();
        } else {
            console.error('Failed to load dashboard data:', data.error);
            showToast('Failed to load dashboard data: ' + (data.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Error loading dashboard data: ' + error.message, 'error');
    }
}

// Initialize dashboard charts
function initializeDashboardCharts() {
    setupProductionChart();
    setupEquipmentStatusChart();
    setupHiveHealthChart();
}

// Setup production chart
function setupProductionChart() {
    const ctx = document.getElementById('productionChart')?.getContext('2d');
    if (!ctx) return;
    
    // Get data from PHP variables (these will be set in the dashboard.php file)
    let productionData = window.dashboardData?.production || [];
    
    if (!productionData.length) {
        document.getElementById('productionChart').parentNode.innerHTML = 
            '<div class="alert alert-info">No production data available yet.</div>';
        return;
    }
    
    // Sort by date
    productionData.sort((a, b) => new Date(a.harvestDate) - new Date(b.harvestDate));
    
    // Prepare data for chart
    const labels = productionData.map(item => formatDate(item.harvestDate));
    const quantities = productionData.map(item => parseFloat(item.quantity));
    const types = productionData.map(item => item.type);
    
    // Create color map for honey types
    const typeColors = {
        'Wildflower': 'rgba(255, 99, 132, 0.7)',
        'Acacia': 'rgba(54, 162, 235, 0.7)',
        'Citrus': 'rgba(255, 206, 86, 0.7)',
        'Eucalyptus': 'rgba(75, 192, 192, 0.7)',
        'Mixed': 'rgba(153, 102, 255, 0.7)',
        'Other': 'rgba(255, 159, 64, 0.7)'
    };
    
    // Create gradient for background
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(78, 115, 223, 0.6)');
    gradient.addColorStop(1, 'rgba(78, 115, 223, 0.1)');
    
    // Create chart
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Honey Production (kg)',
                data: quantities,
                backgroundColor: gradient,
                borderColor: 'rgba(78, 115, 223, 1)',
                borderWidth: 2,
                pointBackgroundColor: types.map(type => typeColors[type] || 'rgba(78, 115, 223, 1)'),
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
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
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            const dataIndex = context.dataIndex;
                            const type = types[dataIndex];
                            return [
                                `Quantity: ${context.raw} kg`,
                                `Type: ${type}`
                            ];
                        }
                    }
                }
            }
        }
    });
}

// Setup equipment status chart
function setupEquipmentStatusChart() {
    const ctx = document.getElementById('equipmentStatusChart')?.getContext('2d');
    if (!ctx) return;
    
    // Get data from PHP variables
    let equipmentData = window.dashboardData?.equipment || [];
    
    if (!equipmentData.length) {
        document.getElementById('equipmentStatusChart').parentNode.innerHTML = 
            '<div class="alert alert-info">No equipment data available yet.</div>';
        return;
    }
    
    // Group by condition
    const conditionGroups = {};
    equipmentData.forEach(item => {
        const condition = item.condition_status || 'Unknown';
        if (!conditionGroups[condition]) {
            conditionGroups[condition] = 0;
        }
        conditionGroups[condition] += parseInt(item.quantity) || 1;
    });
    
    // Prepare data for chart
    const labels = Object.keys(conditionGroups);
    const data = Object.values(conditionGroups);
    
    // Colors based on condition
    const conditionColors = {
        'New': 'rgba(28, 200, 138, 0.8)',
        'Good': 'rgba(54, 185, 204, 0.8)',
        'Fair': 'rgba(246, 194, 62, 0.8)',
        'Poor': 'rgba(231, 74, 59, 0.8)',
        'Unknown': 'rgba(133, 135, 150, 0.8)'
    };
    
    const backgroundColors = labels.map(label => conditionColors[label] || 'rgba(133, 135, 150, 0.8)');
    
    // Create chart
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1,
                borderColor: '#ffffff',
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            size: 12
                        },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${context.label}: ${value} items (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Setup hive health chart
function setupHiveHealthChart() {
    const ctx = document.getElementById('hiveHealthChart')?.getContext('2d');
    if (!ctx) return;
    
    // Get data from PHP variables
    let healthData = window.dashboardData?.hiveHealth || [];
    
    if (!healthData.length) {
        document.getElementById('hiveHealthChart').parentNode.innerHTML = 
            '<div class="alert alert-info">No hive health data available yet.</div>';
        return;
    }
    
    // Group by status
    const statusGroups = {
        'Healthy': 0,
        'Issues Detected': 0,
        'Critical': 0
    };
    
    healthData.forEach(item => {
        let status = 'Healthy';
        
        // Determine health status based on colony strength and other factors
        if (item.colonyStrength < 3 || (item.queenPresent == 0 && item.diseaseSymptoms)) {
            status = 'Critical';
        } else if (item.colonyStrength < 5 || item.queenPresent == 0 || item.diseaseSymptoms || item.pestProblems) {
            status = 'Issues Detected';
        }
        
        statusGroups[status]++;
    });
    
    // Prepare data for chart
    const labels = Object.keys(statusGroups).filter(key => statusGroups[key] > 0);
    const data = labels.map(label => statusGroups[label]);
    
    // Colors based on status
    const statusColors = {
        'Healthy': 'rgba(28, 200, 138, 0.8)',
        'Issues Detected': 'rgba(246, 194, 62, 0.8)',
        'Critical': 'rgba(231, 74, 59, 0.8)'
    };
    
    const backgroundColors = labels.map(label => statusColors[label]);
    
    // Create chart
    const chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 12
                        },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${context.label}: ${value} hives (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}
