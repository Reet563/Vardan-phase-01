"""
Alternatives Service
--------------------
Provides green material alternatives for a given standard material.
"""
from typing import List, Dict

# Hardcoded green materials dataset extracted from the PDF
GREEN_MATERIALS = [
    {"name": "Hempcrete block, density 300 kg/m3", "carbon": -0.41, "category": "block,wall,concrete"},
    {"name": "Mycelium insulation board", "carbon": -0.15, "category": "insulation,board"},
    {"name": "Bamboo laminated timber beam (Glubam)", "carbon": 0.18, "category": "timber,wood,beam"},
    {"name": "Wood fiberboard insulation", "carbon": -0.45, "category": "insulation,wood,board"},
    {"name": "Bio-char enriched clay render", "carbon": -0.55, "category": "render,clay,plaster"},
    {"name": "Recycled glass pozzolan mortar mix", "carbon": 0.042, "category": "mortar,glass"},
    {"name": "Cross-Laminated Timber (CLT)", "carbon": -0.61, "category": "timber,wood"},
    {"name": "Low-carbon concrete with LC3", "carbon": 0.095, "category": "concrete,cement"},
    {"name": "Compressed Earth Block (CEB), unfired natural clay", "carbon": 0.018, "category": "block,wall"},
    {"name": "Bio-asphalt waterproof membrane coating", "carbon": 0.18, "category": "asphalt,waterproof,membrane"},
]

class AlternativesService:
    def get_alternatives(self, material_name: str, count: int = 3) -> List[Dict[str, float]]:
        name_lower = material_name.lower()
        
        # Determine likely categories based on keywords
        keywords = name_lower.replace(",", "").split()
        
        scored_alternatives = []
        for gm in GREEN_MATERIALS:
            score = 0
            for cat in gm["category"].split(","):
                if cat in keywords or cat in name_lower:
                    score += 10
            
            # Penalize slightly if it's not a match, but keep it as a fallback
            scored_alternatives.append((score, gm))
            
        # Sort by score (descending), then by carbon (ascending/most negative)
        scored_alternatives.sort(key=lambda x: (x[0], x[1]["carbon"]), reverse=True)
        
        # Select top `count`
        top_alts = [x[1] for x in scored_alternatives[:count]]
        
        return [{"material_name": a["name"], "embodied_carbon": a["carbon"]} for a in top_alts]

alternatives_service = AlternativesService()
