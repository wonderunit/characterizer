### Building for Linux and Windows with Docker for Mac

Install [Docker for Mac](https://www.docker.com/docker-mac), then:

```
git clone git@github.com:wonderunit/characterizer.git characterizer
docker run --rm -ti -v ${PWD}:/project -v ${PWD##*/}-node-modules:/project/node_modules -v ~/.electron:/root/.electron electronuserland/electron-builder:wine
cd characterizer
npm install
npm prune
npm run dist:win
```


## Testing Auto-Update

- `latest.yml` (for Windows) and `latest-mac.yml` (for Mac) must be published in the GitHub Release along with the other release files.

To test auto update, create a file called `dev-app-update.yml` in the root source folder with contents like:

```
owner: wonderunit
repo: storyboarder
provider: github
```

... then decrement the current version in `package.json`. You will be notified that the app is out-of-date (although in dev mode, when unsigned, Squirrel.Mac will throw `Error: Could not get code signature for running application`)

## Publishing

Be sure to have a local `GH_TOKEN` environment variable. For the value:

    Go to: https://github.com/settings/tokens/new
    Token description: Storyboarder Publishing
    Select scopes: [x] public_repo

Create a Draft in GitHub Releases as the target for publishing

Then, publish:

    GH_TOKEN={...} npm run dist:mac -- --publish onTagOrDraft
    GH_TOKEN={...} npm run dist:win -- --publish onTagOrDraft
    GH_TOKEN={...} npm run dist:linux -- --publish onTagOrDraft