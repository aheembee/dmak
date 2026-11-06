# RESEARCH LOG — D_MAK MUSIC

Research date: **6 November 2026** (Africa/Kampala). Everything on the website is built from
the sources below. Nothing has been invented: where a fact could not be verified it is either
omitted or explicitly marked **CONFIRM** and flagged in the UI with the *“to confirm”* chip.

---

## 1. The primary source could not be read

The brief named <https://www.instagram.com/d_mak_music/> as the primary identity source.
**Instagram did not permit access to the profile content from this environment:**

| Attempt | Result |
| --- | --- |
| Direct fetch of `instagram.com/d_mak_music/` | `HTTP 403` |
| Read via a text-extraction proxy | Redirected to `accounts/login` → login wall, zero posts returned |
| Public search index | Only the handle `@d_mak_music` surfaces (no bio, captions or post text indexed) |

**Conclusion:** the handle exists, but no posts, bio, follower count or imagery could be
retrieved. The site therefore does **not** claim to have scraped Instagram, and the Connect page
says plainly that the live feed needs a legitimate Meta token (setup documented in `README.md`).

Artist identity was reconstructed instead from the artist's own distributed releases and
platform metadata — the same information Instagram would corroborate.

---

## 2. Verified facts (used on the site)

| Fact | Value | Source |
| --- | --- | --- |
| Real name | Wandera David Musamya | His own bio text on Howwe.ug artist profile |
| Stage names | D-Mak / D Mak / D Mak Music / Davmak (site brand: **D_MAK**) | Retail metadata + his own bio |
| Origin | Busia town, Eastern Uganda | His own bio: *“from Busia town”* |
| Started in music | 2016, while in school | His own bio: *“began my music in 2016 from school”* |
| Status | Recording artist | His own bio |
| TikTok | `@d.makmusic` (bio field empty; captions use his own original sounds) | tiktok.com/@d.makmusic |
| Instagram | `@d_mak_music` (login-walled) | LinkedIn in brief + search index |
| YouTube (label channel) | `Yute Empire` — official *Nkulina* video, published 9 Feb 2023, 3:06, ~11,367 views, 222 likes at research time | youtube.com/watch?v=Q6fxhHkJBug |
| Label/imprints | Yuut Empire (2023–24), Davmak city (2025), Silence town (2025) | Deezer/Apple/Amazon label fields |
| Producers | Melo Killit, Silence | *Naawe* cover art credit (“PRO: MELO KILLIT / SILENCE”) |
| Artwork designer | Kai Designz | *Naawe* cover art credit |

### Documented discography

| Date | Release | Type | Imprint | Notes |
| --- | --- | --- | --- | --- |
| 2022-08-02 | Tubikole | Single | Yuut Empire | earliest streaming release documented |
| 2022-12-12 | Nkulina | Single | Yuut Empire | official video 2023-02-09 |
| 2023-04-06 | Ogonda Nnyo | Single | Yuut Empire | 2:49, composer Wandera David |
| 2024-02-28 | Bitandike | Single | Yuut Empire | 3:17 |
| 2024-05-26 | Ffe Tuliko | Single | Yuut Empire | 2:30 |
| 2024-08-02 | Only You | Single | Yuut Empire | feat. **Sera Biebe**, 2:51 |
| 2025-01-09 | Wadala (Cruise on Dance Version) | Single | Davmak city | 2:46 |
| 2025-02-20 | Bwotyo | Single | Davmak city | 2:19, composer Wandera David |
| 2025-11-27 | Naawe | Single | Silence town | 2:01, prod. Melo Killit / Silence |

Song-language note: all titles are Luganda (*Ogonda Nnyo* “you love me so much”, *Naawe* “with
you”, *Ffe Tuliko* “we have it / we're here”, *Bitandike* “let's start”, *Tubikole* “let's do
it”, *Nkulina* “I have it”, *Bwotyo* “that's how it is”, *Wadala*). His own TikTok captions carry
`#ugvibes`, `#lovestory`, `#ogonda`, `#nkulina`, `#tubikole`, `#saagalaakugambako` — which is
why the site frames the sound as **Luganda love songs / Ugandan afro-pop**, not a genre he has
claimed in words.

---

## 3. Name collision — what was excluded on purpose

“D-Mak”/“D Mak” is a crowded name. The following were found and **excluded** as clearly
different artists:

* **D-Mak**, German horrorcore rapper from Berlin-Lichtenberg (Discogs, b. 1986) — different person.
* **D.MAKA** (`@dmakamusic`), Brooklyn rapper/producer — different person, different handle.
* An **Apple Music “Dmak”** artist page (id 258998257) that mixes the Ugandan singles with
  electronic releases (*Techno Is My Drug*, *Acid Rave*, *Psychedelica*, *Hypnosis*, *All Night
  Long*, *Where's the Bass*, 2024–2026). Whether those are his is **not verifiable** — treat as
  a separate catalogue until the artist confirms. His Apple page therefore carries a
  **CONFIRM** note on the site.
* A **Deezer artist page (5432196)** that also lists 2020–21 tracks *Northern Skys*, *Lights*,
  *Alone*, *Lost* under “Mak Recordings”. These were **not** included in the discography
  because the credits match the non-Ugandan catalogue. Only the 2022–2025 Ugandan releases
  (Yuut Empire / Davmak city / Silence town, Luganda titles, credits to Wandera David /
  Davmak / Melo Killit / Silence) are presented as his.

**Why these are trustworthy:** the included releases are the only ones that are (a) credited to
Luganda titles that also appear as his own TikTok sound hashtags, and (b) released on the
imprints his cover art names.

---

## 4. CONFIRM list — needed from the artist/management before launch

| # | Item | Current handling on the site |
| --- | --- | --- |
| 1 | Reading of the name — “Wandera David Musamya” is copied verbatim from his own Howwe bio; confirm spelling/order and whether “Wandera” is the surname | Displayed as the legal/real name line |
| 2 | Instagram bio, highlights, pinned posts, follower count | Not used at all; Connect page shows a static wall and says a token is needed for the live feed |
| 3 | An artist-owned YouTube channel (currently only the label channel *Yute Empire* is verified) | YouTube icon points at the label channel with a note |
| 4 | Spotify / Boomplay / Audiomack / Facebook / X profile URLs | Icons rendered **greyed out** with a “pending” label — no invented links |
| 5 | Which Apple Music page is truly his (mixed catalogue) | Listed with a visible *CONFIRM* chip |
| 6 | Are *Misery* (2022), *Bounce To This* (2022), *Move It Down* (2023) part of the same catalogue? They only appear on the mixed Apple page | **Omitted** from the discography until confirmed |
| 7 | Is *Saagalaakugambako* (used as a TikTok caption/sound) an official release? | **Omitted**; mentioned here only |
| 8 | Booking / management / press email addresses | None were publicly verifiable → booking card says “pending”; enquiries go to the private CMS inbox |
| 9 | Genre self-description and named influences | Site states audible territory only and labels influences **“to confirm”** |
| 10 | Licensed press/editorial photography, shoot credits | No verified photography was publicly accessible; gallery uses official release artwork only, and says so |
| 11 | Past live performances / events history | No verified dates found; Events shows an honest empty state (pre-wired for CMS entry) |
| 12 | Any awards, chart entries, playlist covers, radio support | **None claimed anywhere** on the site |
| 13 | Territory/set-length conventions for booking | Marked as “available on request” rather than invented |

---

## 5. Sources consulted

1. Howwe.ug artist profile & biography — `howwe.ug/DMak`, `howwe.ug/DMak/biography` (bio text, profile added 23 Jan 2022, 5.0/6 votes)
2. TikTok — `tiktok.com/@d.makmusic` (handle, captions/hashtags, original sounds)
3. Deezer public API — artist `5432196`: album metadata, release dates, labels, composers, track IDs, durations, 30-second previews
4. Apple Music — artist page `258998257` (mixed catalogue; flagged)
5. Amazon Music — *Ffe Tuliko* release page `B0D5KXDZF1`
6. YouTube — *Nkulina (Official Video)* `Q6fxhHkJBug` uploaded by **Yute Empire**, 9 Feb 2023
7. Release artwork files themselves — *Naawe* (prod. credit + Kai Designz), *Bitandike* (Yuut Empire), *Ogonda Nnyo*, *Bwotyo*, *Wadala*, *Only You*, *Ffe Tuliko*
8. Discogs + SoundCloud — used only to **exclude** same-name artists

Artwork used on the site: the seven official release covers + one official video still. These are
the artist's own promotional assets; keep the credit lines that are displayed with them
(Yuut Empire, Davmak city, Silence town, Kai Designz) and swap in higher-resolution files if
management supplies them.

---

## 6. How the brand was built from the evidence

* Palettes were sampled directly from his covers — the crimson neon of *Ogonda Nnyo*, the violet
  haze of *Bitandike*, the chain-gold of *Naawe*, the mint of the *Nkulina* still. **Obsidian +
  violet + signal crimson + gold** is his own visual identity, not an imposed trend palette.
* Tagline *“Luganda soul. Neon future.”* and signature *“Every heart runs on a frequency.”* are
  original creative copy written for this site — they describe the verified reality (Luganda
  love songs, digital-first release strategy) without inventing achievements.
* The biography narrates only what the sources support: school in 2016, Busia, the 2022→2025
  release run, the TikTok sound life of *Ogonda Nnyo*, the move to his own imprint names.
  Interpretive lines (the “temperature” of the records) are clearly editorial, not factual claims.
* No awards, no stream counts, no chart positions, no “sold out” shows — none exist in the record.
