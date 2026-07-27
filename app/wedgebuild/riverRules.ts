export function indicativeRiverReserve(channelWidthM: number) {
  if (channelWidthM > 40) return 50;
  if (channelWidthM > 20) return 40;
  if (channelWidthM > 10) return 20;
  if (channelWidthM >= 5) return 10;
  return 5;
}
