import React from "react";

// The CSS keyframes and animations are defined here to keep the component self-contained.
// This approach avoids external CSS files and relies purely on Tailwind classes and inline styles.
const customStyles = `
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes bounce {
    0%, 100% {
      transform: scale(0);
    }
    50% {
      transform: scale(1);
    }
  }
`;

const ProgressIndicator = ({ type }) => {
  // Use a Tailwind utility class for centering the loader
  const wrapperClass = "flex min-h-screen items-center justify-center";

  // Type 2: Replicates the TailSpin loader with a simple spinning border animation
  if (type === 2) {
    return (
      <div className={wrapperClass}>
        <style>{customStyles}</style>
        <div
          className="h-12 w-12 animate-[spin_1s_linear_infinite] rounded-full border-4 border-gray-200 border-t-blue-500"
          aria-label="Loading spinner"
        ></div>
      </div>
    );
  }

  // Default: Replicates the Grid loader with a bouncing dot animation
  return (
    <div className={wrapperClass}>
      <style>{customStyles}</style>
      <div className="flex space-x-2">
        <div
          className="h-4 w-4 animate-[bounce_1.4s_ease-in-out_infinite] rounded-full bg-blue-500"
          style={{ animationDelay: '-0.32s' }}
        ></div>
        <div
          className="h-4 w-4 animate-[bounce_1.4s_ease-in-out_infinite] rounded-full bg-blue-500"
          style={{ animationDelay: '-0.16s' }}
        ></div>
        <div
          className="h-4 w-4 animate-[bounce_1.4s_ease-in-out_infinite] rounded-full bg-blue-500"
          aria-label="Loading dots"
        ></div>
      </div>
    </div>
  );
};

export default ProgressIndicator;
