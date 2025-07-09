import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Dimensions, Modal, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/themes';
import * as ImagePicker from 'expo-image-picker';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const API_URL = 'http://10.0.0.104:3000';

export default function RegisterScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [photoUri, setPhotoUri] = useState('');

    const [photoModalVisible, setPhotoModalVisible] = useState(false);

    const handleRegister = async () => {
        const registerURL = `${API_URL}/register`;
        const res = await fetch(registerURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, photoUri, email, password }),
        });
        if (!!res) {
            router.replace('/login');
        }
    };

    const pickImageFromLibrary = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Gallery access is required.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const takePicture = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera access is required.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const choosePhotoOption = () => {
        setPhotoModalVisible(true);
    };

    return (
        <View style={styles.container}>
            <View style={styles.login}>
                <View style={styles.header}>
                    <Text style={styles.appName}>Create Account</Text>
                </View>
                <View style={styles.userInput}>
                    <TouchableOpacity
                        style={styles.uploadBox}
                        onPress={choosePhotoOption}
                        activeOpacity={0.8}
                    >
                        {photoUri ? (
                            <Image source={{ uri: photoUri }} style={styles.previewImage} />
                        ) : (
                            <View style={styles.uploadPlaceholder}>
                                <MaterialIcons name="photo-camera" size={48} color={COLORS.secondary} />
                            </View>
                        )}
                    </TouchableOpacity>
                    <Modal
                        visible={photoModalVisible}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setPhotoModalVisible(false)}
                    >
                        <View style={styles.photoModalOverlay}>
                            <View style={styles.photoModalContainer}>
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity style={styles.optionButton} onPress={() => {
                                        takePicture();
                                        setPhotoModalVisible(false);
                                    }}>
                                        <MaterialIcons name="photo-camera" size={48} color={COLORS.primary} />
                                        {/* <Text style={styles.optionLabel}>Camera</Text> */}
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.optionButton} onPress={() => {
                                        pickImageFromLibrary();
                                        setPhotoModalVisible(false);
                                    }}>
                                        <MaterialIcons name="photo-library" size={48} color={COLORS.primary} />
                                        {/* <Text style={styles.optionLabel}>Gallery</Text> */}
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.optionButton} onPress={() => setPhotoModalVisible(false)}>
                                        <MaterialIcons name="cancel" size={48} color={COLORS.primary} />
                                        {/* <Text style={styles.optionLabel}>Cancel</Text> */}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                    <TextInput
                        placeholder="Name"
                        style={styles.emailInput}
                        value={name}
                        onChangeText={setName}
                        keyboardType="default"
                        autoCapitalize="words"
                    />
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
                <TouchableOpacity style={styles.loginButton} onPress={() => handleRegister()}>
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
        lineHeight: 50,
    },
    captionText: {
        fontSize: FONT_SIZES.lg,
        fontWeight: 200,
    },
    uploadBox: {
        width: screenWidth * 0.40,
        height: screenWidth * 0.40,
        borderRadius: screenWidth * 0.20,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: COLORS.background,
        overflow: 'hidden',
    },
    uploadPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '100%',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    photoModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoModalContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        width: '80%',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
