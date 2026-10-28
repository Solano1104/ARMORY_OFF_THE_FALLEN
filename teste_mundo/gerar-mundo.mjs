import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const output = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(output);
const world = path.join(output, 'Arsenal_Teste');
if (fs.existsSync(world) && !process.argv.includes('--resume')) throw new Error('A pasta Arsenal_Teste já existe. Preserve ou renomeie antes de gerar novamente.');
if (fs.existsSync(world) && fs.readFileSync(path.join(world,'levelname.txt'),'utf8') !== 'Arsenal dos Caídos - Testes') throw new Error('A pasta existente não pertence ao gerador.');
fs.mkdirSync(world, {recursive:true});
const write = (name, data) => fs.writeFileSync(path.join(world,name),data);
const json = (name, data) => write(name,JSON.stringify(data,null,2)+'\n');
function copyDirectory(source,destination) {
 fs.mkdirSync(destination,{recursive:true});
 for(const entry of fs.readdirSync(source,{withFileTypes:true})) {
  const from=path.join(source,entry.name), to=path.join(destination,entry.name);
  if(entry.isDirectory()) copyDirectory(from,to);
  else fs.copyFileSync(from,to);
 }
}

// NBT little-endian, precedido pelo cabeçalho específico do level.dat Bedrock.
const u16 = n => {const b=Buffer.alloc(2);b.writeUInt16LE(n);return b;};
const i32 = n => {const b=Buffer.alloc(4);b.writeInt32LE(n);return b;};
const i64 = n => {const b=Buffer.alloc(8);b.writeBigInt64LE(BigInt(n));return b;};
const str = s => {const b=Buffer.from(s);return Buffer.concat([u16(b.length),b]);};
const tag = (type,name,data) => Buffer.concat([Buffer.from([type]),str(name),data]);
const int = (name,n) => tag(3,name,i32(n));
const byte = (name,n) => tag(1,name,Buffer.from([n]));
const string = (name,s) => tag(8,name,str(s));
const version = (name,v) => tag(9,name,Buffer.concat([Buffer.from([3]),i32(v.length),...v.map(i32)]));
const nbt=Buffer.concat([
 Buffer.from([10,0,0]),
 string('LevelName','Arsenal dos Caídos - Testes'),
 int('StorageVersion',10),int('Generator',2),int('GameType',1),int('Difficulty',0),
 int('SpawnX',0),int('SpawnY',81),int('SpawnZ',0),
 tag(4,'RandomSeed',i64(28102026)),tag(4,'Time',i64(6000)),tag(4,'LastPlayed',i64(Math.floor(Date.now()/1000))),
 byte('commandsEnabled',1),byte('cheatsEnabled',1),byte('hasBeenLoadedInCreative',1),
 byte('MultiplayerGame',1),byte('LANBroadcast',1),byte('dodaylightcycle',0),
 byte('doweathercycle',0),byte('domobspawning',0),byte('keepinventory',1),
 byte('spawnMobs',0),byte('bonusChestEnabled',0),byte('bonusChestSpawned',1),
 int('currentTick',0),int('serverChunkTickRange',4),
 string('baseGameVersion','1.21.90'),
 version('lastOpenedWithVersion',[1,21,90,0,0]),
 version('MinimumCompatibleClientVersion',[1,21,90,0,0]),
 string('FlatWorldLayers',JSON.stringify({biome_id:1,block_layers:[
  {block_name:'minecraft:bedrock',count:1},
  {block_name:'minecraft:dirt',count:2},
  {block_name:'minecraft:grass_block',count:1},
 ],encoding_version:6,structure_options:null,world_version:'version.post_1_18'})),
 Buffer.from([0]),
]);
const level=Buffer.concat([i32(10),i32(nbt.length),nbt]);
assert.equal(level.readInt32LE(4),level.length-8);
write('level.dat',level);
write('level.dat_old',level);
write('levelname.txt','Arsenal dos Caídos - Testes');

// Banco LevelDB vazio válido. Os chunks serão gerados pelo Minecraft ao abrir.
fs.mkdirSync(path.join(world,'db'),{recursive:true});
const varint = n => {const bytes=[];do{let b=n&127;n=Math.floor(n/128);if(n)b|=128;bytes.push(b);}while(n);return Buffer.from(bytes);};
const comparator=Buffer.from('leveldb.BytewiseComparator');
const edit=Buffer.concat([varint(1),varint(comparator.length),comparator,varint(2),varint(2),varint(3),varint(3),varint(4),varint(0)]);
let crc=0xffffffff;
for(const b of Buffer.concat([Buffer.from([1]),edit])){crc^=b;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0x82f63b78:0);}
crc=(crc^0xffffffff)>>>0;
const masked=(((crc>>>15)|(crc<<17))+0xa282ead8)>>>0;
const record=Buffer.alloc(7);record.writeUInt32LE(masked);record.writeUInt16LE(edit.length,4);record[6]=1;
write('db/MANIFEST-000001',Buffer.concat([record,edit]));
write('db/CURRENT','MANIFEST-000001\n');
write('db/000002.log',Buffer.alloc(0));

for(const [source,subfolder,list] of [
 ['behavior_pack','behavior_packs','world_behavior_packs.json'],
 ['resource_pack','resource_packs','world_resource_packs.json'],
]){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,source,'manifest.json'),'utf8'));
 copyDirectory(path.join(root,source),path.join(world,subfolder,'armory'));
 json(list,[{pack_id:manifest.header.uuid,version:manifest.header.version}]);
}
const items=fs.readdirSync(path.join(root,'behavior_pack/items')).filter(f=>f.endsWith('.json')).map(f=>
 JSON.parse(fs.readFileSync(path.join(root,'behavior_pack/items',f),'utf8'))['minecraft:item'].description.identifier
).sort();
const arena=`import { ItemStack, world, system } from '@minecraft/server';
const items = ${JSON.stringify(items)};
world.afterEvents.playerSpawn.subscribe(({player,initialSpawn}) => {
 if(!initialSpawn) return;
 system.runTimeout(() => {
  try {
   const dimension=player.dimension;
   if(!world.getDynamicProperty('armory:test_arena_ready')) {
    dimension.runCommand('fill -8 80 -8 8 80 8 minecraft:stone');
    dimension.runCommand('fill -8 81 -8 8 85 8 minecraft:air');
    dimension.runCommand('setblock 2 81 2 minecraft:anvil');
    dimension.runCommand('setblock -2 81 2 minecraft:crafting_table');
    for(let index=0;index<Math.ceil(items.length/27);index++) {
     const x=4,z=2+index*2;
     dimension.runCommand('setblock '+x+' 81 '+z+' minecraft:chest');
     const chest=dimension.getBlock({x,y:81,z}).getComponent('minecraft:inventory').container;
     for(let slot=0;slot<27 && index*27+slot<items.length;slot++) chest.setItem(slot,new ItemStack(items[index*27+slot],1));
    }
    world.setDynamicProperty('armory:test_arena_ready',true);
   }
   if(!player.getDynamicProperty('armory:test_kit_received')) {
    player.teleport({x:0.5,y:81,z:0.5});
    player.runCommand('gamemode creative @s');
    player.runCommand('give @s minecraft:iron_ingot 64');
    player.runCommand('give @s minecraft:obsidian 64');
    player.setDynamicProperty('armory:test_kit_received',true);
    player.sendMessage('§6Mundo de testes pronto! §rBigorna: à frente, à direita. Segure ferro, agache e interaja. Os baús contêm os itens do addon para conferir os ícones. Use o manual para consultar o guia.');
   }
  } catch(error) { console.warn('Falha ao preparar área de testes: '+error);player.sendMessage('§cNão foi possível preparar a área. Saia e entre novamente no mundo.'); }
 },60);
});
`;
write('behavior_packs/armory/scripts/test-arena.js',arena);
fs.appendFileSync(path.join(world,'behavior_packs/armory/scripts/main.js'),'\nimport "./test-arena.js";\n');
for(const file of ['world_behavior_packs.json','world_resource_packs.json']){
 const [active]=JSON.parse(fs.readFileSync(path.join(world,file),'utf8'));
 const folder=file.includes('behavior')?'behavior_packs':'resource_packs';
 const manifest=JSON.parse(fs.readFileSync(path.join(world,folder,'armory/manifest.json'),'utf8'));
 assert.equal(active.pack_id,manifest.header.uuid);
 assert.deepEqual(active.version,manifest.header.version);
}
console.log('Mundo gerado: '+world+'; '+items.length+' itens nos baús.');
