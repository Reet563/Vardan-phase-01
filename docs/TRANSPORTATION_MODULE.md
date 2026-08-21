# 🚛 Vehicle Transportation Emissions Module (LCA Stage A4)
### Project Vardan — Life Cycle Assessment & Materials Intelligence

---

## 📌 1. Overview & Standard Alignment

Under international construction Life Cycle Assessment standards (**EN 15978 / ISO 21930 / ICE V5**), carbon accounting is structured across discrete life-cycle stages:

* **Stage A1–A3 (Product Stage):** Raw material supply, transport to factory, and manufacturing embodied carbon (sourced from ICE V5 database).
* **Stage A4 (Construction Process — Transport to Site):** **Logistics transit from the manufacturing plant/distributor to the construction site.**
* **Stage B1–B7 (Use Stage):** 100-year operational resilience, environmental degradation, and calamity repair cycles (modelled via Random Forest ML).

This module implements the **LCA Stage A4** calculation, allowing Project Vardan to compute true **Cradle-to-Site** and **Cradle-to-Lifespan** carbon footprints.

---

## 🏎️ 2. Vehicle Fleet Database

The transportation module maintains a calibrated commercial fleet registry:

| Vehicle Type | Curb Weight ($W_{\text{vehicle}}$) | Base Rate ($R_{\text{base}}$) | Fuel / Energy Profile | Typical Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Cargo Bike** | $120\text{ kg}$ | $25.0\text{ g CO}_2/\text{km}$ | Human / Micro-e-cargo | Short-range urban micro-logistics |
| **Electric Van** | $1,500\text{ kg}$ | $40.0\text{ g CO}_2/\text{km}$ | Grid Electricity (Zero-Tailpipe) | Clean urban light commercial delivery |
| **CNG Truck** | $970\text{ kg}$ | $120.0\text{ g CO}_2/\text{km}$ | Compressed Natural Gas | Medium utility regional transport |
| **Diesel Van** | $2,000\text{ kg}$ | $180.0\text{ g CO}_2/\text{km}$ | Heavy-Duty Diesel | Standard industrial construction haulage |

---

## 🧮 3. Mathematical Logic & Formulation

The engine applies a physics-aligned mass-penalty model:

```mermaid
graph LR
    A["Payload (kg) + Curb Weight (kg)"] --> B["1. Total Gross Weight (kg)"]
    B --> C["2. Dynamic Weight Factor Multiplier"]
    C --> D["3. Total Journey CO₂ (g & kg)"]
    D --> E["4. Material-Normalized Carbon (kg CO₂e/kg)"]
    E --> F["5. Full Lifecycle Aggregation"]
```

### Step 1: Gross Combined Weight ($W_{\text{total}}$)
$$\text{Total Weight } (W_{\text{total}}) = W_{\text{vehicle}} + W_{\text{load}}$$

### Step 2: Dynamic Load Weight Factor ($\gamma$)
As cargo payload increases, vehicle rolling resistance and inertial torque requirements rise proportionally:
$$\gamma = \frac{W_{\text{total}}}{W_{\text{vehicle}}} = 1 + \frac{W_{\text{load}}}{W_{\text{vehicle}}}$$

* **Empty vehicle ($W_{\text{load}} = 0$):** $\gamma = 1.000$ (runs at base emission rate).
* **Loaded vehicle ($W_{\text{load}} = W_{\text{vehicle}}$):** $\gamma = 2.000$ (engine fuel burn & emissions scale by $2\times$).

### Step 3: Total Journey Emissions
$$\text{Emissions}_{\text{grams}} = R_{\text{base}} \times \text{Distance}_{\text{km}} \times \gamma$$
$$\text{Emissions}_{\text{kg}} = \frac{\text{Emissions}_{\text{grams}}}{1000}$$

### Step 4: Normalization per Kilogram of Transported Material ($E_{\text{norm}}$)
Because the ICE V5 database defines material baseline carbon in $\text{kg CO}_2\text{e / kg material}$, the total journey emissions are normalized per kilogram of transported cargo:
$$E_{\text{norm}} = \frac{\text{Emissions}_{\text{kg}}}{W_{\text{load}}} \quad (\text{kg CO}_2\text{e / kg material})$$

### Step 5: Full Lifecycle Aggregation
$$\text{Cradle-to-Site GWP (A1–A4)} = \text{Base GWP}_{\text{A1–A3}} + E_{\text{norm}}$$
$$\text{Total 100-Yr Project Footprint} = \text{Predicted 100-Yr Dynamic GWP}_{\text{B1–B7}} + E_{\text{norm}}$$

---

## 🔬 4. Step-by-Step Calculation Example

Suppose we transport **$1,000\text{ kg}$** of Blast Furnace Slag Cement over **$50\text{ km}$** using a **Diesel Van**:

1. **Vehicle Specs:** $W_{\text{vehicle}} = 2,000\text{ kg}$, $R_{\text{base}} = 180\text{ g/km}$.
2. **Gross Weight:** $W_{\text{total}} = 2,000 + 1,000 = 3,000\text{ kg}$.
3. **Weight Factor:** $\gamma = \frac{3,000}{2,000} = 1.500\times$.
4. **Total Trip Emissions:**
   $$\text{Emissions}_{\text{grams}} = 180 \times 50 \times 1.500 = 13,500\text{ g CO}_2$$
   $$\text{Emissions}_{\text{kg}} = \frac{13,500}{1000} = 13.50\text{ kg CO}_2$$
5. **Normalized per-kg Carbon ($E_{\text{norm}}$):**
   $$E_{\text{norm}} = \frac{13.50\text{ kg CO}_2}{1,000\text{ kg material}} = \mathbf{0.0135\text{ kg CO}_2\text{e / kg}}$$
6. **Lifecycle Integration:**
   * Material Initial Embodied Carbon (A1–A3): $0.2500\text{ kg CO}_2\text{e / kg}$
   * Calamity 100-Year Dynamic GWP: $0.2627\text{ kg CO}_2\text{e / kg}$
   * **Total Lifecycle Carbon:** $0.2627 + 0.0135 = \mathbf{0.2762\text{ kg CO}_2\text{e / kg}}$

---

## 🌐 5. API Reference

### `GET /api/v1/transport/vehicles`
Returns the list of supported fleet vehicles with curb weights and base emission rates.

**Response:**
```json
{
  "count": 4,
  "vehicles": [
    {
      "vehicle_type": "Electric Van",
      "vehicle_weight_kg": 1500.0,
      "base_emission_g_per_km": 40.0,
      "icon": "Zap",
      "description": "Zero-tailpipe emission light commercial EV"
    },
    {
      "vehicle_type": "Diesel Van",
      "vehicle_weight_kg": 2000.0,
      "base_emission_g_per_km": 180.0,
      "icon": "Truck",
      "description": "Standard heavy-duty diesel transport van"
    }
  ]
}
```

### `POST /api/v1/transport/calculate`
Standalone calculation for transportation emissions.

**Request:**
```json
{
  "vehicle_type": "Diesel Van",
  "distance_km": 50.0,
  "load_weight_kg": 1000.0
}
```

**Response:**
```json
{
  "vehicle_type": "Diesel Van",
  "vehicle_weight_kg": 2000.0,
  "load_weight_kg": 1000.0,
  "total_weight_kg": 3000.0,
  "distance_km": 50.0,
  "base_emission_g_per_km": 180.0,
  "weight_factor": 1.5,
  "co2_emissions_g": 13500.0,
  "co2_emissions_kg": 13.5,
  "per_kg_transport_co2e": 0.0135
}
```

### `POST /api/v1/predict` (Unified Endpoint)
Predicts 100-year Dynamic GWP combined with A4 Transport Logistics.

**Request:**
```json
{
  "material_name": "% Cement Replacement - Blast Furnace Slag",
  "extreme_weather_events": 15.0,
  "temperature_anomaly": 1.2,
  "sea_level_rise": 12.0,
  "policy_score": 65.0,
  "transport": {
    "vehicle_type": "Diesel Van",
    "distance_km": 50.0,
    "load_weight_kg": 1000.0
  }
}
```

**Response:**
```json
{
  "material_name": "% Cement Replacement - Blast Furnace Slag",
  "base_gwp_A1A3": 0.25,
  "predicted_100yr_gwp": 0.26266,
  "calamity_carbon_penalty": 0.01266,
  "transport": {
    "vehicle_type": "Diesel Van",
    "vehicle_weight_kg": 2000.0,
    "load_weight_kg": 1000.0,
    "total_weight_kg": 3000.0,
    "distance_km": 50.0,
    "base_emission_g_per_km": 180.0,
    "weight_factor": 1.5,
    "co2_emissions_g": 13500.0,
    "co2_emissions_kg": 13.5,
    "per_kg_transport_co2e": 0.0135
  },
  "total_cradle_to_site_gwp": 0.2635,
  "total_lifecycle_carbon": 0.27616
}
```

---

## 💻 6. Standalone CLI Usage
The transportation script can also be executed as an interactive terminal CLI:

```bash
python backend/app/services/transport_service.py
```
