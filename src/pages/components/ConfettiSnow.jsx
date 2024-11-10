import Snow from "react-canvas-confetti/dist/presets/snow";

function ConfettiSnow() {
  return (
    <Snow
      autorun={{ speed: 50 }} // Automatically starts with specified speed
      decorateOptions={(options) => ({
        ...options,
        particleCount: 1, // Single particle at a time
        startVelocity: 0, // Start with no velocity for gentle fall
        ticks: 800, // Lasts longer on the screen
        origin: {
          x: Math.random(),
          y: Math.random() * 0.2, // Skew towards the top of the screen
        },
        colors: ["#f7f7f7"],
        scalar: Math.random() * 1.2 + 1, // Increased size variation
        shapes: ["circle"], // Circle shapes for snowflakes
        gravity: Math.random() * 0.2 + 0.4, // Random gravity for natural fall
        scalar: Math.random() * 0.6 + 0.4, // Random scale for varied sizes
        drift: Math.random() * 0.8 - 0.4, // Drift for side-to-side movement
      })}
    />
  );
}

export default ConfettiSnow;
