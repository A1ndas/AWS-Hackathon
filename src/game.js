// Loads the team's DOM-free game modules (plain scripts that attach to window),
// in the same order the original index.html used, then hands them to React.
import '../data/content.js'
import '../js/engine.js'
import '../js/progress.js'
import '../js/flow.js'

export const content = window.GAME_CONTENT
export const engine = window.GameEngine
export const progressApi = window.GameProgress
export const flow = window.GameFlow
