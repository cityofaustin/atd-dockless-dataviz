# Dockless Data Explorer

This repo hosts code for mapping and visualizing dockless mobility data origins and destinations using Mapbox GL JS.

## Getting Started

1.  `npm install`

1.  `npm start`

1.  Open `http://localhost:8080/` in your browser .

## Getting Data

In order to pull data into the map when you run this code locally on your computer, you have a two options.

1.  Download the [dockless-api](https://github.com/cityofaustin/dockless-api) repo and follow the instructions to set it up locally on your machine.
    - If you install the dockless-api using Docker, you should be able to pull data without further configuration.
    - If you run the dockless-api using the Python local install, you will need to change the `API_URL` value in the `webpack.dev.js` file:
      - from: `API_URL: JSON.stringify("http://localhost:8000/v1/trips")`
      - to: `API_URL: JSON.stringify("http://localhost:80/v1/trips")`
2.  Pull data from the production API:
    - In order to reference the production API endpoint, you will need to change the `API_URL` value in the `webpack.dev.js` file:
      - from: `API_URL: JSON.stringify("http://localhost:8000/v1/trips")`
      - to: `API_URL: JSON.stringify("https://dockless-data.austintexas.io/v1/trips")`

## Available Scripts

In the react directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
