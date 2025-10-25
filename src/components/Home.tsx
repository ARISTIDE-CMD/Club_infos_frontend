import React, { useState } from "react";
import Login from "./Login";

export default function HomePage() {
  const [showLogin, setShowLogin] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

     const handleLoginSuccess = () => {
    console.log("✅ Connexion réussie !");
    setShowLoginModal(false); // ferme la modale
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white flex flex-col items-center justify-center relative overflow-hidden">

      {/* 🌌 Effet de fond (dégradé radial doux + neutre aux clics) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none"></div>

      {/* 🧭 En-tête : Logo + titre */}
      <header className="absolute top-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 z-20">
        <img
          src="/src/assets/images/ChatGPT Image 25 oct. 2025, 10_21_41.png"
          alt="Logo Club Informatique"
          className="w-12 h-12 rounded-full shadow-md object-cover border border-indigo-400/40"
        />
        <h1 className="text-2xl md:text-3xl font-bold tracking-wide text-indigo-400 drop-shadow-md">
          Club Informatique
        </h1>
      </header>

      {/* 🏠 Section principale */}
      <main className="flex flex-col items-center text-center mt-24 px-6 z-10">
        <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          Bienvenue au{" "}
          <span className="text-indigo-400">Club Informatique</span>
        </h2>

        <p className="max-w-xl text-gray-300 mb-10 text-lg leading-relaxed">
          Rejoignez la communauté des passionnés de technologie, développez vos compétences
          et collaborez sur des projets innovants au sein de l’IUT.
        </p>

        <button
          onClick={() => setShowLoginModal(true)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 transform hover:scale-105"
        >
          Se connecter
        </button>
      </main>

      {/* 🧾 Pied de page */}
      <footer className="absolute bottom-6 text-gray-500 text-sm z-20">
        © {new Date().getFullYear()} Club Informatique — Tous droits réservés
      </footer>

      {/* 🔐 Modal de connexion */}
   {showLoginModal && (
        <Login
          onLoginSuccess={handleLoginSuccess}
          setShowLoginModal={setShowLoginModal}
        />
      )}

      {/* 🎬 Animation modale */}
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
}
