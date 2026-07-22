import React from 'react';
import { Text as RNText, TextInput as RNTextInput, StyleSheet } from 'react-native';
import { FontFamily } from '@/constants/theme';

// Map a requested fontWeight to the matching bundled Inter font. Custom fonts
// don't synthesise weight on Android, so bold/semibold/medium must each use
// their own font file.
const familyForWeight = (weight?: string | number): string => {
  switch (String(weight)) {
    case '700':
    case '800':
    case '900':
    case 'bold':
      return FontFamily.bold;
    case '600':
      return FontFamily.semiBold;
    case '500':
      return FontFamily.medium;
    default:
      return FontFamily.regular;
  }
};

const patch = (Component: any) => {
  if (!Component || Component.__globalFontPatched) return;
  const original = Component.render;
  if (typeof original !== 'function') return;

  Component.render = function (...args: any[]) {
    const element = original.apply(this, args);
    if (!React.isValidElement(element)) return element;

    const style = (element.props as { style?: unknown }).style;
    const flat = (StyleSheet.flatten(style as never) ?? {}) as {
      fontFamily?: string;
      fontWeight?: string | number;
    };

    // Respect an explicit fontFamily (e.g. a Plus Jakarta display font),
    // otherwise pick the Inter weight matching the style's fontWeight.
    const fontFamily = flat.fontFamily ?? familyForWeight(flat.fontWeight);

    return React.cloneElement(element as React.ReactElement<{ style?: unknown }>, {
      // Base font first, then the component's own style, then clear fontWeight
      // so Android doesn't try to fake-bold a weight-specific font on top.
      style: [{ fontFamily }, style, { fontWeight: undefined }],
    });
  };

  Component.__globalFontPatched = true;
};

/**
 * Force every <Text> and <TextInput> to use the app's bundled Inter font, so
 * the UI looks identical on every device instead of falling back to each
 * phone's system font. Safe to call more than once.
 */
export const applyGlobalFont = () => {
  patch(RNText);
  patch(RNTextInput);
};
