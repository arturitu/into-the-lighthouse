// Based on https://github.com/MozillaReality/hello-webxr/blob/master/src/lib/assetManager.js
import * as THREE from 'three'
// import { BasisTextureLoader } from 'three/examples/jsm/loaders/BasisTextureLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { FontLoader } from 'three/examples/jsm/Addons.js'

const DRACO_LIB_PATH = 'vendor/'

function allAssetsLoaded(assets) {
  for (var i in assets) {
    if (assets[i].loading === true) {
      return false
    }
  }
  return true
}

export async function loadAssets(
  basePath,
  assets,
  onComplete,
  onProgress,
  debug
) {
  if (basePath && basePath[basePath.length - 1] !== '/') {
    basePath += '/'
  }

  // var basisLoader = new BasisTextureLoader()
  // basisLoader.setTranscoderPath(BASIS_LIB_PATH)
  // basisLoader.detectSupport(renderer)

  var gltfLoader = new GLTFLoader()
  var dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath(DRACO_LIB_PATH)
  gltfLoader.setDRACOLoader(dracoLoader)

  var texLoader = new THREE.TextureLoader()
  var objLoader = new OBJLoader()
  var fontLoader = new FontLoader()
  var audioLoader = new THREE.AudioLoader()

  var loaders = {
    gltf: gltfLoader,
    glb: gltfLoader,
    obj: objLoader,
    gif: texLoader,
    png: texLoader,
    jpg: texLoader,
    // 'basis': basisLoader,
    font: fontLoader,
    mp3: audioLoader,
  }

  let totalBytes = 0
  const assetSizes = {}

  for (const assetId in assets) {
    const assetPath = assets[assetId].url
    try {
      const response = await fetch(basePath + assetPath, { method: 'HEAD' })
      if (response.ok) {
        const contentLength = response.headers.get('Content-Length')
        if (contentLength) {
          assetSizes[assetId] = parseInt(contentLength, 10)
          totalBytes += assetSizes[assetId]
        } else {
          console.warn(
            'Content-Length header not found for asset: ' +
              assetPath +
              '. Progress may be inaccurate.'
          )
          assetSizes[assetId] = assets[assetId].size || 0
          totalBytes += assetSizes[assetId]
        }
      } else {
        console.error(
          'Failed to fetch asset size for: ' +
            assetPath +
            ' - ' +
            response.status
        )
        assetSizes[assetId] = assets[assetId].size || 0
        totalBytes += assetSizes[assetId]
      }
    } catch (error) {
      console.error('Error fetching asset size for: ' + assetPath, error)
      assetSizes[assetId] = assets[assetId].size || 0
      totalBytes += assetSizes[assetId]
    }
  }

  const loadedBytes = {}

  for (var i in assets) {
    let assetId = i
    let assetPath = assets[i].url
    assets[i].loading = true
    let ext = assetPath.substr(assetPath.lastIndexOf('.') + 1).toLowerCase()
    if (typeof loadedBytes[assetId] === 'undefined') {
      loadedBytes[assetId] = 0
    }

    const currentAssetSize = assetSizes[assetId] || 0

    if (['png', 'jpg', 'gif'].includes(ext)) {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', basePath + assetPath, true)
      xhr.responseType = 'blob'
      xhr.onprogress = (e) => {
        if (e.lengthComputable) {
          loadedBytes[assetId] = Math.max(loadedBytes[assetId], e.loaded)
          if (onProgress) {
            const sumLoaded = Object.values(loadedBytes).reduce(
              (a, b) => a + b,
              0
            )
            onProgress(sumLoaded, totalBytes)
          }
        }
      }
      xhr.onload = () => {
        if (xhr.status === 200) {
          const blobUrl = URL.createObjectURL(xhr.response)
          texLoader.load(
            blobUrl,
            (texture) => {
              if (debug) {
                console.info('%c ' + assetPath + ' loaded', 'color:green')
              }
              var options = assets[assetId].options
              assets[assetId] = texture
              if (typeof options !== 'undefined') {
                if (typeof options.repeat !== 'undefined') {
                  assets[assetId].repeat.set(
                    options.repeat[0],
                    options.repeat[1]
                  )
                  delete options.repeat
                }
                for (let opt in options) {
                  assets[assetId][opt] = options[opt]
                }
              }
              if (loadedBytes[assetId] < currentAssetSize) {
                loadedBytes[assetId] = currentAssetSize
                if (onProgress) {
                  const sumLoaded = Object.values(loadedBytes).reduce(
                    (a, b) => a + b,
                    0
                  )
                  onProgress(sumLoaded, totalBytes)
                }
              }
              if (onComplete && allAssetsLoaded(assets)) {
                onComplete()
              }
              URL.revokeObjectURL(blobUrl)
            },
            undefined,
            (e) => {
              console.error('Error loading asset', e)
            }
          )
        } else {
          console.error('Error loading asset', xhr.status)
        }
      }
      xhr.onerror = (e) => {
        console.error('Error loading asset', e)
      }
      xhr.send()
      continue
    }

    loaders[ext].load(
      basePath + assetPath,
      (asset) => {
        if (debug) {
          console.info('%c ' + assetPath + ' loaded', 'color:green')
        }
        var options = assets[assetId].options
        assets[assetId] = ext === 'font' ? asset.data : asset

        if (typeof options !== 'undefined') {
          if (typeof options.repeat !== 'undefined') {
            assets[assetId].repeat.set(options.repeat[0], options.repeat[1])
            delete options.repeat
          }
          for (let opt in options) {
            assets[assetId][opt] = options[opt]
          }
        }
        if (loadedBytes[assetId] < currentAssetSize) {
          loadedBytes[assetId] = currentAssetSize
          if (onProgress) {
            const sumLoaded = Object.values(loadedBytes).reduce(
              (a, b) => a + b,
              0
            )
            onProgress(sumLoaded, totalBytes)
          }
        }
        if (onComplete && allAssetsLoaded(assets)) {
          onComplete()
        }
      },
      (xhr) => {
        if (xhr && xhr.lengthComputable) {
          loadedBytes[assetId] = Math.min(
            Math.max(loadedBytes[assetId], xhr.loaded),
            currentAssetSize
          )
          if (onProgress) {
            const sumLoaded = Object.values(loadedBytes).reduce(
              (a, b) => a + b,
              0
            )
            onProgress(sumLoaded, totalBytes)
          }
        }
      },
      (e) => {
        console.error('Error loading asset', e)
      }
    )
  }
}
