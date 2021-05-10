
// [0, +1, 0] => TOP
// [0, -1, 0] => BOTTOM
// [0, 0, -1] => NORTH
// [+1, 0, 0] => EAST
// [0, 0, +1] => SOUTH
// [-1, 0, 0] => WEST


const calcTexturesAfterRotation = (textures, rotation) => 
{
    while(rotation.x > 0)
    {
        rotation.x--

        // TOP -> NORTH -> BOTTOM -> SOUTH -> ...

        const temp = textures.south
        textures.south = textures.top
        textures.top = textures.north
        textures.north = textures.bottom
        textures.bottom = temp

        textures.west.rotation++
        textures.east.rotation--
    }

    while(rotation.y > 0)
    {
        rotation.y--

        // NORTH -> EAST -> SOUTH -> WEST ...

        let temp = textures.west
        textures.west = textures.north
        textures.north = textures.east
        textures.east = textures.south
        textures.south = temp

        textures.top.rotation++
        textures.bottom.rotation--
    }

    while(rotation.z > 0)
    {
        rotation.z--

        // WEST -> TOP -> EAST -> BOTTOM -> ...

        let temp = textures.west
        textures.west = textures.top
        textures.top = textures.east
        textures.east = textures.bottom
        textures.bottom = temp

        textures.south.rotation++
        textures.north.rotation--
    }
}