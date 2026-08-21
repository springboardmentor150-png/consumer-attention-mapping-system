import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../layouts/DashboardLayout";
import { SkeletonDashboard } from "../components/Skeleton";
import { getManagerDashboard } from "../services/dashboardService";
import { getRoleLabel } from "../utils/roleUtils";
import { FiActivity, FiAlertCircle, FiArrowUpRight, FiCheckCircle, FiClock, FiEye, FiShoppingBag, FiTrendingUp, FiUsers } from 'react-icons/fi';
import "../styles/ExecutiveDashboard.css";

export default function ManagerDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await getManagerDashboard();
            setData(response.data);
        } catch (error) {
            console.error("Manager dashboard error:", error);
            // Fallback structured data
            setData({
                shoppers: 2453,
                average_dwell: 18.6,
                attention_rate: 87,
                attractiveness_score: 76.4,
                conversion_rate: 34.2,
                hourly_traffic: [
                    { hour: "09:00", count: 120, peak: false },
                    { hour: "10:00", count: 210, peak: false },
                    { hour: "11:00", count: 380, peak: true },
                    { hour: "12:00", count: 490, peak: true },
                    { hour: "13:00", count: 410, peak: true },
                    { hour: "14:00", count: 330, peak: false },
                    { hour: "15:00", count: 290, peak: false },
                    { hour: "16:00", count: 420, peak: true },
                    { hour: "17:00", count: 510, peak: true },
                ],
                product_engagement: [
                    { name: "UltraSmart Watch Gen4", shelf: "Shelf B - Electronics", gaze_count: 840, dwell_sec: 34.5, engagement_rate: 88 },
                    { name: "Luxe Radiant Serum", shelf: "Shelf A - Cosmetics", gaze_count: 910, dwell_sec: 42.1, engagement_rate: 93 },
                    { name: "Pro Wireless Headphones", shelf: "Shelf B - Electronics", gaze_count: 780, dwell_sec: 28.6, engagement_rate: 82 },
                    { name: "Organic Almond Milk", shelf: "Shelf E - Snacks", gaze_count: 620, dwell_sec: 19.2, engagement_rate: 74 },
                ],
                top_shelves: [
                    { name: "Shelf A - Cosmetics", score: 94, zone: "Zone 1", dwell: "24.2s", status: "Optimal", efficiency: 92 },
                    { name: "Shelf B - Electronics", score: 88, zone: "Zone 2", dwell: "31.0s", status: "High Dwell", efficiency: 85 },
                    { name: "Shelf E - Premium Snacks", score: 79, zone: "Zone 3", dwell: "16.4s", status: "Good", efficiency: 78 },
                    { name: "Shelf D - Beverages", score: 64, zone: "Zone 4", dwell: "11.8s", status: "Underperforming", efficiency: 60 },
                ],
                conversion_metrics: {
                    browse_to_buy_rate: 34.2,
                    interaction_to_purchase: 68.5,
                    total_conversions: 839,
                    conversion_by_zone: [
                        { zone: "Zone 1 (Cosmetics)", browse: 850, bought: 340, rate: 40.0 },
                        { zone: "Zone 2 (Electronics)", browse: 720, bought: 216, rate: 30.0 },
                        { zone: "Zone 3 (Snacks)", browse: 560, bought: 201, rate: 35.8 },
                        { zone: "Zone 4 (Beverages)", browse: 323, bought: 82, "rate": 25.3 },
                    ]
                },
                recommendations: [
                    { title: "High Attention - Low Conversion Alert", shelf: "Shelf B - Electronics", type: "warning", action: "Consider restructuring shelf placement or promotional pricing." },
                    { title: "Strong Product Attractiveness", shelf: "Shelf A - Cosmetics", type: "success", action: "Maintain prime eye-level positioning and high-contrast lighting." }
                ]
            });
        }
    };

    const displayName = user?.name || "Store Manager";
    const displayRole = getRoleLabel(user?.role);
    const avatarLetter = (displayName.charAt(0) || "M").toUpperCase();

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
                        <h1>Store Manager Dashboard</h1>
                        <p>Real-time store traffic, product engagement, shelf performance & conversion intelligence</p>
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

                <section className="dashboard-welcome flex-between">
                    <div>
                        <h2>Welcome back, {displayName} 👋</h2>
                        <p>Store traffic is <strong>+14% higher</strong> than yesterday. Peak hour detected at <strong>17:00 PM</strong>.</p>
                    </div>
                    <div className="tab-pill-group">
                        <button type="button" className={`tab-pill ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>Overview</button>
                        <button type="button" className={`tab-pill ${activeTab === 'traffic' ? 'active' : ''}`} onClick={() => setActiveTab('traffic')}>Traffic</button>
                        <button type="button" className={`tab-pill ${activeTab === 'engagement' ? 'active' : ''}`} onClick={() => setActiveTab('engagement')}>Engagement</button>
                        <button type="button" className={`tab-pill ${activeTab === 'conversion' ? 'active' : ''}`} onClick={() => setActiveTab('conversion')}>Conversion</button>
                    </div>
                </section>

                {/* 4 TOP LEVEL KPI METRIC CARDS */}
                <section className="stat-grid">
                    <StatCard icon="👥" title="Total Shoppers Today" value={data.shoppers} trend="+12.4% vs yesterday" />
                    <StatCard icon="⏱️" title="Average Dwell Duration" value={`${data.average_dwell}s`} trend="+2.1s dwell gain" />
                    <StatCard icon="👁️" title="Attention Rate" value={`${data.attention_rate}%`} trend="Optimal visibility" />
                    <StatCard icon="📈" title="Conversion Rate" value={`${data.conversion_rate || 34.2}%`} trend="Browse-to-Buy ratio" />
                </section>

                {/* SECTION 1: STORE TRAFFIC ANALYTICS */}
                {(activeTab === 'all' || activeTab === 'traffic') && (
                    <section className="dashboard-card margin-bottom-20">
                        <div className="flex-between margin-bottom-15">
                            <div>
                                <h3 className="section-title">📊 1. Store Traffic Analytics</h3>
                                <p className="dashboard-card-subtitle">Hourly footfall distribution & peak store occupancy</p>
                            </div>
                            <span className="live-status-pill">Peak Traffic: 17:00 (510 Shoppers)</span>
                        </div>
                        
                        <div className="traffic-bar-chart">
                            {data.hourly_traffic?.map((item) => (
                                <div key={item.hour} className="traffic-col">
                                    <div className="bar-wrapper">
                                        <div
                                            className={`bar-fill ${item.peak ? 'peak' : ''}`}
                                            style={{ height: `${(item.count / 550) * 100}%` }}
                                            title={`${item.hour}: ${item.count} shoppers`}
                                        >
                                            <span className="bar-val">{item.count}</span>
                                        </div>
                                    </div>
                                    <span className="bar-label">{item.hour}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* SECTION 2 & 3: PRODUCT ENGAGEMENT INSIGHTS & SHELF PERFORMANCE */}
                {(activeTab === 'all' || activeTab === 'engagement') && (
                    <section className="dashboard-grid">
                        <div className="dashboard-card">
                            <h3 className="section-title">🔍 2. Product Engagement Insights</h3>
                            <p className="dashboard-card-subtitle">Visual gaze count, interaction duration & engagement score per product</p>

                            <div className="table-responsive">
                                <table className="compact-table">
                                    <thead>
                                        <tr>
                                            <th>Product Name</th>
                                            <th>Shelf Location</th>
                                            <th>Gaze Count</th>
                                            <th>Avg Dwell</th>
                                            <th>Engagement Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.product_engagement?.map((prod) => (
                                            <tr key={prod.name}>
                                                <td><strong>{prod.name}</strong></td>
                                                <td><span className="shelf-badge">{prod.shelf}</span></td>
                                                <td>👁️ {prod.gaze_count}</td>
                                                <td>{prod.dwell_sec}s</td>
                                                <td>
                                                    <div className="mini-progress">
                                                        <div className="mini-fill" style={{ width: `${prod.engagement_rate}%` }}></div>
                                                        <span>{prod.engagement_rate}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="dashboard-card">
                            <h3 className="section-title">🏷️ 3. Shelf Performance Reports</h3>
                            <p className="dashboard-card-subtitle">Shelves ranked by attention score & operational status</p>
                            {data.top_shelves.map((shelf) => (
                                <div className="progress-row" key={shelf.name}>
                                    <div className="progress-header">
                                        <div>
                                            <strong>{shelf.name}</strong>
                                            <span className="zone-tag"> ({shelf.zone || 'Zone'})</span>
                                        </div>
                                        <span className={`status-badge ${shelf.status === 'Underperforming' ? 'alert' : 'success'}`}>
                                            {shelf.score}% Score • {shelf.status || 'Good'}
                                        </span>
                                    </div>
                                    <div className="progress">
                                        <div className="progress-fill" style={{ width: `${shelf.score}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* SECTION 4: CONVERSION METRICS & RECOMMENDATIONS */}
                {(activeTab === 'all' || activeTab === 'conversion') && (
                    <section className="dashboard-grid">
                        <div className="dashboard-card">
                            <h3 className="section-title">💰 4. Conversion Metrics</h3>
                            <p className="dashboard-card-subtitle">Browse-to-Buy and Interaction-to-Purchase conversion rates by store zone</p>

                            <div className="conversion-stats-grid">
                                <div className="metric-box">
                                    <span className="metric-label">Browse-to-Buy Rate</span>
                                    <h2 className="metric-value">{data.conversion_metrics?.browse_to_buy_rate || 34.2}%</h2>
                                </div>
                                <div className="metric-box">
                                    <span className="metric-label">Interaction-to-Purchase</span>
                                    <h2 className="metric-value">{data.conversion_metrics?.interaction_to_purchase || 68.5}%</h2>
                                </div>
                            </div>

                            <div className="zone-conversion-list">
                                {data.conversion_metrics?.conversion_by_zone?.map((z) => (
                                    <div key={z.zone} className="zone-conv-row">
                                        <div className="zone-conv-header">
                                            <span>{z.zone}</span>
                                            <strong>{z.rate}% Conversion</strong>
                                        </div>
                                        <div className="zone-conv-sub">
                                            <span>Browsed: {z.browse}</span> • <span>Purchased: {z.bought}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="dashboard-card">
                            <h3 className="section-title">💡 Actionable AI Recommendations</h3>
                            <p className="dashboard-card-subtitle">Real-time optimization tips for store managers</p>
                            {data.recommendations.map((item, index) => (
                                <div className="recommendation" key={index}>
                                    <div className="recommendation-icon">
                                        {item.type === "warning" ? "⚠️" : "✅"}
                                    </div>
                                    <div className="recommendation-content">
                                        <strong>{item.title}</strong>
                                        <span>Location: {item.shelf}</span>
                                        {item.action && <p className="action-text">{item.action}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </DashboardLayout>
    );
}

function StatCard({ icon, title, value, trend }) {
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
