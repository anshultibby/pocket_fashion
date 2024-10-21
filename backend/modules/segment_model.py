import gdown
import torch
from torchvision import transforms

from modules.u2net import U2NET
import os
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