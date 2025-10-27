# Qualtrics Integration Plan for GMLT (Groton Maze Learning Test)

## Overview
This document outlines the plan for integrating the Groton Maze Learning Test (GMLT) implementation into Qualtrics surveys. The GMLT is designed to measure spatial working memory, learning efficiency, and error monitoring.

## Current Implementation Status

### Technical Stack
- **Framework**: Vanilla JavaScript (no dependencies)
- **Styling**: Tailwind CSS (via CDN)
- **Architecture**: Modular, event-driven design
- **Browser Compatibility**: Modern browsers (ES6+)

### Key Features
- 10x10 grid maze
- 5 consecutive learning trials
- Path length: Exactly 28 steps
- Real-time error tracking (legal, perseverative, rule-break errors)
- Performance metrics collection
- Responsive design (mobile, tablet, desktop)
- Comprehensive data logging with timestamps

## Integration Objectives

1. **Embed GMLT in Qualtrics surveys**
2. **Capture and export trial data**
3. **Display results within Qualtrics**
4. **Maintain data integrity and participant anonymity**
5. **Ensure mobile and desktop compatibility**

## Phase 1: Preparation and File Hosting

### 1.1 File Organization
```
gmlt-qualtrics-integration/
├── index.html (modified for Qualtrics)
├── js/
│   ├── config/task-config.js
│   ├── core/
│   │   ├── maze-generator.js
│   │   ├── game-state.js
│   │   └── performance-tracker.js
│   ├── ui/game-controller.js
│   └── qualtrics/
│       ├── qualtrics-handler.js (NEW)
│       └── data-exporter.js (NEW)
├── css/
│   └── gmlt-styles.css (standalone styles)
└── README.md
```

### 1.2 Hosting Options

**Option A: Qualtrics File Library**
- Upload files to Qualtrics file library
- Access via File Library URLs
- **Pros**: Simple, no external dependencies
- **Cons**: Slower load times, subject to Qualtrics limits

**Option B: CDN Hosting**
- Host on AWS S3/CloudFront, GitHub Pages, or similar
- **Pros**: Faster performance, scalable
- **Cons**: Additional setup, potential costs

**Option C: Inline Embedding**
- Convert HTML/JS to inline code blocks
- **Pros**: No external dependencies
- **Cons**: More complex maintenance, file size limits

**Recommended**: Option A for initial deployment, migrate to Option B for production

### 1.3 Code Modifications for Qualtrics

#### 1.3.1 Remove Tailwind CDN Dependency
- Extract all Tailwind classes to custom CSS
- Create `css/gmlt-styles.css` with extracted styles
- Update HTML to use local stylesheet

#### 1.3.2 Qualtrics-Specific Handler
Create `js/qualtrics/qualtrics-handler.js`:
```javascript
// Handle Qualtrics survey flow
class QualtricsHandler {
    constructor() {
        this.initialized = false;
        this.results = null;
    }
    
    initialize() {
        // Detect Qualtrics environment
        if (typeof Qualtrics !== 'undefined') {
            this.surveyId = Qualtrics.SurveyEngine.getSurveyId();
            this.responseId = Qualtrics.SurveyEngine.getResponseId();
        }
    }
    
    submitData(data) {
        // Submit data to Qualtrics embedded data
        Qualtrics.SurveyEngine.setEmbeddedData('gmlt_results', JSON.stringify(data));
        // Advance to next block
        Qualtrics.SurveyEngine.setEmbeddedData('gmlt_complete', '1');
        this.clickNextButton();
    }
    
    clickNextButton() {
        this.button = document.getElementById('NextButton');
        this.button.click();
    }
    
    getEmbeddedData(key) {
        return Qualtrics.SurveyEngine.getEmbeddedData(key);
    }
}
```

#### 1.3.3 Data Exporter
Create `js/qualtrics/data-exporter.js`:
```javascript
// Export trial data in Qualtrics-compatible format
class QualtricsDataExporter {
    exportTrialData(trials) {
        const data = {
            totalErrors: this.calculateTotalErrors(trials),
            legalErrors: this.calculateLegalErrors(trials),
            perseverativeErrors: this.calculatePerseverativeErrors(trials),
            ruleBreakErrors: this.calculateRuleBreakErrors(trials),
            trialData: this.formatTrialData(trials),
            summary: this.generateSummary(trials)
        };
        return JSON.stringify(data);
    }
    
    formatTrialData(trials) {
        // Format for Qualtrics CSV export
        return trials.map((trial, index) => {
            return {
                trialNumber: index + 1,
                errors: trial.errors,
                time: trial.totalTime,
                legalErrors: trial.legalErrors,
                perseverativeErrors: trial.perseverativeErrors,
                ruleBreakErrors: trial.ruleBreakErrors
            };
        });
    }
    
    generateSummary(trials) {
        const totalErrors = trials.reduce((sum, t) => sum + t.errors, 0);
        const avgTime = trials.reduce((sum, t) => sum + t.totalTime, 0) / trials.length;
        const learningIndex = trials[0].errors - trials[trials.length - 1].errors;
        
        return {
            totalErrors,
            avgTime,
            learningIndex,
            improvement: trials.length > 1 ? trials[0].errors - trials[trials.length - 1].errors : 0
        };
    }
}
```

## Phase 2: Qualtrics Survey Setup

### 2.1 Block Structure
```
1. Consent and Instructions Block
2. GMLT Task Block (Embedded HTML)
3. Debriefing Block
```

### 2.2 Survey Flow

#### Block 1: Instructions
- Display task instructions
- Include practice opportunity (optional)
- Set embedded data: `gmlt_start_time = Date.now()`

#### Block 2: GMLT Task
- Embed custom HTML block
- Include all JS/CSS files
- Monitor completion status

#### Block 3: Debriefing/Next Section
- Display completion message
- Store results in embedded data

### 2.3 Embedded Data Variables

Create the following embedded data fields in Qualtrics:

```javascript
// Trial-level data
gmlt_trial_1_errors
gmlt_trial_1_time
gmlt_trial_1_legal_errors
gmlt_trial_1_perseverative_errors
gmlt_trial_1_rulebreak_errors

gmlt_trial_2_errors
// ... repeat for trials 1-5

// Summary data
gmlt_total_errors
gmlt_avg_time
gmlt_learning_index
gmlt_legal_errors_total
gmlt_perseverative_errors_total
gmlt_rulebreak_errors_total

// Complete JSON export
gmlt_results_json
gmlt_moves_data
gmlt_start_timestamp
gmlt_end_timestamp
```

## Phase 3: HTML/JS Modifications

### 3.1 Modify index.html for Qualtrics

Key changes:
1. Remove instructions screen (handled in Qualtrics block)
2. Auto-start on page load
3. Add Qualtrics handler integration
4. Implement survey navigation controls

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GMLT Task</title>
    <link rel="stylesheet" href="css/gmlt-styles.css">
</head>
<body>
    <div id="app">
        <!-- Game Screen Only -->
        <div id="game-screen">
            <!-- Existing game screen content -->
        </div>
    </div>
    
    <!-- Load all scripts -->
    <script src="js/config/task-config.js"></script>
    <script src="js/core/maze-generator.js"></script>
    <script src="js/core/performance-tracker.js"></script>
    <script src="js/core/game-state.js"></script>
    <script src="js/ui/game-controller.js"></script>
    <script src="js/qualtrics/qualtrics-handler.js"></script>
    <script src="js/qualtrics/data-exporter.js"></script>
    <script src="js/main.js"></script>
    
    <script>
        // Initialize with Qualtrics integration
        document.addEventListener('DOMContentLoaded', () => {
            const handler = new QualtricsHandler();
            handler.initialize();
            
            const controller = new GameController();
            controller.onComplete = (results) => {
                handler.submitData(results);
            };
        });
    </script>
</body>
</html>
```

### 3.2 Modify Game Controller

Add Qualtrics completion callback:
```javascript
class GameController {
    constructor() {
        this.config = TASK_CONFIG;
        this.mazeGenerator = new MazeGenerator(this.config.gridSize);
        this.gameState = new GameState(this.config);
        this.qualtricsHandler = new QualtricsHandler();
        this.onComplete = null; // Callback for when all trials complete
    }
    
    showResults() {
        // ... existing results display ...
        
        // Prepare data for Qualtrics
        if (this.onComplete) {
            const data = this.prepareQualtricsData();
            this.onComplete(data);
        }
    }
    
    prepareQualtricsData() {
        return {
            trials: this.gameState.getAllTrialsData(),
            summary: {
                totalErrors: this.calculateTotalErrors(),
                avgTime: this.calculateAvgTime(),
                learningIndex: this.calculateLearningIndex()
            },
            timestamp: Date.now()
        };
    }
}
```

### 3.3 Modify auto-start behavior

Remove manual start button, auto-start on load:
```javascript
class GameController {
    constructor() {
        // ... existing code ...
        
        // Auto-start first trial in Qualtrics environment
        this.initializeForQualtrics();
    }
    
    initializeForQualtrics() {
        // Skip instructions, start immediately
        document.getElementById('instructions-screen').remove();
        document.getElementById('game-screen').classList.remove('hidden');
        this.startNewTrial();
    }
}
```

## Phase 4: Data Collection and Export

### 4.1 Data Structure

Each trial will store:
```json
{
  "trialNumber": 1,
  "startTimestamp": 1234567890,
  "endTimestamp": 1234567891,
  "errors": 3,
  "legalErrors": 1,
  "perseverativeErrors": 1,
  "ruleBreakErrors": 1,
  "totalTime": 45000,
  "moves": [
    {
      "position": [0,0],
      "correct": true,
      "time": 0,
      "timestamp": 1234567890
    },
    // ... more moves
  ]
}
```

### 4.2 Export Methods

#### Method 1: Embedded Data (Recommended)
- Store complete JSON in `gmlt_results_json`
- Store individual fields for each trial
- Accessible in survey reports and exports

#### Method 2: JavaScript variables
```javascript
// In survey completion
Qualtrics.SurveyEngine.setEmbeddedData('gmlt_trial_1_errors', errorCount);
```

#### Method 3: CSV-friendly format
- Export individual fields that can be pivoted
- Each trial as separate columns
- Summary metrics as additional columns

### 4.3 Data Privacy Considerations

- No personally identifiable information in game data
- All timestamps relative to session start
- Participant ID handled by Qualtrics
- Exported data includes only performance metrics

## Phase 5: Mobile Compatibility

### 5.1 Testing Checklist
- [ ] Touch targets minimum 44x44px
- [ ] Swipe gestures disabled
- [ ] Zoom disabled: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
- [ ] Responsive grid sizing
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Test on tablets

### 5.2 Mobile-Specific Modifications
- Ensure cells are large enough for touch
- Add touch event handlers if needed
- Disable context menu on long press
- Optimize for mobile data usage

## Phase 6: Testing and Validation

### 6.1 Functional Testing
- [ ] All 5 trials complete successfully
- [ ] Errors tracked correctly
- [ ] Data exports to Qualtrics
- [ ] Navigation between blocks works
- [ ] Results display correctly

### 6.2 Performance Testing
- [ ] Load time < 2 seconds
- [ ] Smooth animations
- [ ] No memory leaks
- [ ] Browser compatibility

### 6.3 User Testing
- [ ] Understandable instructions
- [ ] Intuitive interface
- [ ] Clear error feedback
- [ ] Mobile usability

## Phase 7: Deployment

### 7.1 Pre-Deployment Checklist
- [ ] All files uploaded to Qualtrics file library
- [ ] Embedded data fields created
- [ ] Survey flow tested
- [ ] Mobile devices tested
- [ ] Data export verified

### 7.2 Deployment Steps

1. **Upload files to Qualtrics file library**
   - Upload index.html
   - Upload all JS files
   - Upload CSS file

2. **Create survey blocks**
   - Create Instructions block
   - Create GMLT Task block (custom HTML)
   - Create Debriefing block

3. **Set up embedded data**
   - Add all required embedded data fields
   - Set initial values where needed

4. **Configure survey settings**
   - Set random order if multiple conditions
   - Configure display logic
   - Set completion logic

5. **Test in Survey Preview**
   - Complete full flow
   - Verify data collection
   - Check mobile view

6. **Pilot testing**
   - Run 5-10 pilot sessions
   - Verify data integrity
   - Collect user feedback

### 7.3 Post-Deployment Monitoring
- Monitor error rates
- Check data completeness
- Collect user feedback
- Track technical issues

## Phase 8: Data Analysis Integration

### 8.1 Export Format
Qualtrics can export data in multiple formats:

#### CSV Export Structure
```
ResponseId|StartDate|GMLT_Total_Errors|GMLT_Avg_Time|GMLT_Trial_1_Errors|...
123456|2024-01-15|12|45000|3|2|2|2|3|...
```

#### SPSS/R Export
Use Qualtrics export functionality to import into analysis software.

### 8.2 Key Metrics to Export
- Total errors across all trials
- Errors per trial (1-5)
- Average completion time per trial
- Learning index (error reduction)
- Error type breakdown (legal, perseverative, rule-break)
- Total completion time
- Individual move sequences (optional)

## Implementation Timeline

### Week 1: Preparation
- Extract Tailwind to CSS
- Create Qualtrics handler files
- Modify index.html
- Test standalone version

### Week 2: Integration
- Upload files to Qualtrics
- Create survey blocks
- Configure embedded data
- Build survey flow

### Week 3: Testing
- Internal testing
- Mobile testing
- User acceptance testing
- Data export verification

### Week 4: Deployment
- Pilot testing
- Bug fixes
- Final deployment
- Documentation

## Technical Considerations

### Browser Compatibility
- **Minimum**: Chrome 80+, Safari 13+, Firefox 75+, Edge 80+
- **Mobile**: iOS 13+, Android 8+

### Performance Targets
- Initial load: < 2 seconds
- Trial start: < 500ms
- Cell click response: < 50ms
- Data export: < 1 second

### Security Considerations
- No external API calls
- All code hosted within Qualtrics
- HTTPS required
- No participant data stored in client

## Troubleshooting

### Common Issues

**Issue**: Game doesn't load
- **Solution**: Check file library paths
- Verify all JS files uploaded
- Check browser console for errors

**Issue**: Data not saving
- **Solution**: Verify embedded data fields exist
- Check JavaScript execution
- Ensure Next button is configured

**Issue**: Mobile display issues
- **Solution**: Add viewport meta tag
- Test with device emulators
- Adjust cell sizes

**Issue**: Trial completion issues
- **Solution**: Check maze generation logic
- Verify path length is exactly 28
- Test error handling

## Support and Maintenance

### File Updates
- Use Git for version control
- Document changes
- Test before updating Qualtrics files

### Monitoring
- Check Qualtrics response rates
- Monitor error patterns
- Track data completeness

## Next Steps

1. Create Qualtrics-specific files
2. Extract styles from Tailwind
3. Upload to Qualtrics file library
4. Create survey prototype
5. Conduct pilot testing
6. Deploy to production

## References
- Qualtrics Developer Documentation
- Qualtrics JavaScript API Reference
- GMLT Research Protocol
- Original GMLT Implementation Files

---

**Document Version**: 1.0  
**Last Updated**: January 2024  
**Author**: Development Team  
**Status**: Draft - Ready for Implementation

