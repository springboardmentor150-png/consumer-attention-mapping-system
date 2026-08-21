import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../layouts/DashboardLayout";
import { SkeletonDashboard } from "../components/Skeleton";
import { getMarketingDashboard } from "../services/dashboardService";
import { getRoleLabel } from "../utils/roleUtils";
import "../styles/ExecutiveDashboard.css";

export default function MarketingDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState(null);

    useEffect(() => {
        getMarketingDashboard()
            .then(response => {
                setData(response.data);
            })
            .catch(error => {
                console.error(error);
            });
    }, []);

    const displayName = user?.name || "Marketing Manager";
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
                        <h1>Marketing Manager Dashboard</h1>
                        <p>Campaign and product visibility analytics</p>
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

                <section className="stat-grid">
                    <Stat icon="📢" title="Campaign Effectiveness" value={`${data.campaign_effectiveness}%`} />
                    <Stat icon="👁️" title="Product Visibility" value={`${data.product_visibility}%`} />
                    <Stat icon="🎯" title="Promotional Performance" value={`${data.promotional_performance}%`} />
                    <Stat icon="💬" title="Customer Engagement" value={`${data.customer_engagement}%`} />
                </section>

                <section className="dashboard-grid">
                    <div className="dashboard-card">
                        <h3>Campaign Effectiveness</h3>
                        <p className="dashboard-card-subtitle">Current campaign performance</p>
                        <Progress name="Campaign Performance" value={data.campaign_effectiveness} />
                        <Progress name="Product Visibility" value={data.product_visibility} />
                        <Progress name="Promotion Performance" value={data.promotional_performance} />
                        <Progress name="Customer Engagement" value={data.customer_engagement} />
                    </div>

                    <div className="dashboard-card">
                        <h3>Marketing Insights</h3>
                        <div className="recommendation">
                            <div className="recommendation-icon">📈</div>
                            <div className="recommendation-content">
                                <strong>Product Visibility</strong>
                                <span>Monitor products with low shelf attention.</span>
                            </div>
                        </div>

                        <div className="recommendation">
                            <div className="recommendation-icon">🎯</div>
                            <div className="recommendation-content">
                                <strong>Promotional Performance</strong>
                                <span>Compare promotional areas using attention data.</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}


function Stat({
    icon,
    title,
    value
}) {

    return (

        <div className="stat-card">

            <div className="stat-card-top">

                <div>

                    <p>{title}</p>

                    <h2>{value}</h2>

                </div>

                <div className="stat-icon">
                    {icon}
                </div>

            </div>

        </div>
    );
}


function Progress({
    name,
    value
}) {

    return (

        <div className="progress-row">

            <div className="progress-header">

                <span>{name}</span>

                <strong>
                    {value}%
                </strong>

            </div>

            <div className="progress">

                <div
                    className="progress-fill"
                    style={{
                        width: `${value}%`
                    }}
                />

            </div>

        </div>
    );
}