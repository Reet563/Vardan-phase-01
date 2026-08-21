import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=40, leftMargin=40,
        topMargin=40, bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    primary_color = colors.HexColor("#0f172a") # Dark Slate
    teal_color = colors.HexColor("#0d9488") # Teal
    amber_color = colors.HexColor("#d97706") # Amber
    cyan_color = colors.HexColor("#0284c7") # Cyan
    text_dark = colors.HexColor("#1e293b")
    text_muted = colors.HexColor("#64748b")
    bg_light = colors.HexColor("#f8fafc")
    border_color = colors.HexColor("#e2e8f0")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=primary_color,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=teal_color,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=teal_color,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=text_dark,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=text_dark,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Code'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0f172a"),
        backColor=colors.HexColor("#f1f5f9"),
        borderPadding=6,
        spaceAfter=6
    )

    formula_style = ParagraphStyle(
        'Formula_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#0369a1"),
        backColor=colors.HexColor("#f0f9ff"),
        borderPadding=6,
        spaceAfter=6
    )

    story = []

    # Header / Title Banner
    story.append(Paragraph("PROJECT VARDAN", title_style))
    story.append(Paragraph("Materials Intelligence, Climate Resilience & Fleet Logistics (LCA Stage A1–A4 & B1–B7)", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=teal_color, spaceAfter=14))

    # Executive Summary
    story.append(Paragraph("1. Executive Summary", h1_style))
    story.append(Paragraph(
        "<b>Project Vardan</b> is an embodied carbon and climate resilience forecasting platform for the construction industry. "
        "Unlike conventional carbon calculators that only measure upfront factory manufacturing emissions (A1–A3), Vardan integrates "
        "<b>three synchronized modules</b> under the EN 15978 and ISO 21930 international standards:",
        body_style
    ))
    story.append(Paragraph("• <b>LCA Module A1–A3 (Product Stage):</b> Baseline embodied carbon derived from the ICE V5 dataset across 259 building materials.", bullet_style))
    story.append(Paragraph("• <b>LCA Module A4 (Construction Stage - Transport):</b> Fleet logistics emissions factoring vehicle curb weight, payload mass multiplier, and transit distance.", bullet_style))
    story.append(Paragraph("• <b>LCA Module B1–B7 (Use Stage - Operational Degradation):</b> 100-year dynamic Global Warming Potential (GWP) simulated via a Random Forest Regressor under regional climate calamity stress.", bullet_style))
    
    story.append(Spacer(1, 10))

    # Vehicle Fleet Database Table
    story.append(Paragraph("2. Vehicle Fleet Database (LCA Stage A4)", h1_style))
    story.append(Paragraph("The transportation engine supports four commercial logistics vehicle categories with calibrated baseline emission factors:", body_style))

    fleet_data = [
        ["Vehicle Type", "Curb Weight (kg)", "Base Emission Rate", "Fuel / Energy Type", "Typical Role"],
        ["Cargo Bike", "120 kg", "25.0 g CO2 / km", "Human / Micro-e-cargo", "Short-range urban micro-logistics"],
        ["Electric Van", "1,500 kg", "40.0 g CO2 / km", "Grid Electricity (Zero Tailpipe)", "Clean urban light commercial"],
        ["CNG Truck", "970 kg", "120.0 g CO2 / km", "Compressed Natural Gas", "Medium utility regional transport"],
        ["Diesel Van", "2,000 kg", "180.0 g CO2 / km", "Heavy-Duty Diesel", "Standard industrial site haulage"],
    ]

    t_fleet = Table(fleet_data, colWidths=[1.2*inch, 1.1*inch, 1.3*inch, 1.8*inch, 1.8*inch])
    t_fleet.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8.5),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('TOPPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_fleet)
    story.append(Spacer(1, 12))

    # Mathematical Logic & Formulas
    story.append(Paragraph("3. Mathematical Logic & Physics Formulation", h1_style))
    story.append(Paragraph("The transportation emissions calculation uses a continuous mass-penalty algorithm:", body_style))

    formulas = [
        "1. Gross Combined Weight:   W_total = W_vehicle + W_load",
        "2. Dynamic Load Multiplier:  gamma = W_total / W_vehicle = 1 + (W_load / W_vehicle)",
        "3. Total Journey Emissions:  Emissions_g = Base_Rate * Distance_km * gamma",
        "4. Unit Conversion:         Emissions_kg = Emissions_g / 1000",
        "5. Normalized Carbon:       E_norm = Emissions_kg / W_load  (in kg CO2e / kg material)",
        "6. Lifecycle Total:          Total_Lifecycle = Base_GWP (A1-A3) + E_norm (A4) + Calamity_Penalty (B1-B7)"
    ]
    for f in formulas:
        story.append(Paragraph(f, formula_style))

    story.append(Spacer(1, 10))

    # Worked Numerical Example
    story.append(Paragraph("4. Numerical Verification Example", h1_style))
    story.append(Paragraph("<b>Scenario:</b> Transporting 1,000 kg of Blast Furnace Slag Cement over a distance of 50 km using a Diesel Van:", body_style))

    calc_data = [
        ["Step / Parameter", "Formula / Source", "Value", "Unit"],
        ["Vehicle Curb Weight", "Database (Diesel Van)", "2,000.00", "kg"],
        ["Cargo Payload", "User Input", "1,000.00", "kg"],
        ["Gross Combined Weight", "2,000 + 1,000", "3,000.00", "kg"],
        ["Load Weight Factor", "3,000 / 2,000", "1.500", "x multiplier"],
        ["Transit Distance", "User Input", "50.00", "km"],
        ["Base Emission Rate", "Database", "180.00", "g / km"],
        ["Total Trip Emissions (g)", "180 * 50 * 1.500", "13,500.00", "g CO2"],
        ["Total Trip Emissions (kg)", "13,500 / 1000", "13.50", "kg CO2"],
        ["Normalized Material Transport (A4)", "13.50 kg / 1,000 kg", "0.0135", "kg CO2e / kg"],
        ["Baseline Embodied Carbon (A1–A3)", "ICE V5 Database", "0.2500", "kg CO2e / kg"],
        ["100-Year Dynamic Calamity GWP", "ML Random Forest Model", "0.2627", "kg CO2e / kg"],
        ["Net 100-Year Lifecycle Carbon", "0.2627 + 0.0135", "0.2762", "kg CO2e / kg"]
    ]

    t_calc = Table(calc_data, colWidths=[2.2*inch, 2.2*inch, 1.2*inch, 1.6*inch])
    t_calc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), teal_color),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8.5),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light]),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#f0fdf4")),
        ('TEXTCOLOR', (0,-1), (-1,-1), colors.HexColor("#166534")),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_calc)

    story.append(Spacer(1, 14))

    # REST API & Integration
    story.append(Paragraph("5. API Endpoints Reference", h1_style))
    story.append(Paragraph("• <b>GET /api/v1/materials:</b> Returns all 259 ICE V5 construction material names.", bullet_style))
    story.append(Paragraph("• <b>GET /api/v1/transport/vehicles:</b> Returns fleet vehicle catalog with weights and base emission rates.", bullet_style))
    story.append(Paragraph("• <b>POST /api/v1/transport/calculate:</b> Standalone calculation for journey transport emissions.", bullet_style))
    story.append(Paragraph("• <b>POST /api/v1/predict:</b> Unified prediction combining Stage A1–A3, A4, and 100-year B1–B7 dynamic resilience.", bullet_style))

    # Build Document
    doc.build(story)
    print(f"Generated PDF successfully at: {output_path}")

if __name__ == "__main__":
    output_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs", "Project_Vardan_Technical_Report.pdf"))
    generate_pdf(output_file)
