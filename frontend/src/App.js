import {useState} from "react";

import "./styles.css";

import Login from "./Login";
import Register from "./Register";
import AddStore from "./AddStore";
import AddShelf from "./AddShelf";
import AnalyticsDashboard from "./components/AnalyticsDashboard";


function App(){

const [loggedIn,setLoggedIn]=useState(false);

const [activeTab,setActiveTab]=useState("login");

const token=localStorage.getItem("token");
const roleId = localStorage.getItem("role_id");

if(token && !loggedIn){
setLoggedIn(true);
}

return(

<>

{!loggedIn ? (

<div className="container">

<div className="card">

<h1>
Consumer Attention System
</h1>

<p className="auth-subtitle">

Welcome ✨ Please login or create an account

</p>

<div className="tabs">

<button
className="tab-btn"
onClick={()=>setActiveTab("login")}
>

Login

</button>


<button
className="tab-btn"
onClick={()=>setActiveTab("register")}
>

Register

</button>

</div>

{activeTab==="login" ?

<Login setLoggedIn={setLoggedIn}/>

:

<Register/>

}

</div>

</div>

)

:

(

<div className="dashboard">

<button
className="logout"
onClick={()=>{

localStorage.removeItem("token");

window.location.reload();

}}
>

↩ Logout

</button>

<h1 className="dashboard-title">

Store Dashboard

</h1>

<p className="dashboard-subtitle">

Manage stores and shelf zones

</p>
<p 
    style={{ 
        textAlign: "center", 
        color: "#666", 
        marginBottom: "25px", 
        fontWeight: "600" 
    }} 
> 
    Role: { 
        roleId === "1" 
            ? "Admin" 
            : roleId === "2" 
            ? "Store Manager" 
            : roleId === "3" 
            ? "Analyst" 
            : "User" 
    } 
</p>


{/* ROLE-BASED DASHBOARD */}

{roleId === "1" && (
    <div
        style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "18px",
            marginBottom: "25px",
            textAlign: "center",
            boxShadow: "0 8px 20px rgba(0,0,0,.06)"
        }}
    >
        <h2 style={{color: "#1A73E8"}}>
            🏪 Store Manager Dashboard
        </h2>

        <p>
            Monitor store traffic, shelf performance,
            recommendations and consumer attention.
        </p>
    </div>
)}


{roleId === "2" && (
    <div
        style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "18px",
            marginBottom: "25px",
            textAlign: "center",
            boxShadow: "0 8px 20px rgba(0,0,0,.06)"
        }}
    >
        <h2 style={{color: "#1A73E8"}}>
            📊 Retail Analyst Dashboard
        </h2>

        <p>
            Analyze consumer behavior, attention heatmaps
            and shopper journey analytics.
        </p>
    </div>
)}


{roleId === "3" && (
    <div
        style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "18px",
            marginBottom: "25px",
            textAlign: "center",
            boxShadow: "0 8px 20px rgba(0,0,0,.06)"
        }}
    >
        <h2 style={{color: "#1A73E8"}}>
            📢 Marketing Manager Dashboard
        </h2>

        <p>
            Monitor product visibility, engagement
            and campaign performance.
        </p>
    </div>
)}


<div className="forms">

<AddShelf/>

</div>

<div >
    <AnalyticsDashboard/>
</div>

</div>



)}

</>

)

}

export default App;