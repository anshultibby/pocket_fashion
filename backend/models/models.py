from pydantic import BaseModel
from typing import Dict, Optional

class User(BaseModel):
    email: str
    name: str
    user_data: Dict[str, str] = {}

    class Config:
        allow_population_by_field_name = True
