import { Link } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import "../css/Base.css";
import { routes } from "../../util/consts";
import Header from "../components/Header";

export default function HomePage() {
    const { authState } = useAuth();

    if (!authState.isAuthenticated) {
        return (
            <div>
                <Header />
                <h1>Home</h1>
                <h2>Please head to <Link to={routes.login}>LOGIN</Link> to access this app</h2>
            </div>
        );
    }

    return (
        <div>
            <Header />
            <h1>Home</h1>
        </div>
    );
}