vkit
=========

Allows the production of a PDF with printable cards

* Contributors: Tom Marlin
* Website: https://github.com/swccgpc/swccg-vkit
* Tags: swccg vkit
* Requires at least: 2.7
* Stable tag: 1.0
* As a WordPress plugin, it deploys to: `wp-content/plugins/vkit-app`


## Generating the json file

* `create_json.js` lists all the images located at `https://res.starwarsccg.org/vkit/cards/standard/` and creates a json file from it.
* `create_json.js` requires that environment variables, `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`, or `AWS_PROFILE` be set.
* Run the script using **NodeJS** and the **AWS-SDK** for Javascript.

```bash
export AWS_PROFILE="swccg-production"
node create_json.js

```


