import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/store.css";

const AddStore = () => {
  const [store, setStore] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
  });

  const handleChange = (e) => {
    setStore({
      ...store,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    alert("Store added successfully!");

    setStore({
      name: "",
      address: "",
      city: "",
      state: "",
    });
  };

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="dashboard-content">
        <Navbar />

        <div className="page-header">
          <h2>Store Management</h2>
          <p>Add and manage retail store information.</p>
        </div>

        <div className="store-card">
          <h4>Add New Store</h4>

          <form onSubmit={handleSubmit}>

            <div className="mb-3">
              <label>Store Name</label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={store.name}
                onChange={handleChange}
                placeholder="Enter Store Name"
                required
              />
            </div>

            <div className="mb-3">
              <label>Address</label>
              <textarea
                className="form-control"
                rows="3"
                name="address"
                value={store.address}
                onChange={handleChange}
                placeholder="Enter Store Address"
                required
              />
            </div>

            <div className="row">

              <div className="col-md-6 mb-3">
                <label>City</label>
                <input
                  type="text"
                  className="form-control"
                  name="city"
                  value={store.city}
                  onChange={handleChange}
                  placeholder="City"
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label>State</label>
                <input
                  type="text"
                  className="form-control"
                  name="state"
                  value={store.state}
                  onChange={handleChange}
                  placeholder="State"
                  required
                />
              </div>

            </div>

            <button className="btn btn-success">
              Save Store
            </button>

          </form>
        </div>

      </div>
    </div>
  );
};

export default AddStore;