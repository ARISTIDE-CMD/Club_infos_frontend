import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

(window as any).Pusher = Pusher;

// Configuration Laravel Echo pour Reverb
const echo = new (Echo as any)({
  broadcaster: "pusher",
  key: import.meta.env.VITE_REVERB_APP_KEY || "local",
  wsHost: import.meta.env.VITE_REVERB_WS_HOST || window.location.hostname,
  wsPort: Number(import.meta.env.VITE_REVERB_WS_PORT || 8080),
  forceTLS: false,
  disableStats: true,
  encrypted: false,
  authEndpoint: "/broadcasting/auth", // pour auth:sanctum ou Passport
});

interface Message {
  user: { name: string };
  content: string;
  created_at: string;
}

interface ProjectChatProps {
  projectId: number;
}

const ProjectChat: React.FC<ProjectChatProps> = ({ projectId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // Fetch messages existants
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await axios.get(`/api/projects/${projectId}/chat`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data.messages.reverse());
      } catch (error) {
        console.error("Erreur chargement messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // S'abonner au canal privé du projet
    const channel = echo.private(`project.${projectId}`);
    channel.listen("ProjectMessageSent", (e: any) => {
      setMessages(prev => [...prev, {
        user: { name: e.user },
        content: e.message,
        created_at: new Date().toISOString()
      }]);

      // scroll to bottom
      setTimeout(() => {
        if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
      }, 50);
    });

    return () => {
      channel.stopListening("ProjectMessageSent");
      echo.leave(`project.${projectId}`);
    };
  }, [projectId]);

  // Envoyer un message
  const send = async () => {
    if (!text.trim()) return;
    const token = localStorage.getItem("authToken");
    try {
      await axios.post(
        `/api/projects/${projectId}/chat`,
        { message: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setText(""); // reset input
    } catch (error) {
      console.error("Erreur envoi message:", error);
    }
  };

  if (loading) return <div>Chargement du chat...</div>;

  return (
    <div className="border rounded-lg p-4 bg-white shadow-md w-full max-w-md mx-auto">
      <div
        ref={boxRef}
        className="h-64 overflow-auto mb-3 space-y-2 p-2 bg-gray-50 rounded"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className="px-3 py-2 rounded-md bg-gray-100 border-l-4 border-indigo-500"
          >
            <div className="text-sm font-semibold text-indigo-700">{m.user.name}</div>
            <div className="text-sm">{m.content}</div>
            <div className="text-xs text-gray-400">
              {new Date(m.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Écrire un message..."
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          onClick={send}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
};

export default ProjectChat;
