VKIT
=========
Welcome to VKIT for Star Wars CCG! This tool lets you print out all of the "Virtual Cards" for the game.

For more information about Star Wars CCG, check out the SWCCG Players Committee website here: https://www.starwarsccg.org/

* Website: https://www.starwarsccg.org/vkit/


## Where Can I Ask Questions?
The best place to ask questions about this project is on the Star Wars CCG Players Committee Forums. Specifically, the "Resources" Sub-Form: https://forum.starwarsccg.org/viewforum.php?f=188


## Where are the Images?
* The source of truth for all images is in the [swccg-vkit-images](https://github.com/swccgpc/swccg-vkit-images) git repo.
* Images are uploaded by a GitHub action to the `res.starwarsccg.org` S3 Bucket.
* `allCards.json` is generated from a listing of the images stored in the `res.starwarsccg.org` S3 Bucket.


## The JSON Database
* The JSON Database comes from [swccg-cards-json](https://github.com/swccgpc/swccg-cards-json).
* When the card JSON is updated, vkit is automatically updated with the new data. No manual action is required.


## Deploying

* **vkit** is hosted in the S3 bucket: `vkit.starwarsccg.org`.
* Deploying to the S3 bucket is handled by a **GitHub Action** when merging in to the **Master Branch**.
* For _**YOU**_ to deploy, you must:
  1. Create a `pull request` against this repo
  2. Have the pull request merged to `master`.
* Once @DevoKun or @thomasmarlin approve and merge the pull request the GitHub action will automatically deploy the latest code version.


## How To Contribute?
If you see bugs in the current data, please contribute!

Here's a brief overview of what you will need to do:
1. Create a Fork of the code
2. Create a new branch inside your fok
3. Commit your changes in that branch
4. Create a pull request (PR)
5. Someone on the team will review your PR and get it merged?

There is a nice tutorial here:
https://www.thinkful.com/learn/github-pull-request-tutorial/Time-to-Submit-Your-First-PR#Time-to-Submit-Your-First-PR


## Attribution
This code is a fork of the original here: https://github.com/thomasmarlin/vkit
