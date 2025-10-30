/**
 * QualtricsHandler
 * Handles Qualtrics-specific survey interactions and data submission
 */

class QualtricsHandler {
    constructor() {
        this.initialized = false;
        this.surveyId = null;
        this.responseId = null;
    }

    /**
     * Initialize Qualtrics environment context, if available
     */
    initialize() {
        if (typeof Qualtrics !== 'undefined' && Qualtrics.SurveyEngine) {
            try {
                this.surveyId = Qualtrics.SurveyEngine.getSurveyId && Qualtrics.SurveyEngine.getSurveyId();
                this.responseId = Qualtrics.SurveyEngine.getResponseId && Qualtrics.SurveyEngine.getResponseId();
            } catch (e) {
                // Best-effort capture; proceed even if unavailable
            }
            this.initialized = true;
        } else {
            this.initialized = false;
        }
    }

    /**
     * Submit data to Qualtrics embedded data fields and advance the survey
     * @param {object} data - Serializable results object
     */
    submitData(data) {
        if (!this.initialized) return;
        try {
            const json = JSON.stringify(data);
            Qualtrics.SurveyEngine.setEmbeddedData('gmlt_results', json);
            Qualtrics.SurveyEngine.setEmbeddedData('gmlt_complete', '1');
            this._clickNextButton();
        } catch (e) {
            // Swallow errors to avoid blocking UI, but don't crash
        }
    }

    /**
     * Read a Qualtrics embedded data value
     * @param {string} key
     * @returns {string|null}
     */
    getEmbeddedData(key) {
        if (!this.initialized) return null;
        try {
            return Qualtrics.SurveyEngine.getEmbeddedData(key);
        } catch (e) {
            return null;
        }
    }

    _clickNextButton() {
        const button = document.getElementById('NextButton');
        if (button && typeof button.click === 'function') {
            button.click();
        }
    }
}


