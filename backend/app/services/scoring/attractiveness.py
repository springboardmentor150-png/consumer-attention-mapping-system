import hashlib

from functools import lru_cache


# Inputs the weighted formula below consumes, in formula order.
SCORING_INPUTS = (
    "attention_duration",
    "interaction_frequency",
    "pickup_rate",
    "conversion_rate",
    "repeat_engagement",
)

# The four inputs the prototype generator derives from attention duration.
GENERATED_METRICS = (
    "interaction_frequency",
    "repeat_engagement",
    "pickup_rate",
    "conversion_rate",
)

# Reference range that maps average dwell time onto the 0-100 scale the
# formula expects. A calibration bound for a metric the pipeline already
# records — no new metric is introduced here. Tune it if the store layout or
# camera framing changes materially.
#
# The upper bound is the dwell that counts as a fully engaged shelf visit,
# not the longest dwell a camera can record. It was 60s, which is loiter
# time rather than shopping time: a shopper studying a bay for ten seconds
# scored 17 on the attention axis, every downstream input inherited that,
# and every shelf in the estate came out in the Critical band regardless of
# how it was actually performing. Twelve seconds is the engaged-visit mark
# the frontend model uses for the same purpose (DWELL_REFERENCE_SECONDS in
# src/lib/attractiveness.ts), so both ends of the system now agree on what
# a fully engaged visit looks like.
#
# The weighted formula below is untouched by this: it still consumes five
# 0-100 inputs and weights them exactly as specified. Only the calibration
# that turns seconds into the attention input has changed.
DWELL_TIME_REFERENCE = (0.0, 12.0)      # seconds per session

# Identifier used when scoring across every zone rather than one shelf, so the
# store-wide figure is still stable and distinct from any single shelf.
ALL_ZONES_IDENTIFIER = "__all_zones__"

# Per-metric shape of the generated values:
#   slope  - how strongly the metric tracks attention duration
#   spread - total width of the deterministic variation around that trend
# Slopes descend deliberately: a shopper looking at a shelf interacts with it
# more often than they pick something up, and picks up more often than they
# buy. Spread widens further down the funnel for the same reason.
METRIC_PROFILE = {
    "interaction_frequency": (0.85, 18.0),
    "repeat_engagement": (0.70, 24.0),
    "pickup_rate": (0.60, 28.0),
    "conversion_rate": (0.45, 30.0),
}


def normalize(value, min_value, max_value):
    """
    Convert a metric into a 0-100 range.
    """

    if max_value == min_value:
        return 50.0

    score = (
        (value - min_value)
        / (max_value - min_value)
    ) * 100

    return max(0.0, min(100.0, score))


def calculate_attractiveness_score(
    attention_duration,
    interaction_frequency,
    pickup_rate,
    conversion_rate,
    repeat_engagement,
):
    """
    Calculate product attractiveness score.

    All inputs should already be normalized
    between 0 and 100.
    """

    score = (
        attention_duration * 0.35
        + interaction_frequency * 0.25
        + pickup_rate * 0.20
        + conversion_rate * 0.15
        + repeat_engagement * 0.05
    )

    return round(
        max(0.0, min(100.0, score)),
        2
    )


def _unit_interval(identifier, attention_duration, metric):
    """
    A stable value in [0, 1) derived from the inputs.

    Hashing rather than random(): the same shelf and the same attention
    duration always produce the same number, while a different shelf or a
    different attention duration produces an unrelated one. Nothing here reads
    a clock, a seed or process state.
    """

    key = f"{identifier}|{attention_duration:.4f}|{metric}".encode("utf-8")

    digest = hashlib.blake2b(key, digest_size=8).digest()

    return int.from_bytes(digest, "big") / float(1 << 64)


@lru_cache(maxsize=512)
def _generate_metrics(identifier, attention_duration):
    """
    Cached generation keyed on (identifier, attention duration).

    Because those two are the only inputs, the work is redone only when a new
    video changes the recorded attention duration for a shelf — repeated
    scoring calls for unchanged analytics are served from the cache.

    Returns a tuple of pairs so the cached value cannot be mutated by callers.
    """

    generated = []

    for metric in GENERATED_METRICS:

        slope, spread = METRIC_PROFILE[metric]

        # Centred on the attention-driven trend, then nudged by a deterministic
        # offset in [-spread/2, +spread/2]. The trend dominates, so the
        # correlation with attention duration is real rather than a fixed
        # offset, while no two shelves land on exactly the same curve.
        offset = (
            _unit_interval(identifier, attention_duration, metric) - 0.5
        ) * spread

        value = attention_duration * slope + offset

        generated.append(
            (metric, round(max(0.0, min(100.0, value)), 2))
        )

    return tuple(generated)


def generate_prototype_metrics(identifier, attention_duration):
    """
    Derive the four non-observable scoring inputs from attention duration.

    The vision pipeline cannot see a product being handled or bought, and this
    prototype has no POS feed, so interaction frequency, repeat engagement,
    pickup rate and conversion rate are generated from the one real signal
    there is. Values are deterministic, correlated with attention duration and
    bounded to 0-100.

    identifier is a stable shelf key (zone value or name); attention_duration
    is the already-normalized 0-100 figure.
    """

    return dict(
        _generate_metrics(
            identifier or ALL_ZONES_IDENTIFIER,
            round(float(attention_duration), 4),
        )
    )


def resolve_scoring_inputs(engagement, identifier=None):
    """
    Build the full set of formula inputs for a shelf zone.

    Attention duration is the one input taken from real analytics; the other
    four are generated from it. Returns (metrics, sources) where metrics feeds
    calculate_attractiveness_score unchanged and sources labels each input
    "analytics", "generated" or "unavailable" for the UI.
    """

    attention = 0.0

    if engagement:
        attention = round(
            normalize(
                engagement["avg_dwell_time"],
                *DWELL_TIME_REFERENCE
            ),
            2
        )

    metrics = {"attention_duration": attention}

    sources = {
        "attention_duration": "analytics" if engagement else "unavailable"
    }

    generated = generate_prototype_metrics(identifier, attention)

    for metric in GENERATED_METRICS:
        metrics[metric] = generated[metric]
        sources[metric] = "generated"

    # Keep formula order so the returned mapping reads the same as before.
    return (
        {field: metrics[field] for field in SCORING_INPUTS},
        {field: sources[field] for field in SCORING_INPUTS},
    )