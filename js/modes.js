/**
 * Modos de jogo para UNO Game
 * Data: 2025-04-11 21:08:44
 * Desenvolvido por: Duduxindev
 */

const GameModes = {
    // Definições dos modos de jogo
    modes: {
      normal: {
        name: "Normal",
        description: "Modo clássico com regras originais do UNO.",
        rules: {
          stacking: false,
          jumpIn: false,
          forcePlay: false,
          sevenTrade: false,
          zeroRotate: false
        },
        deckMultiplier: 1,
        specialCards: {
          skip: 2,
          reverse: 2,
          draw2: 2,
          wild: 4,
          wildDraw4: 4
        },
        turnTime: 30
      },
      
      wild: {
        name: "Wild",
        description: "Mais cartas especiais no baralho para partidas mais dinâmicas.",
        rules: {
          stacking: false,
          jumpIn: false,
          forcePlay: true,
          sevenTrade: false,
          zeroRotate: false
        },
        deckMultiplier: 1,
        specialCards: {
          skip: 4,
          reverse: 4,
          draw2: 4,
          wild: 6,
          wildDraw4: 6
        },
        turnTime: 30
      },
      
      noMercy: {
        name: "No Mercy",
        description: "Empilhe cartas +2 e +4 sem limites para combos devastadores.",
        rules: {
          stacking: true,
          jumpIn: false,
          forcePlay: true,
          sevenTrade: false,
          zeroRotate: false
        },
        deckMultiplier: 1,
        specialCards: {
          skip: 2,
          reverse: 2,
          draw2: 4,
          wild: 4,
          wildDraw4: 4
        },
        turnTime: 30
      },
      
      sevenZero: {
        name: "Seven-Zero",
        description: "Carta 7 = trocar mãos com outro jogador, Carta 0 = rotacionar mãos entre todos.",
        rules: {
          stacking: false,
          jumpIn: false,
          forcePlay: false,
          sevenTrade: true,
          zeroRotate: true
        },
        deckMultiplier: 1,
        specialCards: {
          skip: 2,
          reverse: 2,
          draw2: 2,
          wild: 4,
          wildDraw4: 4
        },
        turnTime: 30
      },
      
      extreme: {
        name: "Extreme",
        description: "Todas as regras especiais ativadas e mais cartas de ação. Caos total!",
        rules: {
          stacking: true,
          jumpIn: true,
          forcePlay: true,
          sevenTrade: true,
          zeroRotate: true
        },
        deckMultiplier: 1.5,
        specialCards: {
          skip: 4,
          reverse: 4,
          draw2: 4,
          wild: 6,
          wildDraw4: 6
        },
        turnTime: 30
      },
      
      speed: {
        name: "Speed",
        description: "Jogo rápido com turnos de apenas 15 segundos. Pense rápido!",
        rules: {
          stacking: false,
          jumpIn: true,
          forcePlay: true,
          sevenTrade: false,
          zeroRotate: false
        },
        deckMultiplier: 1,
        specialCards: {
          skip: 2,
          reverse: 2,
          draw2: 2,
          wild: 4,
          wildDraw4: 4
        },
        turnTime: 15
      },
      
      chaos: {
        name: "Chaos",
        description: "Regras aleatórias mudam a cada rodada. Imprevisível e divertido!",
        rules: {
          stacking: false,
          jumpIn: false,
          forcePlay: false,
          sevenTrade: false,
          zeroRotate: false,
          chaosMode: true
        },
        deckMultiplier: 1.2,
        specialCards: {
          skip: 3,
          reverse: 3,
          draw2: 3,
          wild: 5,
          wildDraw4: 5
        },
        turnTime: 30
      },
      
      actionOnly: {
        name: "Action Only",
        description: "Apenas cartas de ação, sem cartas numéricas. Pura estratégia!",
        rules: {
          stacking: true,
          jumpIn: false,
          forcePlay: true,
          sevenTrade: false,
          zeroRotate: false,
          noNumberCards: true
        },
        deckMultiplier: 1,
        specialCards: {
          skip: 8,
          reverse: 8,
          draw2: 8,
          wild: 8,
          wildDraw4: 8
        },
        turnTime: 30
      }
    },
    
    // Obter um modo pelo nome
    getMode: function(modeName) {
      return this.modes[modeName] || this.modes.normal;
    },
    
    // Obter uma lista de todos os modos disponíveis
    getAvailableModes: function() {
      return Object.keys(this.modes).map(key => ({
        id: key,
        name: this.modes[key].name,
        description: this.modes[key].description
      }));
    },
    
    // Obter a descrição de um modo
    getModeDescription: function(modeName) {
      const mode = this.getMode(modeName);
      return mode.description;
    },
    
    // Criar configuração para um modo específico
    createModeConfig: function(modeName, customRules = {}) {
      const baseMode = this.getMode(modeName);
      
      // Mesclar regras base com regras personalizadas
      const rules = { ...baseMode.rules, ...customRules };
      
      return {
        mode: modeName,
        name: baseMode.name,
        rules: rules,
        specialCards: baseMode.specialCards,
        turnTime: baseMode.turnTime,
        deckMultiplier: baseMode.deckMultiplier
      };
    },
    
    // Atualizar regras para o modo caos (aleatórias a cada rodada)
    updateChaosRules: function() {
      const chaosRules = {};
      
      // Definir regras aleatórias
      chaosRules.stacking = Math.random() < 0.5;
      chaosRules.jumpIn = Math.random() < 0.5;
      chaosRules.forcePlay = Math.random() < 0.5;
      chaosRules.sevenTrade = Math.random() < 0.5;
      chaosRules.zeroRotate = Math.random() < 0.5;
      
      return chaosRules;
    }
  };
  
  console.log("✅ Modos de jogo inicializados!");