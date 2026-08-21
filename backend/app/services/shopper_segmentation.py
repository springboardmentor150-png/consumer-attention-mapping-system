from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

from app.core.database import SessionLocal
from app.models.attention_session import AttentionSession


class ShopperSegmentationService:

    def segment_shoppers(self):

        db = SessionLocal()

        try:

            sessions = db.query(AttentionSession).all()

            if len(sessions) < 3:
                return

            features = []

            for session in sessions:

                features.append(
                    [
                        session.dwell_time,
                        session.zone_a_time,
                        session.zone_b_time,
                        session.zone_c_time,
                    ]
                )

            scaler = StandardScaler()

            X = scaler.fit_transform(features)

            kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)

            clusters = kmeans.fit_predict(X)

            cluster_dwell = {}

            for cluster_id in range(3):

                cluster_sessions = [
                    sessions[i]
                    for i in range(len(sessions))
                    if clusters[i] == cluster_id
                ]

                average_dwell = sum(
                    session.dwell_time for session in cluster_sessions
                ) / len(cluster_sessions)

                cluster_dwell[cluster_id] = average_dwell

            sorted_clusters = sorted(cluster_dwell.items(), key=lambda x: x[1])

            quick_buyer_cluster = sorted_clusters[0][0]
            comparison_cluster = sorted_clusters[1][0]
            explorer_cluster = sorted_clusters[2][0]

            for i, session in enumerate(sessions):

                cluster = clusters[i]

                if cluster == quick_buyer_cluster:
                    session.segment = "Quick Buyer"

                elif cluster == explorer_cluster:
                    session.segment = "Explorer"

                else:
                    session.segment = "Comparison Shopper"

            db.commit()

        finally:
            db.close()
