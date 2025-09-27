import React from 'react';
import { NavWithLogo } from '../../components/shared/nav';
import { CartView } from '../../components/customer/CartView';

export const Cart = () => {
  return (
    <>
      <NavWithLogo />
      <CartView />
    </>
  );
};

export default Cart;    