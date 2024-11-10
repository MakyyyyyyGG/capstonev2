import Realistic from "react-canvas-confetti/dist/presets/realistic";

function ConfettiRealistic() {
  return (
    <Realistic
      autorun={{ speed: 3 }} // Lower speed for continuous falling effect
      decorateOptions={(options) => ({
        ...options,
        particleCount: 17, // Low particle count for gradual fall
        startVelocity: 10, // Gentle initial downward velocity
        ticks: 1000, // Longer duration
        spread: 1000, // Spread for wider fall coverage
        origin: {
          x: Math.random(), // Randomize x-axis position across width
          y: -0.2, // Start particles above the top of the screen
        },
        gravity: 2.5, // Lower gravity for a gentle falling effect
        scalar: Math.random() * 1.2 + 1, // Increased size variation
        drift: Math.random() * 0.5 - 0.25, // Light side-to-side drift
        colors: [
          "#f44336",
          "#e91e63",
          "#9c27b0",
          "#673ab7",
          "#3f51b5",
          "#2196f3",
          "#03a9f4",
          "#00bcd4",
          "#009688",
          "#4CAF50",
          "#8BC34A",
          "#CDDC39",
          "#FFEB3B",
          "#FFC107",
          "#FF9800",
          "#FF5722",
          "#795548",
        ], // Use all desired colors
      })}
    />
  );
}

export default ConfettiRealistic;
