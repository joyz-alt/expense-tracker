from flask import Flask, render_template, g, jsonify, request
from waitress import serve
import sqlite3
from pathlib import Path
from datetime import datetime


app = Flask(__name__) #initializes the flask app
BASE_DIR = Path(__file__).resolve().parent

database = BASE_DIR / "expenses.db"

date = datetime.now().strftime("%Y-%m-%d")


sql_statements = [
    """CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY,
        date DATE,
        category TEXT,
        amount REAL,
        merchant TEXT,
        description TEXT
    )""",
    """CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE
    )"""
]

DEFAULT_CATEGORIES = [
    "Food",
    "Transport",
    "Shopping",
    "Sport",
    "Entertainment",
    "Housing",
    "Utilities",
    "Health",
    "Salary",
    "Investment",
    "Gift",
    "Other",
]


def get_database():
    if "sqlite_db" not in g:        
        g.sqlite_db = sqlite3.connect(database)
        g.sqlite_db.row_factory = sqlite3.Row
    return g.sqlite_db


def initialise_database():
    conn = sqlite3.connect(database)

    try :
        print(f"Opened SQLite database with version {sqlite3.sqlite_version} successfully.")
        cursor = conn.cursor()
            
        for statement in sql_statements:
            cursor.execute(statement)

        # Add the default choices without creating duplicates.
        cursor.executemany(
            "INSERT OR IGNORE INTO categories(name) VALUES(?)",
            [(category,) for category in DEFAULT_CATEGORIES]
        )

        # Preserve categories already used by existing transactions.
        cursor.execute("""
            INSERT OR IGNORE INTO categories(name)
            SELECT DISTINCT TRIM(category)
            FROM expenses
            WHERE category IS NOT NULL
              AND TRIM(category) != ''
        """)

        conn.commit()
        print("table created successfuly")

    except sqlite3.Error as e:   
        print("Failed to initialise database: ", e) 
        raise

    finally:
        conn.close()

@app.teardown_appcontext
def close_database(error=None):
    connection = g.pop("sqlite_db", None)

    if connection is not None:
        connection.close()





def query_all():
    connexion = get_database()
    rows = connexion.execute('SELECT * FROM expenses').fetchall()
    return rows

def query_categories():
    connexion = get_database()
    return connexion.execute(
        "SELECT id, name FROM categories ORDER BY name COLLATE NOCASE"
    ).fetchall()

def add_category(name):
    connexion = get_database()
    cleaned_name = name.strip()

    if not cleaned_name:
        raise ValueError("Category name is required")

    connexion.execute(
        "INSERT OR IGNORE INTO categories(name) VALUES(?)",
        (cleaned_name,)
    )
    connexion.commit()

    return connexion.execute(
        "SELECT id, name FROM categories WHERE name = ? COLLATE NOCASE",
        (cleaned_name,)
    ).fetchone()

def add_expense(expense):
    connexion = get_database()

    sql = '''   INSERT INTO expenses(date, category, amount, merchant, description) VALUES(?, ?, ?, ?, ?)   '''

    cursor = connexion.execute(sql, expense)            
    connexion.commit()
    return cursor.lastrowid

def edit_expense(edit):
    connexion = get_database()

    update_statement = """
        UPDATE expenses
        SET date=?, amount=?, merchant=?, description=?, category=?
        WHERE id=?
    """
    cursor = connexion.execute(update_statement, edit)
    connexion.commit()
    return cursor.rowcount

def delete_expense(id): 
    connexion = get_database()

    cursor = connexion.cursor()
    delete = cursor.execute("DELETE FROM expenses WHERE id=?", (id,))
    
    connexion.commit()
    return delete



@app.route("/") 
@app.route("/index")
def index():
    return render_template("index.html")


@app.route("/api/expenses")
def query_expenses():
    rows = query_all()
    expenses = [dict(row) for row in rows]
    return jsonify(expenses)

@app.route("/api/categories", methods=["GET", "POST"])
def categories_route():
    if request.method == "GET":
        rows = query_categories()
        return jsonify([dict(row) for row in rows])

    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()

    if not name:
        return jsonify({"message": "Category name is required"}), 400

    if len(name) > 50:
        return jsonify({"message": "Category name must be 50 characters or fewer"}), 400

    try:
        category = add_category(name)
    except ValueError as error:
        return jsonify({"message": str(error)}), 400
    except sqlite3.Error:
        app.logger.exception("Could not save category")
        return jsonify({"message": "Could not save category"}), 500

    return jsonify(dict(category)), 201

@app.route("/api/add", methods=["POST"])
def add_expense_route():
    data = request.get_json() 
    
    expense = (
        data["date"],
        data["category"],
        data["amount"],
        data.get("merchant"),
        data.get("description"),
    )

    add_category(data["category"])
    expense_id = add_expense(expense)

    return jsonify({
        "id": expense_id,
        "message": "Expense added"
    }), 201

@app.route("/api/edit", methods=["PUT"])
def edit_expense_route():
    data = request.get_json()

    edit = (
        data["date"],
        data["amount"],
        data.get("merchant"),
        data.get("description"),
        data["category"],
        data["id"],
    )

    add_category(data["category"])
    updated_rows = edit_expense(edit)

    if updated_rows == 0:
        return jsonify({"message": "Transaction not found"}), 404

    return jsonify({
        "id": data["id"],
        "message": "Transaction has been edited"
    }), 200


@app.route("/api/delete", methods=["POST"])
def delete_expense_route():
    id = request.get_json()
    delete_expense(id)
    return jsonify({
        "id": id,
        "message": "Transaction deleted"
    }), 201
    
    
@app.route("/transactions")
def transactions_page():
    return render_template("transactions.html")


if __name__ == "__main__":
    initialise_database()
    serve(app, host="0.0.0.0", port=8000)

