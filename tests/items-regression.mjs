import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = name => fs.readFileSync(new URL(name, root), 'utf8');
const atlas = JSON.parse(read('resource_pack/textures/item_texture.json')).texture_data;
const translations = ['pt_BR','en_US'].map(lang => new Map(read('resource_pack/texts/'+lang+'.lang').split(/\r?\n/).filter(line=>line.includes('=')).map(line=>{const split=line.indexOf('=');return [line.slice(0,split),line.slice(split+1)];})));
const slots = {helmet:'head',chestplate:'chest',leggings:'legs',boots:'feet'};
let armorCount=0,swordCount=0,drinkCount=0;
for(const file of fs.readdirSync(new URL('behavior_pack/items/',root))) {
 const data=JSON.parse(read('behavior_pack/items/'+file));
 const {description,components:c}=data['minecraft:item'];
 assert.ok(description.menu_category.category,file+' has invalid menu category');
 assert.equal(description.menu_category.menu_category,undefined,file+' has nested menu category');
 for(const translation of translations) {
  const name=translation.get(c['minecraft:display_name']?.value);
  assert.ok(name,file+' has missing display name');
  assert.ok(!name.includes('item.armory:'),file+' displays internal key');
 }
 const version=data.format_version.split('.').map(Number);
 assert.ok(version[0]>1 || version[1]>20 || (version[1]===20 && version[2]>=50),file+' uses outdated component schema');
 assert.ok(atlas[c['minecraft:icon']],file+' has missing icon');
 const kind=description.identifier.split(':')[1].split('_')[0];
 if(slots[kind]) {
  assert.equal(c['minecraft:wearable'].slot,'slot.armor.'+slots[kind]);
  assert.ok(c['minecraft:wearable'].protection>0);
  assert.equal(c['minecraft:max_stack_size'],1);
  armorCount++;
 }
 if(kind==='sword') {
  assert.ok(c['minecraft:damage']>0);
  assert.ok(c['minecraft:tags'].tags.includes('minecraft:is_sword'));
  swordCount++;
 }
 if(c['minecraft:food']) {
  assert.equal(c['minecraft:use_animation'],'drink');
  assert.ok(c['minecraft:use_modifiers'].use_duration>0);
  assert.equal(c['minecraft:food'].can_always_eat,true);
  assert.equal(c['armory:food_effects'],undefined);
  drinkCount++;
 }
}
assert.equal(armorCount,20);assert.equal(swordCount,5);assert.equal(drinkCount,2);

// Carrega o entrypoint com sinais simulados e aciona o evento real registrado.
const callbacks={};
const signal=name=>({subscribe(fn){callbacks[name]=fn;}});
const world={beforeEvents:{itemUse:signal('itemUse'),playerInteractWithBlock:signal('block')},afterEvents:{itemCompleteUse:signal('consume'),playerSpawn:signal('spawn')}};
const context=vm.createContext({console,Set,Map});
const modules=new Map();
const server=new vm.SyntheticModule(['world','system','ItemStack'],function(){this.setExport('world',world);this.setExport('system',{run:fn=>fn()});this.setExport('ItemStack',class {});},{context});
const ui=new vm.SyntheticModule(['ActionFormData'],function(){this.setExport('ActionFormData',class {});},{context});
modules.set('@minecraft/server',server);modules.set('@minecraft/server-ui',ui);
for(const file of ['alcarita.js','drinks.js','main.js']) modules.set('./'+file,new vm.SourceTextModule(read('behavior_pack/scripts/'+file),{context}));
await modules.get('./main.js').link(name=>modules.get(name));
await modules.get('./main.js').evaluate();
const applied=[];
const player={addEffect:(...args)=>applied.push(args)};
callbacks.itemUse({itemStack:{typeId:'armory:agua_benta'},source:player});
assert.equal(applied.length,0,'Effects must not start before drinking finishes');
callbacks.consume({itemStack:{typeId:'armory:agua_benta'},source:player});
assert.deepEqual(applied.map(([name,duration,options])=>[name,duration,options.amplifier]),[['absorption',400,1],['regeneration',400,0],['strength',400,0]]);
applied.length=0;
callbacks.consume({itemStack:{typeId:'armory:hidromel'},source:player});
assert.deepEqual(applied.map(([name,duration,options])=>[name,duration,options.amplifier]),[['strength',500,0],['speed',500,1]]);
applied.length=0;
callbacks.consume({itemStack:{typeId:'minecraft:apple'},source:player});
assert.equal(applied.length,0);
console.log('OK: 20 armaduras, 5 espadas, 2 bebidas; entrypoint e efeitos no consumo concluído.');
