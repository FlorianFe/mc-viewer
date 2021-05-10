import nbt from 'nbt';
import triangulateVoxels from 'voxel-triangulation';
import ndarray from 'ndarray';
import zeros from 'zeros';

import parseJsonFile from './parseJSONFile';

let fullBlockList = require('../block data/full_block_list.json');


export default function (fileContent, callback)
{
    nbt.parse(fileContent, (error, data) =>
    {
        if (error) { throw error; }
    
        console.log(data);
        console.log(data.value.Palette);
        console.log(data.value.BlockData);
    
        let palette = data.value.Palette.value;
        let paletteMax = data.value.PaletteMax.value;
        let blockData = data.value.BlockData.value;
    
        let keys = Object.keys(palette);
        let map = new Array(paletteMax);
    
        keys.forEach((paletteKey) => 
        {
            let paletteValue = palette[paletteKey].value;
    
            map[paletteValue] = paletteKey.split('[')[0];
        });

        let sx = data.value.Width.value;
        let sy = data.value.Height.value;
        let sz = data.value.Length.value;

        let binarifiedBlockData = blockData.map((item) => 
        {
            if(fullBlockList.includes(map[item]))
            {
                let basePath = "texture pack/assets/minecraft/models/block/";
                parseJsonFile(basePath + map[item].split(':')[1] + '.json', (data) => { /*console.log(data)*/ })
                return item;
            }
            else
            {
                return -1;
            }
        }); 


        let blocks = ndarray(binarifiedBlockData, [sy, sz, sx]);
        let transposedBlocks = blocks.transpose(1, 0, 2);

        // console.log(transposedBlocks);

        let triangulatedVoxels = triangulateVoxels(transposedBlocks, { exclude: [-1] });

        console.log(triangulatedVoxels);

        // console.log(triangulatedVoxels.vertices);

        callback(triangulatedVoxels);
    });
}
