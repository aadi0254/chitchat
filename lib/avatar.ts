export const MASCOT_AVATARS = [
  { name: "Panda", src: "/assets/panda-avatar.jpg" },
  { name: "Fox", src: "/assets/fox-avatar.jpg" },
  { name: "Bunny", src: "/assets/bunny-avatar.jpg" },
  { name: "Bear", src: "/assets/bear-avatar.jpg" },
];

export function getParticipantAvatar(identifier: string): string {
  if (!identifier) return MASCOT_AVATARS[0].src;
  
  // Specific match if nickname includes an animal
  const lower = identifier.toLowerCase();
  if (lower.includes("fox")) return "/assets/fox-avatar.jpg";
  if (lower.includes("bunny") || lower.includes("rabbit")) return "/assets/bunny-avatar.jpg";
  if (lower.includes("bear")) return "/assets/bear-avatar.jpg";
  if (lower.includes("panda")) return "/assets/panda-avatar.jpg";

  // Deterministic hash based on string
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash << 5) - hash + identifier.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % MASCOT_AVATARS.length;
  return MASCOT_AVATARS[index].src;
}
