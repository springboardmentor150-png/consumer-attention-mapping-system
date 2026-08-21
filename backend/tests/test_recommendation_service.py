from app.services.recommendation_service import recommendation_service


def test_low_score_recommendation():
    result = recommendation_service.generate_recommendation(
        shelf_name="Test Product",
        attractiveness_score=30,
        total_views=100,
        total_pickups=20,
        total_purchases=5
    )

    types = [
        recommendation["type"]
        for recommendation in result["recommendations"]
    ]

    assert "shelf_optimization" in types


def test_high_views_low_pickup():
    result = recommendation_service.generate_recommendation(
        shelf_name="Test Product",
        attractiveness_score=60,
        total_views=200,
        total_pickups=20,
        total_purchases=6
    )

    types = [
        recommendation["type"]
        for recommendation in result["recommendations"]
    ]

    assert "product_attractiveness" in types


def test_high_pickup_low_conversion():
    result = recommendation_service.generate_recommendation(
        shelf_name="Test Product",
        attractiveness_score=55,
        total_views=100,
        total_pickups=40,
        total_purchases=5
    )

    types = [
        recommendation["type"]
        for recommendation in result["recommendations"]
    ]

    assert "pricing_or_stock" in types


def test_good_product_no_action():
    result = recommendation_service.generate_recommendation(
        shelf_name="Good Product",
        attractiveness_score=80,
        total_views=100,
        total_pickups=20,
        total_purchases=10
    )

    assert len(result["recommendations"]) == 1

    assert (
        result["recommendations"][0]["type"]
        == "no_action"
    )


def test_multiple_recommendations():
    result = recommendation_service.generate_recommendation(
        shelf_name="Problem Product",
        attractiveness_score=20,
        total_views=200,
        total_pickups=20,
        total_purchases=6
    )

    assert len(result["recommendations"]) == 2

    types = [
        recommendation["type"]
        for recommendation in result["recommendations"]
    ]

    assert "shelf_optimization" in types
    assert "product_attractiveness" in types