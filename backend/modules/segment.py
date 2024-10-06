import gdown
import torch
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
from u2net import U2NET
import numpy as np
import os
import argparse
from collections import OrderedDict

MODEL_CHECKPOINT_URL = 'https://drive.google.com/uc?id=11xTBALOeUkyuaK3l60CpkYHLTmv7k3dY'
LOCAL_CHECKPOINT_PATH = 'data/models/cloth_segment.pth'

def download_checkpoint():
    output = LOCAL_CHECKPOINT_PATH
    if os.path.exists(output):
        print(f"Checkpoint file '{output}' already exists. Skipping download.")
        return output
    
    print(f"Downloading checkpoint file '{output}'...")
    gdown.download(MODEL_CHECKPOINT_URL, output, quiet=False)
    print("Download complete.")
    return output

def initialize_model(checkpoint_path):
    model = U2NET(in_ch=3, out_ch=4)  # Ensure correct output channels
    model = load_checkpoint(model, checkpoint_path)
    model.eval()
    return model

def load_checkpoint(model, checkpoint_path):
    if not os.path.exists(checkpoint_path):
        print("----No checkpoints at given path----")
        return model
    model_state_dict = torch.load(checkpoint_path, 
                                  map_location=torch.device("cpu"), 
                                  weights_only=True)
    new_state_dict = OrderedDict()
    for k, v in model_state_dict.items():
        name = k[7:] if k.startswith('module.') else k  # remove `module.` if present
        new_state_dict[name] = v

    model.load_state_dict(new_state_dict)
    print("----checkpoints loaded from path: {}----".format(checkpoint_path))
    return model

def get_palette(num_cls):
    """ Returns the color map for visualizing the segmentation mask. """
    n = num_cls
    palette = [0] * (n * 3)
    for j in range(0, n):
        lab = j
        palette[j * 3 + 0] = 0
        palette[j * 3 + 1] = 0
        palette[j * 3 + 2] = 0
        i = 0
        while lab:
            palette[j * 3 + 0] |= (((lab >> 0) & 1) << (7 - i))
            palette[j * 3 + 1] |= (((lab >> 1) & 1) << (7 - i))
            palette[j * 3 + 2] |= (((lab >> 2) & 1) << (7 - i))
            i += 1
            lab >>= 3
    return palette

class Normalize_image(object):
    """Normalize given tensor into given mean and standard dev

    Args:
        mean (float): Desired mean to substract from tensors
        std (float): Desired std to divide from tensors
    """

    def __init__(self, mean, std):
        assert isinstance(mean, (float))
        if isinstance(mean, float):
            self.mean = mean

        if isinstance(std, float):
            self.std = std

        self.normalize_1 = transforms.Normalize(self.mean, self.std)
        self.normalize_3 = transforms.Normalize([self.mean] * 3, [self.std] * 3)
        self.normalize_18 = transforms.Normalize([self.mean] * 18, [self.std] * 18)

    def __call__(self, image_tensor):
        if image_tensor.shape[0] == 1:
            return self.normalize_1(image_tensor)

        elif image_tensor.shape[0] == 3:
            return self.normalize_3(image_tensor)

        elif image_tensor.shape[0] == 18:
            return self.normalize_18(image_tensor)

        else:
            assert "Please set proper channels! Normlization implemented only for 1, 3 and 18"


def apply_transform(img):
    transforms_list = []
    transforms_list += [transforms.ToTensor()]
    transforms_list += [Normalize_image(0.5, 0.5)]
    transform_rgb = transforms.Compose(transforms_list)
    return transform_rgb(img)

def segment(image_path, net, palette, device='cpu'):
    image_path_stem = image_path.split("/")[-1].split(".")[0]
    image = Image.open(image_path).convert('RGB')
    img_size = image.size
    image = image.resize((768, 768), Image.BICUBIC)
    image_tensor = apply_transform(image)
    image_tensor = torch.unsqueeze(image_tensor, 0)

    alpha_out_dir = "data/alpha"
    cloth_seg_out_dir = "data/cloth_seg"

    os.makedirs(alpha_out_dir, exist_ok=True)
    os.makedirs(cloth_seg_out_dir, exist_ok=True)

    with torch.no_grad():
        output_tensor = net(image_tensor.to(device))
        output_tensor = F.log_softmax(output_tensor[0], dim=1)
        output_tensor = torch.max(output_tensor, dim=1, keepdim=True)[1]
        output_tensor = torch.squeeze(output_tensor, dim=0)
        output_arr = output_tensor.cpu().numpy()[0, :, :]

    classes_to_save = []

    # Check which classes are present in the image
    for cls in range(1, 4):  # Exclude background class (0)
        if np.any(output_arr == cls):
            classes_to_save.append(cls)

    print(np.shape(output_arr))
    for cls in classes_to_save:
        alpha_mask = (output_arr == cls).astype(np.uint8) * 255
        alpha_mask_img = Image.fromarray(alpha_mask, mode='L')
        alpha_mask_img = alpha_mask_img.resize(img_size, Image.BICUBIC)
        alpha_mask_img.save(os.path.join(alpha_out_dir, f'{image_path_stem}_{cls}.png'))

    # Save final cloth segmentations
    cloth_seg = Image.fromarray(output_arr.astype(np.uint8), mode='P')
    cloth_seg.putpalette(palette)
    cloth_seg = cloth_seg.resize(img_size, Image.BICUBIC)
    cloth_seg.save(os.path.join(cloth_seg_out_dir, f'{image_path_stem}_final_seg.png'))
    return cloth_seg

checkpoint_path = download_checkpoint()
model = initialize_model(LOCAL_CHECKPOINT_PATH)
palette = get_palette(4)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--image_path', type=str, required=True)
    args = parser.parse_args()

    image_path = args.image_path
    
    masks = segment(image_path, model, palette, device='cpu')
    # masks.save(f'{image_path.split(".")[0]}_mask.png')
    print(f'Mask saved to {image_path.split(".")[0]}_mask.png')

if __name__ == '__main__':
    main()