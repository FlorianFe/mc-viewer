# \<voxel-visualization\>

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/florianfe/voxel-visualization)

A visualization web component for minecraft schematic files.

## 📒 Attributes

| Name  | Type | Description |
| ------------- | ------------- | ------------- |
| schematic  | Object | JavaScript Object with information about the minecraft structure |
| schematicPath  | String | Path to .schematic file and alternative to the "schematic" Attribute |
| texturePackPath  | String  | Path to the root of an unzipped texture pack |
| zoom  | Number  | Zoom level of the view (default is 1.0) |

## 🚀 Usage

1. Install package
```bash
bower install --save voxel-visualization
```

2. Import
```html
<link rel="import" href="bower_components/voxel-visualization/voxel-visualization.html">
```

3. Place in your HTML
```html
<voxel-visualization schematic-path="path/to/my/schematic/file.schematic"></voxel-visualization>
```

## 🖼 Preview
![Screenshot](https://florianfe.github.io/screenshots/voxel-visualization/screenshot.png)

## 👀 Demo
[See live demo here](https://florianfe.github.io/webcomponents/voxel-visualization/demo/)

## 🗒 Note
The used texture pack "Faithful 32x32 Pack" (<a href="https://www.minecraftforum.net/forums/mapping-and-modding-java-edition/resource-packs/1223254-faithful-32x32-pack-update-red-cat-clay-1-8">Link</a>) was made by "Vattic".
