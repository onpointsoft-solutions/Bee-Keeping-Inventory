// Health History Charts
document.addEventListener('DOMContentLoaded', function() {
    // Load health history data and initialize charts
    loadHealthHistoryData();
});

// Load health history data from server
async function loadHealthHistoryData() {
    try {
        console.log('Loading health history data...');
        const response = await fetch('/bkinventory/get_health_history_data.php');
        const data = await response.json();
        
        if (data.success) {
            console.log('Health history data loaded successfully');
            // Store data globally for charts to use
            window.healthHistoryData = data.data;
            // Initialize charts
            initializeHealthHistoryCharts();
        } else {
            console.error('Failed to load health history data:', data.error);
            showToast('Failed to load health history data: ' + (data.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error loading health history data:', error);
        showToast('Error loading health history data: ' + error.message, 'error');
    }
}

// Initialize health history charts
function initializeHealthHistoryCharts() {
    setupHealthStatusChart();
    setupStrengthTrendChart();
    setupIssuesBreakdownChart();
    setupHiveComparisonChart();
}

// Setup health status distribution chart
function setupHealthStatusChart() {
    const ctx = document.getElementById('healthStatusChart')?.getContext('2d');
    if (!ctx) return;
    
    // Get data from PHP variables
    let healthData = window.healthHistoryData?.statusDistribution || [];
    
    if (!healthData.length) {
        document.getElementById('healthStatusChart').parentNode.innerHTML = 
            '<div class="alert alert-info">No health status data available yet.</div>';
        return;
    }
    
    // Prepare data for chart
    const labels = healthData.map(item => item.status);
    const data = healthData.map(item => item.count);
    
    // Colors based on status
    const statusColors = {
        'Healthy': 'rgba(28, 200, 138, 0.8)',
        'Issues Detected': 'rgba(246, 194, 62, 0.8)',
        'Critical': 'rgba(231, 74, 59, 0.8)'
    };
    
    const backgroundColors = labels.map(label => statusColors[label] || 'rgba(133, 135, 150, 0.8)');
    
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
            cutout: '65%',
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
                            return `${context.label}: ${value} checks (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Setup colony strength trend chart
function setupStrengthTrendChart() {
    const ctx = document.getElementById('strengthTrendChart')?.getContext('2d');
    if (!ctx) return;
    
    // Get data from PHP variables
    let strengthData = window.healthHistoryData?.strengthTrend || [];
    
    if (!strengthData.length) {
        document.getElementById('strengthTrendChart').parentNode.innerHTML = 
            '<div class="alert alert-info">No colony strength trend data available yet.</div>';
        return;
    }
    
    // Sort by date
    strengthData.sort((a, b) => new Date(a.checkDate) - new Date(b.checkDate));
    
    // Prepare data for chart
    const labels = strengthData.map(item => formatDate(item.checkDate));
    const data = strengthData.map(item => parseFloat(item.colonyStrength));
    
    // Create gradient for background
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(54, 185, 204, 0.6)');
    gradient.addColorStop(1, 'rgba(54, 185, 204, 0.1)');
    
    // Create chart
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Colony Strength (1-10)',
                data: data,
                backgroundColor: gradient,
                borderColor: 'rgba(54, 185, 204, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(54, 185, 204, 1)',
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
                    min: 0,
                    max: 10,
                    ticks: {
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: 'Strength Rating',
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
                            return `Strength: ${context.raw}/10`;
                        }
                    }
                }
            }
        }
    });
}

// Setup health issues breakdown chart
function setupIssuesBreakdownChart() {
    const ctx = document.getElementById('issuesBreakdownChart')?.getContext('2d');
    if (!ctx) return;
    
    // Get data from PHP variables
    let issuesData = window.healthHistoryData?.issuesBreakdown || [];
    
    if (!issuesData.length) {
        document.getElementById('issuesBreakdownChart').parentNode.innerHTML = 
            '<div class="alert alert-info">No health issues data available yet.</div>';
        return;
    }
    
    // Prepare data for chart
    const labels = issuesData.map(item => item.issue);
    const data = issuesData.map(item => item.count);
    
    // Colors for different issues
    const issueColors = [
        'rgba(231, 74, 59, 0.8)',
        'rgba(246, 194, 62, 0.8)',
        'rgba(54, 185, 204, 0.8)',
        'rgba(78, 115, 223, 0.8)',
        'rgba(133, 135, 150, 0.8)'
    ];
    
    // Create chart
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Occurrences',
                data: data,
                backgroundColor: issueColors.slice(0, labels.length),
                borderWidth: 1,
                borderRadius: 4,
                barPercentage: 0.7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    callbacks: {
                        label: function(context) {
                            return `Occurrences: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });
}

// Setup hive health comparison chart
function setupHiveComparisonChart() {
    const ctx = document.getElementById('hiveComparisonChart')?.getContext('2d');
    if (!ctx) return;
    
    // Get data from PHP variables
    let hiveData = window.healthHistoryData?.hiveComparison || [];
    
    if (!hiveData.length) {
        document.getElementById('hiveComparisonChart').parentNode.innerHTML = 
            '<div class="alert alert-info">No hive comparison data available yet.</div>';
        return;
    }
    
    // Prepare data for chart
    const labels = hiveData.map(item => `Hive #${item.hiveNumber}`);
    const avgStrength = hiveData.map(item => parseFloat(item.avgStrength) || 0);
    const healthIssues = hiveData.map(item => parseInt(item.issueCount) || 0);
    
    // Create chart
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Average Colony Strength',
                    data: avgStrength,
                    backgroundColor: 'rgba(54, 185, 204, 0.8)',
                    borderColor: 'rgba(54, 185, 204, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    barPercentage: 0.6,
                    yAxisID: 'y'
                },
                {
                    label: 'Health Issues Count',
                    data: healthIssues,
                    backgroundColor: 'rgba(246, 194, 62, 0.8)',
                    borderColor: 'rgba(246, 194, 62, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    barPercentage: 0.6,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    max: 10,
                    title: {
                        display: true,
                        text: 'Avg. Strength',
                        font: {
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Issues Count',
                        font: {
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false
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
                    position: 'top'
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)'
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
