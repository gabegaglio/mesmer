import { useState, useEffect, useRef } from "react";

interface UseActivityDetectionOptions {
  inactivityTimeout?: number; // milliseconds
  minScreenWidth?: number; // minimum screen width to enable activity detection
}

export function useActivityDetection({
  inactivityTimeout = 3000, // 3 seconds
  minScreenWidth = 768, // medium screens and up
}: UseActivityDetectionOptions = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMediumScreen, setIsMediumScreen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const isMedium = window.innerWidth >= minScreenWidth;
      setIsMediumScreen(isMedium);

      // Reset visibility if screen size changes
      if (!isMedium) {
        setIsVisible(false);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [minScreenWidth]);

  // Handle mouse movement and touch detection
  useEffect(() => {
    if (!isMediumScreen) {
      setIsVisible(false);
      return;
    }

    // Handle mouse movement for activity detection
    const handleMouseMove = (e: MouseEvent) => {
      const currentMouseX = e.clientX;
      const currentMouseY = e.clientY;
      const mouseDeltaX = Math.abs(currentMouseX - lastMouseX.current);
      const mouseDeltaY = Math.abs(currentMouseY - lastMouseY.current);

      // Show toolbar on mouse movement
      if (mouseDeltaX > 2 || mouseDeltaY > 2) {
        setIsVisible(true);
        lastMouseX.current = currentMouseX;
        lastMouseY.current = currentMouseY;

        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set timeout to hide toolbar after inactivity
        timeoutRef.current = setTimeout(() => {
          setIsVisible(false);
        }, inactivityTimeout);
      }
    };

    // Handle touch events for mobile
    const handleTouchStart = () => {
      setIsVisible(true);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set timeout to hide toolbar after inactivity
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, inactivityTimeout);
    };

    // Initialize mouse position
    const handleMouseEnter = (e: MouseEvent) => {
      lastMouseX.current = e.clientX;
      lastMouseY.current = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("mouseenter", handleMouseEnter, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("mouseenter", handleMouseEnter);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isMediumScreen, inactivityTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isVisible,
    isMediumScreen,
  };
}
