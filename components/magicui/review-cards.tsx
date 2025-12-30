import { cn } from "@/lib/utils";
import { Marquee } from "@/components/magicui/marquee";


const reviews = [
  {
    name: "Leo",
    username: "@dev_leo",
    body: "My workflow is now basically: `Idea -> Bolt -> Done`. The speed is unreal. Shipping features has never been this fast.",
    img: "https://avatar.vercel.sh/leo",
  },
  {
    name: "Aya",
    username: "@ayaink",
    body: "Writer's block is officially a thing of the past. Bolt is my go-to for brainstorming, and it comes up with ideas I would've never thought of. 10/10.",
    img: "https://avatar.vercel.sh/aya",
  },
  {
    name: "Finn",
    username: "@finnhacks",
    body: "I love that I don't have to choose between models. I can just throw a problem at Bolt and it uses the best AI for the job. It's the multi-tool I've always wanted.",
    img: "https://avatar.vercel.sh/finn",
  },
  {
    name: "Chloe",
    username: "@chloesun",
    body: "Okay, I'm obsessed. The UI is gorgeous and it just *works*. Finally, an AI tool that doesn't feel like a science project.",
    img: "https://avatar.vercel.sh/chloe",
  },
  {
    name: "Marco",
    username: "@mpolo",
    body: "My productivity has skyrocketed. Repetitive tasks that used to eat up my day are now completely automated. Cannot imagine my life without it.",
    img: "https://avatar.vercel.sh/marco",
  },
  {
    name: "Zara",
    username: "@zara_zenith",
    body: "Using Bolt feels like my brain was just upgraded. It's fast, smart, and genuinely limitless. The hype is real.",
    img: "https://avatar.vercel.sh/zara",
  },
];
const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string;
  name: string;
  username: string;
  body: string;
}) => {
  return (
    <figure
      className={cn(
        "relative h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
        // light styles
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        // dark styles
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <img className="rounded-full" width="32" height="32" alt="" src={img} />
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium dark:text-white">
            {name}
          </figcaption>
          <p className="text-xs font-medium dark:text-white/40">{username}</p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm">{body}</blockquote>
    </figure>
  );
};

export function MarqueeDemo() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
      <Marquee pauseOnHover className="[--duration:20s]">
        {firstRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:20s]">
        {secondRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-landingPageLight dark:from-landingPage to-transparent"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-landingPageLight dark:from-landingPage to-transparent"></div>
    </div>
  );
}