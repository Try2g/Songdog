import React from "react";
import "./Modal.css";

const ModeSwitchModal = ({ onConfirm, onCancel }) => {
    return (
        <div className="modal">
            <div className="modal-box">
                <h3>Are you sure you want to leave your ranked game?</h3>
                <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "1rem" }}>
                    <button className="btn secondary" onClick={onCancel}>No</button>
                    <button className="btn" onClick={onConfirm}>Yes</button>
                </div>
            </div>
        </div>
    );
};

export default ModeSwitchModal;
