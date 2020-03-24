vkit
=========

Allows the production of a PDF with printable cards

* Contributors: Tom Marlin
* Website: https://github.com/swccgpc/swccg-vkit


## Generating the json file

* `create_json.js` lists all the images located at `https://res.starwarsccg.org/vkit/cards/standard/` and creates a json file from it.
* `create_json.js` requires that environment variables, `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`, or `AWS_PROFILE` be set.
* Run the script using **NodeJS** and the **AWS-SDK** for Javascript.

```bash
export AWS_PROFILE="swccg-production"
node create_json.js

```

## Deploying

* **vkit** is hosted in the S3 bucket: `vkit.starwarsccg.org`.
* Deploying to the S3 bucket is handled by a **GitHub Action** when merging in to the **Master Branch**.
* For _**YOU**_ to deploy, you must:
  1. Create a `pull request` against this repo
  2. Have the pull request merged to `master`.
* Once @DevoKun or @thomasmarlin approve and merge the pull request the GitHub action will automatically deploy the latest code version.


