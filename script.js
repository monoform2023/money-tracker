let cashBalance = 0;
let cardBalance = 0;
let history = [];

// Загрузка данных из localStorage
if (localStorage.getItem("cashBalance")) {
    cashBalance = parseFloat(localStorage.getItem("cashBalance"));
    cardBalance = parseFloat(localStorage.getItem("cardBalance"));
    history = JSON.parse(localStorage.getItem("history"));
    updateBalances();
    updateHistory();
}

function addTransaction() {
    const type = document.getElementById("type").value;
    const method = document.getElementById("method").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const description = document.getElementById("description").value;

    if (isNaN(amount) || amount <= 0) {
        alert("Введите корректную сумму!");
        return;
    }

    if (type === "доход") {
        if (method === "наличные") cashBalance += amount;
        else if (method === "безнал") cardBalance += amount;
    } else if (type === "расход") {
        if (method === "наличные") cashBalance -= amount;
        else if (method === "безнал") cardBalance -= amount;
    }

    const transaction = {
        date: new Date().toLocaleString(),
        type: type,
        method: method,
        amount: amount,
        description: description
    };
    history.push(transaction);

    updateBalances();
    updateHistory();
    saveToLocalStorage();

    document.getElementById("amount").value = "";
    document.getElementById("description").value = "";
}

function updateBalances() {
    document.getElementById("cashBalance").textContent = cashBalance.toFixed(2);
    document.getElementById("cardBalance").textContent = cardBalance.toFixed(2);
    document.getElementById("totalBalance").textContent = (cashBalance + cardBalance).toFixed(2);
}

function updateHistory() {
    const tbody = document.querySelector("#historyTable tbody");
    tbody.innerHTML = "";

    history.forEach((transaction, index) => {
        const row = document.createElement("tr");
        row.classList.add(transaction.type === "доход" ? "income-row" : "expense-row");

        row.innerHTML = `
            <td>${transaction.date.split(",")[0]}</td> <!-- Убираем время -->
            <td>${transaction.method}</td>
            <td>${transaction.amount.toFixed(2)}</td>
            <td>${transaction.description}</td>
            <td><button class="delete-btn" onclick="deleteTransaction(${index})">🗑️</button></td>
        `;
        tbody.appendChild(row);
    });
}

function deleteTransaction(index) {
    const transaction = history[index];
    if (transaction.type === "доход") {
        if (transaction.method === "наличные") cashBalance -= transaction.amount;
        else if (transaction.method === "безнал") cardBalance -= transaction.amount;
    } else if (transaction.type === "расход") {
        if (transaction.method === "наличные") cashBalance += transaction.amount;
        else if (transaction.method === "безнал") cardBalance += transaction.amount;
    }

    history.splice(index, 1);
    updateBalances();
    updateHistory();
    saveToLocalStorage();
}

function applyFiltersAndSearch() {
    const filterType = document.getElementById("filterType").value;
    const filterMethod = document.getElementById("filterMethod").value;
    const searchQuery = document.getElementById("searchQuery").value.toLowerCase();

    const filteredHistory = history.filter(transaction => {
        const matchesType = filterType === "все" || transaction.type === filterType;
        const matchesMethod = filterMethod === "все" || transaction.method === filterMethod;
        const matchesSearch = transaction.description.toLowerCase().includes(searchQuery);
        return matchesType && matchesMethod && matchesSearch;
    });

    const tbody = document.querySelector("#historyTable tbody");
    tbody.innerHTML = "";

    filteredHistory.forEach(transaction => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${transaction.date}</td>
            <td>${transaction.type}</td>
            <td>${transaction.method}</td>
            <td>${transaction.amount.toFixed(2)}</td>
            <td>${transaction.description}</td>
            <td><button class="delete-btn" onclick="deleteTransaction(${history.indexOf(transaction)})">✖</button></td>
        `;
        tbody.appendChild(row);
    });
}

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

function exportToXLSX() {
    const wsData = history.map(transaction => [
        transaction.date,
        transaction.type,
        transaction.method,
        transaction.amount,
        transaction.description
    ]);

    const ws = XLSX.utils.aoa_to_sheet([
        ["Дата", "Тип", "Метод", "Сумма", "Описание"],
        ...wsData
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Транзакции");
    XLSX.writeFile(wb, "transactions.xlsx");
}

function toggleSection(id) {
    const content = document.getElementById(id);
    if (content.style.display === "block") {
        content.style.display = "none";
    } else {
        content.style.display = "block";
    }
}

function saveToLocalStorage() {
    localStorage.setItem("cashBalance", cashBalance);
    localStorage.setItem("cardBalance", cardBalance);
    localStorage.setItem("history", JSON.stringify(history));
}