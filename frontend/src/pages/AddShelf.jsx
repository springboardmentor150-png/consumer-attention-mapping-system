import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/shelf.css";

const AddShelf = () => {
  const [shelf, setShelf] = useState({
    shelfName: "",
    store: "",
    location: "",
    camera: "",
    status: "Active",
  });

  const handleChange = (e) => {
    setShelf({
      ...shelf,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    alert("Shelf Added Successfully!");

    setShelf({
      shelfName: "",
      store: "",
      location: "",
      camera: "",
      status: "Active",
    });
  };

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="dashboard-content">
        <Navbar />

        <div className="page-header">
          <h2>Shelf Management</h2>
          <p>Add and manage shelves in your retail stores.</p>
        </div>

        <div className="store-card">

          <h4>Add New Shelf</h4>

          <form onSubmit={handleSubmit}>

            <div className="mb-3">
              <label>Shelf Name</label>
              <input
                type="text"
                className="form-control"
                name="shelfName"
                value={shelf.shelfName}
                onChange={handleChange}
                placeholder="Enter Shelf Name"
                required
              />
            </div>

            <div className="row">

              <div className="col-md-6 mb-3">
                <label>Select Store</label>

                <select
                  className="form-control"
                  name="store"
                  value={shelf.store}
                  onChange={handleChange}
                >
                  <option value="">Choose Store</option>
                  <option>Store 1</option>
                  <option>Store 2</option>
                  <option>Store 3</option>
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label>Assign Camera</label>

                <select
                  className="form-control"
                  name="camera"
                  value={shelf.camera}
                  onChange={handleChange}
                >
                  <option value="">Choose Camera</option>
                  <option>Camera 1</option>
                  <option>Camera 2</option>
                  <option>Camera 3</option>
                </select>
              </div>

            </div>

            <div className="mb-3">
              <label>Shelf Location</label>

              <input
                type="text"
                className="form-control"
                name="location"
                value={shelf.location}
                onChange={handleChange}
                placeholder="Example: Aisle 5"
              />
            </div>

            <div className="mb-4">
              <label>Status</label>

              <select
                className="form-control"
                name="status"
                value={shelf.status}
                onChange={handleChange}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

            <button className="btn btn-success">
              Save Shelf
            </button>

          </form>

        </div>
      </div>
    </div>
  );
};

export default AddShelf;