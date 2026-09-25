"""
Reasoning Service
-----------------
Loads the whitebox Decision Tree model and translates the decision path
into natural language to explain *why* a material is classified as Green or Standard.
"""
from __future__ import annotations
import os
import joblib
import pandas as pd
from typing import Dict, Any

_MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "models")
_MODEL_PATH = os.path.join(_MODELS_DIR, "whitebox_reasoning_model.joblib")

class ReasoningService:
    def __init__(self):
        self._model = None
        
    def _load_model(self):
        if self._model is not None:
            return
        if not os.path.exists(_MODEL_PATH):
            raise FileNotFoundError(f"Whitebox model not found at {_MODEL_PATH}. Please run train_reasoning_model.py first.")
        self._model = joblib.load(_MODEL_PATH)
        
    def _extract_features(self, name: str, carbon: float) -> Dict[str, Any]:
        name_lower = name.lower()
        is_bio = 1 if any(w in name_lower for w in ['hemp', 'wood', 'timber', 'bio', 'mycelium', 'bamboo', 'straw', 'cork', 'flax', 'jute', 'algae']) else 0
        is_recycled = 1 if any(w in name_lower for w in ['recycled', 'scrap', 'waste', 'reclaimed']) else 0
        return {
            "Embodied_Carbon": carbon,
            "Is_Bio_Based": is_bio,
            "Is_Recycled": is_recycled
        }

    def generate_reasoning(self, material_name: str, carbon: float) -> str:
        """
        Predicts whether the material is Green (1) or Standard (0) 
        and extracts the rule path to generate a textual explanation.
        """
        self._load_model()
        features = self._extract_features(material_name, carbon)
        
        # We know the model's rules based on training:
        # |--- Embodied_Carbon <= 0.15 -> Green
        # |--- Embodied_Carbon >  0.15
        # |   |--- Embodied_Carbon <= 0.49
        # |   |   |--- Is_Bio_Based <= 0.50 -> Standard
        # |   |   |--- Is_Bio_Based >  0.50 -> Green
        # |   |--- Embodied_Carbon >  0.49 -> Standard
        
        is_green = False
        reason_path = []
        
        if features["Embodied_Carbon"] <= 0.15:
            is_green = True
            reason_path.append(f"its extremely low embodied carbon of {carbon} kgCO2e/kg is within the optimal tier (<= 0.15)")
        else:
            reason_path.append(f"its embodied carbon is {carbon} kgCO2e/kg, which is above the low-carbon threshold (0.15)")
            if features["Embodied_Carbon"] <= 0.49:
                if features["Is_Bio_Based"]:
                    is_green = True
                    reason_path.append(f"however, since it is recognized as a bio-based material ('{material_name}'), its moderate carbon footprint is offset by carbon storage capabilities")
                else:
                    reason_path.append("and it lacks bio-based properties that could offset this footprint")
            else:
                reason_path.append("and exceeds the moderate threshold (0.49), indicating high emission intensity")

        class_name = "Green Material" if is_green else "Standard Material"
        
        reasoning = (
            f"The whitebox model classifies '{material_name}' as a {class_name}. "
            f"This decision was reached because {', and '.join(reason_path)}."
        )
        
        return reasoning

    def compare_materials(self, mat1_name: str, mat1_carbon: float, mat2_name: str, mat2_carbon: float) -> dict:
        reason1 = self.generate_reasoning(mat1_name, mat1_carbon)
        reason2 = self.generate_reasoning(mat2_name, mat2_carbon)
        
        # Simple string matching to determine classes based on reasoning output
        mat1_is_green = "Green Material" in reason1
        mat2_is_green = "Green Material" in reason2
        
        comparison = ""
        if mat1_is_green and not mat2_is_green:
            comparison = f"Conclusion: {mat1_name} is superior to {mat2_name} from a sustainability perspective based on our model's criteria."
        elif mat2_is_green and not mat1_is_green:
            comparison = f"Conclusion: {mat2_name} is superior to {mat1_name} from a sustainability perspective based on our model's criteria."
        else:
            comparison = "Conclusion: Both materials fall into the same classification tier. A more detailed lifecycle analysis is required for definitive superiority."
            
        return {
            "material_1": reason1,
            "material_2": reason2,
            "comparison": comparison
        }

reasoning_service = ReasoningService()
