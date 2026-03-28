import { useEffect, useState } from "react";
import { motion } from "motion/react";

export const CursorGlow = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: -500 });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      if (!isReady) setIsReady(true);
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, [isReady]);

  if (!isReady) return null;

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 w-[400px] h-[400px] -mt-[200px] -ml-[200px] bg-primary/20 rounded-full blur-[100px] z-0 mix-blend-screen"
      animate={{
        x: mousePosition.x,
        y: mousePosition.y,
      }}
      transition={{ type: "tween", ease: "backOut", duration: 0.8 }}
    />
  );
};
