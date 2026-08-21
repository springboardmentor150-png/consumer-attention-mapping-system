import { useState } from "react";

export default function StoreHeatmap({ data }) {
  const [selected, setSelected] = useState(null);

  const getColor = (score) => {
    if (score >= 80) return "#ef4444";
    if (score >= 50) return "#facc15";
    return "#22c55e";
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-5">Store Heatmap</h2>

      <div
        style={{
          position: "relative",
          width: data.layout_width,
          height: data.layout_height,
          border: "2px solid black",
          background: "#f9fafb",
        }}
      >
        {data.shelves.map((shelf) => (
          <div
            key={shelf.id}
            onClick={() => setSelected(shelf)}
            style={{
              position: "absolute",
              left: shelf.x,
              top: shelf.y,
              width: shelf.width,
              height: shelf.height,
              background: getColor(shelf.attention),
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontWeight: "bold",
              borderRadius: "10px",
              color: "white",
            }}
          >
            {shelf.name}
          </div>
        ))}
      </div>

      {selected && (
        <div className="mt-6 bg-gray-100 p-5 rounded">
          <h2 className="font-bold text-xl">{selected.name}</h2>
          <p>
            Attention Score: <b>{selected.attention}</b>
          </p>
        </div>
      )}
    </div>
  );
}
