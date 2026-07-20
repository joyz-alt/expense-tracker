# Expense Tracker Web App — TODO

## Current Goal

Replace browser `localStorage` with a Flask + SQLite backend, then connect frontend buttons to database queries.

---

## Phase 1 — Serve the Frontend with Flask

- [ ] Create or update `app.py`
- [ ] Add a Flask route for `/`
- [ ] Use `render_template()` to display the dashboard
- [ ] Move `index.html` into a `templates/` folder
- [ ] Move `styles.css` and `script.js` into a `static/` folder
- [ ] Update the HTML links with `url_for()`
- [ ] Run the project with Flask instead of `python3 -m http.server`

### Research

- `Flask render_template tutorial`
- `Flask static files CSS JavaScript`
- `Flask project structure templates static`

---

## Phase 2 — Store Transactions in SQLite

- [ ] Create an SQLite database file
- [ ] Create a `transactions` table
- [ ] Add columns for:
  - [ ] `id`
  - [ ] `date`
  - [ ] `category`
  - [ ] `amount`
  - [ ] `merchant`
  - [ ] `description`
  - [ ] `type`
- [ ] Move any hardcoded demo transactions into SQLite
- [ ] Test a basic `SELECT * FROM transactions` query in Python
- [ ] Use `sqlite3.Row` so rows are easier to convert to dictionaries

### Research

- `Flask SQLite tutorial sqlite3`
- `Python sqlite3 Row dictionary`
- `SQLite CREATE TABLE transactions`
- `Flask SQLite connection best practices`

---

## Phase 3 — Create a Transactions API

- [ ] Create a Flask route:

```text
GET /api/transactions
```

- [ ] Query all transactions from SQLite
- [ ] Convert the rows into dictionaries
- [ ] Return the result using `jsonify()`
- [ ] Test the route directly in the browser

### Research

- `Flask REST API GET route tutorial`
- `Flask jsonify SQLite`
- `Python SQLite rows to JSON`

---

## Phase 4 — Load Transactions with JavaScript

- [ ] Remove the hardcoded `initialTransactions` array
- [ ] Stop reading transactions from `localStorage`
- [ ] Create a JavaScript function such as `loadTransactions()`
- [ ] Use `fetch("/api/transactions")`
- [ ] Convert the response with `response.json()`
- [ ] Store the returned data in the `transactions` JavaScript variable
- [ ] Reuse the existing table-rendering function

### Research

- `JavaScript fetch API GET JSON tutorial`
- `JavaScript fetch Flask API`
- `async await fetch example`

---

## Phase 5 — Sort Transactions by Date

- [ ] Add a “Newest first” button
- [ ] Add an “Oldest first” button
- [ ] Add JavaScript click event listeners
- [ ] Make the buttons request:

```text
/api/transactions?sort=date&order=desc
```

and:

```text
/api/transactions?sort=date&order=asc
```

- [ ] Read query parameters in Flask using `request.args`
- [ ] Use SQLite `ORDER BY date ASC`
- [ ] Use SQLite `ORDER BY date DESC`
- [ ] Refresh the table after each request

### Research

- `JavaScript button addEventListener click`
- `Flask query parameters request.args`
- `JavaScript fetch URL query parameters`
- `SQLite ORDER BY date ascending descending`

---

## Phase 6 — Make Sorting Safe

- [ ] Do not insert raw user input directly into an SQL query
- [ ] Create an allowlist for sortable columns
- [ ] Create an allowlist for `ASC` and `DESC`
- [ ] Use safe defaults when parameters are invalid

Example idea:

```python
allowed_sort_columns = {
    "date": "date",
    "amount": "amount",
    "category": "category"
}
```

### Research

- `SQL injection dynamic ORDER BY allowlist`
- `Flask validate query parameters`
- `SQLite parameterized queries`

---

## Phase 7 — Add More Sorting and Filtering

After date sorting works:

- [ ] Sort by amount
- [ ] Sort by category
- [ ] Filter by category
- [ ] Filter by income or expense
- [ ] Search by merchant
- [ ] Filter between two dates

Possible API requests:

```text
/api/transactions?sort=amount&order=desc
/api/transactions?category=Food
/api/transactions?type=expense
/api/transactions?merchant=Leclerc
```

### Research

- `Flask multiple query parameters`
- `SQLite WHERE clause filters`
- `JavaScript URLSearchParams tutorial`

---

## Phase 8 — Add and Delete Transactions Through Flask

- [ ] Create a `POST /api/transactions` route
- [ ] Send the transaction form using `fetch()`
- [ ] Insert the new transaction into SQLite
- [ ] Reload the transaction list after insertion
- [ ] Create a `DELETE /api/transactions/<id>` route
- [ ] Connect the existing delete button to the Flask route
- [ ] Remove the old `localStorage` save and delete code

### Research

- `Flask POST JSON request tutorial`
- `JavaScript fetch POST JSON`
- `Flask DELETE route`
- `SQLite INSERT DELETE Python`

---

## Recommended Project Structure

```text
expense-tracker/
├── app.py
├── expenses.db
├── templates/
│   └── index.html
└── static/
    ├── styles.css
    └── script.js
```

---

## First Milestone

Do not build every feature immediately.

Complete only these steps first:

- [ ] Flask displays the dashboard
- [ ] SQLite contains transaction data
- [ ] `GET /api/transactions` returns JSON
- [ ] JavaScript displays the returned transactions
- [ ] “Newest first” works
- [ ] “Oldest first” works

Once this milestone works, commit it to Git.

Suggested commit message:

```text
Connect transaction dashboard to Flask and SQLite
```