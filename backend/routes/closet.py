from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from modules.auth import get_current_user, User
from modules.closet import Closet
import shutil
import os
import uuid
import logging
from typing import List, Dict
from collections import Counter

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/api/user/closet")
async def get_closet(current_user: User = Depends(get_current_user)):
    try:
        logger.info(f"Fetching closet for user: {current_user.id}")
        closet = Closet(current_user.id)
        items = closet.get_all_items()
        logger.info(f"Retrieved {len(items)} items for user: {current_user.id}")
        
        return {
            "message": "Closet retrieved successfully",
            "items": [item.to_dict() for item in items],
        }
    except Exception as e:
        logger.error(f"Error retrieving closet for user {current_user.id}: {str(e)}")
        logger.exception("Detailed traceback:")
        raise HTTPException(status_code=500, detail=f"Error retrieving closet: {str(e)}")

@router.get("/api/user/closet/uploads")
async def get_past_uploads(current_user: User = Depends(get_current_user)):
    try:
        logger.info(f"Fetching past uploads for user: {current_user.id}")
        closet = Closet(current_user.id)
        items = closet.get_all_items()
        uploads = [{"id": item.id, "image_path": item.image_path} for item in items]
        logger.info(f"Retrieved {len(uploads)} uploads for user: {current_user.id}")
        
        return {
            "message": "Past uploads retrieved successfully",
            "uploads": uploads
        }
    except Exception as e:
        logger.error(f"Error retrieving past uploads for user {current_user.id}: {str(e)}")
        logger.exception("Detailed traceback:")
        raise HTTPException(status_code=500, detail=f"Error retrieving past uploads: {str(e)}")

@router.post("/api/user/closet/items")
async def add_closet_items(
    images: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    try:
        closet = Closet(current_user.id)
        added_items = []
        failed_items = []

        for image in images:
            item_id = str(uuid.uuid4())
            temp_file = f"/tmp/{item_id}.jpg"
            try:
                with open(temp_file, "wb") as buffer:
                    shutil.copyfileobj(image.file, buffer)
                
                # Add the item to the closet
                item = closet.add_item(temp_file, item_id)
                if item:
                    added_items.append(item)
                    logger.info(f"Added item to closet: {item['id']}")
                else:
                    failed_items.append(image.filename)
                    logger.warning(f"Failed to add item: {image.filename}")
            except Exception as e:
                failed_items.append(image.filename)
                logger.error(f"Error processing file {image.filename}: {str(e)}")
            finally:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
        
        return {
            "message": f"{len(added_items)} items added to closet successfully",
            "added_items": added_items,
            "failed_items": failed_items
        }
    except Exception as e:
        logger.error(f"Unexpected error in add_closet_items: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/api/user/closet/item/{item_id}")
async def delete_closet_item(item_id: str, current_user: User = Depends(get_current_user)):
    try:
        closet = Closet(current_user.id)
        if closet.delete_item(item_id):
            return {"message": "Item deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Item not found")
    except Exception as e:
        logger.error(f"Error deleting item: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# New endpoint for retrieving closet items
@router.get("/api/user/closet-items")
async def get_closet_items(current_user: User = Depends(get_current_user)):
    try:
        logger.info(f"Fetching closet items for user: {current_user.id}")
        closet = Closet(current_user.id)
        items = closet.get_all_items()
        logger.info(f"Retrieved {len(items)} items for user: {current_user.id}")
        
        closet_items = []

        for item in items:
            for mask_key, mask_path in item.masked_images.items():
                closet_item = {
                    "id": f"{item.id}-{mask_key}",
                    "path": mask_path,
                    "classification_results": item.classification_results[mask_key]
                }
                closet_items.append(closet_item)
        
        return {
            "message": "Closet items retrieved successfully",
            "items": closet_items
        }
    except Exception as e:
        logger.error(f"Error retrieving closet items for user {current_user.id}: {str(e)}")
        logger.exception("Detailed traceback:")
        raise HTTPException(status_code=500, detail=f"Error retrieving closet items: {str(e)}")

# New endpoint for retrieving categories and their counts
@router.get("/api/user/closet-categories")
async def get_closet_categories(current_user: User = Depends(get_current_user)):
    try:
        logger.info(f"Fetching closet categories for user: {current_user.id}")
        closet = Closet(current_user.id)
        items = closet.get_all_items()
        
        category_counter = Counter()

        for item in items:
            for classification in item.classification_results.values():
                if 'category' in classification:
                    category_counter[classification['category']] += 1
        
        categories = [
            {"name": category, "count": count}
            for category, count in category_counter.items()
        ]
        
        sorted_categories = sorted(categories, key=lambda x: (-x['count'], x['name']))
        
        logger.info(f"Retrieved {len(sorted_categories)} categories for user: {current_user.id}")
        
        return {
            "message": "Closet categories retrieved successfully",
            "categories": sorted_categories
        }
    except Exception as e:
        logger.error(f"Error retrieving closet categories for user {current_user.id}: {str(e)}")
        logger.exception("Detailed traceback:")
        raise HTTPException(status_code=500, detail=f"Error retrieving closet categories: {str(e)}")
