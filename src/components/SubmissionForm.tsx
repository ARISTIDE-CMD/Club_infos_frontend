
import { useState } from "react";

interface EvaluationFormProps {
  submissionId: number;
  onEvaluate: (submissionId: number, grade: number, comment: string) => void;
  loading: boolean;
}

const EvaluationForm: React.FC<EvaluationFormProps> = ({ submissionId, onEvaluate, loading }) => {
  const [grade, setGrade] = useState<number | "">();
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(comment=="") return
    if (grade === "" || isNaN(Number(grade))) {
  onEvaluate(submissionId, 0, comment); // ou null si autorisé
  return;
}
    onEvaluate(submissionId, Number(grade), comment);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-4 rounded-xl">
      <div className="flex items-center gap-2 text-gray-700 mb-2">
        <span>📝</span>
        <span className="font-semibold">Évaluer la soumission</span>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Note (/20)</label>
        <input
          type="number"
          step="0.5"
          min="0"
          max="20"
          value={grade}
          onChange={(e) => setGrade(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Commentaire</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
      >
        {loading ? "Enregistrement..." : "Enregistrer l'évaluation"}
      </button>
    </form>
  );
};

export default EvaluationForm;





// import React, { useState, useEffect } from 'react';
// import api from '../api';

// interface Assignment {
//   id: string | number;
//   project: {
//     title: string;
//   };
// }

// const SubmissionForm: React.FC = () => {
//   const [assignments, setAssignments] = useState<Assignment[]>([]);
//   const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
//   const [file, setFile] = useState<File | null>(null);
//   const [message, setMessage] = useState<string>('');
//   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

//   useEffect(() => {
//     // Récupérer les attributions de projets de l'étudiant
//     const fetchAssignments = async () => {
//       try {
//         const response = await api.get('/student-assignments');
//         setAssignments(response.data.assignments);
//       } catch (error) {
//         console.error('Erreur lors de la récupération des projets', error);
//         setMessage('Erreur lors du chargement des attributions de projets.');
//       }
//     };
//     fetchAssignments();
//   }, []);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files) {
//       setFile(e.target.files[0]);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedAssignmentId || !file) {
//       setMessage('Veuillez sélectionner un projet et un fichier.');
//       return;
//     }

//     setIsSubmitting(true);
//     setMessage('');

//     const formData = new FormData();
//     formData.append('assignment_id', selectedAssignmentId);
//     formData.append('file', file);

//     try {
//       // const response = await api.post('/submissions', formData, {
//       //   headers: {
//       //     'Content-Type': 'multipart/form-data',
//       //   },
//       // });
//       setMessage('Fichier soumis avec succès !');
//       // Réinitialiser le formulaire
//       setSelectedAssignmentId('');
//       setFile(null);
//     } catch (error) {
//       if(error instanceof Error){
//       console.error('Erreur lors de la soumission', error);
//       setMessage(error.message || 'Une erreur est survenue lors de la soumission.');
//     }} finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="p-6 bg-white rounded-lg shadow-md max-w-lg mx-auto">
//       <h2 className="text-xl font-bold mb-4 text-gray-800">Soumettre un projet</h2>
      
//       {message && (
//         <div className={`p-3 rounded mb-4 ${message.includes('succès') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
//           {message}
//         </div>
//       )}

//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div>
//           <label htmlFor="assignment" className="block text-sm font-medium text-gray-700">Sélectionner un projet</label>
//           <select
//             id="assignment"
//             value={selectedAssignmentId}
//             onChange={(e) => setSelectedAssignmentId(e.target.value)}
//             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//           >
//             <option value="">-- Choisir un projet --</option>
//             {assignments.map(assignment => (
//               <option key={assignment.id} value={assignment.id}>
//                 {assignment.project.title}
//               </option>
//             ))}
//           </select>
//         </div>
        
//         <div>
//           <label htmlFor="file" className="block text-sm font-medium text-gray-700">Sélectionner un fichier</label>
//           <input
//             type="file"
//             id="file"
//             onChange={handleFileChange}
//             className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
//           />
//         </div>

//         <button
//           type="submit"
//           disabled={isSubmitting}
//           className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
//         >
//           {isSubmitting ? 'Soumission en cours...' : 'Soumettre le projet'}
//         </button>
//       </form>
//     </div>
//   );
// };

// export default SubmissionForm;



// import React, { useState, useEffect } from 'react';
// import api from '../api';

// // Interface pour les données de soumission nécessaires (peut être étendue)
// interface Submission {
//     id: number;
//     file_name: string;
//     // La soumission peut déjà contenir une évaluation
//     evaluation?: {
//         grade: number | null;
//         comment: string | null;
//     };
// }

// // Propriétés attendues par ce composant
// interface SubmissionEvaluationFormProps {
//     submission: Submission;
//     onEvaluationUpdated: () => void; // Callback pour rafraîchir la liste après la mise à jour
// }

// const SubmissionEvaluationForm: React.FC<SubmissionEvaluationFormProps> = ({ submission, onEvaluationUpdated }) => {
//     // Initialisation des états avec les valeurs existantes de l'évaluation (si elles existent)
//     const [grade, setGrade] = useState<number | string>(submission.evaluation?.grade ?? '');
//     const [comment, setComment] = useState<string>(submission.evaluation?.comment ?? '');
//     const [isLoading, setIsLoading] = useState(false);
//     const [message, setMessage] = useState<string | null>(null);
//     const [error, setError] = useState<string | null>(null);

//     // Mettre à jour les états si la soumission change (par exemple, dans une liste)
//     useEffect(() => {
//         setGrade(submission.evaluation?.grade ?? '');
//         setComment(submission.evaluation?.comment ?? '');
//     }, [submission]);

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setIsLoading(true);
//         setMessage(null);
//         setError(null);

//         try {
//             const token = localStorage.getItem('authToken');
//             if (!token) {
//                 setError("Non autorisé. Veuillez vous connecter.");
//                 setIsLoading(false);
//                 return;
//             }

//             // Préparation du payload
//             const payload = {
//                 // Convertir la chaîne en nombre ou null si vide, avant l'envoi
//                 grade: grade === '' ? null : Number(grade),
//                 comment: comment || null,
//             };

//             // Appel de l'API: POST /api/submissions/{submission}/evaluate
//             await api.post(`/submissions/${submission.id}/evaluate`, payload, {
//                 headers: { Authorization: `Bearer ${token}` },
//             });

//             setMessage('Évaluation enregistrée avec succès.');
//             onEvaluationUpdated(); // Déclencher le rafraîchissement de la liste parente
//         } catch (err: any) {
//             console.error('Erreur lors de l\'enregistrement de l\'évaluation:', err);
//             // Afficher l'erreur de validation si disponible
//             const errorMessage = err.response?.data?.message || 'Erreur lors de l\'enregistrement.';
//             setError(errorMessage);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
//             <h3 className="text-lg font-semibold text-gray-800 mb-3">
//                 Évaluer : {submission.file_name}
//             </h3>

//             {message && (
//                 <div className="mb-3 p-2 text-sm rounded-md bg-green-100 text-green-700">
//                     {message}
//                 </div>
//             )}
//             {error && (
//                 <div className="mb-3 p-2 text-sm rounded-md bg-red-100 text-red-700">
//                     Erreur: {error}
//                 </div>
//             )}

//             <form onSubmit={handleSubmit} className="space-y-3">
//                 {/* Champ de la Note */}
//                 <div>
//                     <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
//                         Note (sur 100)
//                     </label>
//                     <input
//                         id="grade"
//                         type="number"
//                         step="0.01"
//                         min="0"
//                         max="100"
//                         value={grade}
//                         onChange={(e) => setGrade(e.target.value)}
//                         className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//                         placeholder="Ex: 85.5"
//                     />
//                 </div>

//                 {/* Champ du Commentaire */}
//                 <div>
//                     <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
//                         Commentaire / Feedback
//                     </label>
//                     <textarea
//                         id="comment"
//                         rows={3}
//                         value={comment}
//                         onChange={(e) => setComment(e.target.value)}
//                         className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//                         placeholder="Points forts, points faibles, suggestions..."
//                     />
//                 </div>

//                 <button
//                     type="submit"
//                     disabled={isLoading}
//                     className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition ${
//                         isLoading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
//                     }`}
//                 >
//                     {isLoading ? "Enregistrement..." : "Enregistrer l'évaluation"}
//                 </button>
//             </form>
//         </div>
//     );
// };

// export default SubmissionEvaluationForm;

