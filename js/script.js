document.addEventListener('DOMContentLoaded', () => {
    const tableContainer = document.getElementById('table-container');
    const loadDataBtn = document.getElementById('load-data-btn');

    // Добавляем переключатель темы
    const themeToggle = document.createElement('button');
    themeToggle.classList.add('theme-toggle');
    themeToggle.innerHTML = '🌙'; // Иконка луны для темной темы
    themeToggle.title = 'Переключить тему';
    document.body.appendChild(themeToggle);

    // Проверяем сохраненную тему в localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeToggle.innerHTML = '☀️'; // Иконка солнца для светлой темы
    }

    // Обработчик переключения темы
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');

        if (document.body.classList.contains('light-mode')) {
            themeToggle.innerHTML = '☀️';
            localStorage.setItem('theme', 'light');
        } else {
            themeToggle.innerHTML = '🌙';
            localStorage.setItem('theme', 'dark');
        }
    });

    // Функция для загрузки данных
    const loadData = () => {
        // Показываем индикатор загрузки
        tableContainer.innerHTML = '<p>Загрузка данных...</p>';

        fetch('./All_data.md')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                // Парсим markdown таблицу
                const tableHtml = parseMarkdownTable(data);
                tableContainer.innerHTML = tableHtml;

                // Удаляем кнопку после успешной загрузки
                if (loadDataBtn) {
                    loadDataBtn.remove();
                }

                // Устанавливаем обработчики событий для фильтров после загрузки таблицы
                setTimeout(setupFilterEventListeners, 100);
            })
            .catch(error => {
                console.error('Ошибка при загрузке или парсинге файла:', error);

                // Показываем сообщение об ошибке
                tableContainer.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <p style="color: #ff6b6b; font-size: 1.1rem; margin-bottom: 15px;">Ошибка при загрузке данных: ${error.message}</p>
                        <button id="retry-load-btn" class="btn-primary">Повторить попытку</button>
                    </div>
                `;

                // Добавляем обработчик для кнопки повторной попытки
                const retryBtn = document.getElementById('retry-load-btn');
                if (retryBtn) {
                    retryBtn.addEventListener('click', loadData);
                }
            });
    };

    // Добавляем обработчик события для кнопки
    if (loadDataBtn) {
        loadDataBtn.addEventListener('click', loadData);
    }
});

// Функция для парсинга markdown таблицы
function parseMarkdownTable(markdown) {
    // Находим начало таблицы (после заголовка ## Таблица сервисов)
    const tableStart = markdown.indexOf('| Название');
    if (tableStart === -1) {
        return '<p>Не найдена таблица в файле</p>';
    }

    // Находим конец таблицы (после последней строки таблицы)
    const tableEnd = markdown.indexOf('\n\n', tableStart); // Ищем двойной перевод строки после таблицы
    const tableContent = tableEnd === -1 ?
        markdown.substring(tableStart) :
        markdown.substring(tableStart, tableEnd);

    // Разбиваем на строки
    const lines = tableContent.split('\n');

    // Находим строку с заголовками
    let headerIndex = -1;
    let separatorIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('|')) {
            if (headerIndex === -1) {
                headerIndex = i;
            } else if (separatorIndex === -1 && lines[i].includes('--')) {
                separatorIndex = i;
            }
        }
    }

    if (headerIndex === -1 || separatorIndex === -1) {
        return '<p>Не удалось найти корректную таблицу</p>';
    }

    // Формируем HTML таблицу
    let html = '<table class="ai-tools-table"><thead><tr>';

    // Добавляем заголовки, исключая столбец "Ссылка"
    const headers = lines[headerIndex].split('|').filter(cell => cell.trim() !== '');
    headers.forEach((header, index) => {
        // Пропускаем столбец "Ссылка" (обычно третий по счету, индекс 2)
        if (header.toLowerCase().trim() !== 'ссылка') {
            html += `<th>${header.trim()}</th>`;
        }
    });

    html += '</tr></thead><tbody>';

    // Добавляем строки данных
    for (let i = separatorIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('|')) {
            const cells = line.split('|').filter(cell => cell.trim() !== '');
            if (cells.length >= headers.length) {
                html += '<tr>';
                cells.forEach((cell, index) => {
                    // Пропускаем столбец "Ссылка" при отображении
                    if (headers[index] && headers[index].toLowerCase().trim() !== 'ссылка') {
                        // Обрабатываем содержимое ячейки
                        let processedCell = cell.trim();

                        // Обрабатываем теги - выделяем их цветом
                        if (index === 4) { // Предполагаем, что теги находятся в 5-м столбце (индекс 4)
                            processedCell = highlightTags(processedCell);
                        }

                        // Проверяем, является ли ячейка ссылкой
                        if (processedCell.match(/^https?:\/\//)) {
                            processedCell = `<a href="${processedCell}" target="_blank">${processedCell}</a>`;
                        }

                        // Для ячейки с названием добавляем ссылку как внешнюю
                        if (index === 0 && cells[1]?.trim().match(/^https?:\/\//)) {
                            processedCell = `<a href="${cells[1].trim()}" target="_blank">${processedCell}</a>`;
                        }

                        html += `<td>${processedCell}</td>`;
                    }
                });
                html += '</tr>';
            }
        }
    }

    html += '</tbody></table>';

    // Добавляем фильтры над таблицей
    html = addFilters() + html;

    // После добавления HTML, устанавливаем обработчики событий для фильтров
    setTimeout(setupFilterEventListeners, 0);

    return html;
}

// Функция для выделения тегов цветом
function highlightTags(tagString) {
    if (!tagString) return '';

    // Разбиваем строку тегов на отдельные теги
    const tags = tagString.split(',').map(tag => tag.trim()).filter(tag => tag);

    // Создаем HTML для каждого тега с соответствующим классом
    return tags.map(tag => {
        // Преобразуем тег в формат, подходящий для CSS класса
        const cssClass = 'tag-' + tag.toLowerCase()
            .replace(/\s+/g, '-')  // Заменяем пробелы на дефисы
            .replace(/[^\w-]/g, ''); // Убираем все символы кроме букв, цифр и дефисов

        return `<span class="tag ${cssClass}">${tag}</span>`;
    }).join('');
}

// Функция для добавления фильтров
function addFilters() {
    return `
        <div class="filters-container">
            <div class="filter-group">
                <label for="filter-category">Категория:</label>
                <input type="text" id="filter-category" class="filter-input" placeholder="Фильтр по категории..." data-column="2">
            </div>
            <div class="filter-group">
                <label for="filter-tags">Теги:</label>
                <input type="text" id="filter-tags" class="filter-input" placeholder="Фильтр по тегам..." data-column="4">
            </div>
            <div class="filter-group">
                <label for="filter-conditions">Условия:</label>
                <input type="text" id="filter-conditions" class="filter-input" placeholder="Фильтр по условиям..." data-column="5">
            </div>
            <div class="filter-group">
                <label for="filter-language">Язык:</label>
                <input type="text" id="filter-language" class="filter-input" placeholder="Фильтр по языку..." data-column="6">
            </div>
        </div>
    `;
}

// Функция для фильтрации таблицы
function filterTable() {
    // Получаем все строки таблицы
    const rows = document.querySelectorAll('.ai-tools-table tbody tr');
    const filters = document.querySelectorAll('.filter-input');

    rows.forEach(row => {
        let showRow = true;

        // Проверяем каждую строку по всем фильтрам
        filters.forEach(filter => {
            const columnIndex = parseInt(filter.dataset.column);
            const filterValue = filter.value.toLowerCase();
            const cellText = row.cells[columnIndex]?.textContent.toLowerCase() || '';

            if (filterValue && !cellText.includes(filterValue)) {
                showRow = false;
            }
        });

        // Показываем или скрываем строку в зависимости от результата фильтрации
        row.style.display = showRow ? '' : 'none';
    });
}

// Функция для настройки обработчиков событий фильтров
function setupFilterEventListeners() {
    // Удаляем предыдущие обработчики, если они были
    const filterInputs = document.querySelectorAll('.filter-input');
    filterInputs.forEach(input => {
        // Удаляем все обработчики событий для избежания дублирования
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
    });

    // Теперь добавляем обработчики к новым элементам
    const newFilterInputs = document.querySelectorAll('.filter-input');
    newFilterInputs.forEach(input => {
        input.addEventListener('input', handleFilterInput);
    });
}

// Обработчик ввода в фильтр
function handleFilterInput(e) {
    filterTable();
}
