import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
    Alert,
    Modal,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/themes';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AddOutfit = () => {
    const [items, setItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [category, setCategory] = useState('');
    const [customCategoryModalVisible, setCustomCategoryModalVisible] = useState(false);
    const [newCategoryInput, setNewCategoryInput] = useState('');
    const [uploading, setUploading] = useState(false);
    const router = useRouter();
    const [categories, setCategories] = useState([]);

    const params = useLocalSearchParams();
    const { id, category: paramCategory, items: paramItems } = params;
    const [userId, setId] = useState('');

    useEffect(() => {
        if (paramCategory) {
            setCategory(paramCategory);
        }

        if (paramItems && Array.isArray(items)) {
            const selected = items.filter(item => paramItems.includes(item._id));
            setSelectedItems(selected);
        }
    }, [items]); // wait for items to be fetched


    const API_URL = 'http://10.0.0.104:3000';

    const fetchItems = async (items_url, outfits_url) => {
        try {
            const [outfitsRes, itemsRes] = await Promise.all([
                fetch(outfits_url),
                fetch(items_url)
            ]);

            const outfitsData = await outfitsRes.json();
            const itemsData = await itemsRes.json();

            const categorySet = new Set();
            outfitsData.forEach(outfit => {
                if (outfit.category) {
                    categorySet.add(outfit.category.toLowerCase());
                }
            });

            // Map to desired format: label (Capitalized), value (lowercase)
            const dynamicCategories = Array.from(categorySet).map(cat => ({
                label: cat.charAt(0).toUpperCase() + cat.slice(1),
                value: cat,
            }));

            setItems(itemsData);
            setCategories(dynamicCategories);

        } catch (err) {
            console.error("From [OutfitScreen]:", 'Failed to fetch outfits/items:', err);
            setLoading(false);
        }
    };

    const getUserInfo = async () => {
        try {
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                console.log("From [AddOutfit]:", "Logged in id: ", user.userId);
                setId(user.userId);
                const ITEMS_API_URL = `${API_URL}/items?userId=${user.userId}`;
                const OUTFITS_API_URL = `${API_URL}/outfits?userId=${user.userId}`;
                // console.log("From [OutfitScreen], url search: ", ITEMS_API_URL);
                await fetchItems(ITEMS_API_URL, OUTFITS_API_URL);
            }
        } catch (e) {
            console.error("From [AddOutfit]:", 'Error reading user:', e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            getUserInfo(); // now getUserInfo will handle fetching items
        }, [])
    );

    const toggleSelect = (item) => {
        const isSelected = selectedItems.find(i => i._id === item._id);
        if (isSelected) {
            setSelectedItems(selectedItems.filter(i => i._id !== item._id));
        } else {
            setSelectedItems([...selectedItems, item]);
        }
    };

    const handleUpload = async () => {
        if (!category || selectedItems.length === 0) {
            Alert.alert('Missing Information', 'Please fill all fields.');
            return;
        }

        try {
            setUploading(true);

            const payload = {
                category,
                items: selectedItems.map(item => item._id),
                userId,
            };

            const url = id
                ? `http://10.0.0.104:3000/outfits/${id}?userId=${userId}`
                : `http://10.0.0.104:3000/outfits/upload`;

            const method = id ? 'PUT' : 'POST';
            console.log(payload);
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok) {
                // Alert.alert('Success', id ? 'Outfit updated!' : 'Outfit created!');
                // Reset state after successful upload
                setSelectedItems([]);
                setCategory('');
                router.replace('/(tabs)/create');
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Upload Failed', error.message);
        } finally {
            setUploading(false);
        }
    };


    const promptNewCategory = () => {
        setNewCategoryInput('');
        setCustomCategoryModalVisible(true);
    };


    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.topBanner}>
                <Text style={styles.greeting}>Add Outfit</Text>
            </View>


            {/* Selected Items Icons */}
            {/* Selected Items Row with Category Dropdown */}
            {/* Category Dropdown + Selected Items */}
            <View style={{ marginTop: screenHeight * 0.15 }}>
                <ScrollView
                    horizontal
                    style={styles.selectedScroll}
                    contentContainerStyle={styles.selectedContainer}
                    showsHorizontalScrollIndicator={false}
                >
                    {/* Category Dropdown Trigger */}
                    <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setDropdownOpen(!dropdownOpen)}
                    >
                        <Text style={styles.dropdownButtonText}>{category || 'Category'}</Text>
                        <Text style={styles.dropdownArrow}>
                            {dropdownOpen ? '▲' : '▼'}
                        </Text>
                    </TouchableOpacity>

                    {/* Selected Outfit Icons */}
                    {selectedItems.map(item => (
                        <Image
                            key={item._id}
                            source={{ uri: item.imageUrl }}
                            style={styles.selectedIcon}
                        />
                    ))}
                </ScrollView>

                {/* Dropdown List */}
                {dropdownOpen && (
                    <View style={styles.dropdownListWrapper}>
                        <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat.value}
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setCategory(cat.label);
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
                                    promptNewCategory();
                                }}
                            >
                                <Text style={styles.dropdownItemText}>➕ Add New</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                )}
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
                                        setCategory(newCat.label);
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


                {/* Upload Button */}
                <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={handleUpload}>
                    <Text style={styles.uploadButtonText}>{id ? 'Update Outfit' : 'Upload Outfit'}</Text>
                </TouchableOpacity>
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



            {/* Items Grid */}
            <ScrollView contentContainerStyle={styles.gridContainer}>
                {items.map(item => (
                    <TouchableOpacity
                        key={item._id}
                        style={[
                            styles.gridItem,
                            selectedItems.some(i => i._id === item._id) && styles.selectedBorder,
                        ]}
                        onPress={() => toggleSelect(item)}
                    >
                        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                        <Text style={styles.itemText} numberOfLines={2}>{item.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

export default AddOutfit;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.secondary,
    },
    topBanner: {
        height: screenHeight * 0.2,
        width: '100%',
        position: 'absolute',
        // top: 40,
        marginTop: SPACING.xl,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        left: SPACING.lg,
        flexDirection: 'row',
        alignItems: 'center',
    },
    greeting: {
        fontSize: FONT_SIZES.xxxl,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    dropdownButton: {
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: 20,
        marginRight: SPACING.md,
        justifyContent: 'space-between',
        width: 140,
        alignItems: 'center',
        flexDirection: 'row',
    },
    dropdownButtonText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.black,
    },
    dropdownListWrapper: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.border,
        borderWidth: 1,
        borderRadius: 10,
        padding: SPACING.sm,
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.sm,
        maxHeight: 200,
        maxWidth: 140,
    },
    dropdownList: {
        maxHeight: 160,
    },
    dropdownItem: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.sm,
    },
    dropdownItemText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.black,
    },
    dropdownArrow: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.black,
        marginLeft: SPACING.sm,
    },
    uploadButton: {
        backgroundColor: COLORS.primary,
        marginHorizontal: SPACING.lg,
        marginVertical: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    uploadButtonText: {
        color: COLORS.white,
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
    },
    selectedScroll: {
        marginTop: SPACING.xl,
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },
    selectedContainer: {
        flexDirection: 'row',
    },
    selectedIcon: {
        width: 50,
        height: 50,
        borderRadius: 10,
        marginRight: SPACING.sm,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
    },
    gridItem: {
        width: (screenWidth - SPACING.lg * 3) / 2,
        marginBottom: SPACING.lg,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: SPACING.sm,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    selectedBorder: {
        borderColor: COLORS.black,
        borderWidth: 5,
    },
    itemImage: {
        width: '100%',
        height: (screenWidth - SPACING.lg * 3) / 2,
        borderRadius: 8,
        marginBottom: SPACING.xs,
    },
    itemText: {
        fontSize: FONT_SIZES.sm,
        fontWeight: '500',
        color: COLORS.black,
        textAlign: 'center',
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
