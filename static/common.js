// common.js
// Load this file first on both pages.
// Shared data, fetch requests, modal, add/edit/delete, theme and mobile menu.

let transactions = [];
let categories = [];
let transactionEditingId = null;

const euro = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR"
});

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}



function loadCategories() {
  fetch("/api/categories")
    .then(response => {
      if (!response.ok) {
        throw new Error("Could not load categories");
      }

      return response.json();
    })
    .then(data => {
      categories = data;

      populateCategoryInput();
      refreshPage();
    })
    .catch(error => {
      console.error("Could not load categories:", error);
    });
}



function populateCategoryInput() {
  const categorySelect = document.getElementById("categorySelect");

  if (!categorySelect) {
    return;
  }

  categorySelect.innerHTML =
    '<option value="">Choose a category</option>';

  categories.forEach(category => {
    const option = document.createElement("option");

    option.value = category.name;
    option.textContent = category.name;

    categorySelect.appendChild(option);
  });
}


function loadExpenses() {
  fetch("/api/expenses")
    .then(response => {
      if (!response.ok) {
        throw new Error("Could not load transactions");
      }

      return response.json();
    })
    .then(data => {
      transactions = data.map(expense => {
        return {
          ...expense,
          amount: Number(expense.amount),
          type: expense.type || "expense"
        };
      });

      refreshPage();
    })
    .catch(error => {
      console.error("Could not load transactions:", error);
    });
}

function reloadData() {
  loadCategories();
  loadExpenses();
}

function saveTransaction(transaction) {
  fetch("/api/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(transaction)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Could not save transaction");
      }

      return response.json();
    })
    .then(data => {
      console.log(data.message);
      closeModal();
      reloadData();
    })
    .catch(error => {
      console.error("Could not save transaction:", error);
    });
}

function updateTransaction(id, transaction) {
  fetch("/api/edit", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      id: id,
      ...transaction
    })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Could not update transaction");
      }

      return response.json();
    })
    .then(data => {
      console.log(data.message);
      closeModal();
      reloadData();
    })
    .catch(error => {
      console.error("Could not update transaction:", error);
    });
}

function deleteTransaction(id) {
  fetch("/api/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(id)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Could not delete transaction");
      }

      return response.json();
    })
    .then(data => {
      console.log(data.message);
      reloadData();
    })
    .catch(error => {
      console.error("Could not delete transaction:", error);
    });
}

function openModal(transaction = null) {
  const modalBackdrop = document.getElementById("modalBackdrop");
  const transactionForm = document.getElementById("transactionForm");
  const modalTitle = document.getElementById("modalTitle");

  if (!modalBackdrop || !transactionForm) return;

  transactionForm.reset();
  populateCategoryInput();

  if (transaction) {
    transactionEditingId = transaction.id;

    transactionForm.elements.type.value = transaction.type || "expense";
    transactionForm.elements.amount.value = transaction.amount;
    transactionForm.elements.date.value = transaction.date;
    document.getElementById("categorySelect").value = transaction.category;
    transactionForm.elements.merchant.value = transaction.merchant || "";
    transactionForm.elements.description.value = transaction.description || "";

    if (modalTitle) modalTitle.textContent = "Edit transaction";
  } else {
    transactionEditingId = null;
    transactionForm.elements.date.value = new Date().toISOString().split("T")[0];

    if (modalTitle) modalTitle.textContent = "Add transaction";
  }

  modalBackdrop.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modalBackdrop = document.getElementById("modalBackdrop");
  const transactionForm = document.getElementById("transactionForm");

  if (!modalBackdrop || !transactionForm) return;

  modalBackdrop.classList.add("hidden");
  document.body.style.overflow = "";
  transactionForm.reset();
  transactionEditingId = null;
}

function initialiseModal() {
  const openModalButton = document.getElementById("openModalButton");
  const emptyStateAddButton = document.getElementById("emptyStateAddButton");
  const closeModalButton = document.getElementById("closeModalButton");
  const cancelModalButton = document.getElementById("cancelModalButton");
  const modalBackdrop = document.getElementById("modalBackdrop");
  const transactionForm = document.getElementById("transactionForm");

  if (openModalButton) {
    openModalButton.addEventListener("click", () => openModal());
  }

  if (emptyStateAddButton) {
    emptyStateAddButton.addEventListener("click", () => openModal());
  }

  if (closeModalButton) {
    closeModalButton.addEventListener("click", closeModal);
  }

  if (cancelModalButton) {
    cancelModalButton.addEventListener("click", closeModal);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", event => {
      if (event.target === modalBackdrop) {
        closeModal();
      }
    });
  }

  if (transactionForm) {
    transactionForm.addEventListener("submit", event => {
      event.preventDefault();

      const formData = new FormData(transactionForm);

      const transaction = {
        type: formData.get("type"),
        amount: Number(formData.get("amount")),
        date: formData.get("date"),
        category: formData.get("category").trim(),
        merchant: formData.get("merchant").trim(),
        description: formData.get("description").trim()
      };

      if (transactionEditingId === null) {
        saveTransaction(transaction);
      } else {
        updateTransaction(transactionEditingId, transaction);
      }
    });
  }
}

function initialiseTransactionButtons() {
  document.addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit-id]");
    const deleteButton = event.target.closest("[data-delete-id]");

    if (editButton) {
      const id = Number(editButton.dataset.editId);
      const transaction = transactions.find(item => item.id === id);

      if (transaction) {
        openModal(transaction);
      }
    }

    if (deleteButton) {
      const id = Number(deleteButton.dataset.deleteId);
      deleteTransaction(id);
    }
  });
}

function initialiseTheme() {
  const themeToggle = document.getElementById("themeToggle");

  if (localStorage.getItem("expenseTrackerTheme") === "dark") {
    document.body.classList.add("dark");
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark");

      const theme = document.body.classList.contains("dark")
        ? "dark"
        : "light";

      localStorage.setItem("expenseTrackerTheme", theme);

      if (typeof renderCharts === "function") {
        renderCharts();
      }
    });
  }
}

function initialiseMenu() {
  const menuButton = document.getElementById("menuButton");
  const sidebar = document.getElementById("sidebar");

  if (menuButton && sidebar) {
    menuButton.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  initialiseModal();
  initialiseTheme();
  initialiseMenu();
  initialiseTransactionButtons();

  loadCategories();
  loadExpenses();
});