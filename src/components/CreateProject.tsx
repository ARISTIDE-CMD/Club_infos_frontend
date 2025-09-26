import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const CreateProject: React.FC = () => {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await api.post('/projects', { name, description }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      const response = await api.post('/projects', { title, description });
      
      setMessage('Projet créé avec succès ! Redirection vers le tableau de bord...');
      setTimeout(() => navigate('/dashboard'), 2000);
      
    } catch (error: any) {
      console.error('Erreur lors de la création du projet:', error);
      setMessage(error.response?.data?.message || 'Erreur lors de la création du projet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">Créer un nouveau projet</h2>
        
        {message && (
          <div className={`mt-4 text-sm text-center ${message.includes('succès') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nom du projet
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Ex: Refonte du site web"
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Décrivez les objectifs et les tâches du projet."
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75"
            >
              {isLoading ? 'Création en cours...' : 'Créer le projet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;