import React, { Component } from 'react';
import ReactMapGL from 'react-map-gl';
import config from '../config';

class Map extends Component {
  state = {
    viewport: {
      width: '100vw',
      height: '100vh',
      latitude: 30.267880513242993,
      longitude: -97.7440843811165,
      zoom: 12
    }
  }

  render() {
    return (
      <ReactMapGL
        {...this.state.viewport}
        onViewportChange={(viewport) => this.setState({ viewport })}
        mapboxApiAccessToken={config.MAPBOX_GL_JS_KEY}
      />
    );
  }
}

export default Map;