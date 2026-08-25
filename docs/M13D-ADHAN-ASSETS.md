# M13D — Adhan Audio Asset Record

Status date: 2026-08-25

## Runtime boundary

These recordings are registered only for `full-playback`.

They are intended for foreground, user-initiated playback. They are not native
notification sounds and must not be passed to Android or iOS notification sound
APIs.

`APPROVED_ADHAN_CUES` remains empty. Prayer alerts therefore continue to use
the operating-system notification sound.

## Standard / Regular Adhan

Runtime file:

`public/audio/adhan/regular-adhan.mp3`

Runtime SHA-256:

`7BA5B33B89B1A136F09F08DAC28E99F6BFB6BEAAA55AAC77F2C863EA9FCF2807`

Runtime duration:

`154.017959` seconds

Runtime encoding:

MP3, 160 kbps, 44.1 kHz stereo.

Source:

Wikimedia Commons — `File:Beautiful adhan.ogg`

https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg

Source author:

Adam-synagda

Source declaration:

Own work.

Source license:

CC0 1.0 Universal.

https://creativecommons.org/publicdomain/zero/1.0/

Original Wikimedia SHA-1:

`a1fa4fd942401922c5c3301816384aae86956522`

Original file size:

1,229,032 bytes.

Transformation:

The verified Wikimedia OGG source was re-encoded to MP3 at 160 kbps with
FFmpeg for application playback.

Content review:

The production MP3 was listened to in full on 2026-08-25 and accepted for
Adhan content: complete recording, acceptable wording, and no unwanted music,
speech, or unrelated audio were reported.

## Fajr Adhan

Runtime file:

`public/audio/adhan/fajr-adhan.mp3`

Runtime SHA-256:

`080D1203872434E77E162D10CC8DA6321F60AC2328C8B13AE4BC3371449C0284`

Runtime duration:

`247.5535` seconds

Runtime encoding:

MP3, 160 kbps, 48 kHz stereo.

Source:

Wikimedia Commons —
`File:Eid al-Fitr Fajr azan at Malmö Mosque - 19 August 2012.webm`

https://commons.wikimedia.org/wiki/File:Eid_al-Fitr_Fajr_azan_at_Malm%C3%B6_Mosque_-_19_August_2012.webm

Source / attributed author:

Islamic Center Malmö.

Source date:

19 August 2012.

Source license:

Creative Commons Attribution 3.0 Unported (CC BY 3.0).

https://creativecommons.org/licenses/by/3.0/

Required attribution:

Islamic Center Malmö.

Original Wikimedia SHA-1:

`bc75d5cee271efb67f03d3f35474a9362fce103f`

Original file size:

78,385,315 bytes.

Transformation disclosure:

The source WebM video was downloaded and integrity-checked. Its Opus audio
stream was extracted without audio transcoding, then re-encoded to MP3 at
160 kbps with FFmpeg. The video component is not distributed by Mushaf
Companion.

Content review:

The production MP3 was listened to in full on 2026-08-25 and accepted as a
Fajr Adhan recording, including the expected Fajr-specific wording, with no
unwanted music, announcements, or unrelated audio reported.

Rights-review note:

Wikimedia records that the original YouTube upload was available under the
stated Creative Commons license when checked by YouTubeReviewBot on
2020-02-12. Wikimedia also states that the automated license check does not
replace human review for possible derivative-work, freedom-of-panorama, or
other copyright issues. This caveat remains part of the project provenance
record and must not be represented as independently resolved merely by
technical or content QA.

## Excluded sources

Previously downloaded Assabile recordings are not production assets. No
redistribution permission suitable for application bundling was established,
so they remain excluded.

## Notification cue status

No approved `<30 second` Adhan notification cue is bundled by M13D.

Android/iOS prayer notifications continue to use the system notification
sound. Full Adhan recordings must not be substituted into the notification
cue path.

## Final validation evidence

Validation completed on 2026-08-25.

- Focused Adhan/prayer regression suite: **49 / 49 passed**.
- ESLint: **0 errors and 0 M13D-introduced warnings**; 21 unrelated baseline warnings remain in Hadith/Islamic Foundations files.
- Pages exact-artifact policy suite: **8 / 8 passed**.
- `npm run build:pages`: **passed**.
- `npm run verify:pages`: **passed**, including the `/mushaf-companion/` runtime scope.
- Built Regular Adhan SHA-256: `7BA5B33B89B1A136F09F08DAC28E99F6BFB6BEAAA55AAC77F2C863EA9FCF2807`.
- Built Fajr Adhan SHA-256: `080D1203872434E77E162D10CC8DA6321F60AC2328C8B13AE4BC3371449C0284`.
- Manual production Pages QA: **Regular Adhan playback passed; Stop passed; Fajr Adhan playback passed; attribution display passed**.
- Full repository gate via `npm test`: **592 / 592 passed, 0 failed**.

### Runtime boundary confirmed

M13D does not convert either full recording into a notification sound.

The production notification boundary remains:

- full Regular/Fajr recordings: explicit foreground playback only;
- custom Adhan notification cue: none approved;
- native notification fallback: platform system sound;
- background or closed-app full-Adhan autoplay: not claimed or implemented by M13D.
