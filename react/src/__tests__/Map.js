import React from 'react';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import Map from '../components/Map';

configure({ adapter: new Adapter() });

describe('<Map />', () => {
  // Arrange
  const MyMap = shallow(<Map />);

  it('takes up the full viewport', () => {
    expect(MyMap.props().width).toEqual('100vw');
    expect(MyMap.props().height).toEqual('100vh');
  });

  it('is centered on Austin at initialization', () => {
    expect(MyMap.props().latitude).toEqual(30.267880513242993);
    expect(MyMap.props().longitude).toEqual(-97.7440843811165);
  });

  it('is zoomed to display neighborhood labels', () => {
    expect(MyMap.props().zoom).toEqual(12);
  })

  it('has an access token', () => {
    expect(MyMap.props().mapboxApiAccessToken).toBeDefined();
  })
});