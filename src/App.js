import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import GenreSelector from "./GenreSelector";
import Leaderboard from "./Leaderboard";
import Modal from "./Modal";
import ModeSwitchModal from "./ModeSwitchModal";
import GameOverModal from "./GameOverModal";
import SongStage from "./SongStage";
import StageBar from "./StageBar";
import { useTranslation } from "react-i18next";
import "./i18n";
import songs from "./songs_clean.json";
import { supabase } from "./supabaseClient";

function App() {
    const { t, i18n } = useTranslation();

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

    const stages = [0.1, 0.5, 1, 2, 4, 8, 15];
    const stagePoints = [10, 8, 6, 4, 3, 2, 1];

    const allOptions = songs.map(s => `${s.artist} - ${s.title}`);
    const isGuessValid = allOptions.includes(guess);

    const audioRef = useRef(null);
    const progressInterval = useRef(null);

    const startNewSong = () => {
        const random = Math.floor(Math.random() * songs.length);
        const selected = songs[random];
        const audio = new Audio(selected.preview_url);
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

    const normalize = str =>
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

    const submitScoreToDB = async (name, score) => {
        const { error } = await supabase
            .from("leaderboard")
            .insert([{ name, score }]);

        if (error) {
            console.error("❌ Error submitting score:", error.message);
        } else {
            console.log("✅ Score submitted to Supabase");
        }
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
        console.log("📅 Fetching scores since:", since);

        const { data, error } = await supabase
            .from("leaderboard")
            .select("*")
            .gte("created_at", since)
            .order("score", { ascending: false })
            .limit(100);

        if (error) {
            console.error("❌ Error fetching leaderboard:", error.message);
        }

        return data || [];
    };

    const handleInputChange = (e) => {
        setGuess(e.target.value);
        setFilteredOptions(
            allOptions.filter(option =>
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
            if (isRanked) setScore(prev => prev + stagePoints[stage]);
            setFeedback("correct");
            setModalOpen(true);
            if (audioRef.current) audioRef.current.pause();
            stopProgress();
            setIsPlaying(false);
        } else {
            if (stage === stages.length - 1) {
                if (lives <= 1) setGameOverModalOpen(true);
                else {
                    setLives(prev => prev - 1);
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
            if (lives <= 1) setGameOverModalOpen(true);
            else {
                setLives(prev => prev - 1);
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

    const handleGameOverSubmit = async (name) => {
        if (!name) return;

        await submitScoreToDB(name, score);

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

    useEffect(() => {
        const stored = localStorage.getItem(`highestScore_${selectedBoard}`);
        if (stored) setHighestScore(Number(stored));
    }, [selectedBoard]);

    useEffect(() => {
        const loadLeaderboard = async () => {
            const data = await fetchLeaderboardFromDB(selectedBoard);
            setLeaderboard(data);
        };
        loadLeaderboard();
    }, [selectedBoard]);

    useEffect(() => {
        startNewSong();
        return () => stopProgress();
    }, [genres]);

    return (
        <div className="App">
            <h1>🎵 Songdog 🎵</h1>

            <div className="top-bar">
                <button onClick={() => i18n.changeLanguage("en")}>EN</button>
                <button onClick={() => i18n.changeLanguage("pl")}>PL</button>

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

            <div className="autocomplete-wrapper">
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
                <Modal
                    isCorrect={feedback === "correct"}
                    song={currentSong}
                    onClose={handleModalClose}
                />
            )}

            {modeSwitchModalOpen && (
                <ModeSwitchModal
                    onConfirm={confirmModeSwitch}
                    onCancel={cancelModeSwitch}
                />
            )}

            {gameOverModalOpen && (
                <GameOverModal score={score} onSubmit={handleGameOverSubmit} />
            )}
        </div>
    );
}

export default App;
