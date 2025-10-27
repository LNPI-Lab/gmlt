/**
 * Performance Tracker
 * Calculates performance metrics and learning indices
 */

class PerformanceTracker {
    /**
     * Calculate total errors across all trials
     */
    static calculateTotalErrors(trials) {
        return trials.reduce((sum, trial) => sum + trial.errors, 0);
    }

    /**
     * Calculate average errors per trial
     */
    static calculateAverageErrors(trials) {
        if (trials.length === 0) return 0;
        return this.calculateTotalErrors(trials) / trials.length;
    }

    /**
     * Calculate learning index (error reduction)
     * Returns a value between 0 and 1, higher = better learning
     */
    static calculateLearningIndex(trials) {
        if (trials.length < 2) return 0;
        
        const firstHalf = trials.slice(0, Math.ceil(trials.length / 2));
        const secondHalf = trials.slice(Math.ceil(trials.length / 2));
        
        const firstAvg = this.calculateAverageErrors(firstHalf);
        const secondAvg = this.calculateAverageErrors(secondHalf);
        
        if (firstAvg === 0) return 1;
        
        const reduction = (firstAvg - secondAvg) / firstAvg;
        return Math.max(0, Math.min(1, reduction));
    }

    /**
     * Calculate total time across all trials
     */
    static calculateTotalTime(trials) {
        return trials.reduce((sum, trial) => sum + trial.totalTime, 0);
    }

    /**
     * Get error progression data for charting
     */
    static getErrorProgression(trials) {
        return trials.map(trial => trial.errors);
    }

    /**
     * Calculate average time per trial
     */
    static calculateAverageTime(trials) {
        if (trials.length === 0) return 0;
        return this.calculateTotalTime(trials) / trials.length / 1000; // Convert to seconds
    }

    /**
     * Generate performance report
     */
    static generateReport(trials) {
        return {
            totalTrials: trials.length,
            totalErrors: this.calculateTotalErrors(trials),
            averageErrors: this.calculateAverageErrors(trials),
            totalTime: this.calculateTotalTime(trials),
            averageTime: this.calculateAverageTime(trials),
            learningIndex: this.calculateLearningIndex(trials),
            errorProgression: this.getErrorProgression(trials),
            worstTrial: trials.reduce((worst, current) => 
                current.errors > worst.errors ? current : worst, trials[0]),
            bestTrial: trials.reduce((best, current) => 
                current.errors < best.errors ? current : best, trials[0])
        };
    }
}

