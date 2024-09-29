from pydantic import BaseModel
from typing import Dict, Any

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
    attributes: Dict[str, Any]

    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        # Ensure attributes is a dictionary
        attributes = data.get('attributes', {})
        if isinstance(attributes, str):
            try:
                attributes = json.loads(attributes)
            except json.JSONDecodeError:
                attributes = {}
        
        return cls(
            id=data['id'],
            image_path=data['image_path'],
            clothes_mask=data['clothes_mask'],
            category=data['category'],
            subcategory=data['subcategory'],
            color=data['color'],
            attributes=attributes
        )

    def to_dict(self) -> Dict:
        return self.dict()

