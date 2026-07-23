let cashflowChart;
let categoryChart;
let transactions = [];



function loadExpenses() {

  fetch('/api/expenses').then(response => response.json()).then(data => {
    console.log(data);

    transactions = data.map(expense => {
      return {
        ...expense,
        type: "expense"
      };
    });


    refreshUI();
  })
}

  

function loadCategory() {

  fetch('/api/expenses').then(response => response.json()).then(data => {
    console.log(data);
    const message = document.getElementById('expenseValue');

    const total = data.reduce((sum, expense) => {
      return sum + expense.amount;
    }, 0);

    message.textContent = total;
  })
}




/*function addExpenses(){

  fetch('/api/add').then(response => response.json()).then(data => {
    console.log(data);

    const transactionTableBody = document.getElementById('transactionTableBody');

    transactionTableBody.textContent = expense.data;

  });
  
}
*/

const euro = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR"
});

const els = {
  body: document.body,
  sidebar: document.getElementById("sidebar"),
  menuButton: document.getElementById("menuButton"),
  themeToggle: document.getElementById("themeToggle"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  openModalButton: document.getElementById("openModalButton"),
  closeModalButton: document.getElementById("closeModalButton"),
  cancelModalButton: document.getElementById("cancelModalButton"),
  transactionForm: document.getElementById("transactionForm"),
  tableBody: document.getElementById("transactionTableBody"),
  emptyState: document.getElementById("emptyState"),
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  balanceValue: document.getElementById("balanceValue"),
  incomeValue: document.getElementById("incomeValue"),
  expenseValue: document.getElementById("expenseValue"),
  transactionCount: document.getElementById("transactionCount"),
  categoryLegend: document.getElementById("categoryLegend")
};


function saveTransaction(expense) {
  fetch('/api/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(expense)
  })
}

function openModal() {
  els.modalBackdrop.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  const dateInput = els.transactionForm.elements.date;
  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }
}

function closeModal() {
  els.modalBackdrop.classList.add("hidden");
  document.body.style.overflow = "";
  els.transactionForm.reset();
}

function calculateTotals() {
  const income = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return { income, expenses, balance: income - expenses };
}

function updateStats() {
  const { income, expenses, balance } = calculateTotals();
  els.balanceValue.textContent = euro.format(balance);
  els.incomeValue.textContent = euro.format(income);
  els.expenseValue.textContent = euro.format(expenses);
  els.transactionCount.textContent = transactions.length;
}

function getFilteredTransactions() {
  const search = els.searchInput.value.trim().toLowerCase();
  const category = els.categoryFilter.value;

  return transactions
    .filter(t => {
      const matchesSearch = [
        t.merchant,
        t.category,
        t.description,
        t.type
      ].some(value => String(value).toLowerCase().includes(search));

      const matchesCategory = category === "all" || t.category === category;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

 

function renderTransactions() {
  const filtered = getFilteredTransactions();
  els.tableBody.innerHTML = "";

  filtered.forEach(transaction => {
    const row = document.createElement("tr");
    const signedAmount = transaction.type === "income"
      ? `+${euro.format(transaction.amount)}`
      : `-${euro.format(transaction.amount)}`;

    row.innerHTML = `
      <td>${new Date(transaction.date).toLocaleDateString("en-GB")}</td>
      <td><strong>${escapeHtml(transaction.merchant)}</strong></td>
      <td><span class="badge">${escapeHtml(transaction.category)}</span></td>
      <td>${escapeHtml(transaction.description || "—")}</td>
      <td><span class="badge">${transaction.type}</span></td>
      <td class="amount ${transaction.type}">${signedAmount}</td>
      <td>
        <button class="delete-button" data-delete-id="${transaction.id}" aria-label="Delete transaction">✕</button>
      </td>
    `;

    els.tableBody.appendChild(row);
  });

  els.emptyState.classList.toggle("hidden", filtered.length > 0);
}

function renderCategoryFilter() {
  const currentValue = els.categoryFilter.value;
  const categories = [...new Set(transactions.map(t => t.category))].sort();

  els.categoryFilter.innerHTML = '<option value="all">All categories</option>';
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    els.categoryFilter.appendChild(option);
  });

  if (categories.includes(currentValue)) {
    els.categoryFilter.value = currentValue;
  }
}

function buildCategoryData() {
  const categoryTotals = {};

  transactions
    .filter(t => t.type === "expense")
    .forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
    });

  return Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
}

function renderCharts() {
  const styles = getComputedStyle(document.body);
  const textColor = styles.getPropertyValue("--muted").trim();
  const borderColor = styles.getPropertyValue("--border").trim();
  const primaryColor = styles.getPropertyValue("--primary").trim();
  const positiveColor = styles.getPropertyValue("--positive").trim();
  const negativeColor = styles.getPropertyValue("--negative").trim();

  const income = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  if (cashflowChart) cashflowChart.destroy();
  cashflowChart = new Chart(document.getElementById("cashflowChart"), {
    type: "bar",
    data: {
      labels: ["Current period"],
      datasets: [
        { label: "Income", data: [income], backgroundColor: positiveColor, borderRadius: 8 },
        { label: "Expenses", data: [expenses], backgroundColor: negativeColor, borderRadius: 8 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: textColor } }
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { display: false }
        },
        y: {
          ticks: { color: textColor, callback: value => `€${value}` },
          grid: { color: borderColor }
        }
      }
    }
  });

  const categoryData = buildCategoryData();
  const labels = categoryData.map(([category]) => category);
  const values = categoryData.map(([, total]) => total);
  const palette = [primaryColor, positiveColor, negativeColor, "#f59e0b", "#06b6d4", "#8b5cf6"];

  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(document.getElementById("categoryChart"), {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map((_, index) => palette[index % palette.length]),
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: { display: false }
      }
    }
  });

  els.categoryLegend.innerHTML = categoryData.slice(0, 5).map(([category, total], index) => `
    <div class="legend-row" style="color:${palette[index % palette.length]}">
      <span>${escapeHtml(category)}</span>
      <strong>${euro.format(total)}</strong>
    </div>
  `).join("");
}

function refreshUI() {
  updateStats();
  renderCategoryFilter();
  renderTransactions();
  renderCharts();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

els.openModalButton.addEventListener("click", openModal);
els.closeModalButton.addEventListener("click", closeModal);
els.cancelModalButton.addEventListener("click", closeModal);

els.modalBackdrop.addEventListener("click", event => {
  if (event.target === els.modalBackdrop) closeModal();
});

els.transactionForm.addEventListener("submit", event => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);

  const expense = {
    type: formData.get("type"),
    amount: Number(formData.get("amount")),
    date: formData.get("date"),
    category: formData.get("category").trim(),
    merchant: formData.get("merchant").trim(),
    description: formData.get("description").trim()
  };

  saveTransaction(expense);
  refreshUI();
  closeModal();
});

els.tableBody.addEventListener("click", event => {
  const button = event.target.closest("[data-delete-id]");
  if (!button) return;

  const id = Number(button.dataset.deleteId); 
  transactions = transactions.filter(t => t.id !== id);
  saveTransaction();
  refreshUI();
});

els.searchInput.addEventListener("input", renderTransactions);
els.categoryFilter.addEventListener("change", renderTransactions);

els.themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("expenseTrackerTheme", document.body.classList.contains("dark") ? "dark" : "light");
  renderCharts();
});

els.menuButton.addEventListener("click", () => {
  els.sidebar.classList.toggle("open");
});

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    els.sidebar.classList.remove("open");
  });
});




if (localStorage.getItem("expenseTrackerTheme") === "dark") {
  document.body.classList.add("dark");
}


loadExpenses();

