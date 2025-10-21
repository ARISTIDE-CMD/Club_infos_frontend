import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

interface Project {
  id: number;
  title: string;
  description: string;
}

interface StudentUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Student {
  id: number;
  student_id: string;
  class_group: string;
  user: StudentUser;
  projects: Project[];
  created_at: string;
}

const StudentDashboard: React.FC = () => {
  const { studentId: paramStudentId } = useParams<{ studentId?: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for project submission form
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [loadingLogOut, setLoadingLogOut] = useState<boolean>(false);

  useEffect(() => {
    const fetchStudentData = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');

      if (!token) {
        setError("Authentification requise. Veuillez vous connecter.");
        setLoading(false);
        navigate('/');
        return;
      }

      try {
        let studentToFetchId: string | undefined = paramStudentId;
        if (!paramStudentId) {
          const user = localStorage.getItem('authUser');
          if (user) {
            const parsedUser = JSON.parse(user);
            studentToFetchId = parsedUser.student_id;
          } else {
            setError('Profil étudiant non trouvé dans les données utilisateur. Veuillez vous reconnecter.');
            setLoading(false);
            return;
          }
        }

        if (!studentToFetchId) {
          setError('Aucun identifiant d\'étudiant fourni.');
          setLoading(false);
          return;
        }
        
        const response = await api.get<{ student: Student }>(`/students/${studentToFetchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setStudent(response.data.student);
        
      } catch (err) {
        if(err instanceof Error)
        console.error("Erreur lors de la récupération des données:", err.message || err);
        if (paramStudentId) {
          setError('Échec du chargement des informations de l\'étudiant.');
        } else {
          setError('Échec du chargement de votre profil. Veuillez vous reconnecter.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [paramStudentId, navigate]);

  const handleLogout = async () => {
    setLoadingLogOut(true);
    try {
      await api.post('/logout', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      setLoadingLogOut(false);
      navigate('/', { replace: true });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      
      if (file.size > MAX_FILE_SIZE) {
        setUploadMessage("La taille du fichier ne doit pas dépasser 10 Mo.");
        setSelectedFile(null);
        e.target.value = '';
      } else {
        setSelectedFile(file);
        setUploadMessage(null);
      }
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setUploadMessage(null);

    if (!selectedProjectId || !selectedFile) {
      setUploadMessage("Veuillez sélectionner un projet et un fichier.");
      setUploading(false);
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      setUploadMessage("Non autorisé. Veuillez vous connecter.");
      setUploading(false);
      return;
    }
    
    const formData = new FormData();
    formData.append('project_id', selectedProjectId);
    formData.append('file', selectedFile);

    try {
      await api.post('/submissions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      setUploadMessage("Projet soumis avec succès !");
      setSelectedFile(null);
      
    } catch (err) {
      if(err instanceof Error){
      console.error("Erreur lors de la soumission du projet:", err);
      setUploadMessage(`Erreur de soumission: ${err.message || err.message}`);
    }} finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 font-semibold">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md">
          <span className="text-6xl mb-4">😞</span>
          <p className="text-xl text-red-500 font-bold mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md">
          <span className="text-6xl mb-4">👤</span>
          <p className="text-xl text-gray-500 font-semibold">
            Aucun profil d'étudiant disponible.
          </p>
        </div>
      </div>
    );
  }
  
  const dateString = student.created_at;
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  const formattedDate = new Intl.DateTimeFormat('fr-FR', options).format(date);
      
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header avec informations intégrées */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              <h1 className="text-4xl font-extrabold text-indigo-700 mb-2">
                🎓 Tableau de bord étudiant
              </h1>
              <p className="text-gray-600 text-lg mb-6">Bienvenue dans votre espace personnel</p>
              
              {/* Informations personnelles intégrées */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <span>👤</span>
                    <span className="font-semibold">Nom complet</span>
                  </div>
                  <p className="text-gray-800 font-medium text-lg">{student.user.name}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <span>📧</span>
                    <span className="font-semibold">Email</span>
                  </div>
                  <p className="text-gray-800 font-medium text-lg">{student.user.email}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <span>🏫</span>
                    <span className="font-semibold">Statut</span>
                  </div>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {student.user.role === 'student' ? 'Étudiant(e)' : 'Inconnu'}
                  </span>
                </div>
              </div>
              
              {/* Informations académiques intégrées */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <span>🔢</span>
                    <span className="font-semibold">Matricule</span>
                  </div>
                  <p className="text-blue-800 font-bold text-lg font-mono">{student.student_id}</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-purple-600 mb-2">
                    <span>👥</span>
                    <span className="font-semibold">Classe</span>
                  </div>
                  <p className="text-purple-800 font-bold text-lg">{student.class_group}</p>
                </div>
                
                <div className="bg-indigo-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-indigo-600 mb-2">
                    <span>📅</span>
                    <span className="font-semibold">Inscrit le</span>
                  </div>
                  <p className="text-indigo-800 font-medium">{formattedDate}</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 self-start"
            >
              <span>🚪</span>
              {loadingLogOut ? "Déconnexion..." : "Déconnexion"}
            </button>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Projets assignés */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📋</span>
              Projets assignés
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                {student.projects.length}
              </span>
            </h2>
            
            {student.projects.length > 0 ? (
              <div className="space-y-4">
                {student.projects.map((project) => (
                  <div key={project.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-indigo-300 transition-all duration-200">
                    <h3 className="font-semibold text-lg text-gray-800 mb-2">{project.title}</h3>
                    <p className="text-gray-600">{project.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-6xl mb-4">📭</span>
                <p className="text-gray-500 text-lg">Aucun projet assigné pour le moment.</p>
              </div>
            )}
          </div>

          {/* Soumission de projet */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-2xl font-bold text-blue-800 mb-4 flex items-center gap-2">
              <span>📤</span>
              Soumettre un projet
            </h3>
            
            {uploadMessage && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${
                uploadMessage.includes('succès') 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {uploadMessage}
              </div>
            )}

            <form onSubmit={handleProjectSubmit} className="space-y-6">
              <div>
                <a href="https://www.flaticon.com/free-icons/man-avatar" title="man avatar icons">Man avatar icons created by Loka Design - Flaticon</a>
                <label htmlFor="projectSelect" className="block text-sm font-semibold text-gray-700 mb-2">
                  📁 Sélectionner le projet à soumettre
                </label>
                <select
                  id="projectSelect"
                  value={selectedProjectId || ''}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="" disabled>-- Choisissez un projet --</option>
                  {student.projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="projectFile" className="block text-sm font-semibold text-gray-700 mb-2">
                  📎 Fichier du projet (PDF, Word, etc. - max 10Mo)
                </label>
                <input
                  id="projectFile"
                  type="file"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={uploading}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
                  uploading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                }`}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Soumission en cours...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    Soumettre le projet
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;