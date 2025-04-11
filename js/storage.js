/**
 * Gerenciamento de armazenamento local
 * Última atualização: 2025-04-11 16:43:14
 * Desenvolvido por: Duduxindev
 */
class GameStorage {
    constructor() {
        this.storagePrefix = 'uno_game_';
    }
    
    // Salvar configurações
    saveSettings(settings) {
        try {
            localStorage.setItem(this.storagePrefix + 'settings', JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            return false;
        }
    }
    
    // Obter configurações
    getSettings() {
        try {
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
            
            return { ...defaultSettings, ...JSON.parse(savedSettings) };
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            return {
                darkMode: false,
                soundEffects: true,
                backgroundMusic: true,
                cardAnimation: true,
                autoUno: false,
                turnTimer: true
            };
        }
    }
    
    // Salvar estatísticas do jogador
    saveStats(stats) {
        try {
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
            return true;
        } catch (error) {
            console.error('Erro ao salvar estatísticas:', error);
            return false;
        }
    }
    
    // Obter estatísticas do jogador
    getStats() {
        try {
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
            
            return { ...defaultStats, ...JSON.parse(savedStats) };
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            return {
                totalGames: 0,
                wins: 0,
                cardsPlayed: 0,
                specialCardsPlayed: 0,
                unosCalled: 0,
                lastGameDate: null,
                gameHistory: []
            };
        }
    }
    
    // Salvar último nome de jogador utilizado
    savePlayerName(name) {
        try {
            localStorage.setItem(this.storagePrefix + 'playerName', name);
            return true;
        } catch (error) {
            console.error('Erro ao salvar nome do jogador:', error);
            return false;
        }
    }
    
    // Obter último nome de jogador
    getPlayerName() {
        try {
            return localStorage.getItem(this.storagePrefix + 'playerName') || '';
        } catch (error) {
            console.error('Erro ao obter nome do jogador:', error);
            return '';
        }
    }
    
    // Salvar informações da sessão atual
    saveSessionInfo(roomCode, playerId) {
        try {
            const sessionInfo = { 
                roomCode, 
                playerId, 
                timestamp: Date.now(),
                version: '1.0.0'
            };
            
            localStorage.setItem(this.storagePrefix + 'session', JSON.stringify(sessionInfo));
            return true;
        } catch (error) {
            console.error('Erro ao salvar informações da sessão:', error);
            return false;
        }
    }
    
    // Obter informações da sessão
    getSessionInfo() {
        try {
            const savedSession = localStorage.getItem(this.storagePrefix + 'session');
            
            if (!savedSession) {
                return null;
            }
            
            const session = JSON.parse(savedSession);
            
            // Verificar se a sessão expirou (24 horas)
            if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
                this.clearSessionInfo();
                return null;
            }
            
            return session;
        } catch (error) {
            console.error('Erro ao obter informações da sessão:', error);
            return null;
        }
    }
    
    // Limpar informações da sessão
    clearSessionInfo() {
        try {
            localStorage.removeItem(this.storagePrefix + 'session');
            return true;
        } catch (error) {
            console.error('Erro ao limpar informações da sessão:', error);
            return false;
        }
    }
    
    // Verificar se o armazenamento local está disponível
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    // Limpar todos os dados do jogo
    clearAllData() {
        try {
            // Obter todas as chaves que começam com o prefixo
            const keysToRemove = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.storagePrefix)) {
                    keysToRemove.push(key);
                }
            }
            
            // Remover as chaves
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            return true;
        } catch (error) {
            console.error('Erro ao limpar todos os dados:', error);
            return false;
        }
    }
}