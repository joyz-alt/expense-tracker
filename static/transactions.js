// transactions.js
// Loaded ONLY on transactions.html.
// Handles the full transaction table, search and category filtering.

function getFilteredTransactions() {
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");

  const search = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";

  const selectedCategory = categoryFilter
    ? categoryFilter.value
    : "all";

  return [...window.transactions]
    .filter(transaction => {
      const searchableValues = [
        transaction.merchant,
        transaction.category,
        transaction.description,
        transaction.type
      ];

      const matchesSearch = searchableValues.some(value =>
        String(value ?? "").toLowerCase().includes(search)
      );

      const matchesCategory =
        selectedCategory === "all" ||
        transaction.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderCategoryFilter() {
  const categoryFilter = document.getElementById("categoryFilter");
  if (!categoryFilter) return;

  const previousValue = categoryFilter.value;
  const categories = [
    ...new Set(window.transactions.map(transaction => transaction.category))
  ].sort();

  categoryFilter.innerHTML =
    '<option value="all">All categories</option>';

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  if (categories.includes(previousValue)) {
    categoryFilter.value = previousValue;
  }
}

function renderTransactions() {
  const tableBody = document.getElementById("transactionTableBody");
  const emptyState = document.getElementById("emptyState");

  if (!tableBody) return;

  const filteredTransactions = getFilteredTransactions();
  tableBody.innerHTML = "";

  filteredTransactions.forEach(transaction => {
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
    emptyState.classList.toggle("hidden", filteredTransactions.length > 0);
  }
}

window.refreshPage = function refreshTransactionsPage() {
  renderCategoryFilter();
  renderTransactions();
};

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");

  if (searchInput) {
    searchInput.addEventListener("input", renderTransactions);
  }

  if (categoryFilter) {
    categoryFilter.addEventListener("change", renderTransactions);
  }
});
