// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBpKzpuDQY_EnwNhLtSuPPLjultTzXxAVA",
  authDomain: "money-tracker-9b942.firebaseapp.com",
  projectId: "money-tracker-9b942",
  storageBucket: "money-tracker-9b942.firebasestorage.app",
  messagingSenderId: "961697222118",
  appId: "1:961697222118:web:5cbd936386d05700a2da27"
};

// Инициализация Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Элементы DOM
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const typeInput = document.getElementById('type');
const paymentInput = document.getElementById('payment');
const addTransactionButton = document.getElementById('addTransaction');
const transactionList = document.getElementById('transactionList');
const cashBalance = document.getElementById('cashBalance');
const cardBalance = document.getElementById('cardBalance');
const totalBalance = document.getElementById('totalBalance');
const searchInput = document.getElementById('search');
const filterType = document.getElementById('filterType');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const filterButton = document.getElementById('filter');
const resetFilterButton = document.getElementById('resetFilter');
const exportButton = document.getElementById('export');
const toggleTransactionsButton = document.getElementById('toggleTransactions');
const archiveButton = document.getElementById('archiveBtn');
const confirmArchiveButton = document.getElementById('confirmArchive');
const viewArchivesButton = document.getElementById('viewArchivesBtn');
const changeUserButton = document.getElementById('changeUserBtn');
const currentUserDisplay = document.getElementById('currentUserDisplay');
const filterUserSelect = document.getElementById('filterUser');
const filterCategorySelect = document.getElementById('filterCategory');
const expandFiltersBtn = document.getElementById('expandFiltersBtn');
const filtersContent = document.getElementById('filtersContent');
const analyticsButton = document.getElementById('analyticsBtn');

let transactions = [];
let filteredTransactions = [];
let isCollapsed = true;
let editingTransactionId = null;
let selectedCategory = null; // По умолчанию без категории
let currentUser = null; // Текущий пользователь

// Словарь ключевых слов для автоматического определения категории
const categoryKeywords = {
  'ЗП': ['зп', 'зарплата', 'оклад', 'выплата', 'salary', 'переработка'],
  'Аренда': ['аренда', 'rent', 'квартплата', 'помещение'],
  'Доставка': ['доставка', 'delivery', 'транспорт', 'перевозка'],
  'Сборка': ['сборка', 'монтаж', 'установка', 'сбор'],
  'Материалы': ['материал', 'дсп', 'мдф', 'фурнитура', 'кромка', 'плита', 'доска', 'фанера', 'татхим', 'дсплит', 'вудсток', 'шпон', 'клей', 'мдм', 'профиль'],
  'Реклама и сервисы': ['реклама', 'сервис', 'яндекс', 'google', 'advertising', 'продвижение', 'контекст', 'елама', 'директ', 'манго'],
  'Хозрасходы': ['хозрасходы', 'хозяйственные', 'бытовые', 'канцелярия', 'уборка', 'дрова', 'производство', 'вывоз мусора', 'мусор'],
  'Электричество': ['электричество', 'свет', 'электроэнергия', 'счет за свет'],
  'Расходники': ['расходники', 'расходные', 'биты', 'диски', 'сверла', 'пилки', 'фрезы', 'фреза', 'заточка', 'пилы', 'пила', 'картон', 'упаковка', 'скотч', 'лемана', 'леруа'],
  'Оборудование': [],
  'Новые проекты': ['новый проект', 'проект', 'разработка', 'дизайн'],
  'Налоги': ['налог', 'налоги', 'ндс', 'усн', 'ип', 'фнс', 'инспекция']
};

// Функции для работы с пользователями
function getCurrentUser() {
  return localStorage.getItem('moneyTrackerUser');
}

function setCurrentUser(userName) {
  localStorage.setItem('moneyTrackerUser', userName);
  currentUser = userName;
  currentUserDisplay.textContent = userName;
}

function showUserSelectModal() {
  const userModal = new bootstrap.Modal(document.getElementById('userSelectModal'));
  userModal.show();
}

// Проверка и инициализация пользователя при загрузке
function initializeUser() {
  const savedUser = getCurrentUser();
  if (savedUser) {
    currentUser = savedUser;
    currentUserDisplay.textContent = savedUser;
  } else {
    showUserSelectModal();
  }
}

// Обработчики выбора пользователя
document.querySelectorAll('.user-select-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const userName = btn.getAttribute('data-user');
    setCurrentUser(userName);
    const userModal = bootstrap.Modal.getInstance(document.getElementById('userSelectModal'));
    userModal.hide();
  });
});

// Обработчик смены пользователя
changeUserButton.addEventListener('click', () => {
  showUserSelectModal();
});

// Обработчик раскрытия/скрытия фильтров
expandFiltersBtn.addEventListener('click', () => {
  if (filtersContent.style.display === 'none') {
    filtersContent.style.display = 'block';
    expandFiltersBtn.classList.add('expanded');
  } else {
    filtersContent.style.display = 'none';
    expandFiltersBtn.classList.remove('expanded');
  }
});

// Функция автоматического определения категории по ключевым словам
function detectCategory(description) {
  if (!description || description.trim() === '') {
    return null;
  }
  
  const lowerDescription = description.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerDescription.includes(keyword)) {
        return category;
      }
    }
  }
  
  return null; // Возвращаем null, если ничего не найдено
}

// Обработчики для табов категорий
document.addEventListener('DOMContentLoaded', () => {
  const categoryTabs = document.querySelectorAll('.category-tab');
  const expandBtn = document.getElementById('expandCategoriesBtn');
  const extraCategories = document.getElementById('categoryTabsExtra');
  let isExpanded = false;
  
  // Обработчики для всех табов категорий
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      // Убираем активный класс у всех табов
      categoryTabs.forEach(t => t.classList.remove('active'));
      // Добавляем активный класс к выбранному табу
      tab.classList.add('active');
      // Сохраняем выбранную категорию
      selectedCategory = tab.getAttribute('data-category');
    });
  });
  
  // Обработчик для кнопки раскрытия дополнительных категорий
  if (expandBtn && extraCategories) {
    expandBtn.addEventListener('click', () => {
      isExpanded = !isExpanded;
      
      if (isExpanded) {
        extraCategories.style.display = 'flex';
        expandBtn.classList.add('expanded');
      } else {
        extraCategories.style.display = 'none';
        expandBtn.classList.remove('expanded');
      }
    });
  }
});

// Автоматическое определение категории при вводе описания
descriptionInput.addEventListener('input', () => {
  const detectedCategory = detectCategory(descriptionInput.value);
  
  const categoryTabs = document.querySelectorAll('.category-tab');
  
  if (detectedCategory) {
    // Ищем таб с найденной категорией
    categoryTabs.forEach(tab => {
      if (tab.getAttribute('data-category') === detectedCategory) {
        // Убираем активный класс у всех табов
        categoryTabs.forEach(t => t.classList.remove('active'));
        // Добавляем активный класс найденному табу
        tab.classList.add('active');
        selectedCategory = detectedCategory;
        
        // Если категория в скрытом блоке, раскрываем его
        const extraCategories = document.getElementById('categoryTabsExtra');
        const expandBtn = document.getElementById('expandCategoriesBtn');
        if (extraCategories.contains(tab) && extraCategories.style.display === 'none') {
          extraCategories.style.display = 'flex';
          expandBtn.classList.add('expanded');
        }
      }
    });
  }
});

// Добавление транзакции
addTransactionButton.addEventListener('click', () => {
  const transaction = {
    description: descriptionInput.value,
    amount: parseFloat(amountInput.value),
    type: typeInput.value,
    payment: paymentInput.value,
    user: currentUser, // Добавляем текущего пользователя
    date: editingTransactionId ? transactions.find(t => t.id === editingTransactionId).date : new Date().toISOString()
  };
  
  // Добавляем категорию только если она выбрана
  if (selectedCategory) {
    transaction.category = selectedCategory;
  }

  if (editingTransactionId) {
    // Обновление существующей транзакции
    db.collection('transactions').doc(editingTransactionId).update(transaction)
      .then(() => {
        console.log("Транзакция обновлена успешно!");
        editingTransactionId = null;
        addTransactionButton.textContent = 'Добавить';
        loadTransactions();
      })
      .catch((error) => {
        console.error("Ошибка обновления транзакции: ", error);
      });
  } else {
    // Добавление новой транзакции
    db.collection('transactions').add(transaction)
      .then(() => {
        console.log("Транзакция добавлена успешно!");
        loadTransactions();
      })
      .catch((error) => {
        console.error("Ошибка добавления транзакции: ", error);
      });
  }
  
  // Очистка формы
  descriptionInput.value = '';
  amountInput.value = '';
  
  // Сброс категории (без категории по умолчанию)
  selectedCategory = null;
  const categoryTabs = document.querySelectorAll('.category-tab');
  categoryTabs.forEach(tab => tab.classList.remove('active'));
});

// Загрузка транзакций
function loadTransactions() {
  db.collection('transactions')
    .orderBy('date', 'desc')
    .get()
    .then((querySnapshot) => {
      transactions = [];
      querySnapshot.forEach((doc) => {
        transactions.push({ id: doc.id, ...doc.data() });
      });
      filteredTransactions = [...transactions];
      renderTransactions();
      updateBalances();
    })
    .catch((error) => {
      console.error("Ошибка загрузки транзакций: ", error);
    });
}

// Рендер транзакций
function renderTransactions() {
  transactionList.innerHTML = '';

  // Отображаем только три последние транзакции, если список свернут
  const transactionsToShow = isCollapsed ? filteredTransactions.slice(0, 3) : filteredTransactions;

  transactionsToShow.forEach((transaction) => {
    const li = document.createElement('li');
    li.className = `list-group-item ${transaction.type === 'income' ? 'income' : 'expense'}`;
    const date = new Date(transaction.date).toLocaleDateString('ru-RU', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    });
    
    // Добавляем отображение категории, если она есть
    const categoryBadge = transaction.category ? `<span class="transaction-category">${transaction.category}</span>` : '';
    
    li.innerHTML = `
      <div class="transaction-description">
        ${transaction.description}
        ${categoryBadge}
        <span class="transaction-date">${date}</span>
      </div>
      <span>${transaction.amount.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}</span>
      <div class="transaction-actions">
        <button class="btn-edit" onclick="editTransaction('${transaction.id}')">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn-trash" onclick="deleteTransaction('${transaction.id}')">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    `;
    transactionList.appendChild(li);
  });

  // Добавляем класс для свернутого списка
  if (isCollapsed) {
    transactionList.classList.add('collapsed');
  } else {
    transactionList.classList.remove('collapsed');
  }
}

// Удаление транзакции
window.deleteTransaction = (id) => {
  db.collection('transactions').doc(id).delete()
    .then(() => {
      console.log("Транзакция удалена успешно!");
      loadTransactions();
    })
    .catch((error) => {
      console.error("Ошибка удаления транзакции: ", error);
    });
};

// Обновление балансов
function updateBalances() {
  let cash = 0;
  let card = 0;

  transactions.forEach((transaction) => {
    if (transaction.payment === 'cash') {
      cash += transaction.type === 'income' ? transaction.amount : -transaction.amount;
    } else {
      card += transaction.type === 'income' ? transaction.amount : -transaction.amount;
    }
  });

  cashBalance.textContent = cash.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' });
  cardBalance.textContent = card.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' });
  totalBalance.textContent = (cash + card).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' });
}

// Фильтрация транзакций
filterButton.addEventListener('click', () => {
  const searchText = searchInput.value.toLowerCase();
  const type = filterType.value;
  const user = filterUserSelect.value;
  const category = filterCategorySelect.value;
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchText);
    const matchesType = type === 'all' || transaction.type === type;
    const matchesUser = user === 'all' || transaction.user === user;
    const matchesCategory = category === 'all' || transaction.category === category;
    const transactionDate = new Date(transaction.date).toISOString().split('T')[0];
    const matchesDate = (!startDate || transactionDate >= startDate) && (!endDate || transactionDate <= endDate);
    return matchesSearch && matchesType && matchesUser && matchesCategory && matchesDate;
  });

  renderTransactions();
});

// Сброс фильтра
resetFilterButton.addEventListener('click', () => {
  searchInput.value = '';
  filterType.value = 'all';
  filterUserSelect.value = 'all';
  filterCategorySelect.value = 'all';
  startDateInput.value = '';
  endDateInput.value = '';
  filteredTransactions = [...transactions];
  renderTransactions();
});

// Экспорт в XLSX
exportButton.addEventListener('click', () => {
  const ws = XLSX.utils.json_to_sheet(filteredTransactions);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Транзакции");
  XLSX.writeFile(wb, "transactions.xlsx");
});

// Обработчик для кнопки "Развернуть/Свернуть"
toggleTransactionsButton.addEventListener('click', () => {
  isCollapsed = !isCollapsed;
  toggleTransactionsButton.textContent = isCollapsed ? 'Развернуть' : 'Свернуть';
  renderTransactions();
});

// Редактирование транзакции
window.editTransaction = (id) => {
  const transaction = transactions.find(t => t.id === id);
  if (transaction) {
    descriptionInput.value = transaction.description;
    amountInput.value = transaction.amount;
    typeInput.value = transaction.type;
    paymentInput.value = transaction.payment;
    
    // Устанавливаем категорию, если она есть
    const categoryTabs = document.querySelectorAll('.category-tab');
    const extraCategories = document.getElementById('categoryTabsExtra');
    const expandBtn = document.getElementById('expandCategoriesBtn');
    
    // Сбрасываем все выделения
    categoryTabs.forEach(tab => tab.classList.remove('active'));
    
    if (transaction.category) {
      selectedCategory = transaction.category;
      
      // Ищем таб с этой категорией
      categoryTabs.forEach(tab => {
        if (tab.getAttribute('data-category') === transaction.category) {
          tab.classList.add('active');
          
          // Если категория в скрытом блоке, раскрываем его
          if (extraCategories.contains(tab)) {
            extraCategories.style.display = 'flex';
            expandBtn.classList.add('expanded');
          }
        }
      });
    } else {
      selectedCategory = null;
    }
    
    editingTransactionId = id;
    addTransactionButton.textContent = 'Сохранить';
  }
};

// Архивация транзакций
archiveButton.addEventListener('click', () => {
  // Обновляем количество транзакций в модальном окне
  document.getElementById('transactionCount').textContent = transactions.length;
  
  // Показываем модальное окно подтверждения
  const archiveModal = new bootstrap.Modal(document.getElementById('archiveModal'));
  archiveModal.show();
});

// Подтверждение архивации
confirmArchiveButton.addEventListener('click', async () => {
  if (transactions.length === 0) {
    alert('Нет транзакций для архивации');
    return;
  }
  
  try {
    // Создаем архив с текущей датой
    const archiveData = {
      date: new Date().toISOString(),
      transactions: transactions,
      totalAmount: transactions.reduce((sum, t) => {
        return sum + (t.type === 'income' ? t.amount : -t.amount);
      }, 0),
      transactionCount: transactions.length
    };
    
    // Сохраняем архив в коллекцию archives
    await db.collection('archives').add(archiveData);
    console.log('Архив создан успешно!');
    
    // Удаляем все транзакции из основной коллекции
    const batch = db.batch();
    transactions.forEach((transaction) => {
      const docRef = db.collection('transactions').doc(transaction.id);
      batch.delete(docRef);
    });
    await batch.commit();
    console.log('Все транзакции удалены!');
    
    // Закрываем модальное окно
    const archiveModal = bootstrap.Modal.getInstance(document.getElementById('archiveModal'));
    archiveModal.hide();
    
    // Показываем уведомление
    alert(`Успешно архивировано ${transactions.length} транзакций!`);
    
    // Перезагружаем список транзакций
    loadTransactions();
    
  } catch (error) {
    console.error('Ошибка архивации: ', error);
    alert('Произошла ошибка при архивации. Попробуйте еще раз.');
  }
});

// Просмотр архивов
viewArchivesButton.addEventListener('click', async () => {
  try {
    // Загружаем архивы из Firebase
    const archivesSnapshot = await db.collection('archives')
      .orderBy('date', 'desc')
      .get();
    
    const archivesList = document.getElementById('archivesList');
    archivesList.innerHTML = '';
    
    if (archivesSnapshot.empty) {
      archivesList.innerHTML = '<p class="text-center text-muted mt-3">Архивов пока нет</p>';
    } else {
      archivesSnapshot.forEach((doc) => {
        const archive = doc.data();
        const archiveDate = new Date(archive.date).toLocaleDateString('ru-RU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const archiveItem = document.createElement('div');
        archiveItem.className = 'list-group-item list-group-item-action';
        archiveItem.innerHTML = `
          <div class="d-flex w-100 justify-content-between">
            <h6 class="mb-1">📅 ${archiveDate}</h6>
            <small>${archive.transactionCount} транзакций</small>
          </div>
          <p class="mb-1">Итоговый баланс: <strong>${archive.totalAmount.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}</strong></p>
          <button class="btn btn-sm btn-primary mt-2" onclick="exportArchive('${doc.id}')">Экспорт в Excel</button>
        `;
        archivesList.appendChild(archiveItem);
      });
    }
    
    // Показываем модальное окно
    const archivesModal = new bootstrap.Modal(document.getElementById('archivesListModal'));
    archivesModal.show();
    
  } catch (error) {
    console.error('Ошибка загрузки архивов: ', error);
    alert('Не удалось загрузить архивы');
  }
});

// Экспорт архива в Excel
window.exportArchive = async (archiveId) => {
  try {
    const archiveDoc = await db.collection('archives').doc(archiveId).get();
    const archive = archiveDoc.data();
    
    const ws = XLSX.utils.json_to_sheet(archive.transactions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Архив");
    
    const archiveDate = new Date(archive.date).toLocaleDateString('ru-RU');
    XLSX.writeFile(wb, `archive_${archiveDate}.xlsx`);
  } catch (error) {
    console.error('Ошибка экспорта архива: ', error);
    alert('Не удалось экспортировать архив');
  }
};

// Аналитика и графики
let chartInstances = {}; // Хранилище экземпляров графиков

analyticsButton.addEventListener('click', () => {
  buildCharts();
  const analyticsModal = new bootstrap.Modal(document.getElementById('analyticsModal'));
  analyticsModal.show();
});

function buildCharts() {
  // Уничтожаем старые графики перед созданием новых
  Object.values(chartInstances).forEach(chart => {
    if (chart) chart.destroy();
  });
  
  buildCategoryChart();
  buildIncomeExpenseChart();
  buildBalanceChart();
}

// 1. Круговая диаграмма расходов по категориям
function buildCategoryChart() {
  const expenses = filteredTransactions.filter(t => t.type === 'expense' && t.category);
  const categoryData = {};
  
  expenses.forEach(transaction => {
    if (!categoryData[transaction.category]) {
      categoryData[transaction.category] = 0;
    }
    categoryData[transaction.category] += transaction.amount;
  });
  
  const ctx = document.getElementById('categoryChart').getContext('2d');
  chartInstances.categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(categoryData),
      datasets: [{
        data: Object.values(categoryData),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
          '#36A2EB', '#FFCE56', '#9966FF'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

// 2. График доходов vs расходов
function buildIncomeExpenseChart() {
  const income = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
  chartInstances.incomeExpenseChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Доходы', 'Расходы'],
      datasets: [{
        data: [income, expense],
        backgroundColor: ['#4CAF50', '#FF6384']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// 3. Динамика баланса по времени
function buildBalanceChart() {
  // Группируем транзакции по датам
  const dateData = {};
  
  filteredTransactions.forEach(transaction => {
    const date = new Date(transaction.date).toLocaleDateString('ru-RU');
    if (!dateData[date]) {
      dateData[date] = 0;
    }
    dateData[date] += transaction.type === 'income' ? transaction.amount : -transaction.amount;
  });
  
  // Сортируем по датам
  const sortedDates = Object.keys(dateData).sort((a, b) => {
    return new Date(a.split('.').reverse().join('-')) - new Date(b.split('.').reverse().join('-'));
  });
  
  // Вычисляем накопительный баланс
  let cumulativeBalance = 0;
  const balanceData = sortedDates.map(date => {
    cumulativeBalance += dateData[date];
    return cumulativeBalance;
  });
  
  const ctx = document.getElementById('balanceChart').getContext('2d');
  chartInstances.balanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sortedDates,
      datasets: [{
        label: 'Баланс',
        data: balanceData,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
}

// Инициализация пользователя при загрузке страницы
initializeUser();

// Загрузка транзакций при загрузке страницы
loadTransactions();