import torch
from transformers import AutoModel, AutoProcessor
from PIL import Image
import argparse
import pandas as pd


model = AutoModel.from_pretrained('Marqo/marqo-fashionSigLIP', trust_remote_code=True)
processor = AutoProcessor.from_pretrained('Marqo/marqo-fashionSigLIP', trust_remote_code=True)
styles = pd.read_csv(f"data/datasets/all_styles_processed.csv")
style_dict = {label_type: list(group['label_value'].unique()) \
              for label_type, group in styles.groupby('label_type')}
RELATIVE_THRESHOLD = 0.8


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--image_path", type=str, required=True)
    parser.add_argument("--mask_idx", type=int, default=0)
    args = parser.parse_args()

    image_path = args.image_path
    mask_idx = args.mask_idx
    image_stem = image_path.split("/")[-1].split(".")[0]
    if mask_idx != 0:
        mask_path = f"data/alpha/{image_stem}_{mask_idx}.jpg"
    else:
        mask_path = None

    # Load and process the image
    image = [Image.open(image_path)]
    mask = [Image.open(mask_path)] if mask_path else None

    processed = processor(images=image, padding='max_length', return_tensors="pt")
    with torch.no_grad():
        image_features = model.get_image_features(processed['pixel_values'], normalize=True)

    text_probs = {}
    for label_type, label_values in style_dict.items():
        # Convert label_values to strings
        label_values = [str(value) for value in label_values]
        processed = processor(text=label_values, images=image, padding='max_length', return_tensors="pt")
        text_features = model.get_text_features(processed['input_ids'], normalize=True)
        text_probs[label_type] = (100.0 * image_features @ text_features.T).softmax(dim=-1).squeeze(0)

    for label_type, probs in text_probs.items():
        max_prob, max_index = torch.max(probs, dim=0)
        max_prob_value = max_prob.item()
        
        print(f"\n{label_type.capitalize()}:")
        for i, (label_value, prob) in enumerate(zip(style_dict[label_type], probs)):
            prob_value = prob.item()
            if prob_value == max_prob_value or prob_value >= max_prob_value * RELATIVE_THRESHOLD:
                print(f"  {label_value}: {prob_value:.2f}%")

if __name__ == "__main__":
    main()