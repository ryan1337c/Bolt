import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "@remotion/google-fonts/Inter";
import type { OmniFeature } from "../../../types/omni-hero";

export const FeatureSlide: React.FC<{ feature: OmniFeature }> = ({
  feature,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({
    fps,
    frame,
    config: { damping: 200 },
    durationInFrames: 25,
  });

  const descProgress = spring({
    fps,
    frame: frame - 12,
    config: { damping: 200 },
    durationInFrames: 30,
    delay: 15,
  });

  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleX = interpolate(titleProgress, [0, 1], [-60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const descOpacity = interpolate(descProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill className="bg-[#0f0a1a] justify-center items-center">
      <div className="max-w-4xl px-16 text-center">
        <h2
          className="text-4xl md:text-5xl font-bold mb-6"
          style={{
            fontFamily,
            opacity: titleOpacity,
            transform: `translateX(${titleX}px)`,
            color: "#c084fc",
          }}
        >
          {feature.title}
        </h2>
        <p
          className="text-xl md:text-2xl text-gray-300 leading-relaxed"
          style={{ opacity: descOpacity, fontFamily }}
        >
          {feature.description}
        </p>
      </div>
    </AbsoluteFill>
  );
};
