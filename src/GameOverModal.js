import React, { useState } from "react";
import "./Modal.css";

function GameOverModal({ score, onSubmit }) {
    const [name, setName] = useState("");

    const handleSubmit = () => {
        if (name.trim()) {
            onSubmit(name.trim());
        }
    };

    const handleCancel = () => {
        onSubmit(null); // przekazujemy null, by zasygnalizować anulowanie
    };

    return (
        <div className="modal-overlay">
            <div className="modal game-over">
                <h2>Game Over</h2>
                <p>Your score: <strong>{score}</strong></p>
                <p>Enter your nickname to save your score:</p>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your nickname"
                />
                <div className="modal-buttons">
                    <button onClick={handleSubmit} className="btn">
                        Submit
                    </button>
                    <button onClick={handleCancel} className="btn secondary">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GameOverModal;
