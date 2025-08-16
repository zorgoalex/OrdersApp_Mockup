// Demo data for the furniture production order system

// Materials dictionary
const materials = [
    { id: 'mat1', name: 'ЛДСП Egger', code: 'EGG', is_active: true },
    { id: 'mat2', name: 'МДФ Kronospan', code: 'KRO', is_active: true },
    { id: 'mat3', name: 'Фанера березовая', code: 'FAN', is_active: true },
    { id: 'mat4', name: 'Массив дуба', code: 'OAK', is_active: true },
    { id: 'mat5', name: 'ЛДСП Swisspan', code: 'SWI', is_active: true }
];

// Milling types dictionary
const millingTypes = [
    { id: 'mill1', name: 'Прямая кромка', is_active: true },
    { id: 'mill2', name: 'Фрезеровка 45°', is_active: true },
    { id: 'mill3', name: 'Радиус R3', is_active: true },
    { id: 'mill4', name: 'Фигурная кромка', is_active: true },
    { id: 'mill5', name: 'Паз 4мм', is_active: true }
];

// Films dictionary
const films = [
    { id: 'film1', name: 'ПВХ Белый глянец', code: 'W001', is_active: true },
    { id: 'film2', name: 'ПВХ Дуб натуральный', code: 'O001', is_active: true },
    { id: 'film3', name: 'ПВХ Орех темный', code: 'W002', is_active: true },
    { id: 'film4', name: 'ПВХ Венге', code: 'V001', is_active: true },
    { id: 'film5', name: 'Шпон дуба', code: 'SO001', is_active: true }
];

// Paints dictionary
const paints = [
    { id: 'paint1', name: 'Эмаль белая матовая', code: 'EM01', is_active: true },
    { id: 'paint2', name: 'Эмаль черная глянец', code: 'EC01', is_active: true },
    { id: 'paint3', name: 'Лак прозрачный', code: 'LP01', is_active: true },
    { id: 'paint4', name: 'Морилка дуб', code: 'MD01', is_active: true },
    { id: 'paint5', name: 'Грунт белый', code: 'GB01', is_active: true }
];

// Projects data
const projects = [
    {
        id: 'proj1',
        project_no: 'WPR-2025-001',
        name: 'Кухня Модерн',
        client_id: 'client1',
        note: 'Современная кухня в стиле минимализм',
        is_archived: false,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-02-10T14:30:00Z'
    },
    {
        id: 'proj2',
        project_no: 'WPR-2025-002',
        name: 'Спальня Классик',
        client_id: 'client1',
        note: 'Классическая спальня из массива дуба',
        is_archived: false,
        created_at: '2025-01-20T09:15:00Z',
        updated_at: '2025-02-08T16:45:00Z'
    },
    {
        id: 'proj3',
        project_no: 'WPR-2025-003',
        name: 'Офисная мебель',
        client_id: 'client1',
        note: 'Мебель для офиса: столы, шкафы, стеллажи',
        is_archived: false,
        created_at: '2025-02-01T11:30:00Z',
        updated_at: '2025-02-12T09:20:00Z'
    }
];

// Order status history
const orderStatusHistory = [
    {
        id: 'hist1',
        order_id: 'order2',
        from_status_code: 'submitted',
        to_status_code: 'revision',
        reason: 'Необходимо уточнить размеры столешницы и добавить чертеж крепления',
        changed_by: 'manager1',
        changed_at: '2025-02-10T14:30:00Z'
    },
    {
        id: 'hist2',
        order_id: 'order5',
        from_status_code: 'submitted',
        to_status_code: 'approved',
        reason: null,
        changed_by: 'manager1',
        changed_at: '2025-02-08T11:15:00Z'
    }
];

// Sample order files
const orderFiles = [
    {
        id: 'file1',
        order_id: 'order1',
        file_name: 'kitchen_plan.pdf',
        content_type: 'application/pdf',
        file_ext: 'pdf',
        size_bytes: 2456789,
        note: 'Общий план кухни',
        created_at: '2025-02-15T10:30:00Z'
    },
    {
        id: 'file2',
        order_id: 'order1',
        file_name: 'corner_detail.dwg',
        content_type: 'application/dwg',
        file_ext: 'dwg',
        size_bytes: 1234567,
        note: 'Деталь углового соединения',
        created_at: '2025-02-15T10:35:00Z'
    },
    {
        id: 'file3',
        order_id: 'order3',
        file_name: 'wardrobe_front.jpg',
        content_type: 'image/jpeg',
        file_ext: 'jpg',
        size_bytes: 876543,
        note: 'Фото образца фасада',
        created_at: '2025-02-12T15:20:00Z'
    }
];

// Demo orders data
const demoOrders = [
    {
        id: 'order1',
        order_no: 'W-2025-001',
        prefix: 'W',
        client_id: 'client1',
        project_id: 'proj1',
        name: 'Кухонные фасады',
        note: 'Фасады для кухни в современном стиле',
        status_code: 'draft',
        is_archived: false,
        archived_at: null,
        submitted_at: null,
        approved_at: null,
        version: 1,
        created_at: '2025-02-15T10:00:00Z',
        updated_at: '2025-02-15T14:30:00Z',
        items: [
            {
                id: 'item1',
                width: 396.50,
                height: 746.00,
                quantity: 2,
                material_id: 'mat1',
                milling_type_id: 'mill1',
                finish_code: 'film',
                film_id: 'film1',
                paint_id: null,
                note: 'Фасады верхних шкафов'
            },
            {
                id: 'item2',
                width: 296.50,
                height: 896.00,
                quantity: 3,
                material_id: 'mat1',
                milling_type_id: 'mill1',
                finish_code: 'film',
                film_id: 'film1',
                paint_id: null,
                note: 'Фасады нижних шкафов'
            }
        ],
        files: [
            { ...orderFiles[0] },
            { ...orderFiles[1] }
        ]
    },
    {
        id: 'order2',
        order_no: 'W-2025-002',
        prefix: 'W',
        client_id: 'client1',
        project_id: 'proj1',
        name: 'Столешница кухонная',
        note: 'Столешница из ЛДСП с кромкой',
        status_code: 'revision',
        is_archived: false,
        archived_at: null,
        submitted_at: '2025-02-10T09:30:00Z',
        approved_at: null,
        version: 2,
        created_at: '2025-02-10T09:00:00Z',
        updated_at: '2025-02-10T14:30:00Z',
        items: [
            {
                id: 'item3',
                width: 2400.00,
                height: 600.00,
                quantity: 1,
                material_id: 'mat1',
                milling_type_id: 'mill2',
                finish_code: 'raw',
                film_id: null,
                paint_id: null,
                note: 'Основная столешница'
            }
        ],
        files: [],
        revision_reason: 'Необходимо уточнить размеры столешницы и добавить чертеж крепления'
    },
    {
        id: 'order3',
        order_no: 'W-2025-003',
        prefix: 'W',
        client_id: 'client1',
        project_id: 'proj2',
        name: 'Дверцы шкафа-купе',
        note: 'Раздвижные дверцы с зеркалом',
        status_code: 'submitted',
        is_archived: false,
        archived_at: null,
        submitted_at: '2025-02-12T16:45:00Z',
        approved_at: null,
        version: 1,
        created_at: '2025-02-12T14:20:00Z',
        updated_at: '2025-02-12T16:45:00Z',
        items: [
            {
                id: 'item4',
                width: 800.00,
                height: 2200.00,
                quantity: 2,
                material_id: 'mat2',
                milling_type_id: 'mill3',
                finish_code: 'film',
                film_id: 'film2',
                paint_id: null,
                note: 'Дверцы с декором под дуб'
            }
        ],
        files: [
            { ...orderFiles[2] }
        ]
    },
    {
        id: 'order4',
        order_no: 'W-2025-004',
        prefix: 'W',
        client_id: 'client1',
        project_id: 'proj2',
        name: 'Полки для гардероба',
        note: '',
        status_code: 'draft',
        is_archived: false,
        archived_at: null,
        submitted_at: null,
        approved_at: null,
        version: 1,
        created_at: '2025-02-13T11:15:00Z',
        updated_at: '2025-02-13T11:45:00Z',
        items: [
            {
                id: 'item5',
                width: 580.00,
                height: 350.00,
                quantity: 6,
                material_id: 'mat1',
                milling_type_id: 'mill1',
                finish_code: 'raw',
                film_id: null,
                paint_id: null,
                note: 'Полки стандартные'
            }
        ],
        files: []
    },
    {
        id: 'order5',
        order_no: 'W-2025-005',
        prefix: 'W',
        client_id: 'client1',
        project_id: 'proj3',
        name: 'Офисные столы',
        note: 'Письменные столы для офиса',
        status_code: 'approved',
        is_archived: false,
        archived_at: null,
        submitted_at: '2025-02-08T10:00:00Z',
        approved_at: '2025-02-08T11:15:00Z',
        version: 1,
        created_at: '2025-02-08T09:30:00Z',
        updated_at: '2025-02-08T11:15:00Z',
        items: [
            {
                id: 'item6',
                width: 1200.00,
                height: 600.00,
                quantity: 4,
                material_id: 'mat1',
                milling_type_id: 'mill1',
                finish_code: 'film',
                film_id: 'film1',
                paint_id: null,
                note: 'Столешницы офисных столов'
            },
            {
                id: 'item7',
                width: 720.00,
                height: 650.00,
                quantity: 8,
                material_id: 'mat1',
                milling_type_id: 'mill1',
                finish_code: 'film',
                film_id: 'film1',
                paint_id: null,
                note: 'Боковые панели столов'
            }
        ],
        files: []
    },
    {
        id: 'order6',
        order_no: 'W-2025-006',
        prefix: 'W',
        client_id: 'client1',
        project_id: null,
        name: 'Тестовый заказ без проекта',
        note: 'Небольшой заказ вне проекта',
        status_code: 'draft',
        is_archived: false,
        archived_at: null,
        submitted_at: null,
        approved_at: null,
        version: 1,
        created_at: '2025-02-14T16:20:00Z',
        updated_at: '2025-02-14T16:30:00Z',
        items: [
            {
                id: 'item8',
                width: 400.00,
                height: 300.00,
                quantity: 2,
                material_id: 'mat3',
                milling_type_id: 'mill1',
                finish_code: 'paint',
                film_id: null,
                paint_id: 'paint1',
                note: 'Небольшие полочки'
            }
        ],
        files: []
    },
    // Archived orders
    {
        id: 'order7',
        order_no: 'W-2024-089',
        prefix: 'W',
        client_id: 'client1',
        project_id: 'proj1',
        name: 'Архивный заказ 1',
        note: 'Старый заказ в архиве',
        status_code: 'approved',
        is_archived: true,
        archived_at: '2025-01-15T12:00:00Z',
        submitted_at: '2024-12-20T10:00:00Z',
        approved_at: '2024-12-21T14:30:00Z',
        version: 1,
        created_at: '2024-12-20T09:30:00Z',
        updated_at: '2024-12-21T14:30:00Z',
        items: [
            {
                id: 'item9',
                width: 500.00,
                height: 700.00,
                quantity: 1,
                material_id: 'mat1',
                milling_type_id: 'mill1',
                finish_code: 'raw',
                film_id: null,
                paint_id: null,
                note: 'Архивная деталь'
            }
        ],
        files: []
    },
    {
        id: 'order8',
        order_no: 'W-2024-088',
        prefix: 'W',
        client_id: 'client1',
        project_id: null,
        name: 'Архивный заказ 2',
        note: '',
        status_code: 'approved',
        is_archived: true,
        archived_at: '2025-01-10T10:00:00Z',
        submitted_at: '2024-12-15T15:00:00Z',
        approved_at: '2024-12-16T11:20:00Z',
        version: 1,
        created_at: '2024-12-15T14:30:00Z',
        updated_at: '2024-12-16T11:20:00Z',
        items: [
            {
                id: 'item10',
                width: 300.00,
                height: 400.00,
                quantity: 3,
                material_id: 'mat2',
                milling_type_id: 'mill1',
                finish_code: 'film',
                film_id: 'film3',
                paint_id: null,
                note: 'Еще одна архивная деталь'
            }
        ],
        files: []
    }
];

// Helper functions to work with demo data
const demoDataHelpers = {
    // Get material by ID
    getMaterial: (id) => materials.find(m => m.id === id),
    
    // Get milling type by ID  
    getMillingType: (id) => millingTypes.find(m => m.id === id),
    
    // Get film by ID
    getFilm: (id) => films.find(f => f.id === id),
    
    // Get paint by ID
    getPaint: (id) => paints.find(p => p.id === id),
    
    // Get project by ID
    getProject: (id) => projects.find(p => p.id === id),
    
    // Get orders with populated relations
    getOrdersWithDetails: () => {
        return demoOrders.map(order => ({
            ...order,
            project: order.project_id ? demoDataHelpers.getProject(order.project_id) : null,
            items_count: order.items ? order.items.length : 0,
            files_count: order.files ? order.files.length : 0,
            total_quantity: order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0,
            ui_status_label: demoDataHelpers.getStatusLabel(order.status_code),
            is_editable: ['draft', 'revision'].includes(order.status_code) && !order.is_archived,
            is_returned_for_revision: order.status_code === 'revision',
            revision_reason: order.revision_reason || null
        }));
    },
    
    // Get status label
    getStatusLabel: (statusCode) => {
        const statusLabels = {
            'draft': 'Черновик',
            'submitted': 'На проверке', 
            'approved': 'Принят',
            'revision': 'На доработку'
        };
        return statusLabels[statusCode] || statusCode;
    },
    
    // Get orders statistics
    getOrdersStats: (orders = demoOrders) => {
        const activeOrders = orders.filter(o => !o.is_archived);
        return {
            total: orders.length,
            draft: activeOrders.filter(o => o.status_code === 'draft').length,
            submitted: activeOrders.filter(o => o.status_code === 'submitted').length,
            approved: activeOrders.filter(o => o.status_code === 'approved').length,
            revision: activeOrders.filter(o => o.status_code === 'revision').length,
            archived: orders.filter(o => o.is_archived).length
        };
    },
    
    // Format date for display
    formatDate: (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Сегодня ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Вчера ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays < 7) {
            return diffDays + ' дн. назад';
        } else {
            return date.toLocaleDateString('ru-RU');
        }
    },
    
    // Format file size
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Б';
        const k = 1024;
        const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
};

// Export data for use in other modules
window.demoData = {
    orders: demoOrders,
    materials,
    millingTypes,
    films,
    paints,
    projects,
    orderStatusHistory,
    orderFiles,
    helpers: demoDataHelpers
};