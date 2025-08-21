// Modal dialogs and popups functionality

// Global modal state
let currentModal = null;
let formData = {};
let isFormDirty = false;

// Initialize modals
function initializeModals() {
    // Add click outside to close
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeCurrentModal();
        }
    });

    // Add escape key handler
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentModal) {
            closeCurrentModal();
        }
    });

    // Prevent form submission on Enter
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
            const form = e.target.closest('form');
            if (form) {
                e.preventDefault();
            }
        }
    });
}

// Open modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.style.display = 'flex';
    currentModal = modalId;
    document.body.style.overflow = 'hidden';

    // Focus first input if exists
    setTimeout(() => {
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) {
            firstInput.focus();
        }
    }, 100);
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Check for unsaved changes
    if (isFormDirty && modalId === 'orderFormModal') {
        showSaveConfirmation(modalId);
        return;
    }

    forceCloseModal(modalId);
}

// Force close modal without confirmation
function forceCloseModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.style.display = 'none';
    currentModal = null;
    document.body.style.overflow = '';

    // Reset form data
    if (modalId === 'orderFormModal') {
        formData = {};
        isFormDirty = false;
    }
}

// Close current modal
function closeCurrentModal() {
    if (currentModal) {
        closeModal(currentModal);
    }
}

// View order details
function viewOrder(orderId) {
    const order = window.demoData.orders.find(o => o.id === orderId);
    if (!order) return;

    const orderWithDetails = {
        ...order,
        project: order.project_id ? window.demoData.helpers.getProject(order.project_id) : null,
        items: order.items || [],
        files: order.files || [],
        // Add the is_editable property using the same logic as in demo-data.js
        is_editable: (order.status_code === 'draft' || order.status_code === 'revision') && !order.is_archived,
        is_returned_for_revision: order.status_code === 'revision'
    };

    document.getElementById('modalOrderTitle').textContent = `Заказ ${order.order_no}`;
    document.getElementById('orderDetailsContent').innerHTML = renderOrderDetails(orderWithDetails);

    openModal('orderDetailsModal');
}

// Render order details
function renderOrderDetails(order) {
    const revisionInfo = order.status_code === 'revision' && order.revision_reason ? `
        <div class="revision-alert">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
                <strong>Возвращено на доработку</strong>
                <p>${order.revision_reason}</p>
            </div>
        </div>
    ` : '';

    // Check if order is editable
    const isEditable = order.is_editable && (order.status_code === 'draft' || order.status_code === 'revision');

    return `
        <div class="order-details" data-order-id="${order.id}">
            ${revisionInfo}

            ${isEditable ? `
                <div class="inline-edit-hint">
                    <i class="fas fa-info-circle"></i>
                    <span class="desktop-hint">Двойной клик для редактирования полей</span>
                    <span class="mobile-hint">Долгое нажатие для редактирования</span>
                </div>
            ` : ''}

            <!-- Accordion for order metadata -->
            <div class="accordion" id="orderMetadataAccordion">
                <button type="button" class="accordion-header" onclick="toggleAccordion('orderMetadataAccordion')">
                    <div class="accordion-title">
                        <i class="fas fa-info-circle"></i>
                        <span>Информация о заказе</span>
                    </div>
                    <i class="fas fa-chevron-right accordion-icon"></i>
                </button>
                <div class="accordion-content">
                    <div class="details-grid">
                        <div class="detail-group">
                            <label>Номер заказа</label>
                            <div class="detail-value">${order.order_no}</div>
                        </div>

                        <div class="detail-group">
                            <label>Название</label>
                            <div class="detail-value ${isEditable ? 'editable-field' : ''}"
                                 data-field="name"
                                 data-value="${order.name}"
                                 ${isEditable ? 'title="Двойной клик для редактирования"' : ''}>${order.name}</div>
                        </div>

                        <div class="detail-group">
                            <label>Статус</label>
                            <div class="detail-value">
                                <span class="status-badge ${order.status_code}">
                                    ${window.demoData.helpers.getStatusLabel(order.status_code)}
                                </span>
                            </div>
                        </div>

                        <div class="detail-group">
                            <label>Проект</label>
                            <div class="detail-value ${isEditable ? 'editable-field' : ''}"
                                 data-field="project_id"
                                 data-value="${order.project_id || ''}"
                                 data-type="select"
                                 ${isEditable ? 'title="Двойной клик для редактирования"' : ''}>${order.project ? order.project.name : '—'}</div>
                        </div>

                        <div class="detail-group">
                            <label>Создан</label>
                            <div class="detail-value">${window.demoData.helpers.formatDate(order.created_at)}</div>
                        </div>

                        <div class="detail-group">
                            <label>Обновлен</label>
                            <div class="detail-value">${window.demoData.helpers.formatDate(order.updated_at)}</div>
                        </div>
                    </div>

                    ${order.note !== null && order.note !== undefined ? `
                        <div class="detail-group">
                            <label>Примечание</label>
                            <div class="detail-value ${isEditable ? 'editable-field' : ''}"
                                 data-field="note"
                                 data-value="${order.note || ''}"
                                 data-type="textarea"
                                 ${isEditable ? 'title="Двойной клик для редактирования"' : ''}>${order.note || '—'}</div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="order-sections">
                <div class="section">
                    <h4><i class="fas fa-list"></i> Детали (${order.items.length})</h4>
                    ${renderOrderItems(order.items, isEditable)}
                </div>

                <div class="section">
                    <h4><i class="fas fa-paperclip"></i> Файлы (${order.files.length})</h4>
                    ${renderOrderFiles(order.files)}
                </div>
            </div>

            <div class="modal-actions">
                ${order.is_editable ? `
                    <button class="btn btn-primary" onclick="editOrder('${order.id}')">
                        <i class="fas fa-edit"></i>
                        Редактировать
                    </button>
                ` : ''}

                <button class="btn btn-warning" onclick="duplicateOrder('${order.id}'); closeModal('orderDetailsModal');">
                    <i class="fas fa-copy"></i>
                    Дублировать
                </button>

                <button class="btn btn-secondary" onclick="closeModal('orderDetailsModal')">
                    Закрыть
                </button>
            </div>
        </div>
    `;
}

// Render order items
function renderOrderItems(items, isEditable = false) {
    if (!items || items.length === 0) {
        return '<div class="empty-items">Детали не добавлены</div>';
    }

    return `
        <div class="items-table">
            <table>
                <thead>
                    <tr>
                        <th>Размеры (мм)</th>
                        <th>Кол-во</th>
                        <th>Материал</th>
                        <th>Фрезеровка</th>
                        <th>Финиш</th>
                        <th>Примечание</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map((item, index) => `
                        <tr data-item-id="${item.id}" data-item-index="${index}">
                            <td class="item-size">
                                <span class="${isEditable ? 'editable-field' : ''}"
                                      data-field="width"
                                      data-value="${item.width}"
                                      data-type="number"
                                      data-min="20"
                                      data-max="2800"
                                      ${isEditable ? 'title="Двойной клик для редактирования"' : ''}>${item.width}</span>
                                ×
                                <span class="${isEditable ? 'editable-field' : ''}"
                                      data-field="height"
                                      data-value="${item.height}"
                                      data-type="number"
                                      data-min="20"
                                      data-max="2800"
                                      ${isEditable ? 'title="Двойной клик для редактирования"' : ''}>${item.height}</span>
                            </td>
                            <td class="item-quantity">
                                <span class="${isEditable ? 'editable-field' : ''}"
                                      data-field="quantity"
                                      data-value="${item.quantity}"
                                      data-type="number"
                                      data-min="1"
                                      data-max="9999"
                                      ${isEditable ? 'title="Двойной клик для редактирования"' : ''}>${item.quantity}</span>
                            </td>
                            <td class="item-material">
                                <span class="${isEditable ? 'editable-field' : ''}"
                                      data-field="material_id"
                                      data-value="${item.material_id || ''}"
                                      data-type="select"
                                      ${isEditable ? 'title="Двойной клик для редактирования"' : ''}>${getMaterialName(item.material_id)}</span>
                            </td>
                            <td class="item-milling">
                                <span class="${isEditable ? 'editable-field' : ''}"
                                      data-field="milling_type_id"
                                      data-value="${item.milling_type_id || ''}"
                                      data-type="select"
                                      ${isEditable ? 'title="Двойной клик для редактирования"' : ''}>${getMillingTypeName(item.milling_type_id)}</span>
                            </td>
                            <td class="item-finish">${getFinishInfo(item)}</td>
                            <td class="item-note">
                                <span class="${isEditable ? 'editable-field' : ''}"
                                      data-field="note"
                                      data-value="${item.note || ''}"
                                      data-type="text"
                                      ${isEditable ? 'title="Двойной клик для редактирования"' : ''}>${item.note || '—'}</span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Render order files
function renderOrderFiles(files) {
    if (!files || files.length === 0) {
        return '<div class="empty-files">Файлы не загружены</div>';
    }

    return `
        <div class="files-list">
            ${files.map(file => `
                <div class="file-item">
                    <div class="file-icon">
                        <i class="fas ${getFileIcon(file.file_ext)}"></i>
                    </div>
                    <div class="file-info">
                        <div class="file-name">${file.file_name}</div>
                        <div class="file-details">
                            ${window.demoData.helpers.formatFileSize(file.size_bytes)} •
                            ${file.file_ext.toUpperCase()}
                            ${file.note ? ` • ${file.note}` : ''}
                        </div>
                    </div>
                    <div class="file-actions">
                        <button class="btn btn-sm btn-secondary" onclick="downloadFile('${file.id}')">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Get material name
function getMaterialName(materialId) {
    const material = window.demoData.helpers.getMaterial(materialId);
    return material ? material.name : 'Неизвестно';
}

// Get milling type name
function getMillingTypeName(millingId) {
    const milling = window.demoData.helpers.getMillingType(millingId);
    return milling ? milling.name : 'Неизвестно';
}

// Get finish info
function getFinishInfo(item) {
    switch (item.finish_code) {
        case 'raw':
            return 'Черновой';
        case 'film':
            const film = window.demoData.helpers.getFilm(item.film_id);
            return film ? `Плёнка: ${film.name}` : 'Плёнка';
        case 'paint':
            const paint = window.demoData.helpers.getPaint(item.paint_id);
            return paint ? `Краска: ${paint.name}` : 'Краска';
        default:
            return 'Неизвестно';
    }
}

// Get file icon
function getFileIcon(extension) {
    const icons = {
        'pdf': 'fa-file-pdf',
        'jpg': 'fa-file-image',
        'jpeg': 'fa-file-image',
        'png': 'fa-file-image',
        'dwg': 'fa-file-code'
    };
    return icons[extension.toLowerCase()] || 'fa-file';
}

// Create new order
function createNewOrder() {
    // Check if demo data is available
    if (!window.demoData || !window.demoData.projects) {
        showNotification('error', 'Данные еще загружаются, попробуйте через секунду');
        return;
    }

    document.getElementById('formModalTitle').textContent = 'Новый заказ';
    document.getElementById('orderFormContent').innerHTML = renderOrderForm();

    // Reset form data
    formData = {};

    // Initialize form
    initializeOrderForm();

    openModal('orderFormModal');
}

// Edit order
function editOrder(orderId) {
    const order = window.demoData.orders.find(o => o.id === orderId);
    if (!order) {
        showNotification('error', 'Заказ не найден');
        return;
    }

    // Проверяем возможность редактирования
    const canEdit = (order.status_code === 'draft' || order.status_code === 'revision') && !order.is_archived;

    if (!canEdit) {
        let message = 'Заказ нельзя редактировать. ';
        if (order.is_archived) {
            message += 'Заказ находится в архиве.';
        } else if (order.status_code === 'submitted') {
            message += 'Заказ на проверке.';
        } else if (order.status_code === 'approved') {
            message += 'Заказ уже принят.';
        } else {
            message += 'Недоступно для данного статуса.';
        }
        showNotification('error', message);
        return;
    }

    // Close details modal if open
    closeModal('orderDetailsModal');

    document.getElementById('formModalTitle').textContent = `Редактирование заказа ${order.order_no}`;
    document.getElementById('orderFormContent').innerHTML = renderOrderForm(order);

    // Initialize form with order data
    formData = { ...order };
    initializeOrderForm(order);

    openModal('orderFormModal');
}

// Render order form
function renderOrderForm(order = null) {
    const projects = window.demoData.projects;

    return `
        <form class="order-form" onsubmit="return false;">
            <div class="form-tabs">
                <button type="button" class="tab-btn active" onclick="switchTab('basic')">
                    <i class="fas fa-info-circle"></i>
                    Основное
                </button>
                <button type="button" class="tab-btn" onclick="switchTab('items')">
                    <i class="fas fa-list"></i>
                    Детали
                    <span class="items-count-badge" id="itemsCountBadge">0</span>
                </button>
                <button type="button" class="tab-btn" onclick="switchTab('files')">
                    <i class="fas fa-paperclip"></i>
                    Файлы
                    <span class="files-count-badge" id="filesCountBadge">0</span>
                </button>
            </div>

            <div class="tab-content">
                <div class="tab-pane active" id="basicTab">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="orderName">Название заказа *</label>
                            <input type="text" id="orderName" value="${order ? order.name : ''}"
                                   maxlength="250" onkeyup="updateCharCounter(this, 'nameCounter')"
                                   oninput="markFormDirty()" required>
                            <div class="char-counter">
                                <span id="nameCounter">${order ? order.name.length : 0}</span>/250
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="orderProject">Проект</label>
                            <select id="orderProject" onchange="markFormDirty()">
                                <option value="">Без проекта</option>
                                ${projects.map(project => `
                                    <option value="${project.id}"
                                            ${order && order.project_id === project.id ? 'selected' : ''}>
                                        ${project.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="form-group full-width">
                            <label for="orderNote">Примечание</label>
                            <textarea id="orderNote" rows="3" maxlength="500"
                                      onkeyup="updateCharCounter(this, 'noteCounter')"
                                      oninput="markFormDirty()"
                                      placeholder="Дополнительная информация о заказе">${order ? (order.note || '') : ''}</textarea>
                            <div class="char-counter">
                                <span id="noteCounter">${order ? (order.note || '').length : 0}</span>/500
                            </div>
                        </div>
                    </div>
                </div>

                <div class="tab-pane" id="itemsTab">
                    <div class="items-section">
                        <div class="section-header">
                            <h4>Детали заказа</h4>
                            <div class="header-buttons">
                                <button type="button" class="btn btn-primary btn-sm" onclick="addNewItem()">
                                    <i class="fas fa-plus"></i>
                                    <span>Добавить деталь</span>
                                </button>
                                <button type="button" class="btn btn-secondary btn-sm bulk-toggle-button" onclick="toggleBulkForm()" title="Массовое добавление">
                                    <span class="bulk-icon">++</span>
                                </button>
                            </div>
                        </div>
                        <div class="items-container" id="itemsContainer">
                            <!-- Items will be populated by JavaScript -->
                        </div>

                        <div class="bulk-form-section" id="bulkFormSection" style="display: none;">
                            <div class="bulk-form-header">
                                <h5>Массовое добавление деталей</h5>
                                <button type="button" class="btn btn-text btn-sm" onclick="toggleBulkForm()" title="Закрыть">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <p class="help-text">Вставьте строки в формате: Ширина x Высота x Количество<br>
                            Поддерживаемые разделители: x, ×, *, пробел<br>
                            Примеры: 300 x 400 x 2, 500*300*1, 800 600 3</p>
                            <textarea id="bulkItemsInput" rows="4"
                                      placeholder="300 x 400 x 2&#10;500 * 300 * 1&#10;800 600 3"></textarea>
                            <div class="bulk-form-actions">
                                <button type="button" class="btn btn-secondary" onclick="toggleBulkForm()">
                                    Отмена
                                </button>
                                <button type="button" class="btn btn-primary" onclick="processBulkItems()">
                                    <i class="fas fa-plus-circle"></i>
                                    Добавить из текста
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="tab-pane" id="filesTab">
                    <div class="files-section">
                        <div class="section-header">
                            <h4>Файлы заказа</h4>
                            <div class="upload-info">
                                <small>Максимум 5 файлов по 5 МБ. Форматы: PDF, JPG, PNG, DWG</small>
                            </div>
                        </div>

                        <div class="file-upload-area" id="fileUploadArea" onclick="document.getElementById('fileInput').click()">
                            <div class="upload-placeholder">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p>Перетащите файлы сюда или нажмите для выбора</p>
                                <input type="file" id="fileInput" multiple
                                       accept=".pdf,.jpg,.jpeg,.png,.dwg"
                                       style="display: none;">
                                <button type="button" class="btn btn-secondary">
                                    Выбрать файлы
                                </button>
                            </div>
                        </div>

                        <div class="files-list" id="orderFilesList">
                            <!-- Files will be populated by JavaScript -->
                        </div>
                    </div>
                </div>
            </div>

            <div class="form-actions">
                <div class="save-status" id="saveStatus">
                    <i class="fas fa-check-circle"></i>
                    <span>Сохранено</span>
                </div>

                <div class="action-buttons">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('orderFormModal')">
                        <i class="fas fa-times"></i>
                        <span>Отмена</span>
                    </button>

                    <button type="button" class="btn btn-success" onclick="saveOrder()" id="saveButton">
                        <i class="fas fa-save"></i>
                        <span>Сохранить</span>
                    </button>

                    <button type="button" class="btn btn-primary" onclick="submitOrderFromForm()" id="submitButton">
                        <i class="fas fa-paper-plane"></i>
                        <span>Отправить на проверку</span>
                    </button>
                </div>
            </div>
        </form>
    `;
}

// Initialize order form
function initializeOrderForm(order = null) {
    // Set up auto-save
    setupAutoSave();

    // Set up file upload
    setupFileUpload();

    // Load items if editing
    if (order && order.items) {
        order.items.forEach(item => addItemToForm(item));
    }

    // Load files if editing
    if (order && order.files) {
        order.files.forEach(file => addFileToForm(file));
    }

    // Update counters
    updateItemsCount();
    updateFilesCount();

    // Mark as clean
    isFormDirty = false;
    updateSaveStatus('saved');

    // Add default item if new order
    if (!order) {
        addNewItem();
    }

    // Update CSS var for sticky header height
    const header = document.querySelector('#orderFormModal .modal-header');
    if (header) {
        const h = header.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--modal-header-h', h + 'px');
    }

    // Initialize bulk form as hidden by default
    const bulkFormSection = document.getElementById('bulkFormSection');
    const bulkToggleButton = document.querySelector('.bulk-toggle-button');
    if (bulkFormSection && bulkToggleButton) {
        // Start hidden
        bulkFormSection.style.display = 'none';
        bulkToggleButton.classList.remove('active');
    }
}

// Switch form tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// Update character counter
function updateCharCounter(input, counterId) {
    const counter = document.getElementById(counterId);
    if (counter) {
        counter.textContent = input.value.length;
    }
    markFormDirty();
}

// Show confirmation dialog
function showConfirmation(title, message, onConfirm, onCancel = null) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;

    // Restore default button layout
    const modal = document.getElementById('confirmModal');
    const actionsContainer = modal.querySelector('.modal-actions');
    actionsContainer.innerHTML = `
        <button class="btn btn-secondary" onclick="closeModal('confirmModal')">Отмена</button>
        <button class="btn btn-primary" id="confirmAction">Подтвердить</button>
    `;

    const confirmButton = document.getElementById('confirmAction');
    confirmButton.onclick = () => {
        closeModal('confirmModal');
        if (onConfirm) onConfirm();
    };

    // Update cancel button
    const cancelButton = modal.querySelector('.btn-secondary');
    cancelButton.onclick = () => {
        closeModal('confirmModal');
        if (onCancel) onCancel();
    };

    openModal('confirmModal');
}

// Show save confirmation with "Save and Close" option
function showSaveConfirmation(modalId) {
    document.getElementById('confirmTitle').textContent = 'Несохраненные изменения';
    document.getElementById('confirmMessage').textContent = 'У вас есть несохраненные изменения. Что вы хотите сделать?';

    // Get the modal actions container
    const modal = document.getElementById('confirmModal');
    const actionsContainer = modal.querySelector('.modal-actions');

    // Replace buttons with three options
    actionsContainer.innerHTML = `
        <button class="btn btn-secondary" onclick="closeModal('confirmModal')">Отмена</button>
        <button class="btn btn-warning" onclick="forceCloseWithoutSave('${modalId}')">Закрыть без сохранения</button>
        <button class="btn btn-primary" onclick="saveAndClose('${modalId}')">Сохранить и закрыть</button>
    `;

    openModal('confirmModal');
}

// Force close without saving
function forceCloseWithoutSave(modalId) {
    closeModal('confirmModal');
    forceCloseModal(modalId);
}

// Save and close
function saveAndClose(modalId) {
    closeModal('confirmModal');

    // Save the order first, then close modal
    if (modalId === 'orderFormModal') {
        if (!validateOrderForm()) {
            return;
        }

        updateSaveStatus('saving');

        // Collect form data
        const orderData = collectFormData();

        setTimeout(() => {
            isFormDirty = false;
            updateSaveStatus('saved');
            showNotification('success', 'Заказ сохранен');

            // Update demo data
            updateDemoOrder(orderData);

            // Refresh table
            if (window.filtersModule?.applyFilters) {
                window.filtersModule.applyFilters();
            }

            // Close the modal after saving
            forceCloseModal(modalId);
        }, 1000);
    }
}

// Show notification
function showNotification(type, message, duration = 5000) {
    const notification = document.getElementById(`${type}Notification`);
    const messageElement = document.getElementById(`${type}Message`);

    if (!notification || !messageElement) return;

    messageElement.textContent = message;
    notification.style.display = 'flex';

    // Auto hide
    if (duration > 0) {
        setTimeout(() => {
            hideNotification(`${type}Notification`);
        }, duration);
    }
}

// Hide notification
function hideNotification(notificationId) {
    const notification = document.getElementById(notificationId);
    if (notification) {
        notification.style.display = 'none';
    }
}

// Setup auto-save functionality
function setupAutoSave() {
    // Add change listeners to form elements
    const form = document.querySelector('.order-form');
    if (!form) return;

    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('input', markFormDirty);
        input.addEventListener('change', markFormDirty);
    });

    // Start auto-save timer
    setInterval(() => {
        if (isFormDirty) {
            autoSaveOrder();
        }
    }, 60000); // Auto-save every minute
}

// Mark form as dirty
function markFormDirty() {
    isFormDirty = true;
    updateSaveStatus('unsaved');
}

// Update save status
function updateSaveStatus(status) {
    const saveStatus = document.getElementById('saveStatus');
    if (!saveStatus) return;

    const icon = saveStatus.querySelector('i');
    const text = saveStatus.querySelector('span');

    if (status === 'saved') {
        icon.className = 'fas fa-check-circle';
        text.textContent = 'Сохранено';
        saveStatus.className = 'save-status saved';
    } else if (status === 'saving') {
        icon.className = 'fas fa-spinner fa-spin';
        text.textContent = 'Сохранение...';
        saveStatus.className = 'save-status saving';
    } else {
        icon.className = 'fas fa-exclamation-circle';
        text.textContent = 'Не сохранено';
        saveStatus.className = 'save-status unsaved';
    }
}

// Auto-save order
function autoSaveOrder() {
    updateSaveStatus('saving');

    // Simulate saving
    setTimeout(() => {
        isFormDirty = false;
        updateSaveStatus('saved');
    }, 1000);
}

// Helper functions for form handling
function collectFormData() {
    const form = document.querySelector('.order-form');
    if (!form) return {};

    // Collect basic info
    const basicData = {
        name: document.getElementById('orderName')?.value || '',
        project_id: document.getElementById('orderProject')?.value || null,
        note: document.getElementById('orderNote')?.value || '',
        updated_at: new Date().toISOString()
    };

    // Collect items
    const items = [];
    const itemForms = document.querySelectorAll('.item-form');
    itemForms.forEach(itemForm => {
        const item = collectItemData(itemForm);
        if (item && item.width && item.height && item.quantity) {
            items.push(item);
        }
    });

    // Collect files
    const files = [];
    const fileItems = document.querySelectorAll('#orderFilesList .file-item');
    fileItems.forEach(fileItem => {
        // This would normally collect actual file data
        files.push({
            id: 'file_' + Date.now(),
            file_name: 'example.pdf',
            size_bytes: 100000,
            file_ext: 'pdf'
        });
    });

    return {
        ...basicData,
        items,
        files
    };
}

function collectItemData(itemForm) {
    const inputs = itemForm.querySelectorAll('input, select');
    const data = {
        id: itemForm.dataset.itemId || 'item_' + Date.now(),
        width: parseFloat(inputs[0]?.value) || 0,
        height: parseFloat(inputs[1]?.value) || 0,
        quantity: parseInt(inputs[2]?.value) || 1,
        material_id: inputs[3]?.value || null,
        milling_type_id: inputs[4]?.value || null,
        finish_code: inputs[5]?.value || 'raw',
        film_id: inputs[6]?.value || null,
        paint_id: inputs[7]?.value || null,
        note: inputs[8]?.value || ''
    };

    return data;
}

function validateOrderForm() {
    const nameInput = document.getElementById('orderName');
    if (!nameInput?.value.trim()) {
        showNotification('error', 'Название заказа обязательно для заполнения');
        switchTab('basic');
        nameInput?.focus();
        return false;
    }

    // Check if at least one item exists
    const itemsContainer = document.getElementById('itemsContainer');
    const items = itemsContainer?.querySelectorAll('.item-form');
    if (!items || items.length === 0) {
        showNotification('error', 'Добавьте хотя бы одну деталь');
        switchTab('items');
        return false;
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const width = parseFloat(item.querySelector('input[type="number"]')?.value);
        const height = parseFloat(item.querySelectorAll('input[type="number"]')[1]?.value);
        const quantity = parseInt(item.querySelectorAll('input[type="number"]')[2]?.value);

        if (!width || !height || !quantity || width < 20 || height < 20 || width > 2800 || height > 2800) {
            showNotification('error', `Проверьте размеры в детали ${i + 1}. Размеры должны быть от 20 до 2800 мм.`);
            switchTab('items');
            return false;
        }

        if (width > 2070 && height > 2070) {
            showNotification('error', `В детали ${i + 1} только один размер может быть больше 2070 мм.`);
            switchTab('items');
            return false;
        }
    }

    return true;
}

function updateDemoOrder(orderData) {
    if (formData.id) {
        // Update existing order
        const orderIndex = window.demoData.orders.findIndex(o => o.id === formData.id);
        if (orderIndex !== -1) {
            window.demoData.orders[orderIndex] = {
                ...window.demoData.orders[orderIndex],
                ...orderData,
                is_editable: orderData.status_code === 'draft' || orderData.status_code === 'revision'
            };
            // Recompute computed props for table
            const o = window.demoData.orders[orderIndex];
            o.items_count = o.items ? o.items.length : 0;
            o.files_count = o.files ? o.files.length : 0;
            o.total_quantity = o.items ? o.items.reduce((s,i)=> s + (parseInt(i.quantity)||0), 0) : 0;
        }
    } else {
        // Create new order
        const newOrder = {
            id: 'order_' + Date.now(),
            order_no: 'W-2025-' + String(Math.floor(Math.random() * 900) + 100).padStart(3, '0'),
            prefix: 'W',
            client_id: 'client1',
            status_code: 'draft',
            is_archived: false,
            version: 1,
            created_at: new Date().toISOString(),
            is_editable: true,
            ...orderData
        };

        // Add demo computed properties
        newOrder.items_count = newOrder.items ? newOrder.items.length : 0;
        newOrder.files_count = newOrder.files ? newOrder.files.length : 0;
        newOrder.total_quantity = newOrder.items ? newOrder.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
        newOrder.ui_status_label = window.demoData.helpers.getStatusLabel(newOrder.status_code);

        window.demoData.orders.unshift(newOrder);
        formData.id = newOrder.id;
    }
}

// Order action functions
function saveOrder() {
    if (!validateOrderForm()) {
        return;
    }

    updateSaveStatus('saving');

    // Collect form data
    const orderData = collectFormData();

    setTimeout(() => {
        isFormDirty = false;
        updateSaveStatus('saved');
        showNotification('success', 'Заказ сохранен');

        // Update demo data
        updateDemoOrder(orderData);

        // Refresh table
        if (window.filtersModule?.applyFilters) {
            window.filtersModule.applyFilters();
        }
    }, 1000);
}

function submitOrderFromForm() {
    // Validate form first
    if (!validateOrderForm()) {
        return;
    }

    showConfirmation(
        'Отправка заказа',
        'Отправить заказ на проверку? После отправки редактирование будет недоступно.',
        () => {
            // Save first, then submit
            const orderData = collectFormData();
            orderData.status_code = 'submitted';
            orderData.submitted_at = new Date().toISOString();

            updateDemoOrder(orderData);
            closeModal('orderFormModal');
            showNotification('success', 'Заказ отправлен на проверку');

            // Refresh table
            if (window.filtersModule?.applyFilters) {
                window.filtersModule.applyFilters();
            }
        }
    );
}

function submitOrder(orderId = null) {
    const order = window.demoData.orders.find(o => o.id === orderId);
    if (!order) {
        showNotification('error', 'Заказ не найден');
        return;
    }

    if (order.status_code !== 'draft' && order.status_code !== 'revision') {
        showNotification('error', 'Заказ нельзя отправить в текущем статусе');
        return;
    }

    showConfirmation(
        'Отправка заказа',
        'Отправить заказ на проверку? После отправки редактирование будет недоступно.',
        () => {
            // Update order status
            order.status_code = 'submitted';
            order.submitted_at = new Date().toISOString();
            order.updated_at = new Date().toISOString();
            order.is_editable = false;
            order.ui_status_label = window.demoData.helpers.getStatusLabel('submitted');

            showNotification('success', 'Заказ отправлен на проверку');

            // Refresh table
            if (window.filtersModule?.applyFilters) {
                window.filtersModule.applyFilters();
            }
        }
    );
}

function duplicateOrder(orderId) {
    const order = window.demoData.orders.find(o => o.id === orderId);
    if (!order) {
        showNotification('error', 'Заказ не найден');
        return;
    }

    // Create new order based on existing one
    const newOrder = {
        ...order,
        id: 'order_' + Date.now(),
        order_no: 'W-2025-' + String(Math.floor(Math.random() * 900) + 100).padStart(3, '0'),
        name: 'Копия: ' + order.name,
        status_code: 'draft',
        is_archived: false,
        archived_at: null,
        submitted_at: null,
        approved_at: null,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        copied_from_order_id: orderId,
        is_editable: true,
        ui_status_label: 'Черновик'
    };

    // Add to demo data
    window.demoData.orders.unshift(newOrder);

    showNotification('success', 'Заказ продублирован в черновики');

    // Refresh table
    if (window.filtersModule?.applyFilters) {
        window.filtersModule.applyFilters();
    }
}

function archiveOrder(orderId) {
    const order = window.demoData.orders.find(o => o.id === orderId);
    if (!order) {
        showNotification('error', 'Заказ не найден');
        return;
    }

    if (order.status_code === 'approved') {
        showNotification('error', 'Принятые заказы нельзя архивировать вручную');
        return;
    }

    showConfirmation(
        'Архивирование заказа',
        'Переместить заказ в архив? Заказ будет скрыт из основного списка.',
        () => {
            order.is_archived = true;
            order.archived_at = new Date().toISOString();
            order.updated_at = new Date().toISOString();

            showNotification('success', 'Заказ перемещен в архив');

            // Refresh table and filters - applyFilters() already calls updateOrdersTable()
            if (window.filtersModule?.applyFilters) {
                window.filtersModule.applyFilters();
            }
        }
    );
}

function unarchiveOrder(orderId) {
    const order = window.demoData.orders.find(o => o.id === orderId);
    if (!order) {
        showNotification('error', 'Заказ не найден');
        return;
    }

    order.is_archived = false;
    order.archived_at = null;
    order.updated_at = new Date().toISOString();

    showNotification('success', 'Заказ восстановлен из архива');

    // Refresh table and filters - applyFilters() already calls updateOrdersTable()
    if (window.filtersModule?.applyFilters) {
        window.filtersModule.applyFilters();
    }
}

function downloadFile(fileId) {
    showNotification('success', 'Загрузка файла начата');

    // Simulate file download
    setTimeout(() => {
        const link = document.createElement('a');
        link.href = 'data:text/plain;charset=utf-8,Sample file content';
        link.download = 'sample_file.txt';
        link.click();
    }, 500);
}

// Form item management functions
function addNewItem() {
    const itemsContainer = document.getElementById('itemsContainer');
    if (!itemsContainer) return;

    const nextNumber = itemsContainer.querySelectorAll('.item-form').length + 1;
    const itemId = 'item_' + Date.now();
    const itemHtml = renderItemForm({ id: itemId, _number: nextNumber });

    const itemElement = document.createElement('div');
    itemElement.innerHTML = itemHtml;
    const newNode = itemElement.firstElementChild;
    itemsContainer.appendChild(newNode);
    // Scroll new item into view
    newNode?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    updateItemsCount();
    markFormDirty();
}

function removeItem(itemId) {
    const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
    if (itemElement) {
        itemElement.remove();
        updateItemsCount();
        markFormDirty();
    }
}

function addItemToForm(item) {
    const itemsContainer = document.getElementById('itemsContainer');
    if (!itemsContainer) return null;
    const nextNumber = itemsContainer.querySelectorAll('.item-form').length + 1;
    const itemHtml = renderItemForm({ ...item, _number: item._number || nextNumber });
    const itemElement = document.createElement('div');
    itemElement.innerHTML = itemHtml;
    const newNode = itemElement.firstElementChild;
    itemsContainer.appendChild(newNode);
    return newNode;
}

function renderItemForm(item = {}) {
    const materials = window.demoData.materials;
    const millingTypes = window.demoData.millingTypes;
    const films = window.demoData.films;
    const paints = window.demoData.paints;

    return `
        <div class="item-form" data-item-id="${item.id || ''}">
            <div class="item-header">
                <h5>Деталь №${item._number || 1}</h5>
                <button type="button" class="btn-remove" onclick="removeItem('${item.id || ''}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="item-fields">
                <div class="size-group">
                    <div class="form-group">
                        <label>Ширина (мм)</label>
                        <div class="number-input">
                            <input type="number" step="1" min="20" max="2800" value="${Math.round(item.width) || ''}"
                                   onchange="markFormDirty()" oninput="markFormDirty()">
                            <div class="number-controls">
                                <button type="button" onclick="incrementValue(this, 1)">
                                    <i class="fas fa-chevron-up"></i>
                                </button>
                                <button type="button" onclick="incrementValue(this, -1)">
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Высота (мм)</label>
                        <div class="number-input">
                            <input type="number" step="1" min="20" max="2800" value="${Math.round(item.height) || ''}"
                                   onchange="markFormDirty()" oninput="markFormDirty()">
                            <div class="number-controls">
                                <button type="button" onclick="incrementValue(this, 1)">
                                    <i class="fas fa-chevron-up"></i>
                                </button>
                                <button type="button" onclick="incrementValue(this, -1)">
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Кол-во</label>
                        <div class="number-input">
                            <input type="number" step="1" min="1" value="${item.quantity || 1}"
                                   onchange="markFormDirty()" oninput="markFormDirty()">
                            <div class="number-controls">
                                <button type="button" onclick="incrementValue(this, 1)">
                                    <i class="fas fa-chevron-up"></i>
                                </button>
                                <button type="button" onclick="incrementValue(this, -1)">
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="material-group">
                    <div class="form-group">
                        <label>Материал</label>
                        <select onchange="markFormDirty()">
                            <option value="">Выберите материал</option>
                            ${materials.map(m => `
                                <option value="${m.id}" ${item.material_id === m.id ? 'selected' : ''}>${m.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Фрезеровка</label>
                        <select onchange="markFormDirty()">
                            <option value="">Выберите тип</option>
                            ${millingTypes.map(m => `
                                <option value="${m.id}" ${item.milling_type_id === m.id ? 'selected' : ''}>${m.name}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                <div class="finish-group">
                    <div class="form-group">
                        <label>Финиш</label>
                        <select onchange="handleFinishChange(this)" data-item-id="${item.id || ''}">
                            <option value="raw" ${item.finish_code === 'raw' ? 'selected' : ''}>Черновой</option>
                            <option value="film" ${item.finish_code === 'film' ? 'selected' : ''}>Плёнка</option>
                            <option value="paint" ${item.finish_code === 'paint' ? 'selected' : ''}>Краска</option>
                        </select>
                    </div>
                    <div class="form-group film-select" style="display: ${item.finish_code === 'film' ? 'block' : 'none'}">
                        <label>Плёнка</label>
                        <select onchange="markFormDirty()">
                            <option value="">Выберите плёнку</option>
                            ${films.map(f => `
                                <option value="${f.id}" ${item.film_id === f.id ? 'selected' : ''}>${f.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group paint-select" style="display: ${item.finish_code === 'paint' ? 'block' : 'none'}">
                        <label>Краска</label>
                        <select onchange="markFormDirty()">
                            <option value="">Выберите краску</option>
                            ${paints.map(p => `
                                <option value="${p.id}" ${item.paint_id === p.id ? 'selected' : ''}>${p.name}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group full-width">
                    <label>Примечание</label>
                    <input type="text" maxlength="500" value="${item.note || ''}"
                           onchange="markFormDirty()" oninput="markFormDirty()">
                </div>
            </div>
        </div>
    `;
}

function handleFinishChange(select) {
    const itemForm = select.closest('.item-form');
    const filmSelect = itemForm.querySelector('.film-select');
    const paintSelect = itemForm.querySelector('.paint-select');

    filmSelect.style.display = 'none';
    paintSelect.style.display = 'none';

    if (select.value === 'film') {
        filmSelect.style.display = 'block';
    } else if (select.value === 'paint') {
        paintSelect.style.display = 'block';
    }

    markFormDirty();
}

// Toggle bulk form visibility
function toggleBulkForm() {
    const formSection = document.getElementById('bulkFormSection');
    const toggleButton = document.querySelector('.bulk-toggle-button');

    if (!formSection || !toggleButton) return;

    const isVisible = formSection.style.display !== 'none';

    if (isVisible) {
        // Hide form
        formSection.style.display = 'none';
        toggleButton.classList.remove('active');

        // Clear textarea when hiding
        const textarea = document.getElementById('bulkItemsInput');
        if (textarea) {
            textarea.value = '';
        }
    } else {
        // Show form
        formSection.style.display = 'block';
        toggleButton.classList.add('active');

        // Focus on textarea when showing
        setTimeout(() => {
            const textarea = document.getElementById('bulkItemsInput');
            if (textarea) {
                textarea.focus();
            }

            // Scroll to form
            formSection.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }, 50);
    }
}

function processBulkItems() {
    const textarea = document.getElementById('bulkItemsInput');
    if (!textarea) return;

    const lines = textarea.value.split('\n').filter(line => line.trim());
    let addedCount = 0;
    let lastNew = null;

    lines.forEach(line => {
        // Поддерживаем разные разделители: x, X, ×, *, пробел
        const parts = line.trim().split(/[x×*\s]+/i).filter(Boolean);
        if (parts.length >= 3) {
            const width = Math.round(parseFloat(parts[0]));
            const height = Math.round(parseFloat(parts[1]));
            const quantity = Math.round(parseFloat(parts[2]));

            const isValid = (v,min,max)=> Number.isFinite(v) && v>=min && v<=max;
            const dimsOk = isValid(width,20,2800) && isValid(height,20,2800) && !(width>2070 && height>2070);
            const qtyOk = Number.isInteger(quantity) && quantity>=1 && quantity<=9999;

            if (dimsOk && qtyOk) {
                const item = {
                    id: 'item_' + Date.now() + '_' + addedCount,
                    width,
                    height,
                    quantity,
                    finish_code: 'raw'
                };
                lastNew = addItemToForm(item) || lastNew;
                addedCount++;
            } else {
                console.warn('Invalid line skipped:', line);
            }
        }
    });

    if (addedCount > 0) {
        textarea.value = '';
        updateItemsCount();
        markFormDirty();
        showNotification('success', `Добавлено деталей: ${addedCount}`);

        // Hide bulk form after successful addition
        toggleBulkForm();

        // Scroll to the last newly added item
        setTimeout(() => {
            lastNew?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    } else {
        showNotification('error', 'Не удалось распознать данные или размеры некорректны. Формат: 300 x 400 x 2 (20..2800 мм; не более одного измерения > 2070; количество ≥ 1)');
    }
}

// Функция для увеличения/уменьшения значений в числовых полях
function incrementValue(button, delta) {
    const input = button.closest('.number-input').querySelector('input');
    const currentValue = parseInt(input.value) || 0;
    const newValue = Math.max(parseInt(input.min) || 0, currentValue + delta);
    const maxValue = parseInt(input.max);

    if (maxValue && newValue > maxValue) {
        return;
    }

    input.value = newValue;
    markFormDirty();

    // Trigger change event
    input.dispatchEvent(new Event('change'));
}

function updateItemsCount() {
    const itemsContainer = document.getElementById('itemsContainer');
    const badge = document.getElementById('itemsCountBadge');

    if (itemsContainer && badge) {
        const count = itemsContainer.querySelectorAll('.item-form').length;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
}

function updateFilesCount() {
    const filesList = document.getElementById('orderFilesList');
    const badge = document.getElementById('filesCountBadge');

    if (filesList && badge) {
        const count = filesList.querySelectorAll('.file-item').length;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
}

// File upload functions
function setupFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('fileUploadArea');

    if (!fileInput || !uploadArea) return;

    // File input change
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');

        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    });
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
    // Clear input so same file can be selected again
    e.target.value = '';
}

function processFiles(files) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const maxFiles = 5;

    const currentFiles = document.querySelectorAll('#orderFilesList .file-item').length;

    if (currentFiles + files.length > maxFiles) {
        showNotification('error', `Максимум ${maxFiles} файлов на заказ`);
        return;
    }

    files.forEach(file => {
        if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.dwg')) {
            showNotification('error', `Неподдерживаемый тип файла: ${file.name}`);
            return;
        }

        if (file.size > maxSize) {
            showNotification('error', `Файл слишком большой: ${file.name} (максимум 5МБ)`);
            return;
        }

        addFileToForm({
            id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            file_name: file.name,
            size_bytes: file.size,
            file_ext: file.name.split('.').pop().toLowerCase(),
            content_type: file.type || 'application/octet-stream',
            file: file // Store actual file object for future upload
        });
    });

    updateFilesCount();
    markFormDirty();
}

function addFileToForm(file) {
    const filesList = document.getElementById('orderFilesList');
    if (!filesList) return;

    const fileElement = document.createElement('div');
    fileElement.className = 'file-item';
    fileElement.dataset.fileId = file.id;
    fileElement.innerHTML = `
        <div class="file-icon">
            <i class="fas ${getFileIcon(file.file_ext)}"></i>
        </div>
        <div class="file-info">
            <div class="file-name">${file.file_name}</div>
            <div class="file-details">
                ${window.demoData.helpers.formatFileSize(file.size_bytes)} •
                ${file.file_ext.toUpperCase()}
            </div>
        </div>
        <div class="file-actions">
            <button type="button" class="btn-remove" onclick="removeFile('${file.id}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    filesList.appendChild(fileElement);
}

function removeFile(fileId) {
    const fileElement = document.querySelector(`[data-file-id="${fileId}"]`);
    if (fileElement) {
        fileElement.remove();
        updateFilesCount();
        markFormDirty();
    }
}

// Inline editing functionality
let currentEditingElement = null;
let longPressTimer = null;
let isEditingActive = false;

// Initialize inline editing
function initializeInlineEditing() {
    document.addEventListener('dblclick', handleDoubleClick);
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('click', handleEditingClick);
    document.addEventListener('keydown', handleEditingKeydown);
}

// Handle double click for desktop
function handleDoubleClick(e) {
    const editableField = e.target.closest('.editable-field');
    if (editableField && !isEditingActive) {
        startInlineEdit(editableField);
    }
}

// Handle touch events for mobile
function handleTouchStart(e) {
    const editableField = e.target.closest('.editable-field');
    if (editableField && !isEditingActive) {
        longPressTimer = setTimeout(() => {
            e.preventDefault();
            startInlineEdit(editableField);
        }, 600); // 600ms long press
    }
}

function handleTouchEnd(e) {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

// Start inline editing
function startInlineEdit(element) {
    if (isEditingActive || currentEditingElement) return;

    const field = element.dataset.field;
    const value = element.dataset.value;
    const type = element.dataset.type || 'text';

    currentEditingElement = element;
    isEditingActive = true;

    // Store original content
    element.dataset.originalContent = element.textContent;
    element.classList.add('editing');

    let editor;

    switch (type) {
        case 'textarea':
            editor = createTextareaEditor(value);
            break;
        case 'select':
            editor = createSelectEditor(field, value);
            break;
        case 'number':
            editor = createNumberEditor(value, element.dataset.min, element.dataset.max);
            break;
        default:
            editor = createTextEditor(value);
    }

    element.innerHTML = '';
    element.appendChild(editor);
    editor.focus();

    if (editor.select) {
        editor.select();
    }
}

// Create text editor
function createTextEditor(value) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.className = 'inline-editor';
    return input;
}

// Create number editor
function createNumberEditor(value, min, max) {
    const input = document.createElement('input');
    input.type = 'number';
    input.value = value;
    input.className = 'inline-editor';
    if (min) input.min = min;
    if (max) input.max = max;
    return input;
}

// Create textarea editor
function createTextareaEditor(value) {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.className = 'inline-editor';
    textarea.rows = 3;
    return textarea;
}

// Create select editor
function createSelectEditor(field, value) {
    const select = document.createElement('select');
    select.className = 'inline-editor';

    let options = [];

    switch (field) {
        case 'project_id':
            options = [{ id: '', name: '—' }, ...window.demoData.projects];
            break;
        case 'material_id':
            options = [{ id: '', name: 'Выберите материал' }, ...window.demoData.materials];
            break;
        case 'milling_type_id':
            options = [{ id: '', name: 'Выберите тип' }, ...window.demoData.millingTypes];
            break;
        default:
            options = [{ id: value, name: value }];
    }

    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.id;
        opt.textContent = option.name;
        opt.selected = option.id === value;
        select.appendChild(opt);
    });

    return select;
}

// Handle clicks during editing
function handleEditingClick(e) {
    if (isEditingActive && currentEditingElement) {
        const editor = currentEditingElement.querySelector('.inline-editor');
        if (editor && !editor.contains(e.target) && !currentEditingElement.contains(e.target)) {
            saveInlineEdit();
        }
    }
}

// Handle keyboard events during editing
function handleEditingKeydown(e) {
    if (isEditingActive && currentEditingElement) {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            saveInlineEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelInlineEdit();
        }
    }
}

// Save inline edit
function saveInlineEdit() {
    if (!currentEditingElement || !isEditingActive) return;

    const editor = currentEditingElement.querySelector('.inline-editor');
    if (!editor) return;

    const field = currentEditingElement.dataset.field;
    const newValue = editor.value;
    const type = currentEditingElement.dataset.type || 'text';

    // Validate input
    if (type === 'number') {
        const min = parseFloat(currentEditingElement.dataset.min);
        const max = parseFloat(currentEditingElement.dataset.max);
        const numValue = parseFloat(newValue);

        if (isNaN(numValue) || (min && numValue < min) || (max && numValue > max)) {
            showNotification('error', `Значение должно быть числом от ${min || 0} до ${max || 'max'}`);
            cancelInlineEdit();
            return;
        }
    }

    // Update data attribute
    currentEditingElement.dataset.value = newValue;

    // Update display
    let displayValue = newValue;
    if (field === 'project_id') {
        const project = window.demoData.projects.find(p => p.id === newValue);
        displayValue = project ? project.name : '—';
    } else if (field === 'material_id') {
        displayValue = getMaterialName(newValue);
    } else if (field === 'milling_type_id') {
        displayValue = getMillingTypeName(newValue);
    } else if (!newValue.trim()) {
        displayValue = '—';
    }

    currentEditingElement.textContent = displayValue;

    // Save changes to demo data
    saveFieldChange(field, newValue);

    finishInlineEdit();
    showNotification('success', 'Изменение сохранено');
}

// Cancel inline edit
function cancelInlineEdit() {
    if (!currentEditingElement || !isEditingActive) return;

    currentEditingElement.textContent = currentEditingElement.dataset.originalContent;
    finishInlineEdit();
}

// Finish inline editing
function finishInlineEdit() {
    if (currentEditingElement) {
        currentEditingElement.classList.remove('editing');
        delete currentEditingElement.dataset.originalContent;
        currentEditingElement = null;
    }
    isEditingActive = false;
}

// Save field changes to demo data
function saveFieldChange(field, newValue) {
    const orderDetails = document.querySelector('.order-details');
    const orderId = orderDetails?.dataset.orderId;
    if (!orderId) return;

    const order = window.demoData.orders.find(o => o.id === orderId);
    if (!order) return;

    // Check if this is an item field
    const itemRow = currentEditingElement.closest('tr[data-item-id]');
    if (itemRow) {
        const itemIndex = parseInt(itemRow.dataset.itemIndex);
        const item = order.items[itemIndex];
        if (item) {
            if (field === 'width' || field === 'height' || field === 'quantity') {
                item[field] = parseFloat(newValue);
            } else {
                item[field] = newValue;
            }

            // Update computed properties
            order.total_quantity = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        }
    } else {
        // Order-level field
        if (field === 'project_id') {
            order.project_id = newValue || null;
            order.project = newValue ? window.demoData.projects.find(p => p.id === newValue) : null;
        } else {
            order[field] = newValue;
        }
    }

    // Update timestamp
    order.updated_at = new Date().toISOString();

    // Refresh table if needed
    if (window.filtersModule?.applyFilters) {
        window.filtersModule.applyFilters();
    }
}

// Toggle accordion visibility
function toggleAccordion(accordionId) {
    const accordion = document.getElementById(accordionId);
    if (!accordion) return;

    const header = accordion.querySelector('.accordion-header');
    const content = accordion.querySelector('.accordion-content');
    const icon = accordion.querySelector('.accordion-icon');

    if (!header || !content || !icon) return;

    const isExpanded = accordion.classList.contains('expanded');

    if (isExpanded) {
        // Collapse
        accordion.classList.remove('expanded');
        header.classList.remove('expanded');
        icon.style.transform = 'rotate(0deg)';
    } else {
        // Expand
        accordion.classList.add('expanded');
        header.classList.add('expanded');
        icon.style.transform = 'rotate(90deg)';
    }
}

// Export functions for global access
window.popupsModule = {
    initializeModals,
    initializeInlineEditing,
    openModal,
    closeModal,
    viewOrder,
    createNewOrder,
    editOrder,
    showConfirmation,
    showSaveConfirmation,
    forceCloseWithoutSave,
    saveAndClose,
    showNotification,
    hideNotification,
    submitOrder,
    duplicateOrder,
    archiveOrder,
    unarchiveOrder,
    downloadFile,
    saveOrder,
    submitOrderFromForm,
    toggleAccordion,
    // expose item/file handlers for main.js bridges
    addNewItem,
    removeItem,
    addItemToForm,
    processBulkItems,
    toggleBulkForm,
    removeFile,
    markFormDirty
};

// Global function bridges for HTML onclick handlers
window.toggleAccordion = (id) => window.popupsModule?.toggleAccordion(id);
