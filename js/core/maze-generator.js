/**
 * Maze Generator
 * Generates a valid maze path for GMLT trials
 */

class MazeGenerator {
    constructor(gridSize) {
        this.gridSize = gridSize;
    }

    /**
     * Generate a valid maze path from start to end
     * Uses a deterministic approach to create a fair path
     * @returns {Array} Array of [row, col] coordinates representing the path
     */
    generatePath() {
        const start = [0, 0];
        const end = [this.gridSize - 1, this.gridSize - 1];
        
        // Use iterative depth-first approach with goal-oriented movement
        const path = [[0, 0]];
        const visited = new Set(['0,0']);
        
        let current = [0, 0];
        let steps = 0;
        const maxSteps = this.gridSize * this.gridSize * 2;
        
        while (steps < maxSteps) {
            if (current[0] === end[0] && current[1] === end[1]) {
                break;
            }
            
            const neighbors = this._getValidNeighbors(current, visited, end);
            
            if (neighbors.length === 0) {
                // If stuck, backtrack
                path.pop();
                if (path.length === 0) {
                    break;
                }
                current = path[path.length - 1];
                const key = `${current[0]},${current[1]}`;
                visited.add(key);
            } else {
                // Choose best neighbor
                const next = neighbors[0];
                path.push(next);
                current = next;
                const key = `${next[0]},${next[1]}`;
                visited.add(key);
            }
            
            steps++;
        }
        
        // Ensure we reach the end
        if (path[path.length - 1][0] !== end[0] || path[path.length - 1][1] !== end[1]) {
            // If we didn't reach the end, add the remaining path
            const last = path[path.length - 1];
            const row = last[0];
            const col = last[1];
            
            // Move to end
            for (let r = row; r < end[0]; r++) {
                path.push([r + 1, col]);
            }
            for (let c = col; c < end[1]; c++) {
                path.push([end[0], c + 1]);
            }
        }
        
        return path;
    }


    /**
     * Get valid neighboring cells
     * @private
     */
    _getValidNeighbors(cell, visited, end) {
        const [row, col] = cell;
        const neighbors = [];
        
        // Check right and down more often to avoid trivial solutions
        const directions = [
            [0, 1], [1, 0],  // Right, Down (preferred)
            [-1, 0], [0, -1] // Up, Left (less preferred)
        ];
        
        // Shuffle to add variety, but bias towards goal direction
        if (Math.random() < 0.5) {
            directions.reverse();
        }
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            // Check bounds
            if (newRow >= 0 && newRow < this.gridSize && 
                newCol >= 0 && newCol < this.gridSize) {
                
                const key = `${newRow},${newCol}`;
                if (!visited.has(key)) {
                    neighbors.push([newRow, newCol]);
                }
            }
        }
        
        return neighbors;
    }

    /**
     * Generate a simple valid path as fallback
     * @private
     */
    _generateSimplePath(start, end) {
        const path = [start];
        let [row, col] = start;
        
        // Create a zigzag path
        const rowDiff = end[0] - row;
        const colDiff = end[1] - col;
        
        // Move towards end
        while (row !== end[0] || col !== end[1]) {
            const random = Math.random();
            
            if (row < end[0] && (col === end[1] || random < 0.5)) {
                row++;
            } else if (col < end[1]) {
                col++;
            } else if (row > end[0]) {
                row--;
            } else if (col > end[1]) {
                col--;
            }
            
            path.push([row, col]);
        }
        
        return path;
    }

    /**
     * Calculate Manhattan distance between two points
     * @private
     */
    _manhattanDistance(a, b) {
        return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
    }

    /**
     * Generate a random path for variety
     * Adds some randomness while maintaining validity
     */
    generateRandomPath() {
        // Shuffle neighbors occasionally to add variety
        const path = this.generatePath();
        
        // Validate path
        if (!this._validatePath(path)) {
            // If path is invalid, generate a simple fallback
            return this._generateSimplePath([0, 0], [this.gridSize - 1, this.gridSize - 1]);
        }
        
        return path;
    }

    /**
     * Validate that path is continuous and ends at goal
     * @private
     */
    _validatePath(path) {
        if (!path || path.length === 0) return false;
        
        const start = [0, 0];
        const end = [this.gridSize - 1, this.gridSize - 1];
        
        // Check start
        if (path[0][0] !== start[0] || path[0][1] !== start[1]) return false;
        
        // Check end
        const last = path[path.length - 1];
        if (last[0] !== end[0] || last[1] !== end[1]) return false;
        
        // Check continuity
        for (let i = 1; i < path.length; i++) {
            const prev = path[i - 1];
            const curr = path[i];
            const rowDiff = Math.abs(curr[0] - prev[0]);
            const colDiff = Math.abs(curr[1] - prev[1]);
            
            if (!((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1))) {
                return false;
            }
        }
        
        return true;
    }
}

