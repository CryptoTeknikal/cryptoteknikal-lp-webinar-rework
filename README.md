# cryptoteknikal-lp-webinar-rework

Landing page for the **Crypto Teknikal Academy webinar**, built to replace the
Scalev page at `crypto-teknikal.myscalev.com/lpwebinarct-v2`.

It is the front half of a two-step funnel: this page sells a Rp79.000 seat at a
three-hour live webinar, and the membership page
([cryptoteknikal-lp-rework](https://github.com/CryptoTeknikal/cryptoteknikal-lp-rework))
sells the year to whoever turns up and wants more. The two look like one brand
because this page is built out of that one.

- **Layout** follows the Scalev webinar page section for section - the running
  order, what each section argues, and what the reader is asked to do at the end
  of it. See [Section order](#section-order).
- **Copy** is split. Where the two pages say the same thing - the hero promise,
  the reader's problem, why the academy, the mentors, the bonuses, the Buffett
  line - the membership page's newer wording is used, because that is the copy
  that was rewritten. Where the webinar page says something only a webinar page
  can - the date, the six materi, the four bonus values, the Rp9.298.000 total,
  the two ticket prices - its own words are kept.
- **Visual language** is the membership page's, unchanged: near-black surfaces,
  a pure magenta (`#ff00ff`) accent, rounded cards, pill badges, neon glow
  instead of drop shadows, reveal-on-scroll. Anything the webinar page has and
  the membership page does not - the benefit list, the two-up pricing - is
  drawn in that same language rather than in Scalev's.

The page is one self-contained file, `index.html`: no build step, no
dependencies, no external CSS, JS, fonts or images. Fonts and every screenshot
are inlined as base64, so it makes no network request of its own. The one asset
beside it is `testimoni-member.mp4`, which nothing fetches until someone presses
play. (`dev.mjs` is a local preview server, not part of the page.)

## Preview locally

```sh
node dev.mjs          # http://localhost:8899, opens the browser for you
```

Live reload: CSS-only edits are swapped in place without a reload, everything
else reloads and restores the scroll position. Flags: `--port 9000`, `--no-open`.
Same server as the membership repo - see that README for the details.

## Section order

1. Sticky nav (brand lockup only, no link menu)
2. Hero - the webinar's own headline, with the membership page's testimonial
   deck beside it (six member screenshots, crossfading)
3. **Testimoni member** - a member's video and a CTA under it. Nothing stands
   between the hero and the film, so the page makes its promise once and asks
   once before the proof wall starts.
4. Proof - a moving wall of member screenshots, two columns against each other
5. *Kenapa Pilih Crypto Teknikal Academy* - the logo sting and 4 value cards
6. *Pendidik dan Analis Crypto Teknikal Academy* - the two mentors
7. **6 materi** + what the set is worth (Rp5.000.000), and a CTA under it
8. *Emang Bisa Cuan Dua Digit dari Trading Crypto?* - bullish / bearish /
   sideways
9. **4 bonuses**, each with the shots that prove it, + total value Rp9.298.000
10. **Pricing** - the eleven-line benefit list once, then two tickets
11. Warren Buffett quote - a ruled band, the portrait standing on the bottom
    rule, a last CTA under it
12. Footer (brand lockup + blurb, Social Media, Contact, legal disclaimer)

Bold is where this page departs from the membership one. What the membership
page carries and this one does not - the brand marquee, before/after, *cocok
buat siapa*, the nine modules, three of the seven bonuses, the FAQ - is absent
because the webinar page does not have those sections; the markup and the CSS
for them are still in the membership repo if any are wanted back. The Scalev
page's date row and its *Lo pasti pernah ngerasa* list are gone the other way
round: they were built here and then dropped, so `git show be0e70e` is where
their markup and CSS live now.

## The offer

| | |
|---|---|
| Date | Selasa, 23 Desember 2025, 19.30 - 22.30 WIB |
| Where | Live via Zoom |
| Seats | 100 |
| Solo | Rp79.000 |
| Berdua | Rp99.000 (Rp49.500 each) |
| Stated value | Rp9.298.000 |

The first three are the webinar's own logistics, not copy: the page states
neither the date, the platform nor the kuota any more (see [Notes](#notes)), so
they live here and in the checkout's own page.

The value adds up from the six materi (Rp5.000.000) and the four bonuses
(Rp2.000.000 + Rp1.000.000 + Rp499.000 + Rp799.000). Change any one of those
numbers and the total in the `.totalbox`, the heading above the prices and the
benefit list all have to move with it - they are four copies of the same
arithmetic.

### Checkout links

Both ticket buttons point at the Scalev checkout the old page used:

```
https://crypto-teknikal.myscalev.com/checkoutwebinarct
```

Every other CTA on the page points at `#harga` rather than the checkout, so the
reader always sees the price before the cart.

## Customising

Colours, type, the brand lockup, decks, the proof wall, the testimonial video,
the mentor portraits and the intro sting are all unchanged from the membership
page, and its README documents each of them:
<https://github.com/CryptoTeknikal/cryptoteknikal-lp-rework#customising>

What is new here, and only here:

| what | where |
|------|-------|
| The eleven-line benefit list | `.benefitbox` |
| Two tickets side by side | `.pricewrap.two`, `.plan .pflag` |
| The hero's red eyebrow | `.eyebrow.hot` on `.herocopy` |

The six materi reuse the membership page's module stills - `#mfig1` to `#mfig5`
and `#mfig8` - and the four unused ones are dropped from the sprite. Adding a
seventh materi means bringing its `<symbol>` back from the membership repo.

## Notes

- **The date is the one thing that goes stale.** The page itself no longer
  states it - the only copy left is in the `<meta name="description">`, which
  has to move when the webinar does.
- Responsive down to 360px, with a sticky bottom CTA bar on mobile that parks
  itself whenever one of the page's own buttons is on screen.
- `prefers-reduced-motion` disables every animation; the proof wall stops being
  a window and runs to its full height so all eight shots still show.
- The footer disclaimer covers scope of service - the academy sells education,
  not lending, fund management or any licensed financial product - and warns
  that anyone offering those in its name is an impostor.
