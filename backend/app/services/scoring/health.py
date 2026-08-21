"""
Health banding and advice for a scored shelf.

The counterpart of the same model in frontend/src/lib/attractiveness.ts, and
deliberately identical to it: the same band thresholds, the same weighted
shortfall ranking, the same playbook lines and the same stable picker. The
two must agree, because the dashboard renders the frontend's version while
notifications and the PDF/CSV exports carry this one — a shelf that reads
"Monitor" on screen cannot raise a "High" alert in the bell.

Nothing here scores anything. The score arrives already computed by
calculate_attractiveness_score(); this module only says what a score means
and what to do about it.
"""

from app.services.scoring.attractiveness import SCORING_INPUTS


# Display names for the five formula inputs, used in advice and alert copy.
METRIC_LABELS = {
    "attention_duration": "Attention",
    "interaction_frequency": "Interaction",
    "pickup_rate": "Pickup",
    "conversion_rate": "Conversion",
    "repeat_engagement": "Repeat",
}

# Weights, restated here only to rank inputs by how much score each is
# costing. The formula itself lives in attractiveness.py and is not
# reimplemented — see weakest_inputs below.
INPUT_WEIGHTS = {
    "attention_duration": 0.35,
    "interaction_frequency": 0.25,
    "pickup_rate": 0.20,
    "conversion_rate": 0.15,
    "repeat_engagement": 0.05,
}

# Band floor, status label, priority, and how many weak inputs the advice
# should address. Ordered high to low; the first band the score clears wins.
HEALTH_BANDS = (
    (85.0, "Healthy", "Low", 0),
    (70.0, "Good", "Medium", 1),
    (55.0, "Monitor", "Medium", 2),
    (35.0, "Needs Attention", "High", 3),
    (0.0, "Critical", "Critical", 3),
)

# Priorities that escalate to an alert. A shelf in the Good or Healthy band
# never does, which is what stops a well-performing shelf raising one.
ALERT_PRIORITIES = ("High", "Critical")


def health_band(score):
    """
    (label, priority, focus_count) for a computed score.

    The single band table on this side of the system.
    """

    for floor, label, priority, focus in HEALTH_BANDS:
        if score >= floor:
            return label, priority, focus

    return HEALTH_BANDS[-1][1:]


def _unit(seed):
    """
    A stable value in [0, 1) derived from a string.

    FNV-1a, byte-for-byte the same as hashUnit() in the frontend model, so a
    shelf is offered the same playbook line on both sides. Nothing reads a
    clock, a seed or process state, which is what makes the advice identical
    on every run for unchanged metrics.
    """

    value = 0x811C9DC5

    for character in seed:
        value ^= ord(character)
        value = (value * 0x01000193) & 0xFFFFFFFF

    return value / 0x100000000


def weakest_inputs(metrics):
    """
    The inputs costing this shelf the most score, worst first.

    Ranked by weighted shortfall rather than raw value, so "weakest" means
    "holding the score down hardest": a mediocre attention figure outranks a
    poor repeat figure because attention carries seven times the weight.

    Returns a list of (metric, label, value, shortfall).
    """

    ranked = []

    for metric in SCORING_INPUTS:
        value = metrics.get(metric) or 0.0

        ranked.append(
            (
                metric,
                METRIC_LABELS[metric],
                value,
                round(INPUT_WEIGHTS[metric] * (100 - value), 2),
            )
        )

    return sorted(ranked, key=lambda entry: entry[3], reverse=True)


PLAYBOOK = {
    "attention_duration": (
        "Raise visibility: move the range to eye level so shoppers register it on approach.",
        "Add shelf-edge signage and a clearer category header to draw the eye.",
        "Check lighting on this bay — poorly lit fixtures suppress dwell time.",
    ),
    "interaction_frequency": (
        "Review packaging and facings so the range reads clearly at a distance.",
        "Add a promotional display or end-cap tie-in to invite engagement.",
        "Trial a demo or sampling touchpoint to lift hands-on interaction.",
    ),
    "pickup_rate": (
        "Improve accessibility: bring stock forward and clear obstructions at reach height.",
        "Reorganise the shelf by category so individual products are easy to isolate.",
        "Reduce facing density — crowded bays measurably suppress pick-up.",
    ),
    "conversion_rate": (
        "Review pricing against the alternatives sitting beside it.",
        "Add a clear offer or multi-buy to close the decision at the shelf.",
        "Expand shelf-edge product information so shoppers can compare without help.",
    ),
    "repeat_engagement": (
        "Broaden the assortment so returning shoppers find something new.",
        "Tie this bay into the loyalty programme with a targeted reward.",
        "Improve the post-purchase experience to bring this category's shoppers back.",
    ),
}

# Upkeep advice for a shelf that is already performing.
MAINTENANCE = (
    "Performance is strong — hold the current planogram.",
    "Keep facings stocked and review weekly for drift.",
    "Use this bay as the reference layout for comparable fixtures.",
)


def _listed(items):
    """"a", "a and b", "a, b and c" — for naming the inputs being addressed."""

    if len(items) <= 1:
        return items[0] if items else ""

    return f"{', '.join(items[:-1])} and {items[-1]}"


def advice_for(key, metrics, score):
    """
    Advice for one shelf, from its weakest inputs and its band.

    A healthy shelf gets maintenance; every other band gets one corrective
    action per weak input, as many as the band calls for.
    """

    _, _, focus_count = health_band(score)

    if focus_count == 0:
        return list(MAINTENANCE)

    focus = weakest_inputs(metrics)[:focus_count]

    actions = []

    for metric, _, _, _ in focus:
        options = PLAYBOOK[metric]
        actions.append(options[int(_unit(f"{key}|{metric}|advice") * len(options)) % len(options)])

    actions.append(
        "Re-measure "
        + _listed([label.lower() for _, label, _, _ in focus])
        + " after the next footage run to confirm the change landed."
    )

    return actions


def alert_for(shelf, metrics, score):
    """
    The alert this shelf raises, or None when its band does not escalate.

    The message names the input costing the shelf the most, so a stored
    notification says what was actually wrong rather than repeating a fixed
    line. Worded exactly as the dashboard words it.
    """

    label, priority, _ = health_band(score)

    if priority not in ALERT_PRIORITIES:
        return None

    _, worst_label, _, shortfall = weakest_inputs(metrics)[0]

    finding = (
        f"{worst_label.lower()} is the largest drag on this shelf, "
        f"costing {shortfall:.1f} points."
    )

    return {
        "shelf": shelf,
        "severity": priority,
        "attractiveness_score": score,
        # Band-prefixed, matching how the dashboard words the same alert.
        "message": f"{label}: {finding}",
        # The finding on its own, for callers that already show the band —
        # a notification renders its severity as a badge, so repeating it in
        # the text would read "Shelf B: Critical: Critical ...".
        "finding": finding,
    }
