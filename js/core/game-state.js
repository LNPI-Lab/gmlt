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
        this.awaitingBacktrackConfirmation = false;
    }

    /**
     * Initialize a new trial
     */
    startNewTrial(mazePath) {
        console.log(`[GameState] Starting new trial ${this.currentTrial + 1}`);
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
        this.startTime = null;
        this.isComplete = false;
        this.ruleBreakActive = false;
        this.awaitingBacktrackConfirmation = false;
        console.log(`[GameState] Trial ${this.currentTrial} initialized, Path length: ${mazePath.length}, Start time: ${this.startTime}`);
    }

    /**
     * Attempt a move to a new cell
     * @param {number} row - Target row
     * @param {number} col - Target column
     * @returns {object} {valid: boolean, isComplete: boolean}
     */
    makeMove(row, col) {
        console.log(`[MakeMove] Attempting move from [${this.currentPosition}] to [${row},${col}]`);
        
        if (this.isComplete) {
            console.log('[MakeMove] Game already complete');
            return { valid: false, isComplete: true };
        }

        const absoluteTimestamp = Date.now();
        let timerStarted = false;

        // Start timer on first click of the start cell
        if (!this.startTime && row === 0 && col === 0) {
            this.startTime = absoluteTimestamp;
            timerStarted = true;
            console.log(`[MakeMove] Timer started at ${this.startTime}`);
        }

        const moveTime = this.startTime ? absoluteTimestamp - this.startTime : 0;

        // If player must reconfirm the previous correct tile, enforce it here
        if (this.awaitingBacktrackConfirmation) {
            console.log('[MakeMove] Awaiting backtrack confirmation');
            if (row === this.lastCorrectPosition[0] && col === this.lastCorrectPosition[1]) {
                this.awaitingBacktrackConfirmation = false;
                this.ruleBreakActive = false;
                this.consecutiveErrors = 0;
                this.currentPosition = [row, col];
                this.visitedCells.add(`${row},${col}`);

                this.moves.push({
                    position: [row, col],
                    correct: true,
                    time: moveTime,
                    timestamp: absoluteTimestamp,
                    errorType: null,
                    confirmation: true
                });

                console.log('[MakeMove] Backtrack confirmation recorded');

                return {
                    valid: true,
                    isComplete: false,
                    message: 'Go On',
                    audioFeedback: false,
                    confirmation: true,
                    timerStarted
                };
            }

            // Any other selection while awaiting confirmation is an error
            return this._recordInvalidMove(row, col, moveTime, absoluteTimestamp, timerStarted);
        }

        const isValid = this._isValidMove(row, col);
        
        if (isValid) {
            // Valid move - update position
            this.currentPosition = [row, col];
            this.lastCorrectPosition = [row, col];
            this.visitedCells.add(`${row},${col}`);
            this.consecutiveErrors = 0; // Reset consecutive errors
            this.ruleBreakActive = false;
            
            console.log(`[MakeMove] Valid move! New position: [${row},${col}], Visited cells: ${this.visitedCells.size}, Timestamp: ${new Date(absoluteTimestamp).toISOString()}`);
            
            // Check if completed
            if (row === this.config.gridSize - 1 && col === this.config.gridSize - 1) {
                this.isComplete = true;
                console.log('[MakeMove] Maze completed!');
            }
            this.moves.push({
                position: [row, col],
                correct: true,
                time: moveTime,
                timestamp: absoluteTimestamp,
                errorType: null
            });
            console.log(`[MakeMove] Move recorded with timestamp: ${new Date(absoluteTimestamp).toISOString()}`);
            
            return { 
                valid: true, 
                isComplete: this.isComplete, 
                message: "Go On",
                audioFeedback: true,
                timerStarted
            };
        } else {
            return this._recordInvalidMove(row, col, moveTime, absoluteTimestamp, timerStarted);
        }
    }

    /**
     * Record an invalid move and return the standard response payload
     * @private
     */
    _recordInvalidMove(row, col, moveTime, timestamp, timerStarted) {
        // Invalid move - determine error type
        this.errorCount++;
        this.consecutiveErrors++;

        console.log(`[MakeMove] Invalid move! Consecutive errors: ${this.consecutiveErrors}, Total errors: ${this.errorCount}`);

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

        console.log(`[MakeMove] Error type: ${errorType}, Returning to [${this.lastCorrectPosition}], Timestamp: ${new Date(timestamp).toISOString()}`);

        this.moves.push({
            position: [row, col],
            correct: false,
            time: moveTime,
            timestamp: timestamp,
            errorType: errorType
        });

        // Move back to last correct position (NOT to start)
        this.currentPosition = [...this.lastCorrectPosition];
        this.awaitingBacktrackConfirmation = true;

        return { 
            valid: false, 
            isComplete: false, 
            errorType: errorType,
            needsFlasher: needsFlasher,
            lastCorrectPosition: this.lastCorrectPosition,
            timerStarted
        };
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
            const isValid = this._isInPath(row, col);
            console.log(`[Validation] First move on start cell: ${isValid}`);
            return isValid;
        }
        
        // Check if adjacent
        const rowDiff = Math.abs(row - currentRow);
        const colDiff = Math.abs(col - currentCol);
        
        console.log(`[Validation] Move to [${row},${col}], Current: [${currentRow},${currentCol}], Diff: [${rowDiff},${colDiff}]`);
        
        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
            // Check if this cell is in the correct path
            const isValid = this._isInPath(row, col);
            console.log(`[Validation] Adjacent cell, in path: ${isValid}`);
            return isValid;
        }
        
        console.log(`[Validation] Not adjacent, invalid`);
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
            console.log(`[Path Check] First click on start cell, allowing`);
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
                console.log(`[Path Check] Current position [${this.currentPosition}] not found in path`);
                return false;
            }
        }
        
        console.log(`[Path Check] Current index: ${currentIndex}, Current position: [${this.currentPosition}]`);
        
        // Next cell in path should be the clicked cell
        const nextIndex = currentIndex + 1;
        if (nextIndex >= this.currentPath.length) {
            console.log(`[Path Check] Next index ${nextIndex} >= path length ${this.currentPath.length}`);
            return false;
        }
        
        const nextCell = this.currentPath[nextIndex];
        const isValid = nextCell[0] === row && nextCell[1] === col;
        console.log(`[Path Check] Next cell in path: [${nextCell}], Checking: [${row},${col}], Valid: ${isValid}`);
        return isValid;
    }

    /**
     * Complete the current trial
     */
    completeTrial() {
        const endTime = Date.now();
        const effectiveStart = this.startTime || endTime;
        const totalTime = endTime - effectiveStart;
        
        console.log(`[CompleteTrial] Trial ${this.currentTrial}, Time: ${totalTime}ms, Errors: ${this.errorCount}, Moves: ${this.moves.length}`);
        
        const trialData = {
            trialNumber: this.currentTrial,
            errors: this.errorCount,
            legalErrors: this.legalErrors,
            perseverativeErrors: this.perseverativeErrors,
            ruleBreakErrors: this.ruleBreakErrors,
            totalTime: totalTime,
            moves: [...this.moves],
            completed: this.isComplete,
            startTimestamp: this.startTime,
            endTimestamp: endTime,
            timestamp: endTime // Keep for backwards compatibility
        };
        
        this.trials.push(trialData);
        console.log(`[CompleteTrial] Trial data saved:`, trialData);
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

