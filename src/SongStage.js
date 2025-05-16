import React from "react";

const statusStyles = {
    SKIPPED: {
        bg: "#7f8c8d",
        icon: "→",
        label: "SKIPPED"
    },
    "❌": {
        bg: "#e74c3c",
        icon: "✖"
    },
    "✅": {
        bg: "#2ecc71",
        icon: "✓",
        label: "CORRECT"
    },
    pending: {
        bg: "#1c1c1c",
        icon: "",
        label: ""
    }
};

export default function SongStage({ stages, currentStage, statusIndicators, guesses }) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                marginTop: "2rem"
            }}
        >
            {stages.map((_, i) => {
                const status = statusIndicators[i];
                const { bg, icon, label } = statusStyles[status] || statusStyles["pending"];
                const isWrong = status === "❌";
                const userGuess = guesses?.[i];

                return (
                    <div
                        key={i}
                        style={{
                            width: "320px",
                            height: "48px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: isWrong ? "space-between" : "center",
                            padding: "0 1rem",
                            borderRadius: "6px",
                            fontWeight: "bold",
                            fontSize: "0.9rem",
                            backgroundColor: bg,
                            color: "#fff",
                            border: i === currentStage ? "2px solid #f1c40f" : "none"
                        }}
                    >
                        {isWrong ? (
                            <>
                                <span>{icon}</span>
                                <span style={{ flexGrow: 1, textAlign: "center" }}>
                                    {userGuess || "Incorrect"}
                                </span>
                            </>
                        ) : (
                            <>
                                {icon && <span>{icon}</span>}
                                {label && <span style={{ marginLeft: "0.5rem" }}>{label}</span>}
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
