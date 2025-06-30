import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Image,
    Modal,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';


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


export default function AddItem() {
    const [photoUri, setPhotoUri] = useState(null);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [customCategoryModalVisible, setCustomCategoryModalVisible] = useState(false);
    const [newCategoryInput, setNewCategoryInput] = useState('');
    const [categories, setCategories] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [photoModalVisible, setPhotoModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleUpload = async () => {
        if (!name || !category) {
            Alert.alert('Missing Information', 'Please fill all fields.');
            return;
        }

        try {
            setUploading(true); // 🔴 Show loading spinner

            const formData = new FormData();

            if (photoUri) {
                formData.append('photo', {
                    uri: photoUri,
                    name: 'photo.jpg',
                    type: 'image/jpeg',
                });
            }

            formData.append('name', name);
            formData.append('category', category);

            const response = await fetch('http://10.0.0.104:3000/items/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                // Alert.alert('Success', `Item "${result.item.name}" uploaded successfully!`);
                setPhotoUri(null);
                setName('');
                setCategory('');
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Upload Failed', error.message);
        } finally {
            setUploading(false); // 🟢 Hide spinner
        }
        router.replace('/(tabs)/create');
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



    const promptNewCategory = () => {
        setNewCategoryInput('');
        setCustomCategoryModalVisible(true);
    };

    const router = useRouter();

    const API_URL = 'http://10.0.0.104:3000/items';
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    useFocusEffect(
        useCallback(() => {
            setLoading(true);

            fetch(API_URL)
                .then(res => res.json())
                .then(data => {
                    // console.log('Fetched from backend:', data);
                    setResults(data);
                    setLoading(false);

                    // Create dynamic categories based on fetched items where each item has a category
                    const categorySet = new Set();
                    data.forEach(outfit => {
                        if (outfit.category) {
                            categorySet.add(outfit.category.toLowerCase());
                        }
                    });

                    // Map to desired format: label (Capitalized), value (lowercase)
                    const dynamicCategories = Array.from(categorySet).map(cat => ({
                        label: cat.charAt(0).toUpperCase() + cat.slice(1),
                        value: cat,
                    }));
                    setCategories(dynamicCategories);
                })
                .catch(err => {
                    console.error('Failed to fetch items:', err);
                    setLoading(false);
                });
        }, [])
    );

    return (
        <View style={styles.container}>
            <View style={styles.formContainer}>
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
                            <Text style={styles.uploadText}>Tap to add photo</Text>
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
                    placeholder="Item Name"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                // placeholderTextColor="#666"
                />

                <View style={styles.dropdownWrapper}>
                    <TouchableOpacity
                        onPress={() => setDropdownOpen(!dropdownOpen)}
                        style={styles.dropdown}
                    >
                        <Text style={styles.dropdownText}>
                            {category ? categories.find(c => c.value === category)?.label : 'Select Category'}
                        </Text>
                        <Text style={styles.dropdownArrow}>
                            {dropdownOpen ? '▲' : '▼'}
                        </Text>
                    </TouchableOpacity>

                    {dropdownOpen && (
                        <View style={styles.dropdownListWrapper}>
                            <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.value}
                                        style={styles.dropdownItem}
                                        onPress={() => {
                                            setCategory(cat.value);
                                            setDropdownOpen(false);
                                        }}
                                    >
                                        <Text style={styles.dropdownItemText}>{cat.label}</Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setDropdownOpen(false);
                                        promptNewCategory(); // call your modal
                                    }}
                                >
                                    <Text style={[styles.dropdownItemText]}>
                                        ➕ Add New Category...
                                    </Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    )}
                </View>


                <Modal
                    visible={customCategoryModalVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setCustomCategoryModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalTitle}>New Category</Text>
                            <TextInput
                                placeholder="Enter category name"
                                style={styles.textInput}
                                value={newCategoryInput}
                                onChangeText={setNewCategoryInput}
                            />
                            <TouchableOpacity
                                onPress={() => {
                                    const trimmedLabel = newCategoryInput.trim();
                                    const newValue = trimmedLabel.toLowerCase().replace(/\s+/g, '_');

                                    // Check if category already exists
                                    const alreadyExists = categories.some(
                                        (cat) => cat.value === newValue
                                    );

                                    if (!alreadyExists && trimmedLabel !== '') {
                                        const newCat = {
                                            label: trimmedLabel,
                                            value: newValue,
                                        };
                                        setCategories([...categories, newCat]);
                                        setCategory(newCat.value);
                                    }

                                    setCustomCategoryModalVisible(false);
                                }}
                                style={styles.saveButton}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>


                            <TouchableOpacity
                                onPress={() => setCustomCategoryModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>


                <View style={styles.buttonContainer}>
                    <TouchableOpacity onPress={handleUpload} style={[styles.button, styles.uploadButton]}>
                        <Text style={styles.buttonText}>Upload Item</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setPhotoUri(null); router.replace('/(tabs)/create') }} style={[styles.button, styles.cancelButton]}>
                        <Text style={styles.buttonText}>
                            Cancel
                        </Text>
                    </TouchableOpacity>
                </View>
                {uploading && (
                    <Modal
                        transparent
                        animationType="fade"
                        visible={uploading}
                        onRequestClose={() => { }}
                    >
                        <View style={styles.uploadOverlay}>
                            <View style={styles.uploadingBox}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={styles.uploadingText}>Uploading...</Text>
                            </View>
                        </View>
                    </Modal>
                )}

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingTop: 100,
        flex: 1,
        backgroundColor: COLORS.secondary,
    },
    formContainer: {
        flex: 1,
        padding: 20,
    },
    uploadBox: {
        width: '100%',
        height: 250,
        borderRadius: 12,
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

    uploadText: {
        fontSize: 16,
        color: COLORS.secondary,
        fontWeight: '500',
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
    optionButton: {
        alignItems: 'center',
        flex: 1,
    },
    optionIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    optionLabel: {
        fontSize: 14,
        color: '#333',
    },


    input: {
        // borderBottomWidth: 2,
        // borderBottomColor: '#e0e0e0',
        borderWidth: 1,
        borderColor: COLORS.white,
        marginBottom: 20,
        fontSize: 16,
        padding: 12,
        backgroundColor: COLORS.white,
        borderRadius: 8,
    },


    dropdownWrapper: {
        marginVertical: 10,
    },
    dropdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 14,
        backgroundColor: '#fff',
    },
    dropdownText: {
        fontSize: 16,
        color: '#333',
    },
    dropdownArrow: {
        fontSize: 16,
        color: '#888',
    },
    dropdownListWrapper: {
        maxHeight: 180, // to make it scrollable
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginTop: 4,
        backgroundColor: '#fff',
        zIndex: 1000,
    },
    dropdownList: {
        paddingHorizontal: 0,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#333',
    },



    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    button: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#6c757d',
    },
    uploadButton: {
        backgroundColor: COLORS.primary,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 15,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        padding: 10,
        fontSize: 16,
        marginBottom: 20,
    },
    saveButton: {
        backgroundColor: COLORS.black,
        paddingVertical: 12,
        borderRadius: 10,
        marginBottom: 10,
    },
    saveButtonText: {
        color: COLORS.white,
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 16,
    },
    closeButton: {
        paddingVertical: 10,
        borderRadius: 10,
    },
    closeButtonText: {
        color: '#666',
        textAlign: 'center',
        fontSize: 16,
    },



    uploadOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadingBox: {
        backgroundColor: 'white',
        padding: 30,
        borderRadius: 12,
        alignItems: 'center',
    },
    uploadingText: {
        marginTop: 12,
        fontSize: 16,
        color: COLORS.primary,
    },

});
