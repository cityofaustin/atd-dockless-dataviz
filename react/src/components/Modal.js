import React, { Component } from 'react';

class Modal extends Component {
  render() {
    return (
      <dialog>
        <h2>How to Use the ATD Dockless Data Explorerer</h2>
        <button>X</button>
        <hr />
        <p>
          Use this tool to explore dockless mobility travel patterns 🛴 🚲 🔌.
        </p>
        <p>
          When you place a point on the map, shaded hexagons will indicate where trips from that region ended. If you switch the flow to origin, the hexagons indicate where trips to that region started.
        </p>
        <p>
          We welcome your feedback at 📫 <a href="mailto:transportation.data@austintexas.gov?subject=dockless.austintexas.io">transportation.data@austintexas.gov</a>. Visit the open-source project on <a href="https://github.com/cityofaustin/dockless">Github</a>.
        </p>
        <img className='coa_logo' src={require('../assets/coa_seal_lg.jpeg')} alt="City of Austin Logo" />
        <hr />
        <button>Close</button>
      </dialog>
    );
  }
}

export default Modal;