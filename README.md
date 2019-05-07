# Dockless Data Explorer

This repo hosts code for mapping and visualizing dockless mobility data origins and destinations using Mapbox GL JS.

## Getting Started

1.  `npm install`

1.  `npm start`

1.  Open `http://localhost:8080/` in your browser.

## Getting Data

In order to pull data into the map when you run this code locally on your computer, you have two options:

1.  Download the [dockless-api](https://github.com/cityofaustin/dockless-api) repo and follow the instructions to set it up locally on your machine.
    - If you install the dockless-api using Docker, you should be able to pull data without further configuration.
    - If you run the dockless-api using the Python local install, you will need to change the `API_URL` value in the `webpack.dev.js` file:
      - from: `API_URL: JSON.stringify("http://localhost:8000/v1/trips")`
      - to: `API_URL: JSON.stringify("http://localhost:80/v1/trips")`
2.  Pull data from the production API:
    - In order to reference the production API endpoint, you will need to change the `API_URL` value in the `webpack.dev.js` file:
      - from: `API_URL: JSON.stringify("http://localhost:8000/v1/trips")`
      - to: `API_URL: JSON.stringify("https://dockless-data.austintexas.io/v1/trips")`
      
## License
As a work of the City of Austin, this project is in the public domain within the United States.

Additionally, we waive copyright and related rights in the work worldwide through the CC0 1.0 Universal public domain dedication.
