# GMLT (Groton Maze Learning Test) Implementation Plan

## Overview
The Groton Maze Learning Test (GMLT) is a computerized neuropsychological test that measures spatial working memory, learning efficiency, and error monitoring. This document outlines the implementation plan for a web-based GMLT task using JavaScript and Tailwind CSS.

## Task Specifications (Based on Standard GMLT Parameters)

### Core Components
1. **Grid-Based Maze**: 10×10 grid (100 cells)
2. **Learning Trials**: 5 consecutive learning trials
3. **Hidden Path**: Predefined correct path through the maze
4. **Visual Feedback**: 
   - Correct moves: Green highlight
   - Incorrect moves: Red highlight with reset to start
   - Visual error counter
5. **Performance Metrics**:
   - Errors per trial
   - Total time per trial
   - Learning curve tracking
   - Average response time
6. **Starting Point**: Always top-left corner (index 0,0)
7. **Ending Point**: Always bottom-right corner (index 9,9)
8. **Movement Rules**: Only adjacent cells (up, down, left, right)

### Game Flow
1. **Instructions Screen**: Explain task requirements
2. **Practice Trial**: Optional practice maze
3. **Learning Phase**: 5 consecutive trials
4. **Results Screen**: Display performance metrics

## Technical Architecture

### File Structure
```
gmlt/
├── index.html          # Main HTML structure
├── styles/
│   ├── tailwind.css    # Tailwind CSS (generated)
│   └── custom.css      # Custom styles if needed
├── js/
│   ├── maze-generator.js   # Maze path generation
│   ├── game-logic.js      # Core game mechanics
│   ├── performance-tracker.js  # Metrics collection
│   └── ui-controller.js   # UI state management
├── config/
│   └── task-config.js  # Configurable parameters
└── README.md           # Documentation
```

### Key Parameters (Configurable)

```javascript
const TASK_CONFIG = {
  gridSize: 10,
  numTrials: 5,
  allowDiagonal: false,
  showCorrectPath: false,  // Only for debugging
  timeoutPerMove: null,     // null = no timeout
  errorFeedback: {
    visual: true,
    audio: false,           // Optional buzzer sound
    resetOnError: true
  },
  scoring: {
    trackErrors: true,
    trackTime: true,
    trackLearningCurve: true
  }
};
```

## Implementation Phases

### Phase 1: Core Setup
**Tasks**:
- [ ] Set up project structure
- [ ] Initialize Tailwind CSS
- [ ] Create base HTML layout
- [ ] Configure build tools (if using PostCSS)

**Deliverables**:
- Responsive grid layout for mobile/desktop
- Tailwind configuration
- Basic project scaffolding

### Phase 2: Maze Generation
**Tasks**:
- [ ] Implement path generation algorithm
- [ ] Ensure non-trivial path (not direct line)
- [ ] Validate path requirements (no cycles, valid endpoints)
- [ ] Store path data structure

**Algorithm**: Modified A* or backtracking algorithm to generate fair paths

### Phase 3: Game Logic
**Tasks**:
- [ ] Implement cell selection handler
- [ ] Validate moves (adjacent cells only)
- [ ] Error detection and feedback
- [ ] Trial completion detection
- [ ] State management (trial tracking, game phases)

**Logic Flow**:
```
User clicks cell → Validate move → 
  If correct: Mark cell, advance position, check completion
  If incorrect: Show error, reset to start, increment error count
```

### Phase 4: UI/UX Implementation
**Tasks**:
- [ ] Design mobile-responsive grid
- [ ] Create instruction screens
- [ ] Implement visual feedback (colors, animations)
- [ ] Add progress indicators
- [ ] Design results dashboard

**UI Components**:
- Instruction modal
- Grid container with touch/tap support
- Trial counter
- Error counter
- Timer display
- Results table
- Start/Next trial buttons

### Phase 5: Performance Tracking
**Tasks**:
- [ ] Track errors per trial
- [ ] Measure response times
- [ ] Calculate learning efficiency
- [ ] Store trial data
- [ ] Generate learning curve

**Metrics Collected**:
- Total errors per trial
- Errors per move position
- Average time per move
- Total completion time
- Learning index (error reduction across trials)
- Perseveration errors (repeating same wrong moves)

### Phase 6: Responsive Design
**Tasks**:
- [ ] Test on mobile devices (< 640px)
- [ ] Test on tablets (640px - 1024px)
- [ ] Test on desktop (> 1024px)
- [ ] Optimize touch interactions
- [ ] Ensure grid visibility across screen sizes

**Tailwind Responsive Strategy**:
```html
<div class="
  grid grid-cols-10 gap-1 
  max-w-md mx-auto
  md:max-w-lg lg:max-w-xl
  p-2 md:p-4 lg:p-6
">
  <!-- Cells -->
</div>
```

### Phase 7: Testing & Validation
**Tasks**:
- [ ] Unit tests for maze generation
- [ ] Unit tests for move validation
- [ ] Unit tests for scoring logic
- [ ] Integration testing
- [ ] User acceptance testing
- [ ] Cross-browser testing

### Phase 8: Documentation
**Tasks**:
- [ ] Create user guide
- [ ] Document technical architecture
- [ ] Add code comments
- [ ] Create deployment guide
- [ ] Write API documentation (if applicable)

## Responsive Design Specifications

### Mobile (< 640px)
- Grid: Max 90vw to ensure fits screen
- Cells: 28-32px minimum for touch targets
- Font sizes: Base 14px, adjust headers
- Stack instructions vertically
- Full-screen buttons
- Simplified navigation

### Tablet (640px - 1024px)
- Grid: Max width with comfortable spacing
- Cells: 32-36px
- Two-column layout for results
- Larger touch targets

### Desktop (> 1024px)
- Grid: Centered, max width 500px
- Cells: 40-50px for comfortable clicking
- Three-column results layout
- Hover effects on cells

## Technical Considerations

### JavaScript Libraries
- No external dependencies (vanilla JS)
- Consider adding if needed:
  - `uuid` for session tracking
  - `chart.js` for learning curve visualization

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Support ES6+ features
- CSS Grid support required
- LocalStorage for data persistence

### Accessibility
- Keyboard navigation support
- ARIA labels for screen readers
- Color-contrast compliance (WCAG 2.1 AA)
- Focus indicators

### Performance
- Minimize repaints during animations
- Efficient event listeners (event delegation)
- Debounce for rapid clicks
- Optimize maze generation algorithm

## Data Structure Design

### Trial Data
```javascript
{
  trialNumber: 1,
  errors: 3,
  totalTime: 45000,        // milliseconds
  moves: [
    { position: [0,0], correct: true, time: 0 },
    { position: [1,0], correct: true, time: 500 },
    { position: [1,1], correct: false, time: 1000 },
    // ...
  ],
  completed: true,
  timestamp: Date.now()
}
```

### Session Data
```javascript
{
  sessionId: "uuid",
  participantId: null,
  trials: [...],
  startTime: Date.now(),
  endTime: Date.now(),
  totalErrors: 12,
  learningIndex: 0.6  // calculated metric
}
```

## Next Steps

1. **Review and Approve Plan**
2. **Setup Environment** (Phase 1)
3. **Implement Core Maze** (Phase 2)
4. **Build Game Logic** (Phase 3)
5. **Create UI Components** (Phase 4)
6. **Add Tracking** (Phase 5)
7. **Responsive Testing** (Phase 6)
8. **Quality Assurance** (Phase 7)
9. **Documentation** (Phase 8)

## Success Criteria
- [ ] Fully functional maze task
- [ ] All 5 trials completed successfully
- [ ] Accurate error tracking
- [ ] Responsive on mobile and desktop
- [ ] Smooth user experience
- [ ] Performance metrics collected accurately
- [ ] Code is well-documented and maintainable

