import React from "react";
import {
  Paper,
  Typography,
  Box,
  Chip,
} from "@mui/material";

const activities = [
  {
    shopper: "Shopper #12",
    action: "Viewed Shelf A",
    time: "2 mins ago",
    status: "Active",
  },
  {
    shopper: "Shopper #08",
    action: "Entered Store",
    time: "5 mins ago",
    status: "New",
  },
  {
    shopper: "Shopper #15",
    action: "Viewed Shelf C",
    time: "8 mins ago",
    status: "Active",
  },
  {
    shopper: "Shopper #06",
    action: "Exited Store",
    time: "12 mins ago",
    status: "Completed",
  },
];

const getChipColor = (status) => {
  switch (status) {
    case "Active":
      return "success";
    case "New":
      return "info";
    case "Completed":
      return "default";
    default:
      return "primary";
  }
};

const RecentActivity = () => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: "18px",
        boxShadow: "0 8px 25px rgba(0,0,0,.05)",
      }}
    >
      <Typography
        variant="h6"
        fontWeight="bold"
        mb={3}
      >
        Recent Activity
      </Typography>

      {activities.map((item, index) => (
        <Box
          key={index}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 2,
            borderBottom:
              index !== activities.length - 1
                ? "1px solid #f1f5f9"
                : "none",
          }}
        >
          <Box>
            <Typography fontWeight={600}>
              {item.shopper}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {item.action}
            </Typography>
          </Box>

          <Box
            sx={{
              textAlign: "right",
        }}
>
            <Chip
              label={item.status}
              color={getChipColor(item.status)}
              size="small"
              sx={{ mb: 1 }}
            />

            <Typography
              variant="caption"
              display="block"
            >
              {item.time}
            </Typography>
          </Box>
        </Box>
      ))}
    </Paper>
  );
};

export default RecentActivity;