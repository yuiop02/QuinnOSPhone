import { prepareQuinnLocalVoiceSpeakUrl } from './quinnLocalVoice.shared';

export {
  getQuinnLocalVoiceBaseUrl,
  getQuinnLocalVoiceHealthUrl,
  getQuinnLocalVoiceSpeakRequestKey,
  getQuinnLocalVoiceSpeakUrl,
  getQuinnVoicePlaybackStartDelayMs,
  isQuinnLocalVoiceRemoteSource,
  pingQuinnLocalVoice,
  prepareQuinnLocalVoiceSpeakUrl,
} from './quinnLocalVoice.shared';

export async function prepareQuinnLocalVoicePlaybackSource(
  text: string,
  {
    previousText = '',
    nextText = '',
  }: {
    previousText?: string;
    nextText?: string;
  } = {}
): Promise<string> {
  return prepareQuinnLocalVoiceSpeakUrl(text, {
    previousText,
    nextText,
  });
}
