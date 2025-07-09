import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/themes';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const API_URL = 'http://10.0.0.104:3000';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        const loginURL = `${API_URL}/login`;
        const res = await fetch(loginURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (
            data &&
            typeof data === 'object' &&
            data.name &&
            data.email &&
            data.pfp &&
            data.userId
        ) {
            await AsyncStorage.clear();
            await AsyncStorage.setItem('user', JSON.stringify({
                name: data.name,
                email: data.email,
                pfp: data.pfp,
                userId: data.userId,
            }));
            // setLoggedIn(true);
            // setEmail('');
            // setPassword('');
            console.log("From [LoginScreen]:", "Logging in: ", data.name);
            router.replace('/home');
        }
        else {
            console.error("Login failed");
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.login}>
                <View style={styles.header}>
                    <Text style={styles.appName}>Login</Text>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.captionText}>Good to see you back!</Text>
                        <MaterialIcons name="favorite" size={25} style={{ marginLeft: 5 }} />
                    </View>
                </View>
                <View style={styles.userInput}>
                    <TextInput
                        placeholder="Email"
                        style={styles.emailInput}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <View style={styles.pwdInput}>
                        <TextInput
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(prev => !prev)}>
                            <MaterialIcons
                                name={showPassword ? 'visibility' : 'visibility-off'}
                                size={20}
                                color={COLORS.gray}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                <TouchableOpacity style={styles.loginButton} onPress={() => handleLogin()}>
                    <Text style={styles.loginText}>Login</Text>
                </TouchableOpacity>
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
    login: {
        flex: 1,
        justifyContent: 'center',
        // alignItems: 'center',
        marginTop: 90,
        marginHorizontal: 10,
    },
    header: {
        width: '100%',
        flexDirection: 'column',
    },
    appName: {
        fontSize: 48,
        fontWeight: 800,
        textAlign: 'left',
        paddingTop: 10,
    },
    captionText: {
        fontSize: FONT_SIZES.lg,
        fontWeight: 200,
    },
    userInput: {
        width: '100%',
        marginTop: 50,
    },
    emailInput: {
        paddingHorizontal: 10,
        backgroundColor: COLORS.background,
        borderRadius: 10,
        marginVertical: 5,
    },
    pwdInput: {
        paddingHorizontal: 10,
        backgroundColor: COLORS.background,
        borderRadius: 10,
        marginVertical: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },



    loginButton: {
        marginTop: 40,
        alignSelf: 'center',
        width: '80%',
        backgroundColor: COLORS.primary,
        padding: 10,
        borderRadius: 10,
    },
    loginText: {
        color: COLORS.white,
        textAlign: 'center',
        fontSize: FONT_SIZES.lg,
    },
});
