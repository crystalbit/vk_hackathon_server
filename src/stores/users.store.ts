// TODO при выносе указать тип Socket
const UserToSocket = new Map<number, any>();

export const setSocket = (user: number, socket: any) => {
  UserToSocket.set(user, socket);
};

export const clearSocket = (user: number) => {
  UserToSocket.delete(user);
};

export const getSocket = (user: number): any => {
  return UserToSocket.get(user);
};
