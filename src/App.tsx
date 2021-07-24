import React, {useEffect, useRef} from "react";
import useSocketIo from "./useSocketIo";
import * as mediasoup from "mediasoup-client";

let fuse = false;

function App() {

  const socket = useSocketIo();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const device = new mediasoup.Device();
    const remoteStream = new MediaStream();
    if (audioRef.current === null) return;
    audioRef.current.srcObject = remoteStream;
    if (fuse) return;
    fuse = true;
    (async () => {
      const localStream = await navigator.mediaDevices.getUserMedia({audio: true});
      const {routerRtpCapabilities, send, recv} = await socket.emitAck("initializeConnection");
      await device.load({routerRtpCapabilities});

      const sendTransport = device.createSendTransport(send);
      const recvTransport = device.createRecvTransport(recv);

      sendTransport.on("connect", (parameters, cb) => {
        socket.emit("connectTransport", {type: "send", ...parameters}, cb);
      });

      sendTransport.on("produce", async (parameters, cb) => {
        const id = await socket.emitAck("createProducer", {
          id: sendTransport.id,
          kind: parameters.kind,
          rtpParameters: parameters.rtpParameters,
          appData: parameters.appData
        });
        cb(id);
      });

      recvTransport.on("connect", (parameters, cb) => {
        socket.emit("connectTransport", {type: "recv", ...parameters}, cb);
      });

      const producer = await sendTransport.produce({
        track: localStream.getAudioTracks()[0]
      });

      const parameters = await socket.emitAck("createConsumer", {
        producerId: producer.id,
        rtpCapabilities: device.rtpCapabilities
      });
      parameters.producerId = producer.id;
      const consumer = await recvTransport.consume(parameters);
      remoteStream.addTrack(consumer.track);
      socket.emit("resumeConsumer");
    })();
  }, [socket]);

  return (
      <audio ref={audioRef} autoPlay/>
  );
}

export default App;
