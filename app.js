// Глобальные переменные для элементов DOM, карты и состояния
let map;
let mapElement;
let placeDetailsPanel;
let placeDetailsContent;
let hiddenPhotoInput;
let activeNavItem = null; // Для отслеживания активного пункта навигации
let currentMode = 'my-places'; // <-- Инициализируем значением по умолчанию
let currentRouteControl = null; // Хранение текущего контрола маршрутизации
let currentSearchRadiusCircle = null; // Круг радиуса поиска
let currentEventRadiusCircle = null; // Круг радиуса поиска событий
let searchResultsLayer = null; // Слой для маркеров найденных мест
let eventMarkersCollection = null; // Коллекция для маркеров событий
let markersCollection = null;    // Коллекция для пользовательских маркеров
let userPlacemark = null; // Метка текущего положения пользователя
let customLocationMarker = null; // Метка для выбранного вручную местоположения
let isCustomLocationMode = false; // Флаг режима выбора местоположения
let isMarkerMode = false; // Флаг режима добавления маркера
let markerIdToAttachPhoto = null; // ID маркера, к которому прикрепляем фото
let navMap, navPlaces, navEvents, navGallery, navAbout;
let mapSection, gallerySection, aboutSection; // 'events-container' не используется
let welcomeScreen; // Элемент приветственного экрана
let eventsControls, placesControls; // Панели управления на карте
let eventsList, placesList, myPlacesList; // Списки
let eventRadiusSlider, searchRadiusSlider; // Слайдеры радиуса
let eventRadiusValueSpan, radiusValueSpan; // Отображение радиуса
let placesLoadingIndicator, eventsLoadingIndicator; // Индикаторы загрузки
let noPlacesResults, noEventsResults; // Сообщения об отсутствии результатов
let btnClearSearchResults; // Кнопка очистки поиска мест
let placeCategorySelect;
let placesMarkers = [];
let myPlacesContainer;
let currentPosition = null; // Последняя известная позиция пользователя
let currentWeatherData = null; // Данные о погоде

const weatherApiKey = "f5e3f42aee166a05a345c41a0e4376cf";

// Настройки
const DEFAULT_MAP_CENTER = [55.751244, 37.618423];
const DEFAULT_MAP_ZOOM = 12;
const UPLOAD_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

window.markers = [];
window.photos = [];
window.events = [];


document.addEventListener('DOMContentLoaded', () => {
    console.log('[TRACE] DOMContentLoaded сработало.');

    let apiCheckInterval = null;

    // Функция для проверки готовности API и запуска инициализации
    const checkApiAndInit = () => {
        if (window.yandexMapsApiReady) {
            console.log('[TRACE] API Яндекс.Карт готово. Вызываем initApp.');
            clearInterval(apiCheckInterval);
            initApp();
        } else {
            console.log('[TRACE] API Яндекс.Карт еще не готово. Ждем...');
        }
    };


    if (window.yandexMapsApiReady) {
        checkApiAndInit();
    } else {
        // Если не готово, запускаем интервал проверки каждые 100 мс
        console.log('[TRACE] Запускаем интервал проверки готовности API.');
        apiCheckInterval = setInterval(checkApiAndInit, 100); // <-- Убираем const
    }
});


function startMainApp() {
    console.log('[TRACE] >>>>> ENTER startMainApp <<<<<');
    console.log('[TRACE] startMainApp: Вызов checkBrowserSupport...');
    if (!checkBrowserSupport()) {
        console.error('[TRACE] startMainApp: checkBrowserSupport НЕ ПРОЙДЕНА. Выход.');
        return;
    }
    console.log('[TRACE] startMainApp: checkBrowserSupport OK.');

    console.log('[TRACE] startMainApp: Получение элементов DOM...');
    mapElement = document.getElementById('map');
    placeDetailsPanel = document.getElementById('place-details');
    placeDetailsContent = document.getElementById('place-details-content');
    hiddenPhotoInput = document.getElementById('hidden-photo-input');

    navMap = document.getElementById('nav-map');
    navPlaces = document.getElementById('nav-places');
    navEvents = document.getElementById('nav-events');
    navGallery = document.getElementById('nav-gallery');
    navAbout = document.getElementById('nav-about');

    mapSection = document.getElementById('map-container');
    gallerySection = document.getElementById('gallery-container');
    aboutSection = document.getElementById('about-container');
    welcomeScreen = document.getElementById('welcome-screen');

    eventsControls = document.getElementById('events-controls');
    placesControls = document.getElementById('places-controls');

    eventsList = document.getElementById('events-list');
    placesList = document.getElementById('places-list');
    myPlacesList = document.getElementById('my-places-list');

    eventRadiusSlider = document.getElementById('event-radius');
    searchRadiusSlider = document.getElementById('search-radius');
    eventRadiusValueSpan = document.getElementById('event-radius-value');
    radiusValueSpan = document.getElementById('radius-value');

    placesLoadingIndicator = document.getElementById('places-loading');
    eventsLoadingIndicator = document.getElementById('events-loading');

    noPlacesResults = document.getElementById('no-places-results');
    noEventsResults = document.getElementById('no-events-results');

    btnClearSearchResults = document.getElementById('btn-clear-search-results');
    placeCategorySelect = document.getElementById('place-category');
    myPlacesContainer = document.getElementById('my-places-container');


    console.log('[TRACE] startMainApp: Элементы DOM получены.');


    console.log('[TRACE] startMainApp: Вызов setupNavigation...');
    setupNavigation();
    console.log('[TRACE] startMainApp: setupNavigation ЗАВЕРШЕНА.');


    console.log('[TRACE] startMainApp: Вызов initMap...');
    initMap();
    console.log('[TRACE] startMainApp: initMap ЗАВЕРШЕНА.');

    console.log('[TRACE] startMainApp: Вызов loadMarkersFromStorage...');
    loadMarkersFromStorage();
    console.log('[TRACE] startMainApp: loadMarkersFromStorage ЗАВЕРШЕНА.');

    console.log('[TRACE] startMainApp: Вызов setupEventListeners...');
    setupEventListeners();
    console.log('[TRACE] startMainApp: setupEventListeners ЗАВЕРШЕНА.');

    console.log('[TRACE] startMainApp: Вызов showSection("map-container")...');
    showSection('map-container');
    console.log('[TRACE] startMainApp: showSection ЗАВЕРШЕНА.');

    console.log('[TRACE] startMainApp: Вызов adjustMapHeight...');
    adjustMapHeight();
    window.addEventListener('resize', adjustMapHeight);
    console.log('[TRACE] startMainApp: adjustMapHeight ЗАВЕРШЕНА.');

    console.log('[TRACE] startMainApp: Вызов getCurrentPosition/loadWeatherData...');
    if (navigator.geolocation) {
        getCurrentPosition();
    } else {
        console.warn("Геолокация не поддерживается этим браузером.");
        loadWeatherData();
    }
    console.log('[TRACE] startMainApp: getCurrentPosition/loadWeatherData инициирован.');


    console.log('[TRACE] <<< EXIT startMainApp');
}



function initApp() {
    console.log('[TRACE] >>> ENTER initApp');
    checkWelcomeScreen();
    console.log('[TRACE] <<< EXIT initApp');
}


// Проверка, нужно ли показывать приветственный экран
function checkWelcomeScreen() {
    console.log('[TRACE] >>> ENTER checkWelcomeScreen');
    const welcomeScreen = document.getElementById('welcome-screen');
    const welcomeScreenShown = localStorage.getItem('welcomeScreenShown');

    if (welcomeScreenShown === 'true') {
        console.log('[TRACE] checkWelcomeScreen: Флаг true. Скрываем экран (если нужно) и вызываем startMainApp.');
        if (welcomeScreen) {
            welcomeScreen.style.display = 'none';
        }
        startMainApp();
    } else {
        console.log('[TRACE] checkWelcomeScreen: Флаг false/null. Вызываем showWelcomeScreen.');
        if (welcomeScreen) {
            showWelcomeScreen(welcomeScreen);
        } else {
            console.error('[TRACE] checkWelcomeScreen: #welcome-screen не найден! Вызываем startMainApp напрямую.');
            startMainApp();
        }
    }
    console.log('[TRACE] <<< EXIT checkWelcomeScreen');
}


// Функция для отображения приветственного экрана
function showWelcomeScreen(welcomeScreenElement) {
    console.log('[TRACE] >>> ENTER showWelcomeScreen');
    const startBtn = document.getElementById('start-app-btn');
    const welcomeScreenShown = localStorage.getItem('welcomeScreenShown');

    if (!startBtn) {
        console.error('[TRACE] showWelcomeScreen: Кнопка #start-app-btn не найдена! Вызываем startMainApp.');
        welcomeScreenElement.style.display = 'none';
        startMainApp();
        return;
    }


    if (welcomeScreenShown === 'true') {
        startBtn.textContent = 'Продолжить';
    } else {
        startBtn.textContent = 'Начать исследование';
    }

    welcomeScreenElement.style.display = 'flex';

    console.log('[TRACE] showWelcomeScreen: Кнопка найдена, добавляем обработчик click.', startBtn);


    // Функция-обработчик клика
    function handleStartButtonClick() {
        console.log('[DEBUG] Кнопка на приветственном экране НАЖАТА (handleStartButtonClick)');
        welcomeScreen.style.display = 'none';
        localStorage.setItem('welcomeScreenShown', 'true');
        startMainApp();


        startBtn.removeEventListener('click', handleStartButtonClick);
        console.log('[DEBUG] Обработчик handleStartButtonClick удален.');
    }


    startBtn.addEventListener('click', handleStartButtonClick);


    console.log('[TRACE] <<< EXIT showWelcomeScreen (listener attached)'); // ЛОГ
}


function adjustMapHeight() {
    console.log('Вызов adjustMapHeight()');

    if (window.map && window.map.container) {
        try {
            console.log('Адаптация размеров карты к контейнеру...');
            window.map.container.fitToViewport();
            console.log('Размеры карты адаптированы.');
        } catch (error) {
            console.error('Ошибка при адаптации размеров карты:', error);
        }
    } else {
        console.warn('Карта или контейнер карты не найдены для adjustMapHeight');
    }
}

// Проверка поддержки необходимых HTML5 API в браузере
function checkBrowserSupport() {
    let errorMessages = [];

    // Проверка localStorage
    if (typeof localStorage === 'undefined') {
        errorMessages.push('Локальное хранилище (localStorage) не поддерживается. Ваши данные не будут сохраняться.');
    }

    // Проверка геолокации
    if (typeof navigator.geolocation === 'undefined') {
        errorMessages.push('Геолокация не поддерживается. Вы не сможете определить свое местоположение автоматически.');
    }

    // Проверка File API (для фотогалереи)
    if (typeof FileReader === 'undefined') {
        errorMessages.push('File API не поддерживается. Функция загрузки фотографий будет недоступна.');
    }

    // Проверка fetch API (для запросов к сервисам погоды и маршрутов)
    if (typeof fetch === 'undefined') {
        errorMessages.push('Fetch API не поддерживается. Получение данных о погоде и построение маршрутов будет недоступно.');
    }

    // Если есть ошибки, показываем их пользователю
    if (errorMessages.length > 0) {
        showBrowserSupportError(errorMessages);
        return false;
    }

    return true;
}

// Функция для отображения ошибок поддержки браузера
function showBrowserSupportError(errors) {

    const errorContainer = document.createElement('div');
    errorContainer.className = 'browser-support-error';


    const heading = document.createElement('h2');
    heading.textContent = 'Ваш браузер не поддерживает некоторые необходимые функции';
    errorContainer.appendChild(heading);

    const description = document.createElement('p');
    description.textContent = 'Для полноценной работы приложения рекомендуется использовать современный браузер (Chrome, Firefox, Edge или Safari последних версий).';
    errorContainer.appendChild(description);


    const errorList = document.createElement('ul');
    errors.forEach(error => {
        const item = document.createElement('li');
        item.textContent = error;
        errorList.appendChild(item);
    });
    errorContainer.appendChild(errorList);

    const continueBtn = document.createElement('button');
    continueBtn.textContent = 'Продолжить, несмотря на ограничения';
    continueBtn.addEventListener('click', () => {
        // Скрываем окно с ошибками
        document.body.removeChild(errorContainer);

        checkWelcomeScreen();

        // Инициализируем карту
        if (!welcomeScreen || welcomeScreen.classList.contains('hidden')) {
            if (typeof window.ymaps !== 'undefined') {
                window.ymaps.ready(initializeApp);
            } else {
                console.error('API Яндекс.Карт не загружен');
            }
        }
    });
    errorContainer.appendChild(continueBtn);


    document.body.appendChild(errorContainer);

    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }
}

// Функция для инициализации карты
function initMap() {
    console.log('Инициализация карты...');
    if (!ymaps) {
        console.error('API Яндекс.Карт не загружено.');
        return;
    }


    if (window.map && typeof window.map.destroy === 'function') {
        try {
            console.log('Уничтожаем существующую карту');
            // Удаляем все коллекции с карты перед уничтожением
            if (window.markersCollection) window.map.geoObjects.remove(window.markersCollection);
            if (window.placesCollection) window.map.geoObjects.remove(window.placesCollection);
            if (window.eventMarkersCollection) window.map.geoObjects.remove(window.eventMarkersCollection);

            window.map.destroy();
            window.map = null;
            console.log('Старая карта уничтожена');
        } catch (e) {
            console.warn('Ошибка при уничтожении существующей карты:', e);
            window.map = null;
        }
    }


    try {

        window.markersCollection = new ymaps.GeoObjectCollection({}, {
            preset: 'islands#blueDotIcon' // Синие для пользовательских
        });
        window.placesCollection = new ymaps.GeoObjectCollection({}, {
            preset: 'islands#redDotIcon' // Красные для найденных мест 
        });
        window.eventMarkersCollection = new ymaps.GeoObjectCollection({}, {
            preset: 'islands#violetDotIcon' // Фиолетовые для событий
        });
        console.log('Коллекции GeoObject созданы');


        window.map = new ymaps.Map(mapElement, {
            center: currentPosition ? [currentPosition.lat, currentPosition.lng] : DEFAULT_MAP_CENTER,
            zoom: currentPosition ? 15 : DEFAULT_MAP_ZOOM,
            controls: ['zoomControl', 'geolocationControl', 'fullscreenControl']
        });

        console.log('Карта создана');

        // Добавляем ТОЛЬКО коллекцию пользовательских маркеров на карту по умолчанию
        window.map.geoObjects.add(window.markersCollection);
        console.log('Коллекция markersCollection добавлена на карту');


        window.map.events.add('click', handleMapClick);
        console.log('Обработчик клика по карте добавлен');


        loadMarkersFromStorage();

        console.log('Карта успешно инициализирована');


    } catch (error) {
        console.error('Ошибка при инициализации карты:', error);
        showToast('Не удалось инициализировать карту.');
    }
}


window.initMap = initMap;

// Функция для получения текущего местоположения пользователя
function getCurrentPosition() {
    console.log('Получение текущего местоположения...');
    return new Promise((resolve, reject) => {

        if (!navigator.geolocation) {
            console.error('Геолокация не поддерживается в этом браузере');
            showNotification('Геолокация не поддерживается в этом браузере. Выберите местоположение вручную.', 'error');
            // Активируем режим выбора местоположения вручную
            toggleCustomLocationMode(true);
            reject(new Error('Геолокация не поддерживается'));
            return;
        }

        // Функция для обработки успешного получения местоположения
        function handleSuccess(position) {
            console.log('Местоположение получено:', position);

            // Сохраняем текущее местоположение
            currentPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            // Сохраняем местоположение в localStorage
            savePosition(currentPosition);

            // Создаем маркер текущего местоположения
            createCurrentPositionMarker(currentPosition);

            // Центрируем карту на текущем местоположении
            if (window.map) {
                window.map.setCenter([currentPosition.lat, currentPosition.lng], 15);
            }

            // Загружаем данные о погоде
            loadWeatherData();

            showNotification('Местоположение успешно определено', 'success');
            resolve(currentPosition);
        }

        // Функция для обработки ошибки получения местоположения
        function handleError(error) {
            console.error('Ошибка получения местоположения:', error);
            let errorMessage = 'Не удалось определить ваше местоположение';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Доступ к геолокации запрещен. Выберите местоположение вручную.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Информация о местоположении недоступна. Выберите местоположение вручную.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Превышено время ожидания запроса местоположения. Выберите местоположение вручную.';
                    break;
                case error.UNKNOWN_ERROR:
                    errorMessage = 'Произошла неизвестная ошибка. Выберите местоположение вручную.';
                    break;
            }
            showNotification(errorMessage, 'error');

            const savedPosition = getSavedPosition();
            if (savedPosition) {
                console.log('Используем сохраненное местоположение:', savedPosition);
                currentPosition = savedPosition;
                createCurrentPositionMarker(currentPosition);
                if (window.map) {
                    window.map.setCenter([currentPosition.lat, currentPosition.lng], 15);
                }
                loadWeatherData();

                resolve(currentPosition);
            } else {
                toggleCustomLocationMode(true);

                reject(error);
            }
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        };
        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);

    });
}

// Функция для создания маркера текущего местоположения
function createCurrentPositionMarker(position) {
    if (window.currentPositionMarker) {
        window.map.geoObjects.remove(window.currentPositionMarker);
    }

    // Создаем макет иконки с пульсацией
    const MyIconLayout = window.ymaps.templateLayoutFactory.createClass(
        '<div class="current-position-marker"><div class="current-position-pulse"></div></div>'
    );

    window.currentPositionMarker = new window.ymaps.Placemark([position.lat, position.lng], {
        hintContent: 'Ваше местоположение'
    }, {

        iconLayout: MyIconLayout,

        iconShape: {
            type: 'Circle',
            coordinates: [0, 0],
            radius: 10
        }

    });

    window.map.geoObjects.add(window.currentPositionMarker);
}

// Функция для обработки клика по карте
function handleMapClick(e) {
    console.log("<<<<< handleMapClick TRIGGERED! >>>>>");
    console.log("<<<<< Click Event Object received (not logging full object due to linter) >>>>>");
    let coords;
    try {

        console.log(`Обрабатываем клик по карте. Режимы: Marker=${isMarkerMode}, CustomLocation=${isCustomLocationMode}`);

        if (e.get && typeof e.get === 'function' && e.get('coords')) {
            coords = e.get('coords');
            console.log('Координаты получены через e.get(coords):', coords);
        } else if (e.originalEvent && e.originalEvent.coords) {
            coords = e.originalEvent.coords;
            console.log('Координаты получены через e.originalEvent.coords:', coords);
        } else if (e.get && typeof e.get === 'function' && e.get('position')) {
            console.log("Координаты получены через e.get('position'):", coords);
        } else {
            // Пробуем универсальный способ через projection
            coords = window.map.options.get('projection').fromGlobalPixels(
                e.get('globalPixels'), window.map.getZoom()
            );
            console.log('Координаты получены через преобразование globalPixels:', coords);
        }

        if (!coords || coords.length < 2) {
            throw new Error('Не удалось извлечь координаты из события клика.');
        }


        const position = {
            lat: coords[0],
            lng: coords[1]
        };

        if (isMarkerMode) {
            console.log('Клик в режиме добавления маркера. Позиция:', position);
            showMarkerForm(position);

        } else if (isCustomLocationMode) {
            console.log('Клик в режиме выбора местоположения. Позиция:', position);


            currentPosition = position;
            savePosition(position);


            createCurrentPositionMarker(position);


            if (window.map) {
                window.map.setCenter([position.lat, position.lng], 15);
            }

            // Загружаем данные о погоде для нового местоположения
            loadWeatherData();

            showNotification('Местоположение выбрано вручную', 'success');

            console.log('Автоматически выключаем режим выбора местоположения');
            toggleCustomLocationMode(false);

        } else {
            console.log('Клик по карте вне активного режима (добавление/выбор)');

        }

    } catch (error) {
        console.error('Ошибка при обработке клика по карте:', error);
        showNotification('Ошибка при получении координат клика', 'error');

        if (isMarkerMode) toggleMarkerMode(false);
        if (isCustomLocationMode) toggleCustomLocationMode(false);
    }
}

function toggleCustomLocationMode(enable) {
    console.log(`Переключение режима выбора местоположения: ${enable ? 'включен' : 'выключен'}`);

    // Устанавливаем флаг режима выбора местоположения
    isCustomLocationMode = enable;

    // Получаем кнопку выбора местоположения
    const customLocationBtn = document.getElementById('btn-set-custom-location');

    // Получаем элемент карты
    const mapElement = document.getElementById('map');

    if (enable) {

        customLocationBtn.classList.add('active-btn');

        mapElement.style.cursor = 'crosshair';


        const mapContainer = document.querySelector('.map-sidebar');
        if (!document.getElementById('map-tooltip') && mapContainer) {
            const tooltip = document.createElement('div');
            tooltip.id = 'map-tooltip';
            tooltip.innerText = 'Кликните на карте, чтобы выбрать местоположение';
            tooltip.style.position = 'absolute';
            tooltip.style.bottom = '20px';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translateX(-50%)';
            tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            tooltip.style.color = 'white';
            tooltip.style.padding = '10px 15px';
            tooltip.style.borderRadius = '5px';
            tooltip.style.zIndex = '1000';
            mapContainer.appendChild(tooltip);
        }

        showNotification('Режим выбора местоположения ВКЛЮЧЕН. Кликните на карте для выбора местоположения', 'info');


        if (isMarkerMode) {
            toggleMarkerMode(false);
        }
    } else {

        customLocationBtn.classList.remove('active-btn');


        mapElement.style.cursor = '';

        const tooltip = document.getElementById('map-tooltip');
        if (tooltip) {
            tooltip.remove();
        }


        showNotification('Режим выбора местоположения ВЫКЛЮЧЕН', 'info');
    }
}

// Функция для очистки всех маркеров
function clearMarkers() {
    try {


        if (window.markersCollection) {
            window.markersCollection.removeAll();
            console.log("Удалены все маркеры из markersCollection");
        } else {
            console.warn("markersCollection не найдена при очистке маркеров");
        }

        // Очищаем массив маркеров
        window.markers = [];
        console.log("Массив window.markers очищен");

        // Очищаем localStorage
        localStorage.removeItem('markers');
        console.log("Удалены 'markers' из localStorage");

        showNotification('Все маркеры удалены', 'success');
        renderMyPlacesList();
    } catch (error) {
        console.error('Ошибка при очистке маркеров:', error);
        showNotification('Ошибка при удалении маркеров', 'error');
    }
}

// Функция для сохранения маркеров в localStorage
function saveMarkersToStorage() {
    try {

        console.log(`[saveMarkersToStorage] Вызвана. Длина window.markers: ${window.markers ? window.markers.length : 'undefined'}`);


        if (!window.markers || !Array.isArray(window.markers) || window.markers.length === 0) {
            console.log('[saveMarkersToStorage] Массив markers пуст, очищаем localStorage.');
            localStorage.removeItem('markers');
            return;
        }


        const markersData = window.markers.map(markerData => {

            if (typeof markerData.lat === 'undefined' || typeof markerData.lng === 'undefined') {
                console.warn('[saveMarkersToStorage] Пропуск маркера из-за отсутствия координат:', markerData);
                return null;
            }


            return {
                id: markerData.id,
                lat: markerData.lat,
                lng: markerData.lng,
                title: markerData.title,
                description: markerData.description,
                category: markerData.category,
                createdAt: markerData.createdAt,
                photoDataUrl: markerData.photoDataUrl
            };
        }).filter(data => data !== null);

        // Сохраняем в localStorage
        localStorage.setItem('markers', JSON.stringify(markersData));
        console.log('[saveMarkersToStorage] Маркеры успешно сохранены в localStorage.');
    } catch (error) {
        console.error('Ошибка при сохранении маркеров:', error);
        showNotification('Ошибка при сохранении маркеров', 'error');
    }
}

// Функция для загрузки маркеров из localStorage
function loadMarkersFromStorage() {
    console.log('Загрузка маркеров из localStorage...');
    const savedMarkers = localStorage.getItem('markers');
    let markersData = [];
    if (savedMarkers) {
        try {
            markersData = JSON.parse(savedMarkers);
        } catch (error) {
            console.error('Ошибка парсинга маркеров из localStorage:', error);
            localStorage.removeItem('markers');
            showToast('Ошибка загрузки маркеров. Данные были повреждены.');
        }
    }

    window.markers = [];
    if (!window.markersCollection) {
        console.error('Коллекция markersCollection не инициализирована');
        return;
    }
    window.markersCollection.removeAll();


    if (Array.isArray(markersData) && markersData.length > 0) {

        markersData.forEach(markerData => {

            createMarker(
                { lat: markerData.lat, lng: markerData.lng },
                markerData.title,
                markerData.description,
                markerData.category,
                markerData.id,
                false,
                false
            );

            window.markers.push({
                id: markerData.id,
                lat: markerData.lat,
                lng: markerData.lng,
                title: markerData.title,
                description: markerData.description,
                category: markerData.category,
                createdAt: markerData.createdAt,
                photoDataUrl: markerData.photoDataUrl
            });
        });
        console.log(`Загружено ${window.markers.length} маркеров в массив window.markers.`);
        console.log(`Загружено ${window.markersCollection.getLength()} маркеров в коллекцию markersCollection.`);
    } else {
        console.log('Нет сохраненных маркеров для загрузки.');
    }

    renderMyPlacesList();
}

// Поиск ближайших мест с помощью Яндекс.Карт API
function searchNearbyPlaces() {

    if (!currentPosition) {
        showToast('Сначала необходимо определить ваше местоположение');
        return;
    }


    placesLoadingIndicator.classList.add('active');


    hidePlaceDetails();

    clearPlacesResults(false);

    if (noPlacesResults) {
        noPlacesResults.classList.add('hidden');
    }

    const category = placeCategorySelect.value;
    const radius = parseInt(searchRadiusSlider.value);


    fetchNearbyPlacesYandex(currentPosition, category, radius)
        .then(places => {
            // Сохраняем результаты
            nearbyPlaces = places;

            // Отображаем результаты
            displayPlacesResults(places);

            // Скрываем индикатор загрузки
            placesLoadingIndicator.classList.remove('active');

            // Если результатов нет, показываем сообщение
            if (places.length === 0 && noPlacesResults) {
                noPlacesResults.classList.remove('hidden');
            }
        })
        .catch(error => {
            console.error('Ошибка при поиске ближайших мест:', error);
            showToast('Ошибка при поиске ближайших мест');
            // Скрываем индикатор загрузки в случае ошибки
            placesLoadingIndicator.classList.remove('active');
            // Показываем сообщение об отсутствии результатов, т.к. поиск не удался
            if (noPlacesResults) {
                noPlacesResults.classList.remove('hidden');
            }
        });
}

// Преобразование категории в текстовый запрос для Яндекс.Карт
function getCategoryTextYandex(category) {
    switch (category) {
        case 'tourism': return 'туризм';
        case 'tourism=attraction': return 'достопримечательность';
        case 'tourism=museum': return 'музей';
        case 'tourism=gallery': return 'галерея';
        case 'tourism=viewpoint': return 'смотровая площадка';
        case 'historic': return 'историческое место';
        case 'amenity=restaurant': return 'ресторан';
        case 'amenity=cafe': return 'кафе';
        case 'amenity=theatre': return 'театр';
        case 'amenity=cinema': return 'кинотеатр';
        case 'shop': return 'магазин';
        default: return 'интересные места'; // Общий запрос
    }
}

// Вспомогательная функция для проверки соответствия категории
function checkCategoryMatch(placeProperties, requestedCategoryValue) {

    const description = (placeProperties.description || '').toLowerCase();
    const categoryText = getCategoryTextYandex(requestedCategoryValue).toLowerCase(); // Текст для Яндекса
    if (description.includes(categoryText)) {
        return true;
    }

    // Если не нашли в описании, проверяем CompanyMetaData.Categories
    const companyMetaData = placeProperties.CompanyMetaData;
    if (companyMetaData && companyMetaData.Categories) {
        // Ищем совпадение по имени категории
        const lowerCaseCategoryText = categoryText.replace(/ё/g, 'е'); // Нормализуем текст запроса
        const found = companyMetaData.Categories.some(cat => {
            const lowerCaseCatName = (cat.name || '').toLowerCase().replace(/ё/g, 'е');
            return lowerCaseCatName.includes(lowerCaseCategoryText);
        });
        if (found) return true;


        if (requestedCategoryValue.includes('=')) {
            const [osmKey, osmValue] = requestedCategoryValue.split('=');
            const foundByClass = companyMetaData.Categories.some(cat => {
                return cat.class === osmKey || (cat.class === 'amenity' && osmKey === 'tourism') || (cat.class === 'shop' && osmKey === 'amenity'); // Примерная логика маппинга
            });
            if (foundByClass) return true;
        }
    }

    // Если нигде не нашли
    return false;
}

async function fetchNearbyPlacesYandex(position, categoryValue, radius) {
    console.log('Начало поиска Yandex мест через search (boundedBy, фильтр по расстоянию):', { position, categoryValue, radius });
    const categoryText = getCategoryTextYandex(categoryValue); // Текст для запроса Яндексу

    // Рассчитываем Bounding Box
    const boundingBox = calculateBoundingBox(position.lat, position.lng, radius);
    console.log('Расчетный BoundingBox:', boundingBox);

    return new Promise((resolve, reject) => {
        // Проверяем наличие ymaps и search
        if (!window.ymaps || !window.ymaps.search) {
            console.error('API Яндекс.Поиска не доступно');
            return reject(new Error('Сервис поиска недоступен'));
        }

        // Опции для search с boundedBy
        const searchOptions = {
            provider: 'yandex#search',
            results: 100,
            boundedBy: boundingBox,
            strictBounds: true,
            rspn: 0
        };

        console.log(`Выполняем ymaps.search с запросом: "${categoryText}" и опциями boundedBy:`, searchOptions);

        // Используем categoryText для запроса поиска
        window.ymaps.search(categoryText, searchOptions)
            .then(res => {
                console.log('Результаты поиска Yandex получены:', res);


                console.log('Содержимое res.geoObjects:', res.geoObjects);
                if (res.geoObjects) {
                    console.log('res.geoObjects существует');
                    console.log('Тип res.geoObjects:', typeof res.geoObjects);
                    console.log('res.geoObjects.each является функцией?', typeof res.geoObjects.each === 'function');
                    if (typeof res.geoObjects.getLength === 'function') {
                        console.log('res.geoObjects.getLength():', res.geoObjects.getLength());
                    }
                } else {
                    console.log('res.geoObjects НЕ существует');
                }


                const geoObjects = res.geoObjects;
                const places = [];

                if (geoObjects && typeof geoObjects.each === 'function') {
                    let logCount = 0;
                    geoObjects.each(geoObject => {
                        const coords = geoObject.geometry.getCoordinates();
                        const distance = getDistance([position.lat, position.lng], coords);
                        const properties = geoObject.properties.getAll();
                        const name = properties.name || 'Без имени';
                        const description = properties.description || 'Нет описания';


                        if (distance <= radius && logCount < 15) {
                            console.log(`--- Объект ${logCount + 1} В РАДИУСЕ ---`);
                            console.log(`   Имя: ${name}`);
                            console.log(`   Описание: ${description}`);
                            console.log(`   Расстояние: ${distance} м`);
                            console.log(`   Все свойства:`, properties);
                            logCount++;
                        }


                        if (distance <= radius) {
                            const companyMetaData = properties.CompanyMetaData;
                            places.push({
                                id: properties.uri || `${coords[0]}_${coords[1]}`,
                                position: coords,
                                name: name,

                                type: description !== 'Нет описания' ? description : name,

                                address: companyMetaData?.address || description,
                                distance: distance,

                                phone: companyMetaData?.Phones?.[0]?.formatted || '',
                                website: companyMetaData?.url || '',
                                hours: companyMetaData?.Hours?.text || '',
                                raw: properties // Сохраняем все свойства
                            });
                        }
                    });
                } else {
                    console.warn('geoObjects не найдены или не являются коллекцией в ответе поиска Яндекса');
                }

                places.sort((a, b) => a.distance - b.distance);
                console.log(`Отфильтрованные места (${categoryText}) ТОЛЬКО ПО РАССТОЯНИЮ:`, places);
                resolve(places);
            })
            .catch(error => {

                console.error('Ошибка при выполнении ymaps.search (полный объект):', error);
                reject(error);
            });
    });
}

// Обновление круга радиуса поиска
function updateSearchRadiusCircle(position, radius) {
    // Проверяем, что карта инициализирована и доступна
    if (!window.map || typeof window.map.geoObjects !== 'object' || !window.map.geoObjects) {
        console.warn('Карта или geoObjects не инициализированы для updateSearchRadiusCircle');
        return; // Выходим, если карты нет или она некорректна
    }

    // Удаляем предыдущий круг, если он существует
    if (searchRadiusCircle) {
        window.map.geoObjects.remove(searchRadiusCircle); // Используем window.map
    }

    // Создаем новый круг с радиусом поиска
    searchRadiusCircle = new window.ymaps.Circle([position.lat, position.lng], radius, {
        balloonContent: `Радиус поиска: ${radius} м`
    }, {
        fillColor: "#1976d230",
        strokeColor: "#1976d2",
        strokeOpacity: 0.8,
        strokeWidth: 2
    });

    // Добавляем круг на карту
    window.map.geoObjects.add(searchRadiusCircle); // Используем window.map

    // Подгоняем карту под радиус поиска
    window.map.setBounds(searchRadiusCircle.geometry.getBounds(), { // Используем window.map
        checkZoomRange: true,
        duration: 500
    });
}

// Создание маркера для места
function createPlaceMarker(place, index) {
    if (!window.placesCollection) { // Проверяем наличие коллекции
        console.error('Коллекция placesCollection не доступна в createPlaceMarker');
        return null;
    }

    // Создаем маркер
    const marker = new window.ymaps.Placemark(place.position, {
        balloonContentHeader: place.name,
        balloonContentBody:
            `<div class="ymap-balloon">
                <div>${place.type}</div>
                ${place.address ? `<div>${place.address}</div>` : ''}
                <div>Расстояние: ${formatDistance(place.distance)}</div>
                ${place.hours ? `<div>Режим работы: ${place.hours}</div>` : ''}
            </div>`,
        balloonContentFooter:
            `<div class="ymap-balloon-footer">
                <a href="#" onclick="buildRouteToPlace([${place.position[0]}, ${place.position[1]}]); return false;">Построить маршрут</a>
            </div>`,
        hintContent: place.name,
        // Добавляем индекс для связи
        placeIndex: index,
        type: 'place'
    }, {
        preset: getPlacePreset(place.type),
        zIndexHover: 900
    });

    // Добавляем маркер в КОЛЛЕКЦИЮ, а не на карту
    window.placesCollection.add(marker);
    console.log(`Маркер для ${place.name} добавлен в placesCollection`);

    // Обработчик клика по маркеру
    marker.events.add('click', () => {
        console.log(`Клик по маркеру места: ${place.name}`);
        showPlaceDetails(place, index);
        highlightPlaceCard(index);
        highlightMapMarker(index);
    });

    return marker; // Возвращаем маркер (хотя он уже в коллекции)
}

// Получение стиля маркера для интересного места
function getPlacePreset(type) {
    type = type.toLowerCase();

    if (type.includes('ресторан') || type.includes('кафе') || type.includes('бар'))
        return 'islands#redFoodIcon';
    if (type.includes('музей') || type.includes('выставк') || type.includes('галере'))
        return 'islands#orangeLeisureIcon';
    if (type.includes('достопримечательност') || type.includes('памятник') || type.includes('монумент'))
        return 'islands#yellowSightIcon';
    if (type.includes('парк') || type.includes('сад') || type.includes('лес'))
        return 'islands#darkGreenParkIcon';
    if (type.includes('театр') || type.includes('концерт') || type.includes('цирк'))
        return 'islands#pinkTheaterIcon';
    if (type.includes('магазин') || type.includes('торговый') || type.includes('тц'))
        return 'islands#pinkShoppingIcon';
    if (type.includes('спорт') || type.includes('стадион') || type.includes('фитнес'))
        return 'islands#blueAttentionIcon';
    if (type.includes('кинотеатр'))
        return 'islands#violetEntertainmentIcon';

    // Если тип не подходит ни под одну категорию
    return 'islands#blueDotIcon';
}

// Показать детальную информацию о месте
function showPlaceDetails(place, index) {
    console.log(`[showPlaceDetails] Вызвана для индекса: ${index}`);
    selectedPlaceIndex = index;

    // Отображаем панель и заполняем её содержимым
    placeDetailsPanel.classList.remove('collapsed');
    placeDetailsPanel.classList.remove('hidden');

    // --- ДОБАВЛЕНО: Плавная прокрутка страницы вверх ---
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // --- КОНЕЦ ДОБАВЛЕНИЯ ---

    // Создаем HTML-содержимое для отображения деталей места
    const content = `
        <div class="place-detail-card">
            <div class="place-detail-header">
                <span class="place-detail-category">${place.type}</span>
                <h2 class="place-detail-name">${place.name}</h2>
            </div>
            <div class="place-detail-info">
                ${place.address ? `<p class="place-detail-address">${place.address}</p>` : ''}
                <p class="place-detail-distance">Расстояние: ${formatDistance(place.distance)}</p>
                ${place.phone ? `<p class="place-detail-phone">Телефон: ${place.phone}</p>` : ''}
                ${place.website ? `<p class="place-detail-website"><a href="${place.website}" target="_blank">Перейти на сайт</a></p>` : ''}
                ${place.hours ? `<p class="place-detail-hours">Часы работы: ${place.hours}</p>` : ''}
            </div>
            <div class="place-detail-actions">
                <button class="btn-center-on-place" data-index="${index}">Показать на карте</button>
                <button class="btn-route-to-place" data-index="${index}">Построить маршрут</button>
            </div>
        </div>
    `;

    placeDetailsContent.innerHTML = content;

    // Добавляем обработчики для кнопок
    const btnCenterOnPlace = placeDetailsContent.querySelector('.btn-center-on-place');
    if (btnCenterOnPlace) {
        btnCenterOnPlace.addEventListener('click', () => {
            // Центрируем карту на этом месте
            // map.setCenter(place.position, 16); - Используем window.map
            window.map.setCenter(place.position, 16);
        });
    }

    const btnRouteToPlace = placeDetailsContent.querySelector('.btn-route-to-place');
    if (btnRouteToPlace) {
        btnRouteToPlace.addEventListener('click', () => {
            // Строим маршрут до этого места
            buildRouteToPlace(place.position);
        });
    }

    // Вызываем adjustMapHeight после показа панели, чтобы пересчитать макет
    setTimeout(adjustMapHeight, 100);
}

// Очистка результатов поиска мест
function clearPlacesResults(resetActiveNav = true) {
    console.log('Очистка результатов поиска...');
    // --- ДОБАВЛЕНО: Очистка коллекции маркеров с карты ---
    if (window.placesCollection) {
        try {
            window.placesCollection.removeAll();
            console.log('Коллекция placesCollection очищена от маркеров.');
        } catch (error) {
            console.error('Ошибка при очистке placesCollection:', error);
        }
    } else {
        console.warn('Коллекция placesCollection не найдена для очистки.');
    }
    // --- КОНЕЦ ДОБАВЛЕНИЯ ---   
    if (!window.map) {
        console.warn('Карта не найдена для очистки результатов поиска');
        return;
    }

    // Скрываем кнопку очистки результатов
    if (btnClearSearchResults) {
        btnClearSearchResults.classList.add('hidden');
    }

    try {
        // Удаляем маркеры мест с карты
        placesMarkers.forEach(marker => {
            // Добавим проверку существования карты перед удалением маркеров
            if (window.map && window.map.geoObjects) {
                window.map.geoObjects.remove(marker);
            } else {
                console.warn('Карта или geoObjects не доступны в clearPlacesResults при удалении маркера');
            }
        });

        // Очищаем массив маркеров
        placesMarkers = [];

        // Очищаем массив мест
        nearbyPlaces = [];

        // Очищаем HTML-список результатов
        if (placesList) {
            placesList.innerHTML = ''; // Удаляем все дочерние элементы
        }

        // Удаляем текущий маршрут, если он есть
        if (window.currentRoute) {
            window.map.geoObjects.remove(window.currentRoute);
            window.currentRoute = null;
            console.log('Текущий маршрут удален при очистке результатов поиска');
        }

        // Скрываем сообщение об отсутствии результатов
        if (noPlacesResults) {
            noPlacesResults.classList.add('hidden');
        }

        // Скрываем панель деталей
        hidePlaceDetails();

        // Сбрасываем индексы выбранных элементов
        selectedPlaceIndex = null;
        previouslySelectedPlaceIndex = null; // Сбрасываем и индекс для подсветки
    } catch (error) {
        console.error('Ошибка при очистке результатов поиска:', error);
        showNotification('Ошибка при удалении маркеров', 'error');
    }
}

// Функция для получения данных о погоде
async function loadWeatherData() {
    try {
        const position = currentPosition || getSavedPosition();
        if (!position) {
            console.log('Нет данных о местоположении для загрузки погоды');
            return;
        }

        const cacheKey = `weather_${position.lat}_${position.lng}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
            const { data, timestamp } = JSON.parse(cachedData);
            const now = Date.now();
            if (now - timestamp < 30 * 60 * 1000) { // 30 минут
                updateWeatherDisplay(data);
                return;
            }
        }

        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${position.lat}&lon=${position.lng}&appid=${weatherApiKey}&units=metric&lang=ru`);
        if (!response.ok) {
            throw new Error('Ошибка при получении данных о погоде');
        }

        const data = await response.json();
        const weatherData = {
            temp: Math.round(data.main.temp),
            humidity: data.main.humidity,
            wind: Math.round(data.wind.speed),
            clouds: data.clouds.all
        };

        localStorage.setItem(cacheKey, JSON.stringify({
            data: weatherData,
            timestamp: Date.now()
        }));

        updateWeatherDisplay(weatherData);
    } catch (error) {
        console.error('Ошибка при загрузке погоды:', error);
        showNotification('Не удалось загрузить данные о погоде', 'error');
    }
}

function updateWeatherDisplay(data) {
    document.getElementById('weather-temp').textContent = `${data.temp}°C`;
    document.getElementById('weather-humidity').textContent = `${data.humidity}%`;
    document.getElementById('weather-wind').textContent = `${data.wind} м/с`;
    document.getElementById('weather-clouds').textContent = `${data.clouds}%`;
}

// Функция для сохранения позиции в localStorage
function savePosition(position) {
    try {
        localStorage.setItem('lastPosition', JSON.stringify(position));
        console.log('Позиция сохранена в localStorage:', position);
    } catch (e) {
        console.error('Ошибка при сохранении позиции:', e);
    }
}

// Функция для получения сохраненной позиции из localStorage
function getSavedPosition() {
    try {
        var savedPosition = localStorage.getItem('lastPosition');
        if (savedPosition) {
            return JSON.parse(savedPosition);
        }
    } catch (e) {
        console.error('Ошибка при получении сохраненной позиции:', e);
    }
    return null;
}

// Настройка системы навигации
function setupNavigation() {
    navMap.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(navMap);
        currentMode = 'my-places'; // <-- УСТАНОВКА РЕЖИМА
        showSection('map-container');
        hidePlaceDetails();
        renderMyPlacesList(); // Обновляем список карточек моих мест

        // Показываем панель "Мои места" и скрываем другие панели
        myPlacesContainer.classList.remove('hidden');
        myPlacesContainer.classList.add('active');
        placesControls.classList.add('hidden');
        eventsControls.classList.add('hidden');

        adjustMapHeight();
    });

    navPlaces.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(navPlaces);
        currentMode = 'places'; // <-- УСТАНОВКА РЕЖИМА
        showSection('map-container');
        hidePlaceDetails(); // Скрываем панель деталей

        // Показываем контролы поиска мест и скрываем другие
        placesControls.classList.remove('hidden');
        eventsControls.classList.add('hidden');
        myPlacesContainer.classList.add('hidden'); // Скрываем панель "Мои места"

        adjustMapHeight();
        // Используем Optional Chaining и Nullish Coalescing для безопасности
        btnClearSearchResults.classList.toggle('hidden', !window.placesCollection || (window.placesCollection?.getLength() ?? 0) === 0);

        // --- ИЗМЕНЕНИЕ: Используем существующее местоположение, если оно есть --- 
        if (currentPosition) {
            console.log('[navPlaces] Используем существующее currentPosition для поиска мест.');
            searchNearbyPlaces(); // Используем текущее положение
        } else {
            // Пытаемся получить местоположение, если оно не задано
            console.log('[navPlaces] currentPosition не задано, пытаемся получить через getCurrentPosition.');
            getCurrentPosition().then(() => {
                searchNearbyPlaces();
            }).catch(error => {
                console.error("Не удалось получить позицию для поиска мест:", error);
            });
        }
        // --- КОНЕЦ ИЗМЕНЕНИЯ ---
    });

    navEvents.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(navEvents);
        currentMode = 'events'; // <-- УСТАНОВКА РЕЖИМА
        showSection('map-container');
        hidePlaceDetails();

        // Показываем контролы поиска событий и скрываем другие
        placesControls.classList.add('hidden');
        eventsControls.classList.remove('hidden');
        myPlacesContainer.classList.add('hidden'); // Скрываем панель "Мои места"

        adjustMapHeight();

        // --- ИЗМЕНЕНИЕ: Используем существующее местоположение, если оно есть --- 
        if (currentPosition) {
            console.log('[navEvents] Используем существующее currentPosition для поиска событий.');
            displayNearbyEvents(); // Используем текущее положение
        } else {
            // Пытаемся получить местоположение, если оно не задано
            console.log('[navEvents] currentPosition не задано, пытаемся получить через getCurrentPosition.');
            getCurrentPosition().then(() => {
                displayNearbyEvents();
            }).catch(error => {
                console.error("Не удалось получить позицию для поиска событий:", error);
            });
        }
        // --- КОНЕЦ ИЗМЕНЕНИЯ ---
    });

    navGallery.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(navGallery);
        currentMode = 'gallery'; // <-- УСТАНОВКА РЕЖИМА
        showSection('gallery-container');
        renderGallery(); // Перерисовываем галерею при переключении
        // adjustMapHeight(); // Карта не видна, адаптация не нужна
    });

    navAbout.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(navAbout);
        currentMode = 'about'; // <-- УСТАНОВКА РЕЖИМА
        showSection('about-container');
        // adjustMapHeight(); // Карта не видна, адаптация не нужна
    });
}

// Установка активного пункта навигации
function setActiveNav(navItem) {
    const navItems = document.querySelectorAll('nav a');
    navItems.forEach(item => item.classList.remove('active'));
    navItem.classList.add('active');
}

// Настройка обработчиков событий
function setupEventListeners() {
    console.log('[TRACE] setupEventListeners: Начало настройки...');

    // Кнопки управления картой
    const currentLocationBtn = document.getElementById('btn-current-location');
    if (currentLocationBtn) currentLocationBtn.addEventListener('click', getCurrentPosition);

    const centerMapBtn = document.getElementById('btn-center-map');
    if (centerMapBtn) centerMapBtn.addEventListener('click', centerMapOnCurrentLocation);

    const addMarkerBtn = document.getElementById('btn-add-marker');
    if (addMarkerBtn) addMarkerBtn.addEventListener('click', () => toggleMarkerMode(true));

    const customLocationBtn = document.getElementById('btn-set-custom-location');
    if (customLocationBtn) customLocationBtn.addEventListener('click', () => {
        console.log('<<<<< КЛИК ПО КНОПКЕ ВЫБРАТЬ МЕСТОПОЛОЖЕНИЕ >>>>>'); // <-- ДОБАВЛЕН ЛОГ
        toggleCustomLocationMode(true);
    });

    const clearMarkersBtn = document.getElementById('btn-clear-markers');
    if (clearMarkersBtn) clearMarkersBtn.addEventListener('click', () => {
        showConfirmDialog('Вы уверены, что хотите удалить все ваши маркеры?', (confirmed) => {
            if (confirmed) {
                clearMarkers();
            }
        });
    });

    // Кнопки поиска и управления в панелях
    const searchPlacesBtn = document.getElementById('btn-search-places');
    if (searchPlacesBtn) searchPlacesBtn.addEventListener('click', searchNearbyPlaces);

    const searchEventsBtn = document.getElementById('btn-search-events');
    if (searchEventsBtn) searchEventsBtn.addEventListener('click', displayNearbyEvents);

    if (btnClearSearchResults) btnClearSearchResults.addEventListener('click', clearPlacesResults);

    // Слайдеры радиуса
    if (searchRadiusSlider) searchRadiusSlider.addEventListener('input', updateRadiusValue);
    if (eventRadiusSlider) eventRadiusSlider.addEventListener('input', updateEventRadiusValue);

    // Закрытие панели деталей
    const closeDetailsBtn = document.getElementById('btn-close-details');
    if (closeDetailsBtn) closeDetailsBtn.addEventListener('click', hidePlaceDetails);

    // --- ОБРАБОТЧИКИ ДЛЯ ФОТО --- 
    if (hiddenPhotoInput) {
        hiddenPhotoInput.addEventListener('change', function (event) {
            const file = event.target.files[0];
            // --- ДОБАВЛЕНО: Проверка перед чтением файла --- 
            if (!markerIdToAttachPhoto) {
                console.warn('[Фото change] ID маркера не установлен (null). Прерываем обработку.');
                hiddenPhotoInput.value = ''; // Все равно сбрасываем инпут
                return;
            }
            // --- КОНЕЦ ДОБАВЛЕНИЯ ---

            if (!file) {
                console.log('Файл не выбран или ID маркера потерян');
                markerIdToAttachPhoto = null;
                hiddenPhotoInput.value = '';
                return;
            }
            console.log(`Выбран файл \"${file.name}\" для маркера ID: ${markerIdToAttachPhoto}`);
            if (!file.type.startsWith('image/')) {
                showNotification('Пожалуйста, выберите файл изображения.', 'error');
                markerIdToAttachPhoto = null;
                hiddenPhotoInput.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = function (e) {
                // --- ДОБАВЛЕНО: Проверка ID маркера в начале onload --- 
                if (!markerIdToAttachPhoto) {
                    console.warn('[Фото onload] ID маркера null в момент выполнения onload. Игнорируем.');
                    hiddenPhotoInput.value = ''; // На всякий случай сбросим еще раз
                    return;
                }
                // --- КОНЕЦ ДОБАВЛЕНИЯ ---

                const photoDataUrl = e.target.result;
                console.log(`Фото прочитано (Data URL), маркер ID: ${markerIdToAttachPhoto}`);
                const markerIndex = window.markers.findIndex(m => m.id === markerIdToAttachPhoto);
                if (markerIndex !== -1) {
                    window.markers[markerIndex].photoDataUrl = photoDataUrl;
                    console.log(`Добавлен photoDataUrl для маркера ID: ${markerIdToAttachPhoto}`);
                    saveMarkersToStorage();
                    showNotification('Фото успешно прикреплено к маркеру!', 'success');
                    if (gallerySection && gallerySection.classList.contains('active-section')) {
                        renderGallery();
                    }
                    // Обновляем панель деталей, если она показывает этот маркер
                    if (placeDetailsPanel && placeDetailsPanel.dataset.contentType === 'myPlace') {
                        const displayedMarkerId = placeDetailsContent.querySelector('.my-place-detail .btn-delete')?.dataset.markerId;
                        if (displayedMarkerId === markerIdToAttachPhoto) {
                            console.log(`[Фото onload] Панель соответствует маркеру. Обновляем блок фото.`);

                            // --- НОВЫЙ ПОДХОД: Обновляем только блок фото --- 
                            const photoContainer = placeDetailsContent.querySelector('.place-detail-info'); // Находим родительский контейнер
                            if (photoContainer) {
                                // --- ИСПРАВЛЕНИЕ: Ищем плейсхолдер стандартными методами ---
                                // Ищем существующий блок фото
                                let existingPhotoBlock = photoContainer.querySelector('.my-place-photo-preview');
                                let placeholderTextElement = null;

                                // Если блок фото не найден, ищем плейсхолдер <p><small>...</small></p>
                                if (!existingPhotoBlock) {
                                    const smallElements = photoContainer.querySelectorAll('p > small');
                                    for (const smallEl of smallElements) {
                                        if (smallEl.textContent && smallEl.textContent.includes('Фото не прикреплено')) {
                                            placeholderTextElement = smallEl.parentElement; // Нам нужен родительский <p> для замены
                                            break;
                                        }
                                    }
                                }
                                // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

                                const newPhotoBlock = document.createElement('div');
                                newPhotoBlock.className = 'my-place-photo-preview';
                                const img = document.createElement('img');
                                img.src = photoDataUrl; // Берем свежий photoDataUrl
                                img.alt = 'Фото места';
                                newPhotoBlock.appendChild(img);

                                if (existingPhotoBlock) {
                                    // Если был старый блок (или текст), заменяем его
                                    // Если старый блок был <p><small>...</small></p>, нужно заменить родительский <p>
                                    const parentToReplace = existingPhotoBlock.tagName === 'SMALL' ? existingPhotoBlock.parentElement : existingPhotoBlock;
                                    parentToReplace.replaceWith(newPhotoBlock);
                                    console.log('[Фото onload] Блок фото заменен.');
                                    // --- ИСПРАВЛЕНИЕ: Заменяем плейсхолдер, если он найден ---
                                } else if (placeholderTextElement) {
                                    placeholderTextElement.replaceWith(newPhotoBlock);
                                    console.log('[Фото onload] Плейсхолдер "Фото не прикреплено" заменен блоком фото.');
                                    // --- КОНЕЦ ИСПРАВЛЕНИЯ ---
                                } else {
                                    // Если блока не было (маловероятно), добавляем новый
                                    photoContainer.appendChild(newPhotoBlock);
                                    console.log('[Фото onload] Блок фото добавлен (старый не найден).');
                                }
                            } else {
                                console.error('[Фото onload] Не найден контейнер .place-detail-info для обновления фото.');
                            }
                            // --- КОНЕЦ НОВОГО ПОДХОДА ---

                        } else {
                            console.log(`[Фото onload] Панель НЕ соответствует маркеру. Не обновляем.`); // Add log
                        }
                    }

                } else {
                    console.error(`Не найден маркер с ID ${markerIdToAttachPhoto} для добавления фото.`);
                    showNotification('Ошибка: не удалось найти маркер для прикрепления фото.', 'error');
                }
                // --- СБРОС ПОСЛЕ ОБРАБОТКИ --- 
                markerIdToAttachPhoto = null;
                hiddenPhotoInput.value = '';
                // --- КОНЕЦ СБРОСА ---
            };
            reader.onerror = function () {
                console.error('Ошибка чтения файла');
                showNotification('Не удалось прочитать файл изображения.', 'error');
                markerIdToAttachPhoto = null;
                hiddenPhotoInput.value = '';
            };
            reader.readAsDataURL(file);

            // --- Ошибочный блок удален --- 

        });
    }
    // --- КОНЕЦ ОБРАБОТЧИКОВ ФОТО ---

    console.log('[TRACE] setupEventListeners: Настройка завершена.');

    // --- Обработчик для кнопки "Назад" из раздела "О приложении" (ПРАВИЛЬНОЕ МЕСТО) --- 
    const btnBackFromAbout = document.getElementById('btn-back-from-about');
    if (btnBackFromAbout) {
        btnBackFromAbout.addEventListener('click', () => {
            console.log('Клик по кнопке "Назад к карте" из "О приложении"');
            // Возвращаемся к режиму "Мои места" по умолчанию
            if (navMap) { // Проверяем, что navMap существует
                navMap.click(); // Симулируем клик по вкладке "Мои места"
            } else {
                console.error('Кнопка навигации navMap не найдена для возврата из "О приложении"');
                // Как запасной вариант, можно напрямую вызвать showSection и setActiveNav
                currentMode = 'my-places';
                showSection('map-container');
                // setActiveNav нужно передать элемент, которого нет, пропускаем или ищем иначе
            }
            // Опционально: скрыть панель деталей, если она была открыта
            hidePlaceDetails();
        });
    } else {
        console.warn('Кнопка btn-back-from-about не найдена');
    }
    // --- КОНЕЦ ОБРАБОТЧИКА "НАЗАД" ---

    console.log("Глобальные обработчики событий настроены.");
}

// --- Функция, где используется markerIdToAttachPhoto ---
function showMyPlaceDetails(markerData) {
    // ... (код функции) ...

    // --- Добавляем локальные обработчики для кнопок в панели деталей --- 
    const detailCard = placeDetailsContent.querySelector('.my-place-detail');
    // ... (обработчики deleteBtn, routeBtn) ...

    const photoBtn = detailCard.querySelector('.btn-attach-photo');
    if (photoBtn) {
        photoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // --- ИЗМЕНЕНИЕ: Убираем let/const --- 
            markerIdToAttachPhoto = e.target.dataset.markerId; // Просто присваиваем значение
            // --- КОНЕЦ ИЗМЕНЕНИЯ --- 
            console.log(`[Детали] Нажата кнопка "Фото" для маркера ID: ${markerIdToAttachPhoto}`);
            if (hiddenPhotoInput) {
                hiddenPhotoInput.click(); // Вызываем клик по скрытому инпуту
            } else {
                console.error('Скрытый инпут #hidden-photo-input не найден');
            }
        });
    }
    // ... (остальной код функции) ...
}

// Функция для отображения приветственного экрана
function showWelcomeScreen() {
    console.log('[TRACE] >>> ENTER showWelcomeScreen'); // ЛОГ
    const welcomeScreen = document.getElementById('welcome-screen');
    const startBtn = document.getElementById('start-app-btn');
    // --- ДОБАВЛЕНО: Проверка флага для текста кнопки --- 
    const welcomeScreenShown = localStorage.getItem('welcomeScreenShown');
    // --- КОНЕЦ ДОБАВЛЕНИЯ --- 

    if (welcomeScreen && startBtn) {
        // --- ДОБАВЛЕНО: Установка текста кнопки --- 
        if (welcomeScreenShown === 'true') {
            startBtn.textContent = 'Продолжить';
        } else {
            startBtn.textContent = 'Начать исследование'; // Убедимся, что текст по умолчанию правильный
        }
        // --- КОНЕЦ ДОБАВЛЕНИЯ --- 

        welcomeScreen.style.display = 'flex';

        console.log('[TRACE] showWelcomeScreen: Кнопка найдена, добавляем обработчик click.', startBtn); // <--- ЛОГ 2
        // Одноразовый обработчик клика
        startBtn.addEventListener('click', () => {
            console.log('[DEBUG] Кнопка на приветственном экране нажата');
            welcomeScreen.style.display = 'none';
            localStorage.setItem('welcomeScreenShown', 'true');

            // --- ИСПРАВЛЕНИЕ: Оставляем ТОЛЬКО вызов startMainApp --- 
            startMainApp(); // Эта функция сама все инициализирует в нужном порядке
            // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

        }, { once: true }); // Убедимся, что обработчик сработает только раз
    } else {
        console.error('[TRACE] showWelcomeScreen: Элемент welcomeScreen или startBtn НЕ найден!'); // <--- ЛОГ 3 (на случай, если if не сработает)
    }
    console.log('[TRACE] <<< EXIT showWelcomeScreen'); // <--- ЛОГ 4
}

// Обновление отображения радиуса поиска
function updateRadiusValue() {
    if (radiusValueSpan) {
        radiusValueSpan.textContent = `${searchRadiusSlider.value} м`;
    }
}

// Форматирование расстояния для отображения
function formatDistance(distance) {
    if (distance < 1000) {
        return `${distance} м`;
    } else {
        return `${(distance / 1000).toFixed(1)} км`;
    }
}

// Функция для построения маршрута до выбранного места
function buildRouteToPlace(destinationCoords) {
    console.log('Построение маршрута до точки:', destinationCoords);

    // Проверяем, есть ли текущее местоположение
    if (!currentPosition || typeof currentPosition.lat === 'undefined' || typeof currentPosition.lng === 'undefined') {
        console.error('Текущее местоположение не определено или некорректно:', currentPosition);
        showNotification('Сначала необходимо определить ваше местоположение (через геолокацию или вручную)', 'error');
        return;
    }

    console.log('Текущее местоположение для старта маршрута:', currentPosition);

    // Строим маршрут, передавая начальную и конечную точки
    buildRoute(currentPosition, destinationCoords);
}

// Функция для построения маршрута с использованием Яндекс.Карт
function buildRoute(startPoint, endPoint) {
    console.log('Построение маршрута Yandex от', startPoint, 'до', endPoint);

    // Проверяем наличие ymaps и router
    if (!window.ymaps || !window.ymaps.route) {
        console.error('API Яндекс.Маршрутизатора не доступно');
        showNotification('Ошибка: сервис маршрутов недоступен', 'error');
        return;
    }

    // Удаляем предыдущий маршрут, если он был
    if (window.currentRoute) {
        window.map.geoObjects.remove(window.currentRoute);
        window.currentRoute = null;
        console.log('Предыдущий маршрут удален');
    }

    // Точки маршрута (координаты в формате [широта, долгота])
    const points = [
        [startPoint.lat, startPoint.lng],
        [endPoint[0], endPoint[1]] // endPoint приходит как [lat, lng]
    ];

    console.log('Точки для маршрута:', points);

    // Строим маршрут
    window.ymaps.route(points, {
        // Опции маршрутизации
        mapStateAutoApply: true // Автоматически центрировать карту по маршруту
    }).then(function (route) {
        console.log('Маршрут успешно построен:', route);

        // Добавляем маршрут на карту
        window.map.geoObjects.add(route);
        window.currentRoute = route; // Сохраняем ссылку на текущий маршрут

        // Получаем информацию о маршруте (опционально)
        const routes = route.getRoutes();
        if (routes.getLength() > 0) {
            const activeRoute = routes.get(0);
            const distance = activeRoute.properties.get("distance").text;
            const time = activeRoute.properties.get("duration").text;
            console.log(`Информация о маршруте: Расстояние: ${distance}, Время: ${time}`);
            showNotification(`Маршрут: ${distance}, ${time}`, 'success');
        } else {
            console.warn('Маршрут построен, но информация о нем недоступна');
            showNotification('Маршрут построен', 'success');
        }

    }, function (error) {
        console.error('Ошибка при построении маршрута:', error);
        showNotification(`Ошибка построения маршрута: ${error.message || 'Неизвестная ошибка'}`, 'error');
    });
}

// Глобальные функции для доступа из HTML
window.buildRoute = buildRoute;
window.buildRouteToPlace = buildRouteToPlace;

// Вычисление расстояния между двумя точками (формула гаверсинуса)
function getDistance(point1, point2) {
    const R = 6371000;
    const lat1 = point1[0];
    const lon1 = point1[1];
    const lat2 = point2[0];
    const lon2 = point2[1];

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance);
}

// Перевод градусов в радианы
function toRad(degrees) {
    return degrees * Math.PI / 180;
}

// Показ уведомления (toast)
function showToast(message) {
    // Проверяем, существует ли уже элемент toast
    let toast = document.getElementById('toast');

    // Если нет, создаем его
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }

    // Устанавливаем текст уведомления
    toast.textContent = message;

    // Добавляем класс для отображения
    toast.className = 'show';

    // Через 3 секунды скрываем уведомление
    setTimeout(() => {
        toast.className = toast.className.replace('show', '');
    }, 3000);
}

// Скрытие панели деталей места
function hidePlaceDetails() {
    if (placeDetailsPanel) {
        placeDetailsPanel.classList.add('collapsed');

        highlightMyPlaceCard(null);

        setTimeout(adjustMapHeight, 100); // Небольшая задержка
    }
}

// Создаем стили для маркера текущего местоположения
var style = document.createElement('style');
style.innerHTML = `
    .current-position-marker {
        background: transparent;
    }
    
    .current-position-pulse {
        width: 20px;
        height: 20px;
        background-color: #1976d2;
        border-radius: 50%;
        position: relative;
    }
    
    .current-position-pulse:after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(25, 118, 210, 0.4);
        border-radius: 50%;
        animation: pulse 2s infinite;
        transform-origin: center center;
    }
    
    @keyframes pulse {
        0% {
            transform: scale(1);
            opacity: 1;
        }
        100% {
            transform: scale(3);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Функция для отображения формы добавления маркера
function showMarkerForm(position) {
    console.log('Показываем форму добавления маркера, позиция:', position);

    // Добавляем временный маркер на карту, чтобы пользователь видел выбранное место
    if (window.tempMarker) {
        window.map.geoObjects.remove(window.tempMarker);
    }

    window.tempMarker = new window.ymaps.Placemark(
        [position.lat, position.lng],
        {
            hintContent: 'Выбранное место'
        },
        {
            preset: 'islands#redDotIcon'
        }
    );

    window.map.geoObjects.add(window.tempMarker);
    console.log('Временный маркер добавлен на карту');

    var modal = document.getElementById('modal');
    var form = document.getElementById('marker-form');

    // Сохраняем позицию для использования при сохранении
    window.newMarkerPosition = position;

    // Очищаем форму
    form.reset();

    // Показываем модальное окно
    modal.style.display = 'block';

    // Обработчик отправки формы
    form.onsubmit = function (e) {
        e.preventDefault();

        const title = document.getElementById('marker-name').value;
        const description = document.getElementById('marker-description').value;
        const category = document.getElementById('marker-category').value;

        console.log('Форма отправлена:', { title, description, category });
        saveMarker(title, description, category);

        // Закрываем модальное окно
        modal.style.display = 'none';

        // Удаляем временный маркер
        if (window.tempMarker) {
            window.map.geoObjects.remove(window.tempMarker);
            window.tempMarker = null;
        }

        // Выключаем режим добавления маркера после успешного сохранения
        console.log('Выключаем режим добавления маркера после сохранения');
        toggleMarkerMode(false); // <-- ДОБАВЛЯЕМ ВЫЗОВ ЗДЕСЬ
    };

    // Обработчик закрытия модального окна (кнопка "крестик")
    var closeModalBtn = modal.querySelector('.close');
    closeModalBtn.onclick = function () {
        modal.style.display = 'none';

        // Удаляем временный маркер при закрытии формы
        if (window.tempMarker) {
            window.map.geoObjects.remove(window.tempMarker);
            window.tempMarker = null;
        }

        // Выключаем режим добавления маркера при отмене
        console.log('Выключаем режим добавления маркера после закрытия формы (крестик)');
        toggleMarkerMode(false); // <-- ДОБАВЛЯЕМ ВЫЗОВ ЗДЕСЬ
    };

    // Обработчик закрытия модального окна (клик вне окна)
    window.removeEventListener('click', closeModalHandler);
    window.addEventListener('click', closeModalHandler);
}

// Выносим обработчик клика вне окна в отдельную функцию
function closeModalHandler(e) {
    const modal = document.getElementById('modal');
    if (e.target === modal) {
        modal.style.display = 'none';
        if (window.tempMarker) {
            window.map.geoObjects.remove(window.tempMarker);
            window.tempMarker = null;
        }
        // Выключаем режим добавления маркера при отмене
        console.log('Выключаем режим добавления маркера после клика вне окна');
        toggleMarkerMode(false);
        window.removeEventListener('click', closeModalHandler);
    }
}

// Функция для сохранения маркера
function saveMarker(title, description, category) {
    if (!window.newMarkerPosition) {
        showNotification('Ошибка: позиция маркера не определена', 'error');
        return;
    }

    try {
        // *** ИСПРАВЛЕНИЕ: Добавить createdAt перед созданием ***
        const now = new Date().toISOString(); // Получаем текущую дату/время

        const markerData = {
            lat: window.newMarkerPosition.lat,
            lng: window.newMarkerPosition.lng,
            title,
            description,
            category,
            createdAt: now, // Добавляем дату создания
            id: Date.now().toString(), // Генерируем ID здесь
            photoDataUrl: null // Инициализируем фото как null
        };


        // Создаем маркер с помощью нашей функции createMarker
        // Передаем false для addToGlobalArray и saveToStorage, т.к. делаем это вручную ниже
        const placemark = createMarker(
            window.newMarkerPosition,
            title,
            description,
            category,
            markerData.id, // Передаем ID
            false, // не добавлять в window.markers внутри createMarker
            false // Не сохраняем повторно в storage
        );

        if (!placemark) {
            throw new Error('Не удалось создать маркер');
        }

        // Добавляем полные данные маркера в глобальный массив
        window.markers.push(markerData);
        console.log('[saveMarker] Добавлены полные данные нового маркера в window.markers:', markerData);


        // Сохраняем маркеры в localStorage
        saveMarkersToStorage();

        // Очищаем позицию нового маркера
        window.newMarkerPosition = null;

        showNotification('Маркер успешно добавлен', 'success');

        renderMyPlacesList(); // <--- Обновляем список после сохранения
    } catch (error) {
        console.error('Ошибка при сохранении маркера:', error);
        showNotification('Ошибка при сохранении маркера', 'error');
    }
}

// Функция для удаления маркера
function deleteMarker(markerId) {
    console.log('Удаление маркера с ID:', markerId, '(тип:', typeof markerId + ')'); // Логируем тип

    // --- ЛОГ ДЛЯ ОТЛАДКИ --- 
    try {
        console.log('Текущее содержимое window.markers:', JSON.parse(JSON.stringify(window.markers || [])));
    } catch (e) {
        console.warn('Не удалось вывести window.markers через JSON.stringify:', e);
        console.log('Длина window.markers:', window.markers ? window.markers.length : 'undefined');
        console.log('window.markers (как есть):', window.markers);
    }
    // --- КОНЕЦ ЛОГА --- 

    const markerIndex = window.markers.findIndex(m => {
        // Логируем сравнение для каждого элемента
        // console.log(`Сравнение: m.id=${m.id} (тип: ${typeof m.id}) === markerId=${markerId} (тип: ${typeof markerId}) Результат: ${m.id === markerId}`);
        // return m.id === markerId; // Старое сравнение
        return m.id === String(markerId); // Новое сравнение (приводим markerId к строке)
    });

    if (markerIndex !== -1) {
        const markerObj = window.markers[markerIndex];
        try {
            // Удаляем Placemark с карты
            window.map.geoObjects.remove(markerObj.marker);
            // Удаляем объект маркера из массива
            window.markers.splice(markerIndex, 1);
            // Сохраняем обновленный список маркеров
            saveMarkersToStorage();

            // Удаляем текущий маршрут, если он есть
            if (window.currentRoute) {
                window.map.geoObjects.remove(window.currentRoute);
                window.currentRoute = null;
                console.log('Текущий маршрут удален при удалении маркера');
            }

            showNotification('Маркер успешно удален', 'success');
            renderMyPlacesList(); // <--- Обновляем список после удаления
        } catch (e) {
            console.error('Ошибка при удалении маркера с карты:', e);
            showNotification('Ошибка при удалении маркера', 'error');
        }
    } else {
        console.error('Маркер с ID не найден:', markerId);
        showNotification('Ошибка: маркер для удаления не найден', 'error');
    }
}

// Функция для показа уведомлений
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Добавляем функцию showNotification в глобальный объект window
window.showNotification = showNotification;

// Сохраняем маркеры при добавлении нового или изменении существующего
function createMarker(position, title = '', description = '', category = 'other', id = null, addToGlobalArray = true, saveToStorage = true) {
    console.log('Создание маркера:', { position, title, category, id, addToGlobalArray, saveToStorage });
    if (!window.map || !window.markersCollection) {
        console.error('Карта или коллекция markersCollection не инициализированы для createMarker');
        return null;
    }
    if (!position || typeof position.lat === 'undefined' || typeof position.lng === 'undefined') {
        console.error('Некорректные координаты для маркера:', position);
        return null;
    }

    const markerId = id || Date.now().toString(); // Генерируем ID, если не предоставлен

    try {
        const placemark = new ymaps.Placemark(
            [position.lat, position.lng],
            {
                hintContent: title || 'Мое место',
                // *** ДОБАВЛЕНО: Устанавливаем заголовок балуна *** 
                balloonContentHeader: title || 'Мое место', // Для показа простого балуна с заголовком
                // Оставляем balloonContentData, оно содержит нужные нам данные для панели деталей
                balloonContentData: {
                    title: title || 'Мое место',
                    description: description || '',
                    category: category || 'other',
                    markerId: markerId,
                    lat: position.lat,
                    lng: position.lng,
                    createdAt: window.markers.find(m => m.id === markerId)?.createdAt || new Date().toISOString() // Находим createdAt или берем текущее
                },
                markerId: markerId, // Дублируем для простоты доступа, если нужно
                type: 'userMarker'
            },
            {
                preset: 'islands#blueIcon',
            }
        );

        // Оставляем обработчик для открытия ПАНЕЛИ ДЕТАЛЕЙ по клику на маркер
        placemark.events.add('click', function (e) {
            const clickedPlacemark = e.get('target');
            const props = clickedPlacemark.properties.get('balloonContentData');

            console.log(`Клик по маркеру ID: ${props.markerId}, показ панели деталей (балун откроется автоматически)`);

            if (props) {
                const fullMarkerData = window.markers.find(m => m.id === props.markerId);
                if (fullMarkerData) {
                    showMyPlaceDetails(fullMarkerData); // <--- Вызываем показ деталей
                } else {
                    console.error('Не найдены полные данные для маркера ID:', props.markerId);
                }
            } else {
                console.warn('Не удалось получить balloonContentData при клике на маркер.');
            }
        });

        window.markersCollection.add(placemark);
        console.log(`Маркер ${markerId} добавлен в markersCollection`);

        // Добавляем данные маркера в глобальный массив ТОЛЬКО если addToGlobalArray = true
        const markerData = { id: markerId, lat: position.lat, lng: position.lng, title, description, category };
        if (addToGlobalArray) {
            // --- Используем window.markers явно ---
            const existingIndex = window.markers.findIndex(m => m.id === markerId);
            if (existingIndex > -1) {
                window.markers[existingIndex] = markerData; // Обновляем существующий
                console.log(`[createMarker] Обновлены данные для ID ${markerId} в window.markers`);
            } else {
                window.markers.push(markerData); // Добавляем новый
                console.log(`[createMarker] Добавлены данные для ID ${markerId} в window.markers`);
            }
            // --- Конец использования window.markers --- 

            // --- ЛОГ ДЛЯ ОТЛАДКИ (перемещен внутрь функции) ---
            try {
                console.log(`[createMarker] Состояние window.markers после добавления/обновления ID ${markerId}:`, JSON.parse(JSON.stringify(window.markers)));
            } catch (e) {
                console.warn('[createMarker] Не удалось вывести window.markers через JSON.stringify');
                console.log(`[createMarker] Длина window.markers: ${window.markers.length}`);
            }
            // --- КОНЕЦ ЛОГА ---
        }



        return placemark; // Возвращаем созданный маркер

    } catch (error) {
        console.error('Ошибка при создании маркера:', error);
        showToast('Не удалось создать маркер.');
        return null;
    }
}

// Функция для центрирования карты на текущем местоположении
function centerMapOnCurrentLocation() {
    console.log('Центрирование карты на текущем местоположении');

    if (!currentPosition) {
        console.log('Текущее местоположение не определено');
        showNotification('Сначала необходимо определить ваше местоположение', 'error');
        return;
    }

    if (!window.map) {
        console.error('Карта не инициализирована');
        showNotification('Ошибка: карта не инициализирована', 'error');
        return;
    }

    // Центрируем карту на текущем местоположении
    window.map.setCenter([currentPosition.lat, currentPosition.lng], 15);
    showNotification('Карта центрирована на вашем местоположении', 'success');
}

// Функция для включения/выключения режима добавления маркера
function toggleMarkerMode(enable) {
    console.log(`Переключение режима добавления маркера: ${enable ? 'включен' : 'выключен'}`);

    // Устанавливаем флаг режима добавления маркера
    isMarkerMode = enable; // <-- Исправлено: используем isMarkerMode

    // Получаем кнопку добавления маркера
    const addMarkerBtn = document.getElementById('btn-add-marker');

    // Получаем элемент карты
    const mapElement = document.getElementById('map');

    if (enable) {
        // Убедимся, что массив маркеров инициализирован
        if (!window.markers) {
            window.markers = [];
        }

        // Добавляем класс active-btn для выделения кнопки
        addMarkerBtn.classList.add('active-btn');

        // Меняем стиль курсора на кросхейр (перекрестие)
        mapElement.style.cursor = 'crosshair';

        // Добавляем визуальную подсказку на карту
        const mapContainer = document.querySelector('.map-sidebar');
        if (!document.getElementById('map-tooltip') && mapContainer) {
            const tooltip = document.createElement('div');
            tooltip.id = 'map-tooltip';
            tooltip.innerText = 'Кликните на карте, чтобы добавить маркер';
            tooltip.style.position = 'absolute';
            tooltip.style.bottom = '20px';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translateX(-50%)';
            tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            tooltip.style.color = 'white';
            tooltip.style.padding = '10px 15px';
            tooltip.style.borderRadius = '5px';
            tooltip.style.zIndex = '1000';
            mapContainer.appendChild(tooltip);
        }

        // Показываем уведомление
        showNotification('Режим добавления маркера ВКЛЮЧЕН. Кликните на карте для добавления маркера', 'info');

        // Отключаем режим выбора местоположения, если он был включен
        if (isCustomLocationMode) { // <-- Исправлено: используем isCustomLocationMode
            toggleCustomLocationMode(false);
        }
    } else {
        // Убираем класс active-btn
        addMarkerBtn.classList.remove('active-btn');

        // Возвращаем стандартный стиль курсора
        mapElement.style.cursor = '';

        // Удаляем подсказку, если она есть
        const tooltip = document.getElementById('map-tooltip');
        if (tooltip) {
            tooltip.remove();
        }

        // Показываем уведомление
        showNotification('Режим добавления маркера ВЫКЛЮЧЕН', 'info');
    }
}

// Функция для форматирования даты и времени
function formatDateTime(date) {
    if (!(date instanceof Date)) {
        date = new Date(date); // Пытаемся преобразовать, если это не объект Date
    }
    if (isNaN(date)) {
        return 'Некорректная дата'; // Возвращаем строку, если дата невалидна
    }
    return date.toLocaleString('ru-RU', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// Функция для настройки содержимого балуна маркера
function setupBalloonContent(e) {
    const placemark = e.get('target'); // Получаем объект Placemark
    const properties = placemark.properties.getAll();
    const markerId = properties.markerId;
    const createdAt = new Date(properties.createdAt); // Преобразуем ISO строку в дату
    const coords = placemark.geometry.getCoordinates();

    console.log('Открыт балун для маркера ID:', markerId, 'Свойства:', properties);

    const formattedDate = formatDateTime(createdAt);

    // Генерируем HTML для балуна
    const balloonHtml = `
        <div class="marker-info-balloon">
            <h3>${properties.title || 'Маркер'}</h3>
            ${properties.description ? `<p>${properties.description}</p>` : ''}
            <p><strong>Категория:</strong> ${properties.category || 'Другое'}</p>
            <p><small>Создан: ${formattedDate}</small></p>
            <div class="balloon-actions">
                <button class="balloon-btn btn-delete" data-marker-id="${markerId}">Удалить</button>
                <button class="balloon-btn btn-route" data-lat="${coords[0]}" data-lng="${coords[1]}">Маршрут</button>
                <button class="balloon-btn btn-attach-photo" data-marker-id="${markerId}">Фото</button> <!-- Добавлено -->
            </div>
                                </div>
                            `;

    // Устанавливаем сгенерированный HTML как содержимое балуна
    placemark.properties.set('balloonContent', balloonHtml);
    console.log('Содержимое балуна установлено');
}

// Глобальный обработчик для кнопок внутри балунов
document.body.addEventListener('click', function (event) {
    // Проверяем, кликнули ли по кнопке удаления
    if (event.target.classList.contains('btn-delete')) {
        const markerId = parseInt(event.target.dataset.markerId);
        console.log('Нажата кнопка "Удалить" для маркера ID:', markerId);
        if (!isNaN(markerId)) {
            // Закрываем балун перед удалением
            if (window.map && window.map.balloon.isOpen()) {
                window.map.balloon.close();
            }
            deleteMarker(markerId);
        } else {
            console.error('Не удалось получить ID маркера для удаления');
        }
    }

    // Проверяем, кликнули ли по кнопке маршрута
    if (event.target.classList.contains('btn-route')) {
        const lat = parseFloat(event.target.dataset.lat);
        const lng = parseFloat(event.target.dataset.lng);
        console.log('Нажата кнопка "Маршрут" до:', { lat, lng });
        if (!isNaN(lat) && !isNaN(lng)) {
            // Закрываем балун
            if (window.map && window.map.balloon.isOpen()) {
                window.map.balloon.close();
            }
            buildRouteToPlace([lat, lng]);
        } else {
            console.error('Не удалось получить координаты для построения маршрута');
        }
    }
});

// --- ДОБАВЛЕНО: Обработка прикрепления фото к маркеру ---
markerIdToAttachPhoto = null; // Храним ID маркера, к которому прикрепляем фото
hiddenPhotoInput = document.getElementById('hidden-photo-input');

// Глобальный обработчик для кнопки "Фото"
document.body.addEventListener('click', function (event) {
    if (event.target.classList.contains('btn-attach-photo')) {
        markerIdToAttachPhoto = event.target.dataset.markerId;
        console.log(`Нажата кнопка "Фото" для маркера ID: ${markerIdToAttachPhoto}`);
        if (hiddenPhotoInput) {
            hiddenPhotoInput.click(); // Вызываем клик по скрытому инпуту
        } else {
            console.error('Скрытый инпут #hidden-photo-input не найден');
        }
    }
});

// Функция для показа кастомного окна подтверждения
function showConfirmDialog(message, callback) {
    confirmModal = document.getElementById('confirm-modal');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmBtn = document.getElementById('confirm-delete-btn');
    const cancelBtn = document.getElementById('cancel-delete-btn');
    const closeConfirmBtn = confirmModal.querySelector('.confirm-close');

    confirmCallback = callback; // Сохраняем колбэк

    confirmMessage.textContent = message;
    confirmModal.style.display = 'block';

    // Удаляем старые обработчики, чтобы избежать дублирования
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    closeConfirmBtn.replaceWith(closeConfirmBtn.cloneNode(true));

    // Получаем новые ссылки на кнопки после клонирования
    const newConfirmBtn = document.getElementById('confirm-delete-btn');
    const newCancelBtn = document.getElementById('cancel-delete-btn');
    const newCloseConfirmBtn = confirmModal.querySelector('.confirm-close');

    // Навешиваем новые обработчики
    newConfirmBtn.onclick = () => {
        confirmModal.style.display = 'none';
        if (typeof confirmCallback === 'function') {
            confirmCallback(true); // Вызываем колбэк с true (подтверждено)
        }
        confirmCallback = null; // Очищаем колбэк
    };

    const closeHandler = () => {
        confirmModal.style.display = 'none';
        if (typeof confirmCallback === 'function') {
            confirmCallback(false); // Вызываем колбэк с false (отменено)
        }
        confirmCallback = null; // Очищаем колбэк
    };

    newCancelBtn.onclick = closeHandler;
    newCloseConfirmBtn.onclick = closeHandler;
}

// Функция для рендеринга списка "Мои места"
function renderMyPlacesList() {
    console.log('[renderMyPlacesList] Запущена функция.'); // <-- Новый лог
    const listContainer = document.getElementById('my-places-list');
    if (!listContainer) {
        console.error('Контейнер #my-places-list не найден.');
        return;
    }
    // Используем window.markers напрямую
    console.log('[renderMyPlacesList] Пытаемся получить доступ к window.markers:', window.markers);
    const noMarkersMessage = listContainer.querySelector('.no-markers-message');

    // Очищаем предыдущее содержимое, кроме сообщения по умолчанию
    listContainer.querySelectorAll('.marker-card').forEach(card => card.remove());

    // Проверяем наличие и валидность массива маркеров (используем window.markers напрямую)
    if (!window.markers || !Array.isArray(window.markers) || window.markers.length === 0) {
        console.log('[renderMyPlacesList] Массив window.markers пуст или недействителен.');
        // Показываем сообщение, если маркеров нет
        if (noMarkersMessage) noMarkersMessage.style.display = 'block';
        return;
    }

    // Скрываем сообщение по умолчанию
    if (noMarkersMessage) noMarkersMessage.style.display = 'none';

    console.log(`[renderMyPlacesList] Рендеринг ${window.markers.length} карточек "Мои места"`);

    // Создаем и добавляем карточки для каждого маркера (используем window.markers)
    window.markers.forEach(markerData => {
        // Проверяем наличие необходимых данных в markerData
        if (!markerData || typeof markerData.lat === 'undefined' || typeof markerData.lng === 'undefined') {
            console.warn('Пропуск маркера из-за отсутствия данных:', markerData);
            return; // Пропускаем этот маркер, если данные неполные
        }

        // Используем данные напрямую из markerData
        const coords = [markerData.lat, markerData.lng];
        const markerId = markerData.id;
        const title = markerData.title || 'Маркер без названия';
        const description = markerData.description || '';
        const category = markerData.category || 'Другое';
        const createdAt = markerData.createdAt ? new Date(markerData.createdAt) : null;
        const formattedDate = createdAt ? formatDateTime(createdAt) : 'Дата неизвестна';

        const card = document.createElement('div');
        card.className = 'marker-card';
        card.dataset.markerId = markerId; // Добавляем ID для связи

        card.innerHTML = `
            <h4>${title}</h4>
            ${description ? `<p>${description}</p>` : ''}
            <p><strong>Категория:</strong> ${category}</p>
            <p><small>Создан: ${formattedDate}</small></p>
        `;

        // Оставляем обработчик для открытия ПАНЕЛИ ДЕТАЛЕЙ по клику на карточку
        card.addEventListener('click', (event) => {
            if (event.target.classList.contains('balloon-btn')) return; // На всякий случай, хотя кнопок больше нет

            console.log('Клик по карточке маркера ID:', markerId, 'показ панели деталей');
            if (window.map) {
                window.map.setCenter(coords, 15); // Центрируем карту
            }
            showMyPlaceDetails(markerData); // <--- Вызываем показ деталей
        });

        listContainer.appendChild(card);
    });
    console.log('Рендеринг карточек "Мои места" завершен.');
}

// Функция для отображения результатов поиска мест
function displayPlacesResults(places) {
    console.log(`Отображение результатов поиска мест:`, places);
    placesList.innerHTML = ''; // Очищаем предыдущие результаты
    placesMarkers = []; // <-- ОЧИЩАЕМ МАССИВ ПЕРЕД ЗАПОЛНЕНИЕМ
    placesCollection.removeAll(); // Очищаем предыдущие маркеры с карты
    console.log('Коллекция placesCollection очищена');
    noPlacesResults.classList.toggle('hidden', places.length > 0);
    placesLoadingIndicator.classList.remove('active');
    btnClearSearchResults.classList.toggle('hidden', places.length === 0);

    if (places.length > 0) {
        places.forEach((place, index) => {
            const card = document.createElement('div');
            card.classList.add('place-card');
            // --- ИСПРАВЛЕНО: Используем data-place-index ---
            card.dataset.placeIndex = index; // Используем data-place-index для консистентности

            // --- ИСПРАВЛЕНО: Используем place.position ---
            if (!place.position || place.position.length < 2) {
                console.warn('Пропуск места из-за отсутствия или некорректных координат:', place);
                return; // Пропускаем, если нет координат
            }
            const placeLat = place.position[0];
            const placeLng = place.position[1];
            const distance = getDistance([currentPosition.lat, currentPosition.lng], [placeLat, placeLng]);

            // --- ИСПРАВЛЕНО: Доступ к свойствам через place.raw ---
            const properties = place.raw || {}; // Берем сохраненные сырые свойства
            const companyMetaData = properties.CompanyMetaData;
            const categoryText = companyMetaData?.Categories?.[0]?.name || place.type || 'Нет категории'; // Используем place.type как запасной вариант
            const address = companyMetaData?.address || place.address || 'Адрес не указан'; // Используем place.address как запасной вариант

            card.innerHTML = `
    <div class="place-card-content">
        <div class="place-info">
            <span class="place-category">${categoryText}</span>
            <h3>${place.name || 'Название не указано'}</h3>
            <div class="place-details">
                <p>${address}</p>
                <p class="place-distance">Расстояние: ${formatDistance(distance)}</p>
            </div>
        </div>
        <div class="place-actions">
            <!-- УДАЛЕНО: <button class="btn-show-details">Подробнее</button> -->
            <button class="btn-build-route">Маршрут</button>
        </div>
    </div>
`;

            // --- ИСПРАВЛЕНО: Передаем place напрямую в createPlaceMarker ---
            const placeMarker = createPlaceMarker(place, index);
            if (placeMarker) {
                placesMarkers.push(placeMarker); // <-- ЗАПОЛНЯЕМ МАССИВ
            }
            // Обработчик кнопки маршрута
            card.querySelector('.btn-build-route').addEventListener('click', (e) => {
                e.stopPropagation();
                buildRouteToPlace(place.position);
            });

            // --- ДОБАВЛЕНО: Обработчик клика на всю карточку ---
            card.addEventListener('click', () => {
                console.log(`Клик по карточке места, индекс: ${index}`);
                showPlaceDetails(place, index); // Показываем детали
                highlightMapMarker(index); // Подсвечиваем маркер
                highlightPlaceCard(index); // Подсвечиваем саму карточку

                // --- ДОБАВЛЕНО: Центрирование карты --- 
                if (window.map && place.position) {
                    window.map.setCenter(place.position, 15); // Центрируем карту на маркере места
                }
                // --- КОНЕЦ ДОБАВЛЕНИЯ --- 
            });
            // --- КОНЕЦ ДОБАВЛЕНИЯ --- 

            placesList.appendChild(card);
        });
    }
    console.log('Отображение результатов завершено');
}

// Функция для подсветки активной карточки места
function highlightPlaceCard(index) {
    const listContainer = document.getElementById('places-list');
    if (!listContainer) return;

    // Снимаем подсветку со всех карточек
    listContainer.querySelectorAll('.place-card').forEach(card => card.classList.remove('highlight'));

    // Добавляем подсветку к выбранной карточке
    const selectedCard = listContainer.querySelector(`.place-card[data-place-index="${index}"]`);
    if (selectedCard) {
        selectedCard.classList.add('highlight');
        // --- УДАЛЕНО: Прокрутка списка к карточке ---
        // selectedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Функция для подсветки маркера на карте
let previouslySelectedPlaceIndex = null; // Храним индекс предыдущего маркера

function highlightMapMarker(index) {
    console.log(`[highlightMapMarker] Вызвана для индекса: ${index}, предыдущий: ${previouslySelectedPlaceIndex}`); // ЛОГ 8

    // Проверяем, что массив маркеров мест существует и не пуст
    if (!placesMarkers || placesMarkers.length === 0) {
        console.warn('[highlightMapMarker] Массив placesMarkers пуст или не существует.'); // ЛОГ 9
        return;
    }
    console.log(`[highlightMapMarker] Длина placesMarkers: ${placesMarkers.length}`); // ЛОГ 10

    // Снимаем подсветку с предыдущего маркера, если он был
    if (previouslySelectedPlaceIndex !== null && previouslySelectedPlaceIndex >= 0 && previouslySelectedPlaceIndex < placesMarkers.length) {
        const previousMarker = placesMarkers[previouslySelectedPlaceIndex];
        if (previousMarker) {
            console.log(`[highlightMapMarker] Пытаемся снять подсветку с маркера ${previouslySelectedPlaceIndex}`); // ЛОГ 11
            try {
                // Получаем исходный тип места для восстановления пресета
                if (!nearbyPlaces || previouslySelectedPlaceIndex >= nearbyPlaces.length) {
                    console.warn(`[highlightMapMarker] Не найдены данные о месте (nearbyPlaces) для индекса ${previouslySelectedPlaceIndex}`);
                    return; // Не можем восстановить пресет без данных
                }
                const previousPlace = nearbyPlaces[previouslySelectedPlaceIndex];
                if (previousPlace) {
                    const originalPreset = getPlacePreset(previousPlace.type);
                    previousMarker.options.set('preset', originalPreset);
                    console.log(`[highlightMapMarker] Снята подсветка с маркера ${previouslySelectedPlaceIndex}, восстановлен пресет ${originalPreset}`); // ЛОГ 12
                }
            } catch (e) {
                console.error('[highlightMapMarker] Ошибка при снятии подсветки с маркера:', e);
            }
        } else {
            console.warn(`[highlightMapMarker] Не найден объект предыдущего маркера для индекса ${previouslySelectedPlaceIndex}`);
        }
    } else {
        console.log(`[highlightMapMarker] Нет предыдущего маркера для снятия подсветки (previouslySelectedPlaceIndex: ${previouslySelectedPlaceIndex})`); // ЛОГ 13
    }

    // Устанавливаем подсветку на текущий маркер
    if (index !== null && index >= 0 && index < placesMarkers.length) {
        const currentMarker = placesMarkers[index];
        if (currentMarker) {
            console.log(`[highlightMapMarker] Пытаемся установить подсветку для маркера ${index}`); // ЛОГ 14
            try {
                currentMarker.options.set('preset', 'islands#violetIcon'); // Задаем пресет подсветки
                console.log(`[highlightMapMarker] Установлена подсветка для маркера ${index}`); // ЛОГ 15
                // Обновляем индекс предыдущего выбранного маркера
                previouslySelectedPlaceIndex = index;
            } catch (e) {
                console.error('[highlightMapMarker] Ошибка при установке подсветки маркера:', e);
            }
        } else {
            console.warn(`[highlightMapMarker] Не найден объект текущего маркера для индекса ${index}`);
        }
    } else {
        console.log(`[highlightMapMarker] Индекс текущего маркера некорректен или null (index: ${index}), сбрасываем previouslySelectedPlaceIndex`); // ЛОГ 16
        // Если index === null (например, при закрытии панели), сбрасываем
        previouslySelectedPlaceIndex = null;
    }
}

// Функция для расчета прямоугольной области (bounding box) по центру и радиусу
function calculateBoundingBox(centerLat, centerLng, radiusMeters) {
    const R = 6371000; // Радиус Земли
    const dLat = radiusMeters / R;
    const dLon = radiusMeters / (R * Math.cos(Math.PI * centerLat / 180));

    const lat1 = centerLat - dLat * 180 / Math.PI;
    const lon1 = centerLng - dLon * 180 / Math.PI;
    const lat2 = centerLat + dLat * 180 / Math.PI;
    const lon2 = centerLng + dLon * 180 / Math.PI;

    // Возвращаем в формате [[lat1, lon1], [lat2, lon2]]
    return [[lat1, lon1], [lat2, lon2]];
}

// --- ДОБАВЛЕНО: Заглушка для получения событий (замените на реальный API) ---
async function fetchNearbyEventsAPI(position, radius) {
    console.log(`Запрос событий с бэкенда: радиус ${radius}м от`, position);

    // Формируем URL для запроса к нашему локальному серверу
    const backendUrl = new URL('http://localhost:3001/api/events');
    backendUrl.searchParams.append('lat', position.lat);
    backendUrl.searchParams.append('lon', position.lng); // Бэкенд ожидает 'lon'
    backendUrl.searchParams.append('radius', radius);
    // backendUrl.searchParams.append('days', 7); // Можно добавить, если нужно

    try {
        const response = await fetch(backendUrl.toString());

        if (!response.ok) {
            // Попробуем прочитать тело ошибки, если оно есть
            let errorDetails = 'Не удалось получить детали ошибки';
            try {
                const errorData = await response.json();
                errorDetails = errorData.error || JSON.stringify(errorData);
            } catch (e) {
                // Тело не JSON или пустое
                errorDetails = `Статус: ${response.status} ${response.statusText}`;
            }
            console.error('Ошибка от бэкенда:', errorDetails);
            throw new Error(`Ошибка при запросе к бэкенду: ${errorDetails}`);
        }

        const events = await response.json();
        console.log('Получены события с бэкенда:', events);
        return events;

    } catch (error) {
        console.error('Ошибка при fetch запросе к бэкенду:', error);
        // Передаем ошибку дальше, чтобы она отобразилась в UI
        throw error;
    }
}

// --- ДОБАВЛЕНО: Отображение событий поблизости ---
async function displayNearbyEvents() {
    // Проверка существования коллекции
    if (!window.eventMarkersCollection) {
        console.error('eventMarkersCollection не инициализирована!');
        // ... (обработка ошибки и return) ...
        return;
    }

    // --- ДОБАВЛЕНО: Локальная константа и доп. логи --- 
    const collectionToClear = window.eventMarkersCollection; // Локальная константа
    // --- КОНЕЦ ДОБАВЛЕНИЯ ---

    // Показываем индикатор ПОСЛЕ проверки
    if (eventsLoadingIndicator) {
        eventsLoadingIndicator.classList.add('active');
    }

    eventsList.innerHTML = '';
    noEventsResults.classList.add('hidden');

    // --- ИЗМЕНЕНО: Дополнительные логи и try-catch вокруг removeAll --- 
    console.log('[DEBUG] Попытка очистить коллекцию:', collectionToClear);
    console.log('[DEBUG] Тип collectionToClear:', typeof collectionToClear);
    console.log('[DEBUG] Есть ли метод removeAll у collectionToClear?:', typeof collectionToClear?.removeAll === 'function');

    try {
        if (collectionToClear && typeof collectionToClear.removeAll === 'function') {
            collectionToClear.removeAll(); // Используем локальную константу
            console.log('[DEBUG] collectionToClear.removeAll() вызван успешно.');
        } else {
            console.error('[DEBUG] collectionToClear невалидна или отсутствует метод removeAll непосредственно перед вызовом!');
            // Можно добавить обработку ошибки здесь, если нужно
        }
    } catch (e) {
        console.error('[DEBUG] Ошибка во время вызова collectionToClear.removeAll():', e);
        // Показываем уведомление или обрабатываем ошибку
        showNotification('Ошибка при очистке карты событий.', 'error');
        // Важно скрыть индикатор загрузки в случае ошибки здесь
        if (eventsLoadingIndicator) {
            eventsLoadingIndicator.classList.remove('active');
        }
        return; // Прерываем выполнение, так как карта не очищена
    }
    // --- КОНЕЦ ИЗМЕНЕНИЯ ---

    eventMarkers = []; // Очищаем массив маркеров событий

    try {
        const position = currentPosition || getSavedPosition();
        if (!position) {
            showNotification('Не удалось определить местоположение для поиска событий', 'error');
            throw new Error('Position is not available');
        }

        const radius = eventRadiusSlider.value;

        console.log(`[displayNearbyEvents] Запрос событий API: радиус ${radius} м от`, position);
        const events = await fetchNearbyEventsAPI(position, radius);
        console.log('[displayNearbyEvents] События получены от API:', events);

        if (events.length === 0) {
            noEventsResults.classList.remove('hidden');
        } else {
            renderEventsList(events);
        }

    } catch (error) {
        console.error('Ошибка при получении или отображении событий:', error);
        showNotification('Не удалось загрузить события. Попробуйте позже.', 'error');
        noEventsResults.classList.remove('hidden'); // Показываем сообщение, если ошибка
    } finally {
        // Скрываем индикатор
        if (eventsLoadingIndicator) {
            eventsLoadingIndicator.classList.remove('active');
        }
    }
}

// Новая функция создания маркера события
function createEventPlacemark(event, index, allFilteredEvents) {
    // --- ИСПРАВЛЕНО: Проверка event.lat и event.lng ---
    if (!event.lat || !event.lng) {
        console.warn(`Событие "${event.title}" пропущено (нет координат для маркера).`);
        return null;
    }
    console.log(`Создание маркера для события: ${event.title}`);
    // --- ИСПРАВЛЕНО: Используем event.lat и event.lng ---
    const eventCoords = [event.lat, event.lng];

    const placemark = new ymaps.Placemark(eventCoords, {
        // --- ДОБАВЛЕНО: Заголовок балуна (на всякий случай) ---
        balloonContentHeader: event.title || 'Событие',
        // --- КОНЕЦ ДОБАВЛЕНИЯ ---
        eventData: event,
        eventIndex: index,
        allEventsData: allFilteredEvents
    }, {
        preset: 'islands#violetDotIcon',
    });

    // --- УДАЛЯЕМ обработчик balloonopen ---
    /*
    placemark.events.add('balloonopen', (e) => {
        console.log('<<< balloonopen СРАБОТАЛ! >>>');
        const targetPlacemark = e.get('target');
        // ... (остальной код обработчика)
    });
    */
    // --- КОНЕЦ УДАЛЕНИЯ ---

    // --- ДОБАВЛЯЕМ обработчик click (как у Интересных мест) --- 
    placemark.events.add('click', function (e) {
        const clickedPlacemark = e.get('target');
        // Получаем данные прямо из свойств, как они были добавлены при создании
        const eventData = clickedPlacemark.properties.get('eventData');
        const eventIndex = clickedPlacemark.properties.get('eventIndex');

        console.log(`Клик по маркеру события ID: ${eventData?.id || eventIndex}, показ панели деталей`);

        if (eventData && typeof eventIndex !== 'undefined') {
            showEventDetails(eventData, eventIndex, 'marker'); // Показываем панель
            highlightEventCard(eventIndex, 'marker'); // Подсвечиваем карточку
            // highlightEventMarker(eventIndex); // Подсветка маркера уже делается в showEventDetails
        } else {
            console.warn('Не удалось получить eventData или eventIndex при клике на маркер события.');
        }
    });
    // --- КОНЕЦ ДОБАВЛЕНИЯ ---

    window.eventMarkersCollection.add(placemark);
    eventMarkers.push(placemark);
    console.log(`Маркер для ${event.title} добавлен в eventMarkersCollection`);
    return placemark;
}

// --- ДОБАВЛЕНО: Обновление значения радиуса для событий ---
function updateEventRadiusValue() {
    if (eventRadiusValueSpan) {
        eventRadiusValueSpan.textContent = `${eventRadiusSlider.value} м`;
    }
}

// --- ДОБАВЛЕНО: Глобальные переменные для подсветки событий ---
let previouslySelectedEventIndex = null;
// --- КОНЕЦ ДОБАВЛЕНИЯ ---

// --- Конец секции События и Мероприятия ---
// ... existing code ...
// --- ДОБАВЛЕНО: Функции для подсветки карточки и маркера события ---

function highlightEventCard(index, source) { // <-- Добавляем source
    if (!eventsList) return;
    eventsList.querySelectorAll('.event-card').forEach(card => card.classList.remove('highlight'));
    if (index !== null) {
        const selectedCard = eventsList.querySelector(`.event-card[data-event-index="${index}"]`);
        if (selectedCard) {
            selectedCard.classList.add('highlight');
            // Прокручиваем список ТОЛЬКО если кликнули по карточке
            if (source === 'card') {
                selectedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }
}

function highlightEventMarker(index) {
    console.log(`[highlightEventMarker] Вызвана для индекса: ${index}, предыдущий: ${previouslySelectedEventIndex}`);

    if (!eventMarkers || eventMarkers.length === 0) {
        console.warn('[highlightEventMarker] Массив eventMarkers пуст или не существует.');
        return;
    }

    // Снимаем подсветку с предыдущего маркера
    if (previouslySelectedEventIndex !== null && previouslySelectedEventIndex >= 0 && previouslySelectedEventIndex < eventMarkers.length) {
        const previousMarker = eventMarkers[previouslySelectedEventIndex];
        if (previousMarker) {
            try {
                // --- ОСТАВЛЯЕМ: Сброс на стандартную фиолетовую точку --- 
                previousMarker.options.set('preset', 'islands#violetDotIcon');
                console.log(`[highlightEventMarker] Снята подсветка с маркера ${previouslySelectedEventIndex}`);
                // ... existing code ...
            } catch (e) {
                console.error('[highlightEventMarker] Ошибка при снятии подсветки:', e);
            }
        }
    }

    // Устанавливаем подсветку на текущий маркер
    if (index !== null && index >= 0 && index < eventMarkers.length) {
        const currentMarker = eventMarkers[index];
        if (currentMarker) {
            try {
                // --- ИЗМЕНЕНО: Устанавливаем красный маркер без точки --- 
                currentMarker.options.set('preset', 'islands#redIcon');
                console.log(`[highlightEventMarker] Установлена подсветка (красный маркер) для маркера ${index}`);
                previouslySelectedEventIndex = index; // Обновляем индекс
                // ... existing code ...
            } catch (e) {
                console.error('[highlightEventMarker] Ошибка при установке подсветки:', e);
            }
        }
    } else {
        previouslySelectedEventIndex = null; // Сбрасываем, если index null
    }
}

// --- ДОБАВЛЕНО: Функция для показа деталей события --- 
function showEventDetails(event, index, source) { // <-- Добавляем source
    console.log(`Показ деталей события: ${event.title}, источник: ${source}`);
    if (!placeDetailsPanel || !placeDetailsContent) {
        console.error('Панель деталей или контент не найдены');
        return;
    }

    // Заполняем панель информацией
    placeDetailsContent.innerHTML = `
        <div class="place-detail-card"> 
            <div class="place-detail-header">
                 <span class="place-detail-category">Событие</span>
                 <h2 class="place-detail-name">${event.title}</h2>
             </div>
             <div class="place-detail-info">
                 <p><strong>Дата:</strong> ${event.date}</p> 
                 <p><strong>Место:</strong> ${event.location}</p>
                 ${event.description ? `<div class="description">${event.description}</div>` : ''} 
                 ${event.url ? `<p><a href="${event.url}" target="_blank">Подробнее...</a></p>` : ''}
             </div>
             ${(event.lat && event.lng) ? `
             <div class="place-detail-actions">
                  <button class="btn-route-to-place" data-lat="${event.lat}" data-lng="${event.lng}">Построить маршрут</button>
             </div>
             ` : ''}
         </div>
    `;

    // Добавляем обработчик для кнопки маршрута (если она есть)
    const btnRoute = placeDetailsContent.querySelector('.btn-route-to-place');
    if (btnRoute) {
        btnRoute.addEventListener('click', () => {
            const lat = parseFloat(btnRoute.dataset.lat);
            const lng = parseFloat(btnRoute.dataset.lng);
            if (!isNaN(lat) && !isNaN(lng)) {
                buildRouteToPlace([lat, lng]);
            } else {
                console.error('Некорректные координаты для маршрута события');
            }
        });
    }

    // Показываем панель
    placeDetailsPanel.classList.remove('hidden');
    placeDetailsPanel.classList.remove('collapsed'); // На всякий случай
    placeDetailsPanel.dataset.contentType = 'event'; // Помечаем, что панель показывает событие

    // Подсвечиваем маркер и карточку
    highlightEventMarker(index);
    highlightEventCard(index, source);

    // Адаптируем карту
    setTimeout(adjustMapHeight, 100);
}

// --- Конец добавленных функций ---
// --- Конец добавленных функций ---

// --- ДОБАВЛЕНО: Функция рендеринга галереи ---
function renderGallery() {
    const galleryContainer = document.getElementById('gallery');
    if (!galleryContainer) {
        console.error('Контейнер #gallery не найден.');
        return;
    }

    console.log('Рендеринг фотогалереи...');
    galleryContainer.innerHTML = ''; // Очищаем галерею



    let photosFound = false;
    if (window.markers && window.markers.length > 0) {
        window.markers.forEach(markerData => {
            if (markerData.photoDataUrl) {
                photosFound = true;
                const item = document.createElement('div');
                item.className = 'gallery-item';

                // Добавляем данные маркера для отображения
                const title = markerData.title || 'Без названия';
                const description = markerData.description || '';
                // --- ИСПРАВЛЕНИЕ: Убеждаемся, что createdAt загружено ---
                const createdAt = markerData.createdAt ? new Date(markerData.createdAt) : null;
                const formattedDate = createdAt ? formatDateTime(createdAt) : 'Дата неизвестна';

                // *** ОТЛАДКА: Удаляем логирование ***
                // console.log('[renderGallery] Rendering item:', { title, description, formattedDate, createdAt: markerData.createdAt });


                item.innerHTML = `
                    <img src="${markerData.photoDataUrl}" alt="${title}">
                    <div class="gallery-item-info"> <!-- Добавляем контейнер для текста -->
                        <h4>${title}</h4>
                        ${description ? `<p>${description}</p>` : ''}
                        <p><small>Создан: ${formattedDate}</small></p>
                        <!-- <p><small>Адрес: ...</small></p> -->
                    </div>
                `;

                // Добавляем обработчик клика для открытия фото в модальном окне
                item.addEventListener('click', () => {
                    console.log(`Клик по фото маркера: ${title} (ID: ${markerData.id})`);
                    // *** ИСПРАВЛЕНИЕ: Вызываем openPhotoModal ***
                    openPhotoModal(markerData); // Передаем полные данные маркера
                });

                galleryContainer.appendChild(item);
            }
        });
    }

    if (!photosFound) {
        galleryContainer.innerHTML = '<p class="no-results">Нет прикрепленных фотографий.</p>';
    }
    console.log('Рендеринг фотогалереи завершен.');
}
// --- КОНЕЦ ДОБАВЛЕНИЯ ---

// Функция открытия модального окна
function openPhotoModal(markerData) {
    // *** ИСПРАВЛЕНИЕ: Найти DOM-элементы модального окна ***
    const photoModal = document.getElementById('photo-modal');
    const photoModalImage = document.getElementById('photo-modal-image');
    const photoModalClose = photoModal.querySelector('.photo-modal-close'); // Добавляем кнопку закрытия

    if (!photoModal || !photoModalImage || !photoModalClose || !markerData || !markerData.photoDataUrl) {
        console.error('Не удалось найти элементы модального окна фото или данные маркера.', { photoModal, photoModalImage, photoModalClose, markerData });
        return;
    }


    photoModalImage.src = markerData.photoDataUrl;
    photoModalImage.alt = markerData.title || 'Фото';

    photoModal.style.display = 'flex'; // <-- ИЗМЕНЕНО: Используем flex для активации центрирования

    // *** ИСПРАВЛЕНИЕ: Добавить обработчики закрытия ***
    // console.log('[openPhotoModal] Adding close event listeners'); // ОТЛАДКА Удалено

    // Объявляем функции обработчиков заранее
    let closeHandler;
    let outsideClickHandler;

    // Закрытие по кнопке "крестик"
    closeHandler = () => {
        // console.log('[openPhotoModal] Close button clicked'); // ОТЛАДКА Удалено
        photoModal.style.display = 'none';
        // Удаляем обработчики, чтобы избежать утечек памяти
        photoModalClose.removeEventListener('click', closeHandler);
        window.removeEventListener('click', outsideClickHandler);
        // console.log('[openPhotoModal] Close event listeners removed'); // ОТЛАДКА Удалено
    };

    // Закрытие по клику вне окна
    outsideClickHandler = (event) => {
        if (event.target === photoModal) {
            // console.log('[openPhotoModal] Outside click detected'); // ОТЛАДКА Удалено
            photoModal.style.display = 'none';
            // Удаляем обработчики, чтобы избежать утечек памяти
            photoModalClose.removeEventListener('click', closeHandler);
            window.removeEventListener('click', outsideClickHandler);
            // console.log('[openPhotoModal] Close event listeners removed (outside click)'); // ОТЛАДКА Удалено
        }
    };

    // Добавляем обработчик для кнопки закрытия
    photoModalClose.addEventListener('click', closeHandler);

    // Добавляем обработчик клика по окну (с небольшой задержкой)
    setTimeout(() => {
        window.addEventListener('click', outsideClickHandler);
        // console.log('[openPhotoModal] Outside click listener added'); // ОТЛАДКА Удалено
    }, 0);

}

// --- ДОБАВЛЕНО: Функция для подсветки карточки "Моего места" --- 
function highlightMyPlaceCard(markerId) {
    const listContainer = document.getElementById('my-places-list');
    if (!listContainer) return;

    // Снимаем подсветку со всех карточек
    listContainer.querySelectorAll('.marker-card').forEach(card => card.classList.remove('highlight'));

    if (markerId !== null) {
        // Добавляем подсветку к выбранной карточке
        const selectedCard = listContainer.querySelector(`.marker-card[data-marker-id="${markerId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('highlight');
            // Прокручиваем список, чтобы карточка была видна
            selectedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}
// --- КОНЕЦ ДОБАВЛЕНИЯ --- 

// --- ДОБАВЛЕНО: Функция для показа деталей "Моего места" --- 
function showMyPlaceDetails(markerData) {
    console.log(`Показ деталей "Моего места": ${markerData.title} (ID: ${markerData.id})`);
    if (!placeDetailsPanel || !placeDetailsContent || !markerData) {
        console.error('Панель деталей, контент или данные маркера не найдены');
        return;
    }

    // Форматируем дату
    const createdAt = markerData.createdAt ? new Date(markerData.createdAt) : null;
    const formattedDate = createdAt ? formatDateTime(createdAt) : 'Дата неизвестна';

    // --- ВОЗВРАЩАЕМ генерацию HTML с фото сразу --- 
    placeDetailsContent.innerHTML = `
        <div class="place-detail-card my-place-detail"> 
            <div class="place-detail-header">
                 <span class="place-detail-category">Мое место (${markerData.category || 'Другое'})</span>
                 <h2 class="place-detail-name">${markerData.title || 'Без названия'}</h2>
            </div>
            <div class="place-detail-info">
                 ${markerData.description ? `<p class="description">${markerData.description}</p>` : ''} 
                 <p><small>Создан: ${formattedDate}</small></p>
                 ${markerData.photoDataUrl ?
            `<div class="my-place-photo-preview"><img src="${markerData.photoDataUrl}" alt="Фото места"></div>`
            : '<p><small>Фото не прикреплено.</small></p>'}
            </div>
            <div class="place-detail-actions">
                  <button class="balloon-btn btn-delete" data-marker-id="${markerData.id}">Удалить</button>
                  <button class="balloon-btn btn-route" data-lat="${markerData.lat}" data-lng="${markerData.lng}">Маршрут</button>
                  <button class="balloon-btn btn-attach-photo" data-marker-id="${markerData.id}">Фото</button> 
            </div>
         </div>
    `;
    // --- КОНЕЦ ВОЗВРАЩЕНИЯ --- 

    // --- Добавляем локальные обработчики для кнопок в панели деталей --- 
    const detailCard = placeDetailsContent.querySelector('.my-place-detail');

    const deleteBtn = detailCard.querySelector('.btn-delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Предотвращаем всплытие события
            const id = e.target.dataset.markerId;
            console.log('[Детали] Нажата кнопка "Удалить" для ID:', id);
            hidePlaceDetails(); // Скрываем панель перед удалением
            deleteMarker(id); // Вызываем функцию удаления
        });
    }

    const routeBtn = detailCard.querySelector('.btn-route');
    if (routeBtn) {
        routeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const lat = parseFloat(e.target.dataset.lat);
            const lng = parseFloat(e.target.dataset.lng);
            console.log('[Детали] Нажата кнопка "Маршрут" до:', { lat, lng });
            if (!isNaN(lat) && !isNaN(lng)) {
                buildRouteToPlace([lat, lng]);
            }
        });
    }

    const photoBtn = detailCard.querySelector('.btn-attach-photo');
    if (photoBtn) {
        photoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            markerIdToAttachPhoto = e.target.dataset.markerId;
            console.log(`[Детали] Нажата кнопка "Фото" для маркера ID: ${markerIdToAttachPhoto}`);
            if (hiddenPhotoInput) {
                hiddenPhotoInput.click(); // Вызываем клик по скрытому инпуту
            } else {
                console.error('Скрытый инпут #hidden-photo-input не найден');
            }
        });
    }
    // --- Конец добавления локальных обработчиков --- 

    // Показываем панель
    placeDetailsPanel.classList.remove('hidden');
    placeDetailsPanel.classList.remove('collapsed');
    placeDetailsPanel.dataset.contentType = 'myPlace'; // Помечаем тип контента

    // Подсвечиваем карточку в списке
    highlightMyPlaceCard(markerData.id);

    // Адаптируем карту
    setTimeout(adjustMapHeight, 100);
}

// --- Конец добавления --- 

// Функция для переключения видимых секций
function showSection(sectionToShowId) {
    // --- ВОЗВРАЩЕН УЛУЧШЕННЫЙ ЛОГ --- 
    console.log(`[DEBUG] Вызов showSection - Тип аргумента: ${typeof sectionToShowId}, Значение:`, sectionToShowId);
    // --- КОНЕЦ ВОЗВРАЩЕНИЯ --- 
    const sections = document.querySelectorAll('main > section');
    // Проверяем, что sectionToShowId это строка, а не объект
    if (typeof sectionToShowId !== 'string') {
        console.error('[DEBUG] Ошибка: в showSection передан неверный тип аргумента!', sectionToShowId);
        return; // Прерываем выполнение, чтобы избежать ошибок
    }

    sections.forEach(section => {
        if (section.id === sectionToShowId) {
            section.classList.add('active-section');
            section.classList.remove('hidden');
            console.log(`[DEBUG] Показываем секцию: ${section.id}`);
        } else {
            section.classList.remove('active-section');
            section.classList.add('hidden');
            console.log(`[DEBUG] Скрываем секцию: ${section.id}`);
        }
    });

    // --- ВОССТАНОВЛЕНА ЛОГИКА УПРАВЛЕНИЯ ВИДИМОСТЬЮ КОЛЛЕКЦИЙ ---
    // Проверяем, что карта и коллекции инициализированы
    if (window.map && window.map.geoObjects && window.markersCollection && window.placesCollection && window.eventMarkersCollection) {
        console.log('Обновление видимости коллекций маркеров...');

        // Удаляем *всегда* все три управляемые коллекции перед добавлением нужной
        try {
            window.map.geoObjects.remove(window.markersCollection);
            window.map.geoObjects.remove(window.placesCollection);
            window.map.geoObjects.remove(window.eventMarkersCollection);
            console.log('Все управляемые коллекции (Мои места, Интересные места, События) удалены с карты.');
        } catch (e) {
            console.error('Ошибка при удалении коллекций маркеров с карты:', e);
        }

        // Добавляем нужную коллекцию в зависимости от активной секции и режима
        try {
            if (sectionToShowId === 'map-container') {
                // Если активна секция карты, смотрим на текущий режим (currentMode)
                // Убедимся, что currentMode определена глобально или доступна
                if (typeof currentMode === 'undefined') {
                    console.warn('Переменная currentMode не определена, режим карты не ясен.');
                    // По умолчанию можно показать маркеры пользователя
                    currentMode = 'my-places'; // Устанавливаем значение по умолчанию (было 'map')
                }

                if (currentMode === 'my-places') { // <-- ИСПРАВЛЕНО: Используем 'my-places' (было 'map')
                    console.log('Показываем: Мои места (markersCollection)');
                    window.map.geoObjects.add(window.markersCollection);
                } else if (currentMode === 'places') {
                    console.log('Показываем: Интересные места (placesCollection)');
                    window.map.geoObjects.add(window.placesCollection);
                } else if (currentMode === 'events') {
                    console.log('Показываем: События (eventMarkersCollection)');
                    window.map.geoObjects.add(window.eventMarkersCollection);
                }
            } else if (sectionToShowId === 'gallery-container' || sectionToShowId === 'about-container') { // Добавлено about-container
                // Для галереи и "О приложении" маркеры не нужны
                console.log('Секция Галерея или О приложении: маркеры не показываются.');
            } else {
                // Обработка других секций, если они появятся
                console.warn('Неизвестная секция для показа маркеров:', sectionToShowId);
            }
            console.log('Видимость нужной коллекции маркеров установлена.');
        } catch (e) {
            console.error('Ошибка при добавлении коллекции маркеров на карту:', e);
        }
    } else {
        console.warn('Карта или коллекции маркеров не инициализированы для управления видимостью.');
    }
    // --- КОНЕЦ ВОССТАНОВЛЕННОЙ ЛОГИКИ ---

    // Адаптируем высоту карты, если она видима
    if (sectionToShowId === 'map-container') {
        // Используем setTimeout для надежности, давая DOM время обновиться
        setTimeout(adjustMapHeight, 150);
    }

    // --- УДАЛЕН НЕПРАВИЛЬНЫЙ ВЫЗОВ ---
    /*
    // Обновляем видимость коллекций маркеров на карте, если показываем карту
    if (sectionToShowId === 'map-container') {
        updateMarkerCollectionsVisibility();
    }
    */
    // --- КОНЕЦ УДАЛЕНИЯ ---
}

// --- ДОБАВЛЕНО: Функция рендеринга списка событий --- 
function renderEventsList(events) {
    console.log('[renderEventsList] Рендеринг списка событий...');
    const listContainer = document.getElementById('events-list'); // Используем eventsList
    if (!listContainer) {
        console.error('[renderEventsList] Контейнер #events-list не найден.');
        return;
    }
    const noEventsMessage = document.getElementById('no-events-results'); // Сообщение об отсутствии

    listContainer.innerHTML = ''; // Очищаем список

    if (!events || events.length === 0) {
        console.log('[renderEventsList] Нет событий для отображения.');
        if (noEventsMessage) noEventsMessage.classList.remove('hidden');
        return;
    }

    if (noEventsMessage) noEventsMessage.classList.add('hidden');

    events.forEach((event, index) => {
        // --- ДОБАВЛЕНО: Вывод структуры первого события в консоль --- 
        if (index === 0) {
            console.log('[DEBUG] Структура первого события:', JSON.stringify(event, null, 2));
        }
        // --- КОНЕЦ ДОБАВЛЕНИЯ ---

        const card = document.createElement('div');
        card.className = 'event-card';
        card.dataset.eventIndex = index; // Индекс для связи

        // --- ИСПРАВЛЕНО: Возвращаем прямой доступ к event.lat и event.lng ---
        const eventLat = event.lat;
        const eventLng = event.lng;
        // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

        // Рассчитываем расстояние, если есть координаты
        let distanceText = '';
        // --- ИСПРАВЛЕНО: Проверка event.lat и event.lng ---
        if (currentPosition && eventLat && eventLng) {
            const distance = getDistance([currentPosition.lat, currentPosition.lng], [eventLat, eventLng]);
            distanceText = `<p class="event-distance">Расстояние: ${formatDistance(distance)}</p>`;
        }
        // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

        card.innerHTML = `
            <div class="event-card-content">
                <div class="event-info">
                    ${event.category ? `<span class="event-category">${event.category}</span>` : ''}
                    <h3>${event.title}</h3>
                    <div class="event-details">
                        <p><strong>Дата:</strong> ${event.date}</p>
                        <p><strong>Место:</strong> ${event.location}</p>
                        ${distanceText}
                    </div>
                </div>
            </div>
            ${/* --- ИСПРАВЛЕНО: Проверка event.lat и event.lng для кнопки --- */''}
            ${(eventLat && eventLng) ? ` 
            <div class="event-card-actions">
                 <button class="balloon-btn btn-route" data-lat="${eventLat}" data-lng="${eventLng}">Маршрут</button>
            </div>
            ` : ''}
        `;

        // --- ИСПРАВЛЕНО: Проверка event.lat и event.lng перед вызовом createEventPlacemark ---
        if (eventLat && eventLng) {
            createEventPlacemark(event, index, events);
        } else {
            console.warn(`Событие "${event.title}" пропущено (нет координат для маркера).`);
        }
        // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

        // Обработчик клика по карточке
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('balloon-btn')) return;

            // --- ДОБАВЛЕНО: Прокрутка вверх --- 
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // --- КОНЕЦ ДОБАВЛЕНИЯ ---

            showEventDetails(event, index, 'card');
            // Центрирование карты
            if (window.map && eventLat && eventLng) {
                window.map.setCenter([eventLat, eventLng], 15);
            }
        });

        listContainer.appendChild(card);
    });
    console.log('[renderEventsList] Рендеринг списка событий завершен.');
}
// --- КОНЕЦ ДОБАВЛЕНИЯ ---