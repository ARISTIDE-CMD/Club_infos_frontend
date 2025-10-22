import React, { useState, useEffect } from 'react';
import Login from './Login';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [backgroundImage, setBackgroundImage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Utilisation d'une image d'arrière-plan pertinente sur le thème de l'informatique
    setBackgroundImage('https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80');
  }, []);

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden relative">
      {/* Image d'arrière-plan avec overlay */}
      <div 
        className="fixed inset-0 z-0 h-200 w-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 to-indigo-900/90"></div>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10">
        {/* Navbar avec logo Club Informatique */}
        <nav className="bg-white/10 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  {/* Logo Club Informatique */}
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold mr-3 shadow-lg border-2 border-white">
                    <div className="text-xs font-mono text-center leading-tight">
                      CLUB<br/>INFO
                    </div>
                  </div>
                  <span className="text-xl font-bold text-white">
                    Club Informatique IUT
                  </span>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-8">
                <a href="#" className="text-white/90 hover:text-white transition-colors duration-300 font-medium">
                  Accueil
                </a>
                <a href="#" className="text-white/90 hover:text-white transition-colors duration-300 font-medium">
                  À propos
                </a>
                <a href="#" className="text-white/90 hover:text-white transition-colors duration-300 font-medium">
                  Contact
                </a>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-5 py-2 rounded-lg shadow-md transform hover:scale-105 transition-all duration-300 font-medium"
                >
                  Connexion
                </button>
              </div>
              <div className="md:hidden flex items-center">
                <button className="text-white p-2 rounded-md hover:bg-white/10 transition-colors">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section avec images intégrées */}
        <section className="relative flex flex-col items-center justify-center text-center py-28 px-6">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-72 h-72 bg-blue-400/20 rounded-full mix-blend-soft-light filter blur-xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-400/20 rounded-full mix-blend-soft-light filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-purple-400/20 rounded-full mix-blend-soft-light filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
          </div>
          
          <div className="relative z-10 max-w-3xl">
            {/* Logo principal centré */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/30">
                <div className="text-4xl font-bold text-white font-mono tracking-wider mb-2">
                  C L U B
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent font-mono tracking-wider">
                  INFORMATIQUE
                </div>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Bienvenue sur le <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Portail Étudiant</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              Accédez à votre espace personnel pour gérer vos informations, consulter vos notes et suivre votre emploi du temps.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-3 px-8 rounded-lg text-lg shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                </svg>
                Se connecter
              </button>
              <button className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white font-medium py-3 px-8 rounded-lg text-lg shadow-md transform hover:scale-105 transition-all duration-300">
                En savoir plus
              </button>
            </div>
          </div>
        </section>

        {/* Features avec illustrations */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Fonctionnalités principales</h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">Découvrez toutes les possibilités offertes par notre plateforme</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Gestion des étudiants",
                desc: "Ajoutez, modifiez et consultez les profils étudiants en toute simplicité.",
                icon: (
                  <div className="relative">
                    {/* Illustration étudiant avec ordinateur */}
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center text-white">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      PHP
                    </div>
                  </div>
                ),
                color: "bg-blue-500/20 text-blue-400",
              },
              {
                title: "Notes et évaluations",
                desc: "Suivez les performances académiques et générez des bulletins détaillés.",
                icon: (
                  <div className="relative">
                    {/* Illustration code et programmation */}
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center text-white">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-mono">
                      HTML
                    </div>
                  </div>
                ),
                color: "bg-indigo-500/20 text-indigo-400",
              },
              {
                title: "Emploi du temps",
                desc: "Planifiez et visualisez les emplois du temps des classes et enseignants.",
                icon: (
                  <div className="relative">
                    {/* Illustration développement web */}
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center text-white">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-mono">
                      CSS
                    </div>
                  </div>
                ),
                color: "bg-purple-500/20 text-purple-400",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 border border-white/20"
              >
                <div className={`h-20 w-20 rounded-lg ${feature.color} flex items-center justify-center mb-6 mx-auto`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white text-center">{feature.title}</h3>
                <p className="text-white/80 leading-relaxed text-center">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section Technologies */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Technologies Maîtrisées</h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">Les outils et langages que nos étudiants apprennent et utilisent</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "HTML5", color: "bg-orange-500", icon: "🌐" },
              { name: "CSS3", color: "bg-blue-500", icon: "🎨" },
              { name: "PHP", color: "bg-purple-500", icon: "⚡" },
              { name: "JavaScript", color: "bg-yellow-500", icon: "📱" },
            ].map((tech, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20 hover:transform hover:scale-105 transition-all duration-300">
                <div className={`w-16 h-16 ${tech.color} rounded-full flex items-center justify-center text-2xl mx-auto mb-4`}>
                  {tech.icon}
                </div>
                <h3 className="text-lg font-semibold text-white">{tech.name}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Section avec illustration étudiante */}
        <section className="bg-gradient-to-r from-blue-600/80 to-indigo-700/80 py-16 text-white backdrop-blur-md relative overflow-hidden">
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2 opacity-20">
            {/* Illustration étudiante stylisée */}
            <div className="text-8xl">👨‍💻</div>
          </div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { number: "500+", label: "Étudiants Actifs" },
                { number: "24", label: "Formations" },
                { number: "50+", label: "Projets Réalisés" },
                { number: "100%", label: "Satisfaction" },
              ].map((stat, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-3xl md:text-4xl font-bold mb-2">{stat.number}</span>
                  <span className="text-blue-100/80">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials avec avatars étudiants */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Témoignages de la Communauté</h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">Ce que nos étudiants et enseignants en disent</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                text: "Le club informatique m'a permis de maîtriser le développement web et de réaliser des projets concrets. Une expérience incroyable !",
                author: "Jean K.",
                role: "Étudiant en Développement Web",
                avatar: "👨‍🎓"
              },
              {
                text: "En tant qu'enseignant, je constate l'évolution remarquable des étudiants grâce aux activités du club. Leur motivation est inspirante.",
                author: "Prof. Diallo",
                role: "Enseignant en Informatique",
                avatar: "👨‍🏫"
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-md border border-white/20 hover:transform hover:scale-105 transition-all duration-300">
                <div className="flex items-start mb-6">
                  <div className="text-4xl mr-4">{testimonial.avatar}</div>
                  <p className="text-white/90 text-lg italic flex-1">{" "}{testimonial.text}</p>
                </div>
                <div className="flex items-center">
                  <div>
                    <div className="font-medium text-white">{testimonial.author}</div>
                    <div className="text-white/60 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section finale */}
        <section className="max-w-7xl mx-auto px-6 py-16 mb-20">
          <div className="bg-gradient-to-r from-blue-600/90 to-indigo-700/90 rounded-2xl p-10 md:p-16 text-center text-white shadow-xl backdrop-blur-md relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 text-8xl opacity-20">💻</div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 relative z-10">Prêt à rejoindre l'aventure ?</h2>
            <p className="text-blue-100/90 max-w-2xl mx-auto mb-8 text-lg relative z-10">
              Rejoignez le Club Informatique et développez vos compétences dans un environnement stimulant.
            </p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-white text-blue-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg text-lg shadow-lg transform hover:scale-105 transition-all duration-300 relative z-10"
            >
              Commencer maintenant
            </button>
          </div>
        </section>

        {/* Footer avec coordonnées */}
        <footer className="bg-gray-900/80 text-white py-12 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Club Informatique IUT</h3>
                <p className="text-gray-400">Département informatique de l'IUT - Formation d'excellence</p>
                <div className="mt-4 flex space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">C</div>
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">I</div>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Liens rapides</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Accueil</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Activités</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Projets</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Ressources</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Tutoriels</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Forum</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Contact</h4>
                <address className="not-italic text-gray-400">
                  <p>Institut Universitaire de Technologie</p>
                  <p>Ndogbong, Douala Cameroun</p>
                  <p className="mt-2">contact@clubinfosiut.com</p>
                  <p>+237 680 58 56 71</p>
                </address>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; {new Date().getFullYear()} Club Informatique IUT. Tous droits réservés.</p>
            </div>
          </div>
        </footer>

        {/* Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex  justify-center bg-black/70 backdrop-blur-sm animate-fadeIn w-auto"

          >
            {/* <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md transform scale-95 animate-slideUp">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Connexion Étudiant</h3>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              </div> */}
            <Login onLoginSuccess={handleLoginSuccess} setShowLoginModal={setShowLoginModal} />
          </div>
        )}

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(10px) scale(0.95); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out forwards;
          }
          .animate-slideUp {
            animation: slideUp 0.3s ease-out forwards;
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Home;