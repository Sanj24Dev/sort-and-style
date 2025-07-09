import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/themes';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const logoUrl = 'https://i.imgur.com/TVNYMQB.png';

export default function IndexScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  // AsyncStorage.clear();                                      // look out for this
  const checkLogin = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log("Logged in user: ", user.name);
        router.replace('/home');
      } else {
        setLoading(false); // Only show startup screen if no token
      }
    } catch (e) {
      console.error('Error reading user:', e);
      setLoading(false);
    }
  };

  checkLogin();
  // useEffect(() => {
  //   const checkLogin = async () => {
  //     try {
  //       const userStr = await AsyncStorage.getItem('user');
  //       if (userStr) {
  //         const user = JSON.parse(userStr);
  //         console.log("Logged in user: ", user.name);
  //         router.replace('/home');
  //       } else {
  //         setLoading(false); // Only show startup screen if no token
  //       }
  //     } catch (e) {
  //       console.error('Error reading user:', e);
  //       setLoading(false);
  //     }
  //   };
  //   checkLogin();
  // }, []);

  if (loading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.startup}>
        <View style={styles.header}>
          <Image
            source={{ uri: logoUrl }}
            style={styles.logo}
            onError={() => console.log('Image failed to load', logoUrl)}
          />
          <Text style={styles.appName}>Sort & Style</Text>
          <Text style={styles.caption}>Digital closet to organize your style</Text>
        </View>
        <View style={styles.authOptions}>
          <TouchableOpacity style={styles.registerButton} onPress={() => { router.push('/register'); }}>
            <Text style={styles.registerText}>Let's get started</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.loginButton} onPress={() => { router.push('/login'); }}>
            <Text style={styles.loginText}>I already have an account</Text>
            <MaterialIcons name="arrow-forward" size={20} style={{ marginLeft: 5 }} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  startup: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  logo: {
    width: screenWidth * 0.40,
    height: screenWidth * 0.40,
    borderRadius: screenWidth * 0.20,
    borderColor: COLORS.primary,
    borderWidth: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  appName: {
    fontSize: 48,
    fontWeight: '800',
    textAlign: 'center',
    paddingTop: 10,
  },
  caption: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '200',
    paddingHorizontal: 45,
    textAlign: 'center',
    lineHeight: 30,
  },
  authOptions: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '80%',
    marginTop: 50,
  },
  registerButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 10,
  },
  registerText: {
    color: COLORS.white,
    textAlign: 'center',
    fontSize: FONT_SIZES.lg,
  },
  loginButton: {
    flexDirection: 'row',
    marginTop: 15,
  },
  loginText: {
    fontWeight: '300',
  },
});
