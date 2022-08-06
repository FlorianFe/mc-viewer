
const getTexturesOfPaletteEntry = (entry, prefetchedJSONFiles) => 
{
    

    return {
        top: { name: 'top.png', clockWiseRotations: 0 },
        bottom: {  name: 'bottom.png', clockWiseRotations: 0 },
        north: {  name: 'north.png', clockWiseRotations: 0 },
        east: {  name: 'east.png', clockWiseRotations: 0 },
        south:  {  name: 'south.png', clockWiseRotations: 0 },
        west: {  name: 'west.png', clockWiseRotations: 0 }
    }
}


const getTexturesOfPaletteEntries = (palette, prefetchedJSONFiles) => 
{
    return palette.map((entry) => getTexturesOfPaletteEntry(entry, prefetchedJSONFiles))
}

export default getTexturesOfPaletteEntries