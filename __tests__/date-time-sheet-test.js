import React from 'react';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';

import DateTimeSheet from '../src/components/DateTimeSheet';
import { PALETTES, makeStyles } from '../src/constants/theme';

const mockDateTimePicker = jest.fn(() => null);

jest.mock('react', () => ({
  createElement: jest.fn((type, props, ...children) => ({ type, props, children })),
  memo: (component) => component,
  useMemo: (factory) => factory(),
  useState: (initial) => {
    const setter = jest.fn();
    const value = typeof initial === 'function' ? initial() : initial;
    if (!global.__dateTimeSheetSetters) global.__dateTimeSheetSetters = [];
    global.__dateTimeSheetSetters.push(setter);
    return [value, setter];
  },
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
  Modal: () => null,
  Platform: { OS: 'android' },
  Pressable: () => null,
  ScrollView: () => null,
  StyleSheet: { create: (styles) => styles },
  Text: () => null,
  TouchableOpacity: () => null,
  View: () => null,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: () => null,
  useSafeAreaInsets: () => global.__dateTimeSheetInsets,
}));

jest.mock('@expo/ui/community/datetime-picker', () => ({
  DateTimePicker: (props) => mockDateTimePicker(props),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('../src/utils/taskUtils', () => ({
  addDays: (timestamp, days) => timestamp + days * 86400000,
}));

const { ScrollView } = jest.requireMock('react-native');

const findProps = (node, targetType) => {
  if (!node || typeof node !== 'object') return null;
  if (node.type === targetType) return node.props;
  const children = node.props?.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findProps(child, targetType);
      if (found) return found;
    }
    return null;
  }
  return findProps(children, targetType);
};

const timestamp = new Date(2026, 10, 25, 9, 30).getTime();
const styles = makeStyles(PALETTES.light, false);

const baseProps = (overrides = {}) => ({
  mode: 'date',
  value: timestamp,
  onConfirm: jest.fn(),
  onClose: jest.fn(),
  theme: PALETTES.light,
  styles,
  scheme: 'light',
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  global.__dateTimeSheetSetters = [];
  global.__dateTimeSheetInsets = { top: 0, right: 0, bottom: 24, left: 0 };
});

describe('date/time sheet', () => {
  test('gives the Android inline picker a finite responsive width', () => {
    const pickerProps = findProps(DateTimeSheet(baseProps()), DateTimePicker);
    expect(pickerProps.style.width).toBe('100%');
    expect(pickerProps.style.maxWidth).toBe(420);
    expect(pickerProps.minimumDate).toBeInstanceOf(Date);
    expect(styles.pickerWrap.width).toBe('100%');
  });

  test('uses roomy, wrapping layout for the quick date options', () => {
    DateTimeSheet(baseProps());

    expect(styles.dateSheetBody.paddingHorizontal).toBeGreaterThanOrEqual(16);
    expect(styles.dateSheetBody.paddingBottom).toBeGreaterThanOrEqual(16);
    expect(styles.quickRow.flexWrap).toBe('wrap');
    expect(styles.quickRow.gap).toBeGreaterThanOrEqual(8);
    expect(styles.quickChip.minHeight).toBeGreaterThanOrEqual(40);
  });

  test('keeps controls above the system navigation area', () => {
    const tree = DateTimeSheet(baseProps());
    const scrollProps = findProps(tree, ScrollView);

    expect(scrollProps.contentContainerStyle[1].paddingBottom).toBeGreaterThanOrEqual(36);
    expect(styles.sheetCloseBtn.height).toBeGreaterThanOrEqual(44);
  });

  test('ignores invalid picker values for both date and time modes', () => {
    const dateTree = DateTimeSheet(baseProps({ mode: 'date', value: Number.NaN }));
    const setDateDraft = global.__dateTimeSheetSetters[0];
    const datePickerProps = findProps(dateTree, DateTimePicker);
    datePickerProps.onValueChange({}, undefined);
    expect(setDateDraft).not.toHaveBeenCalled();

    const validDate = new Date(2026, 10, 26, 9, 30);
    datePickerProps.onValueChange({}, validDate);
    expect(setDateDraft).toHaveBeenCalledWith(validDate);

    const timeTree = DateTimeSheet(baseProps({ mode: 'time' }));
    const setTimeDraft = global.__dateTimeSheetSetters[1];
    const timePickerProps = findProps(timeTree, DateTimePicker);
    timePickerProps.onValueChange({}, null);
    expect(setTimeDraft).not.toHaveBeenCalled();
  });
});
