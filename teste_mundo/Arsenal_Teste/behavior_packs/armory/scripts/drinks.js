const drinkEffects = {
  "armory:agua_benta": [
    { name: "absorption", duration: 400, amplifier: 1 },
    { name: "regeneration", duration: 400, amplifier: 0 },
    { name: "strength", duration: 400, amplifier: 0 },
  ],
  "armory:hidromel": [
    { name: "strength", duration: 500, amplifier: 0 },
    { name: "speed", duration: 500, amplifier: 1 },
  ],
};

export function applyDrinkEffects(player, itemId) {
  for (const { name, duration, amplifier } of drinkEffects[itemId] ?? []) {
    player.addEffect(name, duration, { amplifier, showParticles: true });
  }
}
