import React from "react";
import "./GenreSelector.css";

const GenreSelector = ({ genres, setGenres }) => {
    const allGenres = [
        "Pop", "Rock", "Hip-Hop", "R&B", "Soul", "Funk", "Funk Pop", "Disco",
        "Electronic", "Indie Electronic", "Indie Pop", "Alternative", "Alternative Rock",
        "Alternative Hip-Hop", "Hard Rock", "Grunge", "New Wave", "Pop Rock",
        "Pop Rap", "Adult Contemporary", "Blue-Eyed Soul"
    ];

    const toggleGenre = (genre) => {
        const isSelected = genres.includes(genre);

        // Prevent removing the last genre
        if (isSelected && genres.length === 1) return;

        if (isSelected) {
            setGenres(genres.filter((g) => g !== genre));
        } else {
            setGenres([...genres, genre]);
        }
    };

    return (
        <div className="genre-selector">
            <h2>Select Genres:</h2>
            <div className="genre-buttons">
                {allGenres.map((genre) => (
                    <button
                        key={genre}
                        className={`genre-button ${genres.includes(genre) ? "selected" : ""}`}
                        onClick={() => toggleGenre(genre)}
                    >
                        {genre}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default GenreSelector;
