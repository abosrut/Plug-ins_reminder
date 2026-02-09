# Plug-ins Reminder

Кроссплатформенное приложение для хранения, просмотра и установки плагинов Adobe After Effects и Premiere Pro. MVP реализован как статический сайт с локальным хранилищем IndexedDB и возможностью деплоя на GitHub Pages.

**Почему web вместо desktop (Flet)**

1. Мгновенный запуск на Windows и macOS без установки и подписывания приложений.
2. Простой деплой на GitHub Pages и доступ из любого места.
3. Локальные данные остаются в IndexedDB и не требуют отдельного бэкенда.
4. Для будущего desktop‑варианта Flet можно использовать тот же JSON формат экспорта.

**Структура проекта**

1. `index.html` — точка входа.
2. `styles.css` — стили, темы и фоновые варианты.
3. `src/app.js` — инициализация приложения.
4. `src/store.js` — API слой CRUD поверх IndexedDB.
5. `src/ui.js` — рендеринг экранов и обработка событий.
6. `src/markdown.js` — модуль рендера Markdown в HTML.
7. `src/data.js` — сиды и дефолтные настройки.
8. `data/example-import.json` — пример данных для импорта.
9. `tests/*.js` — минимальные unit‑тесты.
10. `scripts/*.sh` — локальный запуск и тесты.

**API слой (CRUD)**

`src/store.js` предоставляет единый интерфейс для операций с `apps`, `groups`, `plugins`, `settings`:

- `getAll`, `get`, `add`, `put`, `remove`
- `seedIfEmpty` для первичного заполнения
- `exportAll`, `importAll` для экспорта/импорта JSON

**Markdown renderer**

`src/markdown.js` — компактный парсер, который поддерживает:

- Заголовки `#`..`###`
- Списки `-`
- **Жирный**, *курсив*, `код`, ссылки

**MVP функционал**

1. Навигация между секциями: After Effects, Premiere Pro, Settings.
2. CRUD для приложений, групп и плагинов.
3. Просмотр и редактирование Markdown с превью.
4. Кнопка Install использует URL из записи плагина.
5. Темы, акцентный цвет и фон.

**Запуск локально**

1. `./scripts/serve.sh`
2. Откройте `http://localhost:5173`

Альтернатива без скрипта:

1. `python3 -m http.server 5173`
2. Откройте `http://localhost:5173`

Альтернатива без скрипта:

1. `python3 -m http.server 5173`
2. Откройте `http://localhost:5173`

**Тесты**

1. `./scripts/test.sh`
2. Альтернатива: `npm test`

**Деплой на GitHub Pages**

1. Запушьте репозиторий в GitHub.
2. Откройте Settings → Pages.
3. Выберите ветку `main` и папку `/`.
4. Сайт будет доступен по URL GitHub Pages.

**Импорт примера**

Файл примера находится в `data/example-import.json`. Его можно импортировать через Settings → Data → Import.
