// Dynamic mission system with variable rewards
export const weeklyMissions = [
  {
    id: "daily-warrior",
    title: "Guerreiro Diário! ⚔️",
    description: "Complete 5 tarefas diferentes em um dia.",
    reward: 200,
    type: "daily",
    difficulty: "medium"
  },
  {
    id: "social-butterfly",
    title: "Borboleta Social! 🦋",
    description: "Converse com 3 amigos diferentes no chat.",
    reward: 150,
    type: "social",
    difficulty: "easy"
  },
  {
    id: "challenge-accepted",
    title: "Desafio Aceito! 🎯",
    description: "Complete um desafio enviado por um amigo.",
    reward: 300,
    type: "challenge",
    difficulty: "medium"
  },
  {
    id: "perfectionist-day",
    title: "Dia Perfeito! ✨",
    description: "Complete 100% das suas tarefas diárias.",
    reward: 250,
    type: "daily",
    difficulty: "hard"
  },
  {
    id: "streak-saver",
    title: "Salvador de Sequência! 🛟",
    description: "Faça login antes da meia-noite para manter sua sequência.",
    reward: 100,
    type: "streak",
    difficulty: "easy"
  },
  {
    id: "mentor",
    title: "Mentor! 👨‍🏫",
    description: "Envie um desafio motivacional para um amigo.",
    reward: 180,
    type: "social", 
    difficulty: "medium"
  },
  {
    id: "explorer",
    title: "Explorador! 🗺️",
    description: "Visite todas as seções do app em um dia.",
    reward: 120,
    type: "exploration",
    difficulty: "easy"
  },
  {
    id: "consistency-king",
    title: "Rei da Consistência! 👑",
    description: "Mantenha pelo menos 80% de completion por 7 dias.",
    reward: 500,
    type: "weekly",
    difficulty: "legendary"
  }
];

export function getRandomMission() {
  return weeklyMissions[Math.floor(Math.random() * weeklyMissions.length)];
}
