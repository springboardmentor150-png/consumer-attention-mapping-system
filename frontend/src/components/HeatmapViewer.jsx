import React from "react";
import { getHeatmap } from "../services/api";

function HeatmapViewer() {

    return (

        <div>

            <h2>Store Heatmap</h2>

            <img
                src={getHeatmap()}
                alt="Store Heatmap"
                style={{
                    width: "100%",
                    borderRadius: "10px"
                }}
            />

        </div>

    );
}

export default HeatmapViewer;