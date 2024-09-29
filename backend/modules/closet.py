import pandas as pd
import os
from typing import List, Dict, Any
import uuid
import json
from collections import Counter
from models.models import Clothes
from config import env
import shutil
import logging

logger = logging.getLogger(__name__)

def segment_and_categorize_image(image_path: str) -> Dict[str, any]:
    # This is a placeholder function
    return {
        "clothes_mask": "path/to/clothes_mask.png",
        "items": [
            {
                "category": "top",
                "subcategory": "t-shirt",
                "color": "blue",
                "attributes": {
                    "sleeve": {"submask": "path/to/sleeve_mask.png", "type": "short"},
                    "neckline": {"submask": "path/to/neckline_mask.png", "type": "round"}
                }
            },
        ]
    }

class Closet:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.csv_path = os.path.join(env.CLOSETS_DIR, f"{user_id}_closet.csv")
        self.image_dir = os.path.join(env.IMAGES_DIR, user_id)
        os.makedirs(self.image_dir, exist_ok=True)
        self.df = self._load_or_create_df()

    def _load_or_create_df(self) -> pd.DataFrame:
        if os.path.exists(self.csv_path):
            return pd.read_csv(self.csv_path)
        else:
            df = pd.DataFrame(columns=['id', 'image_path', 'clothes_mask', 'category', 'subcategory', 'color', 'attributes'])
            df.to_csv(self.csv_path, index=False)
            return df

    def add_item(self, image_path: str) -> Dict[str, Any]:
        try:
            new_image_filename = f"{uuid.uuid4()}.jpg"
            new_image_path = os.path.join(self.image_dir, new_image_filename)
            shutil.copy(image_path, new_image_path)
            
            result = segment_and_categorize_image(new_image_path)
            
            new_items = []
            for item in result['items']:
                attributes = item.get('attributes', {})
                if isinstance(attributes, str):
                    try:
                        attributes = json.loads(attributes)
                    except json.JSONDecodeError:
                        attributes = {}
                
                clothes = Clothes(
                    id=str(uuid.uuid4()),
                    image_path=f"/static/{self.user_id}/{new_image_filename}",  # Update image_path
                    clothes_mask=result['clothes_mask'],
                    category=item['category'],
                    subcategory=item['subcategory'],
                    color=item['color'],
                    attributes=attributes
                )
                new_items.append(clothes.to_dict())
            
            self.df = pd.concat([self.df, pd.DataFrame([new_items[0]])], ignore_index=True)
            self._save_df()
            return new_items[0]
        except Exception as e:
            logger.error(f"Error in add_item: {str(e)}")
            raise

    def delete_item(self, item_id: str) -> bool:
        item = self.df[self.df['id'] == item_id]
        if item.empty:
            return False
        
        image_path = item['image_path'].values[0]
        if os.path.exists(image_path):
            os.remove(image_path)
        
        self.df = self.df[self.df['id'] != item_id]
        self._save_df()
        return True

    def search_items(self, **kwargs) -> List[Clothes]:
        result_df = self.df.copy()
        
        for key, value in kwargs.items():
            if key in ['category', 'subcategory', 'color']:
                result_df = result_df[result_df[key] == value]
            elif key == 'attributes':
                for attr_key, attr_value in value.items():
                    result_df = result_df[result_df['attributes'].apply(
                        lambda x: self._check_attribute(x, attr_key, attr_value)
                    )]
        
        return [Clothes.from_dict(row) for _, row in result_df.iterrows()]

    def _check_attribute(self, attributes_json: str, key: str, value: Any) -> bool:
        attributes = json.loads(attributes_json)
        return key in attributes and attributes[key].get('type') == value

    def get_all_items(self) -> List[Clothes]:
        return [Clothes.from_dict(row) for _, row in self.df.iterrows()]

    def _save_df(self) -> None:
        self.df.to_csv(self.csv_path, index=False)

    def get_closet_stats(self, include_distribution: bool = False) -> Dict[str, Any]:
        stats = {
            'categories': [],
            'subcategories': [],
            'attributes': [],
            'colors': []
        }

        if include_distribution:
            stats.update({
                'category_distribution': {},
                'subcategory_distribution': {},
                'attribute_distribution': {},
                'color_distribution': {}
            })

        # Get unique values and distributions
        categories = self.df['category'].unique().tolist()
        subcategories = self.df['subcategory'].unique().tolist()
        colors = self.df['color'].unique().tolist()

        # Process attributes
        all_attributes = set()
        attribute_types = Counter()
        for attrs in self.df['attributes']:
            attr_dict = json.loads(attrs)
            for attr, details in attr_dict.items():
                all_attributes.add(attr)
                attribute_types[f"{attr}:{details['type']}"] += 1

        stats['categories'] = categories
        stats['subcategories'] = subcategories
        stats['attributes'] = list(all_attributes)
        stats['colors'] = colors

        if include_distribution:
            stats['category_distribution'] = dict(self.df['category'].value_counts())
            stats['subcategory_distribution'] = dict(self.df['subcategory'].value_counts())
            stats['color_distribution'] = dict(self.df['color'].value_counts())
            stats['attribute_distribution'] = dict(attribute_types)

        return stats

    def exists(self) -> bool:
        """Check if a closet already exists for this user."""
        return os.path.exists(self.csv_path)

    @classmethod
    def create(cls, user_id: str):
        """Create a new closet for the user."""
        new_closet = cls(user_id)
        if not new_closet.exists():
            # Create the CSV file if it doesn't exist
            new_closet._save_df()
            # Create the image directory if it doesn't exist
            os.makedirs(new_closet.image_dir, exist_ok=True)
        return new_closet

# Usage example
if __name__ == "__main__":
    closet = Closet("user123")
    
    # Add an item
    closet.add_item("/path/to/uploaded/image.jpg")
    
    # Search for items
    blue_tops = closet.search_items(category="top", color="blue")
    print([item.to_dict() for item in blue_tops])
    
    # Get all items
    all_items = closet.get_all_items()
    print([item.to_dict() for item in all_items])
    
    # Delete an item (assuming we have an item with id 'item_id_to_delete')
    if closet.delete_item('item_id_to_delete'):
        print("Item deleted successfully")
    else:
        print("Item not found")

    # Get closet stats without distribution
    stats = closet.get_closet_stats()
    print("Closet stats:", stats)

    # Get closet stats with distribution
    stats_with_distribution = closet.get_closet_stats(include_distribution=True)
    print("Closet stats with distribution:", stats_with_distribution)