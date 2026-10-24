const { withAppBuildGradle } = require('expo/config-plugins');

const marker = '// Smart Audio Guide: short Windows CMake paths';
const block = `    ${marker}
    if (System.getProperty('os.name').toLowerCase().contains('windows')) {
        defaultConfig {
            externalNativeBuild {
                cmake {
                    arguments "-DCMAKE_OBJECT_PATH_MAX=240"
                }
            }
        }
        externalNativeBuild {
            cmake {
                buildStagingDirectory file("../../../.cxx")
            }
        }
    }
`;

function patchGradle(contents) {
  if (contents.includes(marker)) return contents;
  if (!/^android\s*\{/m.test(contents)) throw new Error('Android Gradle block not found; review CMake path configuration.');
  return contents.replace(/^android\s*\{\r?\n/m, match => match + block);
}

module.exports = config => withAppBuildGradle(config, mod => {
  if (mod.modResults.language !== 'groovy') throw new Error('Short CMake paths plugin expects Groovy build.gradle.');
  mod.modResults.contents = patchGradle(mod.modResults.contents);
  return mod;
});
module.exports.patchGradle = patchGradle;
