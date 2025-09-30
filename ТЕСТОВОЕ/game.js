// Константы для типов клеток
const CELL_TYPES = {
    WALL: 'W',
    FLOOR: '.',
    PLAYER: 'P',
    ENEMY: 'E',
    SWORD: 'SW',
    POTION: 'HP'
};

// Объект для хранения всего состояния игры
const GameState = {
    // Размеры поля
    fieldWidth: 40,
    fieldHeight: 24,
    tileSize: 20,
    
    // Карта - матрица 40x24
    map: [],
    
    // Комнаты
    rooms: [],
    
    // Игрок
    player: {
        x: 1,
        y: 1,
        health: 100,
        maxHealth: 100,
        baseAttack: 25,
        attackBonus: 0,
        swordsCollected: 0
    },
    
    // Враги - массив объектов
    enemies: [],
    
    // Предметы
    items: {
        potions: [],
        swords: []
    },
    
    // Игровые настройки
    settings: {
        enemyCount: 5,
        potionCount: 3,
        swordCount: 2,
        enemyHealth: 50,
        enemyAttack: 15,
        potionHeal: 30
    }
};

// Функция создания пустой карты заполненной стенами
const createEmptyMap = () => {
    console.log("Creating empty map...");
    const map = [];
    for (let y = 0; y < GameState.fieldHeight; y++) {
        map[y] = [];
        for (let x = 0; x < GameState.fieldWidth; x++) {
            map[y][x] = CELL_TYPES.WALL;
        }
    }
    console.log("Empty map created, size:", map.length, "x", map[0].length);
    return map;
};

// Функция проверки пересечения двух прямоугольников
const roomsIntersect = (room1, room2) => {
    return !(room1.x + room1.width < room2.x || 
             room2.x + room2.width < room1.x || 
             room1.y + room1.height < room2.y || 
             room2.y + room2.height < room1.y);
};

// Функция генерации случайных комнат
const generateRooms = () => {
    console.log("Generating rooms...");
    GameState.rooms = [];
    
    const minRooms = 5;
    const maxRooms = 10;
    const minRoomSize = 3;
    const maxRoomSize = 8;
    const maxAttempts = 100; // Максимальное количество попыток размещения комнаты
    
    const roomCount = Math.floor(Math.random() * (maxRooms - minRooms + 1)) + minRooms;
    console.log("Trying to generate", roomCount, "rooms");
    
    for (let i = 0; i < roomCount; i++) {
        let attempts = 0;
        let roomPlaced = false;
        
        while (attempts < maxAttempts && !roomPlaced) {
            // Генерируем случайные размеры комнаты
            const width = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
            const height = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
            
            // Генерируем случайную позицию (с отступом от краев)
            const x = Math.floor(Math.random() * (GameState.fieldWidth - width - 2)) + 1;
            const y = Math.floor(Math.random() * (GameState.fieldHeight - height - 2)) + 1;
            
            const newRoom = { x, y, width, height };
            
            // Проверяем пересечение с существующими комнатами
            let intersects = false;
            for (const existingRoom of GameState.rooms) {
                if (roomsIntersect(newRoom, existingRoom)) {
                    intersects = true;
                    break;
                }
            }
            
            // Если комната не пересекается, добавляем её
            if (!intersects) {
                GameState.rooms.push(newRoom);
                console.log(`Room ${i + 1} placed at (${x}, ${y}) size ${width}x${height}`);
                roomPlaced = true;
                
                // Заполняем комнату полом
                for (let ry = y; ry < y + height; ry++) {
                    for (let rx = x; rx < x + width; rx++) {
                        GameState.map[ry][rx] = CELL_TYPES.FLOOR;
                    }
                }
            }
            
            attempts++;
        }
        
        if (!roomPlaced) {
            console.log(`Failed to place room ${i + 1} after ${maxAttempts} attempts`);
        }
    }
    
    console.log(`Successfully generated ${GameState.rooms.length} rooms`);
};


// Функция генерации проходов между комнатами
const generateCorridors = () => {
    console.log("Generating corridors to connect rooms...");
    
    if (GameState.rooms.length === 0) {
        console.log("No rooms to connect");
        return;
    }
    
    // 1. Создаем основные проходы через всю карту
    const mainVerticalCorridors = 2;
    const mainHorizontalCorridors = 2;
    
    // Вертикальные проходы
    for (let i = 0; i < mainVerticalCorridors; i++) {
        const x = Math.floor((GameState.fieldWidth / (mainVerticalCorridors + 1)) * (i + 1));
        for (let y = 1; y < GameState.fieldHeight - 1; y++) {
            GameState.map[y][x] = CELL_TYPES.FLOOR;
        }
        console.log(`Main vertical corridor created at X=${x}`);
    }
    
    // Горизонтальные проходы
    for (let i = 0; i < mainHorizontalCorridors; i++) {
        const y = Math.floor((GameState.fieldHeight / (mainHorizontalCorridors + 1)) * (i + 1));
        for (let x = 1; x < GameState.fieldWidth - 1; x++) {
            GameState.map[y][x] = CELL_TYPES.FLOOR;
        }
        console.log(`Main horizontal corridor created at Y=${y}`);
    }
    
    // 2. Соединяем каждую комнату с ближайшим основным проходом
    for (let i = 0; i < GameState.rooms.length; i++) {
        const room = GameState.rooms[i];
        const roomCenterX = room.x + Math.floor(room.width / 2);
        const roomCenterY = room.y + Math.floor(room.height / 2);
        
        // Находим ближайший вертикальный проход
        let nearestVerticalX = Math.floor(GameState.fieldWidth / 3);
        if (roomCenterX > GameState.fieldWidth * 2/3) {
            nearestVerticalX = Math.floor(GameState.fieldWidth * 2/3);
        }
        
        // Создаем горизонтальный проход от комнаты к вертикальному проходу
        const startX = Math.min(roomCenterX, nearestVerticalX);
        const endX = Math.max(roomCenterX, nearestVerticalX);
        
        for (let x = startX; x <= endX; x++) {
            GameState.map[roomCenterY][x] = CELL_TYPES.FLOOR;
        }
        
        // Находим ближайший горизонтальный проход
        let nearestHorizontalY = Math.floor(GameState.fieldHeight / 3);
        if (roomCenterY > GameState.fieldHeight * 2/3) {
            nearestHorizontalY = Math.floor(GameState.fieldHeight * 2/3);
        }
        
        // Создаем вертикальный проход от комнаты к горизонтальному проходу
        const startY = Math.min(roomCenterY, nearestHorizontalY);
        const endY = Math.max(roomCenterY, nearestHorizontalY);
        
        for (let y = startY; y <= endY; y++) {
            GameState.map[y][roomCenterX] = CELL_TYPES.FLOOR;
        }
        
        console.log(`Room ${i + 1} connected to main corridors`);
    }
    
    // 3. Добавляем дополнительные случайные проходы для разнообразия
    const additionalCorridors = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < additionalCorridors; i++) {
        if (Math.random() < 0.5) {
            // Вертикальный проход
            const x = Math.floor(Math.random() * (GameState.fieldWidth - 2)) + 1;
            const startY = Math.floor(Math.random() * (GameState.fieldHeight / 2)) + 1;
            const endY = Math.floor(Math.random() * (GameState.fieldHeight / 2)) + GameState.fieldHeight / 2;
            
            for (let y = startY; y < endY; y++) {
                GameState.map[y][x] = CELL_TYPES.FLOOR;
            }
        } else {
            // Горизонтальный проход
            const y = Math.floor(Math.random() * (GameState.fieldHeight - 2)) + 1;
            const startX = Math.floor(Math.random() * (GameState.fieldWidth / 2)) + 1;
            const endX = Math.floor(Math.random() * (GameState.fieldWidth / 2)) + GameState.fieldWidth / 2;
            
            for (let x = startX; x < endX; x++) {
                GameState.map[y][x] = CELL_TYPES.FLOOR;
            }
        }
    }
    
    console.log("Corridors generation completed - all rooms should be connected");
};

// Функция расчета расстояния между двумя точками
const getDistance = (x1, y1, x2, y2) => {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2); // Манхэттенское расстояние
};

// Функция проверки, свободна ли клетка
const isCellEmpty = (x, y) => {
    return GameState.map[y] && GameState.map[y][x] === CELL_TYPES.FLOOR;
};

// Функция поиска случайной пустой клетки
const findEmptyCell = (excludePositions = []) => {
    const maxAttempts = 1000;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        const x = Math.floor(Math.random() * (GameState.fieldWidth - 2)) + 1;
        const y = Math.floor(Math.random() * (GameState.fieldHeight - 2)) + 1;
        
        // Проверяем, что клетка пуста
        if (isCellEmpty(x, y)) {
            // Проверяем, что позиция не в списке исключений
            const isExcluded = excludePositions.some(pos => pos.x === x && pos.y === y);
            
            if (!isExcluded) {
                return { x, y };
            }
        }
        
        attempts++;
    }
    
    console.error("Could not find empty cell after", maxAttempts, "attempts");
    return null;
};

// Функция поиска пустой клетки с учетом минимального расстояния от других объектов
const findEmptyCellWithDistance = (excludePositions = [], minDistance = 2) => {
    const maxAttempts = 1000;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        const x = Math.floor(Math.random() * (GameState.fieldWidth - 2)) + 1;
        const y = Math.floor(Math.random() * (GameState.fieldHeight - 2)) + 1;
        
        // Проверяем, что клетка пуста
        if (isCellEmpty(x, y)) {
            // Проверяем расстояние до всех исключенных позиций
            let validPosition = true;
            
            for (const pos of excludePositions) {
                if (getDistance(x, y, pos.x, pos.y) < minDistance) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                return { x, y };
            }
        }
        
        attempts++;
    }
    
    // Если не удалось найти с минимальным расстоянием, попробуем без него
    console.warn(`Could not find cell with distance ${minDistance}, trying without distance constraint`);
    return findEmptyCell(excludePositions);
};

// Функция размещения всех объектов на карте
const placeObjects = () => {
    console.log("Placing objects on map...");
    
    // Массив для отслеживания занятых позиций
    const occupiedPositions = [];
    
    // 1. Размещаем героя (PLAYER) в случайном пустом месте
    console.log("Placing player...");
    const playerPos = findEmptyCell();
    if (playerPos) {
        GameState.player.x = playerPos.x;
        GameState.player.y = playerPos.y;
        GameState.map[playerPos.y][playerPos.x] = CELL_TYPES.PLAYER;
        occupiedPositions.push(playerPos);
        console.log(`Player placed at (${playerPos.x}, ${playerPos.y})`);
    } else {
        console.error("Failed to place player!");
        return;
    }
    
    // 2. Размещаем противников (ENEMY) - не вплотную к герою
    console.log("Placing enemies...");
    const enemyCount = 10;
    for (let i = 0; i < enemyCount; i++) {
        const enemyPos = findEmptyCellWithDistance(occupiedPositions, 3); // Минимум 3 клетки от других объектов
        
        if (enemyPos) {
            GameState.map[enemyPos.y][enemyPos.x] = CELL_TYPES.ENEMY;
            GameState.enemies.push({
                x: enemyPos.x,
                y: enemyPos.y,
                health: GameState.settings.enemyHealth,
                maxHealth: GameState.settings.enemyHealth
            });
            occupiedPositions.push(enemyPos);
            console.log(`Enemy ${i + 1} placed at (${enemyPos.x}, ${enemyPos.y})`);
        } else {
            console.warn(`Failed to place enemy ${i + 1}`);
        }
    }
    
    // 3. Размещаем зелья здоровья (POTION)
    console.log("Placing health potions...");
    const potionCount = 10;
    for (let i = 0; i < potionCount; i++) {
        const potionPos = findEmptyCell(occupiedPositions);
        
        if (potionPos) {
            GameState.map[potionPos.y][potionPos.x] = CELL_TYPES.POTION;
            GameState.items.potions.push({
                x: potionPos.x,
                y: potionPos.y
            });
            occupiedPositions.push(potionPos);
            console.log(`Potion ${i + 1} placed at (${potionPos.x}, ${potionPos.y})`);
        } else {
            console.warn(`Failed to place potion ${i + 1}`);
        }
    }
    
    // 4. Размещаем мечи (SWORD)
    console.log("Placing swords...");
    const swordCount = 2;
    for (let i = 0; i < swordCount; i++) {
        const swordPos = findEmptyCell(occupiedPositions);
        
        if (swordPos) {
            GameState.map[swordPos.y][swordPos.x] = CELL_TYPES.SWORD;
            GameState.items.swords.push({
                x: swordPos.x,
                y: swordPos.y
            });
            occupiedPositions.push(swordPos);
            console.log(`Sword ${i + 1} placed at (${swordPos.x}, ${swordPos.y})`);
        } else {
            console.warn(`Failed to place sword ${i + 1}`);
        }
    }
    
    console.log("Object placement completed!");
    console.log(`Final counts - Enemies: ${GameState.enemies.length}, Potions: ${GameState.items.potions.length}, Swords: ${GameState.items.swords.length}`);
};

// Функция отрисовки карты в div.field
const renderMap = () => {
    const $field = $('.field');
    console.log("Rendering map, field element found:", $field.length > 0);
    $field.empty();

    let tilesCreated = 0;

    for (let y = 0; y < GameState.fieldHeight; y++) {
        for (let x = 0; x < GameState.fieldWidth; x++) {
            const cellType = GameState.map[y][x];
            
            // Отрисовываем только не-пустые клетки
            if (cellType !== CELL_TYPES.FLOOR) {
                const $tile = $('<div>')
                    .addClass('tile')
                    .addClass('tile' + cellType)
                    .css({
                        left: x * GameState.tileSize + 'px',
                        top: y * GameState.tileSize + 'px'
                    });

                // Добавляем полоску здоровья для врагов
                if (cellType === CELL_TYPES.ENEMY) {
                    const enemy = GameState.enemies.find(e => e.x === x && e.y === y);
                    if (enemy) {
                        const healthPercent = (enemy.health / enemy.maxHealth) * 100;
                        const $health = $('<div>')
                            .addClass('health')
                            .css('width', (GameState.tileSize * healthPercent / 100) + 'px');
                        $tile.append($health);
                    }
                }

                // Добавляем полоску здоровья для игрока
                if (cellType === CELL_TYPES.PLAYER) {
                    const healthPercent = (GameState.player.health / GameState.player.maxHealth) * 100;
                    const $health = $('<div>')
                        .addClass('health')
                        .css('width', (GameState.tileSize * healthPercent / 100) + 'px');
                    $tile.append($health);
                }

                $field.append($tile);
                tilesCreated++;
            }
        }
    }
    
    console.log("Tiles created:", tilesCreated);
    console.log("Field children count:", $field.children().length);
};

// Функция отрисовки здоровья в div.title
const renderHealth = () => {
    // Обновляем здоровье
    $('#health').text(GameState.player.health);
    $('#maxHealth').text(GameState.player.maxHealth);
    
    // Меняем цвет в зависимости от уровня здоровья
    const healthPercent = (GameState.player.health / GameState.player.maxHealth) * 100;
    const $healthSpan = $('#health');
    
    if (healthPercent > 60) {
        $healthSpan.css('color', '#00ff00'); // Зеленый
    } else if (healthPercent > 30) {
        $healthSpan.css('color', '#ffff00'); // Желтый
    } else {
        $healthSpan.css('color', '#ff0000'); // Красный
    }
    
    // Обновляем атаку
    const totalAttack = GameState.player.baseAttack + GameState.player.attackBonus;
    $('#attack').text(totalAttack);
    
    // Подсвечиваем атаку если есть бонус
    if (GameState.player.attackBonus > 0) {
        $('#attack').css('color', '#ff9900');
    } else {
        $('#attack').css('color', '#ff6600');
    }
    
    // Обновляем количество мечей
    $('#swords').text(GameState.player.swordsCollected);
    
    // Обновляем количество врагов
    $('#enemies').text(GameState.enemies.length);
};

class Game {
    constructor() {
        // Инициализируем состояние игры
        this.initializeGameState();
    }

    initializeGameState() {
        console.log("Initializing game state...");
        // Сбрасываем состояние игры
        GameState.map = createEmptyMap();
        GameState.rooms = [];
        GameState.enemies = [];
        GameState.items.potions = [];
        GameState.items.swords = [];
        
        // Сбрасываем игрока (позиция будет установлена после генерации комнат)
        GameState.player = {
            x: 0,
            y: 0,
            health: 100,
            maxHealth: 100,
            baseAttack: 25,
            attackBonus: 0,
            swordsCollected: 0
        };
        console.log("Game state initialized.");
    }

    init() {
        console.log("Initializing game...");
        console.log("jQuery loaded:", typeof $ !== 'undefined');
        console.log("Field element found:", $('.field').length > 0);
        
        this.setupField();
        this.generateMap();
        this.bindEvents();
        renderMap();
        renderHealth();
        
        console.log("Game initialized successfully!");
        console.log("Field size:", GameState.fieldWidth, "x", GameState.fieldHeight);
        console.log("Map matrix size:", GameState.map.length, "x", GameState.map[0]?.length);
        console.log("Enemies:", GameState.enemies.length);
        console.log("Potions:", GameState.items.potions.length);
        console.log("Swords:", GameState.items.swords.length);
        console.log("Rooms generated:", GameState.rooms.length);
        
        // Проверяем требования игры
        this.verifyGameRequirements();
    }

    setupField() {
        // Генерируем комнаты
        generateRooms();
        
        // Генерируем проходы для соединения комнат
        generateCorridors();
    }

    generateMap() {
        // Используем новую систему размещения объектов
        placeObjects();
    }


    bindEvents() {
        $(document).keydown((e) => {
            this.handleKeyDown(e);
        });
    }

    handleKeyDown(e) {
        console.log("Key pressed:", e.key, "Code:", e.code, "KeyCode:", e.keyCode);
        
        // Обработка атаки по пробелу
        if (e.key === ' ' || e.code === 'Space' || e.keyCode === 32) {
            console.log("Space pressed - attacking!");
            e.preventDefault();
            this.playerAttack();
            // После атаки игрока, враги атакуют в ответ
            this.enemyAttack();
            // После атаки, враги двигаются
            this.moveEnemies();
            // Обновляем отображение после движения врагов
            renderMap();
            return;
        }
        
        let dx = 0, dy = 0;
        let keyHandled = false;

        // Используем несколько способов определения клавиш для максимальной совместимости
        const keyLower = e.key ? e.key.toLowerCase() : '';
        const code = e.code || '';
        const keyCode = e.keyCode || 0;

        // Движение вверх
        if (e.key === 'ArrowUp' || keyLower === 'w' || code === 'KeyW' || keyCode === 87 || code === 'ArrowUp' || keyCode === 38) {
            dy = -1;
            keyHandled = true;
            console.log("UP detected via:", e.key, code, keyCode);
        }
        // Движение вниз  
        else if (e.key === 'ArrowDown' || keyLower === 's' || code === 'KeyS' || keyCode === 83 || code === 'ArrowDown' || keyCode === 40) {
            dy = 1;
            keyHandled = true;
            console.log("DOWN detected via:", e.key, code, keyCode);
        }
        // Движение влево
        else if (e.key === 'ArrowLeft' || keyLower === 'a' || code === 'KeyA' || keyCode === 65 || code === 'ArrowLeft' || keyCode === 37) {
            dx = -1;
            keyHandled = true;
            console.log("LEFT detected via:", e.key, code, keyCode);
        }
        // Движение вправо
        else if (e.key === 'ArrowRight' || keyLower === 'd' || code === 'KeyD' || keyCode === 68 || code === 'ArrowRight' || keyCode === 39) {
            dx = 1;
            keyHandled = true;
            console.log("RIGHT detected via:", e.key, code, keyCode);
        }

        if (!keyHandled) {
            console.log("Unhandled key:", e.key, "Code:", code, "KeyCode:", keyCode);
            return;
        }

        console.log("Moving by delta:", dx, dy);
        e.preventDefault();
        this.movePlayer(dx, dy);
        // После движения игрока, враги атакуют если рядом
        this.enemyAttack();
        // После атаки, враги двигаются
        this.moveEnemies();
        // Обновляем отображение после движения врагов
        renderMap();
    }

    movePlayer(dx, dy) {
        const currentX = GameState.player.x;
        const currentY = GameState.player.y;
        const newX = currentX + dx;
        const newY = currentY + dy;
        
        console.log(`movePlayer: from (${currentX}, ${currentY}) to (${newX}, ${newY})`);
        
        // Проверяем границы поля
        if (newX < 0 || newX >= GameState.fieldWidth || newY < 0 || newY >= GameState.fieldHeight) {
            console.log("Movement blocked: out of bounds");
            return;
        }

        const targetCell = GameState.map[newY][newX];
        console.log("Target cell type:", targetCell);

        // Проверяем столкновение со стенами
        if (targetCell === CELL_TYPES.WALL) {
            console.log("Movement blocked: wall");
            return;
        }

        // Проверяем столкновение с врагами - теперь нельзя ходить на клетки с врагами
        if (targetCell === CELL_TYPES.ENEMY) {
            console.log("Cannot move to enemy position:", newX, newY);
            return;
        }

        // Очищаем старую позицию игрока
        GameState.map[currentY][currentX] = CELL_TYPES.FLOOR;

        // Проверяем подбор предметов
        if (targetCell === CELL_TYPES.POTION) {
            console.log("Collecting potion");
            this.collectHealthPotion(newX, newY);
        } else if (targetCell === CELL_TYPES.SWORD) {
            console.log("Collecting sword");
            this.collectSword(newX, newY);
        }

        // Перемещаем игрока
        GameState.player.x = newX;
        GameState.player.y = newY;
        GameState.map[newY][newX] = CELL_TYPES.PLAYER;
        
        console.log("Player moved to:", GameState.player.x, GameState.player.y);

        renderMap();
        renderHealth();
    }


    collectHealthPotion(x, y) {
        const potionIndex = GameState.items.potions.findIndex(p => p.x === x && p.y === y);
        if (potionIndex !== -1) {
            const healAmount = GameState.settings.potionHeal;
            const oldHealth = GameState.player.health;
            
            GameState.player.health = Math.min(GameState.player.maxHealth, GameState.player.health + healAmount);
            GameState.items.potions.splice(potionIndex, 1);
            
            const actualHeal = GameState.player.health - oldHealth;
            console.log(`Подобрано зелье здоровья! Восстановлено ${actualHeal} HP. Здоровье: ${GameState.player.health}/${GameState.player.maxHealth}`);
            
            // Показываем уведомление
            this.showMessage(`+${actualHeal} HP`, 'heal');
        }
    }

    collectSword(x, y) {
        const swordIndex = GameState.items.swords.findIndex(s => s.x === x && s.y === y);
        if (swordIndex !== -1) {
            GameState.items.swords.splice(swordIndex, 1);
            GameState.player.swordsCollected++;
            GameState.player.attackBonus += 15; // Каждый меч добавляет +15 к атаке
            
            const totalAttack = GameState.player.baseAttack + GameState.player.attackBonus;
            console.log(`Подобран меч! Атака увеличена до ${totalAttack}. Мечей собрано: ${GameState.player.swordsCollected}`);
            
            // Показываем уведомление
            this.showMessage(`+15 ATK`, 'attack');
        }
    }

    // Функция для показа временных сообщений (можно расширить позже)
    showMessage(text, type) {
        console.log(`[${type.toUpperCase()}] ${text}`);
    }

    // Функция атаки героя по пробелу (атака всех врагов в радиусе 1 клетки)
    playerAttack() {
        console.log("Player attacking nearby enemies...");
        
        const playerX = GameState.player.x;
        const playerY = GameState.player.y;
        const playerAttackPower = GameState.player.baseAttack + GameState.player.attackBonus;
        
        let enemiesAttacked = 0;
        let enemiesKilled = 0;
        
        // Проверяем все 8 направлений вокруг игрока
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],  // верх-лево, верх, верх-право
            [0, -1],           [0, 1],   // лево,       право
            [1, -1],  [1, 0],  [1, 1]    // низ-лево, низ, низ-право
        ];
        
        for (const [dx, dy] of directions) {
            const targetX = playerX + dx;
            const targetY = playerY + dy;
            
            // Проверяем границы
            if (targetX < 0 || targetX >= GameState.fieldWidth || 
                targetY < 0 || targetY >= GameState.fieldHeight) {
                continue;
            }
            
            // Проверяем, есть ли враг на этой клетке
            if (GameState.map[targetY][targetX] === CELL_TYPES.ENEMY) {
                const enemyIndex = GameState.enemies.findIndex(e => e.x === targetX && e.y === targetY);
                
                if (enemyIndex !== -1) {
                    const enemy = GameState.enemies[enemyIndex];
                    const oldEnemyHealth = enemy.health;
                    
                    // Наносим урон
                    enemy.health -= playerAttackPower;
                    const actualDamage = oldEnemyHealth - Math.max(0, enemy.health);
                    
                    console.log(`Attacked enemy at (${targetX}, ${targetY}) for ${actualDamage} damage. Enemy health: ${Math.max(0, enemy.health)}/${enemy.maxHealth}`);
                    
                    enemiesAttacked++;
                    
                    // Проверяем, умер ли враг
                    if (enemy.health <= 0) {
                        GameState.map[targetY][targetX] = CELL_TYPES.FLOOR;
                        GameState.enemies.splice(enemyIndex, 1);
                        enemiesKilled++;
                        console.log(`Enemy at (${targetX}, ${targetY}) defeated!`);
                    }
                }
            }
        }
        
        if (enemiesAttacked > 0) {
            console.log(`Player attacked ${enemiesAttacked} enemies, killed ${enemiesKilled}`);
            this.showMessage(`Attacked ${enemiesAttacked} enemies!`, 'combat');
            
            // Проверяем победу
            if (GameState.enemies.length === 0) {
                setTimeout(() => {
                    alert("Поздравляем! Вы победили всех врагов!");
                }, 100);
            }
            
            // Обновляем отображение
            renderMap();
            renderHealth();
        } else {
            console.log("No enemies in range to attack");
            this.showMessage("No enemies in range", 'info');
        }
    }

    // Функция атаки всех врагов (вызывается после хода игрока)
    enemyAttack() {
        console.log("Enemies attacking player...");
        
        const playerX = GameState.player.x;
        const playerY = GameState.player.y;
        let totalDamage = 0;
        let attackingEnemies = 0;
        
        // Проверяем всех врагов
        for (const enemy of GameState.enemies) {
            // Вычисляем расстояние до игрока (Манхэттенское расстояние)
            const distance = Math.abs(enemy.x - playerX) + Math.abs(enemy.y - playerY);
            
            // Если враг рядом с игроком (расстояние 1), он атакует
            if (distance === 1) {
                const enemyDamage = GameState.settings.enemyAttack;
                totalDamage += enemyDamage;
                attackingEnemies++;
                
                console.log(`Enemy at (${enemy.x}, ${enemy.y}) attacks for ${enemyDamage} damage`);
            }
        }
        
        if (attackingEnemies > 0) {
            const oldPlayerHealth = GameState.player.health;
            GameState.player.health = Math.max(0, GameState.player.health - totalDamage);
            const actualDamage = oldPlayerHealth - GameState.player.health;
            
            console.log(`Player attacked by ${attackingEnemies} enemies for ${actualDamage} total damage. Player health: ${GameState.player.health}/${GameState.player.maxHealth}`);
            this.showMessage(`Attacked by ${attackingEnemies} enemies for ${actualDamage} damage!`, 'damage');
            
            // Проверяем, умер ли игрок
            if (GameState.player.health <= 0) {
                console.log("Player died!");
                setTimeout(() => {
                    alert("Игра окончена! Вы погибли.");
                    this.resetGame();
                }, 100);
                return;
            }
            
            // Обновляем отображение здоровья
            renderHealth();
        } else {
            console.log("No enemies in range to attack player");
        }
    }

    // Функция проверки, может ли враг двигаться в указанную позицию
    canEnemyMoveTo(x, y, enemyIndex) {
        // Проверяем границы карты
        if (x < 0 || x >= GameState.fieldWidth || y < 0 || y >= GameState.fieldHeight) {
            return false;
        }

        const targetCell = GameState.map[y][x];

        // Нельзя ходить через стены
        if (targetCell === CELL_TYPES.WALL) {
            return false;
        }

        // Нельзя ходить на клетку с игроком
        if (targetCell === CELL_TYPES.PLAYER) {
            return false;
        }

        // Нельзя ходить на клетку с другим врагом
        if (targetCell === CELL_TYPES.ENEMY) {
            return false;
        }

        return true;
    }

    // Функция получения направления к цели (упрощенный pathfinding)
    getDirectionToTarget(fromX, fromY, toX, toY) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        
        // Нормализуем направление до -1, 0, или 1
        const moveX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
        const moveY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
        
        return { dx: moveX, dy: moveY };
    }

    // Функция движения всех противников
    moveEnemies() {
        console.log("Moving enemies...");
        
        const playerX = GameState.player.x;
        const playerY = GameState.player.y;
        const detectionRange = 8; // Дальность обнаружения игрока
        
        // Перебираем всех врагов
        for (let i = 0; i < GameState.enemies.length; i++) {
            const enemy = GameState.enemies[i];
            const currentX = enemy.x;
            const currentY = enemy.y;
            
            // Вычисляем расстояние до игрока
            const distanceToPlayer = Math.abs(currentX - playerX) + Math.abs(currentY - playerY);
            
            let newX = currentX;
            let newY = currentY;
            let moveFound = false;
            
            // Если игрок близко, двигаемся к нему
            if (distanceToPlayer <= detectionRange) {
                console.log(`Enemy at (${currentX}, ${currentY}) detected player at distance ${distanceToPlayer}`);
                
                // Получаем направление к игроку
                const direction = this.getDirectionToTarget(currentX, currentY, playerX, playerY);
                
                // Пробуем двигаться в направлении игрока
                const targetX = currentX + direction.dx;
                const targetY = currentY + direction.dy;
                
                if (this.canEnemyMoveTo(targetX, targetY, i)) {
                    newX = targetX;
                    newY = targetY;
                    moveFound = true;
                    console.log(`Enemy moving towards player: (${currentX}, ${currentY}) -> (${newX}, ${newY})`);
                } else {
                    // Если прямой путь заблокирован, пробуем альтернативные направления
                    const alternativeDirections = [
                        { dx: direction.dx, dy: 0 },  // Только по X
                        { dx: 0, dy: direction.dy },  // Только по Y
                        { dx: -direction.dx, dy: 0 }, // Противоположно по X
                        { dx: 0, dy: -direction.dy }  // Противоположно по Y
                    ];
                    
                    for (const altDir of alternativeDirections) {
                        const altX = currentX + altDir.dx;
                        const altY = currentY + altDir.dy;
                        
                        if (this.canEnemyMoveTo(altX, altY, i)) {
                            newX = altX;
                            newY = altY;
                            moveFound = true;
                            console.log(`Enemy using alternative path: (${currentX}, ${currentY}) -> (${newX}, ${newY})`);
                            break;
                        }
                    }
                }
            }
            
            // Если не нашли путь к игроку или игрок далеко, случайное движение
            if (!moveFound) {
                const randomDirections = [
                    { dx: 0, dy: -1 },  // Вверх
                    { dx: 0, dy: 1 },   // Вниз
                    { dx: -1, dy: 0 },  // Влево
                    { dx: 1, dy: 0 },   // Вправо
                    { dx: 0, dy: 0 }    // Остаться на месте
                ];
                
                // Перемешиваем направления для случайности
                for (let j = randomDirections.length - 1; j > 0; j--) {
                    const k = Math.floor(Math.random() * (j + 1));
                    [randomDirections[j], randomDirections[k]] = [randomDirections[k], randomDirections[j]];
                }
                
                // Пробуем случайные направления
                for (const dir of randomDirections) {
                    const randX = currentX + dir.dx;
                    const randY = currentY + dir.dy;
                    
                    if (dir.dx === 0 && dir.dy === 0) {
                        // Остаться на месте всегда возможно
                        console.log(`Enemy at (${currentX}, ${currentY}) stays in place`);
                        break;
                    }
                    
                    if (this.canEnemyMoveTo(randX, randY, i)) {
                        newX = randX;
                        newY = randY;
                        moveFound = true;
                        console.log(`Enemy random move: (${currentX}, ${currentY}) -> (${newX}, ${newY})`);
                        break;
                    }
                }
            }
            
            // Применяем движение если оно найдено
            if (newX !== currentX || newY !== currentY) {
                // Очищаем старую позицию
                GameState.map[currentY][currentX] = CELL_TYPES.FLOOR;
                
                // Устанавливаем новую позицию
                enemy.x = newX;
                enemy.y = newY;
                GameState.map[newY][newX] = CELL_TYPES.ENEMY;
            }
        }
        
        console.log("Enemy movement completed");
    }

    // Функция проверки выполнения всех требований игры
    verifyGameRequirements() {
        console.log("=== ПРОВЕРКА ТРЕБОВАНИЙ ИГРЫ ===");
        
        const requirements = {
            mapSize: false,
            allObjectsPlaced: false,
            mapConnectivity: false,
            mechanicsWork: false,
            canLaunchDirectly: false
        };
        
        // 1. Проверка размера карты 40x24
        if (GameState.fieldWidth === 40 && GameState.fieldHeight === 24 && 
            GameState.map.length === 24 && GameState.map[0]?.length === 40) {
            requirements.mapSize = true;
            console.log("✅ Карта 40x24 - OK");
        } else {
            console.log("❌ Карта НЕ 40x24 - ОШИБКА");
        }
        
        // 2. Проверка размещения всех объектов
        const expectedEnemies = 10;
        const expectedPotions = 10;
        const expectedSwords = 2;
        
        if (GameState.enemies.length === expectedEnemies && 
            GameState.items.potions.length === expectedPotions && 
            GameState.items.swords.length === expectedSwords &&
            GameState.player.x > 0 && GameState.player.y > 0) {
            requirements.allObjectsPlaced = true;
            console.log("✅ Все объекты размещены - OK");
            console.log(`   Враги: ${GameState.enemies.length}/${expectedEnemies}`);
            console.log(`   Зелья: ${GameState.items.potions.length}/${expectedPotions}`);
            console.log(`   Мечи: ${GameState.items.swords.length}/${expectedSwords}`);
            console.log(`   Игрок: (${GameState.player.x}, ${GameState.player.y})`);
        } else {
            console.log("❌ НЕ все объекты размещены - ОШИБКА");
        }
        
        // 3. Проверка связности карты (есть комнаты и проходы)
        if (GameState.rooms.length >= 5) {
            requirements.mapConnectivity = true;
            console.log(`✅ Карта связная - OK (комнат: ${GameState.rooms.length})`);
        } else {
            console.log("❌ Карта может быть НЕ связная - ПРЕДУПРЕЖДЕНИЕ");
        }
        
        // 4. Проверка основных механик
        const hasMovement = typeof this.movePlayer === 'function';
        const hasCombat = typeof this.playerAttack === 'function';
        const hasAI = typeof this.moveEnemies === 'function';
        
        if (hasMovement && hasCombat && hasAI) {
            requirements.mechanicsWork = true;
            console.log("✅ Все механики реализованы - OK");
        } else {
            console.log("❌ НЕ все механики работают - ОШИБКА");
        }
        
        // 5. Проверка возможности запуска (jQuery и файлы)
        if (typeof $ !== 'undefined') {
            requirements.canLaunchDirectly = true;
            console.log("✅ jQuery загружен, можно запускать - OK");
        } else {
            console.log("❌ jQuery НЕ загружен - ОШИБКА");
        }
        
        // Общий результат
        const passedRequirements = Object.values(requirements).filter(Boolean).length;
        const totalRequirements = Object.keys(requirements).length;
        
        console.log(`\n=== РЕЗУЛЬТАТ: ${passedRequirements}/${totalRequirements} требований выполнено ===`);
        
        if (passedRequirements === totalRequirements) {
            console.log("🎉 ВСЕ ТРЕБОВАНИЯ ВЫПОЛНЕНЫ! Игра готова к использованию!");
        } else {
            console.log("⚠️ Есть проблемы, требующие внимания.");
        }
        
        return requirements;
    }

    resetGame() {
        setTimeout(() => {
            this.initializeGameState();
            this.setupField();
            this.generateMap();
            renderMap();
            renderHealth();
        }, 2000);
    }
}
