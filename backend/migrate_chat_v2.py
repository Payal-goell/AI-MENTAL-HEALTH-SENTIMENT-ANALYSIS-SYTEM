import sqlite3
import os

DB_PATH = 'd:/MindCare-AI/backend/mindcare.db'

def migrate():
    if not os.path.exists(DB_PATH):
        print("Database not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    new_cols = [
        ("impact_on_daily_life", "BOOLEAN"),
        ("emotions", "JSON"),
        ("coping_strategy", "TEXT"),
        ("support_available", "BOOLEAN"),
        ("overall_assessment", "VARCHAR(200)")
    ]
    
    cursor.execute("PRAGMA table_info(chat_analysis)")
    existing_cols = [col[1] for col in cursor.fetchall()]
    
    for col_name, col_type in new_cols:
        if col_name not in existing_cols:
            print(f"Adding column {col_name}...")
            cursor.execute(f"ALTER TABLE chat_analysis ADD COLUMN {col_name} {col_type}")
    
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
