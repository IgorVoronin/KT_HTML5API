require('dotenv').config(); // Загружаем переменные окружения из .env файла
const express = require('express');
const axios = require('axios'); // Для HTTP-запросов к API событий
const cors = require('cors'); // Для разрешения запросов с фронтенда
const path = require('path'); // Добавляем модуль path

const app = express();
// Используем порт из переменной окружения (для Onrender) или 3001 по умолчанию
const PORT = process.env.PORT || 3001;

// --- Конфигурация ---
const KUDAGO_API_BASE_URL = 'https://kudago.com/public-api/v1.4';
// ВАЖНО: API ключ KudaGo будет храниться в файле .env (KUDAGO_API_KEY=ваш_ключ)
// const KUDAGO_API_KEY = process.env.KUDAGO_API_KEY; // Будем использовать позже

// --- Middleware (Промежуточное ПО) ---
// Разрешаем CORS для всех источников (для разработки).
// Для продакшена лучше указать конкретный URL вашего фронтенда: app.use(cors({ origin: 'https://your-frontend-app.onrender.com' }));
app.use(cors());
app.use(express.json()); // Для парсинга JSON в теле запроса (хотя для GET /api/events это не нужно)

// --- Раздача статических файлов Frontend --- 
// Указываем Express обслуживать статические файлы (index.html, styles.css, app.js и т.д.)
// из текущей директории (__dirname)
app.use(express.static(path.join(__dirname, '.')));

// --- Маршруты (Эндпоинты) ---

// Простой маршрут для проверки работоспособности
app.get('/', (req, res) => {
    res.send('City Guide Backend is running!');
});

// Маршрут для получения событий
app.get('/api/events', async (req, res) => {
    const { lat, lon, radius } = req.query;

    if (!lat || !lon) {
        console.error('Ошибка: Не переданы lat или lon');
        return res.status(400).json({ error: 'Необходимы параметры широты (lat) и долготы (lon).' });
    }
    const searchRadiusMeters = radius ? parseInt(radius) : 5000;

    // Определяем временной диапазон: от сейчас до +7 дней (KudaGo использует Unix timestamp в секундах)
    const actual_since = Math.floor(Date.now() / 1000);
    const actual_until = actual_since + (7 * 24 * 60 * 60); // +7 дней

    // --- ИЗМЕНЕНИЕ: Параметры для эндпоинта /search/ ---
    const params = {
        q: 'событие', // Обязательный параметр для /search/
        ctype: 'event', // Ищем только события
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        radius: searchRadiusMeters, // Передаем радиус в метрах
        page_size: 50, // Количество событий на странице
        expand: 'place,dates', // Пробуем получить детали места и дат
    };
    // --- КОНЕЦ ИЗМЕНЕНИЯ ---

    try {
        const response = await axios.get(`${KUDAGO_API_BASE_URL}/search/`, { params });

        const events = response.data.results.map(result => {
            let eventDate = 'Дата не указана';
            let eventTime = '';
            if (result.daterange) {
                const startTimestamp = result.daterange.start;
                const minValidTimestamp = 946684800;
                if (startTimestamp && typeof startTimestamp === 'number' && startTimestamp >= minValidTimestamp) {
                    try {
                        const dateObject = new Date(startTimestamp * 1000);
                        if (!isNaN(dateObject)) {
                            eventDate = dateObject.toLocaleDateString('ru-RU');
                            eventTime = result.daterange.start_time || '';
                        } else {
                            console.warn(`Событие ID ${result?.id || '?'}: Невалидный объект Date создан из timestamp ${startTimestamp}`);
                        }
                    } catch (dateError) {
                        console.error(`Событие ID ${result?.id || '?'}: Ошибка при создании Date из timestamp ${startTimestamp}:`, dateError);
                    }
                } else {
                    console.warn(`Событие ID ${result?.id || '?'}: Невалидный или отсутствующий timestamp начала: ${startTimestamp}`);
                }
            }

            return {
                id: result?.id,
                title: result?.title,
                date: eventDate,
                time: eventTime,
                location: result.place?.title || 'Место не указано',
                description: result.description,
                lat: result.place?.coords?.lat,
                lng: result.place?.coords?.lon,
                url: result?.item_url,
                categories: result?.categories || [],
                images: result?.first_image ? [result.first_image] : [],
                address: result.place?.address || ''
            };
        });

        res.json(events);

    } catch (error) {
        if (error.response) {
            console.error('Ошибка от KudaGo API:', error.response.status, error.response.data);
            res.status(error.response.status).json({ error: 'Ошибка при запросе к API событий KudaGo', details: error.response.data });
        } else if (error.request) {
            console.error('Ошибка запроса: Нет ответа от KudaGo API:', error.request);
            res.status(504).json({ error: 'Нет ответа от сервера KudaGo' });
        } else {
            console.error('Общая ошибка при получении событий:', error.message);
            res.status(500).json({ error: 'Внутренняя ошибка сервера при получении событий' });
        }
    }
});

// --- Catch-all Route для Frontend --- 
// Любой GET-запрос, который не совпал с API (/api/events) или статическим файлом,
// должен вернуть index.html. Это важно для SPA.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '.', 'index.html'));
});

// --- Запуск сервера ---
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});