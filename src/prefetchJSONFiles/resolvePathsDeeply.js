
import axios from 'axios'

const resolvePathsDeeply = (paths, func) => 
{
    return new Promise((resolve, reject) =>
    {
        let result = new Map()
        let openPromisses = 0
        let alreadyProcessedPaths = new Set()

        const process = (path) => 
        {
            if(!alreadyProcessedPaths.has(path))
            {
                axios
                    .get(path)
                    .then((response) => 
                    { 
                        const obj = response.data
                        result.set(path, obj)
                        func(obj, process)

                        openPromisses--

                        if(openPromisses === 0)
                        {
                            resolve(result)
                        }
                    })
                    .catch((e) =>
                    {
                        reject(e)
                    })

                openPromisses++

                alreadyProcessedPaths.add(path)
            }
        }

        for(const path of paths)
        {
            process(path)
        }
    })
}

export default resolvePathsDeeply