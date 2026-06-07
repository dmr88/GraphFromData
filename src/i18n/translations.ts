/**
 * Словарь переводов для трёх языков: русский (ru), казахский (kk), английский (en).
 *
 * Ключи — иерархические через точку: "header.title", "nav.team" и т.п.
 * Если ключ отсутствует для текущего языка, используется русский (как fallback).
 */

export type Lang = 'ru' | 'kk' | 'en';

export const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: 'ru', label: 'Русский',  native: 'Русский' },
  { code: 'kk', label: 'Қазақша',  native: 'Қазақша' },
  { code: 'en', label: 'English',  native: 'English' },
];

type Dict = Record<string, string>;

export const translations: Record<Lang, Dict> = {
  ru: {
    // === Header / шапка ===
    'header.title': 'База данных эколого-медицинского мониторинга',
    'header.region': 'Восточно-Казахстанская область (ВКО)',
    'header.today':  'Сегодня',
    'header.langLabel': 'Язык интерфейса',
    'nav.main':      'Главная',
    'nav.team':      'Команда проекта',

    // === Панель управления ===
    'panel.topic':       'Тема',
    'panel.refresh':     'Обновить',
    'panel.loading':     'Загрузка…',
    'panel.loadingDots': '— загрузка —',

    // === Настройки графика ===
    'chart.title':           'График',
    'chart.type':            'Тип графика',
    'chart.type.bar':        'Столбчатый',
    'chart.type.line':       'Линейный',
    'chart.type.area':       'С заливкой',
    'chart.type.pie':        'Круговой',
    'chart.type.scatter':    'Точечный',
    'chart.xAxis':           'Ось X',
    'chart.yAxis':           'Серии (Y)',
    'chart.category':        'Категория',
    'chart.value':           'Значение',
    'chart.notSelected':     '— не выбрано —',
    'chart.selectAxes':      'Выберите колонки для осей X и Y.',
    'chart.loadDataFirst':   'Загрузите данные, чтобы построить график.',

    // === Таблица ===
    'table.title':          'Данные',
    'table.sheet':          'Лист',
    'table.rows':           'строк',
    'table.cols':           'колонок',
    'table.empty':          'Нет строк',
    'table.noData':         'Нет данных. Выберите тему.',

    // === Карта ===
    'map.title':            'Карта региона',
    'map.soon':             'скоро',
    'map.caption':          'Карта Восточно-Казахстанской области',
    'map.hint':             'интерактивный слой будет добавлен позже',

    // === Команда проекта ===
    'team.grant.label':     'Грантовый проект Министерства науки и высшего образования РК',
    'team.title':           'Команда проекта',
    'team.subtitle':        'Научно-исследовательская группа, реализующая проект',
    'team.photo.placeholder': 'место для фото',
    'team.role.leader':     'Научный руководитель проекта',
    'team.role.lead':       'Ведущий научный сотрудник',
    'team.role.researcher': 'Научный сотрудник проекта',
    'team.role.researcher2': 'Научный сотрудник',

    // === Сообщения / ошибки ===
    'msg.error':            'Ошибка',
    'msg.loadFailed':       'Не удалось загрузить данные',
    'msg.noRecords':        'Для темы «{topic}» нет записей в БД',

    // === Подвал ===
    'footer.copyright':     'База данных эколого-медицинского мониторинга',
  },

  kk: {
    // === Header / тақырып ===
    'header.title': 'Экологиялық-медициналық мониторинг деректер базасы',
    'header.region': 'Шығыс Қазақстан облысы (ШҚО)',
    'header.today':  'Бүгін',
    'header.langLabel': 'Интерфейс тілі',
    'nav.main':      'Басты бет',
    'nav.team':      'Жоба командасы',

    // === Басқару панелі ===
    'panel.topic':       'Тақырып',
    'panel.refresh':     'Жаңарту',
    'panel.loading':     'Жүктелуде…',
    'panel.loadingDots': '— жүктелуде —',

    // === График баптаулары ===
    'chart.title':           'График',
    'chart.type':            'График түрі',
    'chart.type.bar':        'Бағаналы',
    'chart.type.line':       'Сызықтық',
    'chart.type.area':       'Аумақты',
    'chart.type.pie':        'Дөңгелек',
    'chart.type.scatter':    'Нүктелі',
    'chart.xAxis':           'X осі',
    'chart.yAxis':           'Сериялар (Y)',
    'chart.category':        'Санат',
    'chart.value':           'Мән',
    'chart.notSelected':     '— таңдалмаған —',
    'chart.selectAxes':      'X және Y осьтері үшін бағандарды таңдаңыз.',
    'chart.loadDataFirst':   'Графикті құру үшін деректерді жүктеңіз.',

    // === Кесте ===
    'table.title':          'Деректер',
    'table.sheet':          'Парақ',
    'table.rows':           'жол',
    'table.cols':           'баған',
    'table.empty':          'Жолдар жоқ',
    'table.noData':         'Дерек жоқ. Тақырыпты таңдаңыз.',

    // === Карта ===
    'map.title':            'Аймақ картасы',
    'map.soon':             'жақында',
    'map.caption':          'Шығыс Қазақстан облысының картасы',
    'map.hint':             'интерактивті қабат кейін қосылады',

    // === Жоба командасы ===
    'team.grant.label':     'ҚР Ғылым және жоғары білім министрлігінің гранттық жобасы',
    'team.title':           'Жоба командасы',
    'team.subtitle':        'Жобаны іске асырушы ғылыми-зерттеу тобы',
    'team.photo.placeholder': 'фото орны',
    'team.role.leader':     'Жобаның ғылыми жетекшісі',
    'team.role.lead':       'Жетекші ғылыми қызметкер',
    'team.role.researcher': 'Жобаның ғылыми қызметкері',
    'team.role.researcher2': 'Ғылыми қызметкер',

    // === Хабарламалар / қателер ===
    'msg.error':            'Қате',
    'msg.loadFailed':       'Деректерді жүктеу мүмкін болмады',
    'msg.noRecords':        '«{topic}» тақырыбы үшін деректер базасында жазбалар жоқ',

    // === Төменгі колонтитул ===
    'footer.copyright':     'Экологиялық-медициналық мониторинг деректер базасы',
  },

  en: {
    // === Header ===
    'header.title': 'Ecological and Medical Monitoring Database',
    'header.region': 'East Kazakhstan Region (EKR)',
    'header.today':  'Today',
    'header.langLabel': 'Interface language',
    'nav.main':      'Home',
    'nav.team':      'Project team',

    // === Control panel ===
    'panel.topic':       'Topic',
    'panel.refresh':     'Refresh',
    'panel.loading':     'Loading…',
    'panel.loadingDots': '— loading —',

    // === Chart settings ===
    'chart.title':           'Chart',
    'chart.type':            'Chart type',
    'chart.type.bar':        'Bar',
    'chart.type.line':       'Line',
    'chart.type.area':       'Area',
    'chart.type.pie':        'Pie',
    'chart.type.scatter':    'Scatter',
    'chart.xAxis':           'X axis',
    'chart.yAxis':           'Series (Y)',
    'chart.category':        'Category',
    'chart.value':           'Value',
    'chart.notSelected':     '— not selected —',
    'chart.selectAxes':      'Select columns for the X and Y axes.',
    'chart.loadDataFirst':   'Load data to build the chart.',

    // === Table ===
    'table.title':          'Data',
    'table.sheet':          'Sheet',
    'table.rows':           'rows',
    'table.cols':           'cols',
    'table.empty':          'No rows',
    'table.noData':         'No data. Select a topic.',

    // === Map ===
    'map.title':            'Regional map',
    'map.soon':             'coming soon',
    'map.caption':          'Map of the East Kazakhstan Region',
    'map.hint':             'interactive layer will be added later',

    // === Team ===
    'team.grant.label':     'Grant project of the Ministry of Science and Higher Education of the RK',
    'team.title':           'Project team',
    'team.subtitle':        'Research group implementing the project',
    'team.photo.placeholder': 'photo placeholder',
    'team.role.leader':     'Project scientific supervisor',
    'team.role.lead':       'Lead researcher',
    'team.role.researcher': 'Project researcher',
    'team.role.researcher2': 'Researcher',

    // === Messages / errors ===
    'msg.error':            'Error',
    'msg.loadFailed':       'Failed to load data',
    'msg.noRecords':        'No records in the database for topic "{topic}"',

    // === Footer ===
    'footer.copyright':     'Ecological and Medical Monitoring Database',
  },
};
