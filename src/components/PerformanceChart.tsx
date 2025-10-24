import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    Title, 
    Tooltip, 
    Legend 
} from 'chart.js'; 

// 💡 Importation des types avec 'import type' (résout l'erreur TS1484)
import type { 
    ChartData, 
    ChartOptions, // Ajout de ChartOptions pour typer les options du graphique
    ChartTypeRegistry
} from 'chart.js';

// Enregistrement des composants nécessaires de Chart.js (une seule fois)
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

// --- INTERFACES (Ajout de la moyenne de la classe) ---
interface ProjectGrade {
    title: string;
    grade: number;
    submissionDate: string;
    // On pourrait ajouter d'autres infos ici si l'API les fournissait, comme 'classAverageGrade' pour ce projet spécifique.
}

interface PerformanceChartProps {
    projectsData: ProjectGrade[];
    // Ajout d'une nouvelle prop pour la moyenne de la classe pour plus de réalisme
    classAverage?: number; 
    targetGrade?: number; // Ajout d'une note cible (ex: 12/20 pour la validation)
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ projectsData, classAverage, targetGrade = 10 }) => {

    // --- LOGIQUE ET PRÉPARATION DES DONNÉES (Utilisation de useMemo pour la performance) ---
    const { sortedProjects, chartData, chartOptions } = useMemo(() => {
        // 1. Tri des projets par date de soumission pour une évolution chronologique
        const sortedProjects = [...projectsData].sort((a, b) => 
            new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime()
        );

        if (sortedProjects.length === 0) {
            return { sortedProjects: [], chartData: null, chartOptions: null };
        }

        const projectLabels = sortedProjects.map(p => p.title);
        const projectGrades = sortedProjects.map(p => p.grade);
        const dataPointsCount = projectLabels.length;
        
        // 2. Préparation des données Chart.js
        const data: ChartData<'line'> = {
            labels: projectLabels, // Noms des projets sur l'axe X
            datasets: [
                // DATASET ÉTUDIANT (Couleur Indigo)
                {
                    label: 'Votre Note / 20',
                    data: projectGrades, // Notes sur l'axe Y
                    borderColor: 'rgb(79, 70, 229)', // indigo-600
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    pointBackgroundColor: 'rgb(129, 140, 248)',
                    tension: 0.4, 
                    fill: true, 
                },
            ],
        };

        // Ajout conditionnel de la moyenne de la classe
        if (classAverage !== undefined && classAverage !== null) {
            data.datasets.push({
                label: `Moyenne de la Classe (${classAverage.toFixed(2)}/20)`,
                data: Array(dataPointsCount).fill(classAverage), // Ligne horizontale pour la moyenne
                borderColor: 'rgb(234, 179, 8)', // amber-500
                backgroundColor: 'rgba(234, 179, 8, 0.2)',
                borderDash: [5, 5], // Ligne pointillée
                pointRadius: 0,
                tension: 0,
                fill: false,
            });
        }
        
        // Ajout conditionnel de la note cible
        if (targetGrade !== undefined && targetGrade !== null) {
            data.datasets.push({
                label: `Note Cible (${targetGrade}/20)`,
                data: Array(dataPointsCount).fill(targetGrade), // Ligne horizontale pour l'objectif
                borderColor: 'rgb(220, 38, 38)', // red-600
                backgroundColor: 'rgba(220, 38, 38, 0.2)',
                borderDash: [8, 4], // Ligne tiret-point
                pointRadius: 0,
                tension: 0,
                fill: false,
            });
        }

        // 3. Options du graphique (Type robuste avec ChartOptions<'line'>)
        const options: ChartOptions<'line'> = {
            responsive: true,
            maintainAspectRatio: false, // Permet un contrôle total de la taille
            plugins: {
                legend: {
                    position: 'top' as const,
                },
                title: {
                    display: true,
                    text: 'Évolution des Notes par Projet',
                    font: { size: 16, weight: 'bold' as const },
                    color: '#1f2937' 
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            // On s'assure que c'est le type attendu, bien que context.raw soit générique
                            const rawValue = (context.raw as number).toFixed(2); 
                            return `${context.dataset.label}: ${rawValue} / 20`;
                        },
                        afterLabel: (context) => {
                            // Afficher la date de soumission pour le dataset principal (étudiant)
                            if (context.datasetIndex === 0) { 
                                const project = sortedProjects[context.dataIndex];
                                return `Soumis le: ${new Date(project.submissionDate).toLocaleDateString('fr-FR')}`;
                            }
                            return null;
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 20,
                    title: {
                        display: true,
                        text: 'Note / 20'
                    },
                    ticks: {
                        stepSize: 5
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Projets (ordre chronologique)'
                    }
                }
            }
        };
        
        return { sortedProjects, chartData: data, chartOptions: options };

    }, [projectsData, classAverage, targetGrade]); // useMemo dépendances
    
    // --- RENDU ---
    
    if (sortedProjects.length === 0 || !chartData || !chartOptions) {
        return (
            <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 min-h-[300px] flex items-center justify-center">
                <p className="text-center text-gray-500 font-medium text-lg">
                    📊 Aucune note évaluée disponible pour générer le graphique de performance.
                </p>
            </div>
        );
    }

    return (
        <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-100">
            {/* Définition d'une hauteur fixe pour que le graphique soit beau avec maintainAspectRatio: false */}
            <div style={{ height: '400px', width: '100%' }}> 
                <Line data={chartData} options={chartOptions} />
            </div>
        </div>
    );
};

export default PerformanceChart;