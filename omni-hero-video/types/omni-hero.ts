/**
 * Omni Hero Demo composition: 1920×1080, ~45s, title cards + feature highlights.
 */

export const OMNI_HERO_COMP_ID = "OmniHeroDemo";

export const OMNI_HERO_WIDTH = 1920;
export const OMNI_HERO_HEIGHT = 1080;
export const OMNI_HERO_FPS = 30;

/** Filename for app screen recording in omni-hero-video/public/ (e.g. copy from main app's OmniDemoHero.mp4). */
export const APP_DEMO_VIDEO_FILENAME = "app-demo.mp4";

/** Intro: 3s. Outro: 3s. Demo segment: fixed duration (cap for timeline). */
export const INTRO_DURATION_IN_FRAMES = 3 * OMNI_HERO_FPS; // 90
export const OUTRO_DURATION_IN_FRAMES = 3 * OMNI_HERO_FPS; // 90
/** Playback speed for demo (1.2 = 20% faster, shortens loading/typing parts). */
export const DEMO_VIDEO_PLAYBACK_RATE = 1.2;

/**
 * Use a single pre-edited video so there is no cut in Remotion (no black frame).
 * Matches full app-demo.mp4 length (4:14 = 254 s) so the end is not cut off.
 */
export const DEMO_VIDEO_SOURCE_DURATION_IN_FRAMES = (4 * 60 + 14) * OMNI_HERO_FPS; // 7620 (4:14)

/** Demo segment length: full source at 1.2x = one uncut video. */
export const DEMO_VIDEO_DURATION_IN_FRAMES = Math.floor(
  DEMO_VIDEO_SOURCE_DURATION_IN_FRAMES / DEMO_VIDEO_PLAYBACK_RATE
); // 6350

/** Total: intro + demo + outro */
export const OMNI_HERO_DURATION_IN_FRAMES =
  INTRO_DURATION_IN_FRAMES +
  DEMO_VIDEO_DURATION_IN_FRAMES +
  OUTRO_DURATION_IN_FRAMES;

/**
 * Feature segments shown in the demo video. Adjust startFrame/endFrame to match
 * when each feature appears in app-demo.mp4 (frames are 0-based within the demo segment).
 */
export type DemoFeatureSegment = {
  label: string;
  startFrame: number;
  endFrame: number;
};

/** No zoom during Conversational (0–29s); first zoom is at 29s (Vibe code). */
export const DEMO_CONVERSATIONAL_END_FRAME = 869;

export const DEMO_FEATURE_SEGMENTS: DemoFeatureSegment[] = [
  { label: "Conversational", startFrame: 0, endFrame: 816 },
  { label: "Vibe code", startFrame: 816, endFrame: 1716 },
  { label: "File Upload", startFrame: 1716, endFrame: 2316 },
  { label: "Chat History", startFrame: 2316, endFrame: 2454 },
  { label: "Resume Generator", startFrame: 2454, endFrame: 2502 },
  { label: "Quiz Generator", startFrame: 2502, endFrame: 4266 },
  { label: "Flashcard Generator", startFrame: 4296, endFrame: DEMO_VIDEO_DURATION_IN_FRAMES },
];

/**
 * Frames at the start of the demo segment where the video stays full screen (scale 1.0) with no zoom.
 */
export const DEMO_FULLSCREEN_LEAD_IN_FRAMES = 45; // 1.5 sec at 30fps

/**
 * Per-range zoom: origin (transform-origin), scale, and frame range (0-based in demo segment).
 * "50% 50%" = center; "50% 85%" = bottom center (input box).
 * Slight zooms (scale 1.2) zoom out by end of range; input-box zooms (1.45) hold then zoom out.
 */
export type DemoZoomRange = {
  start: number;
  end: number;
  origin: string;
  scale: number;
  /** Optional: faster zoom-out (fewer frames). Default uses shared transition. */
  zoomOutFrames?: number;
};

export const DEMO_ZOOM_RANGES: DemoZoomRange[] = [
  { start: 870, end: 1080, origin: "65% 85%", scale: 1.45 },
  { start: 1770, end: 1890, origin: "65% 50%", scale: 1.45 },
  { start: 2370, end: 2400, origin: "50% 50%", scale: 1.38 },
  { start: 2550, end: 3450, origin: "50% 50%", scale: 1.2 },
  { start: 4350, end: 4680, origin: "50% 50%", scale: 1.2 },
];

/** Hero copy from app/page.tsx */
export const HERO_TITLE = "See Omni in Action";
export const HERO_SUBTITLE =
  "A glimpse into the future of productivity and creative workflows.";

export type OmniFeature = {
  title: string;
  description: string;
};

export const OMNI_FEATURES: OmniFeature[] = [
  {
    title: "General Chatting",
    description:
      "Engage in natural, intelligent conversations for answers, ideas, and creative collaboration.",
  },
  {
    title: "LLM Model Selection",
    description:
      "Switch between a variety of powerful large language models to find the perfect mind for your specific task.",
  },
  {
    title: "Resume Tailor",
    description:
      "Optimize your resume for any job application by letting our AI tailor it to match the job description perfectly.",
  },
  {
    title: "Image Generation",
    description:
      "Bring your ideas to life. Generate stunning, high-quality images from simple text descriptions in seconds.",
  },
  {
    title: "Quiz Generation",
    description:
      "Test your knowledge with custom quizzes. Choose between instant AI automation from your documents or manual creation for total control.",
  },
  {
    title: "Flashcard Generation",
    description:
      "Level up your study sessions. Seamlessly switch between AI-powered automated cards and precise manual entry.",
  },
  {
    title: "File Upload & Process",
    description:
      "Securely upload documents and files for the AI to analyze, summarize, or transform based on your needs.",
  },
  {
    title: "Vibe Coding",
    description:
      "Code in real-time with an AI partner that suggests solutions and helps you squash bugs before they happen.",
  },
];

/** Brand gradient (violet → pink) - CSS-friendly */
export const BRAND_GRADIENT =
  "linear-gradient(90deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)";
export const BRAND_GRADIENT_VERTICAL =
  "linear-gradient(180deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)";
