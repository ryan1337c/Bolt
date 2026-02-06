<img src="https://github.com/remotion-dev/template-next/assets/1629785/9092db5f-7c0c-4d38-97c4-5f5a61f5cc098" />
<br/>
<br/>

This is a Next.js template for building programmatic video apps, with [`@remotion/player`](https://remotion.dev/player) and [`@remotion/lambda`](https://remotion.dev/lambda) built in.

This template uses the Next.js App directory, with TailwindCSS. There is a [Non-TailwindCSS version](https://github.com/remotion-dev/template-next-app-dir), and a [Pages directory version](https://github.com/remotion-dev/template-next-pages-dir) of this template available.

<img src="https://github.com/remotion-dev/template-next/assets/1629785/c9c2e5ca-2637-4ec8-8e40-a8feb5740d88" />

## Getting Started

[Use this template](https://github.com/new?template_name=template-next-app-dir-tailwind&template_owner=remotion-dev) to clone it into your GitHub account. Run

```
npm i
```

afterwards. Alternatively, use this command to scaffold a project:

```
npx create-video@latest --next-tailwind
```

## Commands

Start the Next.js dev server:

```
npm run dev
```

Open the Remotion Studio:

```
npx remotion studio
```

Render a video locally:

```
npx remotion render
```

Upgrade Remotion:

```
npx remotion upgrade
```

The following script will set up your Remotion Bundle and Lambda function on AWS:

```
node deploy.mjs
```

You should run this script after:

- changing the video template
- changing `config.mjs`
- upgrading Remotion to a newer version

## Set up rendering on AWS Lambda

This template supports rendering the videos via [Remotion Lambda](https://remotion.dev/lambda).

1. Copy the `.env.example` file to `.env` and fill in the values.
   Complete the [Lambda setup guide](https://www.remotion.dev/docs/lambda/setup) to get your AWS credentials.

1. Edit the `config.mjs` file to your desired Lambda settings.

1. Run `node deploy.mjs` to deploy your Lambda function and Remotion Bundle.

## Replacing the landing page hero video

The **Omni Hero Demo** composition (intro + app demo + outro + music) can be rendered and used as the hero video on the main app's landing page.

1. **Render the hero video** (from the `omni-hero-video` folder):

   ```bash
   npm run render:hero
   ```

   This creates `out/OmniDemoHero.mp4`.

2. **Replace the file on the landing page:**  
   Copy the rendered file into the main app's `public` folder (from repo root):

   ```bash
   cp omni-hero-video/out/OmniDemoHero.mp4 public/OmniDemoHero.mp4
   ```

   The landing page (`app/page.tsx`) uses `src="OmniDemoHero.mp4"` and `poster="omniDemoPoster.png"`. Replacing `OmniDemoHero.mp4` is enough for the new video to show.

3. **Optional – update the poster:**  
   If the first frame of the new video looks different, replace `public/omniDemoPoster.png` with a new image (e.g. first frame of the new video), or remove the `poster` attribute from the `<video>` in `app/page.tsx` to use the browser default.

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://remotion.dev/discord).

## Issues

Found an issue with Remotion? [File an issue here](https://remotion.dev/issue).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
