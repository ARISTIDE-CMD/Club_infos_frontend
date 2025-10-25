import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
// import Login from './Login';

interface LoginProps {
  onLoginSuccess: () => void;
  setShowLoginModal: (show: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, setShowLoginModal }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await api.post('/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(user));

      setMessage('Connexion réussie !');
      setTimeout(() => {
        if (user.role === 'admin') navigate('/dashboard');
        else navigate('/student-dashboard');
      }, 1000);
    } catch (error: any) {
      setMessage("Échec de la connexion. Vérifiez vos identifiants.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={() => setShowLoginModal(false)} // clic en dehors
    >
      <div
        className="bg-gray-800/95 rounded-2xl p-8 w-[90%] sm:w-96 relative shadow-2xl border border-indigo-500/30 animate-slideUp"
        onClick={(e) => e.stopPropagation()} // empêche la fermeture au clic dedans
      >
        {/* Bouton de fermeture */}
        <button
          onClick={() => setShowLoginModal(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-indigo-400 transition"
        >
          ✕
        </button>

        {/* En-tête */}
        <h3 className="text-2xl font-bold mb-6 text-center text-indigo-400">
          Connexion
        </h3>

        {/* Message */}
        {message && (
          <div
            className={`text-center mb-4 py-2 rounded-md text-sm ${
              message.includes('réussie')
                ? 'bg-green-600/30 text-green-300'
                : 'bg-red-600/30 text-red-300'
            }`}
          >
            {message}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <input
            type="email"
            placeholder="Adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 rounded-lg mt-2 transition-all duration-200 shadow-md disabled:opacity-70"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {/* Infos de démonstration */}
        {/* <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm mb-2">Exemples :</p>
          <div className="bg-gray-700 p-3 rounded-lg text-gray-300 text-xs">
            <p><strong>Admin :</strong> admin@example.com</p>
            <p><strong>Étudiant :</strong> student@example.com</p>
            <p><strong>Mot de passe :</strong> password</p>
          </div>
        </div> */}
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Login;
