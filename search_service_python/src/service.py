from src.constants import LIST_OF_SPECIALTIES, ChatRolesEnum, ModelsEnum
import requests
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

client = OpenAI()

class SearchService:

    @classmethod
    async def analyze_symptoms(cls, symptoms):
        specialties_prompt = ", ".join(LIST_OF_SPECIALTIES)
        print(f"The list of specialties to choose from : {specialties_prompt}")
        
        prompt = (
            f"A Patient describes the following symptoms: {symptoms}\n\n"
            f"Given the list of specialties - {specialties_prompt} - "
            "which one should the patient consult based on these symptoms? "
            "Please choose only one specialty from the list and provide only the name of the specialty.\n\n"
            "Specialty:"
        )
        try:
            response = client.chat.completions.create(
                model=ModelsEnum.GPT4.value,
                messages=[{"role": ChatRolesEnum.USER.value, "content": prompt}]
            )
            specialty = response.choices[0].message.content
            print(f"specialty : {specialty}")
            return specialty.strip()
        except Exception as e:
            print(f"Error querying OpenAI API: {e}")
            return None

    @classmethod
    def find_best_matching_doctors(cls, specialtyQuery):
        try:
            doctors = get_all_doctors(
                query="", specialty=specialtyQuery, location="")
            print(f"founded doctor : {doctors}")
            return doctors
        except Exception as e:
            print(f"Error querying database: {e}")
            return None


def get_all_doctors(query="", specialty="", location=""):
    url = "http://localhost:3001/api/v1/doctors"
    params = {"query": query, "specialty": specialty, "location": location}
    try:
        response = requests.get(url, params=params)
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": "Failed to retrieve doctors", "details": response.text}
    except requests.exceptions.ConnectionError as e:
        print(f"Connection error when querying database: {e}")
        return {"error": "Service unavailable", "details": "Could not connect to the doctor retrieval service"}

