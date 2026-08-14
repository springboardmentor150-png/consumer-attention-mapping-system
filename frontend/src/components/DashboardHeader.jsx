import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { CalendarMonth } from "@mui/icons-material";

const DashboardHeader = () => {
  return (
    <Box
      sx={{
        background: "#ffffff",
        borderRadius: "18px",
        p: 4,
        mb: 3,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 8px 25px rgba(0,0,0,0.05)",
      }}
    >
      <Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          👋 Welcome Back, Admin
        </Typography>

        <Typography
          sx={{
            mt: 1,
            color: "#64748b",
            fontSize: "16px",
          }}
        >
          Monitor shopper attention and retail analytics in real time.
        </Typography>
      </Box>

      <Button
        variant="outlined"
        startIcon={<CalendarMonth />}
        sx={{
          borderRadius: "12px",
          textTransform: "none",
          px: 3,
        }}
      >
        Today
      </Button>
    </Box>
  );
};

export default DashboardHeader;