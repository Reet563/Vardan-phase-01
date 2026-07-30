"""
Prediction Service
------------------
Wraps the trained scikit-learn / joblib model and exposes a clean inference
interface for 100-year GWP predictions.

The model file is searched in this priority order:
  1. <project_root>/models/gwp_100yr_model.joblib
  2. <backend>/models/gwp_100yr_model.joblib
  3. <backend>/gwp_100yr_model.joblib
  4. <project_root>/gwp_100yr_model.joblib
"""
from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd
from fastapi import HTTPException, status

from app.schemas.gwp_schema import PredictionRequest

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model path resolution
# ---------------------------------------------------------------------------
_MODEL_FILENAME = "gwp_100yr_model.joblib"

_SERVICES_DIR = Path(__file__).resolve().parent
_APP_DIR = _SERVICES_DIR.parent
_BACKEND_DIR = _APP_DIR.parent
_PROJECT_ROOT = _BACKEND_DIR.parent

_MODEL_SEARCH_PATHS: list[Path] = [
    _PROJECT_ROOT / "models" / _MODEL_FILENAME,
    _BACKEND_DIR / "models" / _MODEL_FILENAME,
    _BACKEND_DIR / _MODEL_FILENAME,
    _PROJECT_ROOT / _MODEL_FILENAME,
]

# Feature column order MUST match what the model was trained on
_FEATURE_COLUMNS = [
    "Base_GWP_kgCO2e_kg",
    "Extreme_Weather_Events",
    "Temperature_Anomaly",
    "Sea_Level_Rise",
    "Policy_Score",
]


def _resolve_model_path() -> Path:
    """Return the first existing model path from the search list."""
    for p in _MODEL_SEARCH_PATHS:
        if p.exists():
            logger.info("Found model file at: %s", p)
            return p
    searched = "\n  ".join(str(p) for p in _MODEL_SEARCH_PATHS)
    raise FileNotFoundError(
        f"'{_MODEL_FILENAME}' not found. Searched:\n  {searched}"
    )


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------
class PredictionService:
    """Service layer for ML-based 100-year GWP prediction."""

    def __init__(self) -> None:
        self._model = None  # Lazy-loaded on first inference call

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _load_model(self):
        """Load the serialised joblib model from disk (called once)."""
        if self._model is not None:
            return
        try:
            import joblib  # noqa: PLC0415
            import warnings  # noqa: PLC0415
            from sklearn.exceptions import InconsistentVersionWarning  # noqa: PLC0415

            model_path = _resolve_model_path()
            with warnings.catch_warnings():
                warnings.filterwarnings("ignore", category=InconsistentVersionWarning)
                self._model = joblib.load(model_path)
            logger.info("Model loaded from %s", model_path.name)
        except FileNotFoundError as exc:
            logger.error("Model file missing: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Prediction model is not available. "
                    "Please ensure 'gwp_100yr_model.joblib' is placed in the "
                    "models/ directory."
                ),
            ) from exc
        except Exception as exc:
            logger.exception("Failed to load model: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to load prediction model: {exc}",
            ) from exc

    def _build_feature_dataframe(
        self, request: PredictionRequest, base_gwp: float
    ) -> pd.DataFrame:
        """
        Construct a single-row DataFrame with the exact column order the
        model expects.
        """
        return pd.DataFrame(
            [
                {
                    "Base_GWP_kgCO2e_kg": base_gwp,
                    "Extreme_Weather_Events": request.extreme_weather_events,
                    "Temperature_Anomaly": request.temperature_anomaly,
                    "Sea_Level_Rise": request.sea_level_rise,
                    "Policy_Score": request.policy_score,
                }
            ],
            columns=_FEATURE_COLUMNS,
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def predict_100yr_gwp(
        self, request: PredictionRequest, base_gwp: float
    ) -> float:
        """
        Predict the 100-year GWP for a material under the supplied climate
        scenario.

        Parameters
        ----------
        request:
            Validated ``PredictionRequest`` containing climate feature values.
        base_gwp:
            Baseline embodied carbon (kg CO₂e / kg) from the ICE V5 dataset.

        Returns
        -------
        float
            Predicted 100-year GWP in kg CO₂e / kg.

        Raises
        ------
        HTTPException(503)
            If the model file cannot be found.
        HTTPException(500)
            If the model raises an unexpected error during inference.
        """
        self._load_model()

        feature_df = self._build_feature_dataframe(request, base_gwp)

        try:
            prediction = self._model.predict(feature_df)
            return float(prediction[0])
        except Exception as exc:
            logger.exception("Model inference failed: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Model inference failed: {exc}",
            ) from exc


# ---------------------------------------------------------------------------
# Module-level singleton (imported by routers)
# ---------------------------------------------------------------------------
prediction_service = PredictionService()
