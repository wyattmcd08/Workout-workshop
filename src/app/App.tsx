import { Suspense, lazy, useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './AppShell'
import { syncSeedExercises } from '@/services/db'

const HomePage = lazy(() => import('@/pages/HomePage'))
const WorkoutPage = lazy(() => import('@/pages/WorkoutPage'))
const ActiveWorkoutPage = lazy(() => import('@/pages/ActiveWorkoutPage'))
const ExerciseLibraryPage = lazy(() => import('@/pages/ExerciseLibraryPage'))
const RecoveryPage = lazy(() => import('@/pages/RecoveryPage'))
const NutritionPage = lazy(() => import('@/pages/NutritionPage'))
const ProgressPage = lazy(() => import('@/pages/ProgressPage'))
const MorePage = lazy(() => import('@/pages/MorePage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))

function RouteFallback() {
  return <div className="min-h-dvh bg-bg" aria-hidden />
}

export default function App() {
  useEffect(() => {
    void syncSeedExercises()
  }, [])

  return (
    <HashRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="workout" element={<WorkoutPage />} />
            <Route path="workout/active" element={<ActiveWorkoutPage />} />
            <Route path="workout/exercises" element={<ExerciseLibraryPage />} />
            <Route path="recovery" element={<RecoveryPage />} />
            <Route path="nutrition" element={<NutritionPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="more" element={<MorePage />} />
            <Route path="more/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  )
}
