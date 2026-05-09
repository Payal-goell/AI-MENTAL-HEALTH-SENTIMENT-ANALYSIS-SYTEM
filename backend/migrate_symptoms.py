import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "mindcare.db")

def upgrade_chat_analysis():
    print(f"Connecting to DB at: {DB_PATH}")
    if not os.path.exists(DB_PATH):
        print("Database does not exist yet. Migration not needed.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(chat_analysis)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "physical_symptoms" not in columns:
            print("Adding 'physical_symptoms' column to 'chat_analysis' table...")
            cursor.execute("ALTER TABLE chat_analysis ADD COLUMN physical_symptoms JSON;")
            conn.commit()
            print("Migration successful.")
        else:
            print("Column 'physical_symptoms' already exists.")
            
    except Exception as e:
        print(f"Migration error: {e}")
        
    finally:
        conn.close()

if __name__ == "__main__":
    upgrade_chat_analysis()
