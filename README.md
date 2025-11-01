# GMLT - Groton Maze Learning Test

A web-based implementation of the Groton Maze Learning Test (GMLT), a computerized neuropsychological assessment tool that measures spatial working memory, learning efficiency, and error monitoring.

## Overview

The GMLT is a computerized task where participants learn a hidden path through a maze across multiple trials. The current release focuses on reinforcing short-term spatial memory by presenting the same, loop-free maze in every trial. The test measures:

- **Spatial Working Memory**: Ability to remember and execute a spatial sequence
- **Learning Efficiency**: Improvement in performance across trials
- **Error Monitoring**: Recognition and correction of mistakes

## Features

- 📱 **Fully Responsive**: Works seamlessly on mobile, tablet, and desktop devices
- 🧭 **Session-Consistent Maze**: Each session generates a fresh loop-free path that is reused for all five trials in that session
- 🔁 **Error Recovery Enforcement**: After a mistake, the participant must re-confirm the last correct tile before moving forward
- ⏱️ **Precise Timing**: Trial timer starts on the first click of the start tile and stops immediately on reaching the goal
- 📊 **Performance Tracking**: Detailed metrics including error rates, response times, and learning curves
- 💾 **Data Export**: Download results as JSON for analysis
- ⚙️ **Configurable**: Easy to customize grid size, trial count, and other parameters

## Getting Started

### Quick Start

Simply open `index.html` in a modern web browser. No build process or dependencies required.

### Local Server (Recommended)

For best results, serve the files through a local web server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (with http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000` in your browser.

## How to Use

1. **Read Instructions**: The test begins with clear instructions on how to complete the task
2. **Complete Trials**: Navigate through 5 consecutive trials, learning the maze path
3. **Feedback**: Visual feedback (green for correct, red for incorrect) helps guide performance
4. **View Results**: After completing all trials, view detailed performance metrics

### Latest Version Highlights

- New session-specific paths while keeping the same route across the five trials in a session
- Timer now aligns with actual task engagement (starts at first tile, ends at goal)
- Correct-backtracking feedback is rendered in green to differentiate from errors

## Configuration

Edit `js/config/task-config.js` to customize:

```javascript
const TASK_CONFIG = {
    gridSize: 10,           // Maze size (10x10)
    numTrials: 5,           // Number of learning trials
    allowDiagonal: false,   // Movement rules
    showCorrectPath: false // Debug mode
};
```

## Technical Details

### Architecture

- **Vanilla JavaScript**: No frameworks or dependencies
- **Tailwind CSS**: Utility-first styling via CDN
- **Modular Design**: Separated concerns for easy maintenance

### File Structure

```
gmlt/
├── index.html                    # Main HTML structure
├── js/
│   ├── config/
│   │   └── task-config.js       # Configuration parameters
│   ├── core/
│   │   ├── maze-generator.js    # Path generation algorithm
│   │   ├── game-state.js        # State management
│   │   └── performance-tracker.js # Metrics calculation
│   ├── ui/
│   │   └── game-controller.js   # UI management
│   └── main.js                   # Entry point
└── README.md                     # This file
```

### Key Classes

- **MazeGenerator**: Provides a deterministic, loop-free maze path and validates route integrity
- **GameState**: Manages trial state, timing, and the enforced backtracking rule after errors
- **PerformanceTracker**: Calculates learning indices and metrics
- **GameController**: Handles UI interactions and game flow while reusing the shared maze path each trial

## Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

## Research Background

The Groton Maze Learning Test was developed as a measure of executive function and spatial working memory. This implementation follows standard GMLT protocols while maintaining flexibility for research applications.

## License

This project is intended for research and educational purposes.

## Contributing

Contributions are welcome! Please ensure your code follows the existing structure and style.

## References

- GMLT was developed as part of the Cogstate cognitive testing battery
- Based on constructs of spatial working memory and learning efficiency

