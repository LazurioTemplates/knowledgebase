---
title: Jak psát do Knowledgebase
description: Co sem patří, jak vypadá dobrá stránka a jak se obsah mění, pro lidi i agenty.
sidebar:
  label: Jak psát do Knowledgebase
---

Knowledgebase platí jen tehdy, když jí lidé věří. Proto má každá stránka
jedno téma, odpovědného člověka nebo roli a datum, kdy ji naposledy někdo
ověřil. Změny procházejí kontrolou dřív, než začnou platit.

## Co sem patří

Trvalé znalosti Organizace, které mají platit déle než jeden úkol: jak
Organizace funguje, kdo za co odpovídá, ověřené postupy, pojmy a rozhodnutí
s jejich důvody.

## Co sem nepatří

- Hesla, klíče, přístupové údaje a jiná tajemství. Ty patří do trezoru.
- Osobní údaje nad rámec pracovní role: soukromé kontakty, zdravotní údaje,
  hodnocení lidí.
- Data a dokumenty zákazníků.
- Rozpracované úkoly a plány. Ty patří do nástroje na plánování, například do
  Mission Control.
- Surové podklady, jako jsou přepisy schůzek nebo exporty. Sem se zapíše jen
  to, co se z nich ověřilo, s odkazem na zdroj.

## Dobrá stránka

- **Jedno téma.** Když stránka popisuje dvě věci, rozdělte ji na dvě.
- **Nejdřív to podstatné.** První odstavec řekne hlavní věc. Podrobnosti
  přijdou pod ním.
- **Název, který lidé hledají.** Název stránky je to, co by člověk napsal do
  hledání. Soubor se jmenuje stejně, malými písmeny bez diakritiky a slova
  spojuje pomlčka (`novy-kolega.md`).
- **Odkazy místo opakování.** Pojem vysvětlete jednou ve Slovníku a jinde na
  něj odkažte, například `[experiment](/slovnik/experiment/)`.
- **Osnova oddílu.** Každý oddíl má na své přehledové stránce osnovu, podle
  které se v něm píše.

## Údaje o stránce

Na začátku každé stránky je hlavička mezi řádky `---`. Povinný je jen název.

| Údaj | Co znamená |
| --- | --- |
| `title` | Název stránky. Povinný. |
| `description` | Jedna věta o tom, co na stránce najdete. Ukazuje se hned pod názvem. |
| `status` | `draft` (rozpracováno, zatím neplatí), `current` (platí), `outdated` (zastaralé, platí jen pro historii). |
| `owner` | Role nebo člověk, který stránku udržuje pravdivou. |
| `reviewed` | Datum, kdy stránku naposledy někdo ověřil proti skutečnosti, ve tvaru `2026-11-06`. |
| `aliases` | Jiné názvy téhož, které lidé používají. Hledání je najde také. |
| `sources` | Odkud znalost pochází: odkaz, dokument, schůzka. |
| `decided`, `decided_by` | U rozhodnutí: kdy a kdo rozhodl. |
| `superseded_by` | U rozhodnutí, které už neplatí: cesta k rozhodnutí, které ho nahradilo, například `rozhodnuti/0002-novy-postup`. |
| `sample` | `true` u ukázkové stránky šablony. Prázdný start ji smaže. |

Název je nadpis stránky a popis řádek pod ním. Pod popisem stojí ostatní
údaje: stav, kdo stránku udržuje, kdy ji někdo ověřil, jiné názvy, zdroje a
u rozhodnutí kdo a kdy rozhodl a čím bylo nahrazeno. Ukázková stránka má
navíc nahoře pruh „Ukázka“. Stránka s chybným údajem se nesestaví a kontrola
na to upozorní dřív, než se změna dostane k lidem.

## Jak se obsah mění

Knowledgebase je repozitář v Gitu. Každá změna je pull request, který někdo
zkontroluje. Platit začne, až ho Organizace přijme. Agent změnu připraví, ale
sám ji nepřijme. Pravidla Organizace pro schvalování platí i tady.

Co přestalo platit, nemažte hned. Označte to `status: outdated` a napište, co
platí místo toho. Rozhodnutí se nemažou nikdy. Celá historie zůstává v Gitu.

## S agentem

| Řeknete | Agent udělá |
| --- | --- |
| „Jak u nás funguje…?“ | Hledá v Knowledgebase, odpoví a uvede stránku, ze které vychází. Když nic nenajde, řekne to a nabídne, že odpověď zapíše. |
| „Zapiš postup, jak…“ | Najde, jestli postup už není zapsaný, doptá se na chybějící kroky a připraví stránku v oddílu Procesy a postupy nebo Postupy pro agenty. |
| „Zapiš rozhodnutí, že…“ | Připraví stránku v oddílu Rozhodnutí s tím, kdo a kdy rozhodl, proč a co z toho plyne. Starší rozhodnutí, které nové nahrazuje, označí jako zastaralé. |
| „Doplň do slovníku pojem…“ | Ověří, že pojem ani jeho jiný název ve Slovníku ještě není, a připraví jeho stránku. |

Agent se při tom řídí skilly modulu v adresáři `.agents/skills/` repozitáře.

## Ukázky a prázdný start

Stránky s pruhem „Ukázka“ popisují vymyšlenou Organizaci Example. Ukazují,
jak vypadá vyplněná stránka v každém oddílu. Nahraďte je vlastním obsahem,
nebo je smažte všechny najednou příkazem `bun run start:empty` ve složce
`app/v2`. Struktura, tedy tato stránka a přehledy oddílů, zůstane.
