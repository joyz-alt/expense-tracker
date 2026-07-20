import re
import sqlite3
import argparse
from datetime import datetime
import argparse
import csv

database = "expenses.db"

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


def connect():
    try :
        with sqlite3.connect(database) as conn:
            print(f"Opened SQLite database with version {sqlite3.sqlite_version} successfully.")
            cursor = conn.cursor()
            
            for statement in sql_statements:
                cursor.execute(statement)

            conn.commit()
            print("table created successfuly")

    except sqlite3.OperationalError as e:   
        print("Failed to open database: ", e) 


def add_expense(conn, expense):
    sql = '''   INSERT INTO expenses(date, category, amount, merchant, description)
                VALUES(?, ?, ?, ?, ?)   '''

    cursor = conn.cursor()
    cursor.execute(sql, expense)            
    conn.commit()
    return cursor.lastrowid


date = datetime.now().strftime("%Y-%m-%d")

def main():
    try:
        with sqlite3.connect("expenses.db") as conn:
            expense = (date, "none", 0, "unknown", "description")            
            expensesId = add_expense(conn, expense)
            print(f'Created an expense with the id: {expensesId}')

    except sqlite3.OperationalError as e:
        print(e)



def query():
    try:
        with sqlite3.connect(database) as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM expenses')
            rows = cursor.fetchall()
            for row in rows:
                print(row)
    except sqlite3.OperationalError as e:
        print(e)    

def update():        
    try:
        with sqlite3.connect(database) as conn:
            update_statement = 'UPDATE expenses SET date=?, amount=?, merchant=?, description=?, category=? WHERE id = ?'

            cursor = conn.cursor()
            cursor.execute(update_statement, (date, 68, "Chez Auguste", "Pour la vida loca" ,"partying", 1))
            cursor.execute(update_statement, (date, 52, "leclerc essence", "essence" ,"sport", 2))
            cursor.execute(update_statement, (date, 70, "chaussea", "chaussure de ville" ,"clothes", 3))
            cursor.execute(update_statement, (date, 68, "Chez Auguste", "Pour impressioner la femme de ma vie" ,"partying", 4))
            cursor.execute(update_statement, (date, 90, "culture velo", "reparation velo de route" ,"sport", 5))
            cursor.execute(update_statement, (date, 130, "sonora", "soiree" ,"amusement", 6))
            conn.commit()

    except sqlite3.OperationalError as e:
        print(e)
        

def delete(): 
    try:
        with sqlite3.connect(database) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM expenses")
            conn.commit()
    except sqlite3.OperationalError as e:
        print(e)



def category():
    try:
        with sqlite3.connect(database) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT distinct category FROM expenses")
            rows = cursor.fetchall()
            for row in rows:
                print(row[0])
            
    except sqlite3.OperationalError as e:
        print(e) 

def monthly_spendings_summary():
    try:
        with sqlite3.connect(database) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT sum(amount) from expenses")
            rows = cursor.fetchall()
            for row in rows:
                print("total spent: ", row[0])
    except sqlite3.OperationalError as e:
        print(e)

def largest_expenses():
    try:
        with sqlite3.connect(database) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT max(amount) FROM expenses")
            rows = cursor.fetchone()
            for row in rows:
                print("Largest expense : ", row)
    except sqlite3.OperationalError as e:
        print(e)
        
        
        
export_date = str(date)
def exporter():
    headers = ["id", "date", "category", "amount", "merchant", "description"]
    
    try:
        with sqlite3.connect(database) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM expenses")
            rows = cursor.fetchall()
            csv_file = export_date + "_expenses.csv"
            with open(csv_file, "w", encoding='UTF8', newline='') as f:
                writer = csv.writer(f, quoting=csv.QUOTE_NONNUMERIC)
                header = csv.writer(f)
                header.writerow(headers)
                writer.writerows(rows)
                
    except sqlite3.OperationalError as e:
        print(e)

def importer():
    try:
        with open("new.csv", "rt", newline='') as new_csv:
            reader = csv.reader(new_csv)
            headers = next(reader)
            rows = list(reader)
            with sqlite3.connect(database) as conn:
                cursor = conn.cursor()
                cursor.executemany('''INSERT INTO expenses(date, category, amount, merchant, description)
                                VALUES(?, ?, ?, ?, ?)''', rows)  
            conn.commit()              
            cursor.execute("SELECT * FROM expenses WHERE category=?", ("anniversaire",))
            print(cursor.fetchall())
            
                    
    except sqlite3.OperationalError as e:
        print(e)
                
    

# Argparse Command Line Interface
function_map = {'query' : query,
                'connect': connect,
                'main' : main,
                'update' : update,
                'delete' : delete,
                "category" : category,
                "mss" : monthly_spendings_summary,
                "largest" : largest_expenses,
                "exporter" : exporter,
                "importer" : importer
                }

parser = argparse.ArgumentParser(description="Select a function")
parser.add_argument('command', choices=function_map.keys(),)
args = parser.parse_args()
func = function_map[args.command]
func()