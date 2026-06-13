"""
EcoLoop AI - Assessment Router

POST /api/assess - Run the agentic assessment pipeline on a product.
Currently returns a mock response; will be replaced by the real pipeline.
"""

from fastapi import APIRouter, Header
from typing import Optional

from models.schemas import (
    AssessmentRequest,
    AssessmentResponse,
    ResaleValue,
    BuyerPersona,
    ErrorResponse,
)
from models.database import generate_assessment_id, save_assessment, update_user_metrics
from models.schemas import ActionRecommendation

router = APIRouter(prefix="/api", tags=["assessment"])


def _generate_mock_assessment(request: AssessmentRequest) -> AssessmentResponse:
    """
    Generate a mock assessment response for development/testing.

    This will be replaced by the real agentic pipeline
    (Vision → Valuation → Decision → Sustainability → Buyer Matching).
    """
    assessment_id = generate_assessment_id()

    # Mock condition grading based on product age
    if request.product_age_months <= 6:
        grade = "A"
        confidence = 92
    elif request.product_age_months <= 24:
        grade = "B"
        confidence = 85
    elif request.product_age_months <= 60:
        grade = "C"
        confidence = 78
    else:
        grade = "D"
        confidence = 70

    # Mock resale value calculation
    depreciation_factor = max(0.1, 1 - (request.product_age_months * 0.02))
    base_value = request.original_price * depreciation_factor
    resale_min = round(base_value * 0.85, 2)
    resale_max = round(base_value * 1.15, 2)

    # Mock action recommendation
    if grade in ("A", "B") and base_value > request.original_price * 0.2:
        action = ActionRecommendation.RESELL
        green_credits = 10
        co2_savings = 2.5
    elif grade in ("B", "C"):
        action = ActionRecommendation.REFURBISH
        green_credits = 15
        co2_savings = 1.8
    elif grade == "C":
        action = ActionRecommendation.DONATE
        green_credits = 20
        co2_savings = 1.5
    else:
        action = ActionRecommendation.RECYCLE
        green_credits = 5
        co2_savings = 0.8

    # Mock buyer personas (only for resell)
    buyer_personas = []
    if action == ActionRecommendation.RESELL:
        buyer_personas = [
            BuyerPersona(
                label="Budget-Conscious Buyer",
                description=f"Looking for affordable {request.product_category.value} in good condition",
                relevance_score=8,
            ),
            BuyerPersona(
                label="Student",
                description=f"College student seeking discounted {request.product_category.value} for daily use",
                relevance_score=7,
            ),
            BuyerPersona(
                label="Reseller",
                description="Small business owner who refurbishes and resells products online",
                relevance_score=6,
            ),
        ]

    return AssessmentResponse(
        assessment_id=assessment_id,
        condition_grade=grade,
        confidence_score=confidence,
        grade_explanation=(
            f"Product is in {grade}-grade condition based on {request.product_age_months} months of age. "
            f"The {request.product_category.value} category typically shows moderate wear at this stage. "
            "Visual inspection indicates the product is suitable for continued use."
        ),
        action_recommendation=action,
        action_reasoning=(
            f"With a {grade} condition grade and estimated resale value of "
            f"${resale_min:.0f}-${resale_max:.0f}, the optimal action is to {action.value}. "
            f"This maximizes value recovery for this {request.product_category.value} product."
        ),
        resale_value=ResaleValue(
            min=resale_min,
            max=resale_max,
            display=f"${resale_min:.0f} - ${resale_max:.0f}",
        ),
        green_credits=green_credits,
        co2_savings_kg=co2_savings,
        buyer_personas=buyer_personas,
    )


@router.post(
    "/assess",
    response_model=AssessmentResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request data"},
        502: {"model": ErrorResponse, "description": "Backend service failure"},
    },
    summary="Run product assessment",
    description=(
        "Submit a product image key and metadata to run the AI assessment pipeline. "
        "Returns condition grade, action recommendation, resale value estimate, "
        "green credits, CO2 savings, and buyer personas."
    ),
)
async def assess_product(
    request: AssessmentRequest,
    x_session_id: Optional[str] = Header(
        default="anonymous",
        description="User session ID for tracking assessments",
    ),
):
    """
    Run the agentic assessment pipeline on a product.

    Pipeline: Vision Agent → Valuation Agent → Decision Agent →
              Sustainability Agent → Buyer Matching Agent

    Currently returns a mock response for development.
    """
    # Generate mock assessment (will be replaced by real pipeline)
    assessment = _generate_mock_assessment(request)

    # Persist to DynamoDB
    try:
        await save_assessment(assessment, request, x_session_id)
        print(f"[INFO] Assessment {assessment.assessment_id} saved for session={x_session_id}")
    except Exception as e:
        print(f"[ERROR] Failed to save assessment: {type(e).__name__}: {e}")

    try:
        await update_user_metrics(
            user_session_id=x_session_id,
            action=assessment.action_recommendation,
            green_credits=assessment.green_credits,
            co2_savings_kg=assessment.co2_savings_kg,
        )
    except Exception as e:
        print(f"[ERROR] Failed to update user metrics from router: {type(e).__name__}: {e}")

    return assessment
