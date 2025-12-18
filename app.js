// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand(); // Раскрываем приложение на весь экран
tg.setHeaderColor('#2481cc');
tg.setBackgroundColor('#f5f7fa');

// Элементы DOM
const materialsContainer = document.getElementById('materialsContainer');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.querySelector('.category-filter');
const loader = document.getElementById('loader');
const noResults = document.getElementById('noResults');

// Переменные состояния
let allMaterials = [];
let activeCategory = 'all';

// Загрузка данных из data.json
async function loadMaterials() {
    try {
        const response = await fetch('./data.json');
        if (!response.ok) throw new Error('Не удалось загрузить данные');
        
        allMaterials = await response.json();
        displayMaterials(allMaterials);
        generateCategoryButtons(allMaterials);
        loader.style.display = 'none';
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        materialsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Ошибка загрузки каталога</h3>
                <p>Попробуйте обновить страницу или проверьте подключение к интернету</p>
            </div>
        `;
        loader.style.display = 'none';
    }
}

// Отображение материалов
function displayMaterials(materials) {
    if (materials.length === 0) {
        materialsContainer.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    materialsContainer.style.display = 'grid';
    noResults.style.display = 'none';
    
    materialsContainer.innerHTML = materials.map(material => `
        <div class="material-card">
            <div class="card-header">
                <span class="card-category">${material.category}</span>
                <h3 class="card-title">${material.title}</h3>
            </div>
            <div class="card-body">
                <p class="card-description">${material.description}</p>
            </div>
            <div class="card-footer">
                <button class="open-btn" onclick="openMaterial('${material.link}')">
                    <i class="fas fa-external-link-alt"></i> Открыть в Telegram
                </button>
            </div>
        </div>
    `).join('');
}

// Генерация кнопок категорий
function generateCategoryButtons(materials) {
    const categories = ['all', ...new Set(materials.map(item => item.category))];
    
    categoryFilter.innerHTML = categories.map(cat => `
        <button class="cat-btn ${cat === 'all' ? 'active' : ''}" 
                data-category="${cat}">
            ${cat === 'all' ? 'Все' : cat}
        </button>
    `).join('');
    
    // Обработчики для кнопок категорий
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.dataset.category;
            filterMaterials();
        });
    });
}

// Фильтрация по категории и поиску
function filterMaterials() {
    let filtered = allMaterials;
    
    // Фильтр по категории
    if (activeCategory !== 'all') {
        filtered = filtered.filter(item => item.category === activeCategory);
    }
    
    // Фильтр по поисковому запросу
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(item => 
            item.title.toLowerCase().includes(searchTerm) || 
            item.description.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm)
        );
    }
    
    displayMaterials(filtered);
}

// Открытие материала
function openMaterial(link) {
    // Открываем ссылку в Telegram или браузере
    if (tg.platform !== 'unknown') {
        tg.openLink(link);
    } else {
        window.open(link, '_blank');
    }
}

// Инициализация поиска
searchInput.addEventListener('input', filterMaterials);

// Запуск загрузки при открытии страницы
document.addEventListener('DOMContentLoaded', loadMaterials);

// Добавляем стили для сообщения об ошибке
const style = document.createElement('style');
style.textContent = `
    .error-message {
        text-align: center;
        padding: 40px 20px;
        color: #e74c3c;
        grid-column: 1 / -1;
    }
    .error-message i {
        font-size: 3rem;
        margin-bottom: 20px;
    }
`;
document.head.appendChild(style);