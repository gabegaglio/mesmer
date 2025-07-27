// Performance-optimized CSS transition classes
export const optimizedTransitions = {
  // Instead of transition-all, use specific properties
  color: "transition-colors duration-200",
  transform: "transition-transform duration-200",
  opacity: "transition-opacity duration-200",
  background: "transition-colors duration-200",
  border: "transition-colors duration-200",
  scale: "transition-transform duration-200",

  // Combined common transitions
  colorAndOpacity: "transition-[color,opacity] duration-200",
  transformAndOpacity: "transition-[transform,opacity] duration-200",
  backgroundAndBorder:
    "transition-[background-color,border-color] duration-200",

  // Specific durations for different interactions
  fast: "transition-[color,opacity] duration-150",
  medium: "transition-[color,opacity,transform] duration-200",
  slow: "transition-[color,opacity,transform] duration-300",

  // Performance-first transitions (minimal properties)
  minimal: "transition-opacity duration-150",
  hover: "transition-[background-color,transform] duration-150",

  // Remove transitions entirely for static elements
  none: "transition-none",
};

// Helper function to replace transition-all with optimized transitions
export function getOptimizedTransition(
  element: "button" | "input" | "modal" | "icon" | "background"
): string {
  switch (element) {
    case "button":
      return optimizedTransitions.hover;
    case "input":
      return optimizedTransitions.backgroundAndBorder;
    case "modal":
      return optimizedTransitions.transformAndOpacity;
    case "icon":
      return optimizedTransitions.transform;
    case "background":
      return optimizedTransitions.background;
    default:
      return optimizedTransitions.minimal;
  }
}

// Performance mode CSS classes
export const performanceCSS = `
  /* Disable expensive transitions in performance mode */
  .perf-mode * {
    transition: none !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
  
  /* Reduce backdrop blur intensity */
  .perf-mode .backdrop-blur-xl {
    backdrop-filter: blur(4px) !important;
  }
  
  .perf-mode .backdrop-blur-md {
    backdrop-filter: blur(2px) !important;
  }
  
  /* Disable expensive box shadows */
  .perf-mode .shadow-2xl,
  .perf-mode .shadow-xl,
  .perf-mode .shadow-lg {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
  }
  
  /* Simplified star animations */
  .perf-mode [style*="starPan"],
  .perf-mode [style*="shootingStar"],
  .perf-mode [style*="crazyStar"] {
    animation: none !important;
    opacity: 0.3 !important;
  }
`;

// Inject performance CSS when needed
export function enablePerformanceMode() {
  const existingStyle = document.getElementById("performance-css");
  if (existingStyle) return;

  const style = document.createElement("style");
  style.id = "performance-css";
  style.textContent = performanceCSS;
  document.head.appendChild(style);
  document.body.classList.add("perf-mode");
}

export function disablePerformanceMode() {
  const style = document.getElementById("performance-css");
  if (style) {
    style.remove();
  }
  document.body.classList.remove("perf-mode");
}

// Quick performance analysis
export function analyzePerformanceIssues(): {
  transitionAllCount: number;
  backdropBlurCount: number;
  animationCount: number;
  suggestions: string[];
} {
  const transitionAllElements = document.querySelectorAll(
    '[class*="transition-all"]'
  );
  const backdropBlurElements = document.querySelectorAll(
    '[class*="backdrop-blur"]'
  );

  let animationCount = 0;
  document.querySelectorAll("*").forEach((el) => {
    const style = window.getComputedStyle(el);
    if (style.animationName !== "none") animationCount++;
    if (style.transitionProperty !== "none") animationCount++;
  });

  const suggestions: string[] = [];

  if (transitionAllElements.length > 10) {
    suggestions.push(
      `Found ${transitionAllElements.length} elements with transition-all. Replace with specific properties.`
    );
  }

  if (backdropBlurElements.length > 3) {
    suggestions.push(
      `Found ${backdropBlurElements.length} backdrop-blur elements. Consider consolidating.`
    );
  }

  if (animationCount > 30) {
    suggestions.push(
      `Found ${animationCount} active animations. Consider reducing or disabling some.`
    );
  }

  return {
    transitionAllCount: transitionAllElements.length,
    backdropBlurCount: backdropBlurElements.length,
    animationCount,
    suggestions,
  };
}
