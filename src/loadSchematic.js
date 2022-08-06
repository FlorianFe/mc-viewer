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
    
        const palette = data.value.Palette.value;
        const paletteMax = data.value.PaletteMax.value;
        const blockData = data.value.BlockData.value;
    
        const keys = Object.keys(palette);
        let map = new Array(paletteMax);
    
        keys.forEach((paletteKey) => 
        {
            const paletteValue = palette[paletteKey].value;
    
            map[paletteValue] = paletteKey.split('[')[0];
        });

        const sx = data.value.Width.value;
        const sy = data.value.Height.value;
        const sz = data.value.Length.value;

        const binarifiedBlockData = blockData.map((item) => 
        {
            if(fullBlockList.includes(map[item]))
            {
                const BASE_PATH = "texture pack/assets/minecraft/models/block/"
                parseJsonFile(BASE_PATH + map[item].split(':')[1] + '.json', (childData) => { /*console.log(childData)*/ })
                return item;
            }
            else
            {
                return -1;
            }
        }); 


        let blocks = ndarray(binarifiedBlockData, [sy, sz, sx]);
        let transposedBlocks = blocks.transpose(1, 0, 2);

        let triangulatedVoxels = triangulateVoxels(transposedBlocks, { exclude: [-1] });

        console.log(triangulatedVoxels);

        callback(triangulatedVoxels);
    });
}
