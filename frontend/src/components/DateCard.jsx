import React from "react";
import { CalendarDays } from "lucide-react";
import "../styles/Cards.css";

function DateCard() {

  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const dayName = today.toLocaleDateString("en-GB", {
    weekday: "long",
  });

  return (
    <div className="date-card">

      <div className="date-icon">
        <CalendarDays size={18} />
      </div>

      <div className="date-content">
        <h3>{formattedDate}</h3>
        <p>{dayName}</p>
      </div>

    </div>
  );
}

export default DateCard;