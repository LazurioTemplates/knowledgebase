---
title: Link forms
description: Every form of a link a page may hold, for the link tests.
---

Inline [a](/a/) and [t](/t/#part "Title") and ![image](/image.png) and
[space](</with space/>) and [parens](/a_(b)/) and [escaped](/es\_caped/).

Full [x][one], collapsed [Two][], shortcut [three], and [the picture][img]
as ![a reference][img].

[one]: /one/
[two]: </two/> 'Title'
  [three]: /three/?q=1
[img]: /picture.png
[one]: /second-definition-loses/

See [the next line][next] and [a split title][split].

[next]:
  /next-line/

[split]:
/split/
"A title on its own line"

> A quote with [a quoted link][q].
>
> [q]: /quoted/

- A list item with [a listed link][l].

  [l]: /listed/

[unused]: /unused/ "Not referenced, so not rendered"

An undefined [reference][nowhere] stays text, and so does [this].

Elsewhere [e](https://e.example/) <https://auto.example/> www.example.com
[m](mailto:a@b.c) [h](#here) [cdn](//cdn.example/x)

<a href="/html/">raw</a>, <a href=/unquoted/>unquoted</a> and <img src="/html.png" alt="">

<picture><source srcset="/small.png 1x, /large.png 2x"><img src="/fallback.png" alt=""></picture>

<div>
[not a link inside an HTML block](/html-block/)
</div>

`[code](/code/)` and ``[[double]](/double/)``

<!-- [comment](/comment/) <a href="/comment-html/"> -->

```md
[fenced](/fenced/)
[fd]: /fenced-definition/
```

    [indented code](/indented/)

| Table | Link |
| --- | --- |
| row | [cell](/cell/) |

A footnote[^1].

[^1]: A note with [a footnote link](/footnote/).

:::note
An aside with [an aside link](/aside/).
:::
