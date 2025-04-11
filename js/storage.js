/**
 * Gerenciamento de armazenamento local para UNO Game
 * Data: 2025-04-11 21:08:44
 * Desenvolvido por: Duduxindev
 */

const Storage = {
    // Chaves para armazenamento
    keys: {
      SESSION: 'unoSession',
      SETTINGS: 'unoSettings',
      STATS: 'unoStats',
      HISTORY: 'unoHistory'
    },
    
    // Salvar dados no localStorage
    saveData: function(key, data) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      } catch (error) {
        console.error(`Erro ao salvar dados (${key}):`, error);
        return false;
      }
    },
    
    // Obter dados do localStorage
    getData: function(key) {
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error(`Erro ao obter dados (${key}):`, error);
        return null;
      }
    },
    
    // Remover dados do localStorage
    removeData: function(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error(`Erro ao remover dados (${key}):`, error);
        return false;
      }
    },
    
    // Salvar dados da sessão
    saveSession: function(data) {
      return this.saveData(this.keys.SESSION, data);
    },
    
    // Obter dados da sessão
    getSession: function() {
      return this.getData(this.keys.SESSION) || {};
    },
    
    // Remover dados da sessão
    clearSession: function() {
      return this.removeData(this.keys.SESSION);
    },
    
    // Salvar configurações
    saveSettings: function(settings) {
      return this.saveData(this.keys.SETTINGS, settings);
    },
    
    // Obter configurações
    getSettings: function() {
      return this.getData(this.keys.SETTINGS) || {
        soundEffects: true,
        backgroundMusic: true,
        cardAnimation: true,
        darkMode: false,
        autoUno: false,
        turnTimer: true,
        showPlayable: true
      };
    },
    
    // Salvar estatísticas
    saveStats: function(stats) {
      return this.saveData(this.keys.STATS, stats);
    },
    
    // Obter estatísticas
    getStats: function() {
      return this.getData(this.keys.STATS) || {
        gamesPlayed: 0,
        gamesWon: 0,
        cardsPlayed: 0,
        specialCardsPlayed: 0,
        unosCalled: 0
      };
    },
    
    // Atualizar estatísticas
    updateStats: function(newStats) {
      const currentStats = this.getStats();
      const updatedStats = { ...currentStats, ...newStats };
      return this.saveStats(updatedStats);
    },
    
    // Adicionar um jogo ao histórico
    addGameToHistory: function(gameData) {
      const history = this.getData(this.keys.HISTORY) || [];
      
      // Adicionar jogo ao início do histórico
      history.unshift({
        ...gameData,
        timestamp: Date.now()
      });
      
      // Manter apenas os últimos 20 jogos
      if (history.length > 20) {
        history.pop();
      }
      
      return this.saveData(this.keys.HISTORY, history);
    },
    
    // Obter histórico de jogos
    getGameHistory: function() {
      return this.getData(this.keys.HISTORY) || [];
    }
  };
  
  console.log("✅ Sistema de armazenamento inicializado!");