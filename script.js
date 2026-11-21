const root = document.documentElement;
const themeButton = document.querySelector('.theme-toggle');
const themeLabel = document.querySelector('.theme-label');
const languageControl = document.querySelector('.language-control');
const languageToggle = document.querySelector('#language-toggle');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

const russian = {
  'meta.title': 'Денис Андриков — исследования, код и интерактивное обучение',
  'meta.description': 'Денис Андриков — специалист по данным, Python-разработчик и преподаватель в области биомедицинского ИИ, машинного обучения и систем управления.',
  'accessibility.skip': 'Перейти к содержимому',
  'accessibility.home': 'DA. — Денис Андриков, на главную',
  'nav.label': 'Основная навигация',
  'nav.work': 'Проекты',
  'nav.expertise': 'Экспертиза',
  'nav.library': 'Библиотека',
  'nav.path': 'Путь',
  'nav.research': 'Наука',
  'nav.articles': 'Статьи',
  'language.useRussian': 'Использовать русский язык',
  'hero.status': '<span class="status-dot"></span> Открыт к исследованиям и сотрудничеству',
  'hero.title': 'Превращаю сложные сигналы в <em>понятные решения.</em>',
  'hero.intro': 'Я <strong>Денис Андриков</strong> — специалист по данным, Python-разработчик и преподаватель. Соединяю строгую теорию управления с практическим биомедицинским ИИ и создаю интерактивные инструменты для изучения методов.',
  'hero.work': 'Смотреть проекты <span>↘</span>',
  'hero.orcid': 'Профиль ORCID <span>↗</span>',
  'hero.scroll': 'Листайте дальше',
  'profile.label': 'Краткая информация',
  'profile.portrait': 'Портрет Дениса Андрикова',
  'profile.location': 'Москва · Работаю по всему миру',
  'profile.heading': 'Исследователь по методу.<br>Педагог по призванию.',
  'stats.labs': 'интерактивных лабораторий',
  'stats.perspectives': 'направления',
  'stats.resources': 'учебные материалы',
  'expertise.index': '01 / Экспертиза',
  'expertise.title': 'Одна практика.<br><em>Три направления.</em>',
  'expertise.intro': 'Выберите область, чтобы увидеть, как объединяются исследования, код и преподавание.',
  'expertise.tabsLabel': 'Области экспертизы',
  'expertise.biomed': 'Биомедицинский ИИ <span aria-hidden="true">01</span>',
  'expertise.control': 'Системы управления <span aria-hidden="true">02</span>',
  'expertise.education': 'Открытое образование <span aria-hidden="true">03</span>',
  'expertise.biomedLabel': 'Биомедицинский ИИ',
  'expertise.biomedTitle': 'Поиск интерпретируемых закономерностей в физиологических сигналах.',
  'expertise.biomedText': 'Ноутбуки по ЭЭГ и ЭКГ объединяют обработку сигналов, глубокое обучение и интерпретируемость. Graph-EVT-agent дополняет инструменты анализа временных рядов обнаружением экстремальных событий и прозрачным ранжированием источников.',
  'expertise.evt': 'Теория экстремальных значений',
  'expertise.graphs': 'Обучение на графах',
  'expertise.biomedLink': 'Биомедицинские ноутбуки <span aria-hidden="true">↗</span>',
  'expertise.controlLabel': 'Системы управления',
  'expertise.controlTitle': 'Связываю динамические системы с обучающимися моделями.',
  'expertise.controlText': 'Математическое моделирование, устойчивость и синтез регуляторов встречаются с резервуарными вычислениями. Интерактивная лаборатория связывает модели в пространстве состояний, импульсные характеристики и редукцию моделей с обучаемой динамикой.',
  'expertise.stateSpace': 'Пространство состояний',
  'expertise.identification': 'Идентификация систем',
  'expertise.reservoir': 'Резервуарные вычисления',
  'expertise.controlLink': 'Открыть лабораторию <span aria-hidden="true">↗</span>',
  'expertise.educationLabel': 'Открытое образование',
  'expertise.educationTitle': 'Изучайте метод, изменяя модель.',
  'expertise.educationText': 'Эксперименты в браузере делают наглядными эмбеддинги, внимание, латентные пространства и рекуррентную динамику. Материалы на английском и русском сочетают живые вычисления с исходным кодом и ноутбуками.',
  'expertise.explainers': 'Интерактивные объяснения',
  'expertise.notebooks': 'Сопутствующие ноутбуки',
  'expertise.educationLink': 'Эмбеддинги и внимание <span aria-hidden="true">↗</span>',
  'path.index': '02 / Траектория',
  'path.title': 'На стыке дисциплин,<br><em>а не внутри рамок.</em>',
  'path.engineeringTitle': 'Инженерный фундамент',
  'path.engineeringText': 'Докторская подготовка и прикладная работа в области робастного управления, динамики систем и синтеза регуляторов.',
  'path.biomedTitle': 'Поворот к биомедицине',
  'path.biomedText': 'Машинное обучение и методы экстремальных значений для интерпретируемого обнаружения эпилептических приступов.',
  'path.signalsTitle': 'От сигналов к системам',
  'path.signalsText': 'ЭЭГ, биоискусственные органы, нейроадаптивное образование и клинические конвейеры глубокого обучения.',
  'path.now': '2025—сейчас',
  'path.currentTitle': 'Интерпретируемые исследования, интерактивное обучение',
  'path.currentBadge': 'Сейчас',
  'path.currentText': 'Графовый анализ экстремальных значений, биомедицинские временные ряды и браузерные материалы, соединяющие исследовательские методы с практическим обучением.',
  'projects.index': '03 / Избранные проекты',
  'projects.title': 'Полезные идеи должны<br><em>выходить за пределы ноутбука.</em>',
  'projects.filterLabel': 'Фильтр избранных проектов',
  'projects.all': 'Все',
  'projects.ai': 'ИИ и сигналы',
  'projects.control': 'Управление',
  'projects.learning': 'Обучение',
  'projects.evtAlt': 'Схема метода: временной ряд, обнаружение экстремумов по EVT, граф зависимостей и ранжирование источников.',
  'projects.evtKicker': '01 / Исследовательский инструмент + учебная демонстрация',
  'projects.evtDescription': 'Когда началось экстремальное событие и какой канал отреагировал первым? Python-конвейер разделяет обнаружение, построение графа и ранжирование источников.',
  'projects.method': 'Метод',
  'projects.explore': 'Изучить',
  'projects.evtMethod': 'Моделирование хвостов POT/GPD, графы AR / DFA / Курамото–вейвлет, прозрачное ранжирование и дополнительные обученные модели GNN/GAT.',
  'projects.evtExplore': 'Учебный проект включает одномерные и многоканальные ноутбуки. В браузерной лаборатории можно изменить систему из 12 осцилляторов Курамото и наблюдать распространение события.',
  'projects.evtNote': 'Учебная демонстрация использует синтетические данные. Ранжирование зависимостей и источников не доказывает причинность или клиническую применимость.',
  'projects.pipeline': 'Код конвейера <span aria-hidden="true">↗</span>',
  'projects.educationalNotebooks': 'Учебные ноутбуки <span aria-hidden="true">↗</span>',
  'projects.interactiveGuide': 'Интерактивное руководство <span aria-hidden="true">↗</span>',
  'projects.propagationLab': 'Лаборатория распространения <span aria-hidden="true">↗</span>',
  'projects.reservoirAlt': 'Схема метода: вход поступает в рекуррентный резервуар, а обученный считывающий слой строит прогноз.',
  'projects.reservoirKicker': '02 / Интерактивная лаборатория · EN / RU',
  'projects.reservoirDescription': 'Где модель хранит память? Сравните сеть прямого распространения с сетью эхо-состояний и проследите вычисление прогноза.',
  'projects.try': 'Попробовать',
  'projects.deeper': 'Подробнее',
  'projects.reservoirTry': 'Изменяйте спектральный радиус и скорость утечки, исследуйте резервуар из 100 нейронов и сравнивайте базовые методы прогнозирования.',
  'projects.reservoirDeeper': 'Свяжите динамику резервуара с управлением в пространстве состояний, импульсными характеристиками и моделями reduced order. Эксперименты NumPy воспроизводят лабораторию.',
  'projects.reservoirLab': 'Открыть лабораторию <span aria-hidden="true">↗</span>',
  'projects.codeMethods': 'Код и методы <span aria-hidden="true">↗</span>',
  'projects.attentionAlt': 'Схема метода: токены превращаются в эмбеддинги и поступают в матрицу каузального внимания.',
  'projects.attentionKicker': '03 / Интерактивная лаборатория · EN / RU',
  'projects.attentionTitle': 'Эмбеддинги и внимание',
  'projects.attentionDescription': 'Проследите путь предложения в GPT-2: от BPE-токенизации и идентификаторов до эмбеддингов, позиций и первого слоя самовнимания.',
  'projects.attentionTry': 'Изучайте слияния BPE, обучите небольшую модель эмбеддингов и проследите Q/K/V, маскирование и веса внимания.',
  'projects.hood': 'Как устроено',
  'projects.attentionHood': 'Материал использует токенизатор GPT-2 и отдельные настоящие веса модели. Проверочный скрипт сравнивает вычисления с Transformers.',
  'projects.attentionNote': 'Для просмотра внимания при первом запуске загружаются веса модели; токенизация работает без этой загрузки.',
  'projects.attentionLab': 'Открыть лабораторию внимания <span aria-hidden="true">↗</span>',
  'projects.autoencoderAlt': 'Схема метода: кодировщик сжимает вход через латентное bottleneck-пространство, а декодировщик восстанавливает его.',
  'projects.autoencoderKicker': '04 / Интерактивная лаборатория · EN / RU',
  'projects.autoencoderTitle': 'Автоэнкодеры и прогнозирование',
  'projects.autoencoderDescription': 'Исследуйте, что сжатое представление сохраняет и теряет. Пройдите путь от одномерного узкого места до эмбеддингов цифр, VAE и прогнозов временных рядов.',
  'projects.autoencoderTry': 'Обучите простой автоэнкодер, нарисуйте цифру, изменяйте параметр β в VAE и рассматривайте возможные сценарии будущего.',
  'projects.autoencoderDeeper': 'Сравните прогнозирующие автоэнкодеры с NLinear на ETTh1 и исследуйте неопределённость с помощью условного VAE.',
  'projects.autoencoderLab': 'Открыть лабораторию (RU) <span aria-hidden="true">↗</span>',
  'projects.englishVersion': 'Английская версия <span aria-hidden="true">↗</span>',
  'projects.biomedKicker': '05 / Коллекция биомедицинских ноутбуков',
  'projects.biomedDescription': 'Исполняемые примеры, связывающие биомедицинские данные с обработкой сигналов и машинным обучением.',
  'projects.methods': 'Методы',
  'projects.biomedMethods': 'Фильтрация ЭЭГ и обнаружение аномалий, классификация ЭКГ, графовые модели, медицинские языковые модели и исследование генетики.',
  'projects.biomedExplore': 'Начните с ноутбука под конкретную задачу, изучите подготовку данных и сравните модель с сигналом, который она описывает.',
  'projects.biomedLink': 'Биомедицинские ноутбуки <span aria-hidden="true">↗</span>',
  'resources.title': 'Больше способов учиться',
  'resources.text': 'Курсы и подробные занятия в дополнение к интерактивным лабораториям.',
  'resources.control': 'Портал курса теории управления <span aria-hidden="true">↗</span>',
  'resources.stepik': 'Основы машинного обучения на Stepik <span aria-hidden="true">↗</span>',
  'resources.video': 'Видеотека Bauman AI <span aria-hidden="true">↗</span>',
  'library.index': '04 / Интерактивная библиотека',
  'library.title': 'Учитесь, изменяя<br><em>параметры.</em>',
  'library.intro': 'Каждая лаборатория работает в браузере и опубликована через GitHub Pages из исходного репозитория. Откройте лабораторию, передвиньте ползунок и сравните результат с исходными ноутбуками.',
  'library.evtGuideTopic': 'Экстремальные события · Руководство',
  'library.evtGuideText': 'Двуязычное руководство по аддитивным сигналам Хёрста, одномерным и многомерным случаям, POT/GPD-детекции, локализации источника, конвейеру Graph-EVT, сравнению GNN и GAT и оркестрации агентов.',
  'library.openGuide': 'Открыть руководство · EN <span aria-hidden="true">↗</span>',
  'library.source': 'Исходный код <span aria-hidden="true">↗</span>',
  'library.evtTopic': 'Экстремальные события · Графы',
  'library.evtTitle': 'Исследование распространения в системе Курамото',
  'library.evtText': 'Настройте 12 связанных осцилляторов Курамото и наблюдайте, как внесённый шумовой импульс распространяется от исходного канала через фазовую когерентность.',
  'library.openLab': 'Открыть лабораторию · EN <span aria-hidden="true">↗</span>',
  'library.reservoirTopic': 'Временные ряды · Динамика',
  'library.reservoirTitle': 'Резервуарные вычисления',
  'library.reservoirText': 'Сравните сети прямого распространения, сети эхо-состояний, машины жидких состояний и резервуарные вычисления нового поколения — все модели обучаются прямо на странице.',
  'library.attentionTopic': 'Языковые модели',
  'library.attentionTitle': 'От текста к вниманию',
  'library.attentionText': 'Введите предложение и проследите его путь через GPT-2: токенизация, эмбеддинги, позиционное кодирование и самовнимание на настоящих весах модели.',
  'library.autoencoderTopic': 'Обучение представлений',
  'library.autoencoderTitle': 'Автоэнкодеры',
  'library.autoencoderText': 'От одномерного узкого места до эмбеддингов цифр, VAE и вероятностных прогнозов временных рядов.',
  'library.overlayTopic': 'Машинное обучение · Графы',
  'library.overlayTitle': 'Лаборатория кластеризации наложенных данных',
  'library.overlayText': 'Можно ли разделить красные и зелёные точки из одного распределения без меток? Сравните кластеризацию, плотность, t-SNE и графовые методы с базовым вариантом «все красные», создайте свой набор данных и увидьте, когда выигрывают связные компоненты.',
  'library.gnnTopic': 'Графовые нейросети · Валидация',
  'library.gnnTitle': 'Как работают графовые нейронные сети',
  'library.gnnText': 'Проследите передачу сообщений, обучите модели GNN и MLP, измерьте вклад рёбер ΔG, примените критерий Надо–Бенджио и исследуйте направленные графы по Грейнджеру и гиперболические графы.',
  'library.openBilingualLab': 'Открыть лабораторию · EN / RU <span aria-hidden="true">↗</span>',
  'library.agentsTopic': 'LLM-агенты',
  'library.agentsTitle': 'От одного токена к команде агентов',
  'library.agentsText': 'Сэмплирование, квантование, инструменты и MCP, циклы Think–Act–Observe, память, ограничения, RAG и HyDE, DSPy, критики и LLM-as-judge — с вычислениями в браузере.',
  'library.courseTopic': 'LLM-агенты · Курс',
  'library.courseTitle': 'LLM AI Agents: 13 уроков',
  'library.courseText': 'Последовательный обзор сопутствующего курса ноутбуков: от базового инференса до инструментов MCP, RAG, DSPy и мультиагентных систем.',
  'library.openCourse': 'Открыть страницу курса · EN <span aria-hidden="true">↗</span>',
  'library.notebooks': 'Ноутбуки <span aria-hidden="true">↗</span>',
  'research.index': '05 / Исследования',
  'research.title': 'Избранные <em>публикации.</em>',
  'research.focus2026': 'Интерпретируемые модели и биомаркеры эпилепсии.',
  'research.focus2024': 'Обнаружение выбросов в сочетании с глубоким обучением для анализа приступов.',
  'research.focus2022': 'Методы экстремальных значений для интерпретируемого обнаружения приступов.',
  'research.orcid': 'Полный список исследований в ORCID <span>↗</span>',
  'articles.index': 'Публикации / Habr',
  'articles.title': 'Мои статьи на Habr.',
  'articles.archive': 'Читать мои статьи на Habr',
  'articles.browse': 'Перейти к полному архиву статей.',
  'contact.index': '06 / Связаться',
  'contact.title': 'Есть сложная задача?<br><em>Давайте сделаем её понятной.</em>',
  'footer.tagline': 'Данные · Системы · Образование'
};

const textElements = [...document.querySelectorAll('[data-i18n]')];
const htmlElements = [...document.querySelectorAll('[data-i18n-html]')];
const attributeElements = [...document.querySelectorAll('[data-i18n-aria-label], [data-i18n-alt], [data-i18n-content], [data-i18n-data-current-label]')];
const englishText = new Map(textElements.map(element => [element, element.textContent]));
const englishHtml = new Map(htmlElements.map(element => [element, element.innerHTML]));
const englishAttributes = new Map(attributeElements.map(element => {
  const attributes = {};
  for (const attribute of ['aria-label', 'alt', 'content', 'data-current-label']) {
    if (element.hasAttribute(attribute)) attributes[attribute] = element.getAttribute(attribute);
  }
  return [element, attributes];
}));

let language = 'en';
let explicitTheme = false;
try {
  language = localStorage.getItem('language') === 'ru' ? 'ru' : 'en';
  explicitTheme = ['light', 'dark'].includes(localStorage.getItem('theme'));
} catch (_) {
  // Keep all interactions available without browser storage.
}

function setTheme(theme) {
  root.dataset.theme = theme;
  const dark = theme === 'dark';
  const nextTheme = dark ? 'light' : 'dark';
  const themeNames = language === 'ru'
    ? { light: 'светлую', dark: 'тёмную', labelLight: 'Светлая', labelDark: 'Тёмная' }
    : { light: 'light', dark: 'dark', labelLight: 'Light', labelDark: 'Dark' };
  themeButton.setAttribute('aria-pressed', String(dark));
  themeButton.setAttribute('aria-label', language === 'ru'
    ? `Переключить: ${dark ? themeNames.labelLight : themeNames.labelDark} тема`
    : `Switch to ${themeNames[nextTheme]} theme`);
  themeLabel.textContent = dark ? themeNames.labelLight : themeNames.labelDark;
  document.querySelector('meta[name="theme-color"]').content = dark ? '#09101e' : '#f4f7fb';
}

function setLanguage(nextLanguage) {
  language = nextLanguage;
  root.lang = language;
  languageToggle.checked = language === 'ru';

  textElements.forEach(element => {
    const key = element.dataset.i18n;
    element.textContent = language === 'ru' && russian[key] ? russian[key] : englishText.get(element);
  });
  htmlElements.forEach(element => {
    const key = element.dataset.i18nHtml;
    element.innerHTML = language === 'ru' && russian[key] ? russian[key] : englishHtml.get(element);
  });
  attributeElements.forEach(element => {
    const originals = englishAttributes.get(element);
    for (const [attribute, englishValue] of Object.entries(originals)) {
      const key = element.dataset[`i18n${attribute.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('')}`];
      element.setAttribute(attribute, language === 'ru' && russian[key] ? russian[key] : englishValue);
    }
  });
  setTheme(root.dataset.theme || (systemTheme.matches ? 'dark' : 'light'));
  updateProjectCount();
}

themeButton.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(next);
  explicitTheme = true;
  try {
    localStorage.setItem('theme', next);
  } catch (_) {
    // The preference applies to this visit even if it cannot be saved.
  }
});
languageToggle.addEventListener('change', () => {
  const next = languageToggle.checked ? 'ru' : 'en';
  setLanguage(next);
  try {
    localStorage.setItem('language', next);
  } catch (_) {
    // The language applies to this visit even if it cannot be saved.
  }
});
systemTheme.addEventListener('change', event => {
  if (!explicitTheme) setTheme(event.matches ? 'dark' : 'light');
});

// All panels are readable HTML until the complete tab interaction is ready.
const tablist = document.querySelector('.expertise-tabs');
const tabs = [...tablist.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('.expertise-panel')];
const mobileTabs = window.matchMedia('(max-width: 820px)');
function setTabOrientation() {
  tablist.setAttribute('aria-orientation', mobileTabs.matches ? 'horizontal' : 'vertical');
}
function selectTab(tab, focus = false) {
  tabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  panels.forEach(panel => {
    panel.hidden = panel.id !== tab.getAttribute('aria-controls');
  });
  if (focus) tab.focus({ preventScroll: true });
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    const previous = mobileTabs.matches ? 'ArrowLeft' : 'ArrowUp';
    const next = mobileTabs.matches ? 'ArrowRight' : 'ArrowDown';
    let target;
    if (event.key === previous) target = (index + tabs.length - 1) % tabs.length;
    if (event.key === next) target = (index + 1) % tabs.length;
    if (event.key === 'Home') target = 0;
    if (event.key === 'End') target = tabs.length - 1;
    if (target === undefined) return;
    event.preventDefault();
    selectTab(tabs[target], true);
    tabs[target].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
});
setTabOrientation();
mobileTabs.addEventListener('change', setTabOrientation);
selectTab(tabs[0]);
tablist.hidden = false;

const filterGroup = document.querySelector('.project-filter');
const cards = [...document.querySelectorAll('.project-card')];
const resultCount = document.querySelector('#project-count');
function russianProjectCount(count) {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return 'проектов';
  if (last === 1) return 'проект';
  if (last >= 2 && last <= 4) return 'проекта';
  return 'проектов';
}
function updateProjectCount() {
  const count = cards.filter(card => !card.hidden).length;
  resultCount.textContent = language === 'ru'
    ? `Показано: ${count} ${russianProjectCount(count)}`
    : `${count} ${count === 1 ? 'project' : 'projects'} shown`;
}
filterGroup.querySelectorAll('button').forEach(button => {
  button.addEventListener('click', () => {
    filterGroup.querySelectorAll('button').forEach(item => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    cards.forEach(card => {
      card.hidden = button.dataset.filter !== 'all' && !card.dataset.category.split(' ').includes(button.dataset.filter);
    });
    updateProjectCount();
  });
});
updateProjectCount();
filterGroup.hidden = false;
resultCount.hidden = false;

setLanguage(language);
languageControl.hidden = false;
themeButton.hidden = false;

// Animation enhances visible content; it is never required to reveal it.
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}

document.querySelector('#year').textContent = new Date().getFullYear();
