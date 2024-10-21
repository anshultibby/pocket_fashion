import pandas as pd
import os
from typing import List, Dict, Any, Tuple, Optional
import uuid
import json
from collections import Counter
from models.models import Clothes
from config import env
import logging
from PIL import Image
import imagehash

from modules.segment import ClothSegmenter

logger = logging.getLogger(__name__)
cloth_segmenter = ClothSegmenter()

def segment_and_categorize_image(image_path: str) -> Dict[str, any]:
    cloth_segmenter.segment(image_path)
    cloth_segmenter.save_results()
    
    result = {
        'image_path': cloth_segmenter.original_image_path,
        'mask_path': cloth_segmenter.mask_path,
        'masked_image_paths': cloth_segmenter.masked_image_paths,
        'category': 'unknown',
        'subcategory': 'unknown',
        'color': 'unknown',
        'pattern': 'unknown',
        'material': 'unknown',
        'style': 'unknown'
    }
    logger.info(f"Segmentation result: {result}")
    return result

class Closet:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.csv_path = os.path.join(env.CLOSETS_DIR, f"{user_id}_closet.csv")
        self.image_dir = os.path.join(env.IMAGES_DIR, user_id)
        self.df = self._load_or_create_df()

    def _load_or_create_df(self) -> pd.DataFrame:
        if os.path.exists(self.csv_path):
            df = pd.read_csv(self.csv_path)
            if 'image_hash' not in df.columns:
                df['image_hash'] = ''  # Add the column if it doesn't exist
            return df
        else:
            df = pd.DataFrame(columns=['id', 'image_path', 'clothes_mask', 'masked_images', 'category', 'subcategory', 'color', 'attributes', 'image_hash'])
            df.to_csv(self.csv_path, index=False)
            return df

    def _image_hash(self, image_path: str) -> str:
        return str(imagehash.average_hash(Image.open(image_path)))

    def item_exists(self, image_path: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
        new_hash = self._image_hash(image_path)
        existing_item = self.df[self.df['image_hash'] == new_hash]
        if not existing_item.empty:
            return True, existing_item.iloc[0].to_dict()
        return False, None

    def add_item(self, image_path: str) -> Dict[str, Any]:
        exists, existing_item = self.item_exists(image_path)
        if exists:
            logger.info(f"Item already exists in the closet: {image_path}")
            return existing_item

        try:
            result = segment_and_categorize_image(image_path)

            relative_image_path = os.path.relpath(result['image_path'], env.IMAGES_DIR)
            relative_mask_path = os.path.relpath(result['mask_path'], env.IMAGES_DIR)
            relative_masked_paths = [os.path.relpath(path, env.IMAGES_DIR) for path in result['masked_image_paths'] if path]
            attributes = {
                'pattern': result.get('pattern', 'unknown'),
                'material': result.get('material', 'unknown'),
                'style': result.get('style', 'unknown'),
            }

            image_hash = self._image_hash(image_path)

            clothes = Clothes(
                id=str(uuid.uuid4()),
                image_path=relative_image_path,
                clothes_mask=relative_mask_path,
                masked_images=relative_masked_paths,
                category=result.get('category', 'unknown'),
                subcategory=result.get('subcategory', 'unknown'),
                color=result.get('color', 'unknown'),
                attributes=attributes,
                image_hash=image_hash
            )

            new_item = clothes.to_dict()
            self.df = pd.concat([self.df, pd.DataFrame([new_item])], ignore_index=True)
            self._save_df()
            return new_item

        except Exception as e:
            logger.error(f"Error in add_item: {str(e)}", exc_info=True)
            raise

    def delete_item(self, item_id: str) -> bool:
        item = self.df[self.df['id'] == item_id]
        if item.empty:
            return False
        
        image_path = os.path.join(env.IMAGES_DIR, item['image_path'].values[0])
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
        items = []
        for _, row in self.df.iterrows():
            item = Clothes.from_dict(row)
            items.append(item)
        return items

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
    closet = Closet.create("user123")
    
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
