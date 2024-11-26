import { useEffect, useState } from "react";
import API_OBJ from "../../util/axiosInstance";
import { routes } from "../../util/consts";
import PackageContainer from "../components/PackageContainer";

export default function PackagesPage() {
    const [packages, setPackages] = useState([]);

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const res = await API_OBJ.get("/packages");
                console.log(res.data);
                setPackages(res.data);
            } catch (error) {
                console.error("Failed to fetch packages:", error);
            }
        };
        fetchPackages();
    }, []);

    async function HandleUpdateDeliveryStatus(pkg) {
        try {
            var res = await API_OBJ.post(routes.packageDeliveryStatusUpdate, { packageID: pkg.id, isDelivered: !pkg.isDelivered });
            console.log(res.data);

            if (res.status === 200) {
                const updatedPackages = packages.map((p) => {
                    if (p.id === pkg.id) {
                        return { ...p, isDelivered: !p.isDelivered };
                    }
                    return p;
                });
                setPackages(updatedPackages);
            }


        } catch (error) {
            console.error("Failed to update delivery status:", error);
        }
    }

    return (
        <div>
            <h1>Packages</h1>
            <ul>
                {packages.map((pkg) => (
                    <PackageContainer key={pkg.id} pkg={pkg} HandleUpdateDeliveryStatus={HandleUpdateDeliveryStatus} />
                ))}
            </ul>
        </div>
    );
}