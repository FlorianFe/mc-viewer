
import { html, LitElement } from 'lit-element/lit-element';
import { flatten } from 'ramda';
import axios from 'axios'
import { parse } from 'prismarine-nbt'
import { BufferGeometry, BufferAttribute, MeshStandardMaterial, Mesh, TextureLoader, RepeatWrapping } from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

import filterTexturesByBlock from './src/filterTexturesByBlock'
import prefetchJSONFiles from './src/prefetchJSONFiles/prefetchJSONFiles'

import '@google/model-viewer'

/**
 * `mc-viewer`
 * displays mc voxel data
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */

class McViewer extends LitElement 
{
  static get is()
  {
    return 'mc-viewer';
  }

  static get properties()
  {
      return {
        src: { type: String },

        alt: { type: String },
        ar: { type: Boolean },
        autoRotate: { type: Boolean, attribute: 'auto-rotate' },
        autoRotateDelay: { type: Number, attribute: 'auto-rotate-delay' },
        autoplay: { type: Boolean },
        backgroundColor: { type: String, attribute: 'background-color' },
        backgroundImage: { type: String, attribute: 'background-image' },
        cameraControls: { type: Boolean, attribute: 'camera-controls' },
        cameraOrbit: { type: String, attribute: 'camera-orbit' },
        cameraTarget: { type: String, attribute: 'camera-target' },
        environmentImage: { type: String, attribute: 'environment-image' },
        exposure: { type: Number  },
        fieldOfView: { type: String, attribute: 'field-of-view' },
        interactionPolicy: { type: String },
        interactionPrompt: { type: String },
        interactionPromptStyle: { type: String },
        interactionPromptTreshold: { type: Number },

        preload: { type: Boolean },
        reveal: { type: String },
        shadowIntensity: { type: Number, attribute: 'shadow-intensity'},
        unstableWebxr: { type: Boolean, attribute: 'unstable-webxr' }
      }
  }

  constructor()
  {
    super()

    this.alt = 'a mc model' // changed
    this.ar = false
    this.autoRotate = false
    this.autoRotateDelay = 3000
    this.autoplay = false
    this.backgroundColor = 'white'
    this.cameraControls = false
    this.cameraOrbit = '0deg 75deg 105%'
    this.cameraTarget = 'auto auto auto'
    this.exposure = 1.0
    this.fieldOfView = 'auto'
    this.interactionPolicy = 'always-allow'
    this.interactionPrompt = 'auto'
    this.interactionPromptStyle = 'wiggle'
    this.interactionPromptTreshold = 3000
    
    this.preload = false
    this.reveal = 'auto'
    this.shadowIntensity = 0.0
    this.unstableWebxr = false
  }

  get currentTime() { return this.shadowRoot.querySelector('#model-viewer').currentTime; }
  get paused() { return this.shadowRoot.querySelector('#model-viewer').paused; }

  getCameraOrbit() { return this.shadowRoot.querySelector('#model-viewer').getCameraOrbit(); }
  getFieldOfView() { return this.shadowRoot.querySelector('#model-viewer').getFieldOfView(); }
  jumpCameraToGoal() { this.shadowRoot.querySelector('#model-viewer').jumpCameraToGoal(); }
  play() { this.shadowRoot.querySelector('#model-viewer').play(); }
  pause() { this.shadowRoot.querySelector('#model-viewer').pause(); }
  resetTurntableRotation() { this.shadowRoot.querySelector('#model-viewer').resetTurntableRotation(); }
  toDataURL(type, encoderOptions) { return this.shadowRoot.querySelector('#model-viewer').toDataURL(type, encoderOptions); }

  updated(changedProperties) 
  {
    if(changedProperties.has('src'))
    {
      this.initialized = false;
      this.loadVoxModel(this.src, changedProperties);
    }

    this.setup(changedProperties);
  }

  setup(changedProperties)
  {
    changedProperties.forEach((_, propertyName) => 
    {
      if(this[propertyName] != undefined)
      {
        if(propertyName !== 'src')
        {
          this.shadowRoot.querySelector('#model-viewer')[propertyName] = this[propertyName];
        }
      }
    })
  }

  loadVoxModel(fileURL)
  {
    axios
      .get(fileURL, { responseType: 'arraybuffer' })
      .then(async (schematicEncodedResponse) => 
      {
        // ! Buffer needs to be polyfilled / defined globally
        const { parsed } = await parse(Buffer(schematicEncodedResponse.data))
        const paletteKeys = Object.keys(parsed.value.Palette.value)
        // const textures = getTexturesOfPaletteEntries(paletteKeys)

        const BLOCK_STATE_BASE_PATH = 'texture-pack/assets/minecraft/blockstates'
        const SUB_PATHS = [ 'dirt' ]
        
        const blockStatePaths = SUB_PATHS.map((subPath) => [BLOCK_STATE_BASE_PATH, subPath].join('/') + '.json' )

        const prefetched = await prefetchJSONFiles(blockStatePaths)

        console.log(prefetched)
      })
  }

  render()
  {
    return html`

      <style>

        :host
        {
          display: block;
          padding: 5px;
        }

        #model-viewer
        {
          width: 100%;
          height: 100%;
        }

      </style>

      <model-viewer id="model-viewer"></model-viewer>
    `;
  }
}

window.customElements.define('mc-viewer', McViewer);
