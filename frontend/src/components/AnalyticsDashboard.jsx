import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AnalyticsDashboard.css";

function AnalyticsDashboard() {

    const [summary, setSummary] = useState({});
    const [analytics, setAnalytics] = useState([]);
    const [segments, setSegments] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    const API = "http://127.0.0.1:8000";

    useEffect(() => {

        const loadDashboard = async () => {

            try {

                const [
                    summaryResponse,
                    attentionResponse,
                    segmentsResponse,
                    recommendationsResponse,
                    alertsResponse
                ] = await Promise.all([

                    axios.get(`${API}/analytics/summary`),

                    axios.get(`${API}/analytics/attention`),

                    axios.get(`${API}/analytics/segments`),

                    axios.get(`${API}/analytics/recommendations`),

                    axios.get(`${API}/analytics/alerts`)

                ]);

                setSummary(summaryResponse.data);

                setAnalytics(attentionResponse.data);

                setSegments(segmentsResponse.data);

                setRecommendations(
                    recommendationsResponse.data
                );

                setAlerts(alertsResponse.data);

                // setHeatmap(
                //     `${API}/analytics/heatmap?${Date.now()}`
                // );

            } catch (error) {

                console.error(
                    "Dashboard loading error:",
                    error
                );

            } finally {

                setLoading(false);

            }

        };

        loadDashboard();

    }, []);

    const downloadExcelReport = () => {

        window.open(
            `${API}/analytics/report`,
            "_blank"
        );

    };

    const downloadPDFReport = () => {

        window.open(
            `${API}/analytics/report/pdf`,
            "_blank"
        );

    };

    if (loading) {

        return (
            <div
                style={{
                    textAlign: "center",
                    padding: "50px",
                    fontSize: "20px"
                }}
            >
                Loading Analytics Dashboard...
            </div>
        );

    }

    return (
                <div
            style={{
                width: "1100px",
                maxWidth: "95%",
                margin: "40px auto",
                background: "#F6F8FC",
                padding: "35px",
                borderRadius: "25px",
                boxShadow: "0 10px 35px rgba(0,0,0,.08)"
            }}
        >

            {/* ========================= */}
            {/* DASHBOARD HEADER */}
            {/* ========================= */}

            <h1
                style={{
                    textAlign: "center",
                    marginBottom: "10px",
                    color: "#1A73E8"
                }}
            >
                🛒 Consumer Attention Analytics Dashboard
            </h1>

            <p
                style={{
                    textAlign: "center",
                    color: "#666",
                    marginBottom: "35px"
                }}
            >
                Real-Time Retail Shopper Analytics using
                YOLOv8 + ByteTrack + FastAPI + React
            </p>


            {/* ========================= */}
            {/* REPORT DOWNLOAD BUTTONS */}
            {/* ========================= */}

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "12px",
                    marginBottom: "35px",
                    flexWrap: "wrap"
                }}
            >

                <button
                    onClick={downloadExcelReport}
                    style={{
                        background: "#1A73E8",
                        color: "white",
                        border: "none",
                        padding: "12px 24px",
                        borderRadius: "10px",
                        fontSize: "15px",
                        fontWeight: "600",
                        cursor: "pointer",
                        boxShadow:
                            "0 5px 15px rgba(26,115,232,0.25)"
                    }}
                >
                    📥 Download Excel Report
                </button>


                <button
                    onClick={downloadPDFReport}
                    style={{
                        background: "#6C63FF",
                        color: "white",
                        border: "none",
                        padding: "12px 24px",
                        borderRadius: "10px",
                        fontSize: "15px",
                        fontWeight: "600",
                        cursor: "pointer",
                        boxShadow:
                            "0 5px 15px rgba(108,99,255,0.25)"
                    }}
                >
                    📄 Download PDF Report
                </button>

            </div>


            {/* ========================= */}
            {/* KPI CARDS */}
            {/* ========================= */}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(4, minmax(0, 1fr))",
                    gap: "20px",
                    marginBottom: "35px"
                }}
            >

                {/* TOTAL SHOPPERS */}

                <div
                    style={{
                        background: "#FFFFFF",
                        padding: "25px",
                        borderRadius: "18px",
                        textAlign: "center",
                        boxShadow:
                            "0 8px 20px rgba(0,0,0,.08)"
                    }}
                >

                    <h3>
                        👥 Total Shoppers
                    </h3>

                    <h2
                        style={{
                            color: "#1A73E8",
                            margin: "10px 0 0"
                        }}
                    >
                        {summary.total_shoppers || 0}
                    </h2>

                </div>


                {/* AVERAGE DWELL */}

                <div
                    style={{
                        background: "#FFFFFF",
                        padding: "25px",
                        borderRadius: "18px",
                        textAlign: "center",
                        boxShadow:
                            "0 8px 20px rgba(0,0,0,.08)"
                    }}
                >

                    <h3>
                        ⏱ Average Dwell
                    </h3>

                    <h2
                        style={{
                            color: "#6C63FF",
                            margin: "10px 0 0"
                        }}
                    >
                        {summary.average_attention || 0} sec
                    </h2>

                </div>


                {/* TOTAL ATTENTION */}

                <div
                    style={{
                        background: "#FFFFFF",
                        padding: "25px",
                        borderRadius: "18px",
                        textAlign: "center",
                        boxShadow:
                            "0 8px 20px rgba(0,0,0,.08)"
                    }}
                >

                    <h3>
                        📊 Total Attention
                    </h3>

                    <h2
                        style={{
                            color: "#00A878",
                            margin: "10px 0 0"
                        }}
                    >
                        {summary.total_attention || 0} sec
                    </h2>

                </div>


                {/* TOP SHELF */}

                <div
                    style={{
                        background: "#FFFFFF",
                        padding: "25px",
                        borderRadius: "18px",
                        textAlign: "center",
                        boxShadow:
                            "0 8px 20px rgba(0,0,0,.08)"
                    }}
                >

                    <h3>
                        🏆 Top Shelf
                    </h3>

                    <h2
                        style={{
                            color: "#FF8A00",
                            margin: "10px 0 0",
                            fontSize: "20px"
                        }}
                    >
                        {summary.top_shelf || "N/A"}
                    </h2>

                </div>

            </div>
                        {/* ========================= */}
            {/* SHELF ATTENTION RANKING */}
            {/* ========================= */}

            <div
                style={{
                    background: "#FFFFFF",
                    padding: "25px",
                    borderRadius: "18px",
                    boxShadow: "0 8px 20px rgba(0,0,0,.08)",
                    marginBottom: "35px"
                }}
            >

                <h2
                    style={{
                        color: "#1A73E8",
                        marginBottom: "20px"
                    }}
                >
                    🏆 Shelf Attention Ranking
                </h2>


                {analytics.length === 0 ? (

                    <p
                        style={{
                            color: "#777",
                            textAlign: "center"
                        }}
                    >
                        No shelf analytics available.
                    </p>

                ) : (

                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse"
                        }}
                    >

                        <thead>

                            <tr
                                style={{
                                    background: "#EEF4FF"
                                }}
                            >

                                <th
                                    style={{
                                        padding: "15px",
                                        textAlign: "center"
                                    }}
                                >
                                    Rank
                                </th>

                                <th
                                    style={{
                                        padding: "15px",
                                        textAlign: "left"
                                    }}
                                >
                                    Shelf
                                </th>

                                <th
                                    style={{
                                        padding: "15px",
                                        textAlign: "center"
                                    }}
                                >
                                    Attention (sec)
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {[...analytics]
                                .sort(
                                    (a, b) =>
                                        (b.total_attention || 0) -
                                        (a.total_attention || 0)
                                )
                                .map((item, index) => (

                                    <tr
                                        key={index}
                                        style={{
                                            borderBottom:
                                                "1px solid #eee"
                                        }}
                                    >

                                        <td
                                            style={{
                                                padding: "15px",
                                                textAlign: "center",
                                                fontWeight: "600"
                                            }}
                                        >
                                            {
                                                index === 0
                                                    ? "🥇"
                                                    : index === 1
                                                    ? "🥈"
                                                    : index === 2
                                                    ? "🥉"
                                                    : index + 1
                                            }
                                        </td>


                                        <td
                                            style={{
                                                padding: "15px",
                                                fontWeight: "600"
                                            }}
                                        >
                                            {item.shelf_name || "Unknown Shelf"}
                                        </td>


                                        <td
                                            style={{
                                                padding: "15px",
                                                textAlign: "center",
                                                color: "#1A73E8",
                                                fontWeight: "700"
                                            }}
                                        >
                                            {(item.total_attention || 0).toFixed(1)}
                                        </td>

                                    </tr>

                                ))}

                        </tbody>

                    </table>

                )}

            </div>
                        {/* ========================= */}
            {/* SHOPPER SEGMENTATION */}
            {/* ========================= */}

            <div
                style={{
                    background: "#FFFFFF",
                    padding: "25px",
                    borderRadius: "18px",
                    boxShadow: "0 8px 20px rgba(0,0,0,.08)",
                    marginBottom: "35px"
                }}
            >

                <h2
                    style={{
                        color: "#1A73E8",
                        marginBottom: "20px"
                    }}
                >
                    🧠 Shopper Segmentation
                </h2>


                {segments.length === 0 ? (

                    <p
                        style={{
                            color: "#777",
                            textAlign: "center"
                        }}
                    >
                        No shopper segmentation data available.
                    </p>

                ) : (

                    <div>

                        {segments.map((item, index) => (

                            <div
                                key={index}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "15px 10px",
                                    borderBottom:
                                        "1px solid #eee"
                                }}
                            >

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px"
                                    }}
                                >

                                    <span
                                        style={{
                                            width: "35px",
                                            height: "35px",
                                            borderRadius: "50%",
                                            background: "#EEF4FF",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: "700",
                                            color: "#1A73E8"
                                        }}
                                    >
                                        {index + 1}
                                    </span>

                                    <span
                                        style={{
                                            fontWeight: "600"
                                        }}
                                    >
                                        {item.segment || "Unknown"}
                                    </span>

                                </div>


                                <span
                                    style={{
                                        color: "#1A73E8",
                                        fontWeight: "700",
                                        fontSize: "18px"
                                    }}
                                >
                                    {item.count || 0}
                                </span>

                            </div>

                        ))}

                    </div>

                )}

            </div>
                        {/* ========================= */}
            {/* STORE RECOMMENDATIONS */}
            {/* ========================= */}

            <div
                style={{
                    background: "#FFFFFF",
                    padding: "25px",
                    borderRadius: "18px",
                    boxShadow: "0 8px 20px rgba(0,0,0,.08)",
                    marginBottom: "35px"
                }}
            >

                <h2
                    style={{
                        color: "#1A73E8",
                        marginBottom: "20px"
                    }}
                >
                    📢 Store Recommendations
                </h2>


                {recommendations.length === 0 ? (

                    <p
                        style={{
                            color: "#777",
                            textAlign: "center"
                        }}
                    >
                        No recommendations available yet.
                    </p>

                ) : (

                    <div>

                        {recommendations.map((item, index) => (

                            <div
                                key={index}
                                style={{
                                    padding: "18px",
                                    marginBottom: "15px",
                                    borderLeft: "6px solid #1A73E8",
                                    background: "#F8F9FC",
                                    borderRadius: "10px"
                                }}
                            >

                                <h3
                                    style={{
                                        margin: "0 0 8px 0",
                                        color: "#333"
                                    }}
                                >
                                    {item.shelf ||
                                        item.shelf_name ||
                                        "Shelf"}
                                </h3>


                                <p
                                    style={{
                                        margin: "6px 0",
                                        color: "#555"
                                    }}
                                >
                                    ⭐ Score:{" "}
                                    <strong>
                                        {
                                            item.score ??
                                            item.attractiveness_score ??
                                            0
                                        }
                                    </strong>
                                </p>


                                <p
                                    style={{
                                        margin: "6px 0",
                                        color: "#555",
                                        lineHeight: "1.6"
                                    }}
                                >
                                    {item.recommendation ||
                                        "No recommendation available."}
                                </p>

                            </div>

                        ))}

                    </div>

                )}

            </div>
                        {/* ========================= */}
            {/* ALERTS & NOTIFICATIONS */}
            {/* ========================= */}

            <div
                style={{
                    background: "#FFFFFF",
                    padding: "25px",
                    borderRadius: "18px",
                    boxShadow: "0 8px 20px rgba(0,0,0,.08)",
                    marginBottom: "35px"
                }}
            >

                <h2
                    style={{
                        color: "#E65100",
                        marginBottom: "20px"
                    }}
                >
                    🚨 Alerts & Notifications
                </h2>


                {alerts.length === 0 ? (

                    <p
                        style={{
                            color: "#777",
                            textAlign: "center"
                        }}
                    >
                        No active alerts.
                    </p>

                ) : (

                    <div>

                        {alerts.map((alert, index) => (

                            <div
                                key={index}
                                style={{
                                    padding: "16px",
                                    marginBottom: "12px",
                                    background: "#FFF7ED",
                                    borderLeft: "6px solid #FF8A00",
                                    borderRadius: "10px"
                                }}
                            >

                                <h3
                                    style={{
                                        margin: "0 0 8px 0",
                                        color: "#333"
                                    }}
                                >
                                    {alert.title ||
                                        alert.type ||
                                        "Attention Alert"}
                                </h3>


                                <p
                                    style={{
                                        margin: "5px 0",
                                        color: "#555",
                                        lineHeight: "1.6"
                                    }}
                                >
                                    {alert.message ||
                                        alert.description ||
                                        alert.alert ||
                                        "Attention level requires review."}
                                </p>


                                {alert.shelf && (

                                    <p
                                        style={{
                                            margin: "5px 0",
                                            fontWeight: "600",
                                            color: "#E65100"
                                        }}
                                    >
                                        Shelf: {alert.shelf}
                                    </p>

                                )}


                                {alert.severity && (

                                    <p
                                        style={{
                                            margin: "5px 0",
                                            fontWeight: "600"
                                        }}
                                    >
                                        Severity: {alert.severity}
                                    </p>

                                )}

                            </div>

                        ))}

                    </div>

                )}

            </div>
            <div
    style={{
        marginTop: "40px",
        background: "#ffffff",
        padding: "25px",
        borderRadius: "18px",
        boxShadow: "0 8px 25px rgba(0,0,0,.08)"
    }}
>
    <h2
        style={{
            marginBottom: "20px",
            color: "#1A73E8"
        }}
    >
        🔥 Store Traffic Heatmap
    </h2>

    <img
        src={`http://127.0.0.1:8000/analytics/heatmap?${Date.now()}`}
        alt="Heatmap"
        style={{
            width: "100%",
            borderRadius: "15px"
        }}
    />
</div>
            {/* ========================= */}
            {/* REPORTS & EXPORT */}
            {/* ========================= */}

            <div
                style={{
                    background: "#FFFFFF",
                    padding: "25px",
                    borderRadius: "18px",
                    boxShadow: "0 8px 20px rgba(0,0,0,.08)",
                    marginBottom: "35px",
                    textAlign: "center"
                }}
            >

                <h2
                    style={{
                        color: "#333",
                        marginBottom: "10px"
                    }}
                >
                    📊 Reports & Export
                </h2>


                <p
                    style={{
                        color: "#666",
                        marginBottom: "25px"
                    }}
                >
                    Download consumer attention analytics reports
                </p>


                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "12px",
                        flexWrap: "wrap"
                    }}
                >

                    {/* EXCEL REPORT */}

                    <button
                        onClick={downloadExcelReport}
                        style={{
                            background: "#1A73E8",
                            color: "white",
                            border: "none",
                            padding: "12px 24px",
                            borderRadius: "10px",
                            fontSize: "15px",
                            fontWeight: "600",
                            cursor: "pointer",
                            boxShadow:
                                "0 5px 15px rgba(26,115,232,0.25)"
                        }}
                    >
                        📥 Download Excel Report
                    </button>


                    {/* PDF REPORT */}

                    <button
                        onClick={downloadPDFReport}
                        style={{
                            background: "#6C63FF",
                            color: "white",
                            border: "none",
                            padding: "12px 24px",
                            borderRadius: "10px",
                            fontSize: "15px",
                            fontWeight: "600",
                            cursor: "pointer",
                            boxShadow:
                                "0 5px 15px rgba(108,99,255,0.25)"
                        }}
                    >
                        📄 Download PDF Report
                    </button>

                </div>

            </div>
            {/* ========================= */}
            {/* FOOTER */}
            {/* ========================= */}

            <div
                style={{
                    marginTop: "45px",
                    textAlign: "center",
                    color: "#999",
                    paddingBottom: "20px"
                }}
            >

                Powered by{" "}

                <strong>
                    YOLOv8 • ByteTrack • FastAPI • React • PostgreSQL
                </strong>

            </div>


        </div>

    );

}


export default AnalyticsDashboard;