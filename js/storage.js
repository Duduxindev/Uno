/**
 * Gerenciamento de armazenamento local
 * Última atualização: 2025-04-11 16:26:03
 * Desenvolvido por: Duduxindev
 */
class GameStorage {
    constructor() {
        this.storagePrefix = 'uno_game_';
    }
    
    // Salvar configurações
    saveSettings(settings) {
        localStorage.setItem(this.storagePrefix + 'settings', JSON.stringify(settings));
    }
    
    // Obter configurações
    getSettings() {
        const defaultSettings = {
            darkMode: false,
            soundEffects: true,
            backgroundMusic: true,
            cardAnimation: true,
            autoUno: false,
            turnTimer: true
        };
        
        const savedSettings = localStorage.getItem(this.storagePrefix + 'settings');
        
        if (!savedSettings) {
            return defaultSettings;
        }
        
        try {
            return { ...defaultSettings, ...JSON.parse(savedSettings) };
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            return defaultSettings;
        }
    }
    
    // Salvar estatísticas do jogador
    saveStats(stats) {
        const currentStats = this.getStats();
        const updatedStats = {
            totalGames: currentStats.totalGames + 1,
            wins: currentStats.wins + (stats.won ? 1 : 0),
            cardsPlayed: currentStats.cardsPlayed + (stats.cardsPlayed || 0),
            specialCardsPlayed: currentStats.specialCardsPlayed + (stats.specialCardsPlayed || 0),
            unosCalled: currentStats.unosCalled + (stats.unosCalled || 0),
            lastGameDate: new Date().toISOString(),
            gameHistory: [
                {
                    date: new Date().toISOString(),
                    won: stats.won,
                    mode: stats.mode,
                    players: stats.playerCount,
                    cardsPlayed: stats.cardsPlayed || 0
                },
                ...currentStats.gameHistory.slice(0, 9) // Manter apenas os últimos 10 jogos
            ]
        };
        
        localStorage.setItem(this.storagePrefix + 'stats', JSON.stringify(updatedStats));
    }
    
    // Obter estatísticas do jogador
    getStats() {
        const defaultStats = {
            totalGames: 0,
            wins: 0,
            cardsPlayed: 0,
            specialCardsPlayed: 0,
            unosCalled: 0,
            lastGameDate: null,
            gameHistory: []
        };
        
        const savedStats = localStorage.getItem(this.storagePrefix + 'stats');
        
        if (!savedStats) {
            return defaultStats;
        }
        
        try {
            return { ...defaultStats, ...JSON.parse(savedStats) };
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            return defaultStats;
        }
    }
    
    // Salvar preferências do jogador
    savePlayerPreferences(preferences) {
        localStorage.setItem(this.storagePrefix + 'preferences', JSON.stringify(preferences));
    }
    
    // Obter preferências do jogador
    getPlayerPreferences() {
        const defaultPreferences = {
            playerName: '',
            selectedAvatar: 0,
            favoriteColor: 'red'
        };
        
        const savedPreferences = localStorage.getItem(this.storagePrefix + 'preferences');
        
        if (!savedPreferences) {
            return defaultPreferences;
        }
        
        try {
            return { ...defaultPreferences, ...JSON.parse(savedPreferences) };
        } catch (error) {
            console.error('Erro ao carregar preferências:', error);
            return defaultPreferences;
        }
    }
    
    // Salvar estado de uma sala para possível reconexão
    saveSessionInfo(roomCode, playerId) {
        const sessionInfo = { roomCode, playerId, timestamp: Date.now() };
        localStorage.setItem(this.storagePrefix + 'session', JSON.stringify(sessionInfo));
    }
    
    // Obter informações da última sessão
    getSessionInfo() {
        const savedSession = localStorage.getItem(this.storagePrefix + 'session');
        
        if (!savedSession) {
            return null;
        }
        
        try {
            const session = JSON.parse(savedSession);
            
            // Se a sessão for muito antiga (mais de 24 horas), descartá-la
            if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
                this.clearSessionInfo();
                return null;
            }
            
            return session;
        } catch (error) {
            console.error('Erro ao carregar informações da sessão:', error);
            return null;
        }
    }
    
    // Limpar informações da sessão
    clearSessionInfo() {
        localStorage.removeItem(this.storagePrefix + 'session');
    }
    
    // Salvar último nome de jogador utilizado
    savePlayerName(name) {
        localStorage.setItem(this.storagePrefix + 'playerName', name);
    }
    
    // Obter último nome de jogador
    getPlayerName() {
        return localStorage.getItem(this.storagePrefix + 'playerName') || '';
    }
}