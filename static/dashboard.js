// dashboard.js
// Loaded ONLY on index.html.
// Handles dashboard statistics, the recent-transactions table and charts.

let cashflowChart;
let categoryChart;

function calculateTotals() {
  const income = window.transactions
    .filter(transaction => transaction.type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const expenses = window.transactions
    .filter(transaction => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  return {
    income,
    expenses,
    balance: income - expenses
  };
}

function updateStats() {
  const balanceValue = document.getElementById("balanceValue");
  const incomeValue = document.getElementById("incomeValue");
  const expenseValue = document.getElementById("expenseValue");
  const transactionCount = document.getElementById("transactionCount");

  const { income, expenses, balance } = calculateTotals();

  if (balanceValue) balanceValue.textContent = window.euro.format(balance);
  if (incomeValue) incomeValue.textContent = window.euro.format(income);
  if (expenseValue) expenseValue.textContent = window.euro.format(expenses);
  if (transactionCount) transactionCount.textContent = window.transactions.length;
}

function renderRecentTransactions() {
  const tableBody = document.getElementById("transactionTableBody");
  const emptyState = document.getElementById("emptyState");

  if (!tableBody) return;

  const recentTransactions = [...window.transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  tableBody.innerHTML = "";

  recentTransactions.forEach(transaction => {
    const row = document.createElement("tr");
    const signedAmount = transaction.type === "income"
      ? `+${window.euro.format(transaction.amount)}`
      : `-${window.euro.format(transaction.amount)}`;

    row.innerHTML = `
      <td>${new Date(transaction.date).toLocaleDateString("en-GB")}</td>
      <td><strong>${window.escapeHtml(transaction.merchant || "—")}</strong></td>
      <td><span class="badge">${window.escapeHtml(transaction.category)}</span></td>
      <td>${window.escapeHtml(transaction.description || "—")}</td>
      <td><span class="badge">${window.escapeHtml(transaction.type)}</span></td>
      <td class="amount ${transaction.type}">${signedAmount}</td>
      <td class="transaction-actions">
        <button class="edit-button" data-edit-id="${transaction.id}" title="Edit transaction">✏️</button>
        <button class="delete-button" data-delete-id="${transaction.id}" title="Delete transaction">🗑</button>
      </td>
    `;

    tableBody.appendChild(row);
  });

  if (emptyState) {
    emptyState.classList.toggle("hidden", recentTransactions.length > 0);
  }
}

function buildCategoryData() {
  const totals = {};

  window.transactions
    .filter(transaction => transaction.type === "expense")
    .forEach(transaction => {
      totals[transaction.category] =
        (totals[transaction.category] || 0) + Number(transaction.amount);
    });

  return Object.entries(totals).sort((a, b) => b[1] - a[1]);
}

function renderCharts() {
  const cashflowCanvas = document.getElementById("cashflowChart");
  const categoryCanvas = document.getElementById("categoryChart");
  const categoryLegend = document.getElementById("categoryLegend");

  if (typeof Chart === "undefined") return;

  const styles = getComputedStyle(document.body);
  const textColor = styles.getPropertyValue("--muted").trim();
  const borderColor = styles.getPropertyValue("--border").trim();
  const primaryColor = styles.getPropertyValue("--primary").trim();
  const positiveColor = styles.getPropertyValue("--positive").trim();
  const negativeColor = styles.getPropertyValue("--negative").trim();

  const { income, expenses } = calculateTotals();

  if (cashflowCanvas) {
    if (cashflowChart) cashflowChart.destroy();

    cashflowChart = new Chart(cashflowCanvas, {
      type: "bar",
      data: {
        labels: ["Current period"],
        datasets: [
          {
            label: "Income",
            data: [income],
            backgroundColor: positiveColor,
            borderRadius: 8
          },
          {
            label: "Expenses",
            data: [expenses],
            backgroundColor: negativeColor,
            borderRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: textColor }
          }
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
  }

  const categoryData = buildCategoryData();
  const labels = categoryData.map(([category]) => category);
  const values = categoryData.map(([, total]) => total);
  const palette = [
    primaryColor,
    positiveColor,
    negativeColor,
    "#f59e0b",
    "#06b6d4",
    "#8b5cf6"
  ];

  if (categoryCanvas) {
    if (categoryChart) categoryChart.destroy();

    categoryChart = new Chart(categoryCanvas, {
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
  }

  if (categoryLegend) {
    categoryLegend.innerHTML = categoryData
      .slice(0, 5)
      .map(([category, total], index) => `
        <div class="legend-row" style="color:${palette[index % palette.length]}">
          <span>${window.escapeHtml(category)}</span>
          <strong>${window.euro.format(total)}</strong>
        </div>
      `)
      .join("");
  }
}

window.refreshPage = function refreshDashboard() {
  updateStats();
  renderRecentTransactions();
  renderCharts();
};

window.onThemeChanged = renderCharts;
