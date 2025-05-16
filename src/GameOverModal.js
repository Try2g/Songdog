import React, { useState } from "react";
import "./Modal.css";

const GameOverModal = ({ score, onSubmit }) => {
    const [name, setName] = useState("");

    const handleSubmit = () => {
        if (name.trim()) {
            onSubmit(name.trim());
        }
    };

    return (
        <div className="modal">
            <div className="modal-box">
                <h2>🎉 Game Over</h2>
                <p>You scored: <strong>{score}</strong> points</p>
                <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{
                        marginTop: "1rem",
                        padding: "0.5rem",
                        borderRadius: "5px",
                        border: "none",
                        width: "80%"
                    }}
                />
                <button
                    className="play-button"
                    style={{ marginTop: "1rem" }}
                    onClick={handleSubmit}
                >
                    Submit Score
                </button>
            </div>
        </div>
    );
};

export default GameOverModal;
