
import { html, LitElement } from 'lit-element/lit-element';
import { flatten } from 'ramda';
import axios from 'axios'
import { parse } from 'prismarine-nbt'
import { BufferGeometry, BufferAttribute, MeshStandardMaterial, Mesh, TextureLoader, RepeatWrapping } from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

import filterTexturesByBlock from './src/filterTexturesByBlock'
import resolveBlockStates from './src/resolveBlockStates/resolveBlockStates'
import processNBT from './src/processNBT/processNBT'

import '@google/model-viewer'


const first = (arr) => 
{
  if(arr.lengeth < 1) throw new Error("Array has no first Element")
  return arr[0]
}

const second = (arr) => 
{
  if(arr.length < 2) throw new Error("Array has no second Element")
  return arr[1]
}

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

  async loadVoxModel(fileURL)
  {
    // 1. load SchematicFile
    await axios
      .get(fileURL, { responseType: 'arraybuffer' })
      .then(async (schematicEncodedResponse) => 
      {
        // 2. parse schematic File
        // ! Buffer needs to be polyfilled / defined globally
        const { parsed } = await parse(Buffer(schematicEncodedResponse.data))
        
        // 3. process NBT of Schematic File
        const schematic = processNBT(parsed)
        const palette = schematic.palette
        // const textures = getTexturesOfPaletteEntries(paletteKeys)

        // 4. prefetch Block States of Schematic File Dependencies
        const BLOCK_STATE_BASE_PATH = 'texture-pack/assets/minecraft/blockstates'
        const subPaths = palette.map((paletteEntry) => first(second(paletteEntry.split(':')).split('[')))
        const blockStatePaths = subPaths.map((subPath) => [ BLOCK_STATE_BASE_PATH, subPath ].join('/') + '.json')
        const resolvedBlockStates = await resolveBlockStates(blockStatePaths)

        console.log(subPaths, blockStatePaths, resolvedBlockStates)
      })
  }

  render()
  {
    return html`

      <style>

        :host
        {
          display: block;
        }

      </style>

      <model-viewer id="model-viewer"></model-viewer>
    `;
  }
}

// Registration
(() => 
{
  if(Buffer == undefined) throw new Error("Buffer must be polyfilled")
  if(process == undefined || process.nextTick == undefined) throw new Error("process.nextTick must be polyfilled")

  customElements.define('mc-viewer', McViewer)
})()