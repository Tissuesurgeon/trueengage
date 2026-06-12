export const COVER_GRADIENTS = [
  'from-indigo-600/80 to-violet-700/80',
  'from-emerald-600/80 to-teal-700/80',
  'from-amber-600/80 to-orange-700/80',
  'from-rose-600/80 to-pink-700/80',
  'from-cyan-600/80 to-blue-700/80',
];

export function coverGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return COVER_GRADIENTS[Math.abs(hash) % COVER_GRADIENTS.length];
}
