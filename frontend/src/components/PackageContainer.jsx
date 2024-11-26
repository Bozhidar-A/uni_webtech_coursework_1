import "../css/PKG.css"

export default function PackageContainer({ pkg, HandleUpdateDeliveryStatus }) {

    return (
        <div className="parent">
            <div className="div1"><h2>{pkg.recipientName}</h2></div>
            <div className="div3"><p>{pkg.address}</p></div>
            <div className="div6"><p>Price: {pkg.deliveryPrice}</p></div>
            <div className="div7"><p>Is it delivered? - {pkg.isDelivered ? "YES" : "NO"}</p></div>
            <div className="div8"><button onClick={() => HandleUpdateDeliveryStatus(pkg)}>Update Delivery Status</button></div>
        </div>

    );
}