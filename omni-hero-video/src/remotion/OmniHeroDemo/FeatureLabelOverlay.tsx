import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { fontFamily } from "@remotion/google-fonts/Inter";
import { DEMO_FEATURE_SEGMENTS } from "../../../types/omni-hero";

const FADE_FRAMES = 14;
const LABEL_HOLD_START = 20;

/**
 * Lower-third overlay showing the current feature label. Fades in at segment
 * start, holds, fades out at segment end.
 * Pass effectiveFrame when using a cut timeline (e.g. part 2 offset).
 */
export const FeatureLabelOverlay: React.FC<{ effectiveFrame?: number }> = ({
  effectiveFrame,
}) => {
  const frame = useCurrentFrame();
  const lookupFrame = effectiveFrame ?? frame;

  const segment = DEMO_FEATURE_SEGMENTS.find(
    (s) => lookupFrame >= s.startFrame && lookupFrame < s.endFrame
  );

  if (!segment) return null;

  const segmentLength = segment.endFrame - segment.startFrame;
  const frameInSegment = lookupFrame - segment.startFrame;

  const opacity = interpolate(
    frameInSegment,
    [
      0,
      FADE_FRAMES,
      LABEL_HOLD_START,
      segmentLength - FADE_FRAMES,
      segmentLength,
    ],
    [0, 1, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const slideX = interpolate(
    frameInSegment,
    [0, FADE_FRAMES],
    [120, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const scale = interpolate(
    frameInSegment,
    [0, FADE_FRAMES],
    [0.88, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill className="pointer-events-none flex flex-row justify-end items-start pt-12 pr-12">
      <div
        className="px-12 py-6 rounded-2xl"
        style={{
          opacity,
          transform: `translateX(${slideX}px) scale(${scale})`,
          fontFamily,
          background: "linear-gradient(135deg, rgba(45, 15, 45, 0.96) 0%, rgba(109, 40, 167, 0.5) 100%)",
          border: "2px solid rgba(192, 132, 252, 0.7)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.08), 0 12px 40px rgba(0,0,0,0.5), 0 0 40px rgba(168, 85, 247, 0.35)",
          backdropFilter: "blur(14px)",
        }}
      >
        <span
          className="text-4xl font-bold tracking-tight"
          style={{
            background: "linear-gradient(90deg, #ede9fe 0%, #f5d0fe 50%, #fbcfe8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {segment.label}
        </span>
      </div>
    </AbsoluteFill>
  );
};
