// Equipment Management

// Initialize equipment functionality
function initializeEquipment() {
    // Check if we're on the equipment page
    if (document.getElementById('equipment') || document.querySelector('[data-section="equipment"]')) {
        console.log('Equipment section found, loading data');
        // Load equipment data
        loadEquipment();
        loadInventoryReport();
        
        // Initialize equipment type filter
        initializeEquipmentTypeFilter();
    } else {
        console.log('Equipment section not found, skipping initialization');
        return; // Exit if we're not on the equipment page
    }
    
    // Add equipment form submission
    const addEquipmentForm = document.getElementById('addEquipmentForm');
    if (addEquipmentForm) {
        addEquipmentForm.addEventListener('submit', handleAddEquipment);
    }
    
    // Update equipment form submission
    const updateEquipmentForm = document.getElementById('updateEquipmentForm');
    if (updateEquipmentForm) {
        updateEquipmentForm.addEventListener('submit', handleUpdateEquipment);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize equipment when the DOM is fully loaded
    initializeEquipment();
});

// Load equipment data
async function loadEquipment() {
    try {
        // Update active section - safely check if element exists
        const equipmentSection = document.getElementById('equipment');
        if (!equipmentSection) {
            console.warn('Equipment section not found in the DOM');
            return;
        }
        
        document.querySelectorAll('.content-section').forEach(section => {
            if (section) section.style.display = 'none';
        });
        equipmentSection.style.display = 'block';
        
        // Fetch equipment data using direct PHP file instead of API
        try {
            const response = await fetch('/bkinventory/get_equipment_data.php');
            const data = await response.json();
            
            if (data.success) {
                displayEquipment(data.data);
            } else {
                showToast('Failed to load equipment data: ' + (data.error || 'Unknown error'), 'error');
                console.error('Failed to load equipment data:', data);
            }
        } catch (error) {
            console.error('Error fetching equipment data:', error);
            showToast('Error fetching equipment data: ' + error.message, 'error');
        }
    } catch (error) {
        console.error('Error in loadEquipment:', error);
    }
}

// Load inventory report
async function loadInventoryReport() {
    try {
        console.log('Loading inventory report...');
        
        // Check if the inventory report container exists
        const reportContainer = document.getElementById('inventoryReportContainer');
        if (!reportContainer) {
            console.warn('Inventory report container not found, skipping report load');
            return;
        }
        
        // Use direct PHP file instead of API
        const response = await fetch('/bkinventory/get_equipment_report.php');
        const data = await response.json();
        
        console.log('Inventory report response:', data); // Log the full response
        
        if (data.success) {
            displayInventoryReport(data.data);
            updateInventoryChart(data.data);
        } else {
           // console.error('Failed to load inventory report:', data);
            //reportContainer.innerHTML = '<div class="alert alert-warning">Failed to load inventory report. Please try again later.</div>';
            //showToast('Failed to load inventory report: ' + (data.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error in loadInventoryReport:', error);
        /*const reportContainer = document.getElementById('inventoryReportContainer');
        if (reportContainer) {
            reportContainer.innerHTML = '<div class="alert alert-danger">Error loading inventory report: ' + error.message + '</div>';
        }
        showToast('Error loading inventory report: ' + error.message, 'error');*/
    }
}

// Display equipment in table
function displayEquipment(data) {
    const container = document.getElementById('equipmentContainer');
    if (!container) return;

    let html = `
        <table class="table table-hover">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Condition</th>
                    <th>Purchase Date</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(item => {
        html += `
            <tr>
                <td>${item.name}</td>
                <td>${item.type}</td>
                <td>${item.quantity}</td>
                <td>
                    <span class="status-${getStatusClass(item.condition_status)}">
                        ${item.condition_status}
                    </span>
                </td>
                <td>${formatDate(item.purchaseDate)}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

// Display inventory report
function displayInventoryReport(report) {
    const container = document.getElementById('inventoryReportContainer');
    if (!container) return;

    let html = `
        <div class="mt-4">
            <h6 class="mb-3">Equipment by Type</h6>
            <div class="list-group">
    `;

    report.forEach(item => {
        html += `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-0">${item.type}</h6>
                    <small class="text-muted">Conditions: ${item.conditions}</small>
                </div>
                <span class="badge bg-primary rounded-pill">${item.totalQuantity}</span>
            </div>
        `;
    });

    html += '</div></div>';
    container.innerHTML = html;
}

// Update inventory chart
function updateInventoryChart(report) {
    const ctx = document.getElementById('inventoryChart')?.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (window.inventoryChart instanceof Chart) {
        window.inventoryChart.destroy();
    }

    const labels = report.map(item => item.type);
    const data = report.map(item => item.totalQuantity);
    
    // Enhanced colors for better visualization
    const backgroundColors = [
        'rgba(78, 115, 223, 0.8)',
        'rgba(28, 200, 138, 0.8)',
        'rgba(246, 194, 62, 0.8)',
        'rgba(231, 74, 59, 0.8)',
        'rgba(54, 185, 204, 0.8)',
        'rgba(133, 135, 150, 0.8)'
    ];

    window.inventoryChart = new Chart(ctx, {
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
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 12
                        },
                        padding: 20
                    }
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
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${context.label}: ${value} units (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // Add equipment condition chart
    const conditionCtx = document.getElementById('equipmentConditionChart')?.getContext('2d');
    if (conditionCtx && report.byCondition) {
        // Destroy existing chart if it exists
        if (window.equipmentConditionChart instanceof Chart) {
            window.equipmentConditionChart.destroy();
        }
        
        const conditionLabels = report.byCondition.map(item => item.condition);
        const conditionData = report.byCondition.map(item => item.count);
        
        // Colors based on condition
        const conditionColors = {
            'New': 'rgba(28, 200, 138, 0.8)',
            'Good': 'rgba(54, 185, 204, 0.8)',
            'Fair': 'rgba(246, 194, 62, 0.8)',
            'Poor': 'rgba(231, 74, 59, 0.8)'
        };
        
        const backgroundColors = conditionLabels.map(label => conditionColors[label] || 'rgba(133, 135, 150, 0.8)');
        
        window.equipmentConditionChart = new Chart(conditionCtx, {
            type: 'pie',
            data: {
                labels: conditionLabels,
                datasets: [{
                    data: conditionData,
                    backgroundColor: backgroundColors,
                    borderWidth: 1,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                maintainAspectRatio: false,
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
                                return `${context.label} Condition: ${value} items (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Initialize equipment type filter
function initializeEquipmentTypeFilter() {
    const filterSelect = document.getElementById('equipmentTypeFilter');
    if (!filterSelect) return;

    filterSelect.addEventListener('change', function() {
        const type = this.value;
        if (type) {
            window.api.post('equipment', { controller: 'equipment', action: 'getByType', type })
            .then(response => {
                if (response.success) {
                    displayEquipment(response.data);
                } else {
                    showToast('error', 'Error filtering equipment: ' + response.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('error', 'Failed to filter equipment');
            });
        } else {
            loadEquipment();
        }
    });
}

// Update type filter options
function updateTypeFilter(data) {
    const filterSelect = document.getElementById('equipmentTypeFilter');
    if (!filterSelect) return;

    const types = [...new Set(data.map(item => item.type))];
    let options = '<option value="">All Types</option>';
    
    types.forEach(type => {
        options += `<option value="${type}">${type}</option>`;
    });
    
    filterSelect.innerHTML = options;
}

async function handleAddEquipment(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        controller: 'equipment',
        action: 'add',
        name: formData.get('name'),
        type: formData.get('type'),
        quantity: formData.get('quantity'),
        condition: formData.get('condition'),
        purchaseDate: formData.get('purchaseDate'),
        notes: formData.get('notes')
    };

    try {
        const response = await window.api.post('equipment', data); // Use await here
        if (response.success) {
            showToast('success', 'Equipment added successfully');
            loadEquipment();
            loadInventoryReport();
            $('#addEquipmentModal').modal('hide');
            e.target.reset();
        } else {
            showToast('error', 'Error adding equipment: ' + response.error);
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Failed to add equipment');
    }
}

// Handle update equipment form submission
function handleUpdateEquipment(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        controller: 'equipment',
        action: 'update',
        equipmentID: formData.get('equipmentID'),
        name: formData.get('name'),
        type: formData.get('type'),
        quantity: formData.get('quantity'),
        condition: formData.get('condition'),
        notes: formData.get('notes')
    };

    window.api.post('equipment', data)
    .then(response => {
        if (response.success) {
            showToast('success', 'Equipment updated successfully');
            loadEquipment();
            loadInventoryReport();
            $('#updateEquipmentModal').modal('hide');
        } else {
            showToast('error', 'Error updating equipment: ' + response.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('error', 'Failed to update equipment');
    });
}

// Delete equipment
function deleteEquipment(equipmentID) {
    if (confirm('Are you sure you want to delete this equipment?')) {
        window.api.post('equipment', { controller: 'equipment', action: 'delete', equipmentID })
        .then(response => {
            if (response.success) {
                showToast('success', 'Equipment deleted successfully');
                loadEquipment();
                loadInventoryReport();
            } else {
                showToast('error', 'Error deleting equipment: ' + response.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('error', 'Failed to delete equipment');
        });
    }
}

// Edit equipment (show modal with data)
function editEquipment(equipmentID) {
    const equipment = document.querySelector(`tr[data-id="${equipmentID}"]`);
    if (!equipment) return;

    const modal = document.getElementById('updateEquipmentModal');
    if (!modal) return;

    const form = modal.querySelector('form');
    form.querySelector('[name="equipmentID"]').value = equipmentID;
    form.querySelector('[name="name"]').value = equipment.dataset.name;
    form.querySelector('[name="type"]').value = equipment.dataset.type;
    form.querySelector('[name="quantity"]').value = equipment.dataset.quantity;
    form.querySelector('[name="condition"]').value = equipment.dataset.condition;
    form.querySelector('[name="notes"]').value = equipment.dataset.notes || '';

    $(modal).modal('show');
}

// Helper function to get status class
function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'new':
        case 'good':
            return 'good';
        case 'fair':
        case 'used':
            return 'warning';
        case 'poor':
        case 'damaged':
            return 'danger';
        default:
            return 'warning';
    }
}

// Format date helper
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}
