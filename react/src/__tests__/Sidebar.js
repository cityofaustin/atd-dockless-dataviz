import React from 'react';
import { configure, render } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import Sidebar from '../components/Sidebar';

configure({ adapter: new Adapter() });

describe('<Sidebar />', () => {
  const TestSidebar = render(<Sidebar />);

  afterAll(() => {
    TestSidebar.detach();
  })
  it('is titled "Dockless Data Explorer"', () => {
    expect(TestSidebar.find('h1').text()).toBe('Dockless Data Explorer');
  });

  it('displays the City of Austin Logo', () => {
    expect(TestSidebar.find('.coa_logo')).toBeTruthy();
  });

  it('displays the Traansportation Department title', () => {
    expect(TestSidebar.find('h4').text()).toEqual('City of Austin Transportation Department');
  });

  it('contains two Select menus', () => {
    expect(TestSidebar.find('select')).toHaveLength(2);
  });

  it('has a Button', () => {
    expect(TestSidebar.find('button')).toHaveLength(1);
    // TODO: Maybe verify the button's text?
    // TODO: Test that this button triggers the info modal
  });

  it('has a disclaimer at the bottom', () => {
    expect(TestSidebar.find('.disclaimer')).toHaveLength(1);
  });
});

// Arrange
// Act
// Assert