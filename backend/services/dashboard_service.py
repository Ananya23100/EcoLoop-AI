"""
EcoLoop AI - Dashboard Service

Retrieves aggregated sustainability metrics and recent assessments.
"""

from models.database import get_user_metrics, get_recent_assessments


async def get_dashboard_data(user_session_id: str) -> dict:
    """
    Fetch all dashboard data for a user session.

    Returns:
        Dictionary with total_green_credits, total_assessments,
        total_co2_saved_kg, action_distribution, and recent_assessments.
    """
    metrics = await get_user_metrics(user_session_id)
    recent = await get_recent_assessments(user_session_id, limit=10)

    # Convert action_counts (may have Decimal values) to plain int dict
    action_counts = metrics.get("action_counts", {})
    action_distribution = {k: int(v) for k, v in action_counts.items()}

    return {
        "total_green_credits": int(metrics.get("total_green_credits", 0)),
        "total_assessments": int(metrics.get("total_assessments", 0)),
        "total_co2_saved_kg": float(metrics.get("total_co2_saved_kg", 0)),
        "action_distribution": action_distribution,
        "recent_assessments": recent,
    }
