from pydantic import BaseModel
from typing import Dict, Any, List
import json

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
    masked_images: List[str]
    category: str
    subcategory: str
    color: str
    attributes: Dict[str, Any]
    image_hash: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'image_path': self.image_path,
            'clothes_mask': self.clothes_mask,
            'masked_images': self.masked_images,
            'category': self.category,
            'subcategory': self.subcategory,
            'color': self.color,
            'attributes': self.attributes,
            'image_hash': self.image_hash
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Clothes':
        return cls(**data)
