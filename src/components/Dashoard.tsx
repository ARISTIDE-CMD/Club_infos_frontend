import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import './Dash.css'
import EvaluationForm from "./SubmissionForm";


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
}


const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState<Student[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [archive, setArchive] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
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
    const [isLoadingLogout, setIsloadinLogout]=useState<boolean>(false)
    const [filtered, setFiltered] = useState<Submission[]>([])
    const [grade, setGrade] = useState<number>();
    // const [comment, setComment] = useState<string>(submissions.evaluation?.comment ?? '');
    const [formDataStudent, setFormDataStudent] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        student_id: "",
        class_group: "L1 Info",
    });

    // const [nom,setNom]=useState<string>('')
    // const [matricule,setMatricule]=useState<string>('')
    const [formDataProject, setFormDataProject] = useState({
        title: "",
        description: "",
        student_ids: [] as number[],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [view, setView] = useState<'students' | 'projects' | 'results' | 'archive'>('students');
    // États pour gérer l'évaluation
    const [evaluations, setEvaluations] = useState({});
    const [evaluationLoading, setEvaluationLoading] = useState(false);

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

            if (response.data.success) {
                setMessage("Évaluation enregistrée avec succès !");
                console.log("Evaluation enregistrée ...!")
                // Mettre à jour la soumission avec l'évaluation
                setSubmissions(prev => prev.map(sub =>
                    sub.id === submissionId
                        ? { ...sub, ...response.data.evaluation }
                        : sub
                ));
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
                setLoading(false);
                return;
            }
            const response = await api.get("/students", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStudents(response.data.students);
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
                setLoading(false);
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
                console.log(response.data.submissions);
            } else {
                console.error('Erreur lors de la récupération des soumissions:', response.data.message);
                // Optionnel : afficher un message d'erreur à l'utilisateur
            }
        } catch (error) {
            console.error('Erreur API:', error);
            setSubmissions([]);
            // Gestion des erreurs (afficher un message, etc.)
        } finally {
            setLoading(false);
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
        if (itemTypeToDelete === 'student') {
            await confirmDeleteStudent();
        } else if (itemTypeToDelete === 'project') {
            await confirmDeleteProject();
        }
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
            link.setAttribute('download',filename ); // ou le nom que tu veux donner au fichier
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erreur de téléchargement:', error);
        }
    };


    const filteredStudents = students.filter(student =>
        student.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.class_group.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const SubmissionItem: React.FC<SubmissionItemProps> = ({ submission, projectCreatedAt, submissionCreatedAt, durationDays, durationHours }) => {
        const [isExpanded, setIsExpanded] = useState(false);

        return (
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-3xl group">
                {/* En-tête avec fond dégradé - CLICKABLE */}
                <div
                    className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100 cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <span className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
                                    ➤
                                </span>
                                <h4 className="text-xl font-bold text-gray-800 group-hover:text-purple-700 transition-colors duration-200">
                                    {submission.project?.title || 'Projet sans titre'}
                                </h4>
                            </div>
                            <p className="text-gray-600 mt-1 ml-6">{submission.project?.description || 'Aucune description'}</p>
                        </div>
                        {submission.grade && (
                            <span className={`px-4 py-2 rounded-full text-sm font-bold ${submission.grade >= 15 ? 'bg-green-100 text-green-800' :
                                submission.grade >= 10 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                {submission.grade}/20
                            </span>
                        )}
                    </div>

                    {/* Informations résumées */}
                    <div className="mt-3 ml-6 flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                            <span>👤</span>
                            <span>{submission.student?.first_name} {submission.student?.last_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span>📅</span>
                            <span>Soumis le {submissionCreatedAt.toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span>⏱️</span>
                            <span>{durationDays}j {durationHours}h</span>
                        </div>
                        <button
                            className="ml-auto px-3 py-1 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 transition-colors"
                            onClick={() => archivage(submission.id)}
                        >
                            {archive ? '📎Désarchiver' : '📎Archiver'}
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
                                <p className="text-blue-800 font-bold">{durationDays}j {durationHours}h</p>
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
                                        handleDownload(submission.file_path,submission.project?.title)
                                        console.log(submission.id, submission.file_path,submission.project?.title)
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                                >
                                    <span>⬇️</span>
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
        <div className="flex min-h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-indigo-900 text-white flex flex-col p-4 sticky top-0 h-screen overflow-y-auto shadow-2xl">
                <div className="px-2 py-6 text-2xl font-bold border-b border-indigo-400">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">👨‍💻</span>
                        <span className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                            Club Info
                        </span>
                    </div>
                </div>

                <div className="flex-1 mt-8 space-y-4">
                    <button
                        onClick={() => setView('students')}
                        className={`w-full text-left px-4 py-4 rounded-xl flex items-center gap-4 transition-all duration-300 ${view === 'students'
                            ? 'bg-white text-indigo-600 shadow-2xl transform scale-105'
                            : 'hover:bg-indigo-400 hover:shadow-lg'
                            }`}
                    >
                        <span className="text-2xl">📈 </span>
                        <span className="font-semibold">Dashboard</span>
                    </button>

                    <button
                        onClick={() => setView('projects')}
                        className={`w-full text-left px-4 py-4 rounded-xl flex items-center gap-4 transition-all duration-300 ${view === 'projects'
                            ? 'bg-white text-indigo-600 shadow-2xl transform scale-105'
                            : 'hover:bg-indigo-400 hover:shadow-lg'
                            }`}
                    >
                        <span className="text-2xl">📂</span>
                        {/* <ion-icon name="archive"></ion-icon> */}
                        <span className="font-semibold">Projets</span>
                    </button>

                    <button
                        onClick={() => setView('results')}
                        className={`w-full text-left px-4 py-4 rounded-xl flex items-center gap-4 transition-all duration-300 ${view === 'results'
                            ? 'bg-white text-indigo-600 shadow-2xl transform scale-105'
                            : 'hover:bg-indigo-400 hover:shadow-lg'
                            }`}
                    >
                        <span className="text-2xl">🔼 </span>
                        <span className="font-semibold">Dépôts</span>

                    </button>
                    <button
                        onClick={() => setView('archive')}
                        className={`w-full text-left px-4 py-4 rounded-xl flex items-center gap-4 transition-all duration-300 ${view === 'archive'
                            ? 'bg-white text-indigo-600 shadow-2xl transform scale-105'
                            : 'hover:bg-indigo-400 hover:shadow-lg'
                            }`}
                    >
                        <span className="text-2xl">💾</span>
                        <span className="font-semibold">Archives</span>
                    </button>

                    {/* <button
            onClick={() => setView('analytics')}
            className={`w-full text-left px-4 py-4 rounded-xl flex items-center gap-4 transition-all duration-300 ${
                view === 'analytics' 
                    ? 'bg-white text-indigo-600 shadow-2xl transform scale-105' 
                    : 'hover:bg-indigo-400 hover:shadow-lg'
            }`}
        >
            <span className="text-2xl">📊</span>
            <span className="font-semibold">Analytics</span>
        </button> */}
                </div>

                <div className="mt-auto pt-6 border-t border-indigo-400">
                    <div className="px-4 py-3 text-sm text-indigo-200 mb-2">
                        Connecté en tant qu'admin
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={isLoadingLogout}
                        className="w-full text-left px-4 py-4 rounded-xl flex items-center gap-4 transition-all duration-300 hover:bg-red-400 hover:shadow-lg transform hover:scale-105"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                        </svg>
                        {/* <span className="text-2xl">🔒</span> */}
                        <span className="font-semibold">{!isLoadingLogout?'Déconnexion':'Déconnexion...'}</span>
                       
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

                        </p>
                    </div>
                    <div className="flex gap-3 mt-4 md:mt-0">
                        {view === 'students' && (
                            <button
                                onClick={handleCreateStudent}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition"
                            >
                                ➕ Ajouter étudiant
                            </button>
                        )}
                        {view === 'projects' && (
                            <button
                                onClick={handleCreateProject}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition"
                            >
                                ➕ Créer un projet
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

                                            return (
                                                <SubmissionItem
                                                    key={submission.id}
                                                    submission={submission}
                                                    projectCreatedAt={projectCreatedAt}
                                                    submissionCreatedAt={submissionCreatedAt}
                                                    durationDays={durationDays}
                                                    durationHours={durationHours}
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
                        {loading ? (
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

                                        return (
                                            <SubmissionItem
                                                key={submission.id}
                                                submission={submission}
                                                projectCreatedAt={projectCreatedAt}
                                                submissionCreatedAt={submissionCreatedAt}
                                                durationDays={durationDays}
                                                durationHours={durationHours}
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
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="🔍 Rechercher un étudiant par nom, matricule ou classe..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-6 py-4 pl-12 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 text-lg shadow-lg hover:shadow-xl"
                                />
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl">🔍</span>
                            </div>
                        </div>

                        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-3xl">
                            <div className="p-8 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                    <span className="text-3xl">👨‍🎓</span>
                                    Gestion des Étudiants
                                </h2>
                                <p className="text-gray-600 mt-2">Liste complète des étudiants inscrits</p>
                            </div>

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="min-w-full text-base">
                                    <thead className="bg-gradient-to-r from-gray-50 to-green-50">
                                        <tr>
                                            <th className="py-5 px-6 text-left font-bold text-gray-700 uppercase tracking-wider text-sm border-b border-gray-200">
                                                👤 Prénom
                                            </th>
                                            <th className="py-5 px-6 text-left font-bold text-gray-700 uppercase tracking-wider text-sm border-b border-gray-200">
                                                📛 Nom
                                            </th>
                                            <th className="py-5 px-6 text-left font-bold text-gray-700 uppercase tracking-wider text-sm border-b border-gray-200">
                                                🆔 Matricule
                                            </th>
                                            <th className="py-5 px-6 text-left font-bold text-gray-700 uppercase tracking-wider text-sm border-b border-gray-200">
                                                🏫 Classe
                                            </th>
                                            <th className="py-5 px-6 text-center font-bold text-gray-700 uppercase tracking-wider text-sm border-b border-gray-200">
                                                ⚡ Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredStudents.length > 0 ? (
                                            filteredStudents

                                                .sort((a, b) => {
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
                                                            className="hover:bg-gradient-to-r hover:from-green-50/50 hover:to-emerald-50/50 transition-all duration-300 group"
                                                            style={{ animationDelay: `${index * 50}ms` }}
                                                        >
                                                            <td className="py-5 px-6 font-semibold text-gray-800 group-hover:text-green-700 transition-colors duration-200">
                                                                {firstName}
                                                            </td>
                                                            <td className="py-5 px-6 font-medium text-gray-700 group-hover:text-green-800 transition-colors duration-200">
                                                                {lastName}
                                                            </td>
                                                            <td className="py-5 px-6">
                                                                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-mono group-hover:bg-green-100 group-hover:text-green-800 transition-all duration-200">
                                                                    {s.student_id}
                                                                </span>
                                                            </td>
                                                            <td className="py-5 px-6">
                                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium group-hover:bg-blue-200 transition-all duration-200">
                                                                    {s.class_group}
                                                                </span>
                                                            </td>
                                                            <td className="py-5 px-6">
                                                                <div className="flex justify-center space-x-3">
                                                                    <button
                                                                        onClick={() => handleEdit(s)}
                                                                        className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                                                                    >
                                                                        <span>✏️</span>
                                                                        Modifier
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteStudent(s.id)}
                                                                        className="px-5 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm font-semibold hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                                                                    >
                                                                        <span>🗑️</span>
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
                                                        <span className="text-6xl mb-4">👥</span>
                                                        <p className="text-xl font-semibold mb-2">Aucun étudiant trouvé</p>
                                                        <p className="text-gray-500">
                                                            {searchQuery ? "Aucun résultat pour votre recherche" : "Commencez par ajouter votre premier étudiant"}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pied de tableau stylisé */}
                            {filteredStudents.length > 0 && (
                                <div className="bg-gradient-to-r from-gray-50 to-green-50 px-8 py-4 border-t border-gray-100">
                                    <p className="text-sm text-gray-600 font-medium">
                                        📊 Résultats : <span className="text-green-600 font-bold">{filteredStudents.length}</span> étudiant{filteredStudents.length > 1 ? 's' : ''}
                                        {searchQuery && (
                                            <span className="text-gray-500 ml-2">
                                                pour "{searchQuery}"
                                            </span>
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Vue des projets */}
                {view === 'projects' && !loading && (
                    <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-3xl">
                        <div className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                <span className="text-3xl">📂</span>
                                Gestion des Projets
                            </h2>
                            <p className="text-gray-600 mt-2">Liste complète des projets créés</p>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="min-w-full text-base">
                                <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                                    <tr>
                                        <th className="py-5 px-6 text-left font-bold text-gray-700 uppercase tracking-wider text-sm border-b border-gray-200">
                                            📋 Nom du projet
                                        </th>
                                        <th className="py-5 px-6 text-left font-bold text-gray-700 uppercase tracking-wider text-sm border-b border-gray-200">
                                            📝 Description
                                        </th>
                                        <th className="py-5 px-6 text-left font-bold text-gray-700 uppercase tracking-wider text-sm border-b border-gray-200">
                                            👥 Étudiants assignés
                                        </th>
                                        <th className="py-5 px-6 text-center font-bold text-gray-700 uppercase tracking-wider text-sm border-b border-gray-200">
                                            ⚡ Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {projects.length > 0 ? (
                                        projects.map((project, index) => (
                                            <tr
                                                key={project.id}
                                                className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300 group"
                                                style={{ animationDelay: `${index * 50}ms` }}
                                            >
                                                <td className="py-5 px-6 font-semibold text-gray-800 group-hover:text-blue-700 transition-colors duration-200">
                                                    {project.title}
                                                </td>
                                                <td className="py-5 px-6 text-gray-600 max-w-md">
                                                    <div className="line-clamp-2 group-hover:text-gray-800 transition-colors duration-200">
                                                        {project.description}
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6">
                                                    {project.students.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {project.students.slice(0, 3).map((student) => (
                                                                <span
                                                                    key={student.id}
                                                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium transition-all duration-200 hover:bg-blue-200 hover:scale-105"
                                                                >
                                                                    {student.user.name}
                                                                </span>
                                                            ))}
                                                            {project.students.length > 3 && (
                                                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                                                    +{project.students.length - 3}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Aucun étudiant assigné</span>
                                                    )}
                                                </td>
                                                <td className="py-5 px-6">
                                                    <div className="flex justify-center space-x-3">
                                                        <button
                                                            onClick={() => handleEditProject(project)}
                                                            className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                                                        >
                                                            <span>✏️</span>
                                                            Éditer
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteProject(project.id)}
                                                            className="px-5 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm font-semibold hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                                                        >
                                                            <span>🗑️</span>
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-16 text-center">
                                                <div className="flex flex-col items-center justify-center text-gray-400">
                                                    <span className="text-6xl mb-4">📭</span>
                                                    <p className="text-xl font-semibold mb-2">Aucun projet trouvé</p>
                                                    <p className="text-gray-500">Commencez par créer votre premier projet</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pied de tableau stylisé */}
                        {projects.length > 0 && (
                            <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-8 py-4 border-t border-gray-100">
                                <p className="text-sm text-gray-600 font-medium">
                                    📊 Total : <span className="text-blue-600 font-bold">{projects.length}</span> projet{projects.length > 1 ? 's' : ''}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Modal de confirmation de suppression */}
                <Transition appear show={isDeleteModalOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-10" onClose={() => setIsDeleteModalOpen(false)}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black bg-opacity-25" />
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
                                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                            Confirmer la suppression
                                        </Dialog.Title>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Êtes-vous sûr de vouloir supprimer ce {itemTypeToDelete === 'student' ? 'étudiant' : 'projet'} ? Cette action est irréversible.
                                            </p>
                                        </div>
                                        <div className="mt-4 space-x-2 flex justify-between">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                                                onClick={confirmDelete}
                                            >
                                                Supprimer
                                            </button>
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                                onClick={() => setIsDeleteModalOpen(false)}
                                            >
                                                Annuler
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
                    <Dialog as="div" className="relative z-10" onClose={() => setIsCreateStudentModalOpen(false)}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black bg-opacity-25" />
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
                                    <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                        <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-900 mb-6">
                                            Créer un nouvel étudiant
                                        </Dialog.Title>
                                        <form onSubmit={handleStudentFormSubmit} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Prénom</label>
                                                <input
                                                    type="text"
                                                    name="first_name"
                                                    value={formDataStudent.first_name}
                                                    onChange={handleStudentFormChange}
                                                    required
                                                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                                <text></text>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Nom de famille</label>
                                                <input
                                                    type="text"
                                                    name="last_name"
                                                    value={formDataStudent.last_name}
                                                    onChange={handleStudentFormChange}
                                                    required
                                                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formDataStudent.email}
                                                    onChange={handleStudentFormChange}
                                                    required
                                                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={formDataStudent.password}
                                                    onChange={handleStudentFormChange}
                                                    required
                                                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Matricule étudiant</label>
                                                <input
                                                    type="text"
                                                    name="student_id"
                                                    value={formDataStudent.student_id}
                                                    onChange={handleStudentFormChange}
                                                    required
                                                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Classe</label>
                                                <select
                                                    name="class_group"
                                                    value={formDataStudent.class_group}
                                                    onChange={handleStudentFormChange}
                                                    required
                                                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                >
                                                    <option value="L1 Info">L1 Info</option>
                                                    <option value="L2 Info">L2 Info</option>
                                                    <option value="L3 Info">L3 Info</option>
                                                </select>
                                            </div>
                                            <div className="mt-6 flex justify-end space-x-3">
                                                <button
                                                    type="button"
                                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                                    onClick={() => setIsCreateStudentModalOpen(false)}
                                                >
                                                    Annuler
                                                </button>
                                                <button
                                                    type="submit"
                                                    className={`px-4 py-2 text-sm font-medium text-white rounded-md transition ${isSubmitting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? 'Création...' : 'Créer l’étudiant'}
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
                    <Dialog as="div" className="relative z-10" onClose={() => setIsEditModalOpen(false)}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black bg-opacity-25" />
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
                                    <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                        <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-900 mb-6">
                                            Modifier l'étudiant
                                        </Dialog.Title>
                                        <form onSubmit={handleUpdateStudent} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Prénom</label>
                                                <input
                                                    type="text"
                                                    name="first_name"
                                                    value={formDataStudent.first_name}
                                                    onChange={handleStudentFormChange}
                                                    required
                                                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Nom de famille</label>
                                                <input
                                                    type="text"
                                                    name="last_name"
                                                    value={formDataStudent.last_name}
                                                    onChange={handleStudentFormChange}
                                                    required
                                                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Matricule étudiant</label>
                                                <input
                                                    type="text"
                                                    name="student_id"
                                                    value={formDataStudent.student_id}
                                                    onChange={handleStudentFormChange}
                                                    required
                                                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Classe</label>
                                                <select
                                                    name="class_group"
                                                    value={formDataStudent.class_group}
                                                    onChange={handleStudentFormChange}
                                                    required
                                                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                >
                                                    <option value="L1 Info">L1 Info</option>
                                                    <option value="L2 Info">L2 Info</option>
                                                    <option value="L3 Info">L3 Info</option>
                                                </select>
                                            </div>
                                            <div className="mt-6 flex justify-end space-x-3">
                                                <button
                                                    type="button"
                                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                                    onClick={() => setIsEditModalOpen(false)}
                                                >
                                                    Annuler
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="px-4 py-2 text-sm font-medium text-white rounded-md bg-blue-600 hover:bg-blue-700 transition"

                                                    disabled={update}
                                                >
                                                    {update ? 'Mise à jour...' : 'Mise à jour'}
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
                    <Dialog as="div" className="relative z-10" onClose={() => setIsCreateProjectModalOpen(false)}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black bg-opacity-25" />
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
                                    <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                        <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-900 mb-6">
                                            Créer un nouveau projet
                                        </Dialog.Title>
                                        <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Nom du projet</label>
                                                <input
                                                    type="text"
                                                    // name="name"
                                                    name="title"
                                                    value={formDataProject.title}
                                                    onChange={handleProjectFormChange}
                                                    required
                                                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                                <textarea
                                                    name="description"
                                                    value={formDataProject.description}
                                                    onChange={handleProjectFormChange}
                                                    required
                                                    rows={4}
                                                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Sélectionner les étudiants
                                                </label>
                                                <div className="h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                                                    {students.length > 0 ? (
                                                        students.map(student => (
                                                            <div key={student.id} className="flex items-center space-x-2 py-1">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`student-${student.id}`}
                                                                    name="student_ids"
                                                                    checked={formDataProject.student_ids.includes(student.id)}
                                                                    onChange={() => handleStudentSelection(student.id)}
                                                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                                                />
                                                                <label htmlFor={`student-${student.id}`} className="text-sm text-gray-700">
                                                                    {student.user.name} ({student.student_id})
                                                                </label>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-gray-500 text-center text-sm mt-4">
                                                            Aucun étudiant disponible.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-6 flex justify-end space-x-3">
                                                <button
                                                    type="button"
                                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                                    onClick={() => setIsCreateProjectModalOpen(false)}
                                                >
                                                    Annuler
                                                </button>
                                                <button
                                                    type="submit"
                                                    className={`px-4 py-2 text-sm font-medium text-white rounded-md transition ${isSubmitting ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'}`}
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? 'Création...' : 'Créer le projet'}
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
                    <Dialog as="div" className="relative z-10" onClose={() => setIsEditProjectModalOpen(false)}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black bg-opacity-25" />
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
                                    <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                        <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-900 mb-6">
                                            Modifier le projet
                                        </Dialog.Title>
                                        <form onSubmit={handleUpdateProject} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Nom du projet</label>
                                                <input
                                                    type="text"
                                                    // name="name"
                                                    name="title"
                                                    value={formDataProject.title}
                                                    onChange={handleProjectFormChange}
                                                    required
                                                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                                <textarea
                                                    name="description"
                                                    value={formDataProject.description}
                                                    onChange={handleProjectFormChange}
                                                    required
                                                    rows={4}
                                                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Sélectionner les étudiants
                                                </label>
                                                <div className="h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                                                    {students.length > 0 ? (
                                                        students.map(student => (
                                                            <div key={student.id} className="flex items-center space-x-2 py-1">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`edit-student-${student.id}`}
                                                                    name="student_ids"
                                                                    checked={formDataProject.student_ids.includes(student.id)}
                                                                    onChange={() => handleStudentSelection(student.id)}
                                                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                                                />
                                                                <label htmlFor={`edit-student-${student.id}`} className="text-sm text-gray-700">
                                                                    {student.user.name} ({student.student_id})
                                                                </label>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-gray-500 text-center text-sm mt-4">
                                                            Aucun étudiant disponible.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-6 flex justify-end space-x-3">
                                                <button
                                                    type="button"
                                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                                    onClick={() => setIsEditProjectModalOpen(false)}
                                                >
                                                    Annuler
                                                </button>
                                                <button
                                                    type="submit"
                                                    className={`px-4 py-2 text-sm font-medium text-white rounded-md transition ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
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
