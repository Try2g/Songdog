import React, { useEffect, useState } from "react";
import songs from "./songs_clean.json";
import "./GenreSelector.css";

function GenreSelector({ genres, setGenres }) {
    const [availableGenres, setAvailableGenres] = useState([]);

    useEffect(() => {
        const genreSet = new Set();
        songs.forEach(song => {
            if (song.genre && song.genre.trim()) {
                genreSet.add(song.genre.trim());
            }
        });
        const sorted = Array.from(genreSet).sort((a, b) => a.localeCompare(b));
        setAvailableGenres(sorted);
    }, []);

    const toggleGenre = (genre) => {
        if (genres.includes(genre)) {
            setGenres(genres.filter(g => g !== genre));
        } else {
            setGenres([...genres, genre]);
        }
    };

    return (
        <div className="genre-selector">
            {availableGenres.map((genre, idx) => (
                <button
                    key={idx}
                    className={genres.includes(genre) ? "btn active" : "btn"}
                    onClick={() => toggleGenre(genre)}
                >
                    {genre}
                </button>
            ))}
        </div>
    );
}

export default GenreSelector;
