from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from modules.auth import get_current_user, User
from modules.closet import Closet
import shutil
import os
import uuid
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/api/user/closet")
async def get_closet(current_user: User = Depends(get_current_user)):
    try:
        closet = Closet(current_user.id)
        items = closet.get_all_items()
        return {
            "message": "Closet retrieved successfully",
            "items": [item.to_dict() for item in items]
        }
    except Exception as e:
        logger.error(f"Error retrieving closet: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving closet")

@router.post("/api/user/closet/item")
async def add_closet_item(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    try:
        closet = Closet(current_user.id)
        
        # Create a temporary file to store the uploaded image
        temp_file = f"/tmp/{uuid.uuid4()}.jpg"
        try:
            with open(temp_file, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
        except Exception as e:
            logger.error(f"Error saving uploaded file: {str(e)}")
            raise HTTPException(status_code=400, detail="Error saving uploaded file")
        
        # Add the item to the closet
        try:
            item = closet.add_item(temp_file)
        except Exception as e:
            logger.error(f"Error adding item to closet: {str(e)}")
            raise HTTPException(status_code=400, detail="Error adding item to closet")
        
        # Remove the temporary file
        try:
            os.remove(temp_file)
        except Exception as e:
            logger.warning(f"Error removing temporary file: {str(e)}")
        
        return {"message": "Item added to closet successfully", "item": item}
    except Exception as e:
        logger.error(f"Unexpected error in add_closet_item: {str(e)}")
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
