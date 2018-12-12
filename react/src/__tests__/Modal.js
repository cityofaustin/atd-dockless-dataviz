import React from 'react';
import { configure, mount, render } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import Modal from '../components/Modal';

configure({ adapter: new Adapter() });

describe('< Modal/>', () => {
  const TestModal = render(<Modal />);
  it('renders without crashing', () => {
    render(<Modal />);
  });
  it('has a title', () => {
    expect(TestModal.find('h2')).toHaveLength(1);
  })

  it('is titled: "How to Use the ATD Dockless Data Explorerer"', () => {
    expect(TestModal.find('h2').text())
      .toEqual('How to Use the ATD Dockless Data Explorerer');
  });

  it('features the City of Austin Logo', () => {
    expect(TestModal.find('.coa_logo')).toHaveLength(2);
  });

  it('conatins links to the Github repo and Transportation Department email', () => {
    expect(TestModal.find('a')[0].attribs.href)
      .toBe('mailto:transportation.data@austintexas.gov?subject=dockless.austintexas.io');
    expect(TestModal.find('a')[1].attribs.href)
      .toBe('https://github.com/cityofaustin/dockless');
  });

  it('has two buttons for closing the modal', () => {
    expect(TestModal.find('button')).toHaveLength(2);
  })
})