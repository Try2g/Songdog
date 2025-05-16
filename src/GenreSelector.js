import React from "react";
import "./GenreSelector.css";

const allGenres = ["Pop", "Rock", "Electronic", "Hip-Hop", "R&B/Soul", "Afrobeats", "Dance", "Alternative", "Instrumental", "Country"];

const GenreSelector = ({ genres, setGenres }) => {
    const toggleGenre = (genre) => {
        if (genres.includes(genre)) {
            setGenres(genres.filter((g) => g !== genre));
        } else {
            setGenres([...genres, genre]);
        }
    };

    return (
        <div className="genre-selector">
            <button onClick={() => setGenres(allGenres)} className="play-button">All</button>
            {allGenres.map((genre) => (
                <label key={genre}>
                    <input
                        type="checkbox"
                        checked={genres.includes(genre)}
                        onChange={() => toggleGenre(genre)}
                    />
                    {genre}
                </label>
            ))}
        </div>
    );
};

export default GenreSelector;
