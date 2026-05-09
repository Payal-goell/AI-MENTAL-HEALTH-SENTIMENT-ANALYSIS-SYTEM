import sqlite3
import os

def migrate_database():
    db_path = "mindcare.db"
    
    if not os.path.exists(db_path):
        print(f"Error: Could not find database file at {db_path}")
        return
        
    print(f"Connecting to database: {db_path}...")
    
    try:
        # Connect to the SQLite database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if the column already exists just to be safe
        cursor.execute("PRAGMA table_info(chat_analysis)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if "additional_notes" in columns:
            print("The 'additional_notes' column already exists! No migration needed.")
        else:
            print("Adding 'additional_notes' column to 'chat_analysis' table...")
            # Execute the ALTER TABLE command
            cursor.execute("ALTER TABLE chat_analysis ADD COLUMN additional_notes TEXT;")
            conn.commit()
            print("✅ Migration successful! The database schema has been updated safely.")
            
    except sqlite3.Error as e:
        print(f"❌ An error occurred during migration: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    migrate_database()
