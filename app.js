// ==================== ОБЩАЯ ИНИЦИАЛИЗАЦИЯ ====================
const tg = window.Telegram.WebApp;
tg.expand();
tg.setHeaderColor('#2481cc');
tg.setBackgroundColor('#f5f7fa');

// ==================== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ====================
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Убираем активный класс у всех кнопок и контента
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Добавляем активный класс выбранной кнопке и контенту
            button.classList.add('active');
            document.getElementById(`${tabId}Tab`).classList.add('active');
            
            // Если переключились на каталог и он еще не загружен
            if (tabId === 'catalog' && allMaterials.length === 0) {
                loadMaterials();
            }
        });
    });
}

// ==================== ЛОГИКА КАТАЛОГА ====================
let allMaterials = [];
let activeCategory = 'all';

async function loadMaterials() {
    try {
        const response = await fetch('./data.json');
        if (!response.ok) throw new Error('Не удалось загрузить данные');
        
        allMaterials = await response.json();
        displayMaterials(allMaterials);
        generateCategoryButtons(allMaterials);
        document.getElementById('loader').style.display = 'none';
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        document.getElementById('materialsContainer').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Ошибка загрузки каталога</h3>
                <p>Попробуйте обновить страницу</p>
            </div>
        `;
        document.getElementById('loader').style.display = 'none';
    }
}

function displayMaterials(materials) {
    const container = document.getElementById('materialsContainer');
    const noResults = document.getElementById('noResults');
    
    if (materials.length === 0) {
        container.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    noResults.style.display = 'none';
    
    container.innerHTML = materials.map(material => `
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

function generateCategoryButtons(materials) {
    const categories = ['all', ...new Set(materials.map(item => item.category))];
    const container = document.querySelector('.category-filter');
    
    container.innerHTML = categories.map(cat => `
        <button class="cat-btn ${cat === 'all' ? 'active' : ''}" 
                data-category="${cat}">
            ${cat === 'all' ? 'Все' : cat}
        </button>
    `).join('');
    
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.dataset.category;
            filterMaterials();
        });
    });
}

function filterMaterials() {
    let filtered = allMaterials;
    
    if (activeCategory !== 'all') {
        filtered = filtered.filter(item => item.category === activeCategory);
    }
    
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(item => 
            item.title.toLowerCase().includes(searchTerm) || 
            item.description.toLowerCase().includes(searchTerm)
        );
    }
    
    displayMaterials(filtered);
}

function openMaterial(link) {
    if (tg.platform !== 'unknown') {
        tg.openLink(link);
    } else {
        window.open(link, '_blank');
    }
}

// ==================== ЛОГИКА ИГРЫ-КЛИКЕРА ====================
class ClickerGame {
    constructor() {
        this.score = 0;
        this.highScore = localStorage.getItem('clickerHighScore') || 0;
        this.multiplier = 1;
        this.clickTimes = [];
        this.autoClickActive = false;
        
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.cpsElement = document.getElementById('cps');
        this.clickButton = document.getElementById('clickButton');
        this.clickEffect = document.getElementById('clickEffect');
        this.resetBtn = document.getElementById('resetBtn');
        this.autoClickBtn = document.getElementById('autoClickBtn');
        this.multiplierBtn = document.getElementById('multiplierBtn');
        
        this.init();
    }
    
    init() {
        this.updateDisplay();
        
        // Обработчик клика по кнопке
        this.clickButton.addEventListener('click', (e) => {
            this.handleClick(e);
        });
        
        // Обработчик сброса
        this.resetBtn.addEventListener('click', () => {
            this.resetGame();
        });
        
        // Обработчик автоклика
        this.autoClickBtn.addEventListener('click', () => {
            this.activateAutoClick();
        });
        
        // Обработчик множителя
        this.multiplierBtn.addEventListener('click', () => {
            this.buyMultiplier();
        });
        
        // Обновляем CPS каждую секунду
        setInterval(() => {
            this.updateCPS();
        }, 1000);
    }
    
    handleClick(event) {
        // Добавляем очки
        this.score += this.multiplier;
        
        // Записываем время клика для расчета CPS
        this.clickTimes.push(Date.now());
        
        // Обновляем отображение
        this.updateDisplay();
        
        // Создаем эффект клика
        this.createClickEffect(event);
        
        // Проверяем рекорд
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('clickerHighScore', this.highScore);
        }
        
        // Обновляем доступность улучшений
        this.updateUpgrades();
    }
    
    createClickEffect(event) {
        const rect = this.clickButton.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        this.clickEffect.style.left = `${x}px`;
        this.clickEffect.style.top = `${y}px`;
        this.clickEffect.style.opacity = '1';
        this.clickEffect.style.transform = 'scale(0)';
        
        setTimeout(() => {
            this.clickEffect.style.transform = 'scale(2)';
            this.clickEffect.style.opacity = '0';
        }, 10);
        
        // Анимация увеличения счета
        this.scoreElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            this.scoreElement.style.transform = 'scale(1)';
        }, 100);
    }
    
    updateDisplay() {
        this.scoreElement.textContent = this.score;
        this.highScoreElement.textContent = this.highScore;
        this.multiplierBtn.innerHTML = `<i class="fas fa-times"></i> x${this.multiplier * 2} (${this.getMultiplierCost()} очков)`;
    }
    
    updateCPS() {
        // Удаляем старые клики (старше 5 секунд)
        const now = Date.now();
        this.clickTimes = this.clickTimes.filter(time => now - time < 5000);
        
        // Рассчитываем CPS
        const cps = this.clickTimes.length / 5;
        this.cpsElement.textContent = cps.toFixed(1);
        
        // Автокликер
        if (this.autoClickActive) {
            this.score += this.multiplier;
            this.updateDisplay();
        }
    }
    
    updateUpgrades() {
        // Блокируем кнопки, если не хватает очков
        this.autoClickBtn.disabled = this.score < 100;
        this.multiplierBtn.disabled = this.score < this.getMultiplierCost();
    }
    
    getMultiplierCost() {
        return 50 * Math.pow(2, this.multiplier - 1);
    }
    
    resetGame() {
        this.score = 0;
        this.multiplier = 1;
        this.clickTimes = [];
        this.autoClickActive = false;
        this.autoClickBtn.disabled = false;
        this.updateDisplay();
        this.updateUpgrades();
    }
    
    activateAutoClick() {
        if (this.score >= 100 && !this.autoClickActive) {
            this.score -= 100;
            this.autoClickActive = true;
            this.autoClickBtn.disabled = true;
            this.autoClickBtn.innerHTML = '<i class="fas fa-robot"></i> Активно (10 сек)';
            this.updateDisplay();
            
            // Автокликер работает 10 секунд
            setTimeout(() => {
                this.autoClickActive = false;
                this.autoClickBtn.innerHTML = '<i class="fas fa-robot"></i> Автоклик (10 сек)';
                this.updateUpgrades();
            }, 10000);
        }
    }
    
    buyMultiplier() {
        const cost = this.getMultiplierCost();
        if (this.score >= cost) {
            this.score -= cost;
            this.multiplier *= 2;
            this.updateDisplay();
            this.updateUpgrades();
            
            // Эффект покупки
            this.multiplierBtn.style.background = 'linear-gradient(135deg, #2ed573, #1dd1a1)';
            setTimeout(() => {
                this.multiplierBtn.style.background = 'linear-gradient(135deg, #ff9f43, #ffaf40)';
            }, 300);
        }
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ====================
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем переключение вкладок
    initTabs();
    
    // Загружаем каталог (по умолчанию активна вкладка каталога)
    loadMaterials();
    
    // Инициализируем игру
    const game = new ClickerGame();
    
    // Инициализируем поиск в каталоге
    document.getElementById('searchInput').addEventListener('input', filterMaterials);
    
    // Сообщаем Telegram, что приложение готово
    tg.ready();
});
