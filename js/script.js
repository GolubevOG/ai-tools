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
            })
            .catch(error => {
                console.error('Ошибка при загрузке или парсинге файла:', error);
                tableContainer.innerHTML = `<p>Ошибка при загрузке данных: ${error.message}</p>`;

                // Попробуем загрузить файл с другого пути (для GitHub Pages)
                setTimeout(() => {
                    fetch('/ai-tools/All_data.md')
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            return response.text();
                        })
                        .then(data => {
                            const tableHtml = parseMarkdownTable(data);
                            tableContainer.innerHTML = tableHtml;

                            // Удаляем кнопку после успешной загрузки
                            if (loadDataBtn) {
                                loadDataBtn.remove();
                            }
                        })
                        .catch(secondError => {
                            console.error('Ошибка при загрузке файла со второго пути:', secondError);
                            tableContainer.innerHTML = `<p>Ошибка при загрузке данных: ${secondError.message}</p>`;
                        });
                }, 1000);
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
                        // Обрабатываем ссылки в ячейках
                        let processedCell = cell.trim();

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

    return html;
}
