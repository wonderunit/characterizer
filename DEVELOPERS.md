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