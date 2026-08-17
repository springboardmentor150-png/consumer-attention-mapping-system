import { useState } from "react";
import axios from "axios";

function Login({ setLoggedIn }) {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {

        if (!email || !password) {
            alert("Please enter email and password");
            return;
        }

        try {

            setLoading(true);

            const response = await axios.post(
                "http://127.0.0.1:8000/login",
                {
                    email: email,
                    password: password
                }
            );

            // -----------------------------
            // Get login response
            // -----------------------------

            const token = response.data.access_token;
            const roleId = response.data.role_id;

            // -----------------------------
            // Save authentication data
            // -----------------------------

            localStorage.setItem(
                "token",
                token
            );

            localStorage.setItem(
                "role_id",
                roleId
            );

            console.log("Login successful");
            console.log("Role ID:", roleId);

            // -----------------------------
            // Open dashboard
            // -----------------------------

            setLoggedIn(true);

        }

        catch (error) {

            console.error(
                "Login error:",
                error
            );

            if (error.response) {

                alert(
                    error.response.data.detail ||
                    "Login failed"
                );

            } else {

                alert(
                    "Cannot connect to backend"
                );

            }

        }

        finally {

            setLoading(false);

        }

    };


    return (

        <div className="card">

            <h2
                style={{
                    textAlign: "center",
                    marginBottom: "20px",
                    color: "#443b64"
                }}
            >
                💫 Welcome Back
            </h2>


            {/* Email */}

            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) =>
                    setEmail(e.target.value)
                }
            />


            {/* Password */}

            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) =>
                    setPassword(e.target.value)
                }
            />


            {/* Login Button */}

            <button
                className="main-btn"
                onClick={handleLogin}
                disabled={loading}
            >

                {loading
                    ? "Logging in..."
                    : "Login"
                }

            </button>

        </div>

    );

}

export default Login;