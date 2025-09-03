// Dynamic achievements system with addiction psychology
export const achievements = [
  {
    id: "first-login",
    title: "Primeiro Login! 🎉",
    description: "Bem-vindo ao GlowUp! Sua jornada de transformação começou.",
    icon: "🌟",
    points: 50,
    rarity: "common"
  },
  {
    id: "streak-3",
    title: "Fogo Aceso! 🔥",
    description: "3 dias consecutivos - você está pegando o ritmo!",
    icon: "🔥",
    points: 100,
    rarity: "common"
  },
  {
    id: "streak-7",
    title: "Semana de Fogo! 🔥🔥",
    description: "7 dias seguidos - você é imparável!",
    icon: "🔥",
    points: 300,
    rarity: "uncommon"
  },
  {
    id: "streak-30",
    title: "Mestre da Consistência! 👑",
    description: "30 dias - você é um verdadeiro guerreiro!",
    icon: "👑",
    points: 1000,
    rarity: "rare"
  },
  {
    id: "first-friend",
    title: "Socializado! 🤝",
    description: "Fez seu primeiro amigo na plataforma.",
    icon: "🤝",
    points: 150,
    rarity: "common"
  },
  {
    id: "challenge-master",
    title: "Mestre dos Desafios! ⚔️",
    description: "Completou 10 desafios com amigos.",
    icon: "⚔️",
    points: 500,
    rarity: "uncommon"
  },
  {
    id: "level-10",
    title: "Nível Épico! ⭐",
    description: "Alcançou o nível 10 - você evoluiu muito!",
    icon: "⭐",
    points: 750,
    rarity: "rare"
  },
  {
    id: "plan-creator",
    title: "Planejador Nato! 📋",
    description: "Criou seu primeiro plano personalizado.",
    icon: "📋",
    points: 200,
    rarity: "common"
  },
  {
    id: "perfectionist",
    title: "Perfeccionista! 💎",
    description: "Completou 100% das tarefas por 5 dias seguidos.",
    icon: "💎",
    points: 400,
    rarity: "uncommon"
  },
  {
    id: "influencer",
    title: "Influenciador! 📱",
    description: "Convidou 5 amigos para a plataforma.",
    icon: "📱",
    points: 800,
    rarity: "rare"
  },
  {
    id: "night-owl",
    title: "Coruja Noturna! 🦉",
    description: "Fez check-in depois da meia-noite 3 vezes.",
    icon: "🦉",
    points: 250,
    rarity: "uncommon"
  },
  {
    id: "early-bird",
    title: "Madrugador! 🐦",
    description: "Fez check-in antes das 6h por 7 dias.",
    icon: "🐦",
    points: 350,
    rarity: "uncommon"
  }
];

export function getAchievementById(id: string) {
  return achievements.find(a => a.id === id);
}
