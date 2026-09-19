const fs = require('node:fs');
require('esbuild').buildSync({entryPoints:['renderer3d.js'],bundle:true,minify:true,format:'iife',outfile:'renderer3d.bundle.js',legalComments:'eof'});
fs.mkdirSync('dist/assets',{recursive:true});
for(const file of ['index.html','style.css','arcade.css','immersive.css','core.js','game.js','renderer3d.bundle.js']) fs.copyFileSync(file,'dist/'+file);
for(const file of ['dogelon.png','atlas.js','CREDITS.md','shiba-astronaut.glb','coin_with_artwork.glb','Coin Collectors Guide.mp3','Warm Cosmic Arpeggios.mp3','coin-recived.mp3']) fs.copyFileSync('assets/'+file,'dist/assets/'+file);
fs.copyFileSync('node_modules/three/LICENSE','dist/assets/THREE-LICENSE.txt');
console.log('Static 3D game ready in dist/. Three.js bundled locally; no network required.');
