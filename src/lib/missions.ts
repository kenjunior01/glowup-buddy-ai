// Estrutura inicial para missões surpresa/desafios semanais
export const weeklyMissions = [
  {
    id: "mission-1",
    title: "Complete 3 tarefas diárias",
    description: "Mostre disciplina e conclua pelo menos 3 tarefas do seu plano diário esta semana.",
    reward: "Medalha de Disciplina"
  },
  {
    id: "mission-2",
    title: "Compartilhe seu progresso",
    description: "Compartilhe seu progresso com um amigo ou nas redes sociais.",
    reward: "Medalha Social"
  },
  {
    id: "mission-3",
    title: "Reflexão semanal",
    description: "Adicione uma nota de reflexão sobre sua semana no campo de progresso.",
    reward: "Medalha de Consciência"
  }
];

export function getRandomMission() {
  return weeklyMissions[Math.floor(Math.random() * weeklyMissions.length)];
}
