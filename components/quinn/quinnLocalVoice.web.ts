import { prepareQuinnLocalVoiceSpeakUrl } from './quinnLocalVoice.shared';
import type { QuinnVoiceTtsHint } from './quinnVoiceProsody';

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
    prosodyHint = null,
  }: {
    previousText?: string;
    nextText?: string;
    prosodyHint?: QuinnVoiceTtsHint | null;
  } = {}
): Promise<string> {
  return prepareQuinnLocalVoiceSpeakUrl(text, {
    previousText,
    nextText,
    prosodyHint,
  });
}
