import * as THREE from 'three'
export default {
  scene_model: { url: 'models/scene.glb' },
  track_audio: { url: 'audios/ambient.mp3' },
  beach_audio: { url: 'audios/beach.mp3' },
  waterfall_audio: { url: 'audios/waterfall.mp3' },
  birds_audio: { url: 'audios/birds.mp3' },
  positional_audio: { url: 'audios/positional.mp3' },
  gradient_img: {
    url: 'textures/gradient-atlas.jpg',
    options: {
      colorSpace: THREE.SRGBColorSpace,
      flipY: false,
    },
  },
  pattern_img: {
    url: 'textures/rock-pattern.png',
    options: {
      colorSpace: THREE.SRGBColorSpace,
      flipY: false,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
    },
  },
}
