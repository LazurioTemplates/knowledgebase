---
title: Rozhodnutí
description: Co se rozhodlo, kdo a kdy rozhodl, proč a co z toho plyne.
sidebar:
  label: Přehled
  order: 0
---

Tento oddíl je paměť Organizace pro rozhodnutí. Kdo se za rok zeptá „proč to
děláme takhle?“, najde tu odpověď i s tím, kdo a kdy rozhodl.

## Co sem patří

- Rozhodnutí, která mění, jak Organizace pracuje, co nabízí nebo komu co
  smí. Každé má svou stránku s pořadovým číslem.
- Rozhodnutí, které už neplatí. Nemaže se: dostane `status: outdated`
  a odkaz `superseded_by` na rozhodnutí, které ho nahradilo.

Návrh, o kterém se teprve rozhoduje, má `status: draft`. Rozhodnutím se
stane, až ho schválí ten, kdo o věci rozhoduje.

## Osnova stránky

Soubor se jmenuje pořadovým číslem a krátkým názvem, například
`0002-nabidky-schvaluje-vedeni.md`.

```markdown
---
title: <číslo> <rozhodnutí jednou větou>
description: <co se rozhodlo, jednou větou>
status: current
decided: <datum rozhodnutí, RRRR-MM-DD>
decided_by: <kdo rozhodl: role nebo jméno>
---

## Souvislosti

<Proč bylo potřeba rozhodnout.>

## Rozhodnutí

## Důsledky

## Zvažované možnosti
```
