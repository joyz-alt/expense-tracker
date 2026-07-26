// dashboard.js
// Load only on index.html, after common.js.

let cashflowChart;
let categoryChart;

function calculateTotals() {
  const income = transactions
    .filter(transaction => transaction.type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const expenses = transactions
    .filter(transaction => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  return {
    income: income,
    expenses: expenses,
    balance: income - expenses
  };
}

function updateStats() {
  const balanceValue = document.getElementById("balanceValue");
  const incomeValue = document.getElementById("incomeValue");
  const expenseValue = document.getElementById("expenseValue");
  const transactionCount = document.getElementById("transactionCount");
  const totals = calculateTotals();

  balanceValue.textContent = euro.format(totals.balance);
  incomeValue.textContent = euro.format(totals.income);
  expenseValue.textContent = euro.format(totals.expenses);
  transactionCount.textContent = transactions.length;
}

function getFilteredTransactions() {
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const search = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;

  return transactions
    .filter(transaction => {
      const matchesSearch = [
        transaction.merchant,
        transaction.category,
        transaction.description,
        transaction.type
      ].some(value => String(value || "").toLowerCase().includes(search));

      const matchesCategory =
        category === "all" || transaction.category === category;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
}

function renderTransactions() {
  const tableBody = document.getElementById("transactionTableBody");
  const emptyState = document.getElementById("emptyState");
  const filtered = getFilteredTransactions();

  tableBody.innerHTML = "";

  filtered.forEach(transaction => {
    const row = document.createElement("tr");
    const signedAmount = transaction.type === "income"
      ? `+${euro.format(transaction.amount)}`
      : `-${euro.format(transaction.amount)}`;

    row.innerHTML = `
      <td>${new Date(transaction.date).toLocaleDateString("en-GB")}</td>
      <td><strong>${escapeHtml(transaction.merchant || "—")}</strong></td>
      <td><span class="badge">${escapeHtml(transaction.category)}</span></td>
      <td>${escapeHtml(transaction.description || "—")}</td>
      <td><span class="badge">${escapeHtml(transaction.type)}</span></td>
      <td class="amount ${transaction.type}">${signedAmount}</td>
      <td class="transaction-actions">
        <button class="edit-button" data-edit-id="${transaction.id}" title="Edit transaction">✏️</button>
        <button class="delete-button" data-delete-id="${transaction.id}" title="Delete transaction">🗑</button>
      </td>
    `;

    tableBody.appendChild(row);
  });

  emptyState.classList.toggle("hidden", filtered.length > 0);
}

function renderCategoryFilter() {
  const categoryFilter = document.getElementById("categoryFilter");
  const currentValue = categoryFilter.value;
  const availableCategories = [...new Set([
    ...categories,
    ...transactions.map(transaction => transaction.category)
  ])].filter(Boolean).sort();

  categoryFilter.innerHTML = '<option value="all">All categories</option>';

  availableCategories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  if (availableCategories.includes(currentValue)) {
    categoryFilter.value = currentValue;
  }
}

function buildCategoryData() {
  const totals = {};

  transactions
    .filter(transaction => transaction.type === "expense")
    .forEach(transaction => {
      totals[transaction.category] =
        (totals[transaction.category] || 0) + Number(transaction.amount);
    });

  return Object.entries(totals).sort((a, b) => b[1] - a[1]);
}

function renderCharts() {
  const styles = getComputedStyle(document.body);
  const textColor = styles.getPropertyValue("--muted").trim();
  const borderColor = styles.getPropertyValue("--border").trim();
  const primaryColor = styles.getPropertyValue("--primary").trim();
  const positiveColor = styles.getPropertyValue("--positive").trim();
  const negativeColor = styles.getPropertyValue("--negative").trim();
  const totals = calculateTotals();

  if (cashflowChart) cashflowChart.destroy();

  cashflowChart = new Chart(document.getElementById("cashflowChart"), {
    type: "bar",
    data: {
      labels: ["Current period"],
      datasets: [
        {
          label: "Income",
          data: [totals.income],
          backgroundColor: positiveColor,
          borderRadius: 8
        },
        {
          label: "Expenses",
          data: [totals.expenses],
          backgroundColor: negativeColor,
          borderRadius: 8
        }
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
          ticks: {
            color: textColor,
            callback: value => `€${value}`
          },
          grid: { color: borderColor }
        }
      }
    }
  });

  const categoryData = buildCategoryData();
  const labels = categoryData.map(item => item[0]);
  const values = categoryData.map(item => item[1]);
  const palette = [
    primaryColor,
    positiveColor,
    negativeColor,
    "#f59e0b",
    "#06b6d4",
    "#8b5cf6"
  ];

  if (categoryChart) categoryChart.destroy();

  categoryChart = new Chart(document.getElementById("categoryChart"), {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map((label, index) => palette[index % palette.length]),
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

  const categoryLegend = document.getElementById("categoryLegend");

  categoryLegend.innerHTML = categoryData
    .slice(0, 5)
    .map((item, index) => {
      return `
        <div class="legend-row" style="color:${palette[index % palette.length]}">
          <span>${escapeHtml(item[0])}</span>
          <strong>${euro.format(item[1])}</strong>
        </div>
      `;
    })
    .join("");
}

function refreshPage() {
  updateStats();
  renderCategoryFilter();
  renderTransactions();
  renderCharts();
}

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");

  searchInput.addEventListener("input", renderTransactions);
  categoryFilter.addEventListener("change", renderTransactions);
});
