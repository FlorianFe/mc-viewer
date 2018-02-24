/**
 * `voxel-visualization`
 * A visualisation for minecraft .schematics
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
*/

class VoxelVisualization extends Polymer.mixinBehaviors([Polymer.IronResizableBehavior], Polymer.Element)
{
  static get is() { return 'voxel-visualization'; }

  static get properties()
  {
    return {
      schematicJsonPath:
      {
        type: String
      },
      schematicPath:
      {
        type: String
      },
      schematic:
      {
        type: Object
      },
      texturePackPath:
      {
        type: String,
        value: null
      },
      zoom:
      {
        type: Number,
        value: 1
      }
    };
  }

  static get observers()
  {
    return [
        '_onSchematicJsonPathChanged(schematicJsonPath)',
        '_onSchematicPathChanged(schematicPath)',
        '_onSchematicChanged(schematic)',
        '_onTexturePackPathChanged(texturePackPath)'
    ]
  }

  constructor()
  {
    super();

    // this.scene
    // this.camera
    // this.group

    this.addEventListener('iron-resize', (data) => { this._onResize() });
  }

  ready()
  {
    super.ready();
  }

  _onResize()
  {
    if(this.renderer)
    {
      let width = this.$["container"].clientWidth;
      let height = this.$["container"].clientHeight;

      this.renderer.setSize(width, height);
      this.camera = new THREE.PerspectiveCamera(35, width/height, 0.1, 3000);
    }
  }

  connectedCallback()
  {
    super.connectedCallback();
  }

  _onSchematicJsonPathChanged(schematicJsonPath)
  {
    this._readJsonFile(schematicJsonPath, (data) =>
    {
      this.schematic = JSON.parse(data);
    });
  }

  _onSchematicPathChanged(schematicPath)
  {
    let file = this.baseURI + schematicPath;
    let request = new XMLHttpRequest();
    request.responseType = "arraybuffer";

    request.open("GET", file, true);
    request.onreadystatechange = () =>
    {
      if(request.readyState === 4 && request.status == "200")
      {
        nbt.parse(request.response, (error, data) =>
        {
          if (error) { throw error; }

          let width = data.value.Width.value;
          let height = data.value.Height.value;
          let length = data.value.Length.value;

          let dimension = Math.max(width, height, length);

          let blockIds = data.value.Blocks.value;
          let metaData = data.value.Data.value;

          let blocks = new Array(dimension * dimension * dimension).fill({ id: 0, metaData: 0 });

          for(let x=0; x<width; x++)
          {
            for(let y=0; y<height; y++)
            {
              for(let z=0; z<length; z++)
              {
                let blockId = blockIds[x + y * length * width + z * width];
                let blockMetaData = metaData[x + y * length * width + z * width];

                blocks[x + y * dimension + z * dimension * dimension] = { id: this._charToUnsignedChar(blockId), metaData: blockMetaData };
              }
            }
          }

          this.schematic = { width: dimension, height: dimension, depth: dimension, blocks : blocks };
        });
      }
    }

    request.send(null);
  }

  _charToUnsignedChar(char)
  {
    if(char > 0) return char;
    return (256 + char);
  }

  _onSchematicChanged(schematic)
  {
    let canvas = this.$["canvas"];

    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    this.renderer.setClearColor(0xfbfbfb);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    if(this.scene)
    {
      while(this.scene.children.length > 0)
      {
        this.scene.remove(this.scene.children[0]);
      }
    }

    this.scene = new THREE.Scene();

    var ambientLight = new THREE.AmbientLight(0xdddddd);
    var PointLight = new THREE.PointLight(0xffffff, 0.15);

    this.scene.add(ambientLight);
    this.scene.add(PointLight);

    if(schematic)
    {
      let blocks = schematic.blocks;
      let width = schematic.width;
      let height = schematic.height;
      let depth = schematic.depth;

      let expandedBlocks = this.expand(blocks, width, height, depth);
      let expandedWidth = width + 2;
      let expandedHeight = height + 2;
      let expandedDepth = depth + 2;

      let blockIdListPath = this.resolveUrl("block_id_list.json");

      this._readJsonFile(blockIdListPath, (data) =>
      {
        let blockIdList = JSON.parse(data);
        let solidBlocks = expandedBlocks.map((block) => blockIdList[block.id] ? true : false );
        let filledBlocks = this.fillVoids(solidBlocks, expandedWidth, expandedHeight, expandedDepth);

        let faces = this.extractFaces(expandedBlocks, filledBlocks, expandedWidth, expandedHeight, expandedDepth);


        // THREE.JS stuff

        let faceMap = this.calculateFaceMap(faces);
        let keys = Object.getOwnPropertyNames(faceMap);

        let vertices = new Float32Array(this.calculateVertices(faces, expandedWidth, expandedHeight, expandedDepth));
        let normals = new Float32Array(this.calculateNormals(faces, expandedWidth, expandedHeight, expandedDepth));
        let uvs = new Float32Array(this.calculateUVs(faces, blockIdList));

        this.group = new THREE.Group();

        for(let i=0; i<keys.length; i++)
        {
          let key = keys[i];

          let geometry = new THREE.BufferGeometry();
          let indices = new Uint32Array(this.calculateIndices(faces, faceMap[key]));
          let texture = null;

          if(this.texturePackPath)
          {
            texture = new THREE.TextureLoader().load(this.calculateTexturePath(key, blockIdList));
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.LinearMipMapLinearFilter;
          }

          geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
          geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3));
          geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));
          geometry.setIndex(new THREE.BufferAttribute(indices, 1));

          let materialConfiguration = (this.texturePackPath != null) ? { map: texture } : { color: 0xcccccc };
          let material = new THREE.MeshPhongMaterial(materialConfiguration);
          let mesh = new THREE.Mesh(geometry, material);

          this.group.add(mesh);
        }

        this.scene.add(this.group);
      });

      this.async(() =>
      {
        this._onResize();
      }, 2000);

      // Rendering Routine
      let time = 0;

      let render = () =>
      {
        if(this.renderer && this.camera)
        {
          if(this.group)
          {
            let base = -2;

            this.group.position.set(0, 0, base / this.zoom);
            this.group.rotation.y = time;
          }

          this.renderer.render(this.scene, this.camera);

          time += 0.0025;
        }

        requestAnimationFrame(render);
      }

      render();
    }
  }

  _onTexturePackPathChanged(texturePackPath)
  {
    this._onSchematicChanged();
  }

  calculateTexturePath(key, blockIdList)
  {
    let splittedKey = key.split(".");
    let type = splittedKey[0];
    let metaType = splittedKey[1];
    let normal = JSON.parse(splittedKey[2]);

    let textureObject = (blockIdList[type][metaType]) ? blockIdList[type][metaType] : blockIdList[type]["*"];
    let texture;

    if(typeof textureObject === 'object')
    {
      let orientation = "none";

      if(normal.z == -1) orientation = "north";
      if(normal.x == 1) orientation = "east";
      if(normal.z == 1) orientation = "south";
      if(normal.x == -1) orientation = "west";
      if(normal.y == 1) orientation = "top";
      if(normal.y == -1) orientation = "bottom";

      texture = (textureObject[orientation]) ? textureObject[orientation] : textureObject["*"];
    }
    else
    {
      texture = textureObject;
    }

    let textureName = texture.split(":")[0];

    return [this.baseURI, this.texturePackPath, "/assets/minecraft/textures/blocks/", textureName, ".png"].join("");
  }

  calculateTextureRotation(key, blockIdList)
  {
    let splittedKey = key.split(".");
    let type = splittedKey[0];
    let metaType = splittedKey[1];
    let normal = JSON.parse(splittedKey[2]);

    let textureObject = (blockIdList[type][metaType]) ? blockIdList[type][metaType] : blockIdList[type]["*"];
    let texture;

    if(typeof textureObject === 'object')
    {
      let orientation = "none";

      if(normal.z == -1) orientation = "north";
      if(normal.x == 1) orientation = "east";
      if(normal.z == 1) orientation = "south";
      if(normal.x == -1) orientation = "west";
      if(normal.y == 1) orientation = "top";
      if(normal.y == -1) orientation = "bottom";

      texture = (textureObject[orientation]) ? textureObject[orientation] : textureObject["*"];
    }
    else
    {
      texture = textureObject;
    }

    let textureRotation = parseInt(texture.split(":")[1]);

    return (textureRotation) ? textureRotation : 0;
  }

  calculateVertices(faces, width, height, depth)
  {
    let vertices = [];

    faces.forEach((face) =>
    {
      let x = face.position.x;
      let y = face.position.y;
      let z = face.position.z;

      let normalX = face.normal.x;
      let normalY = face.normal.y;
      let normalZ = face.normal.z;

      let offsetX = -width * 0.5;
      let offsetY = -height * 0.5;
      let offsetZ = -depth * 0.5;

      let maxDimension = Math.max(width, height, depth)

      let faceX = (x + 0.5 * normalX + offsetX) / maxDimension;
      let faceY = (y + 0.5 * normalY + offsetY) / maxDimension;
      let faceZ = (z + 0.5 * normalZ + offsetZ) / maxDimension;

      let blockSize = 1 / maxDimension;

      if(normalZ != 0)
      {
        vertices.push(faceX - 0.5 * blockSize);
        vertices.push(faceY + 0.5 * blockSize);
        vertices.push(faceZ);

        vertices.push(faceX + 0.5 * blockSize);
        vertices.push(faceY + 0.5 * blockSize);
        vertices.push(faceZ);

        vertices.push(faceX + 0.5 * blockSize);
        vertices.push(faceY - 0.5 * blockSize);
        vertices.push(faceZ);

        vertices.push(faceX - 0.5 * blockSize);
        vertices.push(faceY - 0.5 * blockSize);
        vertices.push(faceZ);
      }

      if(normalY != 0)
      {
        vertices.push(faceX - 0.5 * blockSize);
        vertices.push(faceY);
        vertices.push(faceZ + 0.5 * blockSize);

        vertices.push(faceX + 0.5 * blockSize);
        vertices.push(faceY);
        vertices.push(faceZ + 0.5 * blockSize);

        vertices.push(faceX + 0.5 * blockSize);
        vertices.push(faceY);
        vertices.push(faceZ - 0.5 * blockSize);

        vertices.push(faceX - 0.5 * blockSize);
        vertices.push(faceY);
        vertices.push(faceZ - 0.5 * blockSize);
      }

      if(normalX != 0)
      {
        vertices.push(faceX);
        vertices.push(faceY - 0.5 * blockSize);
        vertices.push(faceZ + 0.5 * blockSize);

        vertices.push(faceX);
        vertices.push(faceY + 0.5 * blockSize);
        vertices.push(faceZ + 0.5 * blockSize);

        vertices.push(faceX);
        vertices.push(faceY + 0.5 * blockSize);
        vertices.push(faceZ - 0.5 * blockSize);

        vertices.push(faceX);
        vertices.push(faceY - 0.5 * blockSize);
        vertices.push(faceZ - 0.5 * blockSize);
      }
    });

    return vertices;
  }

  calculateNormals(faces, width, height, depth)
  {
    let normals = [];

    faces.forEach((face) =>
    {
      normals.push(face.normal.x);
      normals.push(face.normal.y);
      normals.push(face.normal.z);

      normals.push(face.normal.x);
      normals.push(face.normal.y);
      normals.push(face.normal.z);

      normals.push(face.normal.x);
      normals.push(face.normal.y);
      normals.push(face.normal.z);

      normals.push(face.normal.x);
      normals.push(face.normal.y);
      normals.push(face.normal.z);
    });

    return normals;
  }

  calculateUVs(faces, blockIdList)
  {
    let uvs = [];

    for(let i=0; i<faces.length; i++)
    {
      let face = faces[i];
      let id = face.block.id;
      let metaData = face.block.metaData;
      let normal = face.normal;
      let normalJson = JSON.stringify(normal);
      let key = [id, metaData, normalJson].join(".");

      let textureRotation = this.calculateTextureRotation(key, blockIdList);

      console.log(textureRotation);

      let normalX = normal.x;
      let normalY = normal.y;
      let normalZ = normal.z;

      let uvRotation;

      if(normalX != 0)
      {
        uvRotation = textureRotation + 270;
      }
      else
      {
        uvRotation = textureRotation;
      }

      console.log(uvRotation)

      let coordinates = [
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0
      ];

      let numberOfPoints = coordinates.length / 2;
      let offset = uvRotation / 90;

      for(let i=0; i<numberOfPoints; i++)
      {
        let index = (offset + i) % numberOfPoints;

        uvs.push(coordinates[index * 2]);
        uvs.push(coordinates[index * 2 + 1]);
      }
    }

    return uvs;
  }

  calculateFaceMap(faces)
  {
    let map = {};

    faces.forEach((face, index) =>
    {
      let id = face.block.id;
      let metaData = face.block.metaData;
      let normal = face.normal;
      let normalJson = JSON.stringify(normal);
      let key = [id, metaData, normalJson].join(".");

      if(map[key])
      {
        map[key].push(index);
      }
      else
      {
        map[key] = [];
        map[key].push(index);
      }
    });

    return map;
  }

  calculateIndices(faces, faceMapIndices)
  {
    let indices = [];

    for(let i=0; i<faceMapIndices.length; i++)
    {
      let faceIndex = faceMapIndices[i];
      let offset = 4 * faceIndex;
      let normal = faces[faceIndex].normal;

      if(normal.x == 1)
      {
        indices.push(0 + offset);
        indices.push(2 + offset);
        indices.push(1 + offset);

        indices.push(0 + offset);
        indices.push(3 + offset);
        indices.push(2 + offset);
      }

      if(normal.x == -1)
      {
        indices.push(0 + offset);
        indices.push(1 + offset);
        indices.push(2 + offset);

        indices.push(0 + offset);
        indices.push(2 + offset);
        indices.push(3 + offset);
      }

      if(normal.y == -1)
      {
        indices.push(0 + offset);
        indices.push(2 + offset);
        indices.push(1 + offset);

        indices.push(0 + offset);
        indices.push(3 + offset);
        indices.push(2 + offset);
      }

      if(normal.y == 1)
      {
        indices.push(0 + offset);
        indices.push(1 + offset);
        indices.push(2 + offset);

        indices.push(0 + offset);
        indices.push(2 + offset);
        indices.push(3 + offset);
      }

      if(normal.z == 1)
      {
        indices.push(0 + offset);
        indices.push(2 + offset);
        indices.push(1 + offset);

        indices.push(0 + offset);
        indices.push(3 + offset);
        indices.push(2 + offset);
      }

      if(normal.z == -1)
      {
        indices.push(0 + offset);
        indices.push(1 + offset);
        indices.push(2 + offset);

        indices.push(0 + offset);
        indices.push(2 + offset);
        indices.push(3 + offset);
      }
    }

    return indices;
  }

  expand(blocks, width, height, depth)
  {
    let expandedWidth = width + 2;
    let expandedHeight = height + 2;
    let expandedDepth = depth + 2;

    let expandedSize = expandedWidth * expandedHeight * expandedDepth;
    let expanded = new Array(expandedSize);

    for(let x=0; x<expandedWidth; x++)
    {
      for(let y=0; y<expandedHeight; y++)
      {
        for(let z=0; z<expandedDepth; z++)
        {
          // when part of the border
          if(x == 0 || y == 0 || z == 0 || x == expandedWidth - 1 || y == expandedHeight - 1 || z == expandedDepth - 1)
          {
            let index = x + y * expandedWidth + z * expandedWidth * expandedHeight;

            expanded[index] = { id: 0, metaData: 0 };
          }
          else
          {
            let sourceIndex = (x-1) + (y-1) * width + (z-1) * width * height;
            let destinationIndex = x + y * expandedWidth + z * expandedWidth * expandedHeight;

            expanded[destinationIndex] = blocks[sourceIndex];
          }
        }
      }
    }

    return expanded;
  }

  fillVoids(sourceBlocks, width, height, depth)
  {
    let alreadyReachedBlocks = new Array(sourceBlocks.length).fill(false);
    let filledBlocks = new Array(sourceBlocks.length);

    let startPosition = { x: 0, y: 0, z: 0};
    let queue = [];

    queue.push(startPosition);

    while(queue.length > 0)
    {
      let position = queue.pop();

      let x = position.x;
      let y = position.y;
      let z = position.z;

      let blockIndex = x + y * width + z * width * height;
      let isSolid = sourceBlocks[blockIndex];
      let alreadyReached = alreadyReachedBlocks[blockIndex];

      if(!isSolid && !alreadyReached)
      {
        alreadyReachedBlocks[blockIndex] = true;

        if(x > 0) queue.push( { x: x - 1, y: y, z: z } );
        if(x < width - 1) queue.push( { x: x + 1, y: y, z: z } );

        if(y > 0) queue.push( { x: x, y: y - 1, z: z } );
        if(y < height - 1) queue.push( { x: x, y: y + 1, z: z } );

        if(z > 0) queue.push( { x: x, y: y, z: z - 1 } );
        if(z < depth - 1) queue.push( { x: x, y: y, z: z + 1 } );
      }
    }

    for(let i=0; i<alreadyReachedBlocks.length; i++)
    {
      let isSolid = sourceBlocks[i];
      let alreadyReached = alreadyReachedBlocks[i];

      if(!alreadyReached)
      {
        if(!isSolid)
        {
          filledBlocks[i] = true;
        }
        else
        {
          filledBlocks[i] = sourceBlocks[i];
        }
      }
    }

    return filledBlocks;
  }

  extractFaces(blocks, solid, width, height, depth)
  {
    let faces = [];

    let lastXValue = false;
    let lastYValue = false;
    let lastZValue = false;

    for(let x=0; x<width; x++)
    {
      for(let y=0; y<height; y++)
      {
        for(let z=0; z<depth; z++)
        {
          let index = x + y * width + z * width * height;
          let zValue = solid[index];

          if(!lastZValue && zValue)
          {
            let block = blocks[index];

            let face = { block: block, position: { x: x, y: y, z: z }, normal: { x: 0, y: 0, z: -1 } };
            faces.push(face);
          }

          if(lastZValue && !zValue)
          {
            let blockIndex = x + y * width + (z-1) * width * height;
            if(blockIndex < 0) console.log("negative index");
            let block = blocks[blockIndex];

            let face = { block: block, position: { x: x, y: y, z: z - 1 }, normal: { x: 0, y: 0, z: 1 } };
            faces.push(face);
          }

          lastZValue = zValue;
        }
      }
    }

    for(let x=0; x<width; x++)
    {
      for(let z=0; z<depth; z++)
      {
        for(let y=0; y<height; y++)
        {
          let index = x + y * width + z * width * height;
          let yValue = solid[index];

          if(!lastYValue && yValue)
          {
            let block = blocks[index];
            let face = { block: block, position: { x: x, y: y, z: z }, normal: { x: 0, y: -1, z: 0 } };
            faces.push(face);
          }

          if(lastYValue && !yValue)
          {
            let blockIndex = x + (y-1) * width + z * width * height;
            if(blockIndex < 0) console.log("negative index");
            let block = blocks[blockIndex];

            let face = { block: block, position: { x: x, y: y - 1, z: z }, normal: { x: 0, y: 1, z: 0 } };
            faces.push(face);
          }

          lastYValue = yValue;
        }
      }
    }

    for(let y=0; y<height; y++)
    {
      for(let z=0; z<depth; z++)
      {
        for(let x=0; x<width; x++)
        {
          let index = x + y * width + z * width * height;
          let xValue = solid[index];

          if(!lastXValue && xValue)
          {
            let block = blocks[index];
            let face = { block: block, position: { x: x, y: y, z: z }, normal: { x: -1, y: 0, z: 0 } };
            faces.push(face);
          }

          if(lastXValue && !xValue)
          {
            let blockIndex = (x-1) + y * width + z * width * height;
            if(blockIndex < 0) console.log("negative index");
            let block = blocks[blockIndex];

            let face = { block: block, position: { x: x - 1, y: y, z: z }, normal: { x: 1, y: 0, z: 0 } };
            faces.push(face);
          }

          lastXValue = xValue;
        }
      }
    }

    return faces;
  }

  _readJsonFile(file, callback)
  {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = () =>
    {
      if(rawFile.readyState === 4 && rawFile.status == "200")
      {
        callback(rawFile.responseText);
      }
    }
    rawFile.send(null);
  }
}

window.customElements.define(VoxelVisualization.is, VoxelVisualization);
