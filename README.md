# Rising Up for SIDS: Progress Report 2023 (web edition)

A scrolling web edition of UNDP's 2023 progress report on the implementation of the SIDS Offer,
*Rising Up for Small Island Developing States*.

- `index.html` and `assets/` are the whole site. There is no build step to serve it.
- `source/` holds the parts the page is assembled from: `template.html`, `style.css`, `app.js`,
  the report text extracted from the PDF (`blocks.json`) and image sizes (`meta.json`).
  Rebuild with `python3 source/build.py <site-dir> source/blocks.json source/meta.json`,
  where `<site-dir>` contains `src/template.html`, `src/style.css` and `src/app.js`.

Report text, figures and photographs © 2023 United Nations Development Programme and the credited photographers.
