const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

function ensureApplicationTheme(manifest) {
  if (!manifest || !manifest.manifest || !manifest.manifest.application) return manifest;
  const app = manifest.manifest.application[0];
  app.$ = app.$ || {};
  if (!app.$['android:theme']) {
    app.$['android:theme'] = '@style/Theme.EdgeToEdge';
  }
  return manifest;
}

module.exports = function withEdgeToEdge(config) {
  config = withAndroidManifest(config, config => {
    config.modResults = ensureApplicationTheme(config.modResults);
    return config;
  });

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const valuesDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'values');
      if (!fs.existsSync(valuesDir)) {
        fs.mkdirSync(valuesDir, { recursive: true });
      }

      const stylesPath = path.join(valuesDir, 'styles_edge_to_edge.xml');
      const stylesXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <style name="Theme.EdgeToEdge" parent="Theme.MaterialComponents.DayNight.NoActionBar">
    <item name="android:windowDrawsSystemBarBackgrounds">true</item>
    <item name="android:statusBarColor">@android:color/transparent</item>
    <item name="android:navigationBarColor">@android:color/transparent</item>
    <item name="android:fitsSystemWindows">false</item>
  </style>
</resources>
`;
      fs.writeFileSync(stylesPath, stylesXml);
      return config;
    }
  ]);

  return config;
};

module.exports.pluginName = 'withEdgeToEdge';
