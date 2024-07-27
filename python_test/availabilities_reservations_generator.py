from faker import Faker
import psycopg2
from datetime import datetime, timedelta
import random
import uuid

fake = Faker()

# Connect to PostgreSQL
conn = psycopg2.connect(
    database="tbibi_app",
    user="postgres",
    password="Amine-1963",
    host="localhost",
    port="5433"
)
cur = conn.cursor()

# List of doctor_ids
doctor_ids = [
    "128fad1d-4ade-4d88-a589-38c78f0feef5",
    "62ed87f4-c3b5-4f0a-b78c-8cc3cb0b96e0",
    "f6910aed-2af2-4a48-b700-2587d212ac40",
    "1050f24c-9a4b-4372-823e-cfaec6dbea89",
    "13ecdfba-8336-452e-9083-47002ca13d07",
    "a1588335-a8dd-4d6c-86dd-055577e749e3",
    "1d1aa176-25c2-4f34-9c2b-c856c950654b",
    "d748c21a-49b7-414a-a244-60e11436ba79",
    "a99c9a4e-128a-48eb-858e-31fa2d1f818c",
    "4cdf4d55-4823-4a3c-af02-a71f841d9638"
]

for doctor_id in doctor_ids:
    for _ in range(5):  # Generate 5 random availabilities for each doctor
        start_time = fake.date_time_this_month()
        
        minute_base = 0 if random.choice([True, False]) else 30
        start_time = start_time.replace(minute=minute_base, second=0)
        
        end_time = start_time + timedelta(minutes=30)  # 30 minutes time delta
        cur.execute(
            "INSERT INTO availabilities (availability_start, availability_end, doctor_id) VALUES (%s, %s, %s)",
            (start_time, end_time, doctor_id)
        )

for doctor_id in doctor_ids:
    for _ in range(3):  # Generate 3 random reservations for each doctor
        start_time = fake.date_time_this_month()
        end_time = start_time + timedelta(minutes=30)  # 30 minutes time delta
        title = fake.catch_phrase()
        patient_id = str(uuid.uuid4())  # Generate random patient_id
        first_name = fake.first_name()
        last_name = fake.last_name()
        cur.execute(
            "INSERT INTO patient_info (patient_id, first_name, last_name) VALUES (%s, %s, %s)",
            (patient_id, first_name, last_name)
        )
        cur.execute(
            "INSERT INTO reservations (reservation_start, reservation_end, title, doctor_id, patient_id) VALUES (%s, %s, %s, %s, %s)",
            (start_time, end_time, title, doctor_id, patient_id)
        )

conn.commit()
cur.close()
conn.close()