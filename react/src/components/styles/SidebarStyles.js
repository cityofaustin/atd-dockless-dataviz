import styled from '@emotion/styled';

const SidebarStyles = styled.aside`
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 25%;
  padding: 2em;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 2px;
  box-shadow: 0px 1px 2px 0px gray;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  justify-content: space-between;

  .topBlock {
    display: flex;
    width: 100%;
    flex-direction: column;
    height: min-content;
    h1 {
      font-size: 3.2em;
      font-weight: 300;
    }
    .departmentBlock {
      height: 10em;
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2em;
      img {
        width: 8em;
        height: 8em;
      }
      h4 {
        font-size: 2.2em;
        font-weight: 700;
        width: 60%;
      }
    }

    .selectBlock {
      display: flex;
      flex-direction: column;
      height: 20em;
      justify-content: space-around;
    }
    button {
      align-self: flex-end;
    }
  }

  p {
    font-size: 1.2em;
    font-style: italic;
  }
`;

export default SidebarStyles