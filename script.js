// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCxDMO5lChjHai2hjAk4QB0MRzPlpU37Xc",
  authDomain: "money-tracker-d35c7.firebaseapp.com",
  projectId: "money-tracker-d35c7",
  storageBucket: "money-tracker-d35c7.firebasestorage.app",
  messagingSenderId: "145469004313",
  appId: "1:145469004313:web:31c32c771bf3250d5ca888"
};

// Инициализация Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let cashBalance = 0;
let cardBalance = 0;

// Загрузка данных из Firebase
function loadData() {
    const transactionsRef = database.ref('transactions');
    transactionsRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            history = Object.values(data);
            updateBalances();
            updateHistory();
        }
    });
}

// Добавление транзакции
function addTransaction() {
    const type = document.getElementById("type").value;
    const method = document.getElementById("method").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const description = document.getElementById("description").value;

    if (isNaN(amount) || amount <= 0) {
        alert("Введите корректную сумму!");
        return;
    }

    const transaction = {
        date: new Date().toLocaleString(),
        type: type,
        method: method,
        amount: amount,
        description: description
    };

    // Сохранение в Firebase
    const transactionsRef = database.ref('transactions');
    transactionsRef.push(transaction);

    // Очистка формы
    document.getElementById("amount").value = "";
    document.getElementById("description").value = "";
}

// Обновление балансов
function updateBalances() {
    cashBalance = 0;
    cardBalance = 0;

    history.forEach(transaction => {
        if (transaction.type === "доход") {
            if (transaction.method === "наличные") cashBalance += transaction.amount;
            else if (transaction.method === "безнал") cardBalance += transaction.amount;
        } else if (transaction.type === "расход") {
            if (transaction.method === "наличные") cashBalance -= transaction.amount;
            else if (transaction.method === "безнал") cardBalance -= transaction.amount;
        }
    });

    document.getElementById("cashBalance").textContent = cashBalance.toFixed(2);
    document.getElementById("cardBalance").textContent = cardBalance.toFixed(2);
    document.getElementById("totalBalance").textContent = (cashBalance + cardBalance).toFixed(2);
}

// Обновление истории
function updateHistory() {
    const tbody = document.querySelector("#historyTable tbody");
    tbody.innerHTML = "";

    history.forEach((transaction, index) => {
        const row = document.createElement("tr");
        row.classList.add(transaction.type === "доход" ? "income-row" : "expense-row");

        row.innerHTML = `
            <td>${transaction.date.split(",")[0]}</td>
            <td>${transaction.method}</td>
            <td>${transaction.amount.toFixed(2)}</td>
            <td>${transaction.description}</td>
            <td><button class="delete-btn" onclick="deleteTransaction('${transaction.id}')">🗑️</button></td>
        `;
        tbody.appendChild(row);
    });
}

// Удаление транзакции
function deleteTransaction(id) {
    const transactionRef = database.ref(`transactions/${id}`);
    transactionRef.remove();
}

// Анализ по датам
function analyzeByDateRange() {
    const startDate = new Date(document.getElementById("startDate").value);
    const endDate = new Date(document.getElementById("endDate").value);

    if (isNaN(startDate) || isNaN(endDate)) {
        alert("Выберите корректный диапазон дат!");
        return;
    }

    const analysis = { доход: 0, расход: 0 };
    history.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        if (transactionDate >= startDate && transactionDate <= endDate) {
            analysis[transaction.type] += transaction.amount;
        }
    });

    const result = `
        <h3>Анализ за период</h3>
        <p>Доход: ${analysis.доход.toFixed(2)}</p>
        <p>Расход: ${analysis.расход.toFixed(2)}</p>
    `;
    document.getElementById("analysisResult").innerHTML = result;
}

// Загрузка данных при запуске
loadData();