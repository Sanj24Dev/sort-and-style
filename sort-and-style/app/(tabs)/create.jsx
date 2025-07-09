import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#A35C7A',
  secondary: '#C890A7',
  background: '#F2F3F5',
  white: '#FFFFFF',
  black: '#000000',
  placeholder: '#A35C7A',
  border: '#C890A7',
  shadow: '#000',
  lightGray: '#ddd',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const FONT_SIZES = {
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const App = () => {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>What do you want to create?</Text>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/add_item')}>
          <Text style={styles.buttonText}>Item</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/add_outfit')}>
          <Text style={styles.buttonText}>Outfit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/add_list')}>
          <Text style={styles.buttonText}>List</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Wishlist</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.secondary,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '600',
    marginBottom: SPACING.xxl,
    color: COLORS.white,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  button: {
    width: width * 0.3,
    height: 80,
    margin: 10,
    borderRadius: 12,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  buttonText: {
    color: '#FFF',
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
});
