import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

interface Student {
    id: number;
    student_id: string;
    class_group: string;
    user: {
        id: number;
        name: string;
    };
}

const Dashboard: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const navigate = useNavigate();

    // State to control which view is displayed: 'list' or 'addStudent'
    const [viewMode, setViewMode] = useState<'list' | 'addStudent'>('list');

    // State for the new student form fields (Add Student)
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [newStudentMatricule, setNewStudentMatricule] = useState('');
    const [newStudentClass, setNewStudentClass] = useState('');
    const [isCreatingStudent, setIsCreatingStudent] = useState(false);

    // Modal state for project creation
    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDescription, setNewProjectDescription] = useState('');
    const [isCreatingProject, setIsCreatingProject] = useState(false);

    // Modal state for delete confirmation
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<number | null>(null);

    // State for editing a student in a modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
    const [editFormData, setEditFormData] = useState({
        first_name: "",
        last_name: "",
        student_id: "",
        class_group: "",
    });
    const [isUpdatingStudent, setIsUpdatingStudent] = useState(false);


    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                setError("Non autorisé. Veuillez vous connecter.");
                setLoading(false);
                return;
            }

            const response = await api.get("/students", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStudents(response.data.students);
        } catch (error) {
            console.error("Erreur lors du chargement des étudiants:", error);
            setError("Erreur lors du chargement des étudiants.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (viewMode === 'list') {
            fetchStudents();
        }
    }, [viewMode]);

    const handleLogout = async () => {
        try {
            await api.post(
                "/logout",
                {},
                { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } }
            );
            localStorage.removeItem("authToken");
            navigate("/", { state: { loggedOut: true } });
        } catch (error) {
            console.error("Erreur de déconnexion:", error);
        }
    };

    const handleCreateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreatingStudent(true);
        setMessage(null);

        try {
            const token = localStorage.getItem("authToken");
            await api.post('/admin/students', {
                first_name: firstName,
                last_name: lastName,
                email: email,
                password: password,
                student_id: newStudentMatricule,
                class_group: newStudentClass,
                name: `${firstName} ${lastName}`
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage("Étudiant créé avec succès !");
            setFirstName('');
            setLastName('');
            setEmail('');
            setPassword('');
            setNewStudentMatricule('');
            setNewStudentClass('');
            setViewMode('list');
        } catch (error: any) {
            console.error("Erreur lors de la création de l'étudiant:", error);
            setMessage(error.response?.data?.message || "Erreur lors de la création de l'étudiant.");
        } finally {
            setIsCreatingStudent(false);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreatingProject(true);
        setMessage(null);

        try {
            const response = await api.post('/projects', { name: newProjectName, description: newProjectDescription }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            });
            setMessage('Projet créé avec succès !');
            setShowCreateProjectModal(false);
            setNewProjectName('');
            setNewProjectDescription('');
        } catch (error: any) {
            console.error('Erreur lors de la création du projet:', error);
            setMessage(error.response?.data?.message || 'Erreur lors de la création du projet.');
        } finally {
            setIsCreatingProject(false);
        }
    };

    const handleDeleteClick = (studentId: number) => {
        setStudentToDelete(studentId);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!studentToDelete) return;
        try {
            const token = localStorage.getItem("authToken");
            await api.delete(`/admin/students/${studentToDelete}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessage("Étudiant supprimé avec succès.");
            setStudents(students.filter((s) => s.id !== studentToDelete));
        } catch (error) {
            console.error("Erreur suppression:", error);
            setMessage("Erreur lors de la suppression.");
        } finally {
            setShowDeleteModal(false);
            setStudentToDelete(null);
        }
    };

    const handleEditClick = (student: Student) => {
        setStudentToEdit(student);
        const [firstName, ...rest] = student.user.name.split(" ");
        const lastName = rest.join(" ");
        setEditFormData({
            first_name: firstName,
            last_name: lastName,
            student_id: student.student_id,
            class_group: student.class_group,
        });
        setShowEditModal(true);
    };

    const handleUpdateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdatingStudent(true);
        if (!studentToEdit) return;

        try {
            const token = localStorage.getItem("authToken");
            await api.put(`/admin/students/${studentToEdit.id}`, {
                ...editFormData,
                name: `${editFormData.first_name} ${editFormData.last_name}`
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            setMessage("✅ Étudiant mis à jour avec succès.");
            setShowEditModal(false);
            fetchStudents(); // Refresh the student list
        } catch (error) {
            console.error("Erreur mise à jour:", error);
            setMessage("❌ Échec de la mise à jour.");
        } finally {
            setIsUpdatingStudent(false);
        }
    };

    const filteredStudents = students.filter(student =>
        student.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.class_group.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-indigo-700 text-white flex flex-col">
                <div className="px-6 py-4 text-2xl font-bold border-b border-indigo-600">
                    🎓 Club Informatiques
                </div>
                <div className="flex items-center gap-3 px-6 py-4 border-b border-indigo-600">
                    <div className="w-10 h-10 rounded-full bg-white text-indigo-700 font-bold flex items-center justify-center">
                        AD
                    </div>
                    <div>
                        <p className="font-semibold">Admin User</p>
                        <p className="text-sm text-indigo-200">Administrateur</p>
                    </div>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`w-full text-left px-4 py-2 rounded-lg transition ${viewMode === 'list' ? 'bg-indigo-600' : 'hover:bg-indigo-500'}`}
                    >
                        📊 Tableau de bord
                    </button>
                    <button
                        onClick={() => setShowCreateProjectModal(true)}
                        className="w-full text-left px-4 py-2 rounded-lg hover:bg-indigo-500 transition"
                    >
                        📝 Créer un projet
                    </button>
                    <button
                        onClick={() => setViewMode('addStudent')}
                        className={`w-full text-left px-4 py-2 rounded-lg transition ${viewMode === 'addStudent' ? 'bg-indigo-600' : 'hover:bg-indigo-500'}`}
                    >
                        👨‍🎓 Ajouter Étudiant
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 rounded-lg hover:bg-indigo-500 transition"
                    >
                        🚪 Déconnexion
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                {message && (
                    <div className="mb-4 p-3 rounded bg-green-100 text-green-700">
                        {message}
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-3 rounded bg-red-100 text-red-700">
                        {error}
                    </div>
                )}

                {viewMode === 'list' && (
                    <>
                        <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">Tableau de bord</h1>
                                <p className="text-gray-500">Gestion des étudiants inscrits</p>
                            </div>
                            <div className="flex gap-3 mt-4 md:mt-0">
                                <button
                                    onClick={() => setShowCreateProjectModal(true)}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
                                >
                                    ➕ Créer un projet
                                </button>
                                <button
                                    onClick={() => setViewMode('addStudent')}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
                                >
                                    ➕ Ajouter un étudiant
                                </button>
                            </div>
                        </header>
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Rechercher un étudiant par nom, matricule ou classe..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                            />
                        </div>
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="px-6 py-4 border-b">
                                <h2 className="text-lg font-semibold text-gray-700">
                                    Liste des étudiants
                                </h2>
                            </div>
                            {loading ? (
                                <p className="p-6 text-gray-500">Chargement...</p>
                            ) : filteredStudents.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm text-gray-700">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="py-3 px-4 text-left">Nom</th>
                                                <th className="py-3 px-4 text-left">Matricule</th>
                                                <th className="py-3 px-4 text-left">Classe</th>
                                                <th className="py-3 px-4 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStudents.map((s) => (
                                                <tr
                                                    key={s.id}
                                                    className="border-b hover:bg-gray-50 transition"
                                                >
                                                    <td className="py-3 px-4">{s.user.name}</td>
                                                    <td className="py-3 px-4">{s.student_id}</td>
                                                    <td className="py-3 px-4">{s.class_group}</td>
                                                    <td className="py-3 px-4 text-center space-x-2">
                                                        <button
                                                            onClick={() => handleEditClick(s)}
                                                            className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition"
                                                        >
                                                            ✏️ Modifier
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(s.id)}
                                                            className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition"
                                                        >
                                                            🗑 Supprimer
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="p-6 text-gray-500 text-center">
                                    Aucun étudiant ne correspond à votre recherche.
                                </p>
                            )}
                        </div>
                    </>
                )}

                {viewMode === 'addStudent' && (
                    <div className="bg-white shadow rounded-lg p-6 max-w-2xl mx-auto">
                        <header className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold text-gray-800">Ajouter un nouvel étudiant</h1>
                            <button
                                onClick={() => setViewMode('list')}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                            >
                                Retour à la liste
                            </button>
                        </header>
                        <form onSubmit={handleCreateStudent} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Prénom</label>
                                    <input
                                        type="text"
                                        placeholder="Prénom"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                        className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nom de famille</label>
                                    <input
                                        type="text"
                                        placeholder="Nom de famille"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                        className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                                <input
                                    type="password"
                                    placeholder="Mot de passe"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Matricule étudiant</label>
                                    <input
                                        type="text"
                                        placeholder="Matricule étudiant"
                                        value={newStudentMatricule}
                                        onChange={(e) => setNewStudentMatricule(e.target.value)}
                                        required
                                        className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Classe</label>
                                    <input
                                        type="text"
                                        placeholder="Classe"
                                        value={newStudentClass}
                                        onChange={(e) => setNewStudentClass(e.target.value)}
                                        required
                                        className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isCreatingStudent}
                                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition disabled:opacity-75 disabled:cursor-not-allowed"
                            >
                                {isCreatingStudent ? 'Ajout en cours...' : '➕ Ajouter l\'étudiant'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Create Project Modal */}
                {showCreateProjectModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
                        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
                            <h2 className="text-2xl font-bold text-center text-indigo-700 mb-6">Créer un nouveau projet</h2>
                            <form onSubmit={handleCreateProject} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                        Nom du projet
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={newProjectName}
                                        onChange={(e) => setNewProjectName(e.target.value)}
                                        required
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Ex: Refonte du site web"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        value={newProjectDescription}
                                        onChange={(e) => setNewProjectDescription(e.target.value)}
                                        rows={3}
                                        required
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Décrivez les objectifs du projet."
                                    />
                                </div>
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateProjectModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreatingProject}
                                        className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75"
                                    >
                                        {isCreatingProject ? 'Création...' : 'Créer'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Student Modal */}
                {showEditModal && studentToEdit && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
                        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg">
                            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                                Modifier l’étudiant: <span className="text-indigo-600">{studentToEdit.user.name}</span>
                            </h2>
                            <form onSubmit={handleUpdateStudent} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Prénom</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={editFormData.first_name}
                                        onChange={(e) => setEditFormData({...editFormData, first_name: e.target.value})}
                                        required
                                        className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nom de famille</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={editFormData.last_name}
                                        onChange={(e) => setEditFormData({...editFormData, last_name: e.target.value})}
                                        required
                                        className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Matricule étudiant</label>
                                    <input
                                        type="text"
                                        name="student_id"
                                        value={editFormData.student_id}
                                        onChange={(e) => setEditFormData({...editFormData, student_id: e.target.value})}
                                        required
                                        className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Classe</label>
                                    <select
                                        name="class_group"
                                        value={editFormData.class_group}
                                        onChange={(e) => setEditFormData({...editFormData, class_group: e.target.value})}
                                        required
                                        className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Sélectionner une classe</option>
                                        <option value="L1 Info">L1 Info</option>
                                        <option value="L2 Info">L2 Info</option>
                                        <option value="L3 Info">L3 Info</option>
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isUpdatingStudent}
                                        className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75"
                                    >
                                        {isUpdatingStudent ? 'Mise à jour...' : '💾 Enregistrer'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
                        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm text-center">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmer la suppression</h3>
                            <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir supprimer cet étudiant ?</p>
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;