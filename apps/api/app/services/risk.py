from dataclasses import dataclass


@dataclass
class RiskResult:
    score: float
    level: str
    requires_human_review: bool


def calculate_risk_score(probability: int, impact: int, exposure: int, urgency: int, evidence_quality: int) -> RiskResult:
    """Deterministic risk scoring. Inputs are 1-5.
    Base = probability * impact (1-25). Modifiers scale by exposure/urgency/evidence quality.
    Final score normalized to 0-100.
    """
    for name, val in [("probability", probability), ("impact", impact), ("exposure", exposure), ("urgency", urgency), ("evidence_quality", evidence_quality)]:
        if not 1 <= int(val) <= 5:
            raise ValueError(f"{name} must be between 1 and 5")

    base = probability * impact  # 1-25
    exposure_factor = 0.85 + (exposure - 1) * 0.075  # 0.85..1.15
    urgency_factor = 0.85 + (urgency - 1) * 0.075   # 0.85..1.15
    evidence_factor = 0.90 + (evidence_quality - 1) * 0.05  # 0.90..1.10, better evidence slightly increases confidence/weight

    raw = base * exposure_factor * urgency_factor * evidence_factor
    # max raw ~ 25 * 1.15 * 1.15 * 1.10 = 36.36875
    score = round(min(100.0, (raw / 36.36875) * 100), 2)

    if score >= 75:
        level = "critical"
    elif score >= 55:
        level = "high"
    elif score >= 35:
        level = "moderate"
    else:
        level = "low"

    requires_human_review = True if level in {"critical", "high"} or evidence_quality <= 2 else False
    return RiskResult(score=score, level=level, requires_human_review=requires_human_review)
