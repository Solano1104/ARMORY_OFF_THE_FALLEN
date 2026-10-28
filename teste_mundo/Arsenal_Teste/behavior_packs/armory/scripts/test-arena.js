import { ItemStack, world, system } from '@minecraft/server';
const items = ["armory:agua_benta","armory:alcarita_ingot","armory:boots_celesio","armory:boots_curiotita","armory:boots_emeritio","armory:boots_kharatio","armory:boots_neptita","armory:celesio_ingot","armory:chestplate_celesio","armory:chestplate_curiotita","armory:chestplate_emeritio","armory:chestplate_kharatio","armory:chestplate_neptita","armory:curiotita_ingot","armory:emeritio_ingot","armory:helmet_celesio","armory:helmet_curiotita","armory:helmet_emeritio","armory:helmet_kharatio","armory:helmet_neptita","armory:hidromel","armory:kharatio_ingot","armory:leggings_celesio","armory:leggings_curiotita","armory:leggings_emeritio","armory:leggings_kharatio","armory:leggings_neptita","armory:manual_arsenal","armory:neptita_ingot","armory:raw_celesio","armory:raw_curiotita","armory:raw_emeritio","armory:raw_kharatio","armory:raw_neptita","armory:shield_celesio","armory:shield_curiotita","armory:shield_emeritio","armory:shield_kharatio","armory:shield_neptita","armory:sword_celesio","armory:sword_curiotita","armory:sword_emeritio","armory:sword_kharatio","armory:sword_neptita"];
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
