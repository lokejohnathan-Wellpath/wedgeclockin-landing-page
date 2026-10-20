type VoiceLocale = { lang: string };
export function malayVoice<T extends VoiceLocale>(voices: T[]): T | undefined {
  const locale=(v:T)=>v.lang.replace(/_/g,'-').toLowerCase();
  return voices.find(v=>locale(v)==='ms-my');
}
