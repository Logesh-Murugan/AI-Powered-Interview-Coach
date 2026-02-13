"""
Get user 166 details
"""
import psycopg2
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv('backend/.env')

def get_user():
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT id, email, name FROM users WHERE id = 166")
        user = cur.fetchone()
        
        if user:
            print(f"User ID: {user[0]}")
            print(f"Email: {user[1]}")
            print(f"Name: {user[2]}")
        else:
            print("User 166 not found")
        
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    get_user()
