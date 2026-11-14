jsQR 1.4.0 — https://github.com/cozmo/jsQR

Source: https://registry.npmjs.org/jsqr/-/jsqr-1.4.0.tgz
Original package/dist/jsQR.js SHA-256:
bc40c8a15196236b2314db0856f72ca0b49980cd5413b8c852a7349f5fee0859

The distributed webpack UMD wrapper was replaced with:
`const jsQR = (function() { ...original factory body... })(); export default jsQR;`
No decoder logic was changed. Apache-2.0 license is in jsqr-LICENSE.
The module is served locally and included in the offline app shell.
Camera frames are decoded in the browser; they are not uploaded.
