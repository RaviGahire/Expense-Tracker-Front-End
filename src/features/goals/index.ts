export { GoalsPage } from './pages/GoalsPage';
export { useGoals } from './hooks/useGoals';
export { GoalList } from './components/GoalList';
export { GoalCard } from './components/GoalCard';
export { GoalFormModal } from './components/GoalFormModal';
export { AddFundsModal } from './components/AddFundsModal';
export { goalService, getTodayGoalDate } from './services/goalService';

export type {
  SavingsGoal,
  GoalStatus,
  GoalPriority,
  GoalContributionEntry,
  GoalPayload,
  ContributionPayload,
} from './types/goal.types';