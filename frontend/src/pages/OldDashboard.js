import React, { useEffect, useState } from "react";
import AttentionChart from "../components/AttentionChart";
import AttentionPieChart from "../components/AttentionPieChart";
import StatCard from "../components/StatCard";

import PeopleIcon from "@mui/icons-material/People";
import VisibilityIcon from "@mui/icons-material/Visibility";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [topShopper, setTopShopper] = useState(null);
  const [records, setRecords] = useState([]);
  const [selectedShopper, setSelectedShopper] = useState("All");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/dashboard-summary")
      .then((res) => res.json())
      .then((data) => setSummary(data))
      .catch((err) => console.error(err));

    fetch("http://127.0.0.1:8000/top-shopper")
      .then((res) => res.json())
      .then((data) => setTopShopper(data))
      .catch((err) => console.error(err));

    fetch("http://127.0.0.1:8000/attention-records")
      .then((res) => res.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error(err));
  }, []);

  const shopperIds = [
    "All",
    ...new Set(records.map((record) => record.shopper_id)),
  ];

  return (
    <div
      style={{
        padding: "30px",
        background: "#f5f5f5",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Dashboard Header */}
      <div style={{ marginBottom: "35px" }}>
        <h1
          style={{
            margin: 0,
            color: "#1976d2",
            fontWeight: "bold",
            fontSize: "36px",
          }}
        >
          📊 Consumer Attention Analytics Dashboard
        </h1>

        <p
          style={{
            color: "#666",
            marginTop: "8px",
            fontSize: "18px",
          }}
        >
          Real-Time Retail Store Consumer Insights
        </p>
      </div>

      {summary ? (
        <>
          {/* KPI Cards */}
          <div
            style={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
              justifyContent: "center",
              marginBottom: "40px",
            }}
          >
            <StatCard
              title="Total Records"
              value={summary.total_records}
              icon={<PeopleIcon fontSize="large" />}
              color="#1976d2"
            />

            <StatCard
              title="Average Attention"
              value={`${summary.average_attention.toFixed(2)} sec`}
              icon={<VisibilityIcon fontSize="large" />}
              color="#2e7d32"
            />

            <StatCard
              title="Maximum Attention"
              value={`${summary.maximum_attention.toFixed(2)} sec`}
              icon={<TrendingUpIcon fontSize="large" />}
              color="#ed6c02"
            />

            <StatCard
              title="Top Shopper"
              value={
                topShopper
                  ? `#${topShopper.shopper_id} (${topShopper.attention_duration.toFixed(
                      2
                    )} sec)`
                  : "Loading..."
              }
              icon={<EmojiEventsIcon fontSize="large" />}
              color="#9c27b0"
            />
          </div>

          {/* Charts */}
          <div
            style={{
              display: "flex",
              gap: "25px",
              flexWrap: "wrap",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                flex: 2,
                minWidth: "600px",
                background: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              }}
            >
              <AttentionChart records={records} />
            </div>

            <div
              style={{
                flex: 1,
                minWidth: "350px",
                background: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "320px",
                  height: "320px",
                }}
              >
                <AttentionPieChart records={records} />
              </div>
            </div>
          </div>

          {/* Filter */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2
              style={{
                color: "#1976d2",
                margin: 0,
              }}
            >
              Attention Records
            </h2>

            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel>Shopper</InputLabel>

              <Select
                value={selectedShopper}
                label="Shopper"
                onChange={(e) => setSelectedShopper(e.target.value)}
              >
                {shopperIds.map((id) => (
                  <MenuItem key={id} value={id}>
                    {id === "All"
                      ? "All Shoppers"
                      : `Shopper ${id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
                    {/* Material UI Table */}
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 3,
              boxShadow: 4,
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      backgroundColor: "#1976d2",
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    Shopper ID
                  </TableCell>

                  <TableCell
                    sx={{
                      backgroundColor: "#1976d2",
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    Shelf
                  </TableCell>

                  <TableCell
                    sx={{
                      backgroundColor: "#1976d2",
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    Start Time
                  </TableCell>

                  <TableCell
                    sx={{
                      backgroundColor: "#1976d2",
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    End Time
                  </TableCell>

                  <TableCell
                    sx={{
                      backgroundColor: "#1976d2",
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    Attention Duration
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {records
                  .filter(
                    (record) => record.total_attention_duration > 0
                  )
                  .filter(
                    (record) =>
                      selectedShopper === "All" ||
                      record.shopper_id === Number(selectedShopper)
                  )
                  .map((record, index) => (
                    <TableRow
                      key={record.id}
                      hover
                      sx={{
                        backgroundColor:
                          index % 2 === 0 ? "#fafafa" : "#ffffff",
                      }}
                    >
                      <TableCell>{record.shopper_id}</TableCell>

                      <TableCell>{record.shelf_id}</TableCell>

                      <TableCell>
                        {record.attention_start_time.toFixed
                          ? record.attention_start_time.toFixed(2)
                          : record.attention_start_time}
                      </TableCell>

                      <TableCell>
                        {record.attention_end_time.toFixed
                          ? record.attention_end_time.toFixed(2)
                          : record.attention_end_time}
                      </TableCell>

                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          color: "#2e7d32",
                        }}
                      >
                        {record.total_attention_duration.toFixed(2)} sec
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <h2 style={{ textAlign: "center", marginTop: "100px" }}>
          Loading Dashboard...
        </h2>
      )}
    </div>
  );
}

export default Dashboard;