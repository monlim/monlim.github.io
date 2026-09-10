# monicalim.online

The source of this site. It is plain HTML and CSS — no build step, no framework.
**Whatever is on the `main` branch is what's published**, live within about a minute
of a push, at https://monicalim.online.

## Editing

Edit the HTML directly, either here on GitHub (click a file, then the pencil icon)
or on your Mac in `~/Desktop/MyWebsite/site`. There is nothing to compile or run.

Each page is a folder containing an `index.html`, and the folder name is the URL:

| File | Page |
|---|---|
| `index.html` | monicalim.online |
| `bio/index.html` | /bio |
| `music/index.html` | /music — the albums |
| `music-performance/index.html` | /music-performance — the live works |
| `guilty/index.html` | /guilty, and so on for each work |

Shared pieces:

- `assets/css/style.css` — all styling for every page
- `assets/js/fx.js` — the cursor animations (one of four picked at random per page
  load; add `?fx=landmarks`, `?fx=data`, `?fx=warp` or `?fx=wave` to any URL to force one)
- `assets/js/logo-fx.js` — the animated header logo
- `assets/img/`, `assets/video/` — media
- `lab/` and `lab/logo/` — hidden demo pages for the animations, not linked from the site

## Adding a new work page

Copy the folder of an existing work (`guilty/` is a good model), rename it to the URL
you want, and edit the text and images inside. Then add a link to it from the relevant
category page (for example `installations/index.html`) so people can find it.

## Changing something on every page

The header, navigation and footer are repeated in each `index.html`. To change them
site-wide, do a find/replace across all the page files — from `~/Desktop/MyWebsite/site`:

```bash
grep -rl 'OLD TEXT' --include='*.html' . | xargs sed -i '' 's/OLD TEXT/NEW TEXT/g'
```

Check `git diff` before committing, and `git checkout .` undoes it if it goes wrong.

## The contact form

The "BE IN THE LOOP" form on `/contact` posts to Formspree (form `mykrodyk`);
submissions arrive by email and are listed in the Formspree dashboard.

## History

This site was migrated off Wix in July 2026. The original crawl — page content, full
resolution media and screenshots of the old design — is archived on Monica's Mac at
`~/Desktop/MyWebsite/wix-export/`, along with the retired script that did the initial
conversion. None of that is needed to run or change the site; this HTML is the
source of truth.
