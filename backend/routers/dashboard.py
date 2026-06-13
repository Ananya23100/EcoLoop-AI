"""
EcoLoop AI - Dashboard Router

GET /api/dashboard - Retrieve sustainability metrics for the user.
"""

from fastapi import APIRouter, Header
from typing import Optional

from models.schemas import DashboardResponse, ErrorResponse
from services.dashboard_service import get_dashboard_data

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get(
    "/dashboard",
    response_model=DashboardResponse,
    responses={
        502: {"model": ErrorResponse, "description": "Backend service failure"},
    },
    summary="Get sustainability dashboard metrics",
    description=(
        "Returns aggregated sustainability metrics including total green credits, "
        "total assessments, CO2 savings, action distribution, and recent assessments."
    ),
)
async def get_dashboard(
    x_session_id: Optional[str] = Header(
        default="anonymous",
        description="User session ID for retrieving metrics",
    ),
):
    """Fetch sustainability dashboard data for the current user session."""
    data = await get_dashboard_data(x_session_id)
    return DashboardResponse(**data)
