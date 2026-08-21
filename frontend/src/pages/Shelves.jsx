import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/Stores.css";

function Shelves() {

    const navigate = useNavigate();

    // Logged-in user
    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role;

    const canManage =
        role === "Admin" ||
        role === "Store Manager";

    const [zoneName, setZoneName] = useState("");
    const [storeId, setStoreId] = useState("");
    const [shelves, setShelves] = useState([]);

    useEffect(() => {

        const token = localStorage.getItem("access_token");

        if (!token) {
            navigate("/");
            return;
        }

        getShelves();

    }, [navigate]);

    const getShelves = async () => {

        try {

            const response = await api.get("/shelves");
            setShelves(response.data);

        } catch (error) {

            console.log(error);

        }

    };

    const addShelf = async () => {

        try {

            await api.post("/shelves", {
                zone_name: zoneName,
                store_id: Number(storeId)
            });

            setZoneName("");
            setStoreId("");

            getShelves();

        } catch (error) {

            console.log(error);

        }

    };

    const deleteShelf = async (shelfId) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this shelf?"
        );

        if (!confirmDelete) return;

        try {

            await api.delete(`/shelves/${shelfId}`);

            getShelves();

        } catch (error) {

            console.log(error);
            alert("Unable to delete shelf.");

        }

    };

    return (

        <div className="page">

            <div className="page-header">

                <button
                    className="back-btn"
                    onClick={() => navigate("/dashboard")}
                >
                    ← Dashboard
                </button>

                <h1>📦 Shelves</h1>

            </div>

            {canManage && (

                <div className="form-card">

                    <h2>Add Shelf</h2>

                    <input
                        type="text"
                        placeholder="Zone Name"
                        value={zoneName}
                        onChange={(e) => setZoneName(e.target.value)}
                    />

                    <input
                        type="number"
                        placeholder="Store ID"
                        value={storeId}
                        onChange={(e) => setStoreId(e.target.value)}
                    />

                    <button
                        className="primary-btn"
                        onClick={addShelf}
                    >
                        Add Shelf
                    </button>

                </div>

            )}

            <h2 className="section-title">

                {canManage
                    ? "Shelf Directory"
                    : "Available Shelves"}

            </h2>

            <div className="grid">

                {shelves.map((shelf) => (

                    <div
                        className="store-card"
                        key={shelf.id}
                    >

                        <h3>📦 {shelf.zone_name}</h3>

                        <p>🏪 Store ID: {shelf.store_id}</p>

                        {canManage && (

                            <button
                                className="delete-btn"
                                onClick={() => deleteShelf(shelf.id)}
                            >
                                🗑 Delete
                            </button>

                        )}

                    </div>

                ))}

            </div>

        </div>

    );

}

export default Shelves;
