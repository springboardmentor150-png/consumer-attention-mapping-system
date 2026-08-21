from sqlalchemy.orm import Session
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

from app.models.analytics import Analytics


FEATURE_COLUMNS = [
    "dwell_time",
    "path_length",
    "shelf_visits",
    "gaze_shifts",
]


def run_segmentation(db: Session, store_id: int | None = None):
    """
    store_id restricts clustering to one store's sessions. Shopper behaviour
    is only comparable within a store — clustering across stores mixes
    different layouts and traffic patterns into the same centroids. Passing
    None keeps the previous whole-table behaviour.

    Only the selection of input rows changes here; the K-Means configuration
    and cluster-labelling logic below are untouched.
    """

    # --------------------------------------------------
    # 1. Get completed shopper sessions
    # --------------------------------------------------

    query = db.query(Analytics).filter(Analytics.dwell_time > 0)

    if store_id is not None:
        query = query.filter(Analytics.store_id == store_id)

    sessions = query.all()

    if len(sessions) < 3:
        print("Not enough shopper sessions for K-Means.")
        return []

    # --------------------------------------------------
    # 2. Create feature matrix
    # --------------------------------------------------

    X = []

    for session in sessions:

        X.append([
            session.dwell_time,
            session.path_length,
            session.shelf_visits,
            session.gaze_shifts,
        ])

    # --------------------------------------------------
    # 3. Normalize the features
    # --------------------------------------------------

    scaler = StandardScaler()

    X_scaled = scaler.fit_transform(X)

    # --------------------------------------------------
    # 4. K-Means clustering
    # --------------------------------------------------

    kmeans = KMeans(
        n_clusters=3,
        random_state=42,
        n_init=10
    )

    cluster_labels = kmeans.fit_predict(X_scaled)

    # --------------------------------------------------
    # 5. Calculate cluster characteristics
    # --------------------------------------------------

    cluster_profiles = {}

    for cluster_id in range(3):

        cluster_sessions = [
            sessions[i]
            for i in range(len(sessions))
            if cluster_labels[i] == cluster_id
        ]

        avg_dwell = (
            sum(s.dwell_time for s in cluster_sessions)
            / len(cluster_sessions)
        )

        avg_path = (
            sum(s.path_length for s in cluster_sessions)
            / len(cluster_sessions)
        )

        avg_shelves = (
            sum(s.shelf_visits for s in cluster_sessions)
            / len(cluster_sessions)
        )

        avg_gaze = (
            sum(s.gaze_shifts for s in cluster_sessions)
            / len(cluster_sessions)
        )

        cluster_profiles[cluster_id] = {
            "avg_dwell": avg_dwell,
            "avg_path": avg_path,
            "avg_shelves": avg_shelves,
            "avg_gaze": avg_gaze,
            "count": len(cluster_sessions),
        }

    # --------------------------------------------------
    # 6. Print cluster profiles
    # --------------------------------------------------

    print("\n================ CLUSTER PROFILES ================\n")

    for cluster_id, profile in cluster_profiles.items():

        print(
            f"Cluster {cluster_id} | "
            f"Shoppers: {profile['count']} | "
            f"Dwell: {profile['avg_dwell']:.2f}s | "
            f"Path: {profile['avg_path']:.2f}px | "
            f"Shelves: {profile['avg_shelves']:.2f} | "
            f"Gaze shifts: {profile['avg_gaze']:.2f}"
        )

    # --------------------------------------------------
    # 7. Identify behavioral clusters
    # --------------------------------------------------

    # Comparison shoppers:
    # highest gaze-shift behavior
    comparison_cluster = max(
        cluster_profiles,
        key=lambda c: cluster_profiles[c]["avg_gaze"]
    )

    remaining_clusters = [
        c
        for c in cluster_profiles
        if c != comparison_cluster
    ]

    # Behavioral movement score for remaining clusters
    # Higher dwell + path + shelf activity = more exploratory
    def exploration_score(cluster_id):

        profile = cluster_profiles[cluster_id]

        return (
            profile["avg_dwell"]
            + profile["avg_path"] / 100
            + profile["avg_shelves"] * 10
        )

    explorer_cluster = max(
        remaining_clusters,
        key=exploration_score
    )

    quick_buyer_cluster = next(
        c
        for c in remaining_clusters
        if c != explorer_cluster
    )

    cluster_to_segment = {
        explorer_cluster: "Explorer",
        quick_buyer_cluster: "Quick Buyer",
        comparison_cluster: "Comparison Shopper",
    }

    print("\n================ SEGMENT MAPPING ================\n")

    for cluster_id, segment in cluster_to_segment.items():

        print(
            f"Cluster {cluster_id} -> {segment}"
        )

    # --------------------------------------------------
    # 8. Update database
    # --------------------------------------------------

    for index, session in enumerate(sessions):

        cluster_id = cluster_labels[index]

        segment = cluster_to_segment[cluster_id]

        session.segment = segment

    db.commit()

    # --------------------------------------------------
    # 9. Print final results
    # --------------------------------------------------

    print("\n================ FINAL SEGMENTS ================\n")

    results = []

    for session in sessions:

        result = {
            "shopper_id": session.shopper_id,
            "segment": session.segment,
            "dwell_time": session.dwell_time,
            "path_length": session.path_length,
            "shelf_visits": session.shelf_visits,
            "gaze_shifts": session.gaze_shifts,
        }

        results.append(result)

        print(
            f"Shopper {session.shopper_id} -> "
            f"{session.segment}"
        )

    print("\nSegmentation completed successfully.")

    return results


# ------------------------------------------------------
# Run directly from terminal
# ------------------------------------------------------

if __name__ == "__main__":

    from app.core.database import SessionLocal

    db = SessionLocal()

    try:
        run_segmentation(db)

    finally:
        db.close()