
async function parseJSONFile(fileURL)
{
    return new Promise((resolve, reject) => 
    {
        let request = new XMLHttpRequest();
        request.overrideMimeType("application/json");

        let escapedURL = encodeURI(fileURL);

        request.open("GET", escapedURL, true);
        request.onreadystatechange = () =>
        {
            if(request.readyState === 4 && request.status == 200)
            {
                resolve(JSON.parse(request.responseText));
            }
            
            if(request.readyState === 4 && request.status != 200)
            {
                reject("Could not load json file!");
            }
        }

        request.send(null);
    })
}

export default parseJSONFile;