---
title: Slovník
description: Pojmy Organizace, jedna stránka na pojem, s jinými názvy a s tím, s čím si ho neplést.
sidebar:
  label: Přehled
  order: 0
---

Slovník drží význam slov, na kterých v Organizaci záleží. Když se o slově
rozhoduje, platí se za ně nebo podle něj agent jedná, nesmí jeho význam žít
jen v hlavách a v chatu.

## Co sem patří

- Pojmy, které Organizace používá jinak než běžná řeč, nebo které má jen ona.
- Zkratky a interní názvy nástrojů, týmů a produktů.

Každý pojem má vlastní stránku. Jiné názvy téhož (zkratky, anglické
varianty, slang) patří do údaje `aliases`, aby je našlo hledání. Pojem nikdy
nemá dvě stránky: než ho přidáte, vyhledejte ho i pod jinými názvy.

## Osnova stránky

```markdown
---
title: <pojem>
description: <definice v jedné větě>
aliases: [<jiný název>, <zkratka>]
owner: <role, která pojem udržuje>
reviewed: <datum ověření, RRRR-MM-DD>
---

<Definice: co pojem znamená, v jedné nebo dvou větách.>

## Příklad

## Nezaměňovat s
```
