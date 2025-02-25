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

let transactions = [];
let filteredTransactions = [];
let isCollapsed = true;

// Добавление транзакции
addTransactionButton.addEventListener('click', () => {
  const transaction = {
    description: descriptionInput.value,
    amount: parseFloat(amountInput.value),
    type: typeInput.value,
    payment: paymentInput.value,
    date: new Date().toISOString()
  };

  db.collection('transactions').add(transaction)
    .then(() => {
      console.log("Транзакция добавлена успешно!");
      loadTransactions();
      descriptionInput.value = '';
      amountInput.value = '';
    })
    .catch((error) => {
      console.error("Ошибка добавления транзакции: ", error);
    });
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
    li.innerHTML = `
      <div class="transaction-description">
        ${transaction.description}
        <span class="transaction-date">${date}</span>
      </div>
      <span>${transaction.amount.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}</span>
      <button class="btn-trash" onclick="deleteTransaction('${transaction.id}')">
        <i class="bi bi-trash"></i>
      </button>
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
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchText);
    const matchesType = type === 'all' || transaction.type === type;
    const transactionDate = new Date(transaction.date).toISOString().split('T')[0];
    const matchesDate = (!startDate || transactionDate >= startDate) && (!endDate || transactionDate <= endDate);
    return matchesSearch && matchesType && matchesDate;
  });

  renderTransactions();
});

// Сброс фильтра
resetFilterButton.addEventListener('click', () => {
  searchInput.value = '';
  filterType.value = 'all';
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

// Загрузка транзакций при загрузке страницы
loadTransactions();