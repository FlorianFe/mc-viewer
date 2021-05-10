
import parseJSONFile from './parseJSONFile'

const parseBlockState = (blockStateString) => 
{
    const assignments = blockStateString
        .split(',')
        .map(assignment => assignment.split('='))

    let assignmentsMap = new Map()

    for(assignment in assignmentsMap)
    {
        assignmentsMap.set(assignment[0], assignement[1])
    }

    return assignmentsMap
}

async function filterTexturesByBlockRecursively (path)
{
    const model = await parseJSONFile(path)

    if(model.parent != undefined)
    {
        const subPath = [
            'texture pack', 
            'assets', 
            'minecraft',
            'models', 
            model.parent.split('/')[0], 
            model.parent.split('/')[1], 
        ].join('/') + '.json'
        
        const result = await filterTexturesByBlockRecursively(subPath)

        return [ model, ...result]
    }
    else
    {
        return [ model ]
    }
}

async function filterTexturesByBlock (blockString)
{
    const startPosOfBlockState = blockString.indexOf('[') + 1
    const endPosOfBlockState = blockString.indexOf(']')

    const blockId = blockString.substring(0, startPosOfBlockState - 1)
    const blockStateAssignments = parseBlockState(blockString.substring(startPosOfBlockState, endPosOfBlockState))

    const path = [
        'texture pack', 
        'assets', 
        blockId.split(':')[0], 
        'models', 
        'block', 
        blockId.split(':')[1]
    ].join('/') + '.json'

    const result = await filterTexturesByBlockRecursively(path)

    return result
}

export default filterTexturesByBlock;