import React, { createContext, useContext } from 'react';
import { socket } from '../socket';
import { Socket } from 'socket.io-client';


const SocketContext = createContext<Socket>(socket);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
