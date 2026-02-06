# Public assets for Omni Hero Video

Place the app demo screen recording and optional background music here so the Remotion composition can use them.

## Background music (optional)

- **Filename:** `background-music.mp3`
- Place an MP3 (or other supported format) in this folder to have it play as background music for the full video at ~35% volume. If the file is missing, the composition still renders with no audio track.

- **Filename:** `app-demo.mp4`
- **Usage:** The composition plays the demo to the **end of the original source** (full 4 min / 240 s). Use the full `app-demo.mp4` or a pre-edited version; nothing will be cut off.

**Option A – Use the full 4-minute file**  
Place your full recording as `app-demo.mp4` in this folder. The composition will play it at 1.2x to the end.

**Option B – Use a pre-edited file (e.g. with cuts removed)**  
To remove 18s–25s and 44s–66s for a seamless 211 s video, use FFmpeg:

```bash
# Remove 18s–25s and 44s–66s: keep 0–18s, 25–44s, 66s–end, then concat.
# Result length: 211 seconds. The composition supports up to 240 s.
ffmpeg -i original-demo.mp4 -filter_complex "[0:v]trim=end=18,setpts=PTS-STARTPTS[v1];[0:a]atrim=end=18,asetpts=PTS-STARTPTS[a1];[0:v]trim=start=25:end=44,setpts=PTS-STARTPTS[v2];[0:a]atrim=start=25:end=44,asetpts=PTS-STARTPTS[a2];[0:v]trim=start=66,setpts=PTS-STARTPTS[v3];[0:a]atrim=start=66,asetpts=PTS-STARTPTS[a3];[v1][a1][v2][a2][v3][a3]concat=n=3:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" -y app-demo.mp4
```

Then put `app-demo.mp4` in this `public/` folder.

**Option B – Use the full recording**  
If you use the full 4-minute file without editing, set `DEMO_VIDEO_SOURCE_DURATION_IN_FRAMES` in `omni-hero-video/types/omni-hero.ts` to `7200` (4 × 60 × 30). The cut sections will remain in the video.
