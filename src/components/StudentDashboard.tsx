import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import PerformanceChart from './PerformanceChart'; // Importez le nouveau composant de graphique
// import ProjectChat from './ProjectChat';

// --- INTERFACES CORRIGÉES ---
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
      // La note est stockée comme string dans le backend, mais on la veut comme string ici pour éviter le parsing multiple.
      // Le composant de graphique s'occupera du parseFloat.
      grade: string;
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
  // Ajout de student_id qui est utilisé dans le localStorage pour l'auto-identification
  student_id?: string;
}

interface Student {
  id: number;
  student_id: string;
  class_group: string;
  user: StudentUser;
  projects: Project[];
  // Suppression des propriétés grade, evaluation_comment, evaluated_at car elles sont déjà dans `projects` et calculées/agrégées
  created_at: string;
}

// --- COMPOSANT PRINCIPAL ---
const StudentDashboard: React.FC = () => {
  const { studentId: paramStudentId } = useParams<{ studentId?: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat state : messages par projet
  const [chatMessages, setChatMessages] = useState<{ [projectId: number]: string[] }>({});
  const [chatInput, setChatInput] = useState<{ [projectId: number]: string }>({});


  // State for project submission form
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [loadingLogOut, setLoadingLogOut] = useState<boolean>(false);

  //ouverture et fermeture de la discussion
  const [openChats, setOpenChats] = useState<Record<number, boolean>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
  const [loadingSend, setLoadingSend]=useState<boolean>(false)


  /**
   * Fonction de récupération des données de l'étudiant. 
   * Utilisée dans useEffect et après une soumission.
   * Utilisation de useCallback pour une meilleure gestion des dépendances dans useEffect.
   */

  // Récupérer messages
  const fetchMessages = async (projectId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const res = await api.get(`/projects/${projectId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // On stocke directement tous les messages du projet
      setChatMessages(prev => ({
        ...prev,
        [projectId]: res.data, // chaque item contient project_id, message, user_name, created_at
      }));

      console.log("Messages du projet", projectId, res.data);
    } catch (error) {
      console.error("Erreur lors du chargement des messages :", error);
    }
  };


  // Envoyer message
  const handleChatSend = async (projectId: number) => {
    if (!chatInput[projectId]) return;
    setLoadingSend(true)
  const token = localStorage.getItem('authToken');

  const res = await api.post(
    '/projects/messages',
    {
      project_id: projectId,
      message: chatInput[projectId],
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  // Ajouter le message dans la bonne structure
  setChatMessages(prev => ({
    ...prev,
    [projectId]: {
      ...(prev[projectId] || { messages: [], students: [] }),
      messages: [
        ...(prev[projectId]?.messages || []),
        res.data.message, // le nouveau message
      ],
    },
  }));

  setChatInput(prev => ({ ...prev, [projectId]: '' }));
  fetchMessages(projectId); // rafraîchir les messages
  setLoadingSend(false)
};

  


  const fetchStudentData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');

    if (!token) {
      setError("Authentification requise. Veuillez vous connecter.");
      setLoading(false);
      navigate('/', { replace: true });
      return;
    }

    try {
      let studentToFetchId: string | undefined = paramStudentId;
      if (!paramStudentId) {
        const user = localStorage.getItem('authUser');

        if (user) {
          try {
            const parsedUser: StudentUser = JSON.parse(user);
            if (parsedUser.student_id) {
              studentToFetchId = parsedUser.student_id;
            } else {
              setError('Profil utilisateur trouvé mais sans identifiant étudiant. Veuillez vous reconnecter.');
              setLoading(false);
              return;
            }
          } catch (jsonError) {
            // Ajout de la gestion d'erreur si le JSON est mal formé
            console.error("Erreur de parsing 'authUser' :", jsonError);
            setError('Erreur de lecture du profil utilisateur. Veuillez vous reconnecter.');
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
      // --- Récupérer les messages pour chaque projet ---
      response.data.student.projects.forEach(p => fetchMessages(p.id));

    } catch (err: any) {
      console.error("Erreur lors de la récupération des données:", err.message || err.toString());
      // Ajout d'une gestion d'erreur 404/403 plus spécifique
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        setError('Session expirée ou non autorisée. Veuillez vous reconnecter.');
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        navigate('/', { replace: true });
      } else {
        setError('Échec du chargement des informations de l\'étudiant.');
      }
    } finally {
      setLoading(false);
    }
  }, [paramStudentId, navigate]); // Dépendances pour useCallback

  useEffect(() => {
    fetchStudentData();
    // fetchMessages()
  }, [fetchStudentData]); // Dépendance à fetchStudentData (encapsulée dans useCallback)

  useEffect(() => {
    Object.keys(openChats).forEach(id => {
      const projectId = Number(id);
      if (openChats[projectId]) {
        setUnreadCounts(prev => ({ ...prev, [projectId]: 0 }));
      }
    });
  }, [openChats]);

  useEffect(() => {
    Object.keys(chatMessages).forEach(id => {
      const projectId = Number(id);
      // si un nouveau message arrive et que le chat est fermé
      if (!openChats[projectId]) {
        setUnreadCounts(prev => ({
          ...prev,
          [projectId]: (prev[projectId] || 0) + 1,
        }));
      }
    });
  }, [chatMessages]);

  // ... (handleLogout inchangé)

  const handleLogout = async () => {
    setLoadingLogOut(true);
    try {
      await api.post('/logout', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
    } catch (error) {
      console.error("Erreur de déconnexion (tentative tout de même) :", error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      setLoadingLogOut(false);
      navigate('/', { replace: true });
    }
  };

  // ... (handleFileChange inchangé)
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


  /**
   * Soumission du projet. 
   * Simplification du nettoyage des states et appel direct à fetchStudentData().
   */
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

      setUploadMessage("Projet soumis avec succès ! Les données vont se rafraîchir.");

      // On rafraîchit immédiatement après la soumission réussie
      await fetchStudentData();

      // Nettoyage des states de formulaire après rafraîchissement
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
      // Supprimé l'appel à fetchStudentData ici car il est fait en cas de succès et en cas d'erreur de soumission il n'est pas nécessaire de rafraichir.
    }
  };


  // --- LOGIQUE DE CALCUL DE LA MOYENNE ET DES DONNÉES DU GRAPHIQUE OPTIMISÉE ---
  const getStudentPerformance = () => {
    // Filtrer les projets qui ont une soumission ET une évaluation avec une note définie
    const gradedProjects = student?.projects.filter(p =>
      p.submission?.evaluation?.grade != null && p.submission.evaluation.grade !== "") || [];

    if (gradedProjects.length === 0) {
      return { averageGrade: "N/A", projectsData: [] };
    }

    let totalGrade = 0;
    const projectsData = gradedProjects.map(p => {
      // Utilisation de Number() pour parser la note string en nombre, ou 0 si le parsing échoue (même si l'on filtre déjà)
      const grade = Number(p.submission!.evaluation!.grade);
      totalGrade += grade;
      return {
        title: p.title,
        grade: grade,
        // Assurez-vous que l'objet date est triable par le composant de graphique
        submissionDate: p.submission!.created_at
      };
    });

    const averageGrade = (totalGrade / gradedProjects.length).toFixed(2);
    return { averageGrade, projectsData };
  };

  // --- RENDU DES ÉTATS DE CHARGEMENT ET ERREUR (inchangés, car ils sont bien faits) ---
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

  const { averageGrade, projectsData } = getStudentPerformance();

  // Formatage de la date d'inscription (Code inchangé, car correct)
  const dateString = student.created_at;
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: 'numeric'
  };
  const formattedDate = new Intl.DateTimeFormat('fr-FR', options).format(date);

  // --- RENDU PRINCIPAL DU TABLEAU DE BORD (inchangé, car déjà très bon) ---
  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10">
      <div className="max-w-7xl mx-auto">

        {/* --------------------------------------------------------------------------------
    HEADER : Tableau de bord étudiant
    -------------------------------------------------------------------------------- */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 mb-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">

            {/* 1. Titre et Informations Principales */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-1">
                Tableau de bord étudiant 🎓
              </h1>
              <p className="text-xl text-gray-600 truncate">
                Bienvenue, <span className="font-extrabold text-indigo-700">{student.user.name}</span>
              </p>
            </div>

            {/* 2. Bouton de Déconnexion (Alignement vertical au centre) */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-base transition-colors duration-300 hover:bg-red-700 shadow-lg shrink-0"
              disabled={loadingLogOut}
            >
              <svg
                className={`h-5 w-5 ${loadingLogOut ? 'animate-spin' : ''}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true" // Amélioration accessibilité
              >
                {loadingLogOut ? (
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                )}
              </svg>
              {loadingLogOut ? "Déconnexion..." : "Déconnexion"}
            </button>
          </div>

          {/* --------------------------------------------------------------------------
        3. Carte d'informations (Métrique)
        Utilisation d'une grille réactive pour un affichage propre
        -------------------------------------------------------------------------- */}
          <dl className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">

            {/* A. Matricule (Clé d'identification) */}
            <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50">
              <dt className="text-xs font-medium text-indigo-600 flex items-center gap-1">
                <span className="h-4 w-4 text-indigo-500">#</span> Matricule
              </dt>
              <dd className="mt-1 text-lg font-bold text-indigo-900 truncate">
                {student.student_id}
              </dd>
            </div>

            {/* B. Classe (Groupe) */}
            <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50">
              <dt className="text-xs font-medium text-indigo-600 flex items-center gap-1">
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-3H17v3zM6 18H2v-3h4v3zm8 0h-4v-3h4v3zm-4 3v-3H6v3h4zM8 9H4V6h4v3zm10 0h-4V6h4v3zm-4 3v-3h4v3h-4zM8 15h4v-3H8v3z" /></svg>
                Classe
              </dt>
              <dd className="mt-1 text-lg font-bold text-indigo-900 truncate">
                {student.class_group}
              </dd>
            </div>

            {/* C. Email (Informations de contact) */}
            <div className="col-span-2 md:col-span-1 lg:col-span-1 p-3 rounded-xl border border-gray-200 bg-gray-50">
              <dt className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-2 7a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v8z" /></svg>
                Email
              </dt>
              <dd className="mt-1 text-lg text-gray-900 truncate">
                {student.user.email}
              </dd>
            </div>

            {/* D. MOYENNE GENERALE (Mise en évidence) */}
            <div className="col-span-2 lg:col-span-1 p-3 rounded-xl border-4 border-yellow-300 bg-yellow-50 order-first lg:order-none">
              <dt className="text-sm font-semibold text-yellow-800 flex items-center gap-2">
                <svg className="h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c1.657 0 3 .895 3 2s-1.343 2-3 2v2m0-4c-1.657 0-3 .895-3 2s1.343 2 3 2v2m-6-2h12M4 12h16" /></svg>
                MOYENNE GÉNÉRALE
              </dt>
              <dd className="mt-1 text-3xl font-extrabold text-yellow-900">
                {averageGrade} / 20
              </dd>
            </div>

            {/* E. Inscrit le (Date) */}
            <div className="col-span-2 md:col-span-1 lg:col-span-1 p-3 rounded-xl border border-green-200 bg-green-50">
              <dt className="text-xs font-medium text-green-600 flex items-center gap-1">
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-4 4V3M3 8h18M5 12h14M5 16h14M5 20h14" /></svg>
                Inscription
              </dt>
              <dd className="mt-1 text-lg font-medium text-green-900">
                {formattedDate.split(',')[1]?.trim() || formattedDate}
              </dd>
            </div>
          </dl>
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
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${project.submission
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                        >
                          {project.submission ? "Soumis ✅" : "Pas soumis ❌"}
                        </span>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${project.submission?.evaluation
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
                          <dd className={`text-xl font-extrabold ${project.submission?.evaluation?.grade ? "text-indigo-600" : "text-gray-400"
                            }`}>
                            {project.submission?.evaluation?.grade !== undefined ? `${project.submission.evaluation.grade}/20` : "Non noté"}
                          </dd>
                        </dl>
                        <dl>
                          <dt className="font-semibold text-gray-800">💬 Commentaire :</dt>
                          <dd className={`mt-0.5 text-sm ${project.submission?.evaluation?.comment ? "text-gray-700 italic" : "text-gray-400"
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
                              ? new Date(project.submission.created_at).toLocaleString("fr-FR", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
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
                    {/* 💬 Chat du projet */}
                    <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200 mt-6">
  {/* --- En-tête du bloc --- */}
  <div
    className="flex justify-between items-center cursor-pointer select-none"
    onClick={() =>
      setOpenChats(prev => ({ ...prev, [project.id]: !prev[project.id] }))
    }
    
  >
    <h3 className="text-lg font-bold mb-3">💬 Chat du projet</h3>

    {/* Indicateur de messages non lus */}
    {/* {unreadCounts[project.id] > 0 && !openChats[project.id] && (
      <span className="bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
        {unreadCounts[project.id]}
      </span>
    )} */}
    <button 
    className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition"
    onClick={(e)=>{
      e.stopPropagation();
      fetchMessages(project.id)
    }}
    >Refresh</button>
    <div style={{width:10, height:10, borderRadius:50, backgroundColor:'green', opacity:.6}}>
      
    </div>
  </div>

  {/* --- Contenu du chat (repliable) --- */}
  {openChats[project.id] && (
    <>
      {/* Liste des étudiants du projet */}
      {chatMessages[project.id]?.students?.length > 0 && (
        <div
        >
        <div className="mb-3 border border-gray-200 bg-gray-50 p-3 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">👥 Membres du projet :</h4>
          <ul className="text-sm text-gray-600 flex flex-wrap gap-2">
            {chatMessages[project.id].students.map((stdent, i) => (
              <li
                key={i}
                className="bg-gray-200 px-2 py-1 rounded-full text-xs font-medium text-gray-800"
              >
                {stdent.user_name==student.user.name?"Vous":stdent.user_name}
              </li>
            ))}
          </ul>
  
        </div>
        </div>
      )}

      {/* Messages */}
      <div className="max-h-60 overflow-y-auto border p-3 rounded-lg bg-gray-50 mb-3 space-y-2">
        {(chatMessages[project.id]?.messages || []).map((msg, index) => {
          const currentUser = student.user.name;
          const isOwnMessage = msg.user_name === currentUser;

          return (
            <div
              key={index}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] p-2 rounded-lg shadow-sm ${
                  isOwnMessage
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-900 rounded-bl-none'
                }`}
              >
                {!isOwnMessage && (
                  <div className="text-xs font-semibold text-gray-600 mb-1">
                    {msg.user_name}
                  </div>
                )}
                <div className="text-sm">{msg.message}</div>
                <div
                  className={`text-[10px] mt-1 ${
                    isOwnMessage
                      ? 'text-indigo-200 text-right'
                      : 'text-gray-500 text-left'
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Champ d’envoi */}
      <div className="flex gap-2">
        <input
          type="text"
          value={chatInput[project.id] || ''}
          onChange={e =>
            setChatInput(prev => ({ ...prev, [project.id]: e.target.value }))
          }
          placeholder="Écrire un message..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={() => handleChatSend(project.id)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          disabled={loadingSend}
          style={{
            opacity:loadingSend?.5:1
          }}
        >
         {loadingSend? "Envoies..":"Envoyer"}
        </button>
      </div>
    </>
  )}
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
        {/* Chat pour étudiant */}
        {/* <ProjectChat projectId={0}/> */}
        {/* GRAPHIQUE - Nouvelle Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            📈 Aperçu de la Performance
          </h2>
          {/* Intégration du composant PerformanceChart */}
          <PerformanceChart projectsData={projectsData} />
        </div>
        {/* FIN GRAPHIQUE */}
      </div>
    </div>
  );
};

export default StudentDashboard;