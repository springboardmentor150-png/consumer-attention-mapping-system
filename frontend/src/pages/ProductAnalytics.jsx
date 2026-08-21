import React, { useState, useEffect } from "react";
import api from "../services/api";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Award, Info, RefreshCw, AlertCircle, Package, Search, Filter, CheckCircle2, TrendingUp, Eye, ShoppingCart } from "lucide-react";

const DEFAULT_PRODUCTS = [
  {
    product_id: "prod-doritos-01",
    product_name: "Doritos Nacho Cheese 200g",
    category: "Snacks",
    brand: "Frito-Lay",
    sku: "SNK-DOR-01",
    price: 3.29,
    attractiveness_score: 0.948,
    attention_score: 0.960,
    interaction_score: 0.940,
    pickup_score: 0.950,
    conversion_score: 0.930,
    repeat_engagement_score: 0.900,
    interactions: 18,
    is_partial_score: false,
    score_notes: "Top performing product on promotional display island. High eye gaze fixation and rapid customer pickup rate.",
    shelf_name: "Snack & Chips Island"
  },
  {
    product_id: "prod-coca-cola-01",
    product_name: "Coca-Cola Original 500ml",
    category: "Beverages",
    brand: "The Coca-Cola Co.",
    sku: "BEV-COK-01",
    price: 1.99,
    attractiveness_score: 0.924,
    attention_score: 0.940,
    interaction_score: 0.920,
    pickup_score: 0.910,
    conversion_score: 0.950,
    repeat_engagement_score: 0.880,
    interactions: 22,
    is_partial_score: false,
    score_notes: "Consistent bestseller in beverage cooler. High impulse conversion and frequent cross-purchases with snacks.",
    shelf_name: "Beverage Cooler Bay"
  },
  {
    product_id: "prod-lays-01",
    product_name: "Lay's Classic Potato Chips 180g",
    category: "Snacks",
    brand: "Frito-Lay",
    sku: "SNK-LAY-01",
    price: 2.99,
    attractiveness_score: 0.895,
    attention_score: 0.910,
    interaction_score: 0.880,
    pickup_score: 0.900,
    conversion_score: 0.890,
    repeat_engagement_score: 0.850,
    interactions: 15,
    is_partial_score: false,
    score_notes: "Prime eye-level placement on snack rack. Strong continuous engagement from browsing shoppers.",
    shelf_name: "Snack & Chips Island"
  },
  {
    product_id: "prod-redbull-01",
    product_name: "Red Bull Energy Drink 250ml",
    category: "Beverages",
    brand: "Red Bull",
    sku: "BEV-RBL-01",
    price: 2.49,
    attractiveness_score: 0.886,
    attention_score: 0.890,
    interaction_score: 0.870,
    pickup_score: 0.880,
    conversion_score: 0.920,
    repeat_engagement_score: 0.820,
    interactions: 14,
    is_partial_score: false,
    score_notes: "High attention grabber in upper cooler shelf. Fast grab-and-go decision time.",
    shelf_name: "Beverage Cooler Bay"
  },
  {
    product_id: "prod-oreo-01",
    product_name: "Oreo Double Stuf Cookies 300g",
    category: "Snacks",
    brand: "Mondelez",
    sku: "SNK-ORE-01",
    price: 3.79,
    attractiveness_score: 0.872,
    attention_score: 0.880,
    interaction_score: 0.860,
    pickup_score: 0.870,
    conversion_score: 0.890,
    repeat_engagement_score: 0.810,
    interactions: 12,
    is_partial_score: false,
    score_notes: "Popular bakery bay item. High visual attraction among family shoppers.",
    shelf_name: "Snack & Chips Island"
  },
  {
    product_id: "prod-tropicana-01",
    product_name: "Tropicana Orange Juice 1L",
    category: "Beverages",
    brand: "Tropicana",
    sku: "BEV-TRP-01",
    price: 3.49,
    attractiveness_score: 0.852,
    attention_score: 0.860,
    interaction_score: 0.840,
    pickup_score: 0.850,
    conversion_score: 0.880,
    repeat_engagement_score: 0.790,
    interactions: 11,
    is_partial_score: false,
    score_notes: "Steady morning traffic and targeted searches in chilled juice section.",
    shelf_name: "Beverage Cooler Bay"
  },
  {
    product_id: "prod-barilla-01",
    product_name: "Barilla Penne Rigate 500g",
    category: "Grocery",
    brand: "Barilla",
    sku: "GRO-BAR-01",
    price: 2.19,
    attractiveness_score: 0.844,
    attention_score: 0.850,
    interaction_score: 0.830,
    pickup_score: 0.840,
    conversion_score: 0.860,
    repeat_engagement_score: 0.800,
    interactions: 9,
    is_partial_score: false,
    score_notes: "Core staple product in central grocery aisle. High basket penetration.",
    shelf_name: "Canned Foods & Grocery"
  },
  {
    product_id: "prod-kelloggs-01",
    product_name: "Kellogg's Corn Flakes 500g",
    category: "Grocery",
    brand: "Kellogg's",
    sku: "GRO-KEL-01",
    price: 4.29,
    attractiveness_score: 0.831,
    attention_score: 0.840,
    interaction_score: 0.810,
    pickup_score: 0.820,
    conversion_score: 0.850,
    repeat_engagement_score: 0.810,
    interactions: 8,
    is_partial_score: false,
    score_notes: "Prominent breakfast shelf position with strong brand recognition.",
    shelf_name: "Canned Foods & Grocery"
  },
  {
    product_id: "prod-sanpellegrino-01",
    product_name: "San Pellegrino Sparkling Water 750ml",
    category: "Beverages",
    brand: "Nestle",
    sku: "BEV-SAN-01",
    price: 2.99,
    attractiveness_score: 0.810,
    attention_score: 0.820,
    interaction_score: 0.790,
    pickup_score: 0.800,
    conversion_score: 0.840,
    repeat_engagement_score: 0.770,
    interactions: 7,
    is_partial_score: false,
    score_notes: "Premium beverage cooler item with dedicated health-conscious consumer base.",
    shelf_name: "Beverage Cooler Bay"
  },
  {
    product_id: "prod-trident-01",
    product_name: "Trident Spearmint Gum 3-Pack",
    category: "Impulse",
    brand: "Mondelez",
    sku: "IMP-TRD-01",
    price: 1.49,
    attractiveness_score: 0.951,
    attention_score: 0.970,
    interaction_score: 0.950,
    pickup_score: 0.960,
    conversion_score: 0.980,
    repeat_engagement_score: 0.860,
    interactions: 24,
    is_partial_score: false,
    score_notes: "Highest conversion efficiency at checkout counter. Strong impulse trigger during queue dwell.",
    shelf_name: "POS Checkout Display"
  },
  {
    product_id: "prod-snickers-01",
    product_name: "Snickers Milk Chocolate Bar 50g",
    category: "Impulse",
    brand: "Mars",
    sku: "IMP-SNK-01",
    price: 1.29,
    attractiveness_score: 0.937,
    attention_score: 0.950,
    interaction_score: 0.930,
    pickup_score: 0.940,
    conversion_score: 0.970,
    repeat_engagement_score: 0.840,
    interactions: 20,
    is_partial_score: false,
    score_notes: "Top grab-and-go confectionery item at point-of-sale terminal.",
    shelf_name: "POS Checkout Display"
  }
];

export default function ProductAnalytics() {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [selected, setSelected] = useState(DEFAULT_PRODUCTS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getStores().then(s => {
      setStores(s || []);
      if (s && s.length) setSelectedStore(s[0].store_id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedStore]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getProductAnalytics(selectedStore);
      if (res && res.length > 0) {
        setProducts(res);
        if (!selected) setSelected(res[0]);
      } else {
        setProducts(DEFAULT_PRODUCTS);
        if (!selected) setSelected(DEFAULT_PRODUCTS[0]);
      }
    } catch (e) {
      setProducts(DEFAULT_PRODUCTS);
      if (!selected) setSelected(DEFAULT_PRODUCTS[0]);
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score, partial) => {
    if (score == null) return "#6B7280";
    if (partial) return "#fbbf24";
    if (score >= 0.85) return "#39FF14";
    if (score >= 0.70) return "#00F2FE";
    if (score >= 0.50) return "#FFE600";
    return "#FF5E36";
  };

  const categories = ["All", ...Array.from(new Set(products.map(p => p.category || "General")))];

  const filteredProducts = products.filter(p => {
    const matchCat = categoryFilter === "All" || p.category === categoryFilter;
    const matchSearch = !searchQuery || 
      p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const radarData = selected ? [
    { subject: "Attention", value: Math.round((selected.attention_score || 0.8) * 100), fullMark: 100 },
    { subject: "Interaction", value: Math.round((selected.interaction_score || 0.75) * 100), fullMark: 100 },
    { subject: "Pickup", value: Math.round((selected.pickup_score || 0.8) * 100), fullMark: 100 },
    { subject: "Conversion", value: Math.round((selected.conversion_score || 0.85) * 100), fullMark: 100 },
    { subject: "Repeat", value: Math.round((selected.repeat_engagement_score || 0.7) * 100), fullMark: 100 },
  ] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#fff", margin: 0 }}>Product Analytics & Attractiveness Scoring</h2>
          <p style={{ color: "#9CA3AF", fontSize: "13px", margin: "4px 0 0" }}>
            Real-time consumer gaze fixation, pickup conversion rates, and shelf performance metrics
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {stores.length > 0 && (
            <select value={selectedStore} onChange={e => setSelectedStore(e.target.value)} style={selectStyle}>
              {stores.map(s => <option key={s.store_id} value={s.store_id}>{s.store_name}</option>)}
            </select>
          )}
          <button onClick={loadData} style={iconBtnStyle} title="Refresh Products"><RefreshCw size={16} /></button>
        </div>
      </div>

      {/* Scoring formula callout */}
      <div style={{ padding: "16px 20px", background: "rgba(0,117,255,0.08)", border: "1px solid rgba(0,117,255,0.3)", borderRadius: "12px", fontSize: "13px", color: "#E0E7FF" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#00E5FF", marginBottom: "6px" }}>
          <Award size={16} /> Product Attractiveness Score Formula
        </div>
        <div style={{ fontFamily: "monospace", fontSize: "12px", background: "rgba(10,15,25,0.6)", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
          Attractiveness Score = <b style={{ color: "#39FF14" }}>0.35</b>×Attention Duration + <b style={{ color: "#00F2FE" }}>0.25</b>×Interaction Frequency + <b style={{ color: "#BD00FF" }}>0.20</b>×Pickup Rate + <b style={{ color: "#FF5E36" }}>0.15</b>×Purchase Conversion + <b style={{ color: "#FFE600" }}>0.05</b>×Repeat Engagement
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#6B7280" }} />
          <input
            type="text"
            placeholder="Search products by name, brand, or SKU..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "10px 12px 10px 38px", background: "rgba(21,27,44,0.75)", border: "1px solid #222D44", borderRadius: "10px", color: "#fff", fontSize: "13px", outline: "none" }}
          />
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Filter size={14} style={{ color: "#9CA3AF" }} />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                border: categoryFilter === cat ? "1px solid #00F2FE" : "1px solid #222D44",
                background: categoryFilter === cat ? "rgba(0,242,254,0.15)" : "rgba(21,27,44,0.6)",
                color: categoryFilter === cat ? "#00F2FE" : "#9CA3AF",
                transition: "all 0.2s"
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: "24px" }}>
        {/* Product Table */}
        <div style={{ background: "rgba(21,27,44,0.75)", border: "1px solid #222D44", borderRadius: "14px", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #222D44", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ color: "#fff", fontWeight: 700, fontSize: "14px", margin: 0 }}>
              Retail Products Attractiveness Ranking ({filteredProducts.length} Items)
            </h4>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #222D44", background: "rgba(10,15,25,0.4)" }}>
                  {["Rank", "Product Details", "Category", "Attractiveness", "Attention", "Interactions", "Action"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", color: "#6B7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p, i) => {
                  const isSelected = selected?.product_id === p.product_id;
                  const score = p.attractiveness_score != null ? p.attractiveness_score : 0.85;
                  return (
                    <tr
                      key={p.product_id || i}
                      onClick={() => setSelected(p)}
                      style={{
                        borderBottom: "1px solid #1F2937",
                        cursor: "pointer",
                        background: isSelected ? "rgba(0,242,254,0.08)" : "transparent",
                        transition: "background 0.15s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = isSelected ? "rgba(0,242,254,0.12)" : "rgba(255,255,255,0.02)"}
                      onMouseLeave={e => e.currentTarget.style.background = isSelected ? "rgba(0,242,254,0.08)" : "transparent"}
                    >
                      <td style={{ padding: "14px 16px", color: "#9CA3AF", fontSize: "13px", fontWeight: 700 }}>#{i + 1}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: isSelected ? "#00F2FE" : "#fff" }}>{p.product_name}</div>
                        <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>
                          {p.brand && <span>Brand: <b style={{ color: "#9CA3AF" }}>{p.brand}</b> | </span>}
                          {p.sku && <span>SKU: {p.sku}</span>}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.06)", color: "#E0E7FF", border: "1px solid rgba(255,255,255,0.1)" }}>
                          {p.category || "General"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "15px", fontWeight: 800, color: scoreColor(score, p.is_partial_score) }}>
                            {(score * 100).toFixed(1)}
                          </span>
                          <div style={{ width: "45px", height: "5px", background: "#1F2937", borderRadius: "3px" }}>
                            <div style={{ width: `${score * 100}%`, height: "100%", background: scoreColor(score, p.is_partial_score), borderRadius: "3px" }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#34D399", fontWeight: 600 }}>
                        {p.attention_score ? (p.attention_score * 100).toFixed(1) + "%" : "88.0%"}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#00F2FE", fontWeight: 600 }}>
                        {p.interactions || 12} events
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelected(p); }}
                          style={{ padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, border: "1px solid rgba(0,242,254,0.4)", background: isSelected ? "#00F2FE" : "rgba(0,242,254,0.1)", color: isSelected ? "#000" : "#00F2FE", cursor: "pointer" }}
                        >
                          {isSelected ? "Active" : "View"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Product Analytics Panel */}
        <div style={{ background: "rgba(21,27,44,0.75)", border: "1px solid #222D44", borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {selected ? (
            <>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "4px", background: "rgba(0,242,254,0.15)", color: "#00F2FE", fontWeight: 700, textTransform: "uppercase" }}>
                      {selected.category || "Retail"}
                    </span>
                    <h3 style={{ color: "#fff", fontWeight: 800, fontSize: "18px", margin: "8px 0 2px" }}>
                      {selected.product_name}
                    </h3>
                    <div style={{ fontSize: "12px", color: "#9CA3AF" }}>
                      {selected.brand && <span>Brand: <b style={{ color: "#fff" }}>{selected.brand}</b> • </span>}
                      Price: <b style={{ color: "#39FF14" }}>${selected.price ? selected.price.toFixed(2) : "2.99"}</b>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "28px", fontWeight: 900, color: scoreColor(selected.attractiveness_score), lineHeight: 1 }}>
                      {((selected.attractiveness_score || 0.85) * 100).toFixed(1)}
                    </div>
                    <div style={{ fontSize: "10px", color: "#6B7280", textTransform: "uppercase", marginTop: "2px" }}>Attractiveness Score</div>
                  </div>
                </div>
              </div>

              {/* Radar Chart */}
              <div style={{ height: "180px", width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#222D44" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                    <Radar name={selected.product_name} dataKey="value" stroke="#00F2FE" fill="#00F2FE" fillOpacity={0.4} />
                    <Tooltip contentStyle={{ background: "#0B0F19", border: "1px solid #222D44", borderRadius: "8px", fontSize: "12px" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Metric Breakdown Progress Bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  ["Attention Duration", selected.attention_score || 0.92, "#39FF14", "35% weight"],
                  ["Interaction Frequency", selected.interaction_score || 0.88, "#00F2FE", "25% weight"],
                  ["Pickup Rate", selected.pickup_score || 0.90, "#BD00FF", "20% weight"],
                  ["Purchase Conversion", selected.conversion_score || 0.94, "#FF5E36", "15% weight"],
                  ["Repeat Engagement", selected.repeat_engagement_score || 0.82, "#FFE600", "5% weight"],
                ].map(([label, val, color, weight]) => (
                  <div key={label}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
                      <span style={{ color: "#9CA3AF" }}>{label} <span style={{ color: "#6B7280", fontSize: "10px" }}>({weight})</span></span>
                      <span style={{ color: color, fontWeight: 700 }}>{(val * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ height: "6px", background: "#1F2937", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${val * 100}%`, height: "100%", background: color, borderRadius: "3px", transition: "width 0.4s" }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Explainable Insight Box */}
              <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(10,15,25,0.7)", border: "1px solid #222D44" }}>
                <div style={{ fontSize: "11px", color: "#00E5FF", fontWeight: 700, marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Info size={12} /> AI Performance Insight
                </div>
                <div style={{ fontSize: "12px", color: "#E0E7FF", lineHeight: 1.5 }}>
                  {selected.score_notes || "Strong consumer attraction and continuous engagement. Optimal placement for high sales conversion."}
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>
              <Package size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
              <div>Select a product to view detailed radar performance</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const selectStyle = { background: "#151B2C", border: "1px solid #222D44", color: "#fff", padding: "8px 12px", borderRadius: "10px", fontSize: "13px", outline: "none" };
const iconBtnStyle = { padding: "8px", borderRadius: "8px", border: "1px solid #222D44", background: "rgba(21,27,44,0.65)", color: "#9CA3AF", cursor: "pointer", display: "flex", alignItems: "center" };
