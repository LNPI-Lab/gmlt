/**
 * GMLT Task Configuration
 * Configurable parameters for the Groton Maze Learning Test
 */

const TASK_CONFIG = {
    // Grid specifications
    gridSize: 10,
    
    // Trial configuration
    numTrials: 5,
    
    // Movement rules
    allowDiagonal: false,
    
    // Debug mode (shows correct path)
    showCorrectPath: false,
    
    // Time constraints
    timeoutPerMove: null, // milliseconds (null = no timeout)
    
    // Error handling
    errorFeedback: {
        visual: true,
        audio: false,
        resetOnError: true
    },
    
    // Scoring configuration
    scoring: {
        trackErrors: true,
        trackTime: true,
        trackLearningCurve: true
    },
    
    // Visual design
    cellColors: {
        default: 'bg-gray-100',
        hover: 'bg-gray-200',
        visited: 'bg-green-500',
        error: 'bg-red-500',
        current: 'bg-blue-500',
        correctPath: 'bg-gray-800'
    },
    
    // Responsive breakpoints
    cellSizes: {
        mobile: 'w-8 h-8',
        tablet: 'w-10 h-10',
        desktop: 'w-12 h-12'
    }
};

