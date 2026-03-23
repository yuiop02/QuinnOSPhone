# QuinnOSPhone Release Build Notes

QuinnOSPhone is now pointed at the hosted Railway backend by default:

- [https://quinnosbackend-production.up.railway.app](https://quinnosbackend-production.up.railway.app)

That means:

- Expo Go / native mobile uses Railway
- local web preview also uses Railway

## What is ready

- EAS project is configured in [app.json](C:/Users/mrbro/QuinnOSPhone/app.json)
- update URL and runtime version are present
- Android package id is `com.mrbro.quinnos`
- iOS bundle id is `com.mrbro.quinnos`
- preview builds are explicit APKs
- production Android builds are explicit app bundles

## Commands

From [QuinnOSPhone](C:/Users/mrbro/QuinnOSPhone):

```powershell
npm run check
```

Preview Android install build:

```powershell
npm run build:android:preview
```

Production Android store build:

```powershell
npm run build:android:production
```

Production Android submit:

```powershell
npm run submit:android:production
```

## Important notes

- The checked-in native Android project is aligned with the Expo config.
- Production Android permissions were trimmed to the ones QuinnOS actually needs:
  - `INTERNET`
  - `MODIFY_AUDIO_SETTINGS`
  - `RECORD_AUDIO`
  - `VIBRATE`
- QuinnOS no longer depends on a laptop-served Metro bundle for normal use once built.

## What you still need to do

1. Make sure the Railway backend and voice service are up.
2. Log in to Expo/EAS on this machine:

```powershell
eas login
```

3. Build a preview APK first and install it on Android:

```powershell
npm run build:android:preview
```

4. If that works, build the production AAB:

```powershell
npm run build:android:production
```

5. When ready, submit the production build:

```powershell
npm run submit:android:production
```

## Possible post-build checks

- confirm `/run` works from the installed app
- confirm voice playback works from the installed app
- confirm microphone transcription works
- confirm updates resolve through Expo Updates in production
