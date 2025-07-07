import * as THREE from 'three'
import assets from '../../assets/assets'

export class SceneLoader {
  constructor(listener) {
    this.sceneLoaded = assets.scene_model.scene
    this.listener = listener
    this.setupMaterials()
    this.setupScene()
  }

  setupMaterials() {
    this.commonGradientMaterial = new THREE.MeshStandardMaterial({
      map: assets.gradient_img,
      side: THREE.DoubleSide,
    })

    this.commonGradientPatternMaterial = this.commonGradientMaterial.clone()

    this.commonGradientPatternMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.map2 = { value: assets.pattern_img }
      shader.uniforms.repeatScale = { value: 8.0 }

      shader.vertexShader = shader.vertexShader.replace(
        '#include <uv_pars_vertex>',
        `
            #include <uv_pars_vertex>
            attribute vec2 uv1;
            varying vec2 vUv1;
            `
      )

      shader.vertexShader = shader.vertexShader.replace(
        '#include <uv_vertex>',
        `
            #include <uv_vertex>
            vUv1 = uv1;
            `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <uv_pars_fragment>',
        `
            #include <uv_pars_fragment>
            varying vec2 vUv1;
            uniform sampler2D map2;
            uniform float repeatScale;
            `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
            #ifdef USE_MAP
              vec4 sampledDiffuseColor = texture2D( map, vMapUv );
              vec4 patternColor = texture2D( map2, vUv1 * repeatScale );
              diffuseColor *= mix(sampledDiffuseColor, patternColor, patternColor.a);
            #endif
            `
      )
    }

    this.memoriesMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      side: THREE.DoubleSide,
      opacity: 0,
    })
  }

  setupScene() {
    const positionalLoopsMap = {
      'Beach-Audio': assets.beach_audio,
      'Waterfall-Audio': assets.waterfall_audio,
      'Birds-Audio': assets.birds_audio,
      'Positional-Audio': assets.positional_audio,
    }

    const positionalLoopAudios = []
    const positionalAudios = []
    this.sceneLoaded.traverse((node) => {
      if (node.type === 'SkinnedMesh') {
        node.frustumCulled = false
      }

      if (node.isMesh) {
        switch (node.material.name) {
          case 'gradient':
            node.material = this.commonGradientMaterial
            break
          case 'gradientPattern':
            node.material = this.commonGradientPatternMaterial
            break
          case 'memories':
            node.material = this.memoriesMaterial
            break
        }
        if (node.userData.noShadows !== true) {
          node.castShadow = true
          node.receiveShadow = true
        } else {
          node.renderOrder = 1
        }
      }
      if (node.isLight && node.type === 'DirectionalLight') {
        node.castShadow = true

        node.shadow.camera.left = -80
        node.shadow.camera.right = 80
        node.shadow.camera.top = 80
        node.shadow.camera.bottom = -80
        node.shadow.camera.near = -200
        node.shadow.camera.far = 200

        node.shadow.mapSize.width = 2048
        node.shadow.mapSize.height = 2048
        node.shadow.bias = -0.001
      }
      if (node.name?.includes('Audio')) {
        const audio = new THREE.PositionalAudio(this.listener)
        audio.setBuffer(positionalLoopsMap[node.name])
        audio.setRefDistance(10)
        audio.setMaxDistance(25)
        node.add(audio)
        if (node.userData.loop === true) {
          audio.loop = true
          positionalLoopAudios.push(audio)
        } else {
          positionalAudios.push(audio)
        }
      }
      if (node.name?.includes('Memories-Driver')) {
        this.sceneLoaded.memoriesDriver = node
      }
    })
    this.sceneLoaded.positionalLoopAudios = positionalLoopAudios
    this.sceneLoaded.positionalAudios = positionalAudios
    this.sceneLoaded.memoriesMaterial = this.memoriesMaterial
  }

  getCameraRig() {
    let cameraRig = null
    this.sceneLoaded.traverse((node) => {
      if (node.name === 'CameraRig') {
        cameraRig = node
      }
    })
    return cameraRig
  }

  getScene() {
    return this.sceneLoaded
  }
}
