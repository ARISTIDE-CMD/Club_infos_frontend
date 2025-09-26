// src/components/CreateStudent.tsx

import React, { useState } from 'react';
import api from '../api';

const CreateStudent: React.FC = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        student_id: '',
        class_group: '',
    });
    const [message, setMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        try {
            const response = await api.post('/admin/students', formData);

            setMessage(response.data.message);
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                password: '',
                student_id: '',
                class_group: '',
            });

        } catch (error: any) {
            console.error('Erreur lors de la création de l\'étudiant:', error);
            setMessage(error.response?.data?.message || 'Erreur lors de la création de l\'étudiant.');
        }
    };

    return (
        <div className="create-student-container">
            <h2>Créer un nouvel étudiant</h2>
            <form onSubmit={handleSubmit}>
                {/* Champs first_name et last_name */}
                <div>
                    <label>Prénom</label>
                    <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required />
                </div>
                <div>
                    <label>Nom de famille</label>
                    <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required />
                </div>
                <div>
                    <label>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div>
                    <label>Mot de passe</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                </div>
                <div>
                    <label>Matricul étudiant</label>
                    <input type="text" name="student_id" value={formData.student_id} onChange={handleChange} required />
                </div>
                <div>
                    <label>Classe</label>
                    <input type="text" name="class_group" value={formData.class_group} onChange={handleChange} required />
                </div>
                <button type="submit">Créer l'étudiant</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default CreateStudent;