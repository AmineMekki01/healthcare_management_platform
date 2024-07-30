from pydantic import BaseModel 

class SymptomsRequest(BaseModel):
    userQuery: str
