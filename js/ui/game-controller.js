/**
 * Game Controller
 * Main UI controller for the GMLT application
 */

class GameController {
    constructor() {
        this.config = TASK_CONFIG;
        this.mazeGenerator = new MazeGenerator(this.config.gridSize);
        this.gameState = new GameState(this.config);
        this.isGameActive = false;
        this.timerInterval = null;
        
        this.initializeEventListeners();
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startFirstTrial();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restart();
        });
        
        document.getElementById('download-btn').addEventListener('click', () => {
            this.downloadResults();
        });
    }

    /**
     * Start the first trial
     */
    startFirstTrial() {
        document.getElementById('instructions-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        
        this.startNewTrial();
    }

    /**
     * Start a new trial
     */
    startNewTrial() {
        const path = this.mazeGenerator.generateRandomPath();
        this.gameState.startNewTrial(path);
        
        this.updateTrialInfo();
        this.renderMaze(path);
        this.attachCellListeners();
        
        // Start timer
        this.startTimer();
    }
    
    /**
     * Start the timer
     */
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            this.updateTrialInfo();
        }, 1000);
    }
    
    /**
     * Stop the timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Render the maze grid
     */
    renderMaze(path) {
        const grid = document.getElementById('maze-grid');
        grid.innerHTML = '';
        
        // Create grid container with proper columns for 10x10 grid
        grid.className = `grid grid-cols-10 gap-1 p-2 md:p-4`;
        
        for (let row = 0; row < this.config.gridSize; row++) {
            for (let col = 0; col < this.config.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'maze-cell bg-gray-100 border-2 border-gray-300 cursor-pointer transition-all hover:bg-gray-200';
                
                // Responsive sizing
                const cellWidth = window.innerWidth < 640 ? 'w-6 h-6 text-xs' : 
                                 window.innerWidth < 1024 ? 'w-8 h-8 text-sm' : 'w-10 h-10';
                cell.classList.add(...cellWidth.split(' '));
                
                // Mark start
                if (row === 0 && col === 0) {
                    cell.classList.add('bg-blue-400', 'font-bold');
                    cell.textContent = 'S';
                }
                
                // Mark end
                if (row === this.config.gridSize - 1 && col === this.config.gridSize - 1) {
                    cell.classList.add('bg-yellow-400');
                    cell.textContent = 'E';
                }
                
                // Show correct path in debug mode
                if (this.config.showCorrectPath && this._isInPath(path, row, col)) {
                    cell.classList.add('bg-gray-800', 'opacity-30');
                }
                
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                grid.appendChild(cell);
            }
        }
    }

    /**
     * Attach click event listeners to cells
     */
    attachCellListeners() {
        const cells = document.querySelectorAll('.maze-cell');
        
        cells.forEach(cell => {
            cell.addEventListener('click', () => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                this.handleCellClick(row, col, cell);
            });
        });
    }

    /**
     * Handle cell click
     */
    handleCellClick(row, col, cellElement) {
        // Check if game is complete
        if (this.gameState.isComplete) {
            return;
        }
        
        // Check if clicking flashing tile during rule-break
        if (this.gameState.ruleBreakActive) {
            // Check if this is the flashing tile
            const [flashRow, flashCol] = this.gameState.lastCorrectPosition;
            if (row === flashRow && col === flashCol) {
                // User clicked the flashing tile - resume normal play
                this.stopFlashingTile([row, col]);
                this.gameState.ruleBreakActive = false;
                this.gameState.consecutiveErrors = 0; // Reset consecutive errors
                this.updateMessage('Try to continue through the maze');
                return;
            } else {
                // Wrong tile - ignore, show message
                this.updateMessage('Touch the flashing tile, then try to continue', true);
                return;
            }
        }
        
        // Ignore if already visited successfully
        if (cellElement.classList.contains('bg-green-500')) {
            return;
        }
        
        const result = this.gameState.makeMove(row, col);
        
        if (result.valid) {
            // CORRECT MOVE
            cellElement.classList.remove('bg-gray-100', 'hover:bg-gray-200');
            cellElement.classList.add('bg-green-500', 'text-white', 'cell-animate');
            cellElement.textContent = '✓';
            
            // Audio feedback
            this.playSuccessSound();
            
            // Update message bars
            this.updateMessage('Go On', true);
            
            // Check if completed
            if (result.isComplete) {
                this.updateTrialInfo();
                setTimeout(() => this.completeCurrentTrial(), 1000);
                return;
            }
            
            // Update stats
            this.updateTrialInfo();
            this.updateVisualState();
        } else {
            // INCORRECT MOVE
            let message, isError;
            
            if (result.errorType === 'legal') {
                message = 'Go back to the last correct tile and try a different direction';
                isError = true;
            } else if (result.errorType === 'perseverative') {
                message = 'Go back to the previous correct tile and try a new way';
                isError = true;
            } else if (result.errorType === 'rule-break') {
                message = 'Touch the flashing tile, then try to continue';
                isError = true;
                // Start flashing animation
                this.startFlashingTile(result.lastCorrectPosition);
            }
            
            // Visual feedback for error
            cellElement.classList.remove('bg-gray-100');
            cellElement.classList.add('bg-red-500', 'cell-animate');
            
            // Update message and stats
            this.updateMessage(message, isError);
            this.updateTrialInfo();
            
            // Reset visual feedback after delay (unless rule-break)
            setTimeout(() => {
                if (!this.gameState.ruleBreakActive) {
                    cellElement.classList.remove('bg-red-500', 'cell-animate');
                    cellElement.classList.add('bg-gray-100');
                    this.updateVisualState();
                }
            }, 500);
        }
    }
    
    /**
     * Play success sound
     */
    playSuccessSound() {
        // Create a beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800; // Hz
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
    
    /**
     * Update message bars
     */
    updateMessage(message, isError = false) {
        const topBar = document.getElementById('top-message-bar');
        const topMsg = document.getElementById('top-message');
        const bottomBar = document.getElementById('bottom-message-bar');
        const bottomMsg = document.getElementById('bottom-message');
        
        if (isError) {
            // Error styling - red
            topBar.classList.remove('bg-blue-100', 'bg-green-100', 'border-blue-300', 'border-green-300');
            topBar.classList.add('bg-red-100', 'border-red-300');
            topMsg.classList.remove('text-blue-800', 'text-green-800');
            topMsg.classList.add('text-red-800');
            
            bottomBar.classList.remove('bg-gray-100', 'bg-blue-100', 'border-gray-300', 'border-blue-300');
            bottomBar.classList.add('bg-red-100', 'border-red-300');
            bottomMsg.classList.remove('text-gray-700', 'text-blue-700');
            bottomMsg.classList.add('text-red-700');
        } else if (message === 'Go On') {
            // Success styling - green
            topBar.classList.remove('bg-blue-100', 'bg-red-100', 'border-blue-300', 'border-red-300');
            topBar.classList.add('bg-green-100', 'border-green-300');
            topMsg.classList.remove('text-blue-800', 'text-red-800');
            topMsg.classList.add('text-green-800');
            
            bottomBar.classList.remove('bg-gray-100', 'bg-red-100', 'border-gray-300', 'border-red-300');
            bottomBar.classList.add('bg-green-100', 'border-green-300');
            bottomMsg.classList.remove('text-gray-700', 'text-red-700');
            bottomMsg.classList.add('text-green-700');
        } else {
            // Normal/neutral styling - blue
            topBar.classList.remove('bg-green-100', 'bg-red-100', 'border-green-300', 'border-red-300');
            topBar.classList.add('bg-blue-100', 'border-blue-300');
            topMsg.classList.remove('text-green-800', 'text-red-800');
            topMsg.classList.add('text-blue-800');
            
            bottomBar.classList.remove('bg-green-100', 'bg-red-100', 'border-green-300', 'border-red-300');
            bottomBar.classList.add('bg-gray-100', 'border-gray-300');
            bottomMsg.classList.remove('text-green-700', 'text-red-700');
            bottomMsg.classList.add('text-gray-700');
        }
        
        topMsg.textContent = message;
        bottomMsg.textContent = message;
    }
    
    /**
     * Start flashing animation for rule-break error
     */
    startFlashingTile(position) {
        const [row, col] = position;
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (cell) {
            let flashInterval = setInterval(() => {
                if (cell.classList.contains('flash-off')) {
                    cell.classList.remove('flash-off');
                    cell.classList.add('flash-on');
                } else {
                    cell.classList.remove('flash-on');
                    cell.classList.add('flash-off');
                }
            }, 300);
            
            // Store interval ID so we can stop it later
            cell.dataset.flashInterval = flashInterval;
        }
    }
    
    /**
     * Stop flashing animation
     */
    stopFlashingTile(position) {
        const [row, col] = position;
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (cell && cell.dataset.flashInterval) {
            clearInterval(parseInt(cell.dataset.flashInterval));
            cell.classList.remove('flash-on', 'flash-off');
        }
    }

    /**
     * Update the visual state of the maze to reflect current game state
     */
    updateVisualState() {
        const visited = this.gameState.visitedCells;
        const [currentRow, currentCol] = this.gameState.getCurrentPosition();
        
        document.querySelectorAll('.maze-cell').forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const key = `${row},${col}`;
            const isStartOrEnd = this.isStartOrEndCell(row, col);
            const isVisited = visited.has(key);
            
            // Handle start and end cells
            if (row === 0 && col === 0) {
                // Start cell
                if (isVisited) {
                    cell.classList.remove('bg-blue-400', 'bg-gray-100');
                    cell.classList.add('bg-green-500', 'text-white');
                    cell.textContent = '✓';
                } else {
                    cell.classList.remove('bg-green-500', 'text-white');
                    cell.classList.add('bg-blue-400', 'font-bold');
                    cell.textContent = 'S';
                }
            } else if (row === this.config.gridSize - 1 && col === this.config.gridSize - 1) {
                // End cell - keep as yellow if not reached
                if (!isVisited) {
                    cell.classList.add('bg-yellow-400');
                    cell.textContent = 'E';
                }
            } else {
                // Regular cells
                cell.classList.remove('bg-red-500', 'cell-animate');
                cell.classList.add('bg-gray-100');
                cell.textContent = '';
                
                if (isVisited) {
                    cell.classList.remove('bg-gray-100');
                    cell.classList.add('bg-green-500', 'text-white');
                    cell.textContent = '✓';
                }
            }
        });
    }

    /**
     * Check if cell is start or end
     */
    isStartOrEndCell(row, col) {
        const gridSize = this.config.gridSize;
        return (row === 0 && col === 0) || (row === gridSize - 1 && col === gridSize - 1);
    }

    /**
     * Complete current trial
     */
    completeCurrentTrial() {
        const trialData = this.gameState.completeTrial();
        
        // Brief pause before next trial or results
        setTimeout(() => {
            if (this.gameState.areAllTrialsComplete()) {
                this.showResults();
            } else {
                this.startNewTrial();
            }
        }, 1000);
    }

    /**
     * Update trial info display
     */
    updateTrialInfo() {
        document.getElementById('trial-number').textContent = this.gameState.currentTrial;
        document.getElementById('error-count').textContent = this.gameState.getErrorCount();
        
        // Update elapsed time
        if (this.gameState.startTime) {
            const elapsed = Math.floor((Date.now() - this.gameState.startTime) / 1000);
            document.getElementById('elapsed-time').textContent = `${elapsed}s`;
        }
    }

    /**
     * Show results screen
     */
    showResults() {
        this.stopTimer();
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('results-screen').classList.remove('hidden');
        
        this.renderResults();
    }

    /**
     * Render results
     */
    renderResults() {
        const trials = this.gameState.getAllTrialsData();
        const report = PerformanceTracker.generateReport(trials);
        
        // Update summary
        document.getElementById('total-trials').textContent = report.totalTrials;
        document.getElementById('total-errors').textContent = report.totalErrors;
        document.getElementById('learning-index').textContent = report.learningIndex.toFixed(2);
        
        // Render chart
        this.renderErrorChart(report.errorProgression);
        
        // Render table
        this.renderResultsTable(trials);
    }

    /**
     * Render error chart
     */
    renderErrorChart(progression) {
        const chart = document.getElementById('error-chart');
        chart.innerHTML = '';
        
        const maxErrors = Math.max(...progression, 1);
        
        progression.forEach((errors, index) => {
            const bar = document.createElement('div');
            bar.className = 'bg-blue-500 flex-1 hover:bg-blue-600 transition-colors';
            const height = (errors / maxErrors) * 100;
            bar.style.height = `${height}%`;
            bar.title = `Trial ${index + 1}: ${errors} errors`;
            chart.appendChild(bar);
        });
    }

    /**
     * Render results table
     */
    renderResultsTable(trials) {
        const tbody = document.getElementById('results-table-body');
        tbody.innerHTML = '';
        
        trials.forEach(trial => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            row.innerHTML = `
                <td class="border px-4 py-2">${trial.trialNumber}</td>
                <td class="border px-4 py-2 text-center ${trial.errors > 0 ? 'text-red-600' : 'text-green-600'}">
                    ${trial.errors}
                </td>
                <td class="border px-4 py-2 text-center">
                    ${(trial.totalTime / 1000).toFixed(2)}
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    /**
     * Check if cell is in path
     */
    _isInPath(path, row, col) {
        return path.some(cell => cell[0] === row && cell[1] === col);
    }

    /**
     * Restart the game
     */
    restart() {
        this.gameState = new GameState(this.config);
        document.getElementById('results-screen').classList.add('hidden');
        document.getElementById('instructions-screen').classList.remove('hidden');
    }

    /**
     * Download results as JSON
     */
    downloadResults() {
        const data = {
            timestamp: Date.now(),
            config: this.config,
            trials: this.gameState.getAllTrialsData(),
            report: PerformanceTracker.generateReport(this.gameState.getAllTrialsData())
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gmlt-results-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

