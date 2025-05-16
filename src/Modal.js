import React from "react";
import "./Modal.css";

const Modal = ({ isCorrect, song, onClose }) => {
    const title = `${song.title?.toUpperCase()} – ${song.artist}`;
    return (
        <div className="modal">
            <div className="modal-box">
                <h2>{isCorrect ? "✅ Correct!" : "❌ Wrong!"}</h2>
                <p>
                    {isCorrect
                        ? `You guessed: ${title}`
                        : `The correct answer was: ${title}`}
                </p>
                <button onClick={onClose} className="play-button">OK</button>
            </div>
        </div>
    );
};

export default Modal;
