import {useSocket} from "socket.io-react-hook";
import {useMemo} from "react";
import {DefaultEventsMap, EventNames, EventParams} from "socket.io-client/build/typed-events";

function useSocketIo() {

  const socket = useSocket("http://localhost:8080");

  return useMemo(() => {

    function emitAck<Ev extends EventNames<DefaultEventsMap>>(ev: Ev, ...args: EventParams<DefaultEventsMap, Ev>): Promise<any> {
      return new Promise(resolve => socket.socket.emit(ev, ...args, resolve));
    }

    return Object.assign(socket.socket, {emitAck});
  }, [socket.socket]);

}

export default useSocketIo;