from pydantic import BaseModel
from typing import Dict, Optional, List

class User(BaseModel):
    email: str
    name: str
    user_data: Dict[str, str] = {}

    class Config:
        allow_population_by_field_name = True

class Clothes(BaseModel):
    id: str
    image_path: str
    clothes_mask: str
    category: str
    subcategory: str
    color: str
    attributes: Dict[str, Dict[str, str]]

    @classmethod
    def from_dict(cls, data: Dict) -> 'Clothes':
        return cls(**data)

    def to_dict(self) -> Dict:
        return self.dict()

