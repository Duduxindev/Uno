/**
 * Sistema de Armazenamento Local
 */
class GameStorage {
    constructor() {
        this.storageKey = 'uno_game_data';
        this.data = this.loadData();
    }
    
    loadData() {
        const savedData = localStorage.getItem(this.storageKey);
        
        if (savedData) {
            try {
                return JSON.parse(savedData);
            } catch (e) {
                console.error('Erro ao carregar dados salvos:', e);
                return this.getDefaultData();
            }
        }
        
        return this.getDefaultData();
    }
    
    getDefaultData() {
        return {
            playerName: '',
            playerHistory: [],
            settings: {
                soundEffects: true,
                backgroundMusic: true,
                cardAnimation: true,
                darkMode: false,
                autoUno: false,
                turnTimer: true
            },
            stats: {
                gamesPlayed: 0,
                gamesWon: 0,
                cardsPlayed: 0,
                specialCardsPlayed: 0,
                unosCalled: 0
            },
            lastRoom: null
        };
    }
    
    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }
    
    getPlayerName() {
        return this.data.playerName;
    }
    
    setPlayerName(name) {
        this.data.playerName = name;
        this.saveData();
    }
    
    getSettings() {
        return this.data.settings;
    }
    
    updateSettings(settings) {
        this.data.settings = {...this.data.settings, ...settings};
        this.saveData();
    }
    
    getStats() {
        return this.data.stats;
    }
    
    updateStats(gameStats) {
        this.data.stats.gamesPlayed++;
        
        if (gameStats.won) {
            this.data.stats.gamesWon++;
        }
        
        this.data.stats.cardsPlayed += gameStats.cardsPlayed || 0;
        this.data.stats.specialCardsPlayed += gameStats.specialCardsPlayed || 0;
        this.data.stats.unosCalled += gameStats.unosCalled || 0;
        
        // Adiciona ao histórico de jogos
        this.data.playerHistory.push({
            date: new Date().toISOString(),
            won: gameStats.won,
            mode: gameStats.mode,
            playerCount: gameStats.playerCount,
            ...gameStats
        });
        
        // Limita o histórico a 20 jogos
        if (this.data.playerHistory.length > 20) {
            this.data.playerHistory.shift();
        }
        
        this.saveData();
    }
    
    getLastRoom() {
        return this.data.lastRoom;
    }
    
    setLastRoom(roomCode) {
        this.data.lastRoom = roomCode;
        this.saveData();
    }
    
    clearLastRoom() {
        this.data.lastRoom = null;
        this.saveData();
    }
}