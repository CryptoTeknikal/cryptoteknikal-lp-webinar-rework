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
  the mentors, the bonuses, the Buffett line - the membership page's newer
  wording is used, because that is the copy that was rewritten. Where the
  webinar page says something only a webinar page can - the six materi, the
  four bonus values, the Rp9.298.000 total, the two ticket prices - its own
  words are kept. The reader's problem and why the academy are the webinar
  page's too: the five rows under the film (*Lo lagi ngerasa gini gak sih?*)
  and the four after the proof wall (*Kenapa Crypto Teknikal bisa bantu lo
  cuan 2 digit*) are the Scalev page's, word for word.
- **Visual language** is the membership page's, unchanged: near-black surfaces,
  a pure magenta (`#ff00ff`) accent, rounded cards, pill badges, neon glow
  instead of drop shadows, reveal-on-scroll. Anything the webinar page has and
  the membership page does not - the zigzag rows and their 3D objects, the
  benefit list, the two-up pricing - is drawn in that same language rather
  than in Scalev's.

The page is one self-contained file, `index.html`: no build step, no
dependencies, no external CSS, JS, fonts or images. Fonts and every screenshot
are inlined as base64, so it makes no network request of its own. The two assets
beside it are the member films, `testimoni-member.mp4` and
`testimoni-mahasiswa.mp4`, which nothing fetches until someone presses play.
(`dev.mjs` is a local preview server, not part of the page.)

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
   deck beside it (six member screenshots, crossfading), and **no button**
3. **Testimoni member** - a member's video and a CTA under it. The hero makes
   its promise without asking, so this is the page's first ask, and the only
   one before the proof wall.
4. ***Lo lagi ngerasa gini gak sih?*** - five problems, one to a row, each
   beside a drawn 3D object that changes sides from row to row; then *Kalo lo
   ngerasain hal di atas...* and a *Crypto Teknikal siap bantu lo!* pill. The
   pill is a label, not a button, so the ask under the film stays the only one.
5. Proof - a moving wall of member screenshots, two columns against each other
6. ***Kenapa Crypto Teknikal bisa bantu lo cuan 2 digit*** - the logo sting,
   then four reasons in the same zigzag rows as the problem list
7. *Pendidik dan Analis Crypto Teknikal Academy* - the two mentors
8. **6 materi** + what the set is worth (Rp5.000.000), and a CTA under it
9. ***Cuan 2 Digit Dari Trading Crypto Itu Realistis!*** - a second member's
   film (Billy, a student), under a *Sudah kebayang?* eyebrow and no CTA
10. **4 bonuses**, each with the shots that prove it, + total value Rp9.298.000
11. **Pricing** - the eleven-line benefit list once, then two tickets
12. Warren Buffett quote - a ruled band, the portrait standing on the bottom
    rule, a last CTA under it
13. Footer (brand lockup + blurb, Social Media, Contact, legal disclaimer)

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
| The zigzag rows, both lists (`.flip` starts the object on the left) | `.zigstack`, `.zigrow`, `.zigart` |
| Their nine objects, drawn as SVG | `#zo-ask` ... `#zo-pct` (problems), `#zo-coin` ... `#zo-chat` (reasons) |
| The problem list's closing pill | `.painsiap` |
| The eleven-line benefit list | `.benefitbox` |
| Two tickets side by side | `.pricewrap.two`, `.plan .pflag` |
| The hero's red eyebrow | `.eyebrow.hot` on `.herocopy` |

The six materi reuse the membership page's module stills - `#mfig1` to `#mfig5`
and `#mfig8` - and the four unused ones are dropped from the sprite. Adding a
seventh materi means bringing its `<symbol>` back from the membership repo.

### The second film

`testimoni-mahasiswa.mp4` is the channel's 89-second *Mahasiswa Dengan
Penghasilan 2 Digit Dari Trading Crypto* clip, encoded the way the membership
README describes for the first: 1280x720 at 30fps, H.264 high profile `crf 24`,
AAC 112k, `+faststart`. The busier background makes it about 18MB where the
first is 10MB. Its poster is the video's cover art as a 46KB inlined `webp`.
Both boxes share `.vidbox` and one script, and starting either film pauses the
other.

## Notes

- **The date is the one thing that goes stale.** The page itself no longer
  states it - the only copy left is in the `<meta name="description">`, which
  has to move when the webinar does.
- The fourth problem row is finished here: Scalev's image of it stops at
  "...bantuin lo mulai dengan cara yang", so the page ends it on "bener".
- Responsive down to 360px, with a sticky bottom CTA bar on mobile. It stays
  parked until the hero has scrolled away, since the hero has no button and
  the bar would put an ask back into it, and it parks again whenever one of the
  page's own buttons is on screen.
- `prefers-reduced-motion` disables every animation; the proof wall stops being
  a window and runs to its full height so all eight shots still show.
- The footer disclaimer covers scope of service - the academy sells education,
  not lending, fund management or any licensed financial product - and warns
  that anyone offering those in its name is an impostor.
