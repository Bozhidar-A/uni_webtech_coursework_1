import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import FadeLoader from "react-spinners/FadeLoader";
import "../css/Spinner.css";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { Login } = useAuth();
    const navigate = useNavigate();

    const HandleLoginForm = async (e) => {
        e.preventDefault();
        setLoading(true);

        const success = await Login(username, password);
        if (success) {
            setLoading(false);
            navigate("/");
        } else {
            setLoading(false);
            alert("Login failed. Please try again.");
        }
    };

    return (
        <div>
            <h1>Login</h1>
            <form onSubmit={HandleLoginForm}>
                <input
                    type="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                />
                <button type="submit">Login</button>
            </form>
            {loading ? <div className={"spinner-container"}>
                <FadeLoader color="#36d7b7" />
            </div> : null}
        </div>

    );
}
