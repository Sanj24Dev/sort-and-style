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
import { useLocalSearchParams } from 'expo-router';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AddOutfit = () => {
    const [items, setItems] = useState([]);
    const [name, setName] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const [uploading, setUploading] = useState(false);
    const router = useRouter();

    const params = useLocalSearchParams();
    const { id, name: paramName, items: paramItems } = params;

    useEffect(() => {
        if (paramName) {
            setName(paramName);
        }

        if (paramItems && Array.isArray(items)) {
            const selected = items.filter(it => paramItems.includes(it._id));
            setSelectedItems(selected);
        }
    }, [items]);

    let parsedItems = [];
    try {
        parsedItems = paramItems ? JSON.parse(paramItems) : [];
        if (!Array.isArray(parsedItems)) parsedItems = [];
    } catch (err) {
        console.warn('Invalid paramItems:', paramItems);
        parsedItems = [];
    }

    const ITEMS_URL = 'http://10.0.0.104:3000/items';

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                try {
                    const [itemsRes] = await Promise.all([
                        fetch(ITEMS_URL),
                    ]);

                    const itemsData = await itemsRes.json();
                    setItems(itemsData);
                } catch (err) {
                    console.error('Error fetching data:', err);
                }
            };
            fetchData();
        }, []));

    const toggleSelect = (item) => {
        const existing = selectedItems.find(i => i._id === item._id);
        if (existing) {
            // If already selected, remove it
            setSelectedItems(selectedItems.filter(i => i._id !== item._id));
        } else {
            // If not selected, add it with checked: true by default
            setSelectedItems([...selectedItems, { ...item, checked: false }]);
        }
    };


    const handleUpload = async () => {
        if (!name || selectedItems.length === 0) {
            Alert.alert('Missing Information', 'Please fill all fields.');
            return;
        }

        try {
            setUploading(true);

            const originalMap = Object.fromEntries(
                parsedItems.filter(entry => Array.isArray(entry) && entry.length === 2)
            );
            const payload = {
                name,
                items: selectedItems.map(item => {
                    // if the item was in the original, use its checked value
                    const checked = originalMap[item._id] !== undefined
                        ? originalMap[item._id]
                        : item.checked ?? false; // fallback for new items

                    return [item._id, checked];
                }),
            };

            const url = id
                ? `http://10.0.0.104:3000/lists/${id}`
                : `http://10.0.0.104:3000/lists`;

            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok) {
                // Alert.alert('Success', id ? 'List updated!' : 'List created!');
                setName('');
                setSelectedItems([]);
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



    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.topBanner}>
                <Text style={styles.greeting}>Add List</Text>
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

                    <TextInput
                        placeholder="List Name"
                        value={name}
                        onChangeText={setName}
                        style={styles.input}
                    // placeholderTextColor="#666"
                    />


                    {/* Selected Outfit Icons */}
                    {selectedItems.map(item => (
                        <Image
                            key={item._id}
                            source={{ uri: item.imageUrl }}
                            style={styles.selectedIcon}
                        />
                    ))}
                </ScrollView>


                {/* Upload Button */}
                <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={handleUpload}>
                    <Text style={styles.uploadButtonText}>{id ? 'Update Item' : 'Upload Item'}</Text>
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
    input: {
        // borderBottomWidth: 2,
        // borderBottomColor: '#e0e0e0',
        borderWidth: 1,
        borderColor: COLORS.white,
        marginRight: 10,
        fontSize: 14,
        padding: 12,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        width: screenWidth * 0.4,
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
