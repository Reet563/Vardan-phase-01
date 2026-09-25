"""
Transport Service
-----------------
Calculates transportation CO₂ emissions (LCA Stage A4) based on vehicle
characteristics, cargo weight, and transport distance.
"""
from __future__ import annotations

from typing import Any, Dict


VEHICLES: dict[str, dict[str, Any]] = {
    "Bike": {
        "vehicle_weight_kg": 120.0,
        "base_emission_g_per_km": 25.0,
        "icon": "Bike",
        "description": "Light cargo bicycle / two-wheeler",
    },
    "Electric Van": {
        "vehicle_weight_kg": 1500.0,
        "base_emission_g_per_km": 40.0,
        "icon": "Zap",
        "description": "Zero-tailpipe emission light commercial EV",
    },
    "CNG Truck": {
        "vehicle_weight_kg": 970.0,
        "base_emission_g_per_km": 120.0,
        "icon": "Fuel",
        "description": "Compressed natural gas medium utility truck",
    },
    "Diesel Van": {
        "vehicle_weight_kg": 2000.0,
        "base_emission_g_per_km": 180.0,
        "icon": "Truck",
        "description": "Standard heavy-duty diesel transport van",
    },
    "Heavy Freight Truck": {
        "vehicle_weight_kg": 14000.0,
        "base_emission_g_per_km": 680.0,
        "icon": "Truck",
        "description": "Heavy multi-axle freight carrier for bulk materials",
    },
}


class TransportService:
    """Service layer for vehicle transportation emissions (LCA A4)."""

    def get_vehicles(self) -> dict[str, dict[str, Any]]:
        """Return available vehicle dictionary and specs."""
        return VEHICLES

    def calculate_emissions(
        self,
        vehicle_type: str,
        distance_km: float,
        load_weight_kg: float,
    ) -> dict[str, Any]:
        """
        Calculate estimated CO2 emissions for transport.

        Parameters
        ----------
        vehicle_type : str
            Selected vehicle type key.
        distance_km : float
            Distance travelled in kilometres.
        load_weight_kg : float
            Weight of the load in kilograms.

        Returns
        -------
        dict containing complete calculation breakdown.
        """
        if vehicle_type not in VEHICLES:
            raise ValueError(f"Invalid vehicle type: {vehicle_type}. Available: {list(VEHICLES.keys())}")

        if distance_km < 0:
            raise ValueError("Distance cannot be negative.")

        if load_weight_kg < 0:
            raise ValueError("Load weight cannot be negative.")

        vehicle = VEHICLES[vehicle_type]
        vehicle_weight_kg = float(vehicle["vehicle_weight_kg"])
        base_emission_g_per_km = float(vehicle["base_emission_g_per_km"])

        total_weight_kg = vehicle_weight_kg + load_weight_kg
        weight_factor = total_weight_kg / vehicle_weight_kg

        # Emissions = base emission rate * distance * weight factor
        emissions_g = base_emission_g_per_km * distance_km * weight_factor
        emissions_kg = emissions_g / 1000.0

        # Normalized transport emissions per kg of transported material
        per_kg_transport_co2e = (emissions_kg / load_weight_kg) if load_weight_kg > 0 else 0.0

        return {
            "vehicle_type": vehicle_type,
            "vehicle_weight_kg": vehicle_weight_kg,
            "load_weight_kg": load_weight_kg,
            "total_weight_kg": total_weight_kg,
            "distance_km": distance_km,
            "base_emission_g_per_km": base_emission_g_per_km,
            "weight_factor": weight_factor,
            "co2_emissions_g": emissions_g,
            "co2_emissions_kg": emissions_kg,
            "per_kg_transport_co2e": per_kg_transport_co2e,
        }


# Module-level singleton
transport_service = TransportService()


# ============================================================
# CLI INTERACTIVE RUNNER (Backwards-compatible standalone use)
# ============================================================
def select_vehicle():
    vehicle_types = list(VEHICLES.keys())
    print("\n==============================")
    print("       VEHICLE SELECTION")
    print("==============================")
    for number, vehicle in enumerate(vehicle_types, start=1):
        print(f"{number}. {vehicle}")

    while True:
        try:
            choice = int(input("\nSelect vehicle: "))
            if 1 <= choice <= len(vehicle_types):
                return vehicle_types[choice - 1]
            print(f"Please select a number between 1 and {len(vehicle_types)}.")
        except ValueError:
            print("Invalid input. Please enter a number.")


def get_distance():
    while True:
        try:
            distance = float(input("\nDistance driven (km): "))
            if distance < 0:
                print("Distance cannot be negative.")
                continue
            if distance == 0:
                print("Distance must be greater than 0.")
                continue
            return distance
        except ValueError:
            print("Invalid input. Please enter a number.")


def get_load_weight():
    while True:
        try:
            load_weight = float(input("\nLoad weight (kg): "))
            if load_weight < 0:
                print("Load weight cannot be negative.")
                continue
            return load_weight
        except ValueError:
            print("Invalid input. Please enter a number.")


def display_result(result):
    print("\n")
    print("==========================================")
    print("          EMISSIONS RESULT")
    print("==========================================")
    print(f"Vehicle Type       : {result['vehicle_type']}")
    print(f"Vehicle Weight     : {result['vehicle_weight_kg']:.2f} kg")
    print(f"Load Weight        : {result['load_weight_kg']:.2f} kg")
    print(f"Total Weight       : {result['total_weight_kg']:.2f} kg")
    print(f"Distance           : {result['distance_km']:.2f} km")
    print(f"Base Emission Rate : {result['base_emission_g_per_km']:.2f} g/km")
    print(f"Weight Factor      : {result['weight_factor']:.3f}")
    print("------------------------------------------")
    print(f"Estimated CO2      : {result['co2_emissions_g']:.2f} g")
    print(f"Estimated CO2      : {result['co2_emissions_kg']:.2f} kg")
    print("==========================================")


def main():
    print("\n==========================================")
    print("       VEHICLE CO2 EMISSIONS CALCULATOR")
    print("==========================================")
    vehicle_type = select_vehicle()
    distance_km = get_distance()
    load_weight_kg = get_load_weight()
    result = transport_service.calculate_emissions(
        vehicle_type=vehicle_type,
        distance_km=distance_km,
        load_weight_kg=load_weight_kg,
    )
    display_result(result)


if __name__ == "__main__":
    main()
