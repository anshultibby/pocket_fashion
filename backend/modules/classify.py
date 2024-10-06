from fashion_resnet import FashionResnet
import torch
from torchvision import transforms
import argparse
from PIL import Image
import os
from matplotlib import pyplot as plt
import numpy as np
from matplotlib import patches



CLASSIFIER_CHECKPOINT = "data/models/cloth_classifier.pth"
RESNET_TYPE = "resnet18"
CLOTHES_CATEGORY_DIR = "data/categories"
MASK_DIR = "data/alpha"

def load_model(model, checkpoint):
    """Load model state.

    :param model: model whose weights are to be loaded
    :param checkpoint: path to the checkpoint file
    :param devices:
    :returns:
    """
    
    dd = torch.load(checkpoint, map_location=torch.device('cpu'), weights_only=True)
    model.load_state_dict(dd['model'])
    return dd['epoch']

def initialize_model(checkpoint):
    model = FashionResnet(50, 1000, RESNET_TYPE)
    load_model(model, checkpoint)
    return model

def load_image(filename, mask_path):
    """Load an image.

    :param filename: path to image
    :param root: can be specified, if filename is a relative path
    :returns: an image of dimension (1,3,224,224).
    """
    transform_list = [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
    ]
    transformer = transforms.Compose(transform_list)
    img = np.array(Image.open(filename))[:, :, :3].astype(np.float32)
    if mask_path:
        mask = np.array(Image.open(mask_path)).astype(np.float32)/255.0
        img = img*mask[:, :, np.newaxis]
    img = Image.fromarray(img.astype(np.uint8))
    tensor = transformer(img.copy())
    img = np.array(img)
    return img, tensor.unsqueeze(0)

def get_attr_name():
    filename = "data/models/list_attr_cloth.txt"
    f = open(filename)
    num_files = int(f.readline())
    f.readline()
    attrs_name = []
    attrs_type = torch.zeros(num_files)
    i = 0
    for line in f:
        word = line.strip()[:-1].strip()
        word2 = line.strip()[-1]
        attrs_name.append(word)
        attrs_type[i] = float(word2)
        i = i + 1
    f.close()
    return attrs_name, attrs_type

def get_ctg_name():
    filename = "data/models/list_category_cloth.txt"
    f = open(filename)
    f.readline()
    f.readline()
    Ctg_name = []
    Ctg_type = []
    for line in f:
        word = line.strip()[:-1].strip()
        word2 = line.strip()[-1]
        Ctg_name.append(word)
        Ctg_type.append(word2)
    f.close()
    return Ctg_name, Ctg_type


def plot_classification(image, image_path, out_cls, out_bin, out_bbox, mask_idx,softmax_temp=1.0, top_k=3):
    # Ensure the image is in the correct format for display
    if image.dtype != np.uint8:
        image = (image * 255).astype(np.uint8)

    # Create directory for output if it doesn't exist
    os.makedirs(CLOTHES_CATEGORY_DIR, exist_ok=True)
    image_path_suffix = image_path.split("/")[-1].split(".")[0]
    out_file = os.path.join(CLOTHES_CATEGORY_DIR, f"{image_path_suffix}_{mask_idx}.png")

    # Set up the figure grid for displaying image, category, and attributes
    fig, (img_subplot, dist_subplot) = plt.subplots(1, 2, figsize=(20, 9))
    bins = [plt.subplot(2, 5, i + 6) for i in range(5)]  # bins for attributes

    # Display the image with bounding box
    img_subplot.imshow(image)
    sz = image.shape[-1]
    x1, y1, x2, y2 = out_bbox[0] * sz
    rect = patches.Rectangle((x1, y1), x2 - x1, y2 - y1, linewidth=1, edgecolor='r', facecolor='none')
    img_subplot.add_patch(rect)

    # Plot category probabilities
    dist_subplot.bar(np.arange(len(out_cls[0])), torch.softmax(out_cls / softmax_temp, dim=1)[0])
    dist_subplot.set_xticks(np.arange(len(category_names)))
    dist_subplot.set_xticklabels(category_names, rotation='vertical')
    dist_subplot.set_xlabel("Category")
    dist_subplot.set_ylabel("Probability")

    # Plot attribute predictions
    annos = {}
    for j in range(1, 6):
        out_bin_subset = out_bin.clone()
        out_bin_subset[:, (attr_types != j)] = -1000.0
        this_topk_values, this_topk_indices = out_bin_subset.topk(top_k, 1, True, True)
        this_topk_values = torch.sigmoid(this_topk_values[0])
        this_topk_indices = this_topk_indices.numpy()[0]
        this_attr_names = attr_names[this_topk_indices]
        annos[attr_type_names[j - 1]] = (this_attr_names, this_topk_values)

    for i, key in enumerate(annos.keys()):
        names, probs = annos[key]
        probs = np.asarray([x.item() for x in probs])
        probs_norm = probs / sum(probs)
        labels = [f"{name}\n({prob:.2f})" for name, prob in zip(names, probs_norm)]
        bins[i].pie(probs_norm, labels=labels)
        bins[i].set_title(key)

    fig.savefig(out_file)
    plt.close(fig)


model = initialize_model(CLASSIFIER_CHECKPOINT)
attr_names, attr_types = get_attr_name()
category_names, category_types = get_ctg_name()
category_names = ['n/a'] + category_names[0:-1]
attr_names = np.asarray(attr_names)
attr_types = np.asarray(attr_types)
attr_type_names = ['texture', 'fabric', 'shape', 'part', 'style']

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--image_path", type=str, required=True)
    parser.add_argument("--mask_idx", type=int, default=0, required=True)
    args = parser.parse_args()
    
    mask_idx = args.mask_idx
    image_path = args.image_path
    image_stem = image_path.split("/")[-1].split(".")[0]

    if mask_idx > 0:
        mask_path = os.path.join(MASK_DIR, f"{image_stem}_{mask_idx}.png")
    else:
        mask_path = None

    image, tensor = load_image(image_path, mask_path)
    with torch.no_grad():
        out_cls, out_bin, out_bbox = model(tensor)

    out_cls = out_cls.mean(dim=0, keepdim=True)
    out_bin = out_bin.mean(dim=0, keepdim=True)
    
    # Get the predicted category index
    _, predicted_category_idx = torch.max(out_cls, 1)
    
    # Map the predicted category index to its name
    predicted_category_name = category_names[predicted_category_idx.item()]
    
    # Print or use the predicted category name
    print(f"Predicted Category: {predicted_category_name}")
    
    # Plot the classification results
    plot_classification(image, args.image_path, out_cls, out_bin, out_bbox, mask_idx)

if __name__ == "__main__":
    main()