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
import ast
import shutil

from modules.segment import ClothSegmenter
from modules.classify import classify_image

logger = logging.getLogger(__name__)
cloth_segmenter = ClothSegmenter()
CLOSET_COLUMNS = ['id', 'image_path', 'clothes_mask', 'masked_images', 
'combined_mask_image_path', 'classification_results', 'image_hash']

def segment_image(image_path: str) -> Dict[str, any]:
    cloth_segmenter.segment(image_path)
    cloth_segmenter.save_results()
    result = {
        'image_path': cloth_segmenter.original_image_path,
        'mask_path': cloth_segmenter.mask_path,
        'masked_image_paths': cloth_segmenter.masked_image_paths,
        'combined_mask_image_path': cloth_segmenter.combined_mask_image_path,
    }
    return result


def segment_and_categorize_image(image_path: str) -> Dict[str, any]:
    segment_result = segment_image(image_path)
    classification_results = {}
    masked_image_paths = {}

    for masked_image_path in segment_result['masked_image_paths']:
        logger.info(f"Classifying image: {masked_image_path}")
        image = Image.open(masked_image_path)
        classify_result = classify_image(image)
        logger.info(f"Classify result: {classify_result}")
        
        key = os.path.splitext(os.path.basename(masked_image_path))[0]
        
        # Take only the top classification per category
        classification_results[key] = {
            label_type: results[0][0] if results else None
            for label_type, results in classify_result.items()
        }
        masked_image_paths[key] = masked_image_path

    result = {
        'image_path': segment_result['image_path'],
        'mask_path': segment_result['mask_path'],
        'masked_image_paths': masked_image_paths,
        'combined_mask_image_path': segment_result['combined_mask_image_path'],
        'classification_results': classification_results
    }
    logger.info(f"Segmentation and classification result: {result}")
    return result

class Closet:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.csv_path = f"data/closets/{user_id}_closet.csv"
        self.image_dir = f"data/images/{user_id}"
        self.df = self._load_or_create_df()

    def _load_or_create_df(self) -> pd.DataFrame:
        if os.path.exists(self.csv_path):
            df = pd.read_csv(self.csv_path)
            if 'image_hash' not in df.columns:
                df['image_hash'] = ''
            if 'combined_mask_image_path' not in df.columns:
                df['combined_mask_image_path'] = ''
            
            # Parse masked_images and classification_results as dictionaries
            df['masked_images'] = df['masked_images'].apply(self._parse_dict)
            df['classification_results'] = df['classification_results'].apply(self._parse_dict)
            return df
        else:
            df = pd.DataFrame(columns=CLOSET_COLUMNS)
            df.to_csv(self.csv_path, index=False)
            return df

    def _parse_dict(self, x):
        if isinstance(x, str):
            try:
                return ast.literal_eval(x)
            except (ValueError, SyntaxError):
                try:
                    return json.loads(x)
                except json.JSONDecodeError:
                    return {}
        return x if isinstance(x, dict) else {}

    def _image_hash(self, image_path: str) -> str:
        return str(imagehash.average_hash(Image.open(image_path)))

    def item_exists(self, image_path: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
        new_hash = self._image_hash(image_path)
        existing_item = self.df[self.df['image_hash'] == new_hash]
        if not existing_item.empty:
            return True, existing_item.iloc[0].to_dict()
        return False, None

    def add_item(self, image_path: str, item_id: str) -> Dict[str, Any]:
        exists, existing_item = self.item_exists(image_path)
        if exists:
            logger.info(f"Item already exists in the closet: {image_path}")
            return existing_item

        try:
            result = segment_and_categorize_image(image_path)

            relative_image_path = os.path.relpath(result['image_path'], env.IMAGES_DIR)
            relative_mask_path = os.path.relpath(result['mask_path'], env.IMAGES_DIR)
            relative_combined_mask_path = os.path.relpath(result['combined_mask_image_path'], env.IMAGES_DIR)

            # Create a new dictionary with relative paths, keeping the same keys
            relative_masked_paths = {
                key: os.path.relpath(path, env.IMAGES_DIR)
                for key, path in result['masked_image_paths'].items()
            }

            image_hash = self._image_hash(image_path)

            clothes = Clothes(
                id=item_id,
                image_path=relative_image_path,
                clothes_mask=relative_mask_path,
                masked_images=relative_masked_paths,
                combined_mask_image_path=relative_combined_mask_path,
                image_hash=image_hash,
                classification_results=result['classification_results']
            )

            new_item = clothes.to_dict()
            self.df = pd.concat([self.df, pd.DataFrame([new_item])], ignore_index=True)
            self._save_df()
            return new_item

        except Exception as e:
            logger.error(f"Error in add_item: {str(e)}", exc_info=True)
            raise

    def delete_item(self, item_id: str) -> bool:
        try:
            # Find the item
            item = self.df[self.df['id'] == item_id]
            if item.empty:
                logger.warning(f"Item with id {item_id} not found")
                return False  # Item not found
            
            # Get the item folder path
            item_folder = os.path.join(self.image_dir, item_id)
            
            # Remove the item from the DataFrame
            self.df = self.df[self.df['id'] != item_id]
            
            # Save the updated DataFrame back to CSV
            self._save_df()
            
            # Delete the item folder
            if os.path.exists(item_folder):
                shutil.rmtree(item_folder)
                logger.info(f"Successfully deleted item folder: {item_folder}")
            else:
                logger.warning(f"Item folder not found: {item_folder}")
            
            logger.info(f"Successfully deleted item with id {item_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting item {item_id}: {str(e)}")
            logger.exception("Detailed traceback:")
            return False

    def _delete_file(self, file_path: str):
        full_path = os.path.join("/data/images", file_path)
        if os.path.exists(full_path):
            try:
                os.remove(full_path)
                logger.info(f"Deleted file: {full_path}")
            except Exception as e:
                logger.error(f"Error deleting file {full_path}: {str(e)}")
        else:
            logger.warning(f"File not found: {full_path}")

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
            try:
                item_dict = row.to_dict()
                item_dict['masked_images'] = self._parse_dict(item_dict['masked_images'])
                item_dict['classification_results'] = self._parse_dict(item_dict['classification_results'])
                item = Clothes.from_dict(item_dict)
                items.append(item)
            except Exception as e:
                logger.error(f"Error creating Clothes object: {e}")
                logger.error(f"Problematic row: {row.to_dict()}")
        return items

    def _save_df(self) -> None:
        # Convert masked_images and classification_results to string representation of dictionaries before saving
        df_to_save = self.df.copy()
        df_to_save['masked_images'] = df_to_save['masked_images'].apply(str)
        df_to_save['classification_results'] = df_to_save['classification_results'].apply(str)
        df_to_save.to_csv(self.csv_path, index=False)

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
