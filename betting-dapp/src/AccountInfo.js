import React from 'react';

function AccountInfo({ account, bettingStatus }) {
  return (
    <div className="account-info">
      <p>Account: {account}</p>
    </div>
  );
}

export default AccountInfo;
