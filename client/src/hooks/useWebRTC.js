import { useEffect, useRef, useState, useCallback } from "react";
import { connectSocket, disconnectSocket } from "../services/socket";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

// Drives one 1-to-1 WebRTC call for a session room. Socket.io is used only
// for signaling (offer/answer/ICE) and for chat/whiteboard — never for media.
export function useWebRTC(sessionId) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState("new");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [joinError, setJoinError] = useState(null);

  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const screenTrackRef = useRef(null);

  function createPeerConnection(socket) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit("ice-candidate", { candidate: e.candidate });
    };
    pc.ontrack = (e) => setRemoteStream(e.streams[0]);
    pc.onconnectionstatechange = () => setConnectionState(pc.connectionState);

    return pc;
  }

  async function makeOffer() {
    const pc = pcRef.current;
    const socket = socketRef.current;
    if (!pc || !socket) return;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("offer", { sdp: offer });
  }

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    const socket = connectSocket();
    socketRef.current = socket;
    const pc = createPeerConnection(socket);
    pcRef.current = pc;

    async function setup() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        cameraTrackRef.current = stream.getVideoTracks()[0];
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        setLocalStream(stream);
      } catch (err) {
        // Camera/mic denied — chat and whiteboard still work since they
        // don't depend on getUserMedia at all.
        setJoinError("media-denied");
      }

      socket.emit("join-room", { sessionId });
    }

    function onJoined({ participants: list }) {
      setParticipants(list);
    }

    function onJoinError({ reason }) {
      setJoinError(reason);
    }

    function onParticipantJoined() {
      // Whoever was already in the room initiates the offer — simple,
      // deterministic rule that avoids any glare handling for exactly 2 peers.
      makeOffer();
    }

    async function onOffer({ sdp }) {
      await pc.setRemoteDescription(sdp);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { sdp: answer });
    }

    async function onAnswer({ sdp }) {
      await pc.setRemoteDescription(sdp);
    }

    async function onIceCandidate({ candidate }) {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        // benign — can happen if candidates arrive before remote description
      }
    }

    function onParticipantLeft() {
      setRemoteStream(null);
      setConnectionState("new");
    }

    socket.on("joined-room", onJoined);
    socket.on("join-error", onJoinError);
    socket.on("participant-joined", onParticipantJoined);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIceCandidate);
    socket.on("participant-left", onParticipantLeft);

    if (socket.connected) {
      setup();
    } else {
      socket.once("connect", setup);
    }

    return () => {
      cancelled = true;
      socket.emit("leave-room");
      socket.off("joined-room", onJoined);
      socket.off("join-error", onJoinError);
      socket.off("participant-joined", onParticipantJoined);
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIceCandidate);
      socket.off("participant-left", onParticipantLeft);

      pc.close();
      pcRef.current = null;
      setLocalStream((stream) => {
        stream?.getTracks().forEach((t) => t.stop());
        return null;
      });
      screenTrackRef.current?.stop();
      disconnectSocket();
    };
  }, [sessionId]);

  const toggleMic = useCallback(() => {
    const track = pcRef.current
      ?.getSenders()
      .find((s) => s.track?.kind === "audio")?.track;
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }, []);

  const toggleCamera = useCallback(() => {
    const track = cameraTrackRef.current;
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraOn(track.enabled);
  }, []);

  const stopScreenShare = useCallback(async () => {
    const pc = pcRef.current;
    const sender = pc?.getSenders().find((s) => s.track?.kind === "video");
    if (sender && cameraTrackRef.current) {
      await sender.replaceTrack(cameraTrackRef.current);
    }
    screenTrackRef.current?.stop();
    screenTrackRef.current = null;
    setIsScreenSharing(false);
    socketRef.current?.emit("screen-share-stopped");
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      await stopScreenShare();
      return;
    }
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;

      const pc = pcRef.current;
      const sender = pc?.getSenders().find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(screenTrack);

      // Browser's own "Stop sharing" control bypasses our UI entirely —
      // this is how we find out and revert to the camera.
      screenTrack.onended = () => stopScreenShare();

      setIsScreenSharing(true);
      socketRef.current?.emit("screen-share-started");
    } catch {
      // user cancelled the picker — no state change
    }
  }, [isScreenSharing, stopScreenShare]);

  return {
    localStream,
    remoteStream,
    connectionState,
    isScreenSharing,
    micOn,
    cameraOn,
    participants,
    joinError,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
  };
}
