# Organização do Add-on Minecraft Bedrock

Este projeto segue o formato de add-on Bedrock com duas pastas principais:

- `behavior_pack/`
  - `manifest.json`
  - dados de entidades, itens e outras definições de comportamento

- `resource_pack/`
  - `manifest.json`
  - `textures/`
  - ativos visuais como texturas, modelos e sons

## Passo a passo para Bedrock

1. Importe o pacote `resource_pack/` no Minecraft como um recurso.
2. Importe o pacote `behavior_pack/` no Minecraft como um comportamento.
3. Se você usa um editor/add-on manager, selecione ambas as pastas juntos.

## Correção do erro de textura

O erro informado indica que o Minecraft procura por:

- `resource_pack/textures/entity/wolf/wolf_collar_baby_mers.png`

Então crie a pasta `resource_pack/textures/entity/wolf/` e coloque o arquivo de textura neste local.

## Estrutura recomendada

```
behavior_pack/
  manifest.json
  ...
resource_pack/
  manifest.json
  textures/
    entity/
      wolf/
        wolf_collar_baby_mers.png
    blocks/
    items/
```

## Observação

Eu criei a pasta necessária para a textura do lobo, mas você precisa adicionar o arquivo de imagem real `wolf_collar_baby_mers.png` dentro dela.