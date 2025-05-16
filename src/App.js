import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import GenreSelector from "./GenreSelector";
import Leaderboard from "./Leaderboard";
import Modal from "./Modal";
import ModeSwitchModal from "./ModeSwitchModal";
import GameOverModal from "./GameOverModal";
import SongStage from "./SongStage";
import StageBar from "./StageBar";
import songs from "./songs_clean.json";
import { supabase } from "./supabaseClient";

function App() {
    const [isRanked, setIsRanked] = useState(true);
    const [genres, setGenres] = useState(["Pop"]);
    const [stage, setStage] = useState(0);
    const [currentSong, setCurrentSong] = useState(null);
    const [guess, setGuess] = useState("");
    const [feedback, setFeedback] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modeSwitchModalOpen, setModeSwitchModalOpen] = useState(false);
    const [gameOverModalOpen, setGameOverModalOpen] = useState(false);
    const [lives, setLives] = useState(3);
    const [score, setScore] = useState(0);
    const [statusIndicators, setStatusIndicators] = useState(Array(7).fill("pending"));
    const [guesses, setGuesses] = useState(Array(7).fill(null));
    const [isPlaying, setIsPlaying] = useState(false);
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [audioProgress, setAudioProgress] = useState(0);
    const [selectedBoard, setSelectedBoard] = useState("daily");
    const [highestScore, setHighestScore] = useState(0);
    const [leaderboard, setLeaderboard] = useState([]);
    const [volume, setVolume] = useState(() => {
        const stored = localStorage.getItem("volume");
        return stored ? parseFloat(stored) : 0.8;
    });

    const dropdownRef = useRef(null);
    const audioRef = useRef(null);
    const progressInterval = useRef(null);

    const stages = [0.1, 0.5, 1, 2, 4, 8, 15];
    const stagePoints = [10, 8, 6, 4, 3, 2, 1];

    const allOptions = songs.map((s) => `${s.artist} - ${s.title}`);
    const isGuessValid = allOptions.includes(guess);

    const startNewSong = () => {
        const pool = isRanked ? songs : songs.filter((s) => genres.includes(s.genre));
        const random = Math.floor(Math.random() * pool.length);
        const selected = pool[random];
        const audio = new Audio(selected.preview_url);
        audio.volume = volume;
        audioRef.current = audio;
        setCurrentSong({ ...selected });
        setStage(0);
        setStatusIndicators(Array(7).fill("pending"));
        setGuesses(Array(7).fill(null));
        setGuess("");
        setFeedback(null);
        setModalOpen(false);
        setIsPlaying(false);
        setAudioProgress(0);
    };

    const stopProgress = () => {
        clearInterval(progressInterval.current);
    };

    const resetRankedGame = () => {
        setLives(3);
        setScore(0);
        startNewSong();
    };

    const normalize = (str) =>
        str.toLowerCase().replace(/[^\w\s]/gi, "").trim();

    const handlePlayPause = () => {
        const audio = audioRef.current;
        if (!audio || !currentSong) return;

        if (isPlaying) {
            audio.pause();
            stopProgress();
            setIsPlaying(false);
        } else {
            audio.currentTime = 0;
            audio.play();
            setIsPlaying(true);

            progressInterval.current = setInterval(() => {
                if (audio.ended || audio.currentTime >= stages[stage]) {
                    audio.pause();
                    setIsPlaying(false);
                    stopProgress();
                }
                setAudioProgress(audio.currentTime);
            }, 60);
        }
    };

    const handleGuess = () => {
        if (!currentSong || !isGuessValid) return;

        const expected = normalize(`${currentSong.artist} - ${currentSong.title}`);
        const isCorrect = normalize(guess) === expected;

        const newStatus = [...statusIndicators];
        const newGuesses = [...guesses];
        newStatus[stage] = isCorrect ? "✅" : "❌";
        newGuesses[stage] = guess;
        setStatusIndicators(newStatus);
        setGuesses(newGuesses);

        if (isCorrect) {
            if (isRanked) setScore((prev) => prev + stagePoints[stage]);
            setFeedback("correct");
            setModalOpen(true);
            if (audioRef.current) audioRef.current.pause();
            stopProgress();
            setIsPlaying(false);
        } else {
            if (stage === stages.length - 1) {
                if (isRanked && lives <= 1) {
                    setGameOverModalOpen(true);
                } else {
                    if (isRanked) setLives((prev) => prev - 1);
                    setFeedback("wrong");
                    setModalOpen(true);
                }
                if (audioRef.current) audioRef.current.pause();
                stopProgress();
                setIsPlaying(false);
            } else {
                setStage(stage + 1);
            }
        }
    };

    const handleSkip = () => {
        const newStatus = [...statusIndicators];
        newStatus[stage] = "SKIPPED";
        setStatusIndicators(newStatus);

        if (stage === stages.length - 1) {
            if (isRanked && lives <= 1) {
                setGameOverModalOpen(true);
            } else {
                if (isRanked) setLives((prev) => prev - 1);
                setFeedback("skipped");
                setModalOpen(true);
            }
            if (audioRef.current) audioRef.current.pause();
            stopProgress();
            setIsPlaying(false);
        } else {
            setStage(stage + 1);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setGuess(value);
        setFilteredOptions(
            allOptions.filter((option) =>
                option.toLowerCase().includes(value.toLowerCase())
            )
        );
        setDropdownVisible(true);
    };

    const handleSelect = (option) => {
        setGuess(option);
        setDropdownVisible(false);
    };

    const handleClickOutside = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
            setDropdownVisible(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        startNewSong();
        return () => stopProgress();
    }, [genres]);

    return (
        <div className="App">
            <h1>🎵 Songdog 🎵</h1>

            <div className="top-bar">
                <div className="toggle">
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={!isRanked}
                            onChange={() =>
                                setIsRanked((prev) => {
                                    if (prev) setModeSwitchModalOpen(true);
                                    else resetRankedGame();
                                    return !prev;
                                })
                            }
                        />
                        <span className="slider" />
                    </label>
                    <span>{isRanked ? "Ranked" : "Casual"}</span>
                </div>
            </div>

            {!isRanked && <GenreSelector genres={genres} setGenres={setGenres} />}
            {isRanked && <p>❤️ Lives: {lives} &nbsp;&nbsp; ⭐ Score: {score}</p>}
            {currentSong && (
                <p style={{ fontSize: "0.9rem", color: "#aaa" }}>
                    🎧 Genre: <strong>{currentSong.genre}</strong>
                </p>
            )}

            <SongStage
                stages={stages}
                currentStage={stage}
                statusIndicators={statusIndicators}
                guesses={guesses}
            />

            <StageBar duration={stages[stage]} progress={audioProgress} />

            <button className="play-button" onClick={handlePlayPause}>
                {isPlaying ? "⏸ Pause" : "▶ Play"}
            </button>

            <div className="autocomplete-wrapper" ref={dropdownRef}>
                <input
                    value={guess}
                    onChange={handleInputChange}
                    placeholder="Artist - Title"
                />
                {dropdownVisible && filteredOptions.length > 0 && (
                    <ul className="autocomplete-dropdown">
                        {filteredOptions.map((option, idx) => (
                            <li key={idx} onClick={() => handleSelect(option)}>
                                {option}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <button className="btn" onClick={handleGuess} disabled={!isGuessValid}>
                Submit
            </button>
            <button className="btn secondary" onClick={handleSkip}>
                Skip
            </button>

            {modalOpen && (
                <Modal
                    isCorrect={feedback === "correct"}
                    song={currentSong}
                    onClose={() => {
                        setModalOpen(false);
                        startNewSong();
                    }}
                />
            )}

            {modeSwitchModalOpen && (
                <ModeSwitchModal
                    onConfirm={() => {
                        setIsRanked(false);
                        setModeSwitchModalOpen(false);
                        startNewSong();
                    }}
                    onCancel={() => setModeSwitchModalOpen(false)}
                />
            )}

            {gameOverModalOpen && (
                <GameOverModal
                    score={score}
                    onSubmit={() => {
                        setGameOverModalOpen(false);
                        resetRankedGame();
                    }}
                />
            )}
        </div>
    );
}

export default App;
