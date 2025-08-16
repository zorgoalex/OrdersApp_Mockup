// Filters and search functionality

// Current filter state
let currentFilters = {
    status: '',
    project: '',
    dateRange: '',
    showArchived: false,
    searchQuery: ''
};

// Filtered orders cache
let filteredOrders = [];
let allOrders = [];

// Initialize filters
function initializeFilters() {
    // Check if demo data is available
    if (!window.demoData) {
        console.warn('Demo data not available yet, retrying...');
        setTimeout(initializeFilters, 100);
        return;
    }
    
    allOrders = window.demoData.helpers.getOrdersWithDetails();
    filteredOrders = [...allOrders];
    
    // Populate project filter options
    populateProjectFilter();
    
    // Wait for DOM to be ready before applying filters
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => applyFilters(), 100);
        });
    } else {
        // DOM is already ready, but wait a bit for other modules
        setTimeout(() => applyFilters(), 100);
    }
}

// Populate project filter dropdown
function populateProjectFilter() {
    const projectFilter = document.getElementById('projectFilter');
    const projects = window.demoData.projects;
    
    // Clear existing options except "Все проекты"
    while (projectFilter.children.length > 1) {
        projectFilter.removeChild(projectFilter.lastChild);
    }
    
    // Add project options
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        projectFilter.appendChild(option);
    });
    
    // Add "Без проекта" option
    const noProjectOption = document.createElement('option');
    noProjectOption.value = 'no-project';
    noProjectOption.textContent = 'Без проекта';
    projectFilter.appendChild(noProjectOption);
}

// Show filters panel
function showFilters() {
    const filtersPanel = document.getElementById('filtersPanel');
    filtersPanel.classList.add('show');
    
    // Update filter values from current state
    document.getElementById('statusFilter').value = currentFilters.status;
    document.getElementById('projectFilter').value = currentFilters.project;
    document.getElementById('dateFilter').value = currentFilters.dateRange;
    document.getElementById('showArchived').checked = currentFilters.showArchived;
}

// Hide filters panel
function hideFilters() {
    const filtersPanel = document.getElementById('filtersPanel');
    filtersPanel.classList.remove('show');
}

// Apply filters
function applyFilters() {
    // Get filter values
    currentFilters.status = document.getElementById('statusFilter').value;
    currentFilters.project = document.getElementById('projectFilter').value;
    currentFilters.dateRange = document.getElementById('dateFilter').value;
    currentFilters.showArchived = document.getElementById('showArchived').checked;
    
    // Start with all orders
    filteredOrders = [...allOrders];
    
    // Apply status filter
    if (currentFilters.status) {
        filteredOrders = filteredOrders.filter(order => order.status_code === currentFilters.status);
    }
    
    // Apply project filter
    if (currentFilters.project) {
        if (currentFilters.project === 'no-project') {
            filteredOrders = filteredOrders.filter(order => !order.project_id);
        } else {
            filteredOrders = filteredOrders.filter(order => order.project_id === currentFilters.project);
        }
    }
    
    // Apply archived filter
    if (!currentFilters.showArchived) {
        filteredOrders = filteredOrders.filter(order => !order.is_archived);
    }
    
    // Apply date range filter
    if (currentFilters.dateRange) {
        const now = new Date();
        let startDate;
        
        switch (currentFilters.dateRange) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
        }
        
        if (startDate) {
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.updated_at);
                return orderDate >= startDate;
            });
        }
    }
    
    // Apply search query if exists
    if (currentFilters.searchQuery) {
        filteredOrders = applySearch(filteredOrders, currentFilters.searchQuery);
    }
    
    // Update UI
    updateOrdersDisplay();
    updateFilterIndicators();
    updateStats();
}

// Reset all filters
function resetFilters() {
    currentFilters = {
        status: '',
        project: '',
        dateRange: '',
        showArchived: false,
        searchQuery: ''
    };
    
    // Reset form values
    document.getElementById('statusFilter').value = '';
    document.getElementById('projectFilter').value = '';
    document.getElementById('dateFilter').value = '';
    document.getElementById('showArchived').checked = false;
    document.getElementById('searchInput').value = '';
    
    // Hide clear search button
    const clearButton = document.querySelector('.clear-search');
    if (clearButton) {
        clearButton.style.display = 'none';
    }
    
    // Apply filters
    applyFilters();
}

// Search orders
function searchOrders() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    const clearButton = document.querySelector('.clear-search');
    
    // Show/hide clear button
    if (clearButton) {
        clearButton.style.display = query ? 'block' : 'none';
    }
    
    currentFilters.searchQuery = query;
    
    // Apply search with debounce
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
        applyFilters();
    }, 300);
}

// Clear search
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearButton = document.querySelector('.clear-search');
    
    searchInput.value = '';
    currentFilters.searchQuery = '';
    
    if (clearButton) {
        clearButton.style.display = 'none';
    }
    
    applyFilters();
}

// Apply search to orders array
function applySearch(orders, query) {
    if (!query) return orders;
    
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return orders.filter(order => {
        const searchString = [
            order.order_no,
            order.name,
            order.note || '',
            order.project ? order.project.name : '',
            order.ui_status_label
        ].join(' ').toLowerCase();
        
        return searchTerms.every(term => searchString.includes(term));
    });
}

// Update filter indicators
function updateFilterIndicators() {
    const hasActiveFilters = !!(
        currentFilters.status ||
        currentFilters.project ||
        currentFilters.dateRange ||
        currentFilters.showArchived ||
        currentFilters.searchQuery
    );
    
    // Update filter button appearance
    const filterButton = document.querySelector('[onclick="showFilters()"]');
    if (filterButton) {
        if (hasActiveFilters) {
            filterButton.classList.add('active');
            if (!filterButton.querySelector('.filter-badge')) {
                const badge = document.createElement('span');
                badge.className = 'filter-badge';
                badge.textContent = getActiveFiltersCount();
                filterButton.appendChild(badge);
            } else {
                filterButton.querySelector('.filter-badge').textContent = getActiveFiltersCount();
            }
        } else {
            filterButton.classList.remove('active');
            const badge = filterButton.querySelector('.filter-badge');
            if (badge) {
                badge.remove();
            }
        }
    }
}

// Get count of active filters
function getActiveFiltersCount() {
    let count = 0;
    if (currentFilters.status) count++;
    if (currentFilters.project) count++;
    if (currentFilters.dateRange) count++;
    if (currentFilters.showArchived) count++;
    if (currentFilters.searchQuery) count++;
    return count;
}

// Update orders display
function updateOrdersDisplay() {
    // Update orders count
    const ordersCount = document.getElementById('ordersCount');
    if (ordersCount) {
        const total = filteredOrders.length;
        const suffix = getFilterSuffix();
        ordersCount.textContent = `Найдено заказов: ${total}${suffix}`;
    }
    
    // Update table only if table module is available
    if (window.tableModule && window.tableModule.updateOrdersTable) {
        try {
            window.tableModule.updateOrdersTable(filteredOrders);
        } catch (error) {
            console.warn('Error updating table:', error);
        }
    }
    
    // Show/hide empty state
    const emptyState = document.getElementById('emptyState');
    const tableWrapper = document.querySelector('.table-wrapper');
    const ordersCards = document.querySelector('.orders-cards');
    
    if (filteredOrders.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (tableWrapper) tableWrapper.style.display = 'none';
        if (ordersCards) ordersCards.style.display = 'none';
    } else {
        if (emptyState) emptyState.style.display = 'none';
        if (tableWrapper) tableWrapper.style.display = 'block';
        if (ordersCards) ordersCards.style.display = 'block';
    }
}

// Get filter suffix for display
function getFilterSuffix() {
    const activeFilters = [];
    
    if (currentFilters.status) {
        const statusLabels = {
            'draft': 'черновики',
            'submitted': 'на проверке',
            'approved': 'принятые',
            'revision': 'на доработку'
        };
        activeFilters.push(statusLabels[currentFilters.status] || currentFilters.status);
    }
    
    if (currentFilters.project) {
        if (currentFilters.project === 'no-project') {
            activeFilters.push('без проекта');
        } else {
            const project = window.demoData.helpers.getProject(currentFilters.project);
            if (project) {
                activeFilters.push(`проект "${project.name}"`);
            }
        }
    }
    
    if (currentFilters.dateRange) {
        const dateLabels = {
            'today': 'за сегодня',
            'week': 'за неделю',
            'month': 'за месяц',
            'quarter': 'за 3 месяца'
        };
        activeFilters.push(dateLabels[currentFilters.dateRange]);
    }
    
    if (currentFilters.showArchived) {
        activeFilters.push('включая архив');
    }
    
    if (currentFilters.searchQuery) {
        activeFilters.push(`поиск: "${currentFilters.searchQuery}"`);
    }
    
    return activeFilters.length > 0 ? ` (${activeFilters.join(', ')})` : '';
}

// Update statistics
function updateStats() {
    const stats = window.demoData.helpers.getOrdersStats(filteredOrders);
    
    // Update stat cards
    const updateStatCard = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            
            // Add animation
            element.style.transform = 'scale(1.1)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 150);
        }
    };
    
    updateStatCard('draftCount', stats.draft);
    updateStatCard('submittedCount', stats.submitted);
    updateStatCard('approvedCount', stats.approved);
    updateStatCard('revisionCount', stats.revision);
}

// Quick filter functions
function filterByStatus(status) {
    document.getElementById('statusFilter').value = status;
    applyFilters();
    hideFilters();
}

function filterByProject(projectId) {
    document.getElementById('projectFilter').value = projectId;
    applyFilters();
    hideFilters();
}

function toggleArchived() {
    const checkbox = document.getElementById('showArchived');
    checkbox.checked = !checkbox.checked;
    applyFilters();
}

// Advanced search functions
function searchByOrderNumber(orderNo) {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = orderNo;
    currentFilters.searchQuery = orderNo;
    applyFilters();
}

function searchByProjectName(projectName) {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = projectName;
    currentFilters.searchQuery = projectName;
    applyFilters();
}

// Export filtered data
function getFilteredOrders() {
    return filteredOrders;
}

function getCurrentFilters() {
    return { ...currentFilters };
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + F to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
    
    // Escape to clear search or close filters
    if (e.key === 'Escape') {
        const filtersPanel = document.getElementById('filtersPanel');
        if (filtersPanel && filtersPanel.classList.contains('show')) {
            hideFilters();
        } else if (currentFilters.searchQuery) {
            clearSearch();
        }
    }
});

// Add CSS for filter button active state and badge
const filterStyles = `
    .btn.active {
        background-color: #2563eb !important;
        color: white !important;
        border-color: #2563eb !important;
    }
    
    .filter-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #dc2626;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 12px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
    }
    
    .page-actions .btn {
        position: relative;
    }
    
    .stat-number {
        transition: transform 0.15s ease;
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = filterStyles;
document.head.appendChild(styleSheet);

// Export functions for global access
window.filtersModule = {
    initializeFilters,
    showFilters,
    hideFilters,
    applyFilters,
    resetFilters,
    searchOrders,
    clearSearch,
    filterByStatus,
    filterByProject,
    toggleArchived,
    searchByOrderNumber,
    searchByProjectName,
    getFilteredOrders,
    getCurrentFilters
};