import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../layouts/DashboardLayout";
import { SkeletonDashboard } from "../components/Skeleton";
import { getAdminDashboard } from "../services/dashboardService";
import { getRoleLabel } from "../utils/roleUtils";
import "../styles/ExecutiveDashboard.css";

export default function AdminDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState(null);

    useEffect(() => {
        getAdminDashboard()
            .then(response => {
                setData(response.data);
            })
            .catch(error => {
                console.error(error);
            });
    }, []);

    const displayName = user?.name || "Administrator";
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
                        <h1>Admin Dashboard</h1>
                        <p>Platform administration and system monitoring</p>
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

                <section className="dashboard-welcome">
                    <h2>System Overview ⚙️</h2>
                    <p>Monitor the Consumer Attention Mapping platform.</p>
                </section>

                <section className="stat-grid">
                    <Stat icon="👥" title="Users" value={data.users} />
                    <Stat icon="🏬" title="Stores" value={data.stores} />
                    <Stat icon="🗄️" title="Shelves" value={data.shelves} />
                    <Stat icon="📹" title="Cameras" value={data.cameras} />
                </section>

                <div className="dashboard-card">
                    <h3>System Health</h3>
                    <p className="dashboard-card-subtitle">Current platform status</p>
                    <Status name="Platform" value={data.system_status} />
                    <Status name="API" value={data.api_status} />
                    <Status name="Database" value={data.database_status} />
                    <Status name="AI Engine" value={data.ai_status} />
                </div>
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

                    <p>
                        {title}
                    </p>

                    <h2>
                        {value}
                    </h2>

                </div>

                <div className="stat-icon">
                    {icon}
                </div>

            </div>

        </div>
    );
}


function Status({
    name,
    value
}) {

    return (

        <div className="status-row">

            <strong>
                {name}
            </strong>

            <span className="status-online">
                ● {value}
            </span>

        </div>
    );
}