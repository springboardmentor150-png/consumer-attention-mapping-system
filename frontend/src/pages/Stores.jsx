import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/stores.css";

function Stores() {

    const navigate = useNavigate();

    // Logged-in user
    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role;

    const canManage =
        role === "Admin" ||
        role === "Store Manager";

    const [storeName, setStoreName] = useState("");
    const [location, setLocation] = useState("");
    const [storeMetadata, setStoreMetadata] = useState("");

    const [stores, setStores] = useState([]);
    const [shelves, setShelves] = useState([]);

    const [openStore, setOpenStore] = useState(null);

    useEffect(() => {

        const token = localStorage.getItem("access_token");

        if (!token) {
            navigate("/");
            return;
        }

        getData();

    }, [navigate]);

    const getData = async () => {

        try {

            const storeResponse = await api.get("/stores");
            const shelfResponse = await api.get("/shelves");

            setStores(storeResponse.data);
            setShelves(shelfResponse.data);

        } catch (error) {

            console.log(error);

        }

    };

    const addStore = async () => {

        try {

            await api.post("/stores", {
                store_name: storeName,
                location: location,
                store_metadata: storeMetadata
            });

            setStoreName("");
            setLocation("");
            setStoreMetadata("");

            getData();

        } catch (error) {

            console.log(error);

        }

    };

    const deleteStore = async (storeId) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this store?"
        );

        if (!confirmDelete) return;

        try {

            await api.delete(`/stores/${storeId}`);

            getData();

        } catch (error) {

            console.log(error);
            alert("Unable to delete store.");

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

            </div>

            <h1 className="app-title">
                Consumer Attention Mapping System
            </h1>

            <h2 className="page-title">
                Store Management
            </h2>

            {canManage && (

                <div className="form-card">

                    <h2>Add New Store</h2>

                    <input
                        type="text"
                        placeholder="Store Name"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                    />

                    <input
                        type="text"
                        placeholder="Location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />

                    <input
                        type="text"
                        placeholder="Metadata (Optional)"
                        value={storeMetadata}
                        onChange={(e) => setStoreMetadata(e.target.value)}
                    />

                    <button
                        className="primary-btn"
                        onClick={addStore}
                    >
                        Add Store
                    </button>

                </div>

            )}

            <h2 className="section-title">
                {canManage
                    ? "Store Directory"
                    : "Available Stores"}
            </h2>

            <div className="directory">

                {stores.map((store) => (

                    <div
                        className="directory-card"
                        key={store.id}
                    >

                        <div
                            className="directory-header"
                            onClick={() =>
                                setOpenStore(
                                    openStore === store.id
                                        ? null
                                        : store.id
                                )
                            }
                        >

                            <div>

                                <h3>🏪 {store.store_name}</h3>

                                <p>📍 {store.location}</p>

                                {store.store_metadata && (
                                    <p>ℹ️ {store.store_metadata}</p>
                                )}

                                {canManage && (

                                    <button
                                        className="delete-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteStore(store.id);
                                        }}
                                    >
                                        🗑 Delete
                                    </button>

                                )}

                            </div>

                            <span>

                                {openStore === store.id
                                    ? "▲"
                                    : "▼"}

                            </span>

                        </div>

                        {openStore === store.id && (

                            <div className="directory-body">

                                <h4>Shelves</h4>

                                {shelves
                                    .filter(
                                        shelf =>
                                            shelf.store_id === store.id
                                    )
                                    .map((shelf) => (

                                        <p key={shelf.id}>
                                            • {shelf.zone_name}
                                        </p>

                                    ))}

                                {shelves.filter(
                                    shelf =>
                                        shelf.store_id === store.id
                                ).length === 0 && (

                                    <p>No shelves added yet.</p>

                                )}

                            </div>

                        )}

                    </div>

                ))}

            </div>

        </div>

    );

}

export default Stores;