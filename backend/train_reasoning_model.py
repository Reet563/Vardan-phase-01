import os
import pandas as pd
import numpy as np
import joblib
from sklearn.tree import DecisionTreeClassifier, export_text

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
MODELS_DIR = os.path.join(PROJECT_ROOT, "models")
ICE_DB_PATH = os.path.join(DATA_DIR, "ICE_V5_Cleaned_Materials.csv")
MODEL_OUT_PATH = os.path.join(MODELS_DIR, "whitebox_reasoning_model.joblib")

def extract_features(name: str, carbon: float):
    name_lower = name.lower()
    is_bio = 1 if any(word in name_lower for word in ['hemp', 'wood', 'timber', 'bio', 'mycelium', 'bamboo', 'straw', 'cork', 'flax', 'jute', 'algae']) else 0
    is_recycled = 1 if any(word in name_lower for word in ['recycled', 'scrap', 'waste', 'reclaimed']) else 0
    return {
        "Embodied_Carbon": carbon,
        "Is_Bio_Based": is_bio,
        "Is_Recycled": is_recycled
    }

def main():
    print("Loading ICE V5 Database...")
    ice_df = pd.read_csv(ICE_DB_PATH)
    
    # We will label ICE V5 materials generally as Standard (0), unless they match green keywords and have low carbon
    dataset = []
    
    for _, row in ice_df.iterrows():
        features = extract_features(row['Material_Name'], row['Embodied_Carbon_kgCO2e_kg'])
        # Simple heuristic to label ground truth for training:
        # Green (1) if Carbon < 0.15 or it's bio-based/recycled and < 0.5
        label = 1 if features['Embodied_Carbon'] < 0.15 or (features['Is_Bio_Based'] and features['Embodied_Carbon'] < 0.5) else 0
        features['Label'] = label
        dataset.append(features)

    # Add Green Materials from the newly provided dataset (Sample of the PDF OCR)
    green_materials_raw = [
        ("Hempcrete block, density 300 kg/m3", -0.41),
        ("Straw bale, dense agricultural residue", -0.65),
        ("Mycelium insulation board", -0.15),
        ("Bamboo laminated timber beam (Glubam)", 0.18),
        ("Wood fiberboard insulation", -0.45),
        ("Bio-char enriched clay render", -0.55),
        ("Recycled glass pozzolan mortar mix", 0.042),
        ("Cross-Laminated Timber (CLT)", -0.61),
        ("Recycled aluminum sheet", 0.65), # Recycled but higher carbon
        ("Low-carbon concrete with LC3", 0.095)
    ]
    
    for name, carbon in green_materials_raw:
        features = extract_features(name, carbon)
        label = 1 if features['Embodied_Carbon'] < 0.20 or features['Is_Bio_Based'] or features['Is_Recycled'] else 0
        features['Label'] = label
        dataset.append(features)
        
    df = pd.DataFrame(dataset)
    
    X = df[['Embodied_Carbon', 'Is_Bio_Based', 'Is_Recycled']]
    y = df['Label']
    
    print("Training Whitebox Decision Tree Classifier...")
    # Max depth 3 for high interpretability
    clf = DecisionTreeClassifier(max_depth=3, random_state=42)
    clf.fit(X, y)
    
    # Print the tree rules to console
    tree_rules = export_text(clf, feature_names=list(X.columns))
    print("Decision Tree Rules:")
    print(tree_rules)
    
    # Save the model
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(clf, MODEL_OUT_PATH)
    print(f"Model saved to {MODEL_OUT_PATH}")

if __name__ == "__main__":
    main()
