from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from modules.auth import get_current_user, User
from modules.closet import Closet
import shutil
import os
import uuid
import logging
from typing import List

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
            "items": [item.to_dict() for item in items]
        }
    except Exception as e:
        logger.error(f"Error retrieving closet for user {current_user.id}: {str(e)}")
        logger.exception("Detailed traceback:")
        raise HTTPException(status_code=500, detail=f"Error retrieving closet: {str(e)}")

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
            temp_file = f"/tmp/{uuid.uuid4()}.jpg"
            try:
                with open(temp_file, "wb") as buffer:
                    shutil.copyfileobj(image.file, buffer)
                
                # Add the item to the closet
                item = closet.add_item(temp_file)
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
