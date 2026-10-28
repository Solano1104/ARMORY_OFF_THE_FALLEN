import { ItemStack, system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { forgeAlcarita } from "./alcarita.js";
import { applyDrinkEffects } from "./drinks.js";

const manualReaders = new Set();

async function openManual(player) {
  if (manualReaders.has(player.id)) return;
  manualReaders.add(player.id);
  try {
    await new ActionFormData()
      .title("Manual: Arsenal dos Caídos")
      .body(
        "§6Primeiros passos§r\n\n" +
        "A alcarita é o principal material base para iniciar sua progressão e construir as estações do arsenal.\n\n" +
        "§6Como obter alcarita§r\n" +
        "1. Tenha obsidiana no inventário.\n" +
        "2. Segure um lingote de ferro na mão principal.\n" +
        "3. Agache e interaja com uma bigorna.\n" +
        "Cada interação consome 1 ferro + 1 obsidiana e produz 1 lingote de alcarita. Não exige molde nem experiência.\n" +
        "Se o inventário estiver cheio, libere espaço e tente novamente.\n\n" +
        "§6Estações iniciais§r\n" +
        "Use alcarita na bancada para fabricar a Mesa de Trabalho Sombria e a Fornalha Potente. A mesa permite criar equipamentos do arsenal; a fornalha possui receitas próprias de processamento.\n\n" +
        "Use este manual novamente para consultar as instruções."
      )
      .button("Fechar")
      .show(player);
  } catch (error) {
    console.warn(`Não foi possível abrir o manual: ${error}`);
  } finally {
    manualReaders.delete(player.id);
  }
}

world.beforeEvents.itemUse.subscribe((event) => {
  if (event.itemStack.typeId !== "armory:manual_arsenal") return;
  event.cancel = true;
  system.run(() => openManual(event.source));
});

const anvils = new Set([
  "minecraft:anvil", "minecraft:chipped_anvil", "minecraft:damaged_anvil",
]);
const pendingForge = new Set();

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
  const { player, block, itemStack } = event;
  if (itemStack?.typeId === "armory:manual_arsenal") {
    event.cancel = true;
    if (event.isFirstEvent) system.run(() => openManual(player));
    return;
  }
  if (!anvils.has(block.typeId) || !player.isSneaking ||
      itemStack?.typeId !== "minecraft:iron_ingot") return;
  event.cancel = true;
  if (!event.isFirstEvent || pendingForge.has(player.id)) return;
  pendingForge.add(player.id);
  const slot = player.selectedSlotIndex;
  const location = { ...block.location };
  const dimension = block.dimension;
  system.run(() => {
    try {
      if (!player.isSneaking || player.selectedSlotIndex !== slot ||
          player.dimension.id !== dimension.id ||
          !anvils.has(dimension.getBlock(location)?.typeId)) return;
      const inventory = player.getComponent("minecraft:inventory")?.container;
      if (!inventory) return;
      const result = forgeAlcarita(inventory, slot, () => new ItemStack("armory:alcarita_ingot", 1));
      if (result === "missing_obsidian") {
        player.sendMessage("§eVocê precisa de 1 obsidiana no inventário para produzir alcarita.");
      } else if (result === "full") {
        player.sendMessage("§eLibere um espaço no inventário para receber a alcarita.");
      } else if (result === "success") {
        player.sendMessage("§6Alcarita criada! §r1 ferro + 1 obsidiana → 1 alcarita.");
      }
    } catch (error) {
      console.warn(`Falha ao produzir alcarita: ${error}`);
    } finally {
      pendingForge.delete(player.id);
    }
  });
});


// Aplica os efeitos apenas quando o jogador termina de beber.
world.afterEvents.itemCompleteUse.subscribe(({ source, itemStack }) => {
  applyDrinkEffects(source, itemStack.typeId);
});
// Entrega o "Manual: Arsenal dos Caídos" na primeira vez que o
world.afterEvents.playerSpawn.subscribe((event) => {
  const { player, initialSpawn } = event;
  if (!initialSpawn) return;

  const already = player.getDynamicProperty("armory:got_manual");
  if (already) return;

  system.run(() => {
    const inventory = player.getComponent("minecraft:inventory")?.container;
    if (!inventory) return;
    const leftover = inventory.addItem(new ItemStack("armory:manual_arsenal", 1));
    if (leftover) player.dimension.spawnItem(leftover, player.location);
    player.setDynamicProperty("armory:got_manual", true);
    player.sendMessage(
      "§6[Arsenal dos Caídos]§r Você recebeu o Manual! Use-o para aprender a produzir alcarita na bigorna e iniciar seu arsenal."
    );
  });
});
