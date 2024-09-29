from fastapi import APIRouter, Depends, HTTPException
from modules.auth import get_current_user, User
from modules.closet import Closet
from models.models import Clothes

router = APIRouter()

@router.get("/api/user/closet")
async def get_closet(current_user: User = Depends(get_current_user)):
    try:
        closet = Closet(current_user.id)
        stats = closet.get_closet_stats()
        return {
            "message": "Closet retrieved successfully",
            "closet_stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail="Closet not found")

@router.post("/api/user/closet")
async def create_closet(current_user: User = Depends(get_current_user)):
    try:
        # Check if the user already has a closet
        existing_closet = Closet(current_user.id)
        if existing_closet.exists():
            return {"message": "Closet already exists for this user"}

        # Create a new closet
        new_closet = Closet.create(current_user.id)
        return {"message": "Closet created successfully"}
    except Exception as e:
        print(f"Error creating closet: {str(e)}")  # Log the error
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/api/user/closet/item")
async def add_closet_item(item: Clothes, current_user: User = Depends(get_current_user)):
    try:
        closet = Closet(current_user.id)
        closet.add_item(item.image_path)
        return {"message": "Item added to closet successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error adding item to closet: {str(e)}")

@router.delete("/api/user/closet/item/{item_id}")
async def delete_closet_item(item_id: str, current_user: User = Depends(get_current_user)):
    try:
        closet = Closet(current_user.id)
        if closet.delete_item(item_id):
            return {"message": "Item deleted from closet successfully"}
        else:
            raise HTTPException(status_code=404, detail="Item not found in closet")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error deleting item from closet: {str(e)}")