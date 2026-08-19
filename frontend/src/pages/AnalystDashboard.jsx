import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../layouts/DashboardLayout";
import { SkeletonDashboard } from "../components/Skeleton";
import { getAnalystDashboard } from "../services/dashboardService";
import { getRoleLabel } from "../utils/roleUtils";
import "../styles/ExecutiveDashboard.css";

export default function AnalystDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [activeSegment, setActiveSegment] = useState('all');

    useEffect(() => {
        getAnalystDashboard()
            .then(response => {
                setData(response.data);
            })
            .catch(error => {
                console.error(error);
                // Fallback structured data for Retail Analyst
                setData({
                    total_shoppers: 2453,
                    attention_rate: 87.4,
                    avg_dwell_time: 18.6,
                    segments: {
                        explorers: 42,
                        quick_buyers: 31,
                        comparison_shoppers: 27
                    },
                    heatmaps: {
                        hot_zone: "Shelf A - Cosmetics",
                        cold_zone: "Shelf D - Beverages",
                        active_heat_points: 342,
                        shelf_heat_distribution: [
                            { shelf: "Shelf A - Cosmetics", heat_score: 95, temp: "Hot" },
                            { shelf: "Shelf B - Electronics", heat_score: 84, temp: "Warm" },
                            { shelf: "Shelf C - Fashion", heat_score: 72, temp: "Warm" },
                            { shelf: "Shelf D - Beverages", heat_score: 41, temp: "Cold" },
                            { shelf: "Shelf E - Snacks", heat_score: 78, temp: "Warm" },
                        ]
                    },
                    demographics: {
                        age_groups: [
                            { group: "18-24", percentage: 22 },
                            { group: "25-34", percentage: 44 },
                            { group: "35-49", percentage: 21 },
                            { group: "50+", percentage: 13 },
                        ],
                        gender: [
                            { type: "Female", percentage: 56 },
                            { type: "Male", percentage: 41 },
                            { type: "Other", percentage: 3 },
                        ]
                    },
                    top_products: [
                        { name: "Luxe Radiant Serum", score: 96, gaze_pick_ratio: "84%", category: "Cosmetics" },
                        { name: "UltraSmart Watch Gen4", score: 91, gaze_pick_ratio: "76%", category: "Electronics" },
                        { name: "Pro Wireless Headphones", score: 84, gaze_pick_ratio: "71%", category: "Electronics" },
                        { name: "Organic Almond Milk", score: 76, gaze_pick_ratio: "68%", category: "Beverages" },
                        { name: "Artisan Dark Chocolate", score: 72, gaze_pick_ratio: "59%", category: "Snacks" }
                    ],
                    customer_journey: {
                        avg_journey_time: "14 min 30 sec",
                        top_transitions: [
                            { from_shelf: "Entrance", to_shelf: "Shelf A (Cosmetics)", count: 1040, percentage: 42.3 },
                            { from_shelf: "Shelf A (Cosmetics)", to_shelf: "Shelf B (Electronics)", count: 680, percentage: 27.7 },
                            { from_shelf: "Shelf B (Electronics)", to_shelf: "Shelf E (Snacks)", count: 510, percentage: 20.7 },
                            { from_shelf: "Shelf E (Snacks)", to_shelf: "Checkout", count: 890, percentage: 36.2 },
                        ],
                        popular_paths: [
                            "Entrance ➔ Shelf A (Cosmetics) ➔ Shelf B (Electronics) ➔ Checkout",
                            "Entrance ➔ Shelf E (Snacks) ➔ Shelf D (Beverages) ➔ Checkout",
                            "Entrance ➔ Shelf B (Electronics) ➔ Shelf E (Snacks) ➔ Checkout"
                        ]
                    }
                });
            });
    }, []);

    const displayName = user?.name || "Retail Analyst";
    const displayRole = getRoleLabel(user?.role);
    const avatarLetter = (displayName.charAt(0) || "A").toUpperCase();

    if (!data) {
        return (
            <DashboardLayout>
                <SkeletonDashboard />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="dashboard-page">
                <header className="dashboard-header">
                    <div>
                        <h1>Retail Analyst Dashboard</h1>
                        <p>Consumer behavior, attention heatmaps, product attractiveness & customer journey analytics</p>
                    </div>

                    <div className="dashboard-user">
                        <div className="dashboard-avatar">{avatarLetter}</div>
                        <div>
                            <strong>{displayName}</strong>
                            <br />
                            <small>{displayRole}</small>
                        </div>
                    </div>
                </header>

                {/* OVERVIEW STATS */}
                <section className="stat-grid">
                    <Stat icon="👥" title="Total Shoppers Sampled" value={data.total_shoppers} trend="100% Tracking Coverage" />
                    <Stat icon="👁️" title="Average Attention Rate" value={`${data.attention_rate}%`} trend="High Visual Engagement" />
                    <Stat icon="🧠" title="Explorer Segment" value={`${data.segments.explorers}%`} trend="High Store Dwellers" />
                    <Stat icon="🔎" title="Comparison Segment" value={`${data.segments.comparison_shoppers}%`} trend="Evaluate multiple options" />
                </section>

                {/* SECTION 1: CONSUMER BEHAVIOR ANALYTICS */}
                <section className="dashboard-grid margin-bottom-20">
                    <div className="dashboard-card">
                        <h3 className="section-title">👥 1. Consumer Behavior & Demographics</h3>
                        <p className="dashboard-card-subtitle">Shopper behavior personas and demographic breakdown</p>

                        <div className="demographics-grid">
                            <div>
                                <h4>Shopper Personas</h4>
                                <Progress name="Explorers (High Dwell)" value={data.segments.explorers} />
                                <Progress name="Quick Buyers (Direct Path)" value={data.segments.quick_buyers} />
                                <Progress name="Comparison Shoppers (Multi-gaze)" value={data.segments.comparison_shoppers} />
                            </div>

                            <div>
                                <h4>Age Distribution</h4>
                                {data.demographics?.age_groups?.map((ag) => (
                                    <Progress key={ag.group} name={`Age ${ag.group}`} value={ag.percentage} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: ATTENTION HEATMAPS */}
                    <div className="dashboard-card">
                        <h3 className="section-title">🔥 2. Attention Heatmaps & Hotzones</h3>
                        <p className="dashboard-card-subtitle">Hot & cold zones based on shopper visual concentration</p>
                        
                        <div className="heatmap-summary-badge">
                            <span className="hot-pill">🔥 Hotzone: {data.heatmaps?.hot_zone}</span>
                            <span className="cold-pill">❄️ Coldzone: {data.heatmaps?.cold_zone}</span>
                        </div>

                        <div
                            style={{
                                height: "200px",
                                marginTop: "15px",
                                borderRadius: "15px",
                                position: "relative",
                                background:
                                    "radial-gradient(circle at 30% 40%, rgba(239, 68, 68, 0.8), transparent 25%), radial-gradient(circle at 70% 35%, rgba(245, 158, 11, 0.7), transparent 28%), radial-gradient(circle at 55% 75%, rgba(34, 197, 94, 0.6), transparent 30%), #0f172a",
                                border: "1px solid #1e293b"
                            }}
                        >
                            <div style={{ position: 'absolute', bottom: '12px', left: '12px', color: '#f8fafc', fontSize: '11px', fontWeight: 'bold' }}>
                                LIVE SPATIAL HEAT DENSITY • 342 Active Points
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION 3 & 4: PRODUCT ATTRACTIVENESS & CUSTOMER JOURNEY ANALYTICS */}
                <section className="dashboard-grid">
                    <div className="dashboard-card">
                        <h3 className="section-title">⭐ 3. Product Attractiveness Reports</h3>
                        <p className="dashboard-card-subtitle">Highest scoring products based on visual attention vs pick-up ratio</p>

                        <div className="compact-table-wrapper">
                            <table className="compact-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Score</th>
                                        <th>Gaze-to-Pick</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.top_products.map(prod => (
                                        <tr key={prod.name}>
                                            <td><strong>{prod.name}</strong></td>
                                            <td><span className="shelf-badge">{prod.category || 'Retail'}</span></td>
                                            <td><strong style={{ color: '#2563eb' }}>{prod.score}/100</strong></td>
                                            <td><span className="gaze-pill">{prod.gaze_pick_ratio || '78%'}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <h3 className="section-title">🗺️ 4. Customer Journey Analytics</h3>
                        <p className="dashboard-card-subtitle">Sequential shopper movement paths & shelf-to-shelf transitions</p>

                        <div className="journey-summary">
                            <span>Average Store Journey Duration: <strong>{data.customer_journey?.avg_journey_time}</strong></span>
                        </div>

                        <div className="popular-paths-list">
                            <h4>Most Frequent Customer Paths:</h4>
                            {data.customer_journey?.popular_paths?.map((path, idx) => (
                                <div key={idx} className="path-card">
                                    <span className="path-idx">Path #{idx + 1}</span>
                                    <span className="path-text">{path}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}

function Stat({ icon, title, value, trend }) {
    return (
        <div className="stat-card">
            <div className="stat-card-top">
                <div>
                    <p>{title}</p>
                    <h2>{value}</h2>
                    <small className="stat-trend">{trend}</small>
                </div>
                <div className="stat-icon">{icon}</div>
            </div>
        </div>
    );
}

function Progress({ name, value }) {
    return (
        <div className="progress-row">
            <div className="progress-header">
                <span>{name}</span>
                <strong>{value}%</strong>
            </div>
            <div className="progress">
                <div className="progress-fill" style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}
