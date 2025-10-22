import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

// --- INTERFACES (Aucun changement) ---
interface Project {
  id: number;
  title: string;
  description: string;
  created_at: string;
  submission?: {
    id: number;
    file_path: string;
    created_at: string;
    evaluation?: {
      id: number;
      grade: number;
      comment: string;
      created_at: string;
    }
  }
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
  grade?: number;
  evaluation_comment?: string;
  evaluated_at?: string;
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
            if (parsedUser.student_id) {
              studentToFetchId = parsedUser.student_id;
            } else {
              setError('Profil étudiant incomplet. Veuillez vous reconnecter.');
              setLoading(false);
              return;
            }
          } else {
            setError('Profil utilisateur non trouvé. Veuillez vous reconnecter.');
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

      } catch (err: any) { 
        console.error("Erreur lors de la récupération des données:", err.message || err.toString());
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
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

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

      setUploadMessage("Projet soumis avec succès ! Veuillez rafraîchir pour voir le statut à jour.");
      setSelectedFile(null);
      setSelectedProjectId(null);
      
      setTimeout(() => {
        setUploadMessage(null);
      }, 5000); 

    } catch (err: any) {
      const errorMessage = (err.response?.data?.message || err.message || "Une erreur inconnue est survenue lors de la soumission.");
      console.error("Erreur lors de la soumission du projet:", err);
      setUploadMessage(`Erreur de soumission: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  // --- RENDU DES ÉTATS DE CHARGEMENT ET ERREUR (inchangés) ---

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 font-semibold">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
          <span className="text-6xl mb-4">😞</span>
          <p className="text-xl text-red-500 font-bold mb-4">{error}</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
          <span className="text-6xl mb-4">👤</span>
          <p className="text-xl text-gray-500 font-semibold">
            Aucun profil d'étudiant disponible.
          </p>
        </div>
      </div>
    );
  }

  // Formatage de la date d'inscription
  const dateString = student.created_at;
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  const formattedDate = new Intl.DateTimeFormat('fr-FR', options).format(date);

  // --- RENDU PRINCIPAL DU TABLEAU DE BORD (Restylisé) ---

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Header : titre et informations étudiantes intégrées */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sm:p-8 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-700 mb-1">
                🎓 Tableau de bord étudiant
              </h1>
              <p className="text-gray-500 text-lg mb-6">Bienvenue, **{student.user.name}** !</p>

              {/* Informations d'un seul bloc sans "palettes" */}
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4">
                
                {/* Matricule */}
                <div className="flex flex-col">
                  <dt className="text-sm font-medium text-indigo-600">Matricule</dt>
                  <dd className="mt-1 text-lg font-semibold text-indigo-900">{student.student_id}</dd>
                </div>

                {/* Classe */}
                <div className="flex flex-col">
                  <dt className="text-sm font-medium text-purple-600">Classe</dt>
                  <dd className="mt-1 text-lg font-semibold text-purple-900">{student.class_group}</dd>
                </div>
                
                {/* Email */}
                <div className="flex flex-col">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-lg text-gray-900 truncate">{student.user.email}</dd>
                </div>

                {/* Inscrit le */}
                <div className="flex flex-col">
                  <dt className="text-sm font-medium text-gray-500">Inscrit le</dt>
                  <dd className="mt-1 text-lg text-gray-900">{formattedDate}</dd>
                </div>
              </dl>
            </div>

            {/* Bouton de Déconnexion */}
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all duration-200 shadow-md flex items-center gap-2 self-start lg:self-center"
              disabled={loadingLogOut}
            >
              <svg className={`h-5 w-5 ${loadingLogOut ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {loadingLogOut ? (
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                )}
              </svg>
              {loadingLogOut ? "Déconnexion..." : "Déconnexion"}
            </button>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Soumission de projet */}
          <div className="xl:col-span-1 bg-white rounded-xl shadow-lg p-6 h-fit sticky top-10 border border-blue-100">
            <h3 className="text-2xl font-bold text-blue-700 mb-5 flex items-center gap-2 border-b pb-3">
              <span>📤</span>
              Soumettre un projet
            </h3>

            {uploadMessage && (
              <div className={`mb-5 p-4 rounded-lg text-sm font-medium ${uploadMessage.includes('succès')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                {uploadMessage}
              </div>
            )}

            <form onSubmit={handleProjectSubmit} className="space-y-5">
              <div>
                <label htmlFor="projectSelect" className="block text-sm font-medium text-gray-700 mb-2">
                  📁 Projet à soumettre
                </label>
                <select
                  id="projectSelect"
                  value={selectedProjectId || ''}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                <label htmlFor="projectFile" className="block text-sm font-medium text-gray-700 mb-2">
                  📎 Fichier du projet (max 10Mo)
                </label>
                <input
                  id="projectFile"
                  type="file"
                  onChange={handleFileChange}
                  className="w-full block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-lg p-1.5"
                  required
                  accept=".pdf,.doc,.docx,.zip" 
                />
                <p className="mt-1 text-xs text-gray-500">Formats acceptés: PDF, DOCX, ZIP, etc.</p>
              </div>

              <button
                type="submit"
                disabled={uploading || !selectedProjectId || !selectedFile}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 transform shadow-md flex items-center justify-center gap-2 ${uploading || !selectedProjectId || !selectedFile
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
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
          
          {/* Projets assignés */}
          <div className="xl:col-span-2 bg-white rounded-xl shadow-lg p-6 border border-indigo-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-3">
              <span>📋</span>
              Mes Projets Assignés
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium ml-2">
                {student.projects.length}
              </span>
            </h2>

            {student.projects.length > 0 ? (
              <div className="space-y-6">
                {student.projects.map((project) => (
                  <div
                    key={project.id}
                    // Suppression de l'arrière-plan coloré (bg-gray-50) et mise en avant par une simple bordure
                    className="rounded-xl p-5 border border-gray-200 hover:border-indigo-400 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    {/* --- HEADER & STATUTS --- */}
                    <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                          <span className="text-indigo-600">📘</span> {project.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-snug">
                          {project.description}
                        </p>
                      </div>

                      {/* Statuts */}
                      <div className="flex flex-col items-end gap-1.5 min-w-[120px]">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            project.submission
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                            }`}
                        >
                          {project.submission ? "Soumis ✅" : "Pas soumis ❌"}
                        </span>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            project.submission?.evaluation
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                            }`}
                        >
                          {project.submission?.evaluation ? "Évalué 📊" : "En attente ⏳"}
                        </span>
                      </div>
                    </div>

                    {/* --- INFOS DETAILLEES (Structure minimaliste, sans palettes) --- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm text-gray-700 pt-2">
                      
                      {/* Note & Commentaire (Mise en évidence de la note) */}
                      <div className="space-y-2">
                        <dl>
                            <dt className="font-semibold text-gray-800">🎯 Note :</dt>
                            <dd className={`text-xl font-extrabold ${
                                project.submission?.evaluation?.grade ? "text-indigo-600" : "text-gray-400"
                              }`}>
                              {project.submission?.evaluation?.grade !== undefined ? `${project.submission.evaluation.grade}/20` : "Non noté"}
                            </dd>
                        </dl>
                        <dl>
                            <dt className="font-semibold text-gray-800">💬 Commentaire :</dt>
                            <dd className={`mt-0.5 text-sm ${
                                project.submission?.evaluation?.comment ? "text-gray-700 italic" : "text-gray-400"
                              }`}>
                              {project.submission?.evaluation?.comment || "Aucun commentaire"}
                            </dd>
                        </dl>
                      </div>

                      {/* Dates */}
                      <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-gray-200 sm:pl-8 pt-4 sm:pt-0">
                        <dl className="flex justify-between items-center">
                          <dt className="font-semibold text-gray-600">📤 Date de soumission :</dt>
                          <dd className="text-gray-600 font-medium">
                            {project.submission?.created_at
                              ? new Date(project.submission.created_at).toLocaleString("fr-FR", { day: '2-digit', month: 'short', year: 'numeric' })
                              : "N/A"}
                          </dd>
                        </dl>
                        <dl className="flex justify-between items-center">
                          <dt className="font-semibold text-gray-600">🧾 Date d'évaluation :</dt>
                          <dd className="text-gray-600 font-medium">
                            {project.submission?.evaluation?.created_at
                              ? new Date(project.submission.evaluation.created_at).toLocaleString("fr-FR", { day: '2-digit', month: 'short', year: 'numeric' })
                              : "N/A"}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <span className="text-5xl mb-3 block">📭</span>
                <p className="text-gray-500 text-lg font-medium">Aucun projet assigné pour le moment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;