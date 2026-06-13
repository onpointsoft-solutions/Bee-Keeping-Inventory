// Check if HiveManager is already defined to prevent duplicate declaration
if (typeof window.HiveManager === 'undefined') {
    class HiveManager {
        constructor() {
            this.initializeEventListeners();
            this.loadHives();
        }

        initializeEventListeners() {
            // Add hive form submission
            document.getElementById('addHiveForm')?.addEventListener('submit', e => this.handleAddHive(e));
            
            // Update hive form submission
            document.getElementById('editHiveForm')?.addEventListener('submit', e => this.handleUpdateHive(e));
            
            // Add health check form submission
            document.getElementById('addHealthCheckForm')?.addEventListener('submit', e => this.handleAddHealthCheck(e));
        }

        async loadHives() {
            try {
                // Use direct PHP file instead of API
                const response = await fetch('/bkinventory/get_hives_data.php');
                const data = await response.json();
                
                if (data.success) {
                    this.displayHives(data.data);
                } else {
                    showToast(data.error || 'Failed to load hives', 'error');
                    console.error('Failed to load hives:', data);
                }
            } catch (error) {
                showToast('Error loading hives: ' + error.message, 'error');
                console.error('Error loading hives:', error);
            }
        }

        displayHives(hives) {
            const container = document.getElementById('hivesContainer');
            if (!container) return;

            if (!hives || hives.length === 0) {
                container.innerHTML = '<p>No hives available.</p>';
                return;
            }

            const table = document.createElement('table');
            table.className = 'table table-hover';
            
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Hive #</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Last Health Check</th>
                        <th>Production</th>
                    </tr>
                </thead>
                <tbody>
                    ${hives.map(hive => `
                        <tr data-id="${hive.hiveID}">
                            <td>Hive #${hive.hiveNumber}</td>
                            <td>${hive.location}</td>
                            <td>
                                <span class="badge bg-${this.getStatusClass(hive.status)}">
                                    ${hive.status}
                                </span>
                            </td>
                            <td>
                                ${this.formatHealthStatus(hive.lastHealth)}
                            </td>
                            <td>
                                ${this.formatProductionSummary(hive.productionSummary)}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            `;

            container.innerHTML = '';
            container.appendChild(table);
        }

        formatHealthStatus(health) {
            if (!health) return '<span class="text-muted">No health checks</span>';

            const date = new Date(health.checkDate).toLocaleDateString();
            const strength = health.colonyStrength;
            const queenStatus = health.queenPresent ? 'Queen present' : 'Queen absent';

            return `
                <small>
                    <div>${date}</div>
                    <div class="badge bg-${this.getStrengthClass(strength)}">${strength}</div>
                    <div class="badge bg-${health.queenPresent ? 'success' : 'danger'}">${queenStatus}</div>
                </small>
            `;
        }

        formatProductionSummary(summary) {
            if (!summary || !summary.totalProduction) {
                return '<span class="text-muted">No production records</span>';
            }

            const lastHarvest = summary.lastHarvestDate ? 
                new Date(summary.lastHarvestDate).toLocaleDateString() : 'N/A';

            return `
                <small>
                    <div>Total: ${summary.totalProduction}kg</div>
                    <div>Harvests: ${summary.harvestCount}</div>
                    <div>Last: ${lastHarvest}</div>
                </small>
            `;
        }

        async viewHive(hiveID) {
            try {
                const response = await api.get('hive', { action: 'getOne', hiveID: hiveID });
                if (response.success) {
                    this.displayHiveDetails(response.data);
                } else {
                    showToast(response.error, 'error');
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        }

        displayHiveDetails(hive) {
            const modal = document.getElementById('viewHiveModal');
            if (!modal) return;

            const body = modal.querySelector('.modal-body');
            if (!body) return;

            body.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h6>Hive Details</h6>
                        <table class="table">
                            <tr>
                                <th>Hive Number:</th>
                                <td>#${hive.hiveNumber}</td>
                            </tr>
                            <tr>
                                <th>Location:</th>
                                <td>${hive.location}</td>
                            </tr>
                            <tr>
                                <th>Status:</th>
                                <td>
                                    <span class="badge bg-${this.getStatusClass(hive.status)}">
                                        ${hive.status}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <th>Date Established:</th>
                                <td>${new Date(hive.dateEstablished).toLocaleDateString()}</td>
                            </tr>
                            <tr>
                                <th>Queen Age:</th>
                                <td>${hive.queenAge || 'Unknown'}</td>
                            </tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h6>Production Summary</h6>
                        ${this.formatDetailedProductionSummary(hive.productionSummary)}
                    </div>
                </div>

                <div class="row mt-4">
                    <div class="col-md-12">
                        <h6>Health History</h6>
                        ${this.formatHealthHistory(hive.healthHistory)}
                    </div>
                </div>

                <div class="row mt-4">
                    <div class="col-md-12">
                        <h6>Production History</h6>
                        ${this.formatProductionHistory(hive.productionHistory)}
                    </div>
                </div>

                ${hive.notes ? `
                    <div class="row mt-4">
                        <div class="col-md-12">
                            <h6>Notes</h6>
                            <p>${hive.notes}</p>
                        </div>
                    </div>
                ` : ''}
            `;

            new bootstrap.Modal(modal).show();
        }

        formatDetailedProductionSummary(summary) {
            if (!summary || !summary.totalProduction) {
                return '<p class="text-muted">No production records available.</p>';
            }

            return `
                <table class="table">
                    <tr>
                        <th>Total Production:</th>
                        <td>${summary.totalProduction}kg</td>
                    </tr>
                    <tr>
                        <th>Total Harvests:</th>
                        <td>${summary.harvestCount}</td>
                    </tr>
                    <tr>
                        <th>Last Harvest:</th>
                        <td>${new Date(summary.lastHarvestDate).toLocaleDateString()}</td>
                    </tr>
                    <tr>
                        <th>Product Types:</th>
                        <td>${summary.productTypes.split(',').map(type => 
                            `<span class="badge bg-info me-1">${type}</span>`
                        ).join('')}</td>
                    </tr>
                </table>
            `;
        }

        formatHealthHistory(history) {
            if (!history || history.length === 0) {
                return '<p class="text-muted">No health check records available.</p>';
            }

            return `
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Queen</th>
                                <th>Strength</th>
                                <th>Disease Symptoms</th>
                                <th>Pest Problems</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${history.map(check => `
                                <tr>
                                    <td>${new Date(check.checkDate).toLocaleDateString()}</td>
                                    <td>
                                        <span class="badge bg-${check.queenPresent ? 'success' : 'danger'}">
                                            ${check.queenPresent ? 'Present' : 'Absent'}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="badge bg-${this.getStrengthClass(check.colonyStrength)}">
                                            ${check.colonyStrength}
                                        </span>
                                    </td>
                                    <td>${check.diseaseSymptoms || '-'}</td>
                                    <td>${check.pestProblems || '-'}</td>
                                    <td>${check.notes || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        formatProductionHistory(history) {
            if (!history || history.length === 0) {
                return '<p class="text-muted">No production records available.</p>';
            }

            return `
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Quantity</th>
                                <th>Quality</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${history.map(record => `
                                <tr>
                                    <td>${new Date(record.harvestDate).toLocaleDateString()}</td>
                                    <td>${record.type}</td>
                                    <td>${record.quantity}kg</td>
                                    <td>
                                        <span class="badge bg-${this.getQualityClass(record.quality)}">
                                            ${record.quality}
                                        </span>
                                    </td>
                                    <td>${record.notes || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        async editHive(hiveID) {
            try {
                const response = await api.get('hive', { action: 'getOne', hiveID: hiveID });
                if (response.success) {
                    this.populateEditForm(response.data);
                } else {
                    showToast(response.error, 'error');
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        }

        populateEditForm(hive) {
            const form = document.getElementById('editHiveForm');
            if (!form) return;

            form.querySelector('[name="hiveID"]').value = hive.hiveID;
            form.querySelector('[name="hiveNumber"]').value = hive.hiveNumber;
            form.querySelector('[name="location"]').value = hive.location;
            form.querySelector('[name="dateEstablished"]').value = hive.dateEstablished;
            form.querySelector('[name="queenAge"]').value = hive.queenAge || '';
            form.querySelector('[name="status"]').value = hive.status;
            form.querySelector('[name="notes"]').value = hive.notes || '';

            new bootstrap.Modal(document.getElementById('editHiveModal')).show();
        }

        async handleAddHive(e) {
            e.preventDefault();
            
            try {
                const formData = new FormData(e.target);
                const data = {
                    action: 'add',
                    ...Object.fromEntries(formData)
                };
                
                const response = await api.post('hive', data);
                if (response.success) {
                    showToast('Hive added successfully');
                    this.loadHives();
                    e.target.reset();
                    bootstrap.Modal.getInstance(document.getElementById('addHiveModal')).hide();
                } else {
                    showToast(response.error, 'error');
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        }

        async handleUpdateHive(e) {
            e.preventDefault();
            
            try {
                const formData = new FormData(e.target);
                const data = {
                    action: 'update',
                    ...Object.fromEntries(formData)
                };
                
                const response = await api.post('hive', data);
                if (response.success) {
                    showToast('Hive updated successfully');
                    this.loadHives();
                    bootstrap.Modal.getInstance(document.getElementById('editHiveModal')).hide();
                } else {
                    showToast(response.error, 'error');
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        }

        async deleteHive(hiveID) {
            if (!confirm('Are you sure you want to delete this hive?')) return;
            
            try {
                const response = await api.post('hive', {
                    action: 'delete',
                    hiveID: hiveID
                });
                
                if (response.success) {
                    showToast('Hive deleted successfully');
                    this.loadHives();
                } else {
                    showToast(response.error, 'error');
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        }

        addHealthCheck(hiveID) {
            const form = document.getElementById('addHealthCheckForm');
            if (!form) return;

            form.querySelector('[name="hiveID"]').value = hiveID;
            form.querySelector('[name="checkDate"]').value = new Date().toISOString().split('T')[0];

            new bootstrap.Modal(document.getElementById('addHealthCheckModal')).show();
        }

        async handleAddHealthCheck(e) {
            e.preventDefault();
            
            try {
                const formData = new FormData(e.target);
                const data = {
                    action: 'add',
                    ...Object.fromEntries(formData)
                };
                
                const response = await api.post('health', data);
                if (response.success) {
                    showToast('Health check added successfully');
                    this.loadHives();
                    e.target.reset();
                    bootstrap.Modal.getInstance(document.getElementById('addHealthCheckModal')).hide();
                } else {
                    showToast(response.error, 'error');
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        }

        getStatusClass(status) {
            switch (status?.toLowerCase()) {
                case 'active':
                    return 'success';
                case 'inactive':
                    return 'danger';
                case 'maintenance':
                    return 'warning';
                default:
                    return 'secondary';
            }
        }

        getStrengthClass(strength) {
            switch (strength?.toLowerCase()) {
                case 'strong':
                    return 'success';
                case 'moderate':
                    return 'warning';
                case 'weak':
                    return 'danger';
                default:
                    return 'secondary';
            }
        }

        getQualityClass(quality) {
            switch (quality?.toLowerCase()) {
                case 'premium':
                    return 'success';
                case 'standard':
                    return 'warning';
                case 'low':
                    return 'danger';
                default:
                    return 'secondary';
            }
        }
    }

    // Initialize the hive manager
    const hiveManager = new HiveManager();
}
