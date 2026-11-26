import React from 'react';

import Header from '../src/components/Header';
import EditTaskModal from '../src/components/EditTaskModal';
import OnboardingFlow from '../src/components/OnboardingFlow';
import { PALETTES, makeStyles } from '../src/constants/theme';
import { normalizeTask } from '../src/utils/taskUtils';

const mockIonicons = jest.fn(() => null);

jest.mock('react', () => ({
  createElement: jest.fn((type, props, ...children) => ({ type, props: { ...props, children } })),
  memo: (component) => component,
  useCallback: (callback) => callback,
  useEffect: () => {},
  useMemo: (factory) => factory(),
  useRef: (initial) => ({ current: initial }),
  useState: (initial) => [
    typeof initial === 'function' ? initial() : initial,
    jest.fn(),
  ],
}));

jest.mock('react/jsx-runtime', () => ({
  Fragment: Symbol('Fragment'),
  jsx: jest.fn((type, props) => ({ type, props })),
  jsxs: jest.fn((type, props) => ({ type, props })),
}));

jest.mock('react/jsx-dev-runtime', () => ({
  Fragment: Symbol('Fragment'),
  jsxDEV: jest.fn((type, props) => ({ type, props })),
}));

jest.mock('react-native', () => ({
  Animated: {
    View: () => null,
    Value: jest.fn(() => ({ setValue: jest.fn(), stop: jest.fn() })),
    loop: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
    sequence: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
    timing: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
  },
  Easing: {
    inOut: () => (value) => value,
    out: () => (value) => value,
    quad: (value) => value,
    cubic: (value) => value,
    back: () => (value) => value,
  },
  Modal: () => null,
  Platform: { OS: 'android' },
  Pressable: () => null,
  ScrollView: () => null,
  StyleSheet: { create: (styles) => styles },
  Text: () => null,
  TextInput: () => null,
  TouchableOpacity: () => null,
  View: () => null,
  useColorScheme: () => 'light',
  useWindowDimensions: () => global.__responsiveDimensions,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: () => null,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (props) => mockIonicons(props),
}));

jest.mock('../src/components/Sheet', () => ({
  __esModule: true,
  default: ({ children }) => children(() => {}),
}));

jest.mock('../src/components/SettingsControls', () => ({
  OptionSelector: () => null,
  ToggleButton: () => null,
}));

const { ScrollView, Text, TextInput, TouchableOpacity, Animated } = jest.requireMock('react-native');
const { Ionicons } = jest.requireMock('@expo/vector-icons');
const SheetMock = jest.requireMock('../src/components/Sheet').default;

const walk = (node, visit) => {
  if (!node || typeof node !== 'object') return;
  visit(node);
  if (node.type === SheetMock && typeof node.props?.children === 'function') {
    walk(node.props.children(jest.fn()), visit);
    return;
  }
  const children = node.props?.children;
  if (Array.isArray(children)) {
    children.forEach((child) => walk(child, visit));
  } else {
    walk(children, visit);
  }
};

const collectNodes = (node, targetType) => {
  const found = [];
  walk(node, (candidate) => {
    if (candidate.type === targetType) found.push(candidate);
  });
  return found;
};

const textContent = (value) => {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(textContent).join('');
  if (value && typeof value === 'object') return textContent(value.props?.children);
  return '';
};

const theme = PALETTES.light;
const styles = makeStyles(theme, false);

const headerProps = {
  searchOpen: false,
  query: '',
  dateLabel: 'Nov 25',
  scheme: 'light',
  theme,
  styles,
  onQueryChange: jest.fn(),
  onOpenSearch: jest.fn(),
  onCloseSearch: jest.fn(),
  onOpenSettings: jest.fn(),
  onToggleScheme: jest.fn(),
};

const editorProps = {
  draft: normalizeTask({
    id: 'task-1',
    text: 'Task with times',
    startAt: new Date(2026, 10, 25, 9, 0).getTime(),
    dueAt: new Date(2026, 10, 25, 17, 0).getTime(),
  }),
  setDraft: jest.fn(),
  onSave: jest.fn(),
  onDelete: jest.fn(),
  onPickDateTime: jest.fn(),
  onClearDateTime: jest.fn(),
  onClose: jest.fn(),
  isNew: false,
  theme,
  styles,
};

beforeEach(() => {
  jest.clearAllMocks();
  global.__responsiveDimensions = { width: 320, height: 640 };
});

describe('responsive interaction styles', () => {
  test('home header has three roomy actions and no clear-completed icon', () => {
    const tree = Header(headerProps);
    const iconNames = collectNodes(tree, Ionicons).map((node) => node.props.name);
    const buttons = collectNodes(tree, TouchableOpacity);

    expect(iconNames).toEqual(['search-outline', 'settings-outline', 'moon-outline']);
    expect(buttons).toHaveLength(3);
    buttons.forEach((button) => expect(button.props.style).toBe(styles.iconBtn));
    expect(styles.iconBtn.width).toBeGreaterThanOrEqual(44);
    expect(styles.iconBtn.height).toBeGreaterThanOrEqual(44);
    expect(styles.headerActions.gap).toBeGreaterThanOrEqual(6);
  });

  test('task editor exposes an explicit change-time action for each date', () => {
    const tree = EditTaskModal(editorProps);
    const timeButtons = collectNodes(tree, TouchableOpacity).filter((node) =>
      String(node.props.accessibilityLabel || '').startsWith('Change ')
    );
    const changeTimeLabels = collectNodes(tree, Text)
      .map((node) => textContent(node.props.children))
      .filter((value) => value === 'Change time');

    expect(timeButtons.map((node) => node.props.accessibilityLabel)).toEqual([
      'Change start time',
      'Change due time',
    ]);
    expect(changeTimeLabels).toHaveLength(2);
    timeButtons.forEach((button) => {
      expect(button.props.style).toBe(styles.timeLink);
      button.props.onPress();
    });
    expect(editorProps.onPickDateTime).toHaveBeenNthCalledWith(
      1,
      'startAt',
      editorProps.draft.startAt,
      'time'
    );
    expect(editorProps.onPickDateTime).toHaveBeenNthCalledWith(
      2,
      'dueAt',
      editorProps.draft.dueAt,
      'time'
    );
    expect(collectNodes(tree, TextInput).some((node) => node.props.autoFocus)).toBe(false);
  });

  test('welcome screen centers mobile copy and animates without a button', () => {
    global.__responsiveDimensions = { width: 320, height: 640 };
    const tree = OnboardingFlow({ theme, onFinish: jest.fn() });
    const scroll = collectNodes(tree, ScrollView)[0];
    const texts = collectNodes(tree, Text);
    const title = texts.find((node) => textContent(node.props.children) === 'Welcome');
    const body = texts.find((node) =>
      textContent(node.props.children).includes('Tuuduu keeps your tasks')
    );
    const welcomeText = texts.map((node) => textContent(node.props.children)).join(' ');

    expect(scroll.props.contentContainerStyle.paddingHorizontal).toBe(24);
    expect(collectNodes(tree, TouchableOpacity)).toHaveLength(0);
    expect(collectNodes(tree, Animated.View)).toHaveLength(2);
    expect(title.props.style.textAlign).toBe('center');
    expect(title.props.style.fontSize).toBeLessThanOrEqual(32);
    expect(body.props.style.textAlign).toBe('center');
    expect(body.props.style.fontSize).toBeLessThanOrEqual(16);
    expect(welcomeText).toContain('Welcome');
    expect(welcomeText).toContain('Tuuduu keeps your tasks');
    expect(welcomeText).not.toContain('Get started');
  });

  test('shared theme keeps filters, sheets, and sheet controls touch-friendly', () => {
    expect(styles.timeLink.minHeight).toBeGreaterThanOrEqual(48);
    expect(styles.filterRow.flexWrap).toBe('wrap');
    expect(styles.filterTab.minHeight).toBeGreaterThanOrEqual(44);
    expect(styles.quickChip.minHeight).toBeGreaterThanOrEqual(48);
    expect(styles.sheet.maxWidth).toBe(720);
    expect(styles.sheetSafeArea.flexShrink).toBe(1);
    expect(styles.sheetCloseBtn.width).toBeGreaterThanOrEqual(44);
    expect(styles.sheetCloseBtn.height).toBeGreaterThanOrEqual(44);
  });
});
