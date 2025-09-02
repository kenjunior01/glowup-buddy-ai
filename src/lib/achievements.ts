// Estrutura inicial de conquistas e medalhas
export const achievements = [
  {
    id: "first-plan",
    title: "Primeiro Plano Concluído",
    description: "Conclua seu primeiro plano para desbloquear esta medalha.",
    icon: "🥇"
  },
  {
    id: "weekly-mission",
    title: "Missão Semanal Cumprida",
    description: "Complete uma missão semanal surpresa.",
    icon: "🏆"
  },
  {
    id: "streak-7",
    title: "7 Dias Seguidos",
    description: "Mantenha uma sequência de 7 dias ativos no app.",
    icon: "🔥"
  },
  {
    id: "share-progress",
    title: "Compartilhou Progresso",
    description: "Compartilhe seu progresso com um amigo ou nas redes sociais.",
    icon: "📢"
  }
];

export function getAchievementById(id: string) {
  return achievements.find(a => a.id === id);
}
