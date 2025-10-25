import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import api from "../api"; // Le chemin vers votre API

// Interfaces (Mises à jour pour plus de robustesse, notamment pour la note)
interface Evaluation {
  grade: string; // La note est une chaîne dans le JSON, on la convertira
}

interface Submission {
  created_at: string; // Date de soumission
  updated_at: string;
  evaluation?: Evaluation;
}

interface Project {
  title: string;
  created_at: string; // Date de création du projet (pour calculer le temps)
  submission?: Submission;
}

interface Student {
  first_name: string;
  last_name: string;
  student_id: string;
  class_group: string;
  projects: Project[];
}

interface MeritStudent {
  studentName: string;
  studentId: string;
  classGroup: string;
  averageGrade: number;
  averageSpeed: number; // en heures
  score: number;
  projects: { projet: string; note: number }[];
}

// Fonction utilitaire pour tronquer les titres longs
const truncateTitle = (title: string, maxLength: number = 20): string => {
  return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
};

const MeritChart = () => {
  const [studentsData, setStudentsData] = useState<MeritStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Logique de calcul inchangée (elle est correcte selon les critères définis)
   */
  const fetchMeritData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Non autorisé. Veuillez vous connecter.");
      }

      // 🛑 Appel API réel
      const response = await api.get<{ students: Student[] }>("/students", {
         headers: { Authorization: `Bearer ${token}` },
      });
      const students: Student[] = response.data.students || [];

      const computedStudents: MeritStudent[] = students.map((student) => {
        const validProjects = student.projects.filter(
          (p) => p.submission?.evaluation?.grade !== undefined
        );

        if (validProjects.length === 0) {
          return {
            studentName: `${student.first_name} ${student.last_name}`,
            studentId: student.student_id,
            classGroup: student.class_group,
            averageGrade: 0,
            averageSpeed: 0,
            score: 0,
            projects: [],
          };
        }

        const notes: number[] = validProjects.map((p) =>
          parseFloat(p.submission!.evaluation!.grade) || 0
        );

        const durations = validProjects.map((p) => {
          const projectCreation = new Date(p.created_at);
          const submissionDate = new Date(p.submission!.created_at);
          const durationMs = submissionDate.getTime() - projectCreation.getTime();
          return Math.max(0, durationMs / 3600000); 
        });

        const avgGrade =
          notes.reduce((a, b) => a + b, 0) / notes.length;

        const avgSpeed =
          durations.reduce((a, b) => a + b, 0) / durations.length;
        
        const speedFactor = (100 / (avgSpeed + 1)); 

        const normalizedSpeedComponent = (speedFactor / 100) * 20; 
        
        const finalScore =
          (avgGrade * 0.7) +
          (normalizedSpeedComponent * 0.3);

        return {
          studentName: `${student.first_name} ${student.last_name}`,
          studentId: student.student_id,
          classGroup: student.class_group,
          averageGrade: avgGrade,
          averageSpeed: avgSpeed,
          score: finalScore,
          projects: validProjects.map((p) => ({
            projet: truncateTitle(p.title), 
            note: parseFloat(p.submission!.evaluation!.grade) || 0,
          })),
        };
      });

      // 🥇 Classement : Tri par score décroissant
      const sortedStudents = computedStudents.sort((a, b) => b.score - a.score);

      setStudentsData(sortedStudents);
    } catch (err: any) {
      console.error("Erreur lors du chargement des données :", err);
      setError(err.message || "Impossible de charger les données des étudiants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeritData();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-60">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
    
  if (error)
    return (
        <div className="p-4 text-center text-red-600 bg-red-100 border border-red-300 rounded-lg">
            ⚠️ Erreur de chargement: {error}
        </div>
    );

  if (studentsData.length === 0) {
    return (
      <div className="p-4 text-center text-gray-600 bg-gray-100 border border-gray-300 rounded-lg">
        Aucune donnée étudiant disponible ou aucun projet noté.
      </div>
    );
  }

  // Fonction pour déterminer le style en fonction du rang (personnalisé pour les 5 premiers)
  const getRankStyle = (index: number) => {
    let rankBadge = "bg-indigo-600 text-white";
    let cardBorder = "border-indigo-100 shadow-md";
    let headerColor = "text-indigo-700";
    let emoji = "✨";

    if (index === 0) {
      // 1er : Or
      rankBadge = "bg-yellow-500 text-white";
      cardBorder = "border-yellow-400 shadow-2xl shadow-yellow-100 scale-[1.03]";
      headerColor = "text-yellow-600";
      emoji = "🥇";
    } else if (index === 1) {
      // 2e : Argent
      rankBadge = "bg-gray-400 text-white";
      cardBorder = "border-gray-300 shadow-xl shadow-gray-100";
      headerColor = "text-gray-700";
      emoji = "🥈";
    } else if (index === 2) {
      // 3e : Bronze
      rankBadge = "bg-amber-700 text-white";
      cardBorder = "border-amber-700 shadow-lg shadow-amber-100";
      headerColor = "text-amber-700";
      emoji = "🥉";
    } else if (index === 3 || index === 4) {
      // 4e et 5e : Honneur (e.g. Vert/Teal)
      rankBadge = "bg-teal-600 text-white";
      cardBorder = "border-teal-200 shadow-md";
      headerColor = "text-teal-700";
      emoji = "🌟";
    }
    // Les autres restent avec le style indigo par défaut

    return { rankBadge, cardBorder, headerColor, emoji };
  };

  return (
    <div className="pr-2 pl-2  min-h-screen">
      <h1 className="text-3xl font-extrabold text-center mb-8 text-indigo-800 border-b-2 pb-2 border-indigo-200">
        🏆 Tableau de Bord du Mérite des Étudiants
      </h1>

      {/* SECTION DU CLASSEMENT (Grille Adaptative) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {studentsData.map((student, index) => {
          const { rankBadge, cardBorder, headerColor, emoji } = getRankStyle(index);

          return (
            <div
              key={student.studentId}
              // Suppression des classes de défilement horizontal et utilisation de la grille Tailwind
              className={`bg-white p-5 rounded-xl border-2 transition duration-300 transform hover:scale-[1.02] ${cardBorder}`}
            >
              {/* EN-TÊTE DE LA CARTE */}
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h2 className={`text-xl font-bold ${headerColor}`}>
                  <span className="text-2xl mr-2 font-black">{index + 1}.</span> {student.studentName}
                </h2>
                <span
                  className={`text-lg px-3 py-1 rounded-full font-extrabold ${rankBadge}`}
                  title={`Score total: ${student.score.toFixed(2)}/20`}
                >
                  {emoji} {student.score.toFixed(1)}
                </span>
              </div>

              {/* INFORMATIONS CLÉS */}
              <div className="space-y-2 mb-4 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">ID Étudiant:</span> <span className="font-mono text-gray-900">{student.studentId}</span>
                </p>
                <p>
                  <span className="font-semibold">Classe:</span> <span className="font-semibold text-indigo-500">{student.classGroup}</span>
                </p>
                <p>
                  <span className="font-semibold">Moyenne:</span>{" "}
                  <strong className="text-green-600">
                    {student.averageGrade.toFixed(2)}/20
                  </strong>
                </p>
                <p>
                  <span className="font-semibold">Rapidité moyenne:</span>{" "}
                  <strong className="text-blue-600">
                    {student.averageSpeed.toFixed(1)} h
                  </strong>
                </p>
              </div>

              {/* GRAPHE DÉTAILLÉ DE LA PROGRESSION */}
              <h3 className="text-md font-semibold text-gray-600 mb-2 mt-4 border-t pt-2">Notes par Projet (Max 20)</h3>
              <div className="h-40 w-full">
                {student.projects.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={student.projects} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="projet" 
                        tick={{ fontSize: 8, fill: '#6b7280' }}
                        interval={0} 
                        angle={-45} 
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis 
                        tick={{ fontSize: 10, fill: '#6b7280' }} 
                        domain={[0, 20]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                            border: '1px solid #c7d2fe', 
                            borderRadius: '4px',
                            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
                        }}
                        labelStyle={{ fontWeight: 'bold', color: '#4f46e5' }}
                        formatter={(value: any, name: any, props: any) => [`${value.toFixed(2)}/20`, props.payload.projet]}
                      />
                      <Line
                        type="monotone"
                        dataKey="note"
                        stroke="#4F46E5"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#818CF8", strokeWidth: 1 }}
                        activeDot={{ r: 6, fill: "#4F46E5" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 italic text-center py-10">
                    Aucun projet noté
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Suppression du style 'custom-scrollbar' car nous n'avons plus de défilement horizontal */}
      {/* Le composant utilise maintenant une grille adaptative pour l'affichage. */}
    </div>
  );
};

export default MeritChart;