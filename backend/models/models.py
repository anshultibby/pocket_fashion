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
    combined_mask_image_path: Optional[str] = None
    masked_images: Dict[str, str] = Field(default_factory=dict)
    image_hash: str
    classification_results: Dict[str, Dict[str, Any]] = Field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Clothes':
        # Ensure masked_images and classification_results are dictionaries
        data['masked_images'] = cls._ensure_dict(data.get('masked_images', {}))
        data['classification_results'] = cls._ensure_dict(data.get('classification_results', {}))
        return cls(**data)

    @staticmethod
    def _ensure_dict(value):
        if isinstance(value, str):
            try:
                return ast.literal_eval(value)
            except (ValueError, SyntaxError):
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return {}
        return value if isinstance(value, dict) else {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "image_path": self.image_path,
            "clothes_mask": self.clothes_mask,
            "combined_mask_image_path": self.combined_mask_image_path,
            "masked_images": self.masked_images,
            "image_hash": self.image_hash,
            "classification_results": self.classification_results
        }
