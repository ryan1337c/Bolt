import React, { useState } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  APP_DEMO_VIDEO_FILENAME,
  DEMO_CONVERSATIONAL_END_FRAME,
  DEMO_FULLSCREEN_LEAD_IN_FRAMES,
  DEMO_VIDEO_PLAYBACK_RATE,
  DEMO_VIDEO_SOURCE_DURATION_IN_FRAMES,
  DEMO_ZOOM_RANGES,
} from "../../../types/omni-hero";
import { FeatureLabelOverlay } from "./FeatureLabelOverlay";

/**
 * Renders the app screen recording as one uncut video. Use a pre-edited app-demo.mp4
 * with 18s–25s and 44s–66s removed (see public/README.md) so there is no cut in Remotion.
 */
export const AppDemoSegment: React.FC = () => {
  const [hasError, setHasError] = useState(false);
  const frame = useCurrentFrame();
  const effectiveFrame = frame;

  const videoFadeIn = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ZOOM_DEFAULT = 1.0;
  /** ~1.8s in/out – longer ramp so zoom-in (e.g. Vibe code) feels smooth, not choppy. */
  const ZOOM_TRANSITION_FRAMES = 54;
  /** Same easing in and out so zoom-in and zoom-out pace match (e.g. Vibe code). */
  const ZOOM_EASING = Easing.inOut(Easing.cubic);
  /** Same easing in and out: gentle start so the pull-back isn’t abrupt. */
  // Find active zoom range: include transition zones; when ranges overlap, use latest start (e.g. Quiz over Resume).
  // Before DEMO_CONVERSATIONAL_END_FRAME we still allow a range if we're in its transition-in zone, so the first zoom (Vibe code) can animate in instead of teleporting.
  const activeRange = (() => {
    if (effectiveFrame < DEMO_FULLSCREEN_LEAD_IN_FRAMES) return null;
    const outFrames = (r: (typeof DEMO_ZOOM_RANGES)[0]) => r.zoomOutFrames ?? ZOOM_TRANSITION_FRAMES;
    let candidates = DEMO_ZOOM_RANGES.filter(
      (r) =>
        effectiveFrame >= r.start - ZOOM_TRANSITION_FRAMES &&
        effectiveFrame <= r.end + outFrames(r)
    );
    if (effectiveFrame < DEMO_CONVERSATIONAL_END_FRAME) {
      candidates = candidates.filter(
        (r) =>
          effectiveFrame >= r.start - ZOOM_TRANSITION_FRAMES &&
          effectiveFrame < r.start
      );
    }
    if (candidates.length === 0) return null;
    // When overlapping: prefer finishing the current zoom (hold or zoom-out) so we don't reset to 1.0 mid-section.
    const inHold = (r: (typeof DEMO_ZOOM_RANGES)[0]) =>
      effectiveFrame >= r.start && effectiveFrame <= Math.max(r.start, r.end);
    const inZoomOut = (r: (typeof DEMO_ZOOM_RANGES)[0]) =>
      effectiveFrame > r.end && effectiveFrame <= r.end + outFrames(r);
    const zoomOutCandidate = candidates.find(inZoomOut);
    if (zoomOutCandidate) return zoomOutCandidate;
    const holdCandidate = candidates.find(inHold);
    if (holdCandidate) return holdCandidate;
    return candidates.reduce((a, b) => (b.start > a.start ? b : a));
  })();

  const { zoomScale, zoomOrigin } = (() => {
    if (!activeRange) {
      return { zoomScale: ZOOM_DEFAULT, zoomOrigin: "50% 50%" };
    }
    const { start: a, end: b, origin, scale } = activeRange;
    const outFrames = activeRange.zoomOutFrames ?? ZOOM_TRANSITION_FRAMES;
    let s: number;
    if (effectiveFrame < a) {
      s = interpolate(
        effectiveFrame,
        [a - ZOOM_TRANSITION_FRAMES, a],
        [ZOOM_DEFAULT, scale],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ZOOM_EASING }
      );
    } else if (effectiveFrame > b) {
      s = interpolate(
        effectiveFrame,
        [b, b + outFrames],
        [scale, ZOOM_DEFAULT],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ZOOM_EASING }
      );
    } else {
      s = scale;
    }
    return { zoomScale: s, zoomOrigin: origin };
  })();

  if (hasError) {
    return (
      <AbsoluteFill
        className="bg-[#0f0a1a] justify-center items-center"
        style={{ backgroundColor: "#0f0a1a" }}
      >
        <div className="max-w-2xl px-12 text-center text-gray-300">
          <p className="text-xl font-semibold text-purple-300 mb-4">
            App demo video could not be loaded
          </p>
          <p className="mb-2">
            Place <code className="bg-black/30 px-1 rounded">{APP_DEMO_VIDEO_FILENAME}</code> in{" "}
            <code className="bg-black/30 px-1 rounded">omni-hero-video/public/</code>
          </p>
          <p className="text-sm text-gray-400">
            You can copy from the main app: <code className="bg-black/30 px-1 rounded">image-ai/public/OmniDemoHero.mp4</code> and rename to {APP_DEMO_VIDEO_FILENAME}.
          </p>
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      className="bg-[#0f0a1a] justify-center items-center"
      style={{ backgroundColor: "#0f0a1a" }}
    >
      <div
        style={{
          opacity: videoFadeIn,
          width: "100%",
          height: "100%",
          transform: `scale(${zoomScale})`,
          transformOrigin: zoomOrigin,
        }}
      >
        <OffthreadVideo
          src={staticFile(APP_DEMO_VIDEO_FILENAME)}
          trimAfter={DEMO_VIDEO_SOURCE_DURATION_IN_FRAMES}
          onError={() => setHasError(true)}
          playbackRate={DEMO_VIDEO_PLAYBACK_RATE}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>
      <FeatureLabelOverlay effectiveFrame={effectiveFrame} />
    </AbsoluteFill>
  );
};
