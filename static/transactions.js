// transactions.js
// Load only on transactions.html, after common.js.

let currentPage = 1;
const transactionsPerPage = 10;

function getFilteredTransactions() {
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const type = document.getElementById("typeFilter").value;
  const sort = document.getElementById("sortFilter").value;

  const filtered = transactions.filter(transaction => {
    const matchesSearch = [
      transaction.merchant,
      transaction.category,
      transaction.description,
      transaction.type
    ].some(value => String(value || "").toLowerCase().includes(search));

    const matchesCategory =
      category === "all" || transaction.category === category;

    const matchesType =
      type === "all" || transaction.type === type;

    return matchesSearch && matchesCategory && matchesType;
  });

  filtered.sort((a, b) => {
    if (sort === "oldest") return new Date(a.date) - new Date(b.date);
    if (sort === "highest") return Number(b.amount) - Number(a.amount);
    if (sort === "lowest") return Number(a.amount) - Number(b.amount);

    return new Date(b.date) - new Date(a.date);
  });

  return filtered;
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

function updateSummary() {
  const income = transactions
    .filter(transaction => transaction.type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const expenses = transactions
    .filter(transaction => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  document.getElementById("incomeValue").textContent = euro.format(income);
  document.getElementById("expenseValue").textContent = euro.format(expenses);
  document.getElementById("transactionCount").textContent = transactions.length;
}

function renderTransactions() {
  const tableBody = document.getElementById("transactionTableBody");
  const emptyState = document.getElementById("emptyState");
  const filtered = getFilteredTransactions();
  const totalPages = Math.max(1, Math.ceil(filtered.length / transactionsPerPage));

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const start = (currentPage - 1) * transactionsPerPage;
  const pageTransactions = filtered.slice(start, start + transactionsPerPage);

  tableBody.innerHTML = "";

  pageTransactions.forEach(transaction => {
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
  document.getElementById("visibleTransactionCount").textContent = filtered.length;
  document.getElementById("pageInformation").textContent =
    `Page ${currentPage} of ${totalPages}`;

  document.getElementById("previousPageButton").disabled = currentPage === 1;
  document.getElementById("nextPageButton").disabled = currentPage === totalPages;
}

function resetPageAndRender() {
  currentPage = 1;
  renderTransactions();
}

function clearFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("categoryFilter").value = "all";
  document.getElementById("typeFilter").value = "all";
  document.getElementById("sortFilter").value = "newest";

  resetPageAndRender();
}

function exportTransactions() {
  const filtered = getFilteredTransactions();
  const headings = ["Date", "Merchant", "Category", "Description", "Type", "Amount"];

  const rows = filtered.map(transaction => {
    return [
      transaction.date,
      transaction.merchant || "",
      transaction.category,
      transaction.description || "",
      transaction.type,
      transaction.amount
    ];
  });

  const csv = [headings, ...rows]
    .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const file = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(file);
  link.download = "transactions.csv";
  link.click();

  URL.revokeObjectURL(link.href);
}

function refreshPage() {
  renderCategoryFilter();
  updateSummary();
  renderTransactions();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("searchInput").addEventListener("input", resetPageAndRender);
  document.getElementById("categoryFilter").addEventListener("change", resetPageAndRender);
  document.getElementById("typeFilter").addEventListener("change", resetPageAndRender);
  document.getElementById("sortFilter").addEventListener("change", resetPageAndRender);
  document.getElementById("clearFiltersButton").addEventListener("click", clearFilters);
  document.getElementById("exportButton").addEventListener("click", exportTransactions);

  document.getElementById("previousPageButton").addEventListener("click", () => {
    currentPage--;
    renderTransactions();
  });

  document.getElementById("nextPageButton").addEventListener("click", () => {
    currentPage++;
    renderTransactions();
  });
});
