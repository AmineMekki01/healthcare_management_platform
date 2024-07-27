from faker import Faker
import random
import json
from datetime import datetime
import psycopg2


conn = psycopg2.connect(
    database="tbibi_app",
    user="postgres",
    password="Amine-1963",
    host="localhost",
    port="5433"
)
cur = conn.cursor()

fake = Faker()

doctors = []
salt = "HhdXKCbJYWti@1963"


def generate_password():
    password = fake.password()
    password = password + salt
    return password


def get_random_date(start, end):
    return start + datetime.timedelta(
        seconds=random.randint(0, int((end - start).total_seconds())),
    )


for _ in range(10):
    doctor = {
        "doctor_id": fake.uuid4(),
        "first_name": fake.first_name(),
        "last_name": fake.last_name(),
        "hashed_password": generate_password(),
        "salt": salt,
        "specialty": random.choice(["Cardiologist", "Dermatologist", "Neurologist", "Orthopedic", "Pediatrician"]),
        "experience_years": random.randint(1, 40),
        "rating_average": round(random.uniform(1.0, 5.0), 1),
        "license_id": fake.uuid4(),
        "is_verified": random.randint(0, 1),
        "doctor_bio": fake.text(max_nb_chars=400),
        "email": fake.email(),
        "phone_number": fake.phone_number(),
        "city": fake.city(),
        "street_name_number": fake.street_address(),
        "state_name": fake.state(),
        "zip_code": fake.zipcode(),
        "country": fake.country(),
        "user_name": fake.first_name()+fake.last_name()+"1",
    }
    doctor["is_verified"] = bool(doctor["is_verified"])
    # add a key created_at and updated_at and give the current timestamps as value
    doctor["created_at"] = datetime.now()
    doctor["updated_at"] = datetime.now()
    doctors.append(doctor)

    insert_statements = []

    columns = ', '.join(doctor.keys())
    values = ', '.join([f"'{str(value)}'" for value in doctor.values()])
    placeholders = ', '.join(['%s'] * len(doctor))
    insert_query = f"INSERT INTO doctor_info ({columns}) VALUES ({placeholders})"
    cur.execute(insert_query, tuple(doctor.values()))


conn.commit()

cur.close()
conn.close()


def datetime_serializer(obj):
    if isinstance(obj, datetime):
        return obj.strftime('%Y-%m-%d %H:%M:%S')
    raise TypeError("Type not serializable")


# Save to JSON
with open("python_test/data/doctors.json", "w") as f:
    json.dump(doctors, f, indent=2, default=datetime_serializer)
