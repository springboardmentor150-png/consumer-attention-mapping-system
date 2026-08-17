# import random


# def generate_recommendation(attention, score):

#     # Simulated business metrics
#     pickup_rate = random.randint(0, 100)
#     conversion_rate = random.randint(0, 100)

#     if attention > 15 and pickup_rate < 30:
#         return "🔥 High attention but low pickup. Review product pricing or promotions."

#     elif score > 80:
#         return "⭐ Top-performing shelf. Keep current placement."

#     elif score < 50:
#         return "⚠ Low-performing shelf. Improve visibility or relocate products."

#     elif conversion_rate < 30:
#         return "📢 Many viewers but few buyers. Add promotional offers."

#     else:
#         return "✅ Shelf performance is healthy."


def generate_recommendation(
    score,
    attention_time,
    interaction_frequency=0,
    pickup_rate=0,
    conversion_rate=0
):

    recommendations = []

    # Very low overall performance
    if score < 30:

        recommendations.append(
            "Low-performing product. Improve visibility or consider relocating it."
        )

    # High attention but low pickup
    if attention_time > 10 and pickup_rate < 20:

        recommendations.append(
            "High customer attention but low pickup rate. Review product placement, pricing, or promotion."
        )

    # High pickup but low conversion
    if pickup_rate > 50 and conversion_rate < 20:

        recommendations.append(
            "Customers are picking up the product but not purchasing it. Review pricing or product appeal."
        )

    # Good performance
    if score >= 70:

        recommendations.append(
            "High-performing product. Maintain current placement and visibility."
        )

    # Medium performance
    if 30 <= score < 70 and not recommendations:

        recommendations.append(
            "Moderate performance. Consider improving product visibility and shelf positioning."
        )

    # Fallback
    if not recommendations:

        recommendations.append(
            "No major issue detected. Continue monitoring performance."
        )

    return recommendations

if __name__ == "__main__":

    result = generate_recommendation(
            score=25,
            attention_time=15,
            interaction_frequency=5,
            pickup_rate=10,
            conversion_rate=5
        )

    print("Recommendations:")

    for recommendation in result:
        print("•", recommendation)