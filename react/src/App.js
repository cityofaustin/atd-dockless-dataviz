import React, { Component } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';

import './App.css';


class App extends Component {
  render() {
    return (
      <div className="App">
        <Map />
        <Sidebar />
      </div>
    );
  }
}

export default App;
