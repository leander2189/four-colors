/**
 * Four Colors - Leaderboard Module
 * Handles server communication and local storage for scores
 */

const Leaderboard = (function() {
    const API_URL = '/api';
    const STORAGE_KEY_NICKNAME = 'fourcolors_nickname';
    const STORAGE_KEY_RECENT = 'fourcolors_recent_games';
    const MAX_RECENT_GAMES = 10;

    // Nickname management
    function getNickname() {
        return localStorage.getItem(STORAGE_KEY_NICKNAME) || '';
    }

    function setNickname(name) {
        localStorage.setItem(STORAGE_KEY_NICKNAME, name.trim().substring(0, 20));
    }

    function hasNickname() {
        return getNickname().length > 0;
    }

    // Recent games (localStorage)
    function getRecentGames() {
        try {
            const data = localStorage.getItem(STORAGE_KEY_RECENT);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    function saveRecentGame(mode, time) {
        const games = getRecentGames();
        games.unshift({
            mode: mode,
            time: time,
            date: new Date().toISOString()
        });

        // Keep only last N games
        while (games.length > MAX_RECENT_GAMES) {
            games.pop();
        }

        localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(games));
    }

    // Server API calls
    async function fetchLeaderboard(mode) {
        try {
            const response = await fetch(`${API_URL}/leaderboard/${mode}`);
            if (!response.ok) throw new Error('Failed to fetch leaderboard');
            return await response.json();
        } catch (e) {
            console.error('Leaderboard fetch error:', e);
            return null;
        }
    }

    async function submitScore(playerName, mode, time) {
        try {
            const response = await fetch(`${API_URL}/scores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_name: playerName,
                    mode: mode,
                    time_seconds: time
                })
            });

            if (!response.ok) throw new Error('Failed to submit score');
            return await response.json();
        } catch (e) {
            console.error('Score submit error:', e);
            return null;
        }
    }

    // Format time for display
    function formatTime(seconds) {
        return seconds.toFixed(1) + ' s';
    }

    // Format date for display
    function formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString();
    }

    // Get mode display name
    function getModeDisplay(mode) {
        const names = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
        return names[mode] || mode;
    }

    // Public API
    return {
        getNickname,
        setNickname,
        hasNickname,
        getRecentGames,
        saveRecentGame,
        fetchLeaderboard,
        submitScore,
        formatTime,
        formatDate,
        getModeDisplay
    };
})();
