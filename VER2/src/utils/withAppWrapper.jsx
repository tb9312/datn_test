import React from 'react';
import { App } from 'antd';

/**
 * Wrapper để bọc component bên trong App context của Ant Design
 * Cho phép dùng App.useApp() hook để truy cập message, notification, modal
 */
export const withAppWrapper = (Component) => {
  return function WrappedComponent(props) {
    return (
      <App>
        <Component {...props} />
      </App>
    );
  };
};

export default withAppWrapper;
