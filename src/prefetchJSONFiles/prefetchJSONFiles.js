
import resolvePathsDeeply from './resolvePathsDeeply'

const ignoreNameSpace = (str) => 
{
    return (str.includes(':')) ? str.split(':')[1] : str
}

const prefetchJSONFiles = async (paths) => 
{
    const MODELS_BASE_PATH = 'texture-pack/assets/minecraft/models'

    return await resolvePathsDeeply(paths, (obj, enqueue) => 
    { 
        if(obj.variants != undefined)
        {
            for(const variant of Object.values(obj.variants))
            {
                if(Array.isArray(variant))
                {
                    for(const variantEntry of variant)
                    {
                        const path = [ MODELS_BASE_PATH, ignoreNameSpace(variantEntry.model) ].join('/') + '.json'
                        enqueue(path)
                    }
                } 
                else
                {
                    const path = [ MODELS_BASE_PATH, ignoreNameSpace(variant.model) ].join('/') + '.json'
                    enqueue(path)
                }
            }
        }

        if(obj.parent != undefined)
        {
            const path = [ MODELS_BASE_PATH, ignoreNameSpace(obj.parent) ].join('/') + '.json'
            enqueue(path)
        }

        return obj
    })
}

export default prefetchJSONFiles