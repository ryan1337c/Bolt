import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import {
  DEMO_VIDEO_DURATION_IN_FRAMES,
  INTRO_DURATION_IN_FRAMES,
  OUTRO_DURATION_IN_FRAMES,
} from "../../../types/omni-hero";
import { TitleCard } from "./TitleCard";
import { AppDemoSegment } from "./AppDemoSegment";
import { OutroCard } from "./OutroCard";

/** Background music file in omni-hero-video/public/ (e.g. MP3). Place your file there. */
export const BACKGROUND_MUSIC_FILENAME = "background-music.mp3";

loadFont("normal", { subsets: ["latin"], weights: ["400", "700"] });

export const OmniHeroDemo: React.FC = () => {
  return (
    <AbsoluteFill className="bg-[#0f0a1a]">
      <Audio
        src={staticFile(BACKGROUND_MUSIC_FILENAME)}
        volume={0.35}
        loop
      />
      <Sequence durationInFrames={INTRO_DURATION_IN_FRAMES}>
        <TitleCard />
      </Sequence>

      <Sequence
        from={INTRO_DURATION_IN_FRAMES}
        durationInFrames={DEMO_VIDEO_DURATION_IN_FRAMES}
      >
        <AppDemoSegment />
      </Sequence>

      <Sequence
        from={INTRO_DURATION_IN_FRAMES + DEMO_VIDEO_DURATION_IN_FRAMES}
        durationInFrames={OUTRO_DURATION_IN_FRAMES}
      >
        <OutroCard />
      </Sequence>
    </AbsoluteFill>
  );
};
