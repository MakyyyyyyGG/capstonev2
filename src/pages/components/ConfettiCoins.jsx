import Realistic from "react-canvas-confetti/dist/presets/realistic";

function ConfettiCoins() {
  return (
    <Realistic
      autorun={{ speed: 0.001 }} // Lower speed for continuous falling effect
      decorateOptions={(options) => ({
        ...options,
        particleCount: 17, // Low particle count for gradual fall
        startVelocity: 50, // Gentle initial downward velocity
        ticks: 1000, // Longer duration
        spread: 100, // Spread for wider fall coverage
        origin: {
          x: 0.5, // Randomize x-axis position across width
          y: 0.5, // Start particles above the top of the screen
        },
        gravity: 2.5, // Lower gravity for a gentle falling effect
        scalar: Math.random() * 1 + 0.8, // Increased size variation
        drift: Math.random() * 0.5 - 0.25, // Light side-to-side drift
        colors: ["#fde047"], // Use all desired colors
        shapes: ["circle"], // Define shapes for particles
      })}
    />
  );
}

export default ConfettiCoins;
