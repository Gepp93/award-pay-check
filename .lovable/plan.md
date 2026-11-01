# Step 1 only: check whether live hosting serves separate page files

## What is known
- The site has no standalone page files today, so live hosting cannot answer this question yet.
- The editor preview runs a development server, not the production host. A result there would not prove how the live site behaves.

## Smallest test
1. Add two tiny files that nobody visits. Each has a robots noindex meta tag, no links to it, and is left out of the sitemap:
   - `public/hosting-probe/index.html` containing the text "PROBE-DIR"
   - `public/hosting-probe-flat.html` containing the text "PROBE-FLAT"
2. On the preview host, fetch these three addresses separately using raw HTML, as Googlebot would: `/hosting-probe`, `/hosting-probe/` and `/hosting-probe-flat.html`. Record the status code and look for the PROBE marker in each response. The generic app shell has the marker `<div id="root">` and the homepage title, so the two can be told apart.
3. Before asking to publish, confirm that the project differs from the last published version only by the two probe files. If any other unpublished change exists, list it and stop.
4. Report the preview results and ask for separate approval to publish the probes. After that publish, repeat step 2 on www.awardpay.com.au.
5. Delete both probe files, prepare the cleanup publish and ask for approval. No pre-rendering work starts until the live result is confirmed.

## Unchanged
Checker, routing, Stripe, report protection, enquiries and Engine v2. Nothing is published without your approval.
