/**
 * Game State Management
 * Manages the current state of the game, including trials and player progress
 */

class GameState {
    constructor(config) {
        this.config = config;
        this.currentTrial = 0;
        this.trials = [];
        this.currentPosition = [0, 0];
        this.lastCorrectPosition = [0, 0];
        this.visitedCells = new Set(); // Don't pre-mark start cell as visited
        this.errorCount = 0;
        this.legalErrors = 0;
        this.perseverativeErrors = 0;
        this.ruleBreakErrors = 0;
        this.consecutiveErrors = 0;
        this.moves = [];
        this.startTime = null;
        this.currentPath = null;
        this.isComplete = false;
        this.ruleBreakActive = false;
    }

    /**
     * Initialize a new trial
     */
    startNewTrial(mazePath) {
        this.currentTrial++;
        this.currentPath = mazePath;
        this.currentPosition = [0, 0];
        this.lastCorrectPosition = [0, 0];
        this.visitedCells = new Set(); // Don't pre-mark start cell as visited
        this.errorCount = 0;
        this.legalErrors = 0;
        this.perseverativeErrors = 0;
        this.ruleBreakErrors = 0;
        this.consecutiveErrors = 0;
        this.moves = [];
        this.startTime = Date.now();
        this.isComplete = false;
        this.ruleBreakActive = false;
    }

    /**
     * Attempt a move to a new cell
     * @param {number} row - Target row
     * @param {number} col - Target column
     * @returns {object} {valid: boolean, isComplete: boolean}
     */
    makeMove(row, col) {
        if (this.isComplete) {
            return { valid: false, isComplete: true };
        }

        const moveTime = Date.now() - this.startTime;
        const isValid = this._isValidMove(row, col);
        
        if (isValid) {
            // Valid move - update position
            this.currentPosition = [row, col];
            this.lastCorrectPosition = [row, col];
            this.visitedCells.add(`${row},${col}`);
            this.consecutiveErrors = 0; // Reset consecutive errors
            this.ruleBreakActive = false;
            
            // Check if completed
            if (row === this.config.gridSize - 1 && col === this.config.gridSize - 1) {
                this.isComplete = true;
            }
            
            this.moves.push({
                position: [row, col],
                correct: true,
                time: moveTime,
                errorType: null
            });
            
            return { 
                valid: true, 
                isComplete: this.isComplete, 
                message: "Go On",
                audioFeedback: true
            };
        } else {
            // Invalid move - determine error type
            this.errorCount++;
            this.consecutiveErrors++;
            
            let errorType;
            let needsFlasher = false;
            
            if (this.consecutiveErrors === 1) {
                errorType = 'legal';
                this.legalErrors++;
            } else if (this.consecutiveErrors === 2) {
                errorType = 'perseverative';
                this.perseverativeErrors++;
            } else if (this.consecutiveErrors >= 3) {
                errorType = 'rule-break';
                this.ruleBreakErrors++;
                this.ruleBreakActive = true;
                needsFlasher = true;
            }
            
            this.moves.push({
                position: [row, col],
                correct: false,
                time: moveTime,
                errorType: errorType
            });
            
            // Move back to last correct position (NOT to start)
            this.currentPosition = [...this.lastCorrectPosition];
            
            return { 
                valid: false, 
                isComplete: false, 
                errorType: errorType,
                needsFlasher: needsFlasher,
                lastCorrectPosition: this.lastCorrectPosition
            };
        }
    }
    
    /**
     * Get the next cell in the path that should be allowed
     * @private
     */
    _getNextAllowedCell() {
        if (!this.currentPath) return null;
        
        const currentIndex = this._findInPath(this.currentPosition[0], this.currentPosition[1]);
        if (currentIndex === -1) return null;
        
        const nextIndex = currentIndex + 1;
        if (nextIndex >= this.currentPath.length) return null;
        
        return this.currentPath[nextIndex];
    }

    /**
     * Check if a move is valid
     * @private
     */
    _isValidMove(row, col) {
        const [currentRow, currentCol] = this.currentPosition;
        
        // Special case: First move on start cell
        if (this.visitedCells.size === 0 && row === 0 && col === 0) {
            return this._isInPath(row, col);
        }
        
        // Check if adjacent
        const rowDiff = Math.abs(row - currentRow);
        const colDiff = Math.abs(col - currentCol);
        
        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
            // Check if this cell is in the correct path
            return this._isInPath(row, col);
        }
        
        return false;
    }

    /**
     * Check if a cell is in the correct path
     * @private
     */
    _isInPath(row, col) {
        if (!this.currentPath) return false;
        
        // Special case: First click on start cell [0,0]
        if (this.visitedCells.size === 0 && row === 0 && col === 0 && 
            this.currentPosition[0] === 0 && this.currentPosition[1] === 0) {
            return true;
        }
        
        // Find current position in path
        let currentIndex = -1;
        for (let i = 0; i < this.currentPath.length; i++) {
            const [r, c] = this.currentPath[i];
            if (r === this.currentPosition[0] && c === this.currentPosition[1]) {
                currentIndex = i;
                break;
            }
        }
        
        // If current position not found in path, start from beginning
        if (currentIndex === -1) {
            // Check if we're at the start
            if (this.currentPosition[0] === 0 && this.currentPosition[1] === 0) {
                currentIndex = 0;
            } else {
                // We're off the path, so this won't be valid
                return false;
            }
        }
        
        // Next cell in path should be the clicked cell
        const nextIndex = currentIndex + 1;
        if (nextIndex >= this.currentPath.length) return false;
        
        const nextCell = this.currentPath[nextIndex];
        return nextCell[0] === row && nextCell[1] === col;
    }

    /**
     * Complete the current trial
     */
    completeTrial() {
        const endTime = Date.now();
        const totalTime = endTime - this.startTime;
        
        const trialData = {
            trialNumber: this.currentTrial,
            errors: this.errorCount,
            legalErrors: this.legalErrors,
            perseverativeErrors: this.perseverativeErrors,
            ruleBreakErrors: this.ruleBreakErrors,
            totalTime: totalTime,
            moves: [...this.moves],
            completed: this.isComplete,
            timestamp: endTime
        };
        
        this.trials.push(trialData);
        return trialData;
    }

    /**
     * Check if all trials are complete
     */
    areAllTrialsComplete() {
        return this.trials.length >= this.config.numTrials;
    }

    /**
     * Get current trial error count
     */
    getErrorCount() {
        return this.errorCount;
    }

    /**
     * Get current position
     */
    getCurrentPosition() {
        return this.currentPosition;
    }

    /**
     * Get all trial data for results
     */
    getAllTrialsData() {
        return this.trials;
    }
    
    /**
     * Find index of cell in path
     * @private
     */
    _findInPath(row, col) {
        if (!this.currentPath) return -1;
        
        for (let i = 0; i < this.currentPath.length; i++) {
            const [r, c] = this.currentPath[i];
            if (r === row && c === col) {
                return i;
            }
        }
        return -1;
    }
}

