# Loot Drop for TRMNL

Free games, looted straight to your wall. Every game that is free to keep right now on Epic, Steam, GOG and itch.io, as an RPG inventory with an HP bar that drains until the offer despawns. Scan the QR code, claim it, done. No account, no keys, no grinding.

## Screens and settings

All four sizes (full, half horizontal, half vertical, quadrant), in landscape and portrait, from the OG to the X. The QR code on the screen is made by TRMNL itself (`qr_code` in Liquid), so it needs no other service.

- **Stores:** which stores to look in: big stores and itch.io (default), big stores only, Epic and Steam, or everything on PC. Epic's weekly free games are always included.
- **Country:** your two-letter country code, for Epic's prices and for which games are free where you live.

## How it works

- The polling URLs are Epic's own list of promotions (the JSON behind its free games page) and GamerPower's giveaways API.
- `src/transform.js` (serverless) merges the two: Epic lists sales next to giveaways, so only a 0% discount counts as free; a game that comes from both lists is kept once, with the claim count; the time left is worked out from the end date.
- `src/shared.liquid` and the four view files are the screens; the sprites are drawn by `dev/sprites.py`.

## Development

```bash
cd dev && npm install && cd ..
node dev/build.mjs            # renders every scenario into dev/out with the framework CSS (needs a connection)
python3 dev/render.py         # device-faithful mockups (see the script for the details)
```

`dev/raw` holds real data from Epic and GamerPower (26 Oct 2026) that the scenarios use.

## Data and credits

Epic Games Store (public promotions data) and [GamerPower](https://www.gamerpower.com) (free giveaways API; please keep the credit). This plugin is not affiliated with either. Game names and artwork belong to their owners.

## Links and license

- This is a TRMNL plugin (private plugin id 520374); the code here is what runs on TRMNL.
- Code: [MIT](LICENSE). Images, data and names belong to their sources and owners, credited above and on the screen.
