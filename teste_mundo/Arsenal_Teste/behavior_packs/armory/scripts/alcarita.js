// Planeja a saída antes de consumir ingredientes, inclusive com inventário cheio.
export function forgeAlcarita(inventory, ironSlot, createOutput) {
  const iron = inventory.getItem(ironSlot);
  if (iron?.typeId !== "minecraft:iron_ingot") return "invalid_iron";
  let obsidianSlot = -1;
  let outputSlot = -1;
  for (let slot = 0; slot < inventory.size; slot++) {
    const item = inventory.getItem(slot);
    if (!item && outputSlot === -1) outputSlot = slot;
    if (item?.typeId === "minecraft:obsidian" && obsidianSlot === -1) obsidianSlot = slot;
    if (item?.typeId === "armory:alcarita_ingot" && item.amount < item.maxAmount) outputSlot = slot;
  }
  if (obsidianSlot === -1) return "missing_obsidian";
  const obsidian = inventory.getItem(obsidianSlot);
  if (iron.amount === 1) outputSlot = ironSlot;
  else if (obsidian.amount === 1) outputSlot = obsidianSlot;
  if (outputSlot === -1) return "full";

  // Constrói o item antes de alterar o inventário.
  const output = createOutput();
  const existing = inventory.getItem(outputSlot);
  if (existing?.typeId === output.typeId) {
    existing.amount++;
  }
  const snapshots = new Map([ironSlot, obsidianSlot, outputSlot].map(slot => [slot, inventory.getItem(slot)]));
  try {
    if (iron.amount === 1) inventory.setItem(ironSlot);
    else { iron.amount--; inventory.setItem(ironSlot, iron); }
    if (obsidian.amount === 1) inventory.setItem(obsidianSlot);
    else { obsidian.amount--; inventory.setItem(obsidianSlot, obsidian); }
    inventory.setItem(outputSlot, existing?.typeId === output.typeId ? existing : output);
  } catch (error) {
    for (const [slot, item] of snapshots) inventory.setItem(slot, item);
    throw error;
  }
  return "success";
}
