// common.js
// Loaded on BOTH the dashboard and transactions pages.
// Handles API requests, the transaction modal, add/edit/delete, theme and mobile navigation.

window.transactions = [];
window.transactionEditingId = null;

window.euro = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR"
});

window.escapeHtml = function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;

    try {
      const errorData = await response.json();
      message = errorData.message || message;
    } catch {
      // The response did not contain JSON.
    }

    throw new Error(message);
  }

  return response.json();
}


const NEW_CATEGORY_VALUE = "__new_category__";

async function loadCategories(selectedCategory = "") {
  const select = document.getElementById("categorySelect");

  if (!select) return;

  try {
    const categories = await requestJson("/api/categories");

    select.innerHTML = '<option value="">Select a category</option>';

    categories.forEach(category => {
      const option = document.createElement("option");
      option.value = category.name;
      option.textContent = category.name;
      select.appendChild(option);
    });

    const separator = document.createElement("option");
    separator.disabled = true;
    separator.textContent = "──────────";
    select.appendChild(separator);

    const addOption = document.createElement("option");
    addOption.value = NEW_CATEGORY_VALUE;
    addOption.textContent = "+ Add new category…";
    select.appendChild(addOption);

    // This also supports editing an old transaction whose category
    // has not yet been added to the categories table.
    if (
      selectedCategory &&
      !categories.some(category =>
        category.name.toLowerCase() === selectedCategory.toLowerCase()
      )
    ) {
      const existingOption = document.createElement("option");
      existingOption.value = selectedCategory;
      existingOption.textContent = selectedCategory;
      select.insertBefore(existingOption, separator);
    }

    select.value = selectedCategory || "";
  } catch (error) {
    console.error("Loading categories failed:", error);
    select.innerHTML = '<option value="">Could not load categories</option>';
  }
}

async function createCategory(name) {
  return requestJson("/api/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name })
  });
}

function setNewCategoryFieldVisible(visible) {
  const field = document.getElementById("newCategoryField");
  const input = document.getElementById("newCategoryInput");

  if (!field || !input) return;

  field.classList.toggle("hidden", !visible);
  input.required = visible;

  if (visible) {
    input.focus();
  } else {
    input.value = "";
  }
}

window.loadExpenses = async function loadExpenses() {
  try {
    const data = await requestJson("/api/expenses");

    window.transactions = data.map(expense => ({
      ...expense,
      type: expense.type || "expense",
      amount: Number(expense.amount)
    }));

    // Each page defines its own refresh function.
    if (typeof window.refreshPage === "function") {
      window.refreshPage();
    }

    return window.transactions;
  } catch (error) {
    console.error("Loading transactions failed:", error);
    return [];
  }
};

async function saveTransaction(expense) {
  return requestJson("/api/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(expense)
  });
}

async function editTransaction(id, expense) {
  return requestJson("/api/edit", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...expense,
      id
    })
  });
}

async function deleteTransaction(id) {
  return requestJson("/api/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(id)
  });
}

function getModalElements() {
  return {
    backdrop: document.getElementById("modalBackdrop"),
    form: document.getElementById("transactionForm"),
    title: document.getElementById("modalTitle")
  };
}

window.openTransactionModal = async function openTransactionModal(transaction = null) {
  const { backdrop, form, title } = getModalElements();

  if (!backdrop || !form) {
    console.error("Transaction modal elements were not found.");
    return;
  }

  setNewCategoryFieldVisible(false);

  if (transaction) {
    window.transactionEditingId = transaction.id;

    await loadCategories(transaction.category || "");

    form.elements["type"].value = transaction.type || "expense";
    form.elements["amount"].value = transaction.amount;
    form.elements["date"].value = transaction.date;
    form.elements["merchant"].value = transaction.merchant || "";
    form.elements["description"].value = transaction.description || "";

    if (title) title.textContent = "Edit transaction";
  } else {
    window.transactionEditingId = null;
    form.reset();

    await loadCategories();

    if (form.elements["date"]) {
      form.elements["date"].value = new Date().toISOString().split("T")[0];
    }

    if (title) title.textContent = "Add transaction";
  }

  backdrop.classList.remove("hidden");
  document.body.style.overflow = "hidden";
};

window.closeTransactionModal = function closeTransactionModal() {
  const { backdrop, form } = getModalElements();

  if (!backdrop || !form) return;

  backdrop.classList.add("hidden");
  document.body.style.overflow = "";
  form.reset();
  window.transactionEditingId = null;
};

function initialiseModal() {
  const { backdrop, form } = getModalElements();
  const openButton = document.getElementById("openModalButton");
  const closeButton = document.getElementById("closeModalButton");
  const cancelButton = document.getElementById("cancelModalButton");
  const categorySelect = document.getElementById("categorySelect");
  const newCategoryInput = document.getElementById("newCategoryInput");

  if (categorySelect) {
    categorySelect.addEventListener("change", () => {
      setNewCategoryFieldVisible(
        categorySelect.value === NEW_CATEGORY_VALUE
      );
    });
  }

  if (openButton) {
    openButton.addEventListener("click", () => {
      window.openTransactionModal();
    });
  }

  if (closeButton) {
    closeButton.addEventListener("click", window.closeTransactionModal);
  }

  if (cancelButton) {
    cancelButton.addEventListener("click", window.closeTransactionModal);
  }

  if (backdrop) {
    backdrop.addEventListener("click", event => {
      if (event.target === backdrop) {
        window.closeTransactionModal();
      }
    });
  }

  if (form) {
    form.addEventListener("submit", async event => {
      event.preventDefault();

      const formData = new FormData(form);
      let category = String(formData.get("category") || "").trim();
      const merchant = formData.get("merchant");
      const description = formData.get("description");

      try {
        if (category === NEW_CATEGORY_VALUE) {
          const newCategoryName = newCategoryInput
            ? newCategoryInput.value.trim()
            : "";

          if (!newCategoryName) {
            alert("Please enter a category name.");
            return;
          }

          const createdCategory = await createCategory(newCategoryName);
          category = createdCategory.name;

          await loadCategories(category);
          setNewCategoryFieldVisible(false);
        }

        if (!category) {
          alert("Please select a category.");
          return;
        }

        const expense = {
          type: formData.get("type"),
          amount: Number(formData.get("amount")),
          date: formData.get("date"),
          category,
          merchant: merchant ? merchant.trim() : "",
          description: description ? description.trim() : ""
        };

        if (window.transactionEditingId !== null) {
          await editTransaction(window.transactionEditingId, expense);
        } else {
          await saveTransaction(expense);
        }

        window.closeTransactionModal();
        await window.loadExpenses();
      } catch (error) {
        console.error("Saving transaction failed:", error);
        alert("The transaction could not be saved.");
      }
    });
  }
}

function initialiseTransactionActions() {
  document.addEventListener("click", async event => {
    const editButton = event.target.closest("[data-edit-id]");
    const deleteButton = event.target.closest("[data-delete-id]");

    if (editButton) {
      const id = Number(editButton.dataset.editId);
      const transaction = window.transactions.find(item => item.id === id);

      if (!transaction) {
        console.error("Transaction not found:", id);
        return;
      }

      window.openTransactionModal(transaction);
      return;
    }

    if (deleteButton) {
      const id = Number(deleteButton.dataset.deleteId);

      try {
        await deleteTransaction(id);
        await window.loadExpenses();
      } catch (error) {
        console.error("Deleting transaction failed:", error);
        alert("The transaction could not be deleted.");
      }
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

      localStorage.setItem(
        "expenseTrackerTheme",
        document.body.classList.contains("dark") ? "dark" : "light"
      );

      if (typeof window.onThemeChanged === "function") {
        window.onThemeChanged();
      }
    });
  }
}

function initialiseNavigation() {
  const menuButton = document.getElementById("menuButton");
  const sidebar = document.getElementById("sidebar");

  if (menuButton && sidebar) {
    menuButton.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      if (sidebar) sidebar.classList.remove("open");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initialiseModal();
  initialiseTransactionActions();
  initialiseTheme();
  initialiseNavigation();
  loadCategories();
  window.loadExpenses();
});