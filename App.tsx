import React, { useCallback, useMemo } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import DateTimeSheet from '@/components/DateTimeSheet';
import EditTaskModal from '@/components/EditTaskModal';
import EmptyState from '@/components/EmptyState';
import ErrorBoundary from '@/components/ErrorBoundary';
import FilterTabs from '@/components/FilterTabs';
import FocusBar from '@/components/FocusBar';
import Header from '@/components/Header';
import OnboardingFlow from '@/components/OnboardingFlow';
import ProgressCard from '@/components/ProgressCard';
import SettingsSheet from '@/components/SettingsSheet';
import StatsSheet from '@/components/StatsSheet';
import TaskInput from '@/components/TaskInput';
import TaskItem from '@/components/TaskItem';
import UndoSnackbar from '@/components/UndoSnackbar';
import { PALETTES, makeStyles } from '@/constants/theme';
import { useTasks } from '@/hooks/useTasks';
import type { Task } from '@/types/task';

function TuuduuApp() {
  const {
    visibleTasks,
    stats,
    nowTs,
    isLoaded,
    scheme,
    dateLabel,
    activeSort,
    filter,
    query,
    searchOpen,
    selectedCategory,
    inputText,
    editorDraft,
    editingId,
    datePicker,
    undo,
    focus,
    focusRemaining,
    settings,
    showSettings,
    showStats,
    showOnboarding,
    setQuery,
    setEditorDraft,
    setSettings,
    setShowSettings,
    setShowStats,
    setSearchOpen,
    setFilter,
    setSelectedCategory,
    setInputText,
    setDatePicker,
    addTask,
    toggleTask,
    deleteTask,
    undoDelete,
    dismissUndo,
    clearCompleted,
    openEditor,
    openQuickEditor,
    closeEditor,
    saveEditor,
    deleteEditor,
    openDateTime,
    confirmDateTime,
    clearDateTime,
    enableReminders,
    resetData,
    finishOnboarding,
    openOnboarding,
    startFocus,
    toggleFocusPause,
    stopFocus,
    cycleSort,
    toggleScheme,
    closeSearch,
  } = useTasks();

  const theme = PALETTES[scheme];
  const styles = useMemo(() => makeStyles(theme, scheme === 'dark'), [scheme, theme]);

  const confirmClearCompleted = useCallback(() => {
    if (stats.completed === 0) return;
    Alert.alert('Clean done', `Remove ${stats.completed} completed task(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: clearCompleted },
    ]);
  }, [clearCompleted, stats.completed]);

  const confirmResetData = useCallback(() => {
    Alert.alert('Reset Tuuduu', 'Replace all tasks with the starter list?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetData },
    ]);
  }, [resetData]);

  const renderTask = useCallback(
    ({ item, index }: { item: Task; index: number }) => (
      <TaskItem
        task={item}
        index={index}
        nowTs={nowTs}
        styles={styles}
        theme={theme}
        focusActive={focus?.taskId === item.id}
        onToggle={toggleTask}
        onEdit={openEditor}
        onDelete={deleteTask}
        onFocus={startFocus}
      />
    ),
    [deleteTask, focus?.taskId, nowTs, openEditor, startFocus, styles, theme, toggleTask]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Header
          searchOpen={searchOpen}
          query={query}
          dateLabel={dateLabel}
          scheme={scheme}
          completedCount={stats.completed}
          theme={theme}
          styles={styles}
          onQueryChange={setQuery}
          onOpenSearch={() => setSearchOpen(true)}
          onCloseSearch={closeSearch}
          onClearCompleted={confirmClearCompleted}
          onOpenSettings={() => setShowSettings(true)}
          onToggleScheme={toggleScheme}
        />

        <ProgressCard
          completed={stats.completed}
          total={stats.total}
          percent={stats.percent}
          streak={stats.streak}
          dateLabel={dateLabel}
          styles={styles}
          theme={theme}
          onClear={confirmClearCompleted}
          onStats={() => setShowStats(true)}
        />

        <FilterTabs
          filter={filter}
          stats={stats}
          activeSort={activeSort}
          styles={styles}
          theme={theme}
          onFilterChange={setFilter}
          onCycleSort={cycleSort}
        />

        <FlatList
          data={visibleTasks}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={renderTask}
          ListEmptyComponent={
            <EmptyState
              filter={filter}
              query={query}
              styles={styles}
              theme={theme}
              onReset={closeSearch}
            />
          }
        />

        {undo && !focus && (
          <UndoSnackbar
            task={undo.task}
            styles={styles}
            theme={theme}
            onUndo={undoDelete}
            onClose={dismissUndo}
          />
        )}

        {focus && !undo && (
          <FocusBar
            focus={focus}
            remaining={focusRemaining}
            styles={styles}
            theme={theme}
            onPause={toggleFocusPause}
            onStop={stopFocus}
          />
        )}

        <TaskInput
          value={inputText}
          selectedCategory={selectedCategory}
          styles={styles}
          theme={theme}
          onValueChange={setInputText}
          onCategoryChange={setSelectedCategory}
          onAdd={addTask}
          onSchedule={openQuickEditor}
        />

        {editorDraft && (
          <EditTaskModal
            draft={editorDraft}
            setDraft={setEditorDraft}
            onSave={saveEditor}
            onDelete={deleteEditor}
            onPickDateTime={openDateTime}
            onClearDateTime={clearDateTime}
            onClose={closeEditor}
            isNew={!editingId}
            theme={theme}
            styles={styles}
          />
        )}

        {datePicker && (
          <DateTimeSheet
            mode={datePicker.mode}
            value={datePicker.value}
            onConfirm={confirmDateTime}
            onClose={() => setDatePicker(null)}
            theme={theme}
            styles={styles}
            scheme={scheme}
          />
        )}

        {showSettings && (
          <SettingsSheet
            settings={settings}
            setSettings={setSettings}
            onEnableReminders={() => void enableReminders()}
            onOpenOnboarding={openOnboarding}
            onResetData={confirmResetData}
            onClose={() => setShowSettings(false)}
            theme={theme}
            styles={styles}
          />
        )}

        {showStats && (
          <StatsSheet
            tasks={visibleTasks}
              streak={stats.streak}
              nowTs={nowTs}
              onClose={() => setShowStats(false)}
              theme={theme}
            styles={styles}
          />
        )}
      </KeyboardAvoidingView>

      {isLoaded && showOnboarding && <OnboardingFlow theme={theme} onFinish={finishOnboarding} />}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <TuuduuApp />
    </ErrorBoundary>
  );
}
