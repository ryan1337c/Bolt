import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "@remotion/google-fonts/Inter";

const OUTRO_TITLE = "Discover What's Possible";
const OUTRO_SUBTITLE =
  "Omni is more than just a chatbot. It's a suite of powerful, interconnected AI tools designed to amplify your productivity and creativity.";

export const OutroCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({
    fps,
    frame,
    config: { damping: 24, stiffness: 180 },
    durationInFrames: 22,
  });

  const subtitleProgress = spring({
    fps,
    frame: frame - 6,
    config: { damping: 24, stiffness: 180 },
    durationInFrames: 24,
    delay: 10,
  });

  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleScale = interpolate(titleProgress, [0, 1], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleX = interpolate(titleProgress, [0, 1], [-25, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(subtitleProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const glowOpacity = interpolate(frame, [0, 15, 60, 90], [0, 0.35, 0.35, 0.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill className="bg-[#0f0a1a] justify-center items-center">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 40% at 50% 50%, rgba(236, 72, 153, ${glowOpacity}) 0%, transparent 65%)`,
        }}
      />
      <div
        className="flex flex-col items-center justify-center px-16 text-center max-w-4xl relative"
        style={{
          transform: `translateX(${titleX}px) scale(${titleScale})`,
        }}
      >
        <h2
          className="text-5xl md:text-6xl font-bold"
          style={{
            fontFamily,
            opacity: titleOpacity,
            background: "linear-gradient(90deg, #a78bfa 0%, #c084fc 50%, #f472b6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "0 0 50px rgba(168, 85, 247, 0.25)",
          }}
        >
          {OUTRO_TITLE}
        </h2>
        <p
          className="mt-6 text-lg md:text-xl text-gray-300"
          style={{ opacity: subtitleOpacity, fontFamily }}
        >
          {OUTRO_SUBTITLE}
        </p>
      </div>
    </AbsoluteFill>
  );
};
