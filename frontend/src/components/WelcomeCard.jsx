import React from "react";
import DateCard from "./DateCard";
import "../styles/Cards.css";

function WelcomeCard() {
  return (
    <div className="welcome-container">
      <div className="welcome-text">
        <h1>Welcome back, Store Manager! 👋</h1>
        <p>Here's what's happening in your stores today.</p>
      </div>

      <DateCard />
    </div>
  );
}

export default WelcomeCard;