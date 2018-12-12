import React, { Component } from 'react';

import Select from '@material/react-select';
import Button from '@material/react-button';
import '@material/react-button/dist/button.css';
import '@material/react-select/dist/select.css';

import SidebarStyles from './styles/SidebarStyles';

class Sidebar extends Component {

  state = {
    flow: '',
    mode: ''
  }

  render() {
    return (
      <SidebarStyles>
        <div className="topBlock">
          <h1>Dockless Data Explorer</h1>
          <div className='departmentBlock'>
            <img className='coa_logo' src={require('../assets/coa_seal_lg.jpeg')} alt="City of Austin Logo" />
            <h4>City of Austin Transportation Department</h4>
          </div>
          <div className='selectBlock'>
            <Select
              label=''
              outlined
              floatingLabelClassName='mdc-floating-label--float-above'
              onChange={e => this.setState({ flow: e.target.value })}
              options={[
                {
                  disabled: true,
                  label: 'Travel data by',
                  value: ''
                },
                {
                  label: 'Trip Origins',
                  value: 'Trip Origins'
                },
                {
                  label: 'Trip Destinations',
                  value: 'Trip Destinations'
                }
              ]}
            >
            </Select>
            <Select
              label=''
              outlined
              floatingLabelClassName='mdc-floating-label--float-above'
              onChange={e => this.setState({ mode: e.target.value })}
              options={[
                {
                  disabled: true,
                  label: 'Mode',
                  value: ''
                },
                {
                  label: 'All',
                  value: 'All'
                },
                {
                  label: 'Scooter',
                  value: 'Scooter'
                },
                {
                  label: 'Bicycle',
                  value: 'Bicycle'
                }
              ]}
            >
            </Select>
          </div>
          <Button
            outlined
            onClick={() => console.log('clicked')}
          >
            More info
        </Button>
        </div>
        <p className='disclaimer'>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin luctus libero nec nulla rutrum, id tempus velit elementum. Nam venenatis, nibh in pretium vulputate, dolor lacus accumsan arcu, in interdum metus eros eget felis. Proin dapibus pulvinar molestie.
        </p>
      </SidebarStyles>
    )
  }
}

export default Sidebar;