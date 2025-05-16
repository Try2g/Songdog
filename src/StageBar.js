import React from "react";

export default function StageBar({ duration, progress }) {
    return (
        <div style={{ width: "80%", margin: "1rem auto" }}>
            <div style={{ background: "#444", height: "10px", borderRadius: "5px", overflow: "hidden" }}>
                <div
                    style={{
                        width: `${(progress / duration) * 100}%`,
                        background: "#00d084",
                        height: "100%",
                        transition: "width 0.05s linear",
                    }}
                />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                <span>0:00</span>
                <span>0:{duration < 10 ? `0${duration}` : duration}</span>
            </div>
        </div>
    );
}
