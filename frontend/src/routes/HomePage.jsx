import { Link } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import "../css/Base.css";
import { routes } from "../../util/consts";

export default function HomePage() {
    const { authState, Logout, DEBUG_AUTH, REMOVE_ACCESS_TOKEN } = useAuth();

    if (!authState.isAuthenticated) {
        return (
            <div>
                <h1>Home</h1>
                <h2>Please head to <Link to={routes.login}>LOGIN</Link> to access this app</h2>
                <p>{JSON.stringify(authState)}</p>
                <button onClick={REMOVE_ACCESS_TOKEN}>REMOVE ACCESS TOKEN</button>
            </div>
        );
    }

    return (
        <div>
            <h1>Home</h1>
            <p>{JSON.stringify(authState)}</p>
            <button onClick={Logout}>LOGOUT</button>
            <button onClick={REMOVE_ACCESS_TOKEN}>REMOVE ACCESS TOKEN</button>
        </div>
    );
}