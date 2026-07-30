"""
Material Service
----------------
Loads the ICE V5 Cleaned Materials CSV and exposes helper methods used by
the prediction router.

The CSV is searched in this priority order:
  1. <project_root>/data/ICE_V5_Cleaned_Materials.csv
  2. <backend>/ICE_V5_Cleaned_Materials.csv
  3. <backend>/data/ICE_V5_Cleaned_Materials.csv
"""
from __future__ import annotations

import logging
from pathlib import Path
from functools import lru_cache

import pandas as pd
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# CSV path resolution
# ---------------------------------------------------------------------------
_CSV_FILENAME = "ICE_V5_Cleaned_Materials.csv"

# __file__ → .../backend/app/services/material_service.py
_SERVICES_DIR = Path(__file__).resolve().parent
_APP_DIR = _SERVICES_DIR.parent
_BACKEND_DIR = _APP_DIR.parent
_PROJECT_ROOT = _BACKEND_DIR.parent

_SEARCH_PATHS: list[Path] = [
    _PROJECT_ROOT / "data" / _CSV_FILENAME,
    _BACKEND_DIR / _CSV_FILENAME,
    _BACKEND_DIR / "data" / _CSV_FILENAME,
    _APP_DIR / _CSV_FILENAME,
]


def _resolve_csv_path() -> Path:
    """Return the first existing CSV path from the search list."""
    for p in _SEARCH_PATHS:
        if p.exists():
            logger.info("Found material CSV at: %s", p)
            return p
    searched = "\n  ".join(str(p) for p in _SEARCH_PATHS)
    raise FileNotFoundError(
        f"'{_CSV_FILENAME}' not found. Searched:\n  {searched}"
    )


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------
class MaterialService:
    """Service layer for ICE V5 material data operations."""

    def __init__(self) -> None:
        self._df: pd.DataFrame | None = None

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _load(self) -> pd.DataFrame:
        """Lazy-load and cache the CSV as a DataFrame."""
        if self._df is None:
            csv_path = _resolve_csv_path()
            self._df = pd.read_csv(csv_path)
            # Normalise column names: strip surrounding whitespace
            self._df.columns = self._df.columns.str.strip()
            logger.info(
                "Loaded %d materials from %s", len(self._df), csv_path.name
            )
        return self._df

    def _find_row(self, material_name: str) -> pd.Series:
        """
        Return the DataFrame row for *material_name*.

        Raises
        ------
        HTTPException(404)
            If the material is not found (case-insensitive exact match).
        """
        df = self._load()
        mask = df["Material_Name"].str.strip().str.lower() == material_name.strip().lower()
        matches = df[mask]
        if matches.empty:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Material '{material_name}' not found in the ICE V5 dataset.",
            )
        # If multiple rows match, take the first
        return matches.iloc[0]

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def get_all_materials(self) -> list[str]:
        """Return a sorted list of all unique material names."""
        df = self._load()
        return sorted(df["Material_Name"].str.strip().unique().tolist())

    def get_material_base_gwp(self, material_name: str) -> float:
        """
        Return the Embodied_Carbon_kgCO2e_kg value for *material_name*.

        Parameters
        ----------
        material_name:
            The exact (case-insensitive) name of the material.

        Returns
        -------
        float
            Embodied carbon in kg CO₂e / kg.

        Raises
        ------
        HTTPException(404)
            If the material is not in the dataset.
        HTTPException(422)
            If the GWP value is missing / non-numeric for the material.
        """
        row = self._find_row(material_name)
        raw_value = row["Embodied_Carbon_kgCO2e_kg"]
        try:
            return float(raw_value)
        except (TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    f"GWP value for '{material_name}' is not a valid number: {raw_value!r}"
                ),
            ) from exc


# ---------------------------------------------------------------------------
# Module-level singleton (imported by routers)
# ---------------------------------------------------------------------------
material_service = MaterialService()
