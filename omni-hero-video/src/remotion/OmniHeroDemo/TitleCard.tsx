import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "@remotion/google-fonts/Inter";
import { HERO_SUBTITLE, HERO_TITLE } from "../../../types/omni-hero";

export const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({
    fps,
    frame,
    config: { damping: 24, stiffness: 180 },
    durationInFrames: 24,
  });

  const subtitleProgress = spring({
    fps,
    frame: frame - 8,
    config: { damping: 24, stiffness: 180 },
    durationInFrames: 20,
    delay: 12,
  });

  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(titleProgress, [0, 1], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleScale = interpolate(titleProgress, [0, 1], [0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(subtitleProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const glowOpacity = interpolate(frame, [0, 20, 80, 150], [0, 0.4, 0.4, 0.25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill className="bg-[#0f0a1a] justify-center items-center">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 40%, rgba(139, 92, 246, ${glowOpacity}) 0%, transparent 60%)`,
        }}
      />
      <div
        className="flex flex-col items-center justify-center px-16 text-center relative"
        style={{
          transform: `translateY(${titleY}px) scale(${titleScale})`,
        }}
      >
        <h1
          className="text-6xl md:text-7xl font-bold tracking-tight"
          style={{
            fontFamily,
            opacity: titleOpacity,
            background: "linear-gradient(90deg, #a78bfa 0%, #c084fc 50%, #f472b6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "0 0 60px rgba(168, 85, 247, 0.3)",
          }}
        >
          {HERO_TITLE}
        </h1>
        <p
          className="mt-6 text-xl md:text-2xl text-gray-300 max-w-2xl"
          style={{ opacity: subtitleOpacity, fontFamily }}
        >
          {HERO_SUBTITLE}
        </p>
      </div>
    </AbsoluteFill>
  );
};
