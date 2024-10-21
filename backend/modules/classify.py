import torch
from transformers import AutoModel, AutoProcessor
from PIL import Image
import argparse
import pandas as pd
import numpy as np


model = AutoModel.from_pretrained('Marqo/marqo-fashionSigLIP', trust_remote_code=True)
processor = AutoProcessor.from_pretrained('Marqo/marqo-fashionSigLIP', trust_remote_code=True)
styles = pd.read_csv(f"data/datasets/all_styles_processed.csv")
style_dict = {label_type: list(group['label_value'].unique()) \
              for label_type, group in styles.groupby('label_type')}
RELATIVE_THRESHOLD = 0.5
SAVED_EMBEDDINGS_PATH = "data/category_embeddings.npy"

# Load pre-computed text features
text_features_dict = np.load(SAVED_EMBEDDINGS_PATH, allow_pickle=True).item()

def apply_mask(image, mask_path=None):
    if mask_path is None:
        return image
    image_array = np.array(image)
    mask = Image.open(mask_path).convert('L')  # Convert to grayscale
    mask_array = np.array(mask)
    mask_array = mask_array / 255.0
    masked_image_array = image_array * mask_array[:, :, np.newaxis]
    return Image.fromarray(masked_image_array.astype('uint8'))


def classify_image(image):
    # Process the image
    processed = processor(images=[image], padding='max_length', return_tensors="pt")
    with torch.no_grad():
        image_features = model.get_image_features(processed['pixel_values'], normalize=True)

    text_probs = {}
    for label_type, text_features in text_features_dict.items():
        text_features = torch.from_numpy(text_features).to(image_features.device)
        text_probs[label_type] = (100.0 * image_features @ text_features.T).softmax(dim=-1).squeeze(0)

    results = {}
    for label_type, probs in text_probs.items():
        max_prob, max_index = torch.max(probs, dim=0)
        max_prob_value = max_prob.item()
        
        results[label_type] = []
        for i, (label_value, prob) in enumerate(zip(style_dict[label_type], probs)):
            prob_value = prob.item()
            if prob_value == max_prob_value or prob_value >= max_prob_value * RELATIVE_THRESHOLD:
                results[label_type].append((label_value, prob_value))

    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--image_path", type=str, required=True)
    parser.add_argument("--mask_idx", type=int, default=0)
    args = parser.parse_args()

    image_path = args.image_path
    mask_idx = args.mask_idx
    image_stem = image_path.split("/")[-1].split(".")[0]
    if mask_idx != 0:
        mask_path = f"data/alpha/{image_stem}_{mask_idx}.png"
    else:
        mask_path = None

    # Load and mask the image
    image = Image.open(image_path)
    image = apply_mask(image, mask_path)

    results = classify_image(image)

    for label_type, results_list in results.items():
        print(f"\n{label_type.capitalize()}:")
        for label_value, prob_value in results_list:
            print(f"  {label_value}: {prob_value:.2f}%")

if __name__ == "__main__":
    main()
