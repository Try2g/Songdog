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

    const stages = [0.1, 0.5, 1, 2, 4, 8, 15];
    const stagePoints = [10, 8, 6, 4, 3, 2, 1];
    const allOptions = songs.map((s) => `${s.artist} - ${s.title}`);
    const isGuessValid = allOptions.includes(guess);

    const audioRef = useRef(null);
    const progressInterval = useRef(null);

    const normalize = (str) => str.toLowerCase().replace(/[^\w\s]/gi, "").trim();

    const stopProgress = () => clearInterval(progressInterval.current);

    const startNewSong = () => {
        const pool = isRanked ? songs : songs.filter((s) => genres.includes(s.genre));
        const selected = pool[Math.floor(Math.random() * pool.length)];
        const audio = new Audio(selected.preview_url);
        audio.volume = volume;
        audioRef.current = audio;

        setCurrentSong(selected);
        setStage(0);
        setStatusIndicators(Array(7).fill("pending"));
        setGuesses(Array(7).fill(null));
        setGuess("");
        setFeedback(null);
        setModalOpen(false);
        setIsPlaying(false);
        setAudioProgress(0);
    };

    const resetRankedGame = () => {
        setLives(3);
        setScore(0);
        startNewSong();
    };

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

    const handleInputChange = (e) => {
        setGuess(e.target.value);
        setFilteredOptions(
            allOptions.filter((option) =>
                option.toLowerCase().includes(e.target.value.toLowerCase())
            )
        );
        setDropdownVisible(true);
    };

    const handleSelect = (option) => {
        setGuess(option);
        setDropdownVisible(false);
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
        } else {
            if (stage === stages.length - 1) {
                if (isRanked && lives <= 1) {
                    setGameOverModalOpen(true);
                } else if (isRanked) {
                    setLives((prev) => prev - 1);
                    setFeedback("wrong");
                    setModalOpen(true);
                } else {
                    setFeedback("wrong");
                    setModalOpen(true);
                }
            } else {
                setStage(stage + 1);
            }
        }

        if (audioRef.current) audioRef.current.pause();
        stopProgress();
        setIsPlaying(false);
    };

    const handleSkip = () => {
        const newStatus = [...statusIndicators];
        newStatus[stage] = "SKIPPED";
        setStatusIndicators(newStatus);

        if (stage === stages.length - 1) {
            if (isRanked && lives <= 1) {
                setGameOverModalOpen(true);
            } else if (isRanked) {
                setLives((prev) => prev - 1);
                setFeedback("skipped");
                setModalOpen(true);
            } else {
                setFeedback("skipped");
                setModalOpen(true);
            }
        } else {
            setStage(stage + 1);
        }

        if (audioRef.current) audioRef.current.pause();
        stopProgress();
        setIsPlaying(false);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        startNewSong();
    };

    const confirmModeSwitch = () => {
        setIsRanked(false);
        setModeSwitchModalOpen(false);
        startNewSong();
    };

    const cancelModeSwitch = () => {
        setModeSwitchModalOpen(false);
    };

    const handleModeToggle = () => {
        if (isRanked) setModeSwitchModalOpen(true);
        else {
            setIsRanked(true);
            resetRankedGame();
        }
    };

    const submitScoreToDB = async (name, score, mode) => {
        const { error } = await supabase
            .from("leaderboard")
            .insert([{ name, score, mode }]);
        if (error) console.error("❌ Error submitting score:", error.message);
    };

    const getDateThreshold = (period) => {
        const now = new Date();
        if (period === "daily") now.setDate(now.getDate() - 1);
        if (period === "weekly") now.setDate(now.getDate() - 7);
        if (period === "monthly") now.setDate(now.getDate() - 30);
        return now.toISOString();
    };

    const fetchLeaderboardFromDB = async (period) => {
        const since = getDateThreshold(period);
        const { data, error } = await supabase
            .from("leaderboard")
            .select("*")
            .gte("created_at", since)
            .order("score", { ascending: false })
            .limit(100);
        if (error) console.error("❌ Error fetching leaderboard:", error.message);
        return data || [];
    };

    const handleGameOverSubmit = async (name) => {
        if (!name || !isRanked) return;
        await submitScoreToDB(name, score, selectedBoard);

        const best = localStorage.getItem(`highestScore_${selectedBoard}`);
        if (!best || score > Number(best)) {
            localStorage.setItem(`highestScore_${selectedBoard}`, score.toString());
            setHighestScore(score);
        }

        const updated = await fetchLeaderboardFromDB(selectedBoard);
        setLeaderboard(updated);
        setGameOverModalOpen(false);
        resetRankedGame();
    };

    const handleVolumeChange = (e) => {
        const vol = parseFloat(e.target.value);
        setVolume(vol);
        localStorage.setItem("volume", vol);
        if (audioRef.current) audioRef.current.volume = vol;
    };

    useEffect(() => {
        const stored = localStorage.getItem(`highestScore_${selectedBoard}`);
        if (stored) setHighestScore(Number(stored));
    }, [selectedBoard]);

    useEffect(() => {
        const loadLeaderboard = async () => {
            const data = await fetchLeaderboardFromDB(selectedBoard);
            setLeaderboard(data);
        };
        if (isRanked) loadLeaderboard();
    }, [selectedBoard, isRanked]);

    useEffect(() => {
        startNewSong();
        return () => stopProgress();
    }, [genres]);

    return (
        <div className="App">
            <img
                src="/logo.png"
                alt="SongDog Logo"
                style={{
                    height: "480px",
                    marginTop: "-50px",
                    marginBottom: "-50px"
                }}
            />



            <div className="top-bar">
                <div className="toggle">
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={!isRanked}
                            onChange={handleModeToggle}
                        />
                        <span className="slider" />
                    </label>
                    <span>{isRanked ? "Ranked" : "Casual"}</span>
                </div>
            </div>

            {!isRanked && <GenreSelector genres={genres} setGenres={setGenres} />}
            {isRanked && <p>❤️ Lives: {lives} &nbsp;&nbsp; ⭐ Score: {score}</p>}
            {isRanked && currentSong && (
                <p style={{ color: "#ccc", fontSize: "0.85rem", marginTop: "-0.5rem" }}>
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

            <div className="volume-control">
                🔈 <label>Volume:</label>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                />
            </div>

            <div className="autocomplete-wrapper">
                <input
                    value={guess}
                    onChange={handleInputChange}
                    onBlur={() => setTimeout(() => setDropdownVisible(false), 200)}
                    onFocus={() => {
                        if (filteredOptions.length > 0) setDropdownVisible(true);
                    }}
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
            <button className="btn secondary" onClick={handleSkip}>Skip</button>

            {isRanked && (
                <>
                    <div className="leaderboard-switch">
                        {["daily", "weekly", "monthly"].map((type) => (
                            <button
                                key={type}
                                onClick={() => setSelectedBoard(type)}
                                className={`btn ${selectedBoard === type ? "active" : ""}`}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>

                    <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#aaa" }}>
                        Your highest score ({selectedBoard}): <strong>{highestScore} pts</strong>
                    </p>

                    <Leaderboard leaderboard={leaderboard} />
                </>
            )}

            {modalOpen && (
                <>
                    <div className="backdrop" />
                    <Modal
                        isCorrect={feedback === "correct"}
                        song={currentSong}
                        onClose={handleModalClose}
                    />
                </>
            )}

            {modeSwitchModalOpen && (
                <>
                    <div className="backdrop" />
                    <ModeSwitchModal
                        onConfirm={confirmModeSwitch}
                        onCancel={cancelModeSwitch}
                    />
                </>
            )}

            {gameOverModalOpen && (
                <>
                    <div className="backdrop" />
                    <GameOverModal
                        score={score}
                        onSubmit={handleGameOverSubmit}
                        onCancel={() => {
                            setGameOverModalOpen(false);
                            resetRankedGame();
                        }}
                    />
                </>
            )}
        </div>
    );
}

export default App;
