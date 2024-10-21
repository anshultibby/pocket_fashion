from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import json
import ast

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
    masked_images: Optional[List[str]] = Field(default_factory=list)
    category: str = "unknown"
    subcategory: str = "unknown"
    color: str = "unknown"
    attributes: Optional[Dict[str, str]] = Field(default_factory=dict)
    image_hash: str

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Clothes':
        # Convert masked_images from string to list if necessary
        masked_images = data.get('masked_images', [])
        if isinstance(masked_images, str):
            try:
                # First, try to parse as JSON
                masked_images = json.loads(masked_images)
            except json.JSONDecodeError:
                try:
                    # If that fails, try to parse as a Python literal
                    masked_images = ast.literal_eval(masked_images)
                except (ValueError, SyntaxError):
                    # If all else fails, split by comma
                    masked_images = [path.strip() for path in masked_images.split(',') if
                                      path.strip()]
        
        # Convert attributes from string to dict if necessary
        attributes = data.get('attributes', {})
        if isinstance(attributes, str):
            try:
                attributes = json.loads(attributes)
            except json.JSONDecodeError:
                attributes = {}

        return cls(
            id=str(data.get('id', '')),
            image_path=str(data.get('image_path', '')),
            clothes_mask=str(data.get('clothes_mask', '')),
            masked_images=masked_images,
            category=str(data.get('category', 'unknown')),
            subcategory=str(data.get('subcategory', 'unknown')),
            color=str(data.get('color', 'unknown')),
            attributes=attributes,
            image_hash=str(data.get('image_hash', ''))
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "image_path": self.image_path,
            "clothes_mask": self.clothes_mask,
            "masked_images": self.masked_images,  # Return as a list, not a JSON string
            "category": self.category,
            "subcategory": self.subcategory,
            "color": self.color,
            "attributes": self.attributes,
            "image_hash": self.image_hash
        }
