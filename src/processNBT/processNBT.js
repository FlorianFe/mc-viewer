

const invert = (obj) => 
{
    var new_obj = {};

    for (var prop in obj) 
    {
        if(obj.hasOwnProperty(prop)) 
        {
            new_obj[obj[prop]] = prop;
        }
    }

    return new_obj;
}

const objectToArray = (obj) => 
{
    let result = []

    for(const index in obj)
    {
        result.push(obj[index])
    }

    return result
}


const processNBT = (nbt) =>
{
  if(nbt.type === 'list') return [] // ignore lists
  if(nbt.type !== 'compound') return nbt.value

  const keys = Object.keys(nbt.value)
  let result = {}

  for(const key of keys)
  {
    const camelCaseKey = key.substring(0, 1).toLowerCase() + key.substring(1)

    if(camelCaseKey === 'palette')
    {
        const processedNBT = processNBT(nbt.value[key])
        const inverted = invert(processedNBT)
        result[camelCaseKey] = objectToArray(inverted)

        console.log(result[camelCaseKey])
    }
    else
    {
        result[camelCaseKey] = processNBT(nbt.value[key])
    }
  }

  return result
}

export default processNBT