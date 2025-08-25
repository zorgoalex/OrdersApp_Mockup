// Table functionality for orders display

// Table state
let currentSortColumn = 'updated_at';
let currentSortDirection = 'desc';
let currentPage = 1;
let itemsPerPage = 15; // Увеличиваем до 15 для демонстрации скролла
let tableData = [];

// Initialize table
function initializeTable() {
    // Check if demo data is available
    if (!window.demoData || !window.demoData.helpers || !window.demoData.helpers.getOrdersWithDetails) {
        console.warn('Demo data not available yet for table initialization, retrying...');
        setTimeout(initializeTable, 200);
        return;
    }
    
    try {
        tableData = window.demoData.helpers.getOrdersWithDetails();
        console.log('✅ Table initialized with', tableData.length, 'orders');
        
        // Only update table if pagination elements exist
        const paginationContainer = document.getElementById('paginationContainer');
        if (paginationContainer) {
            updateOrdersTable(tableData);
            initializePagination();
        } else {
            console.warn('Pagination container not found, deferring table initialization');
            // Try again after a short delay
            setTimeout(() => {
                const container = document.getElementById('paginationContainer');
                if (container) {
                    updateOrdersTable(tableData);
                    initializePagination();
                } else {
                    console.warn('Pagination container still not found, table may not display correctly');
                }
            }, 300);
        }
    } catch (error) {
        console.error('Error initializing table:', error);
        setTimeout(initializeTable, 500);
    }
}

// Update orders table
function updateOrdersTable(orders) {
    tableData = orders || [];
    
    // Sort data
    const sortedData = sortTableData(tableData, currentSortColumn, currentSortDirection);
    
    // Apply pagination
    const paginatedData = paginateData(sortedData, currentPage, itemsPerPage);
    
    // Render both desktop table and mobile cards
    renderDesktopTable(paginatedData);
    renderMobileCards(paginatedData);
    
    // Update pagination
    updatePagination(sortedData.length);
    
    // Update sort indicators
    updateSortIndicators();
}

// Sort table data
function sortTableData(data, column, direction) {
    return [...data].sort((a, b) => {
        let aValue, bValue;
        
        switch (column) {
            case 'order_no':
                aValue = a.order_no;
                bValue = b.order_no;
                break;
            case 'name':
                aValue = a.name?.toLowerCase() || '';
                bValue = b.name?.toLowerCase() || '';
                break;
            case 'project':
                aValue = a.project?.name?.toLowerCase() || '';
                bValue = b.project?.name?.toLowerCase() || '';
                break;
            case 'status':
                // Custom sort order for statuses
                const statusOrder = { 'draft': 1, 'revision': 2, 'submitted': 3, 'approved': 4 };
                aValue = statusOrder[a.status_code] || 0;
                bValue = statusOrder[b.status_code] || 0;
                break;
            case 'items_count':
                aValue = a.items_count || 0;
                bValue = b.items_count || 0;
                break;
            case 'files_count':
                aValue = a.files_count || 0;
                bValue = b.files_count || 0;
                break;
            case 'updated_at':
                aValue = new Date(a.updated_at);
                bValue = new Date(b.updated_at);
                break;
            default:
                aValue = a[column] || '';
                bValue = b[column] || '';
        }
        
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

// Paginate data
function paginateData(data, page, perPage) {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    return data.slice(startIndex, endIndex);
}

// Render desktop table
function renderDesktopTable(orders) {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    
    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-row">
                    <div class="empty-message">
                        <i class="fas fa-search"></i>
                        <span>Заказы не найдены</span>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr class="order-row ${order.is_archived ? 'archived' : ''}" data-order-id="${order.id}">
            <td class="order-number">
                <div class="order-number-content">
                    <span class="order-no">${order.order_no}</span>
                    ${order.is_archived ? '<i class="fas fa-archive archived-icon" title="Архивный заказ"></i>' : ''}
                </div>
            </td>
            <td class="order-name">
                <div class="order-name-content">
                    <span class="name" title="${order.name}">${order.name}</span>
                    ${order.note ? `<small class="note" title="${order.note}">${truncateText(order.note, 50)}</small>` : ''}
                </div>
            </td>
            <td class="order-project">
                ${order.project ? 
                    `<span class="project-name" title="${order.project.name}">${order.project.name}</span>` : 
                    '<span class="no-project">—</span>'
                }
            </td>
            <td class="order-status">
                <div class="status-container">
                    <span class="status-badge ${order.status_code}">
                        ${getStatusIcon(order.status_code)}
                        ${order.ui_status_label}
                    </span>
                    ${order.is_returned_for_revision && order.revision_reason ? 
                        `<i class="fas fa-exclamation-triangle revision-indicator" title="Причина возврата: ${order.revision_reason}"></i>` : 
                        ''
                    }
                </div>
            </td>
            <td class="order-items">
                <div class="items-info">
                    <span class="items-count">${order.items_count} поз.</span>
                    ${order.total_quantity ? `<small>(${order.total_quantity} шт.)</small>` : ''}
                </div>
            </td>
            <td class="order-files">
                <div class="files-info">
                    <span class="files-count">${order.files_count}</span>
                    ${order.files_count > 0 ? '<i class="fas fa-paperclip"></i>' : ''}
                </div>
            </td>
            <td class="order-date">
                <span class="date-text">${window.demoData.helpers.formatDate(order.updated_at)}</span>
            </td>
            <td class="order-actions">
                ${renderActionButtons(order)}
            </td>
        </tr>
    `).join('');
    
    // Add click handlers for rows
    addDesktopRowClickHandlers();
}

// Render mobile cards
function renderMobileCards(orders) {
    // Create or get mobile cards container
    let cardsContainer = document.querySelector('.orders-cards');
    if (!cardsContainer) {
        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) {
            cardsContainer = document.createElement('div');
            cardsContainer.className = 'orders-cards';
            tableContainer.appendChild(cardsContainer);
        } else {
            return;
        }
    }
    
    if (orders.length === 0) {
        cardsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3>Заказы не найдены</h3>
                <p>Попробуйте изменить параметры поиска</p>
            </div>
        `;
        return;
    }
    
    cardsContainer.innerHTML = orders.map(order => `
        <div class="order-card ${order.is_archived ? 'archived' : ''}" data-order-id="${order.id}" onclick="viewOrder('${order.id}')">
            <div class="order-card-header">
                <div class="order-number">
                    ${order.order_no}
                    ${order.is_archived ? '<i class="fas fa-archive archived-icon"></i>' : ''}
                </div>
                <div class="order-date">${window.demoData.helpers.formatDate(order.updated_at)}</div>
            </div>
            
            <div class="order-title">${order.name}</div>
            
            ${order.project ? 
                `<div class="order-project">${order.project.name}</div>` : 
                '<div class="order-project no-project">Без проекта</div>'
            }
            
            <div class="order-card-body">
                <div class="order-stats">
                    <span><i class="fas fa-list"></i> ${order.items_count}</span>
                    <span><i class="fas fa-paperclip"></i> ${order.files_count}</span>
                    ${order.total_quantity ? `<span><i class="fas fa-cubes"></i> ${order.total_quantity}</span>` : ''}
                </div>
                
                <div class="status-badge ${order.status_code}">
                    ${getStatusIcon(order.status_code)}
                    ${order.ui_status_label}
                </div>
            </div>
            
            <div class="order-card-footer">
                ${order.is_returned_for_revision && order.revision_reason ? 
                    `<div class="revision-note">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Требует доработки</span>
                    </div>` : 
                    '<div></div>'
                }
                
                <div class="card-actions" onclick="event.stopPropagation()">
                    ${renderMobileActionButtons(order)}
                </div>
            </div>
        </div>
    `).join('');
}

// Render action buttons for desktop
function renderActionButtons(order) {
    const buttons = [];
    
    // View button - always available
    buttons.push(`
        <button class="action-btn view" onclick="viewOrder('${order.id}')" title="Просмотр">
            <i class="fas fa-eye"></i>
        </button>
    `);
    
    // Edit button - only for editable orders
    if (order.is_editable) {
        buttons.push(`
            <button class="action-btn edit" onclick="editOrder('${order.id}')" title="Редактировать">
                <i class="fas fa-edit"></i>
            </button>
        `);
    }
    
    // Submit button - only for draft orders
    if (order.status_code === 'draft' && !order.is_archived) {
        buttons.push(`
            <button class="action-btn submit" onclick="submitOrder('${order.id}')" title="Отправить на проверку">
                <i class="fas fa-paper-plane"></i>
            </button>
        `);
    }
    
    // Duplicate button - always available
    buttons.push(`
        <button class="action-btn duplicate" onclick="duplicateOrder('${order.id}')" title="Дублировать">
            <i class="fas fa-copy"></i>
        </button>
    `);
    
    // Archive/Unarchive button
    if (order.is_archived) {
        buttons.push(`
            <button class="action-btn archive" onclick="unarchiveOrder('${order.id}')" title="Восстановить из архива">
                <i class="fas fa-undo"></i>
            </button>
        `);
    } else if (order.status_code !== 'approved') {
        buttons.push(`
            <button class="action-btn archive" onclick="archiveOrder('${order.id}')" title="В архив">
                <i class="fas fa-archive"></i>
            </button>
        `);
    }
    
    return `<div class="action-buttons">${buttons.join('')}</div>`;
}

// Render action buttons for mobile (simplified)
function renderMobileActionButtons(order) {
    const buttons = [];
    
    // Primary action based on status
    if (order.is_editable) {
        buttons.push(`
            <button class="action-btn edit" onclick="editOrder('${order.id}')" title="Редактировать">
                <i class="fas fa-edit"></i>
            </button>
        `);
    }
    
    if (order.status_code === 'draft' && !order.is_archived) {
        buttons.push(`
            <button class="action-btn submit" onclick="submitOrder('${order.id}')" title="Отправить">
                <i class="fas fa-paper-plane"></i>
            </button>
        `);
    }
    
    // More actions menu
    buttons.push(`
        <button class="action-btn more" onclick="showMobileOrderMenu('${order.id}')" title="Еще">
            <i class="fas fa-ellipsis-v"></i>
        </button>
    `);
    
    return buttons.join('');
}

// Show mobile order menu
function showMobileOrderMenu(orderId) {
    const order = window.demoData.orders.find(o => o.id === orderId);
    if (!order) return;
    
    const actions = [];
    
    actions.push(`
        <button onclick="viewOrder('${orderId}'); hideMobileMenu()">
            <i class="fas fa-eye"></i>
            Просмотр
        </button>
    `);
    
    actions.push(`
        <button onclick="duplicateOrder('${orderId}'); hideMobileMenu()">
            <i class="fas fa-copy"></i>
            Дублировать
        </button>
    `);
    
    if (order.is_archived) {
        actions.push(`
            <button onclick="unarchiveOrder('${orderId}'); hideMobileMenu()">
                <i class="fas fa-undo"></i>
                Восстановить
            </button>
        `);
    } else if (order.status_code !== 'approved') {
        actions.push(`
            <button onclick="archiveOrder('${orderId}'); hideMobileMenu()">
                <i class="fas fa-archive"></i>
                В архив
            </button>
        `);
    }
    
    // Create mobile menu
    const menu = document.createElement('div');
    menu.className = 'mobile-order-menu';
    menu.innerHTML = `
        <div class="mobile-menu-overlay" onclick="hideMobileMenu()"></div>
        <div class="mobile-menu-content">
            <div class="mobile-menu-header">
                <h4>Заказ ${order.order_no}</h4>
                <button onclick="hideMobileMenu()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="mobile-menu-actions">
                ${actions.join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(menu);
    menu.style.display = 'flex';
}

// Hide mobile menu
function hideMobileMenu() {
    const menu = document.querySelector('.mobile-order-menu');
    if (menu) {
        menu.remove();
    }
}

// Get status icon
function getStatusIcon(statusCode) {
    const icons = {
        'draft': '<i class="fas fa-edit"></i>',
        'submitted': '<i class="fas fa-clock"></i>',
        'approved': '<i class="fas fa-check-circle"></i>',
        'revision': '<i class="fas fa-undo"></i>'
    };
    return icons[statusCode] || '';
}

// Truncate text
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Add row click handlers for desktop
function addDesktopRowClickHandlers() {
    const rows = document.querySelectorAll('.order-row');
    rows.forEach(row => {
        row.addEventListener('click', (e) => {
            // Don't trigger if clicking on action buttons
            if (e.target.closest('.action-buttons')) return;
            
            const orderId = row.dataset.orderId;
            viewOrder(orderId);
        });
        
        // Add hover effect
        row.addEventListener('mouseenter', () => {
            row.style.backgroundColor = '#f8fafc';
        });
        
        row.addEventListener('mouseleave', () => {
            row.style.backgroundColor = '';
        });
    });
}

// Sort table
function sortTable(column) {
    if (currentSortColumn === column) {
        // Toggle direction
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        // New column, default to ascending
        currentSortColumn = column;
        currentSortDirection = 'asc';
    }
    
    // Reset to first page when sorting
    currentPage = 1;
    
    // Update table
    updateOrdersTable(tableData);
}

// Update sort indicators
function updateSortIndicators() {
    // Remove all existing sort classes
    const headers = document.querySelectorAll('.orders-table th');
    headers.forEach(header => {
        header.classList.remove('sorted-asc', 'sorted-desc');
    });
    
    // Add sort class to current column
    const currentHeader = document.querySelector(`[onclick="sortTable('${currentSortColumn}')"]`);
    if (currentHeader) {
        currentHeader.classList.add(`sorted-${currentSortDirection}`);
    }
}

// Pagination functions
function initializePagination() {
    // Items per page selector
    const perPageSelect = createPerPageSelect();
    const paginationContainer = document.getElementById('paginationContainer');
    if (paginationContainer && !document.getElementById('perPageSelect')) {
        const paginationInfo = paginationContainer.querySelector('.pagination-info');
        if (paginationInfo) {
            paginationInfo.appendChild(perPageSelect);
        }
    }
}

function createPerPageSelect() {
    const container = document.createElement('div');
    container.className = 'per-page-container';
    container.innerHTML = `
        <label for="perPageSelect">Показать:</label>
        <select id="perPageSelect" onchange="changeItemsPerPage(this.value)">
            <option value="15" ${itemsPerPage === 15 ? 'selected' : ''}>15</option>
            <option value="25" ${itemsPerPage === 25 ? 'selected' : ''}>25</option>
            <option value="50" ${itemsPerPage === 50 ? 'selected' : ''}>50</option>
            <option value="100" ${itemsPerPage === 100 ? 'selected' : ''}>100</option>
        </select>
    `;
    return container;
}

function changeItemsPerPage(newValue) {
    itemsPerPage = parseInt(newValue);
    currentPage = 1; // Reset to first page
    updateOrdersTable(tableData);
}

function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationInfo = document.getElementById('paginationInfo');
    const pagination = document.getElementById('pagination');
    const paginationContainer = document.getElementById('paginationContainer');
    
    if (!pagination || !paginationInfo) {
        console.warn('Pagination elements not found, skipping pagination update');
        return;
    }
    
    // Show/hide sticky pagination based on total items
    if (paginationContainer) {
        if (totalItems > 15) {
            paginationContainer.classList.add('sticky-pagination');
        } else {
            paginationContainer.classList.remove('sticky-pagination');
        }
    }
    
    // Update info
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Shorter mobile text to keep one line
    const isMobileView = window.innerWidth < 768;
    const infoText = isMobileView
        ? `${startItem}-${endItem} из ${totalItems}`
        : `Показано ${startItem}-${endItem} из ${totalItems} заказов`;

    // Safely update pagination info
    const infoSpan = paginationInfo.querySelector('span');
    if (infoSpan) {
        infoSpan.textContent = infoText;
    } else {
        paginationInfo.textContent = infoText;
    }
    
    // Generate pagination
    pagination.innerHTML = generatePaginationHTML(currentPage, totalPages);
}

function generatePaginationHTML(current, total) {
    if (total <= 1) return '';
    
    let html = '';
    
    // Previous button
    html += `
        <button class="page-btn ${current === 1 ? 'disabled' : ''}" 
                onclick="goToPage(${current - 1})" 
                ${current === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers (simplified for mobile)
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
        // Mobile: show only current page number between arrows
        html += `<span class="page-info">${current}</span>`;
    } else {
        // Desktop: show page numbers
        const startPage = Math.max(1, current - 2);
        const endPage = Math.min(total, current + 2);
        
        if (startPage > 1) {
            html += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
            if (startPage > 2) {
                html += `<span class="page-ellipsis">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="page-btn ${i === current ? 'active' : ''}" 
                        onclick="goToPage(${i})">
                    ${i}
                </button>
            `;
        }
        
        if (endPage < total) {
            if (endPage < total - 1) {
                html += `<span class="page-ellipsis">...</span>`;
            }
            html += `<button class="page-btn" onclick="goToPage(${total})">${total}</button>`;
        }
    }
    
    // Next button
    html += `
        <button class="page-btn ${current === total ? 'disabled' : ''}" 
                onclick="goToPage(${current + 1})" 
                ${current === total ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    return html;
}

function goToPage(page) {
    const totalPages = Math.ceil(tableData.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    updateOrdersTable(tableData);
    
    // Scroll to top on mobile
    if (window.innerWidth < 768) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Export orders (placeholder function)
function exportOrders() {
    const filteredData = window.filtersModule ? window.filtersModule.getFilteredOrders() : tableData;
    
    showNotification('success', `Экспорт ${filteredData.length} заказов начался. Файл будет загружен автоматически.`);
    
    // Simulate export delay
    setTimeout(() => {
        // Create CSV content
        const csvContent = generateCSV(filteredData);
        downloadCSV(csvContent, 'orders_export.csv');
    }, 1000);
}

function generateCSV(orders) {
    const headers = [
        'Номер заказа',
        'Название',
        'Проект',
        'Статус',
        'Деталей',
        'Файлов',
        'Обновлен',
        'Создан'
    ];
    
    const rows = orders.map(order => [
        order.order_no,
        order.name,
        order.project ? order.project.name : '',
        order.ui_status_label,
        order.items_count,
        order.files_count,
        new Date(order.updated_at).toLocaleDateString('ru-RU'),
        new Date(order.created_at).toLocaleDateString('ru-RU')
    ]);
    
    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    
    return csvContent;
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Mobile menu styles
const mobileMenuStyles = `
    .mobile-order-menu {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 2000;
        display: none;
        align-items: flex-end;
        justify-content: center;
    }
    
    .mobile-menu-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
    }
    
    .mobile-menu-content {
        background: #fff;
        border-radius: 16px 16px 0 0;
        max-width: 400px;
        width: 100%;
        position: relative;
        animation: slideUp 0.3s ease;
    }
    
    @keyframes slideUp {
        from {
            transform: translateY(100%);
        }
        to {
            transform: translateY(0);
        }
    }
    
    .mobile-menu-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #e2e8f0;
    }
    
    .mobile-menu-header h4 {
        margin: 0;
        color: #1e293b;
    }
    
    .mobile-menu-header button {
        width: 32px;
        height: 32px;
        border: none;
        background: #f3f4f6;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
    }
    
    .mobile-menu-actions {
        padding: 8px 0 20px;
    }
    
    .mobile-menu-actions button {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        font-size: 16px;
        color: #374151;
        transition: background-color 0.2s;
    }
    
    .mobile-menu-actions button:hover {
        background-color: #f9fafb;
    }
    
    .mobile-menu-actions button i {
        width: 20px;
        color: #6b7280;
    }
    
    .page-info {
        padding: 4px 8px;
        font-size: 12px;
        color: #6b7280;
    }
    
    .revision-note {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #dc2626;
    }
    
    .card-actions {
        display: flex;
        gap: 4px;
    }
    
    @media (max-width: 767px) {
        .per-page-container {
            display: none;
        }
    }
`;

// Inject mobile menu styles
const mobileStyleSheet = document.createElement('style');
mobileStyleSheet.textContent = mobileMenuStyles;
document.head.appendChild(mobileStyleSheet);

// Export functions for global access
window.tableModule = {
    initializeTable,
    updateOrdersTable,
    sortTable,
    goToPage,
    changeItemsPerPage,
    exportOrders,
    showMobileOrderMenu,
    hideMobileMenu
};
