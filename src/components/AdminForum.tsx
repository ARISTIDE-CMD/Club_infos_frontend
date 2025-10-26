import { useState, useEffect } from "react";
import api from "../api"; // instance axios

interface Message {
  project_id: number;
  message: string;
  user_name: string;
  created_at: string;
}

interface Student {
  student_id: number;
  user_name: string;
  project_id: number;
}

interface AdminChatData {
  messages: Message[];
  students: Student[];
}

export default function AdminForum() {
  const [chatData, setChatData] = useState<AdminChatData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openForums, setOpenForums] = useState<{ [key: number]: boolean }>({});
  const [chatInput, setChatInput] = useState<{ [key: number]: string }>({});
  const [loadingSend, setLoadingSend] = useState(false);

  // ✅ Récupérer tous les messages
  const fetchAllMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      const res = await api.get("/admin/messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChatData(res.data);
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors du chargement des messages.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fonction pour envoyer un message par l'admin
  const handleSendMessage = async (projectId: number) => {
    if (!chatInput[projectId]) return;

    setLoadingSend(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await api.post(
        "/projects/messages",
        {
          project_id: projectId,
          message: chatInput[projectId],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Mettre à jour le chat localement
      setChatData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, res.data],
        };
      });

      setChatInput(prev => ({ ...prev, [projectId]: "" }));
    } catch (err: any) {
      console.error("Erreur lors de l'envoi du message", err);
    } finally {
      setLoadingSend(false);
      fetchAllMessages()
    }
  };

  useEffect(() => {
    fetchAllMessages();
  }, []);

  if (loading) return <p className="text-gray-500 m-auto">Chargement des messages...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!chatData) return null;

  // Grouper les messages par projet
  const messagesByProject: { [key: number]: Message[] } = chatData.messages.reduce(
    (acc: any, msg) => {
      if (!acc[msg.project_id]) acc[msg.project_id] = [];
      acc[msg.project_id].push(msg);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      {Object.entries(messagesByProject).map(([projectId, messages]) => (
        <div key={projectId} className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
          {/* --- Header cliquable --- */}
          <div
            className="flex justify-between items-center cursor-pointer select-none"
            onClick={() =>
              setOpenForums(prev => ({ ...prev, [Number(projectId)]: !prev[Number(projectId)] }))
            }
          >
            <h3 className="text-lg font-bold mb-3">💬 Chat du projet #{projectId}</h3>
            <div
              style={{ width: 10, height: 10, borderRadius: 50, backgroundColor: "green", opacity: 0.6 }}
            ></div>
          </div>

          {/* --- Contenu repliable --- */}
          {openForums[Number(projectId)] && (
            <>
              {/* Liste des étudiants */}
              {chatData.students.filter(s => s.project_id === Number(projectId)).length > 0 && (
                <div className="mb-3 border border-gray-200 bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">👥 Membres du projet :</h4>
                  <ul className="text-sm text-gray-600 flex flex-wrap gap-2">
                    {chatData.students
                      .filter(s => s.project_id === Number(projectId))
                      .map((student, i) => (
                        <li
                          key={i}
                          className="bg-gray-200 px-2 py-1 rounded-full text-xs font-medium text-gray-800"
                        >
                          {student.user_name}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Messages */}
              <div className="max-h-60 overflow-y-auto border p-3 rounded-lg bg-gray-50 mb-3 space-y-2">
                {(messages as Message[]).map((msg, idx) => {
                  const isAdmin = msg.user_name === "Admin User";
                  return (
                    <div
                      key={idx}
                      className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] p-2 rounded-lg shadow-sm ${
                          isAdmin
                            ? "bg-indigo-600 text-white rounded-br-none"
                            : "bg-gray-200 text-gray-900 rounded-bl-none"
                        }`}
                      >
                        {!isAdmin && (
                          <div className="text-xs font-semibold text-gray-600 mb-1">
                            {msg.user_name}
                          </div>
                        )}
                        <div className="text-sm">{msg.message}</div>
                        <div
                          className={`text-[10px] mt-1 ${
                            isAdmin ? "text-indigo-200 text-right" : "text-gray-500 text-left"
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input pour envoyer un message */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Écrire un message..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={chatInput[Number(projectId)] || ""}
                  onChange={e =>
                    setChatInput(prev => ({ ...prev, [Number(projectId)]: e.target.value }))
                  }
                />
                <button
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                  onClick={() => handleSendMessage(Number(projectId))}
                  disabled={loadingSend}
                  style={{ opacity: loadingSend ? 0.5 : 1 }}
                >
                  {loadingSend ? "Envoi..." : "Envoyer"}
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
