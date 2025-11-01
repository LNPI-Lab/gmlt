/**
 * Maze Generator
 * Generates a valid maze path for GMLT trials
 */

class MazeGenerator {
    constructor(gridSize) {
        this.gridSize = gridSize;
    }

    /**
     * Generate a valid maze path from start to end using a loop-free layout.
     * @returns {Array} Array of [row, col] coordinates representing the path
     */
    generatePath() {
        const path = this._generateSessionPath();
        if (this._validatePath(path)) {
            return path;
        }

        const fallback = this._generateSerpentinePath();
        if (!this._validatePath(fallback)) {
            throw new Error('MazeGenerator failed to create a valid path');
        }
        return fallback;
    }
    
    /**
     * Legacy generatePath method (kept for reference but not used)
     * @deprecated
     */
    _generatePathOld() {
        const start = [0, 0];
        const end = [this.gridSize - 1, this.gridSize - 1];
        const targetLength = 28; // Fixed path length
        
        // Use iterative depth-first approach with goal-oriented movement
        const path = [[0, 0]];
        const visited = new Set(['0,0']);
        
        let current = [0, 0];
        let steps = 0;
        const maxSteps = this.gridSize * this.gridSize * 2;
        
        while (steps < maxSteps && path.length < targetLength) {
            // If we've reached the end before target length, we need to pad
            if (current[0] === end[0] && current[1] === end[1]) {
                // If we're at the end and path is too short, backtrack to add more cells
                if (path.length < targetLength) {
                    path.pop();
                    const backtrackCell = path[path.length - 1];
                    current = backtrackCell;
                    visited.delete(`${end[0]},${end[1]}`);
                } else {
                    break;
                }
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
                
                // If this is the end and we have the right length, we're done
                if (current[0] === end[0] && current[1] === end[1] && path.length === targetLength) {
                    break;
                }
            }
            
            steps++;
        }
        
        // If path is too short, try to extend it
        if (path.length < targetLength) {
            while (path.length < targetLength) {
                const lastCell = path[path.length - 1];
                const neighbors = this._getValidNeighbors(lastCell, visited, end);
                if (neighbors.length > 0) {
                    const next = neighbors[0];
                    path.push(next);
                    visited.add(`${next[0]},${next[1]}`);
                } else {
                    break;
                }
            }
        }
        
        // If path is too long, trim it to target length
        if (path.length > targetLength) {
            path.splice(targetLength);
            // If trimmed path doesn't end at target, add final path to end
            const last = path[path.length - 1];
            if (last[0] !== end[0] || last[1] !== end[1]) {
                const row = last[0];
                const col = last[1];
                let added = false;
                
                // Move to end
                for (let r = row; r < end[0]; r++) {
                    path.push([r + 1, col]);
                    if (path.length >= targetLength) {
                        break;
                    }
                }
                if (path.length < targetLength) {
                    for (let c = col; c < end[1]; c++) {
                        path.push([end[0], c + 1]);
                        if (path.length >= targetLength) {
                            break;
                        }
                    }
                }
            }
        }
        
        // Trim to exactly 28 steps while ensuring we end at goal
        if (path.length > targetLength) {
            path.splice(targetLength);
        }
        
        // Ensure last cell is the end
        if (path[path.length - 1][0] !== end[0] || path[path.length - 1][1] !== end[1]) {
            // Replace last few cells with path to end
            const distToEnd = Math.abs(end[0] - path[path.length - 1][0]) + Math.abs(end[1] - path[path.length - 1][1]);
            while (distToEnd + path.length > targetLength && path.length > 0) {
                path.pop();
            }
            
            // Add path to end
            const last = path[path.length - 1];
            const row = last[0];
            const col = last[1];
            
            let r = row;
            let c = col;
            
            while (path.length < targetLength - 1 && (r < end[0] || c < end[1])) {
                if (r < end[0]) {
                    r++;
                    path.push([r, c]);
                } else if (c < end[1]) {
                    c++;
                    path.push([r, c]);
                } else {
                    break;
                }
            }
        }
        
        // Final check: ensure exactly targetLength and ends at goal
        if (path.length !== targetLength || path[path.length - 1][0] !== end[0] || path[path.length - 1][1] !== end[1]) {
            // Fallback: generate a deterministic path of exactly 28 steps
            const fallbackPath = this._generateExactLengthPath(targetLength);
            console.log(`[MazeGenerator] Using fallback path, length: ${fallbackPath.length}`);
            return fallbackPath;
        }
        
        console.log(`[MazeGenerator] Generated path of exact length: ${path.length}`);
        return path;
    }
    
    /**
     * Generate a path of exactly the specified length from start to end
     * Uses a simple deterministic approach to ensure exactly targetLength steps
     * @private
     */
    _generateExactLengthPath(targetLength) {
        const end = [this.gridSize - 1, this.gridSize - 1];
        const path = [[0, 0]];
        
        // Generate a winding path that ends at the goal
        // We'll explore in a pattern, then ensure we end at the goal in the last few steps
        const exploreSteps = targetLength - (this.gridSize - 1 + this.gridSize - 1); // Steps to use for exploration
        
        let row = 0, col = 0;
        const visited = new Set(['0,0']);
        let explorationCount = 0;
        let zigzag = true;
        
        // Explore maze until we need to head to the goal
        while (path.length < exploreSteps + 5) {
            const neighbors = this._getValidNeighbors([row, col], visited, [0, 0]);
            
            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                row = next[0];
                col = next[1];
                path.push([row, col]);
                visited.add(`${row},${col}`);
            } else if (path.length > 1) {
                path.pop();
                const lastCell = path[path.length - 1];
                row = lastCell[0];
                col = lastCell[1];
            } else {
                break;
            }
        }
        
        // Now ensure we have exactly targetLength steps ending at goal
        // Trim if too long
        if (path.length >= targetLength) {
            path.splice(targetLength);
        }
        
        // Ensure we end at goal
        const last = path[path.length - 1];
        const distToEnd = Math.abs(end[0] - last[0]) + Math.abs(end[1] - last[1]);
        const stepsNeeded = targetLength - path.length;
        
        if (stepsNeeded >= distToEnd) {
            // Can reach goal in remaining steps
            let r = last[0], c = last[1];
            while ((r < end[0] || c < end[1]) && path.length < targetLength) {
                if (r < end[0]) r++;
                else if (c < end[1]) c++;
                path.push([r, c]);
            }
        } else {
            // Not enough steps - generate a simple deterministic path
            path.length = 1; // Keep [0,0]
            let r = 0, c = 0;
            
            // Generate a simple zigzag path
            let moveRight = true;
            
            while (path.length < targetLength - 1) {
                if (moveRight && c < end[1]) {
                    c++;
                    path.push([r, c]);
                    moveRight = false;
                } else if (!moveRight && r < end[0]) {
                    r++;
                    path.push([r, c]);
                    moveRight = true;
                } else if (r < end[0]) {
                    r++;
                    path.push([r, c]);
                } else {
                    break;
                }
            }
            
            // Ensure last cell is goal
            if (path[path.length - 1][0] !== end[0] || path[path.length - 1][1] !== end[1]) {
                path.push([end[0], end[1]]);
            }
            
            // Adjust to exactly targetLength if needed
            if (path.length < targetLength) {
                // Add small loops to pad
                const last = path[path.length - 1];
                while (path.length < targetLength) {
                    const neighbors = this._getValidNeighbors(last, new Set(), [end[0], end[1]]);
                    if (neighbors.length > 0) {
                        const next = neighbors[0];
                        path.splice(path.length - 1, 0, next); // Insert before last
                    } else {
                        break;
                    }
                }
            } else if (path.length > targetLength) {
                path.splice(targetLength);
                path[path.length - 1] = [end[0], end[1]]; // Ensure end at goal
            }
        }
        
        console.log(`[MazeGenerator] Generated path of length ${path.length}, ending at [${path[path.length - 1]}]`);
        
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
        return this.generatePath();
    }

    /**
     * Validate that path is continuous and ends at goal
     * @private
     */
    _validatePath(path) {
        if (!path || path.length === 0) return false;
        
        const start = [0, 0];
        const end = [this.gridSize - 1, this.gridSize - 1];
        const visited = new Set([`${start[0]},${start[1]}`]);
        
        // Check start
        if (path[0][0] !== start[0] || path[0][1] !== start[1]) return false;
        
        // Check end
        const last = path[path.length - 1];
        if (last[0] !== end[0] || last[1] !== end[1]) return false;
        
        // Check continuity
        for (let i = 1; i < path.length; i++) {
            const prev = path[i - 1];
            const curr = path[i];
            const key = `${curr[0]},${curr[1]}`;
            if (visited.has(key)) {
                return false;
            }
            visited.add(key);
            const rowDiff = Math.abs(curr[0] - prev[0]);
            const colDiff = Math.abs(curr[1] - prev[1]);
            
            if (!((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1))) {
                return false;
            }
        }
        
        return true;
    }
    /**
     * Attempt to generate a randomized, loop-free path for the current session.
     * @private
     */
    _generateSessionPath() {
        const minLength = (this.gridSize - 1) * 2 + 1; // Minimum cells including start
        const maxLength = Math.min(this.gridSize * this.gridSize, minLength + 14);

        for (let target = maxLength; target >= minLength; target--) {
            const attempt = this._findPathWithLength(target);
            if (attempt.length > 0 && this._validatePath(attempt)) {
                return attempt;
            }
        }

        return [];
    }

    /**
     * Find a single path of the specified length using DFS with backtracking.
     * @private
     */
    _findPathWithLength(targetLength) {
        const start = [0, 0];
        const end = [this.gridSize - 1, this.gridSize - 1];
        const path = [[...start]];
        const visited = new Set([`${start[0]},${start[1]}`]);

        const success = this._searchPath(start, end, targetLength, path, visited);
        return success ? path : [];
    }

    /**
     * Depth-first search helper for building a path of fixed length.
     * @private
     */
    _searchPath(current, end, targetLength, path, visited) {
        if (path.length === targetLength) {
            return current[0] === end[0] && current[1] === end[1];
        }

        const remaining = targetLength - path.length;
        const neighbors = this._getAdjacentCells(current);
        this._shuffle(neighbors);

        for (const neighbor of neighbors) {
            const key = `${neighbor[0]},${neighbor[1]}`;
            if (visited.has(key)) continue;

            const distanceToEnd = this._manhattanDistance(neighbor, end);
            if (distanceToEnd > remaining - 1) continue;

            // Ensure parity feasibility: remaining steps after moving must align with distance to goal
            if (((remaining - 1 - distanceToEnd) & 1) !== 0) continue;

            visited.add(key);
            path.push(neighbor);

            if (this._searchPath(neighbor, end, targetLength, path, visited)) {
                return true;
            }

            path.pop();
            visited.delete(key);
        }

        return false;
    }

    /**
     * Retrieve adjacent cells within bounds.
     * @private
     */
    _getAdjacentCells(cell) {
        const [row, col] = cell;
        const neighbors = [];
        const directions = [
            [1, 0], [-1, 0],
            [0, 1], [0, -1]
        ];

        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;

            if (newRow >= 0 && newRow < this.gridSize && newCol >= 0 && newCol < this.gridSize) {
                neighbors.push([newRow, newCol]);
            }
        }

        return neighbors;
    }

    /**
     * Shuffle an array in place.
     * @private
     */
    _shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    /**
     * Generate a serpentine path that covers the grid without loops.
     * Used as a fallback for non-standard grid sizes.
     * @private
     */
    _generateSerpentinePath() {
        const path = [[0, 0]];
        const targetRow = this.gridSize - 1;
        const targetCol = this.gridSize - 1;
        let row = 0;
        let col = 0;

        for (let currentCol = 0; currentCol < this.gridSize; currentCol++) {
            // Handle final column explicitly to guarantee the end position
            if (currentCol === targetCol) {
                while (row < targetRow) {
                    row++;
                    path.push([row, currentCol]);
                }
                while (row > targetRow) {
                    row--;
                    path.push([row, currentCol]);
                }
                break;
            }

            if (currentCol % 2 === 0) {
                while (row < targetRow) {
                    row++;
                    path.push([row, currentCol]);
                }
            } else {
                while (row > 0) {
                    row--;
                    path.push([row, currentCol]);
                }
            }

            col = currentCol + 1;
            path.push([row, col]);
        }

        const last = path[path.length - 1];
        if (last[0] !== targetRow || last[1] !== targetCol) {
            while (col < targetCol) {
                col++;
                path.push([row, col]);
            }
            while (row < targetRow) {
                row++;
                path.push([row, col]);
            }
        }

        return path;
    }
}

