import { system, world } from "@minecraft/server";


// Componente customizado de item: aplica efeitos ao consumir comida
// (usado pela Água Benta e pelo Hidromel)
const ItemFoodEffectsComponent = {
  onConsume(data, { params }) {
    const player = data.source;
    if (!player) return;
    for (const { name, duration, amplifier } of params) {
      try {
        player.addEffect(name, duration, { amplifier, showParticles: true });
      } catch (e) {
        // efeito inválido ou entidade sem suporte - ignora silenciosamente
      }
    }
  },
};

system.beforeEvents.startup.subscribe(({ itemComponentRegistry }) => {
  itemComponentRegistry.registerCustomComponent(
    "adf:food_effects",
    ItemFoodEffectsComponent
  );
});
// Entrega o "Manual: Arsenal dos Caídos" na primeira vez que o
world.afterEvents.playerSpawn.subscribe((event) => {
  const { player, initialSpawn } = event;
  if (!initialSpawn) return;

  const already = player.getDynamicProperty("adf:got_manual");
  if (already) return;

  system.run(() => {
    player.runCommand(`give @s ${"adf"}:manual_arsenal 1`);
    player.setDynamicProperty("adf:got_manual", true);
    player.sendMessage(
      "6[Arsenal dos Caídos]r Você recebeu o Manual da modificação! Consulte-o para aprender sobre a Mesa de Trabalho Sombria e a Fornalha Potente."
    );
  });
});
