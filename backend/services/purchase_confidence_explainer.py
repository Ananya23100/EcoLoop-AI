"""
EcoLoop AI - Purchase Confidence Explainer

Generates a natural-language explanation for the buyer-facing Purchase Confidence
score using Amazon Bedrock Nova Pro. The score itself remains deterministic —
this service only explains WHY the score was assigned.

No score generation. No purchase recommendations. Only explanation of existing data.
"""

import json
import logging
from typing import Optional

from botocore.exceptions import BotoCoreError, ClientError

from config.aws import get_bedrock_client
from config.settings import get_settings

logger = logging.getLogger("ecoloop.purchase_explainer")

# In-memory cache: listing_id+profile_key → explanation
_explanation_cache: dict[str, str] = {}


def _build_prompt(
    condition_grade: str,
    confidence_score: int,
    purchase_confidence: int,
    return_risk: str,
    listing_type: str,
    product_category: str,
    green_credits: int,
    co2_saved: float,
    top_category: str,
    top_action: str,
) -> str:
    """Build the Bedrock prompt for explanation generation."""
    return (
        f"You are a concise product analyst for a sustainability marketplace. "
        f"Write 2-4 sentences explaining a Purchase Confidence score directly to the viewer using second-person language (you/your). "
        f"Only explain the existing data — do not invent facts, do not recommend purchasing, do not generate scores.\n\n"
        f"Data:\n"
        f"- Product category: {product_category}\n"
        f"- Listing type: {listing_type}\n"
        f"- Condition grade: {condition_grade}\n"
        f"- AI verification confidence: {confidence_score}%\n"
        f"- Purchase confidence score: {purchase_confidence}%\n"
        f"- Predicted return risk: {return_risk}\n"
        f"- Green credits: {green_credits}\n"
        f"- CO₂ saved: {co2_saved} kg\n"
        f"- Your most assessed category: {top_category}\n"
        f"- Your most frequent action: {top_action}\n\n"
        f"Explain using 'you' and 'your' (second person):\n"
        f"1. Why this condition grade and confidence level support the score\n"
        f"2. Whether this listing aligns with your sustainability profile\n"
        f"3. What the return risk level means for your purchase decision\n\n"
        f"Write in second person (you/your). Be factual. No bullet points. 2-4 sentences only."
    )


async def generate_explanation(
    listing_id: str,
    condition_grade: str,
    confidence_score: int,
    purchase_confidence: int,
    return_risk: str,
    listing_type: str,
    product_category: str,
    green_credits: int,
    co2_saved: float,
    top_category: str,
    top_action: str,
) -> str:
    """
    Generate a natural-language explanation for the Purchase Confidence score.

    Uses in-memory cache to avoid repeated Bedrock calls for the same listing+profile.
    Falls back to a rule-based explanation if Bedrock fails.
    """
    # Cache key includes listing + profile context
    cache_key = f"{listing_id}:{top_category}:{top_action}"
    if cache_key in _explanation_cache:
        logger.info(f"Cache hit for explanation: {cache_key[:30]}")
        return _explanation_cache[cache_key]

    # Try Bedrock
    try:
        explanation = await _call_bedrock(
            condition_grade, confidence_score, purchase_confidence,
            return_risk, listing_type, product_category,
            green_credits, co2_saved, top_category, top_action,
        )
        _explanation_cache[cache_key] = explanation
        logger.info(f"Generated explanation via Bedrock ({len(explanation.split())} words)")
        return explanation
    except Exception as e:
        logger.warning(f"Bedrock explanation failed: {e}. Using fallback.")
        fallback = _fallback_explanation(
            condition_grade, confidence_score, purchase_confidence,
            return_risk, listing_type, product_category,
            top_category, top_action,
        )
        _explanation_cache[cache_key] = fallback
        return fallback


async def _call_bedrock(
    condition_grade: str,
    confidence_score: int,
    purchase_confidence: int,
    return_risk: str,
    listing_type: str,
    product_category: str,
    green_credits: int,
    co2_saved: float,
    top_category: str,
    top_action: str,
) -> str:
    """Call Amazon Bedrock Nova Pro to generate the explanation."""
    settings = get_settings()
    bedrock_client = get_bedrock_client()

    prompt = _build_prompt(
        condition_grade, confidence_score, purchase_confidence,
        return_risk, listing_type, product_category,
        green_credits, co2_saved, top_category, top_action,
    )

    request_body = json.dumps({
        "messages": [{"role": "user", "content": [{"text": prompt}]}],
        "system": [{"text": "You are a factual product analyst. Write concise, personalized explanations using second-person language (you/your). Never use third person."}],
        "inferenceConfig": {"maxTokens": 200, "temperature": 0.2},
    })

    response = bedrock_client.invoke_model(
        modelId=settings.bedrock_text_model_id,
        contentType="application/json",
        accept="application/json",
        body=request_body,
    )

    response_body = json.loads(response["body"].read())
    text = (
        response_body.get("output", {})
        .get("message", {})
        .get("content", [{}])[0]
        .get("text", "")
    ).strip()

    # Truncate to 4 sentences max
    sentences = text.split(".")
    if len(sentences) > 5:
        text = ".".join(sentences[:4]) + "."

    return text


def _fallback_explanation(
    condition_grade: str,
    confidence_score: int,
    purchase_confidence: int,
    return_risk: str,
    listing_type: str,
    product_category: str,
    top_category: str,
    top_action: str,
) -> str:
    """Rule-based fallback explanation when Bedrock is unavailable."""
    parts = []

    parts.append(
        f"This {product_category} listing received a Grade {condition_grade} assessment "
        f"with {confidence_score}% verification confidence."
    )

    if product_category == top_category:
        parts.append(
            f"This aligns with your sustainability profile because {product_category} "
            f"is your most frequently assessed category."
        )

    if return_risk in ("Very Low", "Low"):
        parts.append(
            "Based on the condition and value, your risk of post-purchase dissatisfaction is low."
        )
    elif return_risk == "Medium":
        parts.append(
            "Moderate wear is present, so you should review the condition details carefully before deciding."
        )
    else:
        parts.append(
            "Significant wear increases your chance of unmet expectations — review condition details before proceeding."
        )

    parts.append(
        f"Your purchase confidence is {purchase_confidence}% with {return_risk.lower()} return risk."
    )

    return " ".join(parts)
