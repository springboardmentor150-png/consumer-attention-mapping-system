import React, { useEffect, useState } from "react";

import {
  Store,
  Package,
  Camera,
  Users,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import WelcomeCard from "../components/WelcomeCard";
import StatCard from "../components/StatCard";
import SystemOverview from "../components/SystemOverview";
import QuickActions from "../components/QuickActions";
import RecentActivity from "../components/RecentActivity";
import AttentionChart from "../components/AttentionChart";
import BehaviorTable from "../components/BehaviorTable";
import HeatmapViewer from "../components/HeatmapViewer";

import { getProductRecommendations } from "../services/api";

import "../styles/Dashboard.css";


function Dashboard() {

  const [recommendations, setRecommendations] = useState([]);

  const [recommendationsLoading, setRecommendationsLoading] =
    useState(true);

  const [recommendationsError, setRecommendationsError] =
    useState("");


  // =====================================================
  // LOAD PRODUCT RECOMMENDATIONS
  // =====================================================

  const loadRecommendations = async () => {

    try {

      setRecommendationsLoading(true);

      setRecommendationsError("");

      const data = await getProductRecommendations();

      setRecommendations(
        data.recommendations || []
      );

    } catch (error) {

      console.error(
        "Failed to load product recommendations:",
        error
      );

      setRecommendationsError(
        "Unable to load product recommendations."
      );

    } finally {

      setRecommendationsLoading(false);

    }
  };


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    loadRecommendations();

  }, []);


  // =====================================================
  // DATE
  // =====================================================

  const today = new Date();

  const formattedDate =
    today.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });


  const dayName =
    today.toLocaleDateString("en-GB", {
      weekday: "long",
    });


  // =====================================================
  // DASHBOARD
  // =====================================================

  return (

    <div className="dashboard-container">


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <Sidebar />


      {/* =================================================
          MAIN WRAPPER
      ================================================= */}

      <div className="main-wrapper">


        {/* =================================================
            NAVBAR
        ================================================= */}

        <Navbar />


        {/* =================================================
            DASHBOARD CONTENT
        ================================================= */}

        <div className="dashboard-content">


          {/* =================================================
              WELCOME CARD
          ================================================= */}

          <WelcomeCard
            date={formattedDate}
            day={dayName}
          />


          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="stats-grid">


            <StatCard
              icon={<Store size={34} />}
              title="Stores"
              value="3"
              subtitle="View all"
              color="#2563EB"
            />


            <StatCard
              icon={<Package size={34} />}
              title="Shelves"
              value="4"
              subtitle="View all"
              color="#22C55E"
            />


            <StatCard
              icon={<Camera size={34} />}
              title="Cameras"
              value="5"
              subtitle="View all"
              color="#F59E0B"
            />


            <StatCard
              icon={<Users size={34} />}
              title="Visitors Today"
              value="128"
              subtitle="View Details"
              color="#8B5CF6"
            />

          </div>


          {/* =================================================
              SYSTEM OVERVIEW + QUICK ACTIONS
          ================================================= */}

          <div className="double-grid">

            <SystemOverview />

            <QuickActions />

          </div>


          {/* =================================================
              RECENT ACTIVITY
          ================================================= */}

          <RecentActivity />


          {/* =================================================
              SHOPPER BEHAVIOR
          ================================================= */}

          <BehaviorTable />


          {/* =================================================
              HEATMAP
          ================================================= */}

          <HeatmapViewer />


          {/* =================================================
              AI ATTENTION ANALYTICS
          ================================================= */}

          <AttentionChart />


          {/* =================================================
              PRODUCT RECOMMENDATIONS
          ================================================= */}

          <div
            style={{
              marginTop: "24px",
              background: "#FFFFFF",
              borderRadius: "12px",
              padding: "24px",
              boxShadow:
                "0 2px 10px rgba(0,0,0,0.06)",
            }}
          >


            {/* =================================================
                HEADER
            ================================================= */}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >

              <div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: "700",
                  }}
                >
                  Product Recommendations
                </h2>


                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#6B7280",
                    fontSize: "14px",
                  }}
                >
                  AI-generated shelf optimization
                  suggestions
                </p>

              </div>


              {/* Refresh */}

              <button
                onClick={loadRecommendations}
                disabled={recommendationsLoading}
                style={{
                  border: "none",
                  background: "#EFF6FF",
                  color: "#2563EB",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  cursor:
                    recommendationsLoading
                      ? "not-allowed"
                      : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >

                <RefreshCw size={16} />

                Refresh

              </button>

            </div>


            {/* =================================================
                LOADING
            ================================================= */}

            {recommendationsLoading && (

              <div
                style={{
                  padding: "30px",
                  textAlign: "center",
                  color: "#6B7280",
                }}
              >
                Loading recommendations...
              </div>

            )}


            {/* =================================================
                ERROR
            ================================================= */}

            {recommendationsError && (

              <div
                style={{
                  padding: "16px",
                  background: "#FEF2F2",
                  color: "#DC2626",
                  borderRadius: "8px",
                }}
              >
                {recommendationsError}
              </div>

            )}


            {/* =================================================
                NO RECOMMENDATIONS
            ================================================= */}

            {!recommendationsLoading &&
              !recommendationsError &&
              recommendations.length === 0 && (

                <div
                  style={{
                    padding: "30px",
                    textAlign: "center",
                    color: "#6B7280",
                  }}
                >
                  No product recommendations
                  available.
                </div>

              )}


            {/* =================================================
                RECOMMENDATION CARDS
            ================================================= */}

            {!recommendationsLoading &&
              !recommendationsError &&
              recommendations.map(
                (item, index) => {

                  const hasHighPriority =
                    item.recommendations?.some(
                      (recommendation) =>
                        recommendation.priority ===
                        "high"
                    );


                  return (

                    <div
                      key={`${item.shelf_name}-${index}`}
                      style={{
                        border:
                          "1px solid #E5E7EB",
                        borderRadius: "10px",
                        padding: "18px",
                        marginBottom:
                          index ===
                          recommendations.length - 1
                            ? "0"
                            : "14px",
                      }}
                    >


                      {/* Shelf Header */}

                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems: "center",
                          marginBottom: "12px",
                        }}
                      >

                        <div>

                          <h3
                            style={{
                              margin: 0,
                              fontSize: "16px",
                              fontWeight: "700",
                            }}
                          >
                            {item.shelf_name}
                          </h3>


                          <span
                            style={{
                              fontSize: "13px",
                              color: "#6B7280",
                            }}
                          >

                            Attractiveness Score:{" "}

                            <strong>
                              {Number(
                                item.attractiveness_score ||
                                0
                              ).toFixed(2)}
                            </strong>

                          </span>

                        </div>


                        {/* Priority */}

                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "700",
                            padding: "6px 10px",
                            borderRadius: "20px",
                            background:
                              hasHighPriority
                                ? "#FEE2E2"
                                : "#ECFDF5",
                            color:
                              hasHighPriority
                                ? "#DC2626"
                                : "#16A34A",
                          }}
                        >

                          {hasHighPriority
                            ? "HIGH PRIORITY"
                            : "NORMAL"}

                        </span>

                      </div>


                      {/* Attention */}

                      <div
                        style={{
                          fontSize: "13px",
                          color: "#6B7280",
                          marginBottom: "12px",
                        }}
                      >

                        Attention:{" "}

                        <strong>

                          {Number(
                            item.attention_percentage ||
                            0
                          ).toFixed(2)}

                          %

                        </strong>

                      </div>


                      {/* Recommendations */}

                      {item.recommendations?.map(
                        (
                          recommendation,
                          recommendationIndex
                        ) => (

                          <div
                            key={
                              recommendationIndex
                            }
                            style={{
                              display: "flex",
                              gap: "10px",
                              alignItems:
                                "flex-start",
                              background:
                                recommendation.priority ===
                                "high"
                                  ? "#FFF7ED"
                                  : "#F9FAFB",
                              borderRadius: "8px",
                              padding: "12px",
                              marginBottom:
                                recommendationIndex ===
                                item.recommendations
                                  .length - 1
                                  ? "0"
                                  : "8px",
                            }}
                          >


                            {/* Icon */}

                            {recommendation.priority ===
                            "high" ? (

                              <AlertTriangle
                                size={20}
                                color="#EA580C"
                              />

                            ) : (

                              <CheckCircle
                                size={20}
                                color="#16A34A"
                              />

                            )}


                            {/* Text */}

                            <div>

                              <div
                                style={{
                                  fontWeight: "600",
                                  fontSize: "13px",
                                  marginBottom: "4px",
                                  textTransform:
                                    "uppercase",
                                }}
                              >

                                {recommendation.type
                                  ?.replaceAll(
                                    "_",
                                    " "
                                  )}

                              </div>


                              <div
                                style={{
                                  fontSize: "14px",
                                  color: "#374151",
                                  lineHeight: "1.5",
                                }}
                              >

                                {
                                  recommendation.message
                                }

                              </div>

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  );

                }
              )}

          </div>

        </div>

      </div>

    </div>
  );
}


export default Dashboard;