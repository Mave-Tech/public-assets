# Mave Public Assets

This repository contains the public assets for the Mave project.

## How to use

Use [JSDelivr](https://www.jsdelivr.com/) to load the assets.

Example:

`https://cdn.jsdelivr.net/gh/Mave-Tech/public-assets/<path>`

> TIP: Add `.min` before the file extension to load the minified version of the file.

## `legacy/`

Brokerage logos, icons and placeholders that the marketing templates used to pull
from the legacy Django app at `legacy.maveai.co/asset/<slug>.<ext>` (and, for a
handful, `dev.aws.maveai.co/asset/<slug>.<ext>`). A third set pointed at
`app.maveai.co/asset/<slug>.<ext>`, which never served assets at all: that host
answers any path with the web-portal SPA's `index.html`, so those references had
been rendering as broken images. Each of the real requests hit
`short_urls.views.asset`, which looked up a `MarketingAsset` row by slug and
streamed the file back out of `s3://mave-marketing-asset-bucket`. Serving a static
logo therefore depended on the legacy app and its database being up.

These are copies of those objects, so the same file is now reachable at
`cdn.maveai.co/legacy/<slug>.<ext>` with no app in the path.

**Filenames are the legacy database slug, not the original filename.** The two
often differ, because the slug came from the asset's name at creation while the S3
key came from its name at each save. `forest-hill-yorkville-black-logo.svg` here is
`forest_hill_yorkville_black_logo.svg` in the bucket, and `bed-icon-jj9rx8.svg`
carries a random suffix Django added to break a slug collision. Keeping the slug
means migrating a reference is a host swap and nothing more:

```
https://legacy.maveai.co/asset/<slug>.<ext>   ->  https://cdn.maveai.co/legacy/<slug>.<ext>
https://dev.aws.maveai.co/asset/<slug>.<ext>  ->  https://cdn.maveai.co/legacy/<slug>.<ext>
```

Two legacy slugs were byte-identical duplicates of another and are not mirrored:
`psr-logo-black` (a copy of `psr-black-logo-vxlx86` that had been uploaded under
the wrong brokerage) and `forest-hill-yorkville-white-logo` (a copy of
`forest-hill-yorkville-white-and-red-logo`). Every reference now points at the
survivor, so those two are the only slugs a host swap will not resolve.

Copying here does not retire anything: the legacy `/asset/` endpoint stays live
until every consumer has moved.
