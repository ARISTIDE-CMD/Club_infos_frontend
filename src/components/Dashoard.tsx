import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import './Dash.css'
import EvaluationForm from "./SubmissionForm";
import AdminForum from "./AdminForum";
import MeritChart from "./Performance";

// Interfaces pour la structure des données
interface Student {
    id: number;
    student_id: string;
    class_group: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
}
type stude = {
    id: number;
    last_name: string;
    first_name: string
}

interface Project {
    id: number;
    title: string;
    description: string;
    students: Student[];
    created_at: string;
}

interface Student {
    id: number;
    first_name: string;
    last_name: string;
}

// interface Project {
//   title: string;
//   description: string;
//   students?: Student[];
// }

interface Submission {
    id: number;
    file_path: string;
    evaluation?: {
        grade: number | null;
        comment: string | null;
    };
    filename: string;
    created_at: string;
    grade?: number;
    evaluation_comment?: string;
    evaluated_at?: string;
    project?: Project;
    student?: Student;
    archiv: boolean
}

interface SubmissionItemProps {
    submission: Submission;
    projectCreatedAt: Date;
    submissionCreatedAt: Date;
    durationDays: number;
    durationHours: number;
    durationsMinut: number;
}


const Dashboard: React.FC = () => {
    const [dataSet, setDataSet] = useState<any[]>([{}])
    const navigate = useNavigate();
    const [students, setStudents] = useState<Student[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [archive, setArchive] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [loadingProject, setLoadingProjet] = useState<boolean>(true)
    const [loadingSoumission, setLoadingSoumission] = useState<boolean>(false)
    const [message, setMessage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isCreateStudentModalOpen, setIsCreateStudentModalOpen] = useState(false)
    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
    const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [itemTypeToDelete, setItemTypeToDelete] = useState<'student' | 'project' | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
    const [update, setUpdate] = useState<boolean>(false)
    const [submissionToArchive, setSubmissionToArchive] = useState<Submission[]>([]);
    const [isLoadingLogout, setIsloadinLogout] = useState<boolean>(false)
    const [filtered, setFiltered] = useState<Submission[]>([])
    const [grade, setGrade] = useState<number>();
    const [loadindDelete,setLoadingDelete]=useState<boolean>(false)
    // const [comment, setComment] = useState<string>(submissions.evaluation?.comment ?? '');
    const [formDataStudent, setFormDataStudent] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        student_id: "",
        class_group: "L1 Info",
    });

    const [chartData, setChartData] = useState<any[]>([]);
    const [loadingChart, setLoadingChart] = useState(true);
    const [error, setError] = useState("");

    const data = [
        { name: "Jan", valeur: 400 },
        { name: "Fév", valeur: 300 },
        { name: "Mar", valeur: 500 },
        { name: "Avr", valeur: 200 },
        { name: "Mai", valeur: 700 },
    ];
    // const filterData=dataSet.filter((value,_)=>{
    //     value.submission.
    // })


    // const [nom,setNom]=useState<string>('')
    // const [matricule,setMatricule]=useState<string>('')
    const [formDataProject, setFormDataProject] = useState({
        title: "",
        description: "",
        student_ids: [] as number[],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [view, setView] = useState<'students' | 'projects' | 'results' | 'archive' | 'performance' | 'forum'>('students');
    const [download, setDownload] = useState<boolean>(false);
    // États pour gérer l'évaluation
    const [evaluations, setEvaluations] = useState({});
    const [evaluationLoading, setEvaluationLoading] = useState(false);


    // Fonction pour charger le graphe des étudiants depuis l'API
    const fetchChartData = async () => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                setError("Non autorisé. Veuillez vous connecter.");
                setLoading(false);
                return;
            }

            // 🔸 Récupération des données
            const response = await api.get("/students", {
                headers: { Authorization: `Bearer ${token}` },
            });

            const students = response.data.students || [];

            // 🔸 Transformation des données pour le graphe
            const formattedData: React.SetStateAction<any[]> = [];

            students.forEach((student) => {
                student.projects?.forEach((project) => {
                    const evaluation = project.submission?.evaluation;
                    if (evaluation) {
                        formattedData.push({
                            etudiant: `${student.first_name} ${student.last_name}`,
                            projet: project.title,
                            note: parseFloat(evaluation.grade),
                        });
                    }
                });
            });

            setChartData(formattedData);
            console.log("✅ Données du graphe :", formattedData);
        } catch (err) {
            console.error("Erreur lors du chargement du graphe :", err);
            setError("Erreur lors du chargement du graphe.");
        } finally {
            setLoading(false);
        }
    };


    // Fonction pour gérer l'évaluation d'un projet
    const handleEvaluation = async (submissionId: number, grade: number, comment: string) => {
        try {
            setEvaluationLoading(true);
            const token = localStorage.getItem("authToken");

            if (!token) {
                setMessage("Non autorisé. Veuillez vous connecter.");
                // Timer pour effacer le message après 2 secondes
                let compt = 0;
                const intervall = setInterval(() => {
                    compt++;
                    if (compt === 2) {
                        setMessage('');
                        clearInterval(intervall);
                    }
                }, 1000);
                return;
            }

            const response = await api.post(`/submissions/${submissionId}/evaluate`, {
                grade: grade,
                comment: comment
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status == 200) {
                setMessage("Évaluation enregistrée avec succès !");
                console.log("Evaluation enregistrée ...!", response.data)
                // Mettre à jour la soumission avec l'évaluation
                setSubmissions(prev => prev.map(sub =>
                    sub.id === submissionId
                        ? { ...sub, ...response.data.evaluation }
                        : sub
                ));
                console.log("finally " + response.data.evaluation.grade);

            }

            // Timer pour effacer le message après 2 secondes
            let compt = 0;
            const intervall = setInterval(() => {
                compt++;
                if (compt === 2) {
                    setMessage('');
                    clearInterval(intervall);
                }
            }, 1000);

        } catch (error) {
            console.error("Erreur lors de l'évaluation:", error);
            setMessage("Erreur lors de l'enregistrement de l'évaluation.");

            let compt = 0;
            const intervall = setInterval(() => {
                compt++;
                if (compt === 2) {
                    setMessage('');
                    clearInterval(intervall);
                }
            }, 1000);
        } finally {
            setEvaluationLoading(false);
            fetchSubmissions()
        }
    };
    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                setMessage("Non autorisé. Veuillez vous connecter.");
                let compt = 0
                const intervall = setInterval(() => {
                    compt++;
                    if (compt == 2) {
                        setMessage('')
                        clearInterval(intervall)
                    }
                }, 1000)
                // setLoading(false);
                return;
            }
            const response = await api.get("/students", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStudents(response.data.students);
            console.log("Liste des étudiants ", response.data.students);
            console.log("Liste des projets ", response.data.students[0].projects);
            setDataSet(response.data.students[0].projects)

        } catch (error) {
            console.error("Erreur lors du chargement des étudiants:", error);
            setMessage("Erreur lors du chargement des étudiants.");
            setStudents([error as unknown as Student]);
            let compt = 0
            const intervall = setInterval(() => {
                compt++;
                if (compt == 2) {
                    setMessage('')
                    clearInterval(intervall)
                }
            }, 1000)

        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                setMessage("Non autorisé. Veuillez vous connecter.");
                let compt = 0
                const intervall = setInterval(() => {
                    compt++;
                    if (compt == 2) {
                        setMessage('')
                        clearInterval(intervall)
                    }
                }, 1000)
                // setLoading(false);
                return;
            }
            const response = await api.get("/projects", {
                headers: { Authorization: `Bearer ${token}` },
            });
            // const results = await api.get("/results", {
            //     headers: { Authorization: `Bearer ${token}` },
            // });
            // console.log("résultat des projets", results);

            setProjects(response.data.projects);
        } catch (error) {
            console.error("Erreur lors du chargement des projets:", error);
            setMessage("Erreur lors du chargement des projets.");
            let compt = 0
            const intervall = setInterval(() => {
                compt++;
                if (compt == 2) {
                    setMessage('')
                    clearInterval(intervall)
                }
            }, 1000)
            setProjects([]);
        } finally {
            setLoading(false)
            setLoadingProjet(false)
        }
    };
    const fetchSubmissions = async () => {
        try {
            // Afficher le loading
            // setLoading(true);

            // Appel API pour récupérer les soumissions
            const response = await api.get('/results'); // Adaptez l'URL selon votre route

            if (response.data.success) {
                // Mettre à jour l'état avec les soumissions récupérées
                setSubmissions(response.data.submissions);
                console.log("submissions ", response.data.submissions);
            } else {
                console.error('Erreur lors de la récupération des soumissions:', response.data.message);
                // Optionnel : afficher un message d'erreur à l'utilisateur
            }
        } catch (error) {
            console.error('Erreur API:', error);
            setSubmissions([]);
            // Gestion des erreurs (afficher un message, etc.)
        } finally {
            // setLoading(false);
            setLoadingSoumission(false);
        }
    };
    const archivage = (id) => {
        console.log("items", id)
        setArchive(!archive)
        // const filt=submissions.filter(submission=>submission.id!==id)
        setFiltered(prev =>
            prev.includes(id)
                ? prev.filter(f => f !== id) // retire si déjà actif
                : [...prev, id])
        // console.log("filtre",filt)
        const archived = submissions.filter(submission => submission.id === id)
        setSubmissionToArchive(archived)
        console.log("sub", submissionToArchive.length)
    }
    const filtre = submissions
    useEffect(() => {
        fetchStudents();
        if (view === 'results' || view === 'archive')
            fetchSubmissions();
        else if (view === 'projects')
            fetchProjects();
        // else if (view === 'performance')
        //     fetchChartData();
    }, [view]);

    const handleLogout = async () => {
        setIsloadinLogout(true)
        try {
            await api.post(
                "/logout",
                {},
                { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } }
            );
            localStorage.removeItem("authToken");
            setIsloadinLogout(false)
            navigate("/", { state: { loggedOut: true } });
        } catch (error) {
            console.error("Erreur de déconnexion:", error);
        }
    };

    const handleCreateStudent = () => {
        setIsCreateStudentModalOpen(true);
    };

    const handleDeleteStudent = (studentId: number) => {
        setItemToDelete(studentId);
        setItemTypeToDelete('student');
        setIsDeleteModalOpen(true);
    };

    const handleDeleteProject = (projectId: number) => {
        setItemToDelete(projectId);
        setItemTypeToDelete('project');
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        setLoadingDelete(ture)
        if (itemTypeToDelete === 'student') {
            await confirmDeleteStudent();
        } else if (itemTypeToDelete === 'project') {
            await confirmDeleteProject();
        }
        setLoadingDelete(false)
    };

    const confirmDeleteStudent = async () => {
        if (itemToDelete === null) return;
        try {
            const token = localStorage.getItem("authToken");
            await api.delete(`/admin/students/${itemToDelete}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessage("Étudiant supprimé avec succès.");
            let compt = 0
            const intervall = setInterval(() => {
                compt++;
                if (compt == 2) {
                    setMessage('')
                    clearInterval(intervall)
                }
            }, 1000)
            setStudents(students.filter((s) => s.id !== itemToDelete));
        } catch (error) {
            console.error("Erreur suppression:", error);
            setMessage("Erreur lors de la suppression.");
            let compt = 0
            const intervall = setInterval(() => {
                compt++;
                if (compt == 2) {
                    setMessage('')
                    clearInterval(intervall)
                }
            }, 1000)
        } finally {
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
            setItemTypeToDelete(null);
        }
    };

    const confirmDeleteProject = async () => {
        if (itemToDelete === null) return;
        try {
            const token = localStorage.getItem("authToken");
            await api.delete(`/projects/${itemToDelete}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessage("Projet supprimé avec succès.");
            let compt = 0
            const intervall = setInterval(() => {
                compt++;
                if (compt == 2) {
                    setMessage('')
                    clearInterval(intervall)
                }
            }, 1000)
            setProjects(projects.filter((p) => p.id !== itemToDelete));
        } catch (error) {
            console.error("Erreur suppression:", error);
            setMessage("Erreur lors de la suppression du projet.");
            let compt = 0
            const intervall = setInterval(() => {
                compt++;
                if (compt == 2) {
                    setMessage('')
                    clearInterval(intervall)
                }
            }, 1000)
        } finally {
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
            setItemTypeToDelete(null);
        }
    };

    const handleEdit = (student: Student) => {
        const [firstName, ...rest] = student.user.name.split(" ");
        const lastName = rest.join(" ");
        setStudentToEdit(student);
        setFormDataStudent({
            ...formDataStudent,
            first_name: firstName,
            last_name: lastName,
            student_id: student.student_id,
            class_group: student.class_group,
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdate(true);
        if (!studentToEdit) return;

        try {
            const token = localStorage.getItem("authToken");
            await api.put(`/admin/students/${studentToEdit.id}`, formDataStudent, {
                headers: { Authorization: `Bearer ${token}` },
            });
            let compt = 0
            setMessage("✅ Étudiant mis à jour avec succès.");
            setUpdate(false)
            const intervall = setInterval(() => {
                compt++;
                if (compt == 2) {
                    setMessage('')
                    clearInterval(intervall)
                }
            }, 1000)
            setIsEditModalOpen(false);
            setStudentToEdit(null);
            fetchStudents(); // Recharger la liste des étudiants
        } catch (error) {
            console.error("Erreur mise à jour:", error);
            setMessage("❌ Échec de la mise à jour.");
            let compt = 0
            const intervall = setInterval(() => {
                compt++;
                if (compt == 2) {
                    setMessage('')
                    clearInterval(intervall)
                }
            }, 1000)
        }
    };

    const handleCreateProject = () => {
        setIsCreateProjectModalOpen(true);
    };

    const handleEditProject = (project: Project) => {
        setProjectToEdit(project);
        setFormDataProject({
            title: project.title,
            description: project.description,
            student_ids: project.students.map(s => s.id)
        });
        setIsEditProjectModalOpen(true);
    };

    const handleProjectFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormDataProject({ ...formDataProject, [e.target.name]: e.target.value });
    };

    const handleStudentSelection = (studentId: number) => {
        setFormDataProject((prevData) => {
            const newStudentIds = prevData.student_ids.includes(studentId)
                ? prevData.student_ids.filter((id) => id !== studentId)
                : [...prevData.student_ids, studentId];
            return { ...prevData, student_ids: newStudentIds };
        });
    };

    const handleCreateProjectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("authToken");
            await api.post('/projects', formDataProject, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessage("Projet créé et assigné avec succès !");
            let compt = 0
            const intervall = setInterval(() => {
                compt++;
                if (compt == 2) {
                    setMessage('')
                    clearInterval(intervall)
                }
            }, 1000)
            setIsCreateProjectModalOpen(false);
            setFormDataProject({ title: "", description: "", student_ids: [] });
            fetchProjects(); // Recharger la liste des projets
        } catch (error) {
            console.error("Erreur lors de la création du projet:", error);
            setMessage("Erreur lors de la création du projet.");
            let compt = 0
            const intervall = setInterval(() => {
                compt++;
                if (compt == 2) {
                    setMessage('')
                    clearInterval(intervall)
                }
            }, 1000)
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectToEdit) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("authToken");
            await api.patch(`/projects/${projectToEdit.id}`, formDataProject, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessage("Projet mis à jour avec succès !");
            let compt = 0
            const intervall = setInterval(() => {
                compt++;
                if (compt == 2) {
                    setMessage('')
                    clearInterval(intervall)
                }
            }, 1000)
            setIsEditProjectModalOpen(false);
            setProjectToEdit(null);
            fetchProjects(); // Recharger la liste des projets
        } catch (error) {
            console.error("Erreur lors de la mise à jour du projet:", error);
            setMessage("Erreur lors de la mise à jour du projet.");
            let compt = 0
            const intervall = setInterval(() => {
                compt++;
                if (compt == 2) {
                    setMessage('')
                    clearInterval(intervall)
                }
            }, 1000)
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStudentFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormDataStudent({ ...formDataStudent, [e.target.name]: e.target.value });
    };

    const handleStudentFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("authToken");
            await api.post("/admin/students", formDataStudent, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessage("Étudiant ajouté avec succès.");
            let compt = 0
            const intervall = setInterval(() => {
                compt++;
                if (compt == 2) {
                    setMessage('')
                    clearInterval(intervall)
                }
            }, 1000)
            setFormDataStudent({
                first_name: "",
                last_name: "",
                email: "",
                password: "",
                student_id: "",
                class_group: "L1 Info",
            });
            setIsCreateStudentModalOpen(false);
            fetchStudents(); // Recharger la liste des étudiants
        } catch (error) {
            console.error("Erreur lors de l'ajout:", error);
            // if(error!=="AxiosError: Request failed with status code 422")
            // setMessage("Erreur lors de l'ajout de l'étudiant."+error);
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleDownload = async (filePath: string, title: string) => {
        setDownload(true)
        try {
            const token = localStorage.getItem('authToken');

            const response = await api.get(`/download/${encodeURIComponent(filePath)}`, {
                headers: { Authorization: `Bearer ${token}` }, // si tu veux sécuriser l’accès
                responseType: 'blob',
            });

            const filename = filePath.split('/').pop() || 'fichier.pdf';
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename); // ou le nom que tu veux donner au fichier
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erreur de téléchargement:', error);
        } finally {
            setDownload(false)
        }
    };


    const filteredStudents = students.filter(student =>
        student.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.class_group.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const SubmissionItem: React.FC<SubmissionItemProps> = ({ submission, projectCreatedAt, submissionCreatedAt, durationDays, durationHours, durationsMinut }) => {
        const [isExpanded, setIsExpanded] = useState(false);

        return (
            <div className="bg-white rounded-3xl  border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-3xl group">
                {/* En-tête avec fond dégradé - CLICKABLE */}
                <div
                    // Suppression du dégradé et utilisation d'un hover très léger
                    className="bg-white p-6 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex justify-between items-start gap-4">

                        {/* TITRE ET DESCRIPTION */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                                {/* Icône d'expansion remplacée par un SVG standard */}
                                <svg
                                    className={`w-4 h-4 text-gray-500 transform transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                >
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>

                                <h4 className="text-xl font-bold text-gray-800 truncate">
                                    {submission.project?.title || 'Projet sans titre'}
                                </h4>
                            </div>

                            <p className="text-gray-600 mt-1 ml-7 text-sm truncate">{submission.project?.description || 'Aucune description'}</p>
                        </div>

                        {/* NOTE (Reste colorée pour l'information sémantique, mais la palette est simplifiée) */}
                        {submission.evaluation?.grade !== undefined && ( // Utiliser !== undefined pour inclure la note 0
                            <div className="flex-shrink-0 flex items-center">
                                <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm ${submission.evaluation.grade >= 15 ? 'bg-green-50 text-green-700' :
                                    submission.evaluation.grade >= 10 ? 'bg-yellow-50 text-yellow-700' :
                                        'bg-red-50 text-red-700'
                                    }`}>
                                    {submission.evaluation?.grade}/20
                                </span>
                            </div>
                        )}
                    </div>

                    {/* INFORMATIONS RÉSUMÉES & BOUTON D'ACTION */}
                    <div className="mt-4 ml-7 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600 border-t border-gray-100 pt-3">

                        {/* Bloc d'informations */}
                        <div className='flex flex-wrap gap-x-6 gap-y-2'>
                            {/* Étudiant */}
                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                <span className='font-medium text-gray-800'>{submission.student?.first_name} {submission.student?.last_name}</span>
                            </div>

                            {/* Date de Soumission */}
                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <span className='text-gray-600'>Soumis le <span style={{ fontWeight: 'bold' }}>{submissionCreatedAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></span>
                            </div>

                            {/* Délai écoulé */}
                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <span className='text-gray-600'>Délai: <span style={{ fontWeight: 'bold' }}>{durationDays > 1 ? durationDays + "j" : ""} {durationHours > 1 ? durationHours + "h" : ''} {durationsMinut}m</span></span>
                            </div>
                        </div>
                        {/* Bouton Archiver/Désarchiver */}
                        <button
                            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${archive
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                            onClick={(e) => {
                                e.stopPropagation(); // Empêche l'expansion/rétraction de la ligne
                                archivage(submission.id);
                            }}
                        >
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8M9 17h6"></path></svg>
                                {archive ? 'Désarchiver' : 'Archiver'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Contenu détaillé - affiché seulement si expandé */}
                {isExpanded && (
                    <div className="p-6 space-y-6">
                        {/* Informations temporelles détaillées */}
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                    <span>📅</span>
                                    <span className="font-semibold">Création</span>
                                </div>
                                <p className="text-gray-800 font-medium">{projectCreatedAt.toLocaleDateString('fr-FR')}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                    <span>🕒</span>
                                    <span className="font-semibold">Soumission</span>
                                </div>
                                <p className="text-gray-800 font-medium">{submissionCreatedAt.toLocaleDateString('fr-FR')}</p>
                            </div>
                            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl">
                                <div className="flex items-center gap-2 text-blue-600 mb-1">
                                    <span>⏱️ </span>
                                    <span className="font-semibold">Durée</span>
                                </div>
                                <p className="text-blue-800 font-bold">{durationDays >= 1 ? durationDays + "j" : ""} {durationHours >= 1 ? durationHours + "h" : ""} {durationsMinut}m </p>
                            </div>
                        </div>

                        {/* Fichier et étudiant */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-white border border-gray-200 p-4 rounded-xl">
                                <div className="flex items-center gap-2 text-gray-700 mb-2">
                                    <span>📎</span>
                                    <span className="font-semibold">Fichier soumis</span>
                                </div>
                                <button
                                    onClick={() => {
                                        handleDownload(submission.file_path, submission.project?.title)
                                        console.log(submission.id, submission.file_path, submission.project?.title)
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                                // disabled={download}
                                // style={{
                                //     opacity:download? 0.5:1
                                // }}
                                >
                                    <span>⬇️</span>
                                    {/* {download? "Téléchargement...":"Télécharger le fichier"} */}
                                    Télécharger le fichier

                                </button>

                            </div>

                            {submission.student && (
                                <div className="bg-white border border-gray-200 p-4 rounded-xl">
                                    <div className="flex items-center gap-2 text-gray-700 mb-2">
                                        <span>👤</span>
                                        <span className="font-semibold">Soumis par</span>
                                    </div>
                                    <p className="text-green-600 font-semibold">
                                        {submission.student.first_name} {submission.student.last_name}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Étudiants associés au projet */}
                        {submission.project?.students && submission.project.students.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <div className="flex items-center gap-2 text-gray-700 mb-3">
                                    <span>👥</span>
                                    <span className="font-semibold">Équipe projet ({submission.project.students.length})</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {submission.project.students.map((student: stude) => (
                                        <span
                                            key={student.id}
                                            className="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium transition-all duration-200 hover:bg-purple-100 hover:border-purple-300 hover:text-purple-800"
                                        >
                                            {student.first_name} {student.last_name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Section d'évaluation */}
                        <EvaluationForm
                            submissionId={submission.id}
                            onEvaluate={handleEvaluation}
                            loading={evaluationLoading}
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex min-h-screen bg-gray-100 font-sans"
            style={{
                // overflow
            }}
        >
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 text-white flex flex-col p-4 sticky top-0 h-screen overflow-y-auto shadow-xl">

                {/* LOGO & TITRE */}
                <div className="px-4 py-4 text-2xl font-extrabold border-b border-gray-700/50">
    <div className="flex items-center gap-3">
        {/* Icône SVG représentant le code/développement (Chevrons pour les balises) */}
        <svg 
            className="w-7 h-7 text-indigo-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Balises (Code) */}
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        
        {/* Texte du Club Informatique */}
        <span className="text-white tracking-wider">
            Club <span className="text-indigo-400">Informatique</span>
        </span>
    </div>
</div>

                {/* NAVIGATION PRINCIPALE */}
                <div className="flex-1 mt-8 space-y-2">

                    {/* Fonction pour le style actif (Active/Hover Style Function) */}
                    {/* J'utilise une simple bordure latérale et un fond subtil pour le statut actif */}
                    {[
                        {
                            key: 'students', label: 'Dashboard', icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-2v2m-4-2v2m-2-6h10a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z"></path>
                                </svg>
                            )
                        },
                        {
                            key: 'projects', label: 'Projets', icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                                </svg>
                            )
                        },
                        {
                            key: 'results', label: 'Dépôts', icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6h6m-6 0h-2M18 18a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6h-2m-2 0h-6m6 0h2"></path>
                                </svg>
                            )
                        },
                        {
                            key: 'performance', label: 'Performances', icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                </svg>
                            )
                        },
                        {
                            key: 'forum', label: 'Forum', icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z"
                                    />
                                </svg>
                            )
                        },
                        {
                            key: 'archive', label: 'Archives', icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                                </svg>
                            )
                        },

                    ].map(({ key, label, icon }) => (
                        <button
                            key={key}
                            onClick={() => setView(key)}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-4 text-sm font-medium transition-all duration-200 
                    ${view === key
                                    // Style actif : Bordure à gauche + fond bleu très léger
                                    ? 'bg-indigo-900 text-white border-l-4 border-indigo-400'
                                    // Style normal : Hover subtil
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }`}
                        >
                            {icon}
                            <span className="font-semibold">{label}</span>
                        </button>
                    ))}
                </div>

                {/* FOOTER : Statut et Déconnexion */}
                <div className="mt-auto pt-6 border-t border-gray-700/50">

                    {/* Statut utilisateur */}
                    <div className="flex items-center gap-3 px-4 py-2 text-sm mb-3">
                        <span className="h-2 w-2 bg-green-400 rounded-full"></span>
                        <span className="text-gray-400">Connecté en tant que <span className='font-semibold text-white'>Admin</span></span>
                    </div>

                    {/* Bouton de Déconnexion */}
                    <button
                        onClick={handleLogout}
                        disabled={isLoadingLogout}
                        className="w-full text-left px-4 py-3 rounded-lg flex items-center gap-4 text-sm font-medium transition-all duration-200 text-red-300 hover:bg-red-700/20 hover:text-red-300"
                    >
                        <svg className={`w-5 h-5 ${isLoadingLogout ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                        <span className="font-semibold">
                            {!isLoadingLogout ? 'Déconnexion' : 'Déconnexion...'}
                        </span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 l-20" style={{ left: 20 }}>
                            {view === 'students' ? "Tableau de bord Étudiants" : ""}
                            {view === 'projects' ? "Tableau de bord Projets" : ""}
                            {view === 'results' ? "Tableau de résutats des projets" : ""}
                        </h1>
                        <p className="text-gray-500">
                            {view === 'students' ? "Gestion des étudiants inscrits" : ""}
                            {view === 'results' ? 'Correction des projets des étudiants' : ''}
                            {view === 'projects' ? 'Gestion des projets de groupe' : ''}
                            {/* {view == 'forum'? 'Cette fonctionnalité est en cours de développement':''} */}

                        </p>
                    </div>
                    <div className="flex gap-3 mt-4 md:mt-0">
                        {view === 'students' && (
                            <button
                                onClick={handleCreateStudent}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition font-semibold flex items-center gap-2"
                            >
                                {/* SVG : Utilisateur avec un signe Plus */}
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                                Ajouter un étudiant
                            </button>
                        )}
                        {view === 'projects' && (
                            <button
                                onClick={handleCreateProject}
                                // J'ai harmonisé la couleur de survol avec l'indigo pour plus de cohérence, mais vous pouvez garder le vert.
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition font-semibold flex items-center gap-2"
                            >
                                {/* SVG : Dossier/Document avec un signe Plus */}
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                </svg>
                                Créer un projet
                            </button>
                        )}
                    </div>
                </header>

                {message && (
                    <div className="mb-4 p-3 rounded bg-green-100 text-green-700 font-medium">
                        {message}
                    </div>
                )}
                {loading && (
                    <p className="text-center text-gray-500">Chargement...</p>
                )}

                {/* Vue des projets rendus */}
                {view === 'archive' && (
                    <div>
                        {loading ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                                    <p className="text-lg text-gray-600">Chargement des projets archivés...</p>
                                </div>
                            </div>
                        ) : submissions && submissions.length > 0 ? (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h3 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3 mb-2">
                                        <span className="text-4xl">📤</span>
                                        Projets archivés
                                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-lg">
                                            {submissions.length}
                                        </span>
                                    </h3>
                                    <p className="text-gray-600">Gestion et évaluation des projets soumis par les étudiants</p>
                                </div>

                                {/* Liste des projets rendus */}
                                <div className="grid gap-6">
                                    {filtre
                                        .sort((a, b) => {
                                            const dateA = new Date(a.project?.created_at ?? 0).getTime();
                                            const dateB = new Date(b.project?.created_at ?? 0).getTime();
                                            return dateA - dateB; // du plus ancien au plus récent
                                        })
                                        .map(submission => {
                                            // Calcul de la durée entre création du projet et soumission
                                            const projectCreatedAt = new Date(submission.project?.created_at ?? "")
                                            const submissionCreatedAt = new Date(submission.created_at);
                                            const durationMs = new Date(submissionCreatedAt).getTime() - new Date(projectCreatedAt).getTime();

                                            const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
                                            const durationHours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                            // CORRECTION APPORTÉE : on utilise le modulo sur l'heure (1000 * 60 * 60)
                                            const durationsMinut = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

                                            return (
                                                <SubmissionItem
                                                    key={submission.id}
                                                    submission={submission}
                                                    projectCreatedAt={projectCreatedAt}
                                                    submissionCreatedAt={submissionCreatedAt}
                                                    durationDays={durationDays}
                                                    durationHours={durationHours}
                                                    durationsMinut={durationsMinut}
                                                />
                                            );
                                        })}
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center items-center py-20">
                                <div className="text-center">
                                    <span className="text-8xl mb-4">📭</span>
                                    <h3 className="text-2xl font-bold text-gray-600 mb-2">Aucun projet rendu</h3>
                                    <p className="text-gray-500">Les projets soumis par les étudiants apparaîtront ici.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {view === 'results' && (
                    <div>
                        {loadingSoumission ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                                    <p className="text-lg text-gray-600">Chargement des projets rendus...</p>
                                </div>
                            </div>
                        ) : filtre && filtre.length > 0 ? (
                            <div className="space-y-6" >
                                <div className="text-center">
                                    <h3 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3 mb-2">
                                        <span className="text-4xl">📤</span>
                                        Projets Déposés
                                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-lg">
                                            {submissions.length}
                                        </span>
                                    </h3>
                                    <p className="text-gray-600">Gestion et évaluation des projets soumis par les étudiants</p>
                                </div>

                                {/* Liste des projets rendus */}
                                <div className="grid gap-6">
                                    {submissions.map(submission => {
                                        // Calcul de la durée entre création du projet et soumission
                                        const projectCreatedAt = new Date(submission.project?.created_at ?? "")
                                        const submissionCreatedAt = new Date(submission.created_at);
                                        const durationMs = new Date(submissionCreatedAt).getTime() - new Date(projectCreatedAt).getTime();

                                        const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
                                        const durationHours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                        // CORRECTION APPORTÉE : on utilise le modulo sur l'heure (1000 * 60 * 60)
                                        const durationsMinut = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

                                        return (
                                            <SubmissionItem
                                                key={submission.id}
                                                submission={submission}
                                                projectCreatedAt={projectCreatedAt}
                                                submissionCreatedAt={submissionCreatedAt}
                                                durationDays={durationDays}
                                                durationHours={durationHours}
                                                durationsMinut={durationsMinut}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center items-center py-20">
                                <div className="text-center">
                                    <span className="text-8xl mb-4">📭</span>
                                    <h3 className="text-2xl font-bold text-gray-600 mb-2">Aucun projet rendu</h3>
                                    <p className="text-gray-500">Les projets soumis par les étudiants apparaîtront ici.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {/* Vue des étudiants */}
                {view === 'students' && !loading && (
                    <>
                        <div className="mb-8">
                            {/* BARRE DE RECHERCHE : Style minimaliste, centrée sur l'icône SVG */}
                            <div className="relative">
                                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                <input
                                    type="text"
                                    placeholder="Rechercher un étudiant par nom, matricule ou classe..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    // Simplification des classes: moins d'ombre, plus de focus clair
                                    className="w-full px-5 py-3 pl-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-200 text-base shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="bg-white shadow-lg rounded-xl overflowX-hidden border border-gray-100 transition-shadow duration-300">

                            {/* EN-TÊTE : Couleur de fond unie très claire, pas de dégradé prononcé */}
                            <div className="p-6 bg-green-50/50 border-b border-gray-200">
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                    {/* Icône SVG professionnelle */}
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20v-2c0-.523-.197-1.037-.563-1.424M17 20a2 2 0 01-2-2v-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 01-2 2h4l-2 2h8m-9.172-2.172a1 1 0 010-1.414m2.828 0a1 1 0 010 1.414m2.828 0a1 1 0 010 1.414M7 11A6 6 0 1019 11A6 6 0 007 11z"></path></svg>
                                    Gestion des Étudiants
                                </h2>
                                <p className="text-gray-500 text-sm mt-1">Liste complète des étudiants inscrits et leurs informations clés.</p>
                            </div>

                            {/* CORPS DU TABLEAU */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">

                                    {/* TÊTE DE TABLEAU : Fond uni pour la clarté */}
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="py-3.5 px-6 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs border-b border-gray-200">
                                                Prénom
                                            </th>
                                            <th className="py-3.5 px-6 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs border-b border-gray-200">
                                                Nom
                                            </th>
                                            <th className="py-3.5 px-6 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs border-b border-gray-200">
                                                Matricule
                                            </th>
                                            <th className="py-3.5 px-6 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs border-b border-gray-200">
                                                Classe
                                            </th>
                                            <th className="py-3.5 px-6 text-center font-semibold text-gray-600 uppercase tracking-wider text-xs border-b border-gray-200">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {filteredStudents.length > 0 ? (
                                            filteredStudents
                                                // La fonction de tri (sort) semble trier une variable par elle-même (var1 - var2),
                                                // j'ai conservé la structure mais je vous conseille de la revoir pour trier par nom (e.g. var1.localeCompare(var2))
                                                .sort((a, b) => {
                                                    // Logique de tri à revoir : actuellement trie une variable par elle-même
                                                    const var1 = a.first_name;
                                                    const var2 = a.first_name;
                                                    return var1 - var2
                                                })
                                                .map((s, index) => {
                                                    const [firstName, ...lastNameParts] = s.user.name.split(" ");
                                                    const lastName = lastNameParts.join(" ");
                                                    return (
                                                        <tr
                                                            key={s.id}
                                                            // Hover simple et élégant
                                                            className="hover:bg-green-50/20 transition-colors duration-200 group"
                                                            style={{ animationDelay: `${index * 50}ms` }}
                                                        >
                                                            <td className="py-4 px-6 font-medium text-gray-800">
                                                                {firstName}
                                                            </td>
                                                            <td className="py-4 px-6 text-gray-700">
                                                                {lastName}
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                                                                    {s.student_id}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                {/* Badge de classe avec couleur et fond coordonnés */}
                                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                                                    {s.class_group}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex justify-center space-x-2">
                                                                    {/* Bouton Modifier : Couleur primaire */}
                                                                    <button
                                                                        onClick={() => handleEdit(s)}
                                                                        className="p-2 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors duration-200 shadow-sm flex items-center gap-1"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-7-6l4 4m-4-4l-9 9m9-9l9 9"></path></svg>
                                                                        Modifier
                                                                    </button>

                                                                    {/* Bouton Supprimer : Couleur d'alerte sobre */}
                                                                    <button
                                                                        onClick={() => handleDeleteStudent(s.id)}
                                                                        className="p-2 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-800 transition-colors duration-200 shadow-sm flex items-center gap-1"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                                        Supprimer
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-16 text-center">
                                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                                        <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                                                        <p className="text-base font-medium mb-1 text-gray-500">Aucun étudiant trouvé</p>
                                                        <p className="text-gray-400 text-sm">
                                                            {searchQuery ? "Veuillez vérifier votre recherche." : "Ajoutez un étudiant pour commencer."}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* PIED DE TABLEAU : Information de décompte claire */}
                            {filteredStudents.length > 0 && (
                                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                                    <p className="text-xs text-gray-600 font-medium">
                                        Total des résultats : <span className="text-green-600 font-bold">{filteredStudents.length}</span> étudiant{filteredStudents.length > 1 ? 's' : ''} affiché{filteredStudents.length > 1 ? 's' : ''}
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Vue des projets */}
                {view === 'projects' && !loadingProject && (
                    <div className="bg-white  rounded-xl   transition-all duration-300 overflow-x-hidden">

                        {/* EN-TÊTE : Titre et description (Fond uni et élégant) */}
                        <div className="p-6 sm:p-8 border-b border-gray-200">
                            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                                {/* Icône de Dossier/Projet */}
                                <svg className="w-7 h-7 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"></path></svg>
                                <span className='text-indigo-800'>
                                    Gestion des Projets
                                </span>
                            </h2>
                            <p className="text-gray-500 mt-2">Visualisez et gérez l'ensemble des travaux du club.</p>
                        </div>

                        {/* CORPS DU TABLEAU */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-base">

                                {/* TÊTE DE TABLEAU : Fond uni, bordures nettes */}
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="py-3 px-6 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs border-b border-gray-200 w-[20%]">
                                            Nom du projet
                                        </th>
                                        <th className="py-3 px-6 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs border-b border-gray-200 w-[40%]">
                                            Description
                                        </th>
                                        <th className="py-3 px-6 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs border-b border-gray-200 w-[25%]">
                                            Étudiants assignés
                                        </th>
                                        <th className="py-3 px-6 text-center font-semibold text-gray-600 uppercase tracking-wider text-xs border-b border-gray-200 w-[15%]">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {projects.length > 0 ? (
                                        projects.map((project, index) => (
                                            <tr
                                                key={project.id}
                                                // Hover subtil avec une couleur de survol professionnelle
                                                className="hover:bg-indigo-50/50 transition-colors duration-200"
                                            >
                                                <td className="py-4 px-6 font-medium text-gray-900 group-hover:text-indigo-700">
                                                    {project.title}
                                                </td>
                                                <td className="py-4 px-6 text-gray-600 max-w-sm">
                                                    {/* Maintien du line-clamp pour une gestion propre de la description */}
                                                    <div className="line-clamp-2">
                                                        {project.description}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    {project.students.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {project.students.slice(0, 3).map((student) => (
                                                                <span
                                                                    key={student.id}
                                                                    // Badges plus sobres, mais bien contrastés
                                                                    className="px-3 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium"
                                                                >
                                                                    {student.user.name}
                                                                </span>
                                                            ))}
                                                            {project.students.length > 3 && (
                                                                <span className="px-3 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">
                                                                    +{project.students.length - 3}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-sm">Aucun assignement</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex justify-center space-x-2">
                                                        {/* Boutons d'action unifiés (sans dégradé exagéré) */}
                                                        <button
                                                            onClick={() => handleEditProject(project)}
                                                            className="p-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors duration-200 shadow-md flex items-center justify-center"
                                                            title="Éditer le projet"
                                                        >
                                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-7-6l4 4m-4-4l-9 9m9-9l9 9"></path></svg>
                                                            Modifier
                                                        </button>

                                                        <button
                                                            onClick={() => handleDeleteProject(project.id)}
                                                            className="p-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-800 transition-colors duration-200 shadow-md flex items-center justify-center"
                                                            title="Supprimer le projet"
                                                          
                                                        >
                                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                          Supprimer
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-20 text-center bg-gray-50">
                                                <div className="flex flex-col items-center justify-center text-gray-400">
                                                    <span className="text-7xl mb-4 text-indigo-300">💡</span>
                                                    <p className="text-xl font-bold mb-1 text-gray-600">Aucun projet trouvé.</p>
                                                    <p className="text-gray-500 text-lg">Créez le premier pour commencer !</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PIED DE TABLEAU : Information de décompte simple et claire */}
                        {projects.length > 0 && (
                            <div className="bg-gray-50 px-8 py-3 border-t border-gray-200">
                                <p className="text-sm text-gray-600 font-medium">
                                    <span className="text-indigo-600 font-bold">{projects.length}</span> projet{projects.length > 1 ? 's' : ''} géré{projects.length > 1 ? 's' : ''} au total.
                                </p>
                            </div>
                        )}
                    </div>
                )}
                {/* vue de performance des étudiants */}
                {view === 'performance' && (
                    <MeritChart />
                    //    <AdminForum />
                )}

                {view === 'forum' && (
                    <AdminForum />
                )}

                {/* Modal de confirmation de suppression */}
                <Transition appear show={isDeleteModalOpen} as={Fragment}>
    {/* Z-index élevé (z-50) pour s'assurer que la modale est au-dessus des autres éléments */}
    <Dialog as="div" className="relative z-50" onClose={() => setIsDeleteModalOpen(false)}>
        
        {/* Backdrop (Amélioré: sombre et flou) */}
        <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
        >
            {/* Arrière-plan plus sombre et flou pour un effet moderne */}
            <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
                
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                >
                    {/* Conteneur de la modale : max-w-sm (légèrement réduit) et padding p-6 */}
                    <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-2xl transition-all">
                        
                        {/* Contenu de la modale */}
                        <div className="sm:flex sm:items-start">
                            {/* Icône de danger (Placeholder, nécessite une librairie d'icônes) */}
                            <div className="mx-auto flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-12 sm:w-12">
                                {/* Remplacez par votre icône de suppression/alerte (ex: <XCircleIcon className="h-6 w-6 text-red-600" />) */}
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.857 3.375 2.75 3.375h13.71c1.892 0 3.614-1.875 2.748-3.375L15.378 3.84a1.725 1.725 0 00-3.003 0l-6.326 11.23a1.725 1.725 0 00-.001 1.764z" />
                                </svg>
                            </div>
                            
                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                                    Confirmer la suppression
                                </Dialog.Title>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        Voulez-vous vraiment supprimer {itemTypeToDelete === 'student' ? 'cet étudiant' : 'ce projet'} ? Cette action est irréversible et toutes les données associées seront perdues.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Boutons d'action (Positionnement modernisé : Annuler à gauche, Action à droite) */}
                        <div className="mt-6 flex justify-end space-x-3">
                            
                            {/* Bouton Annuler (Secondaire) */}
                            <button
                                type="button"
                                className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition duration-150 ease-in-out"
                                onClick={() => setIsDeleteModalOpen(false)}
                            >
                                Annuler
                            </button>
                            
                            {/* Bouton Supprimer (Principal - Couleur Rouge) */}
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={loadindDelete}
                                // Design de bouton plus large et plus pro
                                className={`inline-flex justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-semibold text-white shadow-md transition duration-150 ease-in-out ${loadindDelete
                                    ? 'bg-red-400 cursor-not-allowed' // État de chargement
                                    : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2' // État normal
                                }`}
                            >
                                {loadindDelete ? 'Suppression...' : 'Supprimer'}
                            </button>
                        </div>

                    </Dialog.Panel>
                </Transition.Child>
            </div>
        </div>
    </Dialog>
</Transition>

                {/* Modal de création d'étudiant */}
                <Transition appear show={isCreateStudentModalOpen} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={() => setIsCreateStudentModalOpen(false)}>
        {/* Backdrop (Assombrissement de l'arrière-plan) */}
        <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
        >
            {/* Utilisation d'un fond plus opaque et flou pour un effet professionnel */}
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
                {/* Contenu de la modale */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                >
                    <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-xl bg-white p-8 text-left align-middle shadow-2xl transition-all">
                        
                        {/* En-tête de la modale */}
                        <Dialog.Title as="h3" className="text-2xl font-extrabold leading-tight text-gray-900 mb-2">
                            Créer un nouvel étudiant
                        </Dialog.Title>
                        <p className="text-sm text-gray-500 mb-6">
                            Veuillez remplir tous les champs pour enregistrer un nouvel étudiant.
                        </p>

                        <form onSubmit={handleStudentFormSubmit} className="space-y-6">
                            
                            {/* Champs du formulaire */}
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                {/* Champ: Prénom */}
                                <div>
                                    {/* Utilisation de 'htmlFor' pour l'accessibilité */}
                                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">Prénom</label>
                                    <input
                                        id="first_name"
                                        type="text"
                                        name="first_name"
                                        value={formDataStudent.first_name}
                                        onChange={handleStudentFormChange}
                                        required
                                        placeholder="Ex: Jean"
                                        // Classes améliorées: plus de padding, border plus subtile, ombre au focus
                                        className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                                    />
                                </div>
                                
                                {/* Champ: Nom de famille */}
                                <div>
                                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Nom de famille</label>
                                    <input
                                        id="last_name"
                                        type="text"
                                        name="last_name"
                                        value={formDataStudent.last_name}
                                        onChange={handleStudentFormChange}
                                        required
                                        placeholder="Ex: Dupont"
                                        className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                                    />
                                </div>
                            </div>
                            
                            {/* Champ: Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={formDataStudent.email}
                                    onChange={handleStudentFormChange}
                                    required
                                    placeholder="Ex: jean.dupont@ecole.com"
                                    className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                                />
                            </div>
                            
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                {/* Champ: Mot de passe */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
                                    <input
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={formDataStudent.password}
                                        onChange={handleStudentFormChange}
                                        required
                                        placeholder="Minimum 8 caractères"
                                        className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                                    />
                                </div>

                                {/* Champ: Matricule étudiant */}
                                <div>
                                    <label htmlFor="student_id" className="block text-sm font-medium text-gray-700">Matricule étudiant</label>
                                    <input
                                        id="student_id"
                                        type="text"
                                        name="student_id"
                                        value={formDataStudent.student_id}
                                        onChange={handleStudentFormChange}
                                        required
                                        placeholder="Ex: S2025-4567"
                                        className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                                    />
                                </div>
                            </div>

                            
                            {/* Champ: Classe */}
                            <div>
                                <label htmlFor="class_group" className="block text-sm font-medium text-gray-700">Classe</label>
                                <select
                                    id="class_group"
                                    name="class_group"
                                    value={formDataStudent.class_group}
                                    onChange={handleStudentFormChange}
                                    required
                                    // Utilisation des mêmes classes de style pour l'uniformité
                                    className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                                >
                                    {/* Ajouter une option par défaut désactivée et non sélectionnable */}
                                    <option value="" disabled>Sélectionner une classe</option>
                                    <option value="L1 Info">L1 Info</option>
                                    <option value="L2 Info">L2 Info</option>
                                    <option value="L3 Info">L3 Info</option>
                                </select>
                            </div>
                            
                            {/* Boutons d'action */}
                            <div className="pt-4 flex justify-end space-x-3">
                                
                                {/* Bouton Annuler (Secondaire) */}
                                <button
                                    type="button"
                                    className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-150 ease-in-out"
                                    onClick={() => setIsCreateStudentModalOpen(false)}
                                >
                                    Annuler
                                </button>
                                
                                {/* Bouton Créer (Principal) */}
                                <button
                                    type="submit"
                                    // Classes de bouton principal améliorées: couleur plus profonde, ombre
                                    className={`px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition duration-150 ease-in-out shadow-md ${isSubmitting 
                                        ? 'bg-indigo-400 cursor-not-allowed' // État de soumission
                                        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2' // État normal
                                    }`}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Création en cours...' : 'Créer l’étudiant'}
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </Transition.Child>
            </div>
        </div>
    </Dialog>
</Transition>

                {/* Modal de modification d'étudiant */}
                <Transition appear show={isEditModalOpen} as={Fragment}>
    {/* Z-index plus élevé pour s'assurer que la modale est au-dessus des autres éléments */}
    <Dialog as="div" className="relative z-50" onClose={() => setIsEditModalOpen(false)}>
        
        {/* Backdrop (Assombrissement de l'arrière-plan avec flou) */}
        <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
        >
            {/* Utilisation d'un fond plus opaque et flou pour un effet professionnel */}
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
                
                {/* Contenu de la modale */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                >
                    {/* Conteneur de la modale : max-w-lg, p-8, rounded-xl, shadow-2xl */}
                    <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-xl bg-white p-8 text-left align-middle shadow-2xl transition-all">
                        
                        {/* En-tête de la modale */}
                        <Dialog.Title as="h3" className="text-2xl font-extrabold leading-tight text-gray-900 mb-2">
                            Modifier l'étudiant
                        </Dialog.Title>
                        <p className="text-sm text-gray-500 mb-6">
                            Mettez à jour les informations de l'étudiant.
                        </p>

                        <form onSubmit={handleUpdateStudent} className="space-y-6">
                            
                            {/* Grille pour les noms */}
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                {/* Champ: Prénom */}
                                <div>
                                    <label htmlFor="edit_first_name" className="block text-sm font-medium text-gray-700">Prénom</label>
                                    <input
                                        id="edit_first_name"
                                        type="text"
                                        name="first_name"
                                        value={formDataStudent.first_name}
                                        onChange={handleStudentFormChange}
                                        required
                                        className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                    />
                                </div>
                                
                                {/* Champ: Nom de famille */}
                                <div>
                                    <label htmlFor="edit_last_name" className="block text-sm font-medium text-gray-700">Nom de famille</label>
                                    <input
                                        id="edit_last_name"
                                        type="text"
                                        name="last_name"
                                        value={formDataStudent.last_name}
                                        onChange={handleStudentFormChange}
                                        required
                                        className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                    />
                                </div>
                            </div>
                            
                            {/* Grille pour Matricule et Classe */}
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                {/* Champ: Matricule étudiant */}
                                <div>
                                    <label htmlFor="edit_student_id" className="block text-sm font-medium text-gray-700">Matricule étudiant</label>
                                    <input
                                        id="edit_student_id"
                                        type="text"
                                        name="student_id"
                                        value={formDataStudent.student_id}
                                        onChange={handleStudentFormChange}
                                        required
                                        // Rendre le matricule en lecture seule s'il sert d'identifiant permanent.
                                        // Si vous voulez qu'il soit modifiable, retirez 'readOnly'
                                        readOnly
                                        className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed shadow-sm"
                                    />
                                </div>
                                
                                {/* Champ: Classe */}
                                <div>
                                    <label htmlFor="edit_class_group" className="block text-sm font-medium text-gray-700">Classe</label>
                                    <select
                                        id="edit_class_group"
                                        name="class_group"
                                        value={formDataStudent.class_group}
                                        onChange={handleStudentFormChange}
                                        required
                                        className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                    >
                                        <option value="" disabled>Sélectionner une classe</option>
                                        <option value="L1 Info">L1 Info</option>
                                        <option value="L2 Info">L2 Info</option>
                                        <option value="L3 Info">L3 Info</option>
                                    </select>
                                </div>
                            </div>

                            {/* Optionnel: Champ pour changer le mot de passe (souvent géré séparément) */}
                            {/* <div className="pt-2">
                                <label htmlFor="edit_password" className="block text-sm font-medium text-gray-700">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                                <input
                                    id="edit_password"
                                    type="password"
                                    name="password"
                                    // Pas de 'value' pour le mot de passe dans un formulaire de modification
                                    onChange={handleStudentFormChange}
                                    placeholder="Nouveau mot de passe (optionnel)"
                                    className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                />
                            </div>
                            */}

                            {/* Boutons d'action */}
                            <div className="pt-4 flex justify-end space-x-3">
                                
                                {/* Bouton Annuler (Secondaire) */}
                                <button
                                    type="button"
                                    className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-150 ease-in-out"
                                    onClick={() => setIsEditModalOpen(false)}
                                >
                                    Annuler
                                </button>
                                
                                {/* Bouton Mise à jour (Principal - Couleur Bleue pour l'action principale) */}
                                <button
                                    type="submit"
                                    className={`px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition duration-150 ease-in-out shadow-md ${update 
                                        ? 'bg-blue-400 cursor-not-allowed' // État de soumission
                                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2' // État normal
                                    }`}
                                    disabled={update}
                                >
                                    {update ? 'Mise à jour en cours...' : 'Sauvegarder les modifications'}
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </Transition.Child>
            </div>
        </div>
    </Dialog>
</Transition>

                {/* Modal de création de projet */}
                <Transition appear show={isCreateProjectModalOpen} as={Fragment}>
    {/* Z-index plus élevé pour s'assurer que la modale est au-dessus des autres éléments */}
    <Dialog as="div" className="relative z-50" onClose={() => setIsCreateProjectModalOpen(false)}>
        
        {/* Backdrop (Assombrissement de l'arrière-plan avec flou) */}
        <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
        >
            {/* Arrière-plan sombre et flou pour un effet professionnel */}
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
                
                {/* Contenu de la modale */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                >
                    {/* Conteneur de la modale : Largeur AUGMENTÉE à max-w-xl, padding maintenu à p-6 */}
                    <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-2xl transition-all">
                        
                        {/* En-tête de la modale */}
                        <Dialog.Title as="h3" className="text-2xl font-extrabold leading-tight text-gray-900 mb-1">
                            Créer un nouveau projet
                        </Dialog.Title>
                        <p className="text-sm text-gray-500 mb-5">
                            Définissez les détails du projet et assignez les étudiants concernés.
                        </p>

                        <form onSubmit={handleCreateProjectSubmit} className="space-y-4"> {/* Espace réduit à space-y-4 */}
                            
                            {/* Champ: Nom du projet (Titre) */}
                            <div>
                                <label htmlFor="project_title" className="block text-sm font-medium text-gray-700">Nom du projet</label>
                                <input
                                    id="project_title"
                                    type="text"
                                    name="title"
                                    value={formDataProject.title}
                                    onChange={handleProjectFormChange}
                                    required
                                    placeholder="Ex: Système de gestion scolaire v2"
                                    // Focus vert pour l'action de création
                                    className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 shadow-sm"
                                />
                            </div>
                            
                            {/* Champ: Description */}
                            <div>
                                <label htmlFor="project_description" className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    id="project_description"
                                    name="description"
                                    value={formDataProject.description}
                                    onChange={handleProjectFormChange}
                                    required
                                    rows={3} // Nombre de lignes réduit à 3 (Diminution de la hauteur)
                                    placeholder="Décrivez brièvement les objectifs et les livrables du projet."
                                    // Focus vert
                                    className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 shadow-sm"
                                />
                            </div>
                            
                            {/* Sélection des étudiants */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sélectionner les étudiants
                                    <span className="ml-2 text-xs font-normal text-gray-500">(Sélectionnez un ou plusieurs étudiants)</span>
                                </label>
                                {/* Hauteur réduite pour compacter la modale */}
                                <div className="h-36 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                                    {students.length > 0 ? (
                                        students.map(student => (
                                            <div key={student.id} className="flex items-center space-x-3 py-1.5 border-b last:border-b-0 border-gray-100">
                                                <input
                                                    type="checkbox"
                                                    id={`student-${student.id}`}
                                                    name="student_ids"
                                                    checked={formDataProject.student_ids.includes(student.id)}
                                                    onChange={() => handleStudentSelection(student.id)}
                                                    // Checkbox vert
                                                    className="h-4 w-4 rounded text-green-600 focus:ring-green-500 border-gray-300"
                                                />
                                                <label htmlFor={`student-${student.id}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                                                    {student.user.name} 
                                                    <span className="text-gray-500 font-normal ml-1">({student.student_id})</span>
                                                </label>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <p className="text-gray-500 text-sm">
                                                Aucun étudiant disponible. Veuillez en créer un d'abord.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Boutons d'action */}
                            <div className="pt-4 flex justify-end space-x-3">
                                
                                {/* Bouton Annuler (Secondaire) */}
                                <button
                                    type="button"
                                    className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-150 ease-in-out"
                                    onClick={() => setIsCreateProjectModalOpen(false)}
                                >
                                    Annuler
                                </button>
                                
                                {/* Bouton Créer (Principal - Couleur Verte) */}
                                <button
                                    type="submit"
                                    className={`px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition duration-150 ease-in-out shadow-md ${isSubmitting 
                                        ? 'bg-green-400 cursor-not-allowed' // État de soumission
                                        : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2' // État normal
                                    }`}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Création en cours...' : 'Créer le projet'}
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </Transition.Child>
            </div>
        </div>
    </Dialog>
</Transition>
                {/* Modal de modification de projet */}
                <Transition appear show={isEditProjectModalOpen} as={Fragment}>
    {/* Z-index élevé pour s'assurer que la modale est au-dessus des autres éléments */}
    <Dialog as="div" className="relative z-50" onClose={() => setIsEditProjectModalOpen(false)}>
        
        {/* Backdrop (Assombrissement de l'arrière-plan avec flou) */}
        <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
        >
            {/* Arrière-plan sombre et flou pour un effet professionnel */}
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
                
                {/* Contenu de la modale */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                >
                    {/* Conteneur de la modale : Largeur max conservée à max-w-lg, padding réduit à p-6 */}
                    <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-2xl transition-all">
                        
                        {/* En-tête de la modale */}
                        {/* Marge inférieure réduite pour compacter l'espace */}
                        <Dialog.Title as="h3" className="text-xl font-extrabold leading-tight text-gray-900 mb-1">
                            Modifier le projet
                        </Dialog.Title>
                        <p className="text-sm text-gray-500 mb-5">
                            Mettez à jour les détails du projet et gérez les étudiants assignés.
                        </p>

                        <form onSubmit={handleUpdateProject} className="space-y-4"> {/* Espace réduit à space-y-4 */}
                            
                            {/* Champ: Nom du projet (Titre) */}
                            <div>
                                <label htmlFor="edit_project_title" className="block text-sm font-medium text-gray-700">Nom du projet</label>
                                <input
                                    id="edit_project_title"
                                    type="text"
                                    name="title"
                                    value={formDataProject.title}
                                    onChange={handleProjectFormChange}
                                    required
                                    placeholder="Ex: Système de gestion scolaire v2"
                                    className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                />
                            </div>
                            
                            {/* Champ: Description */}
                            <div>
                                <label htmlFor="edit_project_description" className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    id="edit_project_description"
                                    name="description"
                                    value={formDataProject.description}
                                    onChange={handleProjectFormChange}
                                    required
                                    rows={3} // Nombre de lignes réduit à 3
                                    placeholder="Décrivez brièvement les objectifs et les livrables du projet."
                                    className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                />
                            </div>
                            
                            {/* Sélection des étudiants */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Étudiants assignés
                                    <span className="ml-2 text-xs font-normal text-gray-500">(Cochez ou décochez pour modifier la liste)</span>
                                </label>
                                {/* Hauteur réduite pour compacter la modale */}
                                <div className="h-32 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                                    {students.length > 0 ? (
                                        students.map(student => (
                                            <div key={student.id} className="flex items-center space-x-3 py-1.5 border-b last:border-b-0 border-gray-100">
                                                <input
                                                    type="checkbox"
                                                    id={`edit-student-${student.id}`}
                                                    name="student_ids"
                                                    checked={formDataProject.student_ids.includes(student.id)}
                                                    onChange={() => handleStudentSelection(student.id)}
                                                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                                />
                                                <label htmlFor={`edit-student-${student.id}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                                                    {student.user.name} 
                                                    <span className="text-gray-500 font-normal ml-1">({student.student_id})</span>
                                                </label>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <p className="text-gray-500 text-sm">
                                                Aucun étudiant disponible.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Boutons d'action */}
                            <div className="pt-4 flex justify-end space-x-3">
                                
                                {/* Bouton Annuler (Secondaire) */}
                                <button
                                    type="button"
                                    className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-150 ease-in-out"
                                    onClick={() => setIsEditProjectModalOpen(false)}
                                >
                                    Annuler
                                </button>
                                
                                {/* Bouton Mettre à jour (Principal - Couleur Bleue) */}
                                <button
                                    type="submit"
                                    className={`px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition duration-150 ease-in-out shadow-md ${isSubmitting 
                                        ? 'bg-blue-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                                    }`}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Mise à jour en cours...' : 'Sauvegarder les modifications'}
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </Transition.Child>
            </div>
        </div>
    </Dialog>
</Transition>
            </main>
        </div>
    );
};

export default Dashboard;
