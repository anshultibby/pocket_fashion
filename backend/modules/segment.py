import torch
import torch.nn.functional as F
from PIL import Image
import numpy as np
import os
import argparse
from modules.segment_model import download_checkpoint, initialize_model, \
    get_palette, LOCAL_CHECKPOINT_PATH, apply_transform
from config import env


class ClothSegmenter:
    def __init__(self, device='cpu'):
        checkpoint_path = download_checkpoint()
        self.model = initialize_model(LOCAL_CHECKPOINT_PATH)
        self.palette = get_palette(4)
        self.device = device
        self.image = None
        self.original_size = None
        self.output_arr = None
        self.mask = None
        self.image_path_stem = None
        self.save_dir = None
        self.mask_path = None
        self.original_image_path = None
        self.masked_image_paths = []

    def create_save_dir(self, image_path):
        self.image_path_stem = os.path.splitext(os.path.basename(image_path))[0]
        self.save_dir = os.path.join(env.IMAGES_DIR, self.image_path_stem)
        os.makedirs(self.save_dir, exist_ok=True)
        self.mask_path = os.path.join(self.save_dir, f'mask.png')
        self.original_image_path = os.path.join(self.save_dir, f'original.png')
        self.masked_image_paths = [os.path.join(self.save_dir, f'masked_{cls}.png') for cls in range(1, 4)]

    def segment(self, image_path):
        self.create_save_dir(image_path)
        self.image = Image.open(image_path).convert('RGB')
        self.original_size = self.image.size
        
        resized_image = self.image.resize((768, 768), Image.BICUBIC)
        image_tensor = apply_transform(resized_image)
        image_tensor = torch.unsqueeze(image_tensor, 0)

        with torch.no_grad():
            output_tensor = self.model(image_tensor.to(self.device))
            output_tensor = F.log_softmax(output_tensor[0], dim=1)
            output_tensor = torch.max(output_tensor, dim=1, keepdim=True)[1]
            output_tensor = torch.squeeze(output_tensor, dim=0)
            self.output_arr = output_tensor.cpu().numpy()[0, :, :]

        self.mask = Image.fromarray(self.output_arr.astype(np.uint8), mode='P')
        self.mask.putpalette(self.palette)
        self.mask = self.mask.resize(self.original_size, Image.BICUBIC)

        return self.mask

    def save_results(self):
        os.makedirs(self.save_dir, exist_ok=True)

        classes_to_save = [cls for cls in range(1, 4) if np.any(self.output_arr == cls)]

        for cls in classes_to_save:
            alpha_mask = (self.output_arr == cls).astype(np.uint8) * 255
            alpha_mask_img = Image.fromarray(alpha_mask, mode='L')
            alpha_mask_img = alpha_mask_img.resize(self.original_size, Image.BICUBIC)
            
            masked_image = Image.new('RGBA', self.image.size, (0, 0, 0, 0))
            masked_image.paste(self.image.convert('RGBA'), (0, 0), alpha_mask_img)
            masked_image.save(self.masked_image_paths[cls - 1])

        self.mask.save(self.mask_path)
        self.image.save(self.original_image_path)

    def get_mask(self, class_id):
        if self.output_arr is None:
            raise ValueError("Segmentation has not been performed yet.")
        return (self.output_arr == class_id).astype(np.uint8) * 255

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--image_path', type=str, required=True)
    args = parser.parse_args()

    segmenter = ClothSegmenter(device='cpu')
    segmenter.segment(args.image_path)
    segmenter.save_results()
    
    print(f'Results saved in {segmenter.save_dir}/')

if __name__ == '__main__':
    main()
