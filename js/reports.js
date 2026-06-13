// Reports Management

// Initialize reports functionality
function initializeReports() {
    // Show reports section when nav link is clicked
    document.querySelector('a[href="#reports"]')?.addEventListener('click', function() {
        loadReports();
    });
    
    // Load reports data
    loadReports();
    
    // Handle custom report generation
    document.getElementById('reportsForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        generateCustomReport();
    });
    
    // Set default dates
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput) startDateInput.valueAsDate = lastMonth;
    if (endDateInput) endDateInput.valueAsDate = today;
}

// Load reports data
function loadReports() {
    // Update active section
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    const reportsSection = document.getElementById('reports');
    if (reportsSection) reportsSection.style.display = 'block';

    // Load different types of reports
    loadProductionReport();
    loadEquipmentReport();
    loadHealthReport();
}

// Load production report
function loadProductionReport() {
    fetch('/bkinventory/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            controller: 'reports',
            action: 'getProductionReport'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayProductionReport(data.report);
        } else {
            console.error('Error loading production report:', data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Load equipment report
function loadEquipmentReport() {
    fetch('/bkinventory/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            controller: 'reports',
            action: 'getEquipmentReport'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayEquipmentReport(data.report);
        } else {
            console.error('Error loading equipment report:', data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Load health report
function loadHealthReport() {
    fetch('/bkinventory/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            controller: 'reports',
            action: 'getHealthReport'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayHealthReport(data.report);
        } else {
            console.error('Error loading health report:', data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Generate custom report
function generateCustomReport() {
    const reportType = document.getElementById('reportType')?.value;
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;
    
    if (!reportType) {
        showToast('Please select a report type', 'error');
        return;
    }
    
    // Show loading indicator
    const reportResults = document.getElementById('reportResults');
    if (reportResults) reportResults.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-2">Generating report...</p></div>';
    
    fetch('/bkinventory/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            controller: 'reports',
            action: 'generateCustomReport',
            reportType: reportType,
            startDate: startDate,
            endDate: endDate
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayCustomReport(data.report, data.params);
        } else {
            const reportResults = document.getElementById('reportResults');
            if (reportResults) reportResults.innerHTML = `<div class="alert alert-danger">Error: ${data.error || 'Failed to generate report'}</div>`;
            console.error('Error generating custom report:', data);
        }
    })
    .catch(error => {
        const reportResults = document.getElementById('reportResults');
        if (reportResults) reportResults.innerHTML = `<div class="alert alert-danger">Error: ${error.message || 'Failed to generate report'}</div>`;
        console.error('Error:', error);
    });
}

// Display production report
function displayProductionReport(report) {
    const container = document.getElementById('productionReportSection');
    if (!container) return;

    let html = `
        <div class="card shadow mb-4">
            <div class="card-header py-3">
                <h6 class="m-0 font-weight-bold text-primary">Honey Production Summary</h6>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>Total Production (kg)</th>
                                <th>Average Quality</th>
                                <th>Active Hives</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>This Month</td>
                                <td>${report.monthly?.totalProduction || 0}</td>
                                <td>${report.monthly?.avgQuality || 'N/A'}</td>
                                <td>${report.monthly?.activeHives || 0}</td>
                            </tr>
                            <tr>
                                <td>This Year</td>
                                <td>${report.yearly?.totalProduction || 0}</td>
                                <td>${report.yearly?.avgQuality || 'N/A'}</td>
                                <td>${report.yearly?.activeHives || 0}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// Display equipment report
function displayEquipmentReport(report) {
    const container = document.getElementById('equipmentReportSection');
    if (!container) return;

    let html = `
        <div class="card shadow mb-4">
            <div class="card-header py-3">
                <h6 class="m-0 font-weight-bold text-primary">Equipment Status Summary</h6>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>Equipment Type</th>
                                <th>Total Items</th>
                                <th>Good Condition</th>
                                <th>Needs Attention</th>
                            </tr>
                        </thead>
                        <tbody>
    `;

    if (Array.isArray(report)) {
        report.forEach(item => {
            html += `
                <tr>
                    <td>${item.type}</td>
                    <td>${item.totalCount}</td>
                    <td>${item.goodCondition}</td>
                    <td>${item.needsAttention}</td>
                </tr>
            `;
        });
    } else {
        html += `<tr><td colspan="4" class="text-center">No equipment data available</td></tr>`;
    }

    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// Display health report
function displayHealthReport(report) {
    const container = document.getElementById('healthReportSection');
    if (!container) return;

    let html = `
        <div class="card shadow mb-4">
            <div class="card-header py-3">
                <h6 class="m-0 font-weight-bold text-primary">Hive Health Summary</h6>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>Health Metric</th>
                                <th>Good Status</th>
                                <th>Warning Status</th>
                                <th>Critical Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Colony Strength</td>
                                <td>${report.colonyStrength?.good || 0}</td>
                                <td>${report.colonyStrength?.warning || 0}</td>
                                <td>${report.colonyStrength?.critical || 0}</td>
                            </tr>
                            <tr>
                                <td>Disease Status</td>
                                <td>${report.diseaseStatus?.good || 0}</td>
                                <td>${report.diseaseStatus?.warning || 0}</td>
                                <td>${report.diseaseStatus?.critical || 0}</td>
                            </tr>
                            <tr>
                                <td>Food Stores</td>
                                <td>${report.foodStores?.good || 0}</td>
                                <td>${report.foodStores?.warning || 0}</td>
                                <td>${report.foodStores?.critical || 0}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// Display custom report
function displayCustomReport(report, params) {
    const container = document.getElementById('reportResults');
    if (!container) return;
    
    const dateRange = `${formatDate(params.startDate)} to ${formatDate(params.endDate)}`;
    
    let html = `
        <div class="card shadow mb-4">
            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                <h6 class="m-0 font-weight-bold text-primary">
                    ${getReportTitle(params.reportType)} (${dateRange})
                </h6>
                <div>
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="exportToPDF('${params.reportType}', '${dateRange}')">
                        <i class="fas fa-file-pdf"></i> Export to PDF
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="printReport()">
                        <i class="fas fa-print"></i> Print
                    </button>
                </div>
            </div>
            <div class="card-body">
    `;
    
    switch (params.reportType) {
        case 'honeyProduction':
            html += displayHoneyProductionReport(report);
            break;
        case 'hiveHealth':
            html += displayHiveHealthReport(report);
            break;
        case 'equipmentUsage':
            html += displayEquipmentUsageReport(report);
            break;
        default:
            html += `<div class="alert alert-warning">Unknown report type</div>`;
    }
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Export report to PDF
function exportToPDF(reportType, dateRange) {
    try {
        // Initialize jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Set document properties
        const title = getReportTitle(reportType);
        doc.setProperties({
            title: title,
            subject: 'Beekeeping Inventory Report',
            author: 'Beekeeping Inventory System',
            keywords: 'beekeeping, report, inventory',
            creator: 'Beekeeping Inventory System'
        });
        
        // Add title and date range
        doc.setFontSize(18);
        doc.text(title, 105, 15, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Date Range: ${dateRange}`, 105, 25, { align: 'center' });
        doc.text(`Generated on: ${formatDate(new Date())}`, 105, 30, { align: 'center' });
        
        // Add logo or header image if available
        // doc.addImage('path/to/logo.png', 'PNG', 10, 10, 30, 30);
        
        // Get report data from the DOM
        const reportContent = document.getElementById('reportResults');
        if (!reportContent) return;
        
        // Extract tables from the report
        const tables = reportContent.querySelectorAll('table');
        if (tables.length === 0) {
            doc.setFontSize(12);
            doc.text('No data available for this report', 105, 50, { align: 'center' });
        } else {
            let yPos = 40;
            
            // Process each table in the report
            tables.forEach((table, index) => {
                // Get table heading
                const headingElement = table.closest('.table-responsive').previousElementSibling;
                const heading = headingElement ? headingElement.textContent.trim() : `Table ${index + 1}`;
                
                // Add section heading
                doc.setFontSize(14);
                doc.text(heading, 14, yPos);
                yPos += 10;
                
                // Convert table to jsPDF autoTable format
                const tableData = [];
                const tableHeaders = [];
                
                // Get headers
                const headerCells = table.querySelectorAll('thead th');
                headerCells.forEach(cell => {
                    tableHeaders.push({ title: cell.textContent.trim(), dataKey: cell.textContent.trim() });
                });
                
                // Get rows
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const rowData = {};
                    const cells = row.querySelectorAll('td');
                    cells.forEach((cell, cellIndex) => {
                        rowData[tableHeaders[cellIndex].title] = cell.textContent.trim();
                    });
                    tableData.push(rowData);
                });
                
                // Add table to PDF
                doc.autoTable({
                    startY: yPos,
                    head: [tableHeaders.map(header => header.title)],
                    body: tableData.map(row => tableHeaders.map(header => row[header.title])),
                    theme: 'grid',
                    headStyles: {
                        fillColor: [66, 135, 245],
                        textColor: 255,
                        fontStyle: 'bold'
                    },
                    alternateRowStyles: {
                        fillColor: [240, 240, 240]
                    },
                    margin: { top: 10 }
                });
                
                // Update Y position for next table
                yPos = doc.lastAutoTable.finalY + 15;
                
                // Add new page if needed
                if (index < tables.length - 1 && yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }
            });
        }
        
        // Add footer with page numbers
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text(`Page ${i} of ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
            doc.text('Beekeeping Inventory Management System', 105, doc.internal.pageSize.height - 5, { align: 'center' });
        }
        
        // Save the PDF
        doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
        
        showToast('PDF exported successfully', 'success');
    } catch (error) {
        console.error('Error generating PDF:', error);
        showToast('Failed to export PDF: ' + error.message, 'error');
    }
}

// Display honey production custom report
function displayHoneyProductionReport(report) {
    let html = '';
    
    // Production by hive
    if (report.byHive && report.byHive.length > 0) {
        html += `
            <h5>Production by Hive</h5>
            <div class="table-responsive mb-4">
                <table class="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>Hive Number</th>
                            <th>Total Production (kg)</th>
                            <th>Average Quality</th>
                            <th>Harvest Count</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        report.byHive.forEach(hive => {
            html += `
                <tr>
                    <td>${hive.hiveNumber}</td>
                    <td>${hive.totalProduction}</td>
                    <td>${hive.avgQuality}</td>
                    <td>${hive.harvestCount}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    } else {
        html += `<div class="alert alert-info mb-4">No production data by hive available for the selected period.</div>`;
    }
    
    // Production by type
    if (report.byType && report.byType.length > 0) {
        html += `
            <h5>Production by Honey Type</h5>
            <div class="table-responsive">
                <table class="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>Honey Type</th>
                            <th>Total Production (kg)</th>
                            <th>Average Quality</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        report.byType.forEach(type => {
            html += `
                <tr>
                    <td>${type.type}</td>
                    <td>${type.totalProduction}</td>
                    <td>${type.avgQuality}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    } else {
        html += `<div class="alert alert-info">No production data by type available for the selected period.</div>`;
    }
    
    return html;
}

// Display hive health custom report
function displayHiveHealthReport(report) {
    let html = '';
    
    if (report.byHive && report.byHive.length > 0) {
        html += `
            <h5>Health Status by Hive</h5>
            <div class="table-responsive">
                <table class="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>Hive Number</th>
                            <th>Average Strength</th>
                            <th>Status</th>
                            <th>Disease Present</th>
                            <th>Pests Present</th>
                            <th>Check Count</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        report.byHive.forEach(hive => {
            const statusClass = 
                hive.status === 'Good' ? 'text-success' : 
                (hive.status === 'Warning' ? 'text-warning' : 'text-danger');
                
            html += `
                <tr>
                    <td>${hive.hiveNumber}</td>
                    <td>${hive.avgStrength}</td>
                    <td class="${statusClass}">${hive.status}</td>
                    <td>${hive.hasDisease ? 'Yes' : 'No'}</td>
                    <td>${hive.hasPests ? 'Yes' : 'No'}</td>
                    <td>${hive.checkCount}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    } else {
        html += `<div class="alert alert-info">No health data available for the selected period.</div>`;
    }
    
    return html;
}

// Display equipment usage custom report
function displayEquipmentUsageReport(report) {
    let html = '';
    
    if (report.byType && report.byType.length > 0) {
        html += `
            <h5>Equipment Status by Type</h5>
            <div class="table-responsive">
                <table class="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>Equipment Type</th>
                            <th>Total Count</th>
                            <th>Good Condition</th>
                            <th>Fair Condition</th>
                            <th>Poor Condition</th>
                            <th>Average Age (years)</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        report.byType.forEach(item => {
            html += `
                <tr>
                    <td>${item.type}</td>
                    <td>${item.totalCount}</td>
                    <td>${item.goodCondition}</td>
                    <td>${item.fairCondition}</td>
                    <td>${item.poorCondition}</td>
                    <td>${item.avgAge}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    } else {
        html += `<div class="alert alert-info">No equipment data available.</div>`;
    }
    
    return html;
}

// Helper function to get report title
function getReportTitle(reportType) {
    switch (reportType) {
        case 'honeyProduction':
            return 'Honey Production Report';
        case 'hiveHealth':
            return 'Hive Health Report';
        case 'equipmentUsage':
            return 'Equipment Usage Report';
        default:
            return 'Custom Report';
    }
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Print report
function printReport() {
    window.print();
}

document.addEventListener('DOMContentLoaded', initializeReports);
