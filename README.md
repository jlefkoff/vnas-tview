# vNAS Transceiver Viewer

This web application fetches virtual transceiver data that is used in CRC for AFV integration. It assists facility engineers in determining if there is adequate coverage across their respective ARTCC.

The in-production version of this site can be veiwed (here)[https://vnas-tmap.jlefkoff.com/]

## Development

This is a vite/react web app for the frontend, and a small express js app to serve and proxy the API requests. It can be developed by running:

`npm install`
`npx vite build --base=/`
`npx tsx server/server.ts`

and going to (localhost:3000)[http://localhost:3000]

For production purposes, it is run as a docker container. You can also build/run this on your local machine with:

`docker compose up --build`