import { Link } from "react-router-dom";
import "../css/Header.css";
import { useAuth } from "./AuthContext";

export default function Header() {
    const { authState, Logout } = useAuth();

    return (
        <div className="header" id="myHeader">
            <div className="header-inner">
                <Link to="/">Home</Link>
                {authState.isAuthenticated ? <div className="header-inner-right">
                    <Link to="/packages">Packages</Link>
                    <button onClick={Logout}>Logout</button>
                </div> : <Link to="/login">Login</Link>}
            </div>
        </div>
    );
}