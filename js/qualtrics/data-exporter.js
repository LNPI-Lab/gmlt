/**
 * QualtricsDataExporter
 * Formats trial/session data for Qualtrics embedded data ingestion
 */

class QualtricsDataExporter {
    /**
     * Export trials and summary into a compact JSON string
     * @param {Array} trials
     * @returns {string}
     */
    exportTrialData(trials) {
        const payload = {
            totalErrors: this._calculateTotalErrors(trials),
            legalErrors: this._calculateByKey(trials, 'legalErrors'),
            perseverativeErrors: this._calculateByKey(trials, 'perseverativeErrors'),
            ruleBreakErrors: this._calculateByKey(trials, 'ruleBreakErrors'),
            trialData: this._formatTrialData(trials),
            summary: this._generateSummary(trials)
        };
        return JSON.stringify(payload);
    }

    _formatTrialData(trials) {
        return trials.map((t, i) => ({
            trialNumber: i + 1,
            errors: t.errors,
            time: t.totalTime,
            legalErrors: t.legalErrors,
            perseverativeErrors: t.perseverativeErrors,
            ruleBreakErrors: t.ruleBreakErrors
        }));
    }

    _generateSummary(trials) {
        const totalErrors = this._calculateTotalErrors(trials);
        const avgTime = trials.length ? Math.round(trials.reduce((s, t) => s + (t.totalTime || 0), 0) / trials.length) : 0;
        const learningIndex = trials.length > 1 ? (trials[0].errors || 0) - (trials[trials.length - 1].errors || 0) : 0;
        return { totalErrors, avgTime, learningIndex };
    }

    _calculateTotalErrors(trials) {
        return this._calculateByKey(trials, 'errors');
    }

    _calculateByKey(trials, key) {
        return trials.reduce((sum, t) => sum + (t[key] || 0), 0);
    }
}


