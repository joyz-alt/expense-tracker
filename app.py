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
        )"""
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
    rows = connexion.execute("SELECT DISTINCT category FROM expenses").fetchall()
    return rows

def add_expense(expense):
    connexion = get_database()

    sql = '''   INSERT INTO expenses(date, category, amount, merchant, description) VALUES(?, ?, ?, ?, ?)   '''

    cursor = connexion.execute(sql, expense)            
    connexion.commit()
    return cursor.lastrowid

def update_expense():        
    connexion = get_database()

    update_statement = 'UPDATE expenses SET date=?, amount=?, merchant=?, description=?, category=? WHERE id = ?'
    cursor = connexion.cursor()
    cursor.execute(update_statement, (date, 68, "Chez Auguste", "Pour la vida loca" ,"partying", 1))
    connexion.commit()

def delete_expense(): 
    connexion = get_database()

    cursor = connexion.cursor()
    cursor.execute("DELETE FROM expenses")
    connexion.commit()



@app.route("/") 
@app.route("/index")
def index():
    return render_template("index.html")


@app.route("/api/expenses")
def query_expenses():
    rows = query_all()
    expenses = [dict(row) for row in rows]
    return jsonify(expenses)

@app.route("/api/categories")
def query_category():
    rows = query_categories()
    categories = [dict(row) for row in rows]
    return jsonify(categories)

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

    expense_id = add_expense(expense)

    return jsonify({
        "id": expense_id,
        "message": "Expense added"
    }), 201
"""
@app.route("/api/update")
def update_expense_route():
    rows = update_expense()
    update = [dict(row) for row in rows]
    return jsonify(update)

@app.route("/api/delete")
def delete_expense_route():
    rows = delete_expense()
    delete = [dict(row) for row in rows]
    return jsonify(delete)
"""


if __name__ == "__main__":
    initialise_database()
    serve(app, host="0.0.0.0", port=8000)


