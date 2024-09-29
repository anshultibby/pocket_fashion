export interface Clothes {
  id: string;
  image_path: string;
  clothes_mask: string;
  category: string;
  subcategory: string;
  color: string;
  attributes: Record<string, any>;
  image: string;
  name: string;
}
