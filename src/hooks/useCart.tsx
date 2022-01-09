import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product,Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
 
   const [cart, setCart] = useState<Product[]>(() => {
   const storagedCart = localStorage.getItem('@RocketShoes:cart');

     if (storagedCart) {
       return JSON.parse(storagedCart);
     }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const isProductInCart=cart.findIndex(product => product.id === productId);
      let newCart=[...cart];
      if(isProductInCart!==-1) {
       const {data:stock} = await api.get<Stock>(`stock/${productId}`);

       if (cart[isProductInCart].amount >= stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      newCart[isProductInCart].amount +=1;
      setCart(newCart);

      }else{
        const {data:product} = await api.get<Product>(`products/${productId}`);
        newCart=[...newCart,{...product,amount:1}];
        console.log(newCart);
        setCart(newCart);
      }
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      toast.success('Produto adicionado ao Carrinho');
    } catch(e) {
      toast.error('Erro na adição do produto');

    }
     
  };

  const removeProduct = (productId: number) => {
    try {
      let newCart=[...cart];
      const index=cart.findIndex(product=>product.id === productId);
      if(index!==-1) {
      newCart.splice(index, 1);
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }else{
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
      
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      let newCart = [...cart]
      const productInCart=cart.findIndex(product => product.id === productId);
      const {data:stock} = await api.get<Stock>(`stock/${productId}`);

      if (amount >= stock.amount) {
       toast.error('Quantidade solicitada fora de estoque');
       return;
     }
     if(amount<1){
       return;
     }
     newCart[productInCart].amount = amount;
     setCart(newCart);
     localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

    
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
