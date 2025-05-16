import React from "react";
import "./Leaderboard.css";

const Leaderboard = ({ leaderboard }) => {
    return (
        <div className="leaderboard">
            <h2>🏆 Leaderboard</h2>

            {leaderboard && leaderboard.length > 0 ? (
                <ul>
                    {leaderboard.map((entry, idx) => (
                        <li key={entry.id || idx}>
                            <span>{idx + 1}.</span>
                            <span>{entry.name}</span>
                            <span>{entry.score} pts</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No scores yet</p>
            )}
        </div>
    );
};

export default Leaderboard;
