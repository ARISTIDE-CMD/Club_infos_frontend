import React, { useState, useEffect } from 'react';
import api from '../../api';

interface Assignment {
  id: string | number;
  project: {
    title: string;
  };
}

const SubmissionForm: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    // Récupérer les attributions de projets de l'étudiant
    const fetchAssignments = async () => {
      try {
        const response = await api.get('/student-assignments');
        setAssignments(response.data.assignments);
      } catch (error) {
        console.error('Erreur lors de la récupération des projets', error);
        setMessage('Erreur lors du chargement des attributions de projets.');
      }
    };
    fetchAssignments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentId || !file) {
      setMessage('Veuillez sélectionner un projet et un fichier.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    const formData = new FormData();
    formData.append('assignment_id', selectedAssignmentId);
    formData.append('file', file);

    try {
      const response = await api.post('/submissions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage('Fichier soumis avec succès !');
      // Réinitialiser le formulaire
      setSelectedAssignmentId('');
      setFile(null);
    } catch (error: any) {
      console.error('Erreur lors de la soumission', error);
      setMessage(error.response?.data?.message || 'Une erreur est survenue lors de la soumission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Soumettre un projet</h2>
      
      {message && (
        <div className={`p-3 rounded mb-4 ${message.includes('succès') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="assignment" className="block text-sm font-medium text-gray-700">Sélectionner un projet</label>
          <select
            id="assignment"
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">-- Choisir un projet --</option>
            {assignments.map(assignment => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.project.title}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700">Sélectionner un fichier</label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Soumission en cours...' : 'Soumettre le projet'}
        </button>
      </form>
    </div>
  );
};

export default SubmissionForm;