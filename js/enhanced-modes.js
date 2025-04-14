/**
 * Enhanced Game Modes for UNO Game
 * Data: 2025-04-14 14:34:10
 * Desenvolvido por: Duduxindev
 */

class EnhancedGameModes {
    constructor() {
        this.modes = {
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
                initialCards: 7,
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
                initialCards: 7,
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
                initialCards: 7,
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
                initialCards: 7,
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
                initialCards: 7,
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
                initialCards: 5, // Faster games with fewer cards
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
                initialCards: 7,
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
                initialCards: 5,
                turnTime: 30
            },
            
            // New game modes
            insane: {
                name: "Insane",
                description: "Modo insano com cartas poderosas e regras imprevisíveis. Prepare-se para o caos!",
                rules: {
                    stacking: true,
                    jumpIn: true,
                    forcePlay: true,
                    sevenTrade: true,
                    zeroRotate: true,
                    specialEffects: true
                },
                deckMultiplier: 2,
                specialCards: {
                    skip: 6,
                    reverse: 6,
                    draw2: 6,
                    wild: 8,
                    wildDraw4: 8,
                    drawSix: 2,
                    skipAll: 2,
                    swapHands: 2
                },
                initialCards: 9,
                turnTime: 20
            },
            
            mirror: {
                name: "Mirror",
                description: "Cada carta jogada afeta todos os jogadores da mesma forma. O que você faz volta para você!",
                rules: {
                    stacking: false,
                    jumpIn: false,
                    forcePlay: true,
                    sevenTrade: false,
                    zeroRotate: true,
                    mirrorEffects: true
                },
                deckMultiplier: 1.2,
                specialCards: {
                    skip: 2,
                    reverse: 4,
                    draw2: 2,
                    wild: 4,
                    wildDraw4: 4
                },
                initialCards: 7,
                turnTime: 30
            },
            
            quickDraw: {
                name: "Quick Draw",
                description: "Compre cartas constantemente! A cada turno você compra uma carta automaticamente.",
                rules: {
                    stacking: false,
                    jumpIn: true,
                    forcePlay: true,
                    sevenTrade: false,
                    zeroRotate: false,
                    autoDrawCard: true
                },
                deckMultiplier: 2,
                specialCards: {
                    skip: 2,
                    reverse: 2,
                    draw2: 2,
                    wild: 4,
                    wildDraw4: 4
                },
                initialCards: 3,
                turnTime: 20
            },
            
            challenge: {
                name: "Challenge",
                description: "Cartas de desafio aparecem frequentemente. Complete desafios para ganhar vantagens ou receba penalidades.",
                rules: {
                    stacking: true,
                    jumpIn: false,
                    forcePlay: true,
                    sevenTrade: false,
                    zeroRotate: false,
                    challenges: true
                },
                deckMultiplier: 1.2,
                specialCards: {
                    skip: 2,
                    reverse: 2,
                    draw2: 2,
                    wild: 4,
                    wildDraw4: 4,
                    challenge: 6
                },
                initialCards: 7,
                turnTime: 45 // More time for challenges
            }
        };
    }

    // Get a mode by its name
    getMode(modeName) {
        return this.modes[modeName] || this.modes.normal;
    }

    // Get a list of all available modes
    getAvailableModes() {
        return Object.keys(this.modes).map(key => ({
            id: key,
            name: this.modes[key].name,
            description: this.modes[key].description
        }));
    }

    // Get a mode description
    getModeDescription(modeName) {
        const mode = this.getMode(modeName);
        return mode.description;
    }

    // Create config for a specific mode
    createModeConfig(modeName, customRules = {}) {
        const baseMode = this.getMode(modeName);
        
        // Merge base rules with custom rules
        const rules = { ...baseMode.rules, ...customRules };
        
        return {
            mode: modeName,
            name: baseMode.name,
            rules: rules,
            specialCards: baseMode.specialCards,
            turnTime: baseMode.turnTime,
            deckMultiplier: baseMode.deckMultiplier,
            initialCards: baseMode.initialCards
        };
    }

    // Update chaos rules (random rules each round)
    updateChaosRules() {
        const chaosRules = {};
        
        // Set random rules
        chaosRules.stacking = Math.random() < 0.5;
        chaosRules.jumpIn = Math.random() < 0.5;
        chaosRules.forcePlay = Math.random() < 0.5;
        chaosRules.sevenTrade = Math.random() < 0.5;
        chaosRules.zeroRotate = Math.random() < 0.5;
        chaosRules.autoDrawCard = Math.random() < 0.3;
        chaosRules.mirrorEffects = Math.random() < 0.2;
        chaosRules.challenges = Math.random() < 0.2;
        
        return chaosRules;
    }
    
    // Generate appropriate starting message for a game mode
    getModeStartMessage(modeName) {
        const mode = this.getMode(modeName);
        let message = `Iniciando jogo no modo ${mode.name}! `;
        
        // Add rules highlights
        if (mode.rules.stacking) message += "Empilhamento de +2/+4 ativado. ";
        if (mode.rules.jumpIn) message += "Jump-In ativado. ";
        if (mode.rules.sevenTrade) message += "Troca de 7 ativada. ";
        if (mode.rules.zeroRotate) message += "Rotação de 0 ativada. ";
        if (mode.rules.chaosMode) message += "Regras caóticas mudarão a cada rodada! ";
        if (mode.rules.noNumberCards) message += "Apenas cartas de ação no jogo. ";
        if (mode.rules.specialEffects) message += "Efeitos especiais ativados! ";
        if (mode.rules.mirrorEffects) message += "Efeitos espelhados para todos os jogadores! ";
        if (mode.rules.autoDrawCard) message += "Compra automática a cada turno. ";
        if (mode.rules.challenges) message += "Prepare-se para desafios! ";
        
        message += "Boa sorte!";
        return message;
    }
}

// Initialize EnhancedGameModes globally when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedGameModes = new EnhancedGameModes();
    console.log("✅ Sistema de modos de jogo aprimorados inicializado!");
});