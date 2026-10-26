import Avatar from "@/components/Avatar";
import type { Companion } from "@/prompts/companions";

// A companion's picture: their photo if they have one, otherwise the drawn portrait.
// "card" is the large picture on the home card; "round" fills a small circle (chat header).
export default function Portrait({ companion, variant }: { companion: Companion; variant: "card" | "round" }) {
  const { photo, look } = companion;

  // Photos are zoomed in on the face, so a wide stock photo still reads as a portrait.
  const img = photo && (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo.src}
      alt=""
      className="h-full w-full object-cover"
      style={{ objectPosition: photo.position, transform: `scale(${photo.zoom})`, transformOrigin: photo.position }}
    />
  );

  if (variant === "round") return img || <Avatar look={look} className="h-11 w-auto" />;

  return img ? (
    <div className="animate-rise pointer-events-none absolute top-3 right-3 aspect-[4/5] h-[58%] max-h-60 overflow-hidden rounded-[1.5rem] shadow-lg sm:right-5">
      {img}
    </div>
  ) : (
    <Avatar
      look={look}
      className="animate-rise pointer-events-none absolute -top-1 right-2 h-[62%] max-h-56 w-auto sm:right-6"
    />
  );
}
